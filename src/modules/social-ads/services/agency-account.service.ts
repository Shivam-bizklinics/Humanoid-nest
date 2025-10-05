import { Injectable, NotFoundException, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgencyAccount, AgencyAccountStatus, AgencyAccountType } from '../entities/agency-account.entity';
import { AgencyAuth, AgencyAuthStatus, AgencyAuthType } from '../entities/agency-auth.entity';
import { SocialMediaPlatform, PlatformType } from '../entities/social-media-platform.entity';
import { SocialMediaAccount } from '../entities/social-media-account.entity';
import { SocialMediaProviderFactory } from './social-media-provider.factory';

@Injectable()
export class AgencyAccountService {
  private readonly logger = new Logger(AgencyAccountService.name);

  constructor(
    @InjectRepository(AgencyAccount)
    private readonly agencyAccountRepository: Repository<AgencyAccount>,
    @InjectRepository(AgencyAuth)
    private readonly agencyAuthRepository: Repository<AgencyAuth>,
    @InjectRepository(SocialMediaPlatform)
    private readonly platformRepository: Repository<SocialMediaPlatform>,
    @InjectRepository(SocialMediaAccount)
    private readonly socialMediaAccountRepository: Repository<SocialMediaAccount>,
    private readonly providerFactory: SocialMediaProviderFactory,
  ) {}

  // ==================== Agency Account Management ====================

