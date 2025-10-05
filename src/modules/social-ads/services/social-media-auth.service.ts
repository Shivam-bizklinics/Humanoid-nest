import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialMediaAuth, AuthStatus, AuthType } from '../entities/social-media-auth.entity';
import { SocialMediaAccount } from '../entities/social-media-account.entity';
import { SocialMediaProviderFactory } from './social-media-provider.factory';
import { AuthResult } from '../interfaces/social-media-provider.interface';

@Injectable()
export class SocialMediaAuthService {
  constructor(
    @InjectRepository(SocialMediaAuth)
    private readonly authRepository: Repository<SocialMediaAuth>,
    @InjectRepository(SocialMediaAccount)
    private readonly accountRepository: Repository<SocialMediaAccount>,
    private readonly providerFactory: SocialMediaProviderFactory,
  ) {}

  // Authentication Flow
  async initiateAuth(accountId: string, platformType: string): Promise<{ authUrl: string; state: string }> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: ['platform'],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const provider = this.providerFactory.getProvider(platformType as any);
    const state = this.generateState();
    const authUrl = provider.getAuthUrl(state);

    // Store the state for validation
    await this.storeAuthState(accountId, state);

    return { authUrl, state };
  }

  async completeAuth(accountId: string, code: string, state: string): Promise<SocialMediaAuth> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: ['platform'],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Validate state
    if (!(await this.validateAuthState(accountId, state))) {
      throw new UnauthorizedException('Invalid state parameter');
    }

    const provider = this.providerFactory.getProvider(account.platform.type);
    const authResult = await provider.exchangeCodeForToken(code, state);

    if (!authResult.success) {
      throw new UnauthorizedException(`Authentication failed: ${authResult.error}`);
    }

    // Create or update auth record
    const existingAuth = await this.authRepository.findOne({
      where: { accountId, isActive: true },
    });

    if (existingAuth) {
      existingAuth.accessToken = authResult.accessToken;
      existingAuth.refreshToken = authResult.refreshToken;
      existingAuth.expiresAt = authResult.expiresIn 
        ? new Date(Date.now() + authResult.expiresIn * 1000)
        : undefined;
      existingAuth.scope = authResult.scope?.join(',');
      existingAuth.status = AuthStatus.ACTIVE;
      existingAuth.lastUsedAt = new Date();

      return this.authRepository.save(existingAuth);
    } else {
      const auth = this.authRepository.create({
        accountId,
        authType: AuthType.OAUTH2,
        status: AuthStatus.ACTIVE,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt: authResult.expiresIn 
          ? new Date(Date.now() + authResult.expiresIn * 1000)
          : undefined,
        scope: authResult.scope?.join(','),
        lastUsedAt: new Date(),
        isActive: true,
      });

      return this.authRepository.save(auth);
    }
  }

  async refreshAuth(authId: string): Promise<SocialMediaAuth> {
    const auth = await this.authRepository.findOne({
      where: { id: authId, isActive: true },
      relations: ['account', 'account.platform'],
    });

    if (!auth) {
      throw new NotFoundException('Auth record not found');
    }

    if (!auth.refreshToken) {
      throw new UnauthorizedException('No refresh token available');
    }

    const provider = this.providerFactory.getProvider(auth.account.platform.type);
    const authResult = await provider.refreshToken(auth.refreshToken);

    if (!authResult.success) {
      auth.status = AuthStatus.EXPIRED;
      await this.authRepository.save(auth);
      throw new UnauthorizedException(`Token refresh failed: ${authResult.error}`);
    }

    auth.accessToken = authResult.accessToken;
    auth.refreshToken = authResult.refreshToken;
    auth.expiresAt = authResult.expiresIn 
      ? new Date(Date.now() + authResult.expiresIn * 1000)
      : undefined;
    auth.status = AuthStatus.ACTIVE;
    auth.lastUsedAt = new Date();

    return this.authRepository.save(auth);
  }

  async revokeAuth(authId: string): Promise<boolean> {
    const auth = await this.authRepository.findOne({
      where: { id: authId, isActive: true },
      relations: ['account', 'account.platform'],
    });

    if (!auth) {
      throw new NotFoundException('Auth record not found');
    }

    const provider = this.providerFactory.getProvider(auth.account.platform.type);
    const success = await provider.revokeToken(auth.accessToken);

    if (success) {
      auth.status = AuthStatus.REVOKED;
      auth.isActive = false;
      await this.authRepository.save(auth);
    }

    return success;
  }

  async validateAuth(authId: string): Promise<boolean> {
    const auth = await this.authRepository.findOne({
      where: { id: authId, isActive: true },
      relations: ['account', 'account.platform'],
    });

    if (!auth) {
      return false;
    }

    // Check if token is expired
    if (auth.expiresAt && auth.expiresAt < new Date()) {
      auth.status = AuthStatus.EXPIRED;
      await this.authRepository.save(auth);
      return false;
    }

    const provider = this.providerFactory.getProvider(auth.account.platform.type);
    const isValid = await provider.validateToken(auth.accessToken);

    if (!isValid) {
      auth.status = AuthStatus.INVALID;
      await this.authRepository.save(auth);
    } else {
      auth.lastUsedAt = new Date();
      await this.authRepository.save(auth);
    }

    return isValid;
  }

  // Auth Management
  async getAccountAuths(accountId: string): Promise<SocialMediaAuth[]> {
    return this.authRepository.find({
      where: { accountId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveAuth(accountId: string): Promise<SocialMediaAuth> {
    const auth = await this.authRepository.findOne({
      where: { accountId, isActive: true, status: AuthStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!auth) {
      throw new NotFoundException('No active authentication found for this account');
    }

    return auth;
  }

  async getAuth(authId: string): Promise<SocialMediaAuth> {
    const auth = await this.authRepository.findOne({
      where: { id: authId, isActive: true },
      relations: ['account', 'account.platform'],
    });

    if (!auth) {
      throw new NotFoundException('Auth record not found');
    }

    return auth;
  }

  async updateAuth(authId: string, updateData: Partial<SocialMediaAuth>): Promise<SocialMediaAuth> {
    const auth = await this.getAuth(authId);
    
    Object.assign(auth, updateData);
    return this.authRepository.save(auth);
  }

  async deleteAuth(authId: string): Promise<boolean> {
    const auth = await this.getAuth(authId);
    auth.isActive = false;
    await this.authRepository.save(auth);
    return true;
  }

  // Utility Methods
  async getValidAccessToken(accountId: string): Promise<string> {
    const auth = await this.getActiveAuth(accountId);

    // Check if token is expired
    if (auth.expiresAt && auth.expiresAt < new Date()) {
      if (auth.refreshToken) {
        try {
          const refreshedAuth = await this.refreshAuth(auth.id);
          return refreshedAuth.accessToken;
        } catch (error) {
          throw new UnauthorizedException('Token refresh failed');
        }
      } else {
        throw new UnauthorizedException('Token expired and no refresh token available');
      }
    }

    return auth.accessToken;
  }

  async isAccountAuthenticated(accountId: string): Promise<boolean> {
    try {
      const auth = await this.getActiveAuth(accountId);
      return await this.validateAuth(auth.id);
    } catch {
      return false;
    }
  }

  async getAccountPermissions(accountId: string): Promise<string[]> {
    const auth = await this.getActiveAuth(accountId);
    return auth.permissions || [];
  }

  // Private Methods
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async storeAuthState(accountId: string, state: string): Promise<void> {
    // In a real implementation, you might store this in Redis or a database
    // For now, we'll just log it
    console.log(`Storing auth state for account ${accountId}: ${state}`);
  }

  private async validateAuthState(accountId: string, state: string): Promise<boolean> {
    // In a real implementation, you would validate the state from storage
    // For now, we'll just return true
    return true;
  }
}