  /**
   * Create a new agency account
   */
  async createAgencyAccount(agencyData: {
    userId: string;
    platformType: PlatformType;
    externalAccountId: string;
    accountName: string;
    businessManagerId?: string;
    agencyId?: string;
    accountType?: AgencyAccountType;
    timezone?: string;
    currency?: string;
    capabilities?: string[];
    metadata?: Record<string, any>;
  }): Promise<AgencyAccount> {
    const platform = await this.platformRepository.findOne({
      where: { type: agencyData.platformType, isActive: true },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with type ${agencyData.platformType} not found`);
    }

    const existingAccount = await this.agencyAccountRepository.findOne({
      where: {
        userId: agencyData.userId,
        platformId: platform.id,
        externalAccountId: agencyData.externalAccountId,
      },
    });

    if (existingAccount) {
      throw new ConflictException('Agency account already exists for this user and platform');
    }

    const agencyAccount = this.agencyAccountRepository.create({
      ...agencyData,
      platformId: platform.id,
      status: AgencyAccountStatus.ACTIVE,
      isActive: true,
    });

    return this.agencyAccountRepository.save(agencyAccount);
  }

  /**
   * Get user's agency accounts
   */
  async getUserAgencyAccounts(userId: string): Promise<AgencyAccount[]> {
    return this.agencyAccountRepository.find({
      where: { userId, isActive: true },
      relations: ['platform', 'managedAccounts'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get agency account by ID
   */
  async getAgencyAccount(agencyAccountId: string): Promise<AgencyAccount> {
    const account = await this.agencyAccountRepository.findOne({
      where: { id: agencyAccountId, isActive: true },
      relations: ['platform', 'managedAccounts'],
    });

    if (!account) {
      throw new NotFoundException('Agency account not found');
    }

    return account;
  }

  /**
   * Update agency account
   */
  async updateAgencyAccount(
    agencyAccountId: string,
    updateData: Partial<AgencyAccount>,
  ): Promise<AgencyAccount> {
    const account = await this.getAgencyAccount(agencyAccountId);
    
    Object.assign(account, updateData);
    return this.agencyAccountRepository.save(account);
  }

  /**
   * Delete agency account
   */
  async deleteAgencyAccount(agencyAccountId: string): Promise<boolean> {
    const account = await this.getAgencyAccount(agencyAccountId);
    
    // Check if any social media accounts are still linked
    const linkedAccounts = await this.socialMediaAccountRepository.count({
      where: { agencyAccountId, isActive: true },
    });

    if (linkedAccounts > 0) {
      throw new ConflictException(
        `Cannot delete agency account. ${linkedAccounts} social media accounts are still linked to this agency.`,
      );
    }

    account.isActive = false;
    account.status = AgencyAccountStatus.INACTIVE;
    await this.agencyAccountRepository.save(account);
    return true;
  }

  // ==================== Agency Authentication ====================

  /**
   * Initiate OAuth flow for agency account
   */
  async initiateAgencyAuth(
    agencyAccountId: string,
  ): Promise<{ authUrl: string; state: string }> {
    const account = await this.getAgencyAccount(agencyAccountId);
    const provider = this.providerFactory.getProvider(account.platform.type);

    const state = this.generateState();
    const authUrl = provider.getAuthUrl(state);

    // Store state for validation
    await this.storeAuthState(agencyAccountId, state);

    return { authUrl, state };
  }

  /**
   * Complete OAuth flow for agency account
   */
  async completeAgencyAuth(
    agencyAccountId: string,
    code: string,
    state: string,
  ): Promise<AgencyAuth> {
    const account = await this.getAgencyAccount(agencyAccountId);

    // Validate state
    if (!(await this.validateAuthState(agencyAccountId, state))) {
      throw new UnauthorizedException('Invalid state parameter');
    }

    const provider = this.providerFactory.getProvider(account.platform.type);
    const authResult = await provider.exchangeCodeForToken(code, state);

    if (!authResult.success) {
      throw new UnauthorizedException(`Authentication failed: ${authResult.error}`);
    }

    // Create or update auth record
    const existingAuth = await this.agencyAuthRepository.findOne({
      where: { agencyAccountId, isActive: true },
    });

    if (existingAuth) {
      existingAuth.accessToken = authResult.accessToken;
      existingAuth.refreshToken = authResult.refreshToken;
      existingAuth.expiresAt = authResult.expiresIn
        ? new Date(Date.now() + authResult.expiresIn * 1000)
        : undefined;
      existingAuth.scope = authResult.scope?.join(',');
      existingAuth.status = AgencyAuthStatus.ACTIVE;
      existingAuth.lastUsedAt = new Date();

      return this.agencyAuthRepository.save(existingAuth);
    } else {
      const auth = this.agencyAuthRepository.create({
        agencyAccountId,
        authType: AgencyAuthType.OAUTH2,
        status: AgencyAuthStatus.ACTIVE,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt: authResult.expiresIn
          ? new Date(Date.now() + authResult.expiresIn * 1000)
          : undefined,
        scope: authResult.scope?.join(','),
        lastUsedAt: new Date(),
        isActive: true,
      });

      return this.agencyAuthRepository.save(auth);
    }
  }

  /**
   * Get valid agency access token
   */
  async getValidAgencyAccessToken(agencyAccountId: string): Promise<string> {
    const auth = await this.agencyAuthRepository.findOne({
      where: { agencyAccountId, isActive: true, status: AgencyAuthStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!auth) {
      throw new NotFoundException('No active authentication found for this agency account');
    }

    // Check if token is expired
    if (auth.expiresAt && auth.expiresAt < new Date()) {
      if (auth.refreshToken) {
        try {
          const refreshedAuth = await this.refreshAgencyAuth(auth.id);
          return refreshedAuth.accessToken;
        } catch (error) {
          throw new UnauthorizedException('Token refresh failed');
        }
      } else {
        throw new UnauthorizedException('Token expired and no refresh token available');
      }
    }

    auth.lastUsedAt = new Date();
    await this.agencyAuthRepository.save(auth);

    return auth.accessToken;
  }

  /**
   * Refresh agency access token
   */
  async refreshAgencyAuth(authId: string): Promise<AgencyAuth> {
    const auth = await this.agencyAuthRepository.findOne({
      where: { id: authId, isActive: true },
      relations: ['agencyAccount', 'agencyAccount.platform'],
    });

    if (!auth) {
      throw new NotFoundException('Auth record not found');
    }

    if (!auth.refreshToken) {
      throw new UnauthorizedException('No refresh token available');
    }

    const provider = this.providerFactory.getProvider(auth.agencyAccount.platform.type);
    const authResult = await provider.refreshToken(auth.refreshToken);

    if (!authResult.success) {
      auth.status = AgencyAuthStatus.EXPIRED;
      await this.agencyAuthRepository.save(auth);
      throw new UnauthorizedException(`Token refresh failed: ${authResult.error}`);
    }

    auth.accessToken = authResult.accessToken;
    auth.refreshToken = authResult.refreshToken;
    auth.expiresAt = authResult.expiresIn
      ? new Date(Date.now() + authResult.expiresIn * 1000)
      : undefined;
    auth.status = AgencyAuthStatus.ACTIVE;
    auth.lastUsedAt = new Date();

    return this.agencyAuthRepository.save(auth);
  }

  /**
   * Revoke agency access
   */
  async revokeAgencyAuth(authId: string): Promise<boolean> {
    const auth = await this.agencyAuthRepository.findOne({
      where: { id: authId, isActive: true },
      relations: ['agencyAccount', 'agencyAccount.platform'],
    });

    if (!auth) {
      throw new NotFoundException('Auth record not found');
    }

    const provider = this.providerFactory.getProvider(auth.agencyAccount.platform.type);
    const success = await provider.revokeToken(auth.accessToken);

    if (success) {
      auth.status = AgencyAuthStatus.REVOKED;
      auth.isActive = false;
      await this.agencyAuthRepository.save(auth);
    }

    return success;
  }

  /**
   * Check if agency account is authenticated
   */
  async isAgencyAuthenticated(agencyAccountId: string): Promise<boolean> {
    try {
      await this.getValidAgencyAccessToken(agencyAccountId);
      return true;
    } catch {
      return false;
    }
  }

  // ==================== Agency-Client Relationship ====================

  /**
   * Link a social media account to an agency account
   * This allows the agency to manage ads for this account
   * 
   * IMPORTANT: The social media account must ALREADY be connected (OAuth completed)
   * This method links an existing authenticated account to an agency for management
   */
  async linkAccountToAgency(
    socialMediaAccountId: string,
    agencyAccountId: string,
    userId: string,
  ): Promise<SocialMediaAccount> {
    const socialAccount = await this.socialMediaAccountRepository.findOne({
      where: { id: socialMediaAccountId, isActive: true },
      relations: ['workspace', 'platform'],
    });

    if (!socialAccount) {
      throw new NotFoundException('Social media account not found');
    }

    const agencyAccount = await this.getAgencyAccount(agencyAccountId);

    // Verify agency account belongs to the user
    if (agencyAccount.userId !== userId) {
      throw new UnauthorizedException('You do not own this agency account');
    }

    // Verify platforms match
    if (socialAccount.platformId !== agencyAccount.platformId) {
      throw new ConflictException('Social media account and agency account must be on the same platform');
    }

    // Verify agency is authenticated
    if (!(await this.isAgencyAuthenticated(agencyAccountId))) {
      throw new UnauthorizedException('Agency account is not authenticated');
    }

    // IMPORTANT: Client account should already be authenticated
    // This is required to prove client ownership before agency can manage it
    
    // Verify agency has access to this page in Meta Business Manager
    if (socialAccount.platform.type === PlatformType.META) {
      const hasAccess = await this.verifyAgencyPageAccess(
        agencyAccount,
        socialAccount.externalAccountId,
      );

      if (!hasAccess.verified) {
        throw new ConflictException(
          `Agency does not have access to this page in Meta Business Manager. ${hasAccess.message}`,
        );
      }
    }

    socialAccount.agencyAccountId = agencyAccountId;
    socialAccount.updatedBy = userId;
    
    return this.socialMediaAccountRepository.save(socialAccount);
  }

  /**
   * Unlink a social media account from an agency
   */
  async unlinkAccountFromAgency(
    socialMediaAccountId: string,
    userId: string,
  ): Promise<SocialMediaAccount> {
    const socialAccount = await this.socialMediaAccountRepository.findOne({
      where: { id: socialMediaAccountId, isActive: true },
      relations: ['agencyAccount'],
    });

    if (!socialAccount) {
      throw new NotFoundException('Social media account not found');
    }

    // Verify user owns the agency account
    if (socialAccount.agencyAccount && socialAccount.agencyAccount.userId !== userId) {
      throw new UnauthorizedException('You do not own the agency account linked to this social account');
    }

    socialAccount.agencyAccountId = null;
    return this.socialMediaAccountRepository.save(socialAccount);
  }

  /**
   * Get all social media accounts managed by an agency
   */
  async getAgencyManagedAccounts(agencyAccountId: string): Promise<SocialMediaAccount[]> {
    return this.socialMediaAccountRepository.find({
      where: { agencyAccountId, isActive: true },
      relations: ['workspace', 'platform'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get agency account managing a social media account
   */
  async getAccountAgency(socialMediaAccountId: string): Promise<AgencyAccount | null> {
    const socialAccount = await this.socialMediaAccountRepository.findOne({
      where: { id: socialMediaAccountId, isActive: true },
      relations: ['agencyAccount', 'agencyAccount.platform'],
    });

    if (!socialAccount || !socialAccount.agencyAccount) {
      return null;
    }

    return socialAccount.agencyAccount;
  }

  /**
   * Check if account is managed by an agency
   */
  async isAccountManagedByAgency(socialMediaAccountId: string): Promise<boolean> {
    const account = await this.socialMediaAccountRepository.findOne({
      where: { id: socialMediaAccountId, isActive: true },
    });

    return !!account?.agencyAccountId;
  }

  /**
   * Get the appropriate access token for ad operations
   * Returns agency token if account is managed by agency, otherwise returns account token
   */
  async getAccessTokenForAccount(socialMediaAccountId: string): Promise<{
    accessToken: string;
    isAgencyToken: boolean;
    agencyAccountId?: string;
  }> {
    const account = await this.socialMediaAccountRepository.findOne({
      where: { id: socialMediaAccountId, isActive: true },
      relations: ['agencyAccount'],
    });

    if (!account) {
      throw new NotFoundException('Social media account not found');
    }

    // If account is managed by agency, use agency token
    if (account.agencyAccountId && account.agencyAccount) {
      const agencyToken = await this.getValidAgencyAccessToken(account.agencyAccountId);
      return {
        accessToken: agencyToken,
        isAgencyToken: true,
        agencyAccountId: account.agencyAccountId,
      };
    }

    // Otherwise, we would get the account's own token
    // This would be from SocialMediaAuthService
    throw new NotFoundException('No authentication found for this account');
  }

  // ==================== Sync & Validation ====================

  /**
   * Sync agency account data from platform
   */
  async syncAgencyAccount(agencyAccountId: string): Promise<AgencyAccount> {
    const account = await this.getAgencyAccount(agencyAccountId);
    const accessToken = await this.getValidAgencyAccessToken(agencyAccountId);
    const provider = this.providerFactory.getProvider(account.platform.type);

    try {
      const accountInfo = await provider.getAccountInfo(accessToken);
      
      account.accountName = accountInfo.name;
      account.metadata = accountInfo.metadata;
      account.lastSyncAt = new Date();

      return this.agencyAccountRepository.save(account);
    } catch (error) {
      throw new Error(`Failed to sync agency account: ${error.message}`);
    }
  }

  /**
   * Validate agency has permission to manage a client account
   */
  async validateAgencyPermission(
    agencyAccountId: string,
    socialMediaAccountId: string,
  ): Promise<boolean> {
    const socialAccount = await this.socialMediaAccountRepository.findOne({
      where: { id: socialMediaAccountId, isActive: true },
    });

    if (!socialAccount) {
      return false;
    }

    return socialAccount.agencyAccountId === agencyAccountId;
  }

  // ==================== Verification Methods ====================

  /**
   * Verify agency has access to a page in Meta Business Manager
   */
  private async verifyAgencyPageAccess(
    agencyAccount: AgencyAccount,
    pageId: string,
  ): Promise<{ verified: boolean; message: string }> {
    try {
      // Get agency token
      const agencyToken = await this.getValidAgencyAccessToken(agencyAccount.id);
      
      // Get Meta provider (platform-specific)
      const provider = this.providerFactory.getProvider(PlatformType.META) as any;
      
      // Check if agency has access to this page
      const hasAccess = await provider.hasPageAccess(agencyToken, pageId);

      if (hasAccess) {
        return {
          verified: true,
          message: 'Agency has access to this page in Business Manager',
        };
      } else {
        // Get list of pages the agency can access
        const accessiblePages = await provider.getBusinessManagerPages(
          agencyToken,
          agencyAccount.businessManagerId,
        );

        return {
          verified: false,
          message: `Page not found in Business Manager. Agency has access to ${accessiblePages.length} pages. Please add this page to your Business Manager first.`,
        };
      }
    } catch (error) {
      this.logger.error('Error verifying agency page access:', error);
      return {
        verified: false,
        message: `Unable to verify access: ${error.message}`,
      };
    }
  }

  /**
   * Get all pages accessible by agency's Business Manager
   */
  async getAgencyAccessiblePages(agencyAccountId: string): Promise<any[]> {
    const agencyAccount = await this.getAgencyAccount(agencyAccountId);
    const agencyToken = await this.getValidAgencyAccessToken(agencyAccountId);

    if (agencyAccount.platform.type === PlatformType.META) {
      const provider = this.providerFactory.getProvider(PlatformType.META) as any;
      return provider.getBusinessManagerPages(
        agencyToken,
        agencyAccount.businessManagerId,
      );
    }

    return [];
  }

  /**
   * Get all ad accounts accessible by agency's Business Manager
   */
  async getAgencyAccessibleAdAccounts(agencyAccountId: string): Promise<any[]> {
    const agencyAccount = await this.getAgencyAccount(agencyAccountId);
    const agencyToken = await this.getValidAgencyAccessToken(agencyAccountId);

    if (agencyAccount.platform.type === PlatformType.META) {
      const provider = this.providerFactory.getProvider(PlatformType.META) as any;
      return provider.getBusinessManagerAdAccounts(
        agencyToken,
        agencyAccount.businessManagerId,
      );
    }

    return [];
  }

  // ==================== Utility Methods ====================

  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private async storeAuthState(agencyAccountId: string, state: string): Promise<void> {
    // In production, store in Redis or database with TTL
    console.log(`Storing auth state for agency ${agencyAccountId}: ${state}`);
  }

  private async validateAuthState(agencyAccountId: string, state: string): Promise<boolean> {
    // In production, validate from Redis or database
    return true;
  }

  /**
   * Get agency account by platform and external ID
   */
  async getAgencyAccountByExternalId(
    userId: string,
    platformType: PlatformType,
    externalAccountId: string,
  ): Promise<AgencyAccount> {
    const platform = await this.platformRepository.findOne({
      where: { type: platformType, isActive: true },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with type ${platformType} not found`);
    }

    const account = await this.agencyAccountRepository.findOne({
      where: {
        userId,
        platformId: platform.id,
        externalAccountId,
        isActive: true,
      },
      relations: ['platform'],
    });

    if (!account) {
      throw new NotFoundException('Agency account not found');
    }

    return account;
  }

  /**
   * Get agency accounts by platform
   */
  async getAgencyAccountsByPlatform(
    userId: string,
    platformType: PlatformType,
  ): Promise<AgencyAccount[]> {
    const platform = await this.platformRepository.findOne({
      where: { type: platformType, isActive: true },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with type ${platformType} not found`);
    }

    return this.agencyAccountRepository.find({
      where: { userId, platformId: platform.id, isActive: true },
      relations: ['platform', 'managedAccounts'],
      order: { createdAt: 'DESC' },
    });
  }
}
