import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialMediaPlatform, PlatformType, PlatformStatus } from '../entities/social-media-platform.entity';
import { SocialMediaAccount, AccountStatus, AccountType } from '../entities/social-media-account.entity';
import { SocialMediaProviderFactory } from './social-media-provider.factory';
import { AccountInfo } from '../interfaces/social-media-provider.interface';

@Injectable()
export class SocialMediaService {
  constructor(
    @InjectRepository(SocialMediaPlatform)
    private readonly platformRepository: Repository<SocialMediaPlatform>,
    @InjectRepository(SocialMediaAccount)
    private readonly accountRepository: Repository<SocialMediaAccount>,
    private readonly providerFactory: SocialMediaProviderFactory,
  ) {}

  // Platform Management
  async createPlatform(platformData: {
    name: string;
    type: PlatformType;
    description?: string;
    logoUrl?: string;
    websiteUrl?: string;
    configuration?: Record<string, any>;
    apiEndpoints?: Record<string, string>;
    supportedFeatures?: string[];
  }): Promise<SocialMediaPlatform> {
    const existingPlatform = await this.platformRepository.findOne({
      where: { type: platformData.type },
    });

    if (existingPlatform) {
      throw new ConflictException(`Platform with type ${platformData.type} already exists`);
    }

    const platform = this.platformRepository.create({
      ...platformData,
      status: PlatformStatus.ACTIVE,
      isActive: true,
    });

    return this.platformRepository.save(platform);
  }

  async getPlatforms(): Promise<SocialMediaPlatform[]> {
    return this.platformRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getPlatform(type: PlatformType): Promise<SocialMediaPlatform> {
    const platform = await this.platformRepository.findOne({
      where: { type, isActive: true },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with type ${type} not found`);
    }

    return platform;
  }

  async updatePlatform(type: PlatformType, updateData: Partial<SocialMediaPlatform>): Promise<SocialMediaPlatform> {
    const platform = await this.getPlatform(type);
    
    Object.assign(platform, updateData);
    return this.platformRepository.save(platform);
  }

  async deletePlatform(type: PlatformType): Promise<boolean> {
    const platform = await this.getPlatform(type);
    platform.isActive = false;
    await this.platformRepository.save(platform);
    return true;
  }

  // Account Management
  async createAccount(accountData: {
    workspaceId: string;
    platformType: PlatformType;
    externalAccountId: string;
    accountName: string;
    displayName?: string;
    profilePictureUrl?: string;
    bio?: string;
    websiteUrl?: string;
    followersCount?: number;
    followingCount?: number;
    accountType?: AccountType;
    metadata?: Record<string, any>;
  }): Promise<SocialMediaAccount> {
    const platform = await this.getPlatform(accountData.platformType);

    const existingAccount = await this.accountRepository.findOne({
      where: {
        workspaceId: accountData.workspaceId,
        platformId: platform.id,
        externalAccountId: accountData.externalAccountId,
      },
    });

    if (existingAccount) {
      throw new ConflictException('Account already exists for this workspace and platform');
    }

    const account = this.accountRepository.create({
      ...accountData,
      platformId: platform.id,
      status: AccountStatus.ACTIVE,
      isActive: true,
    });

    return this.accountRepository.save(account);
  }

  async getWorkspaceAccounts(workspaceId: string): Promise<SocialMediaAccount[]> {
    return this.accountRepository.find({
      where: { workspaceId, isActive: true },
      relations: ['platform'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAccount(accountId: string): Promise<SocialMediaAccount> {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, isActive: true },
      relations: ['platform'],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async updateAccount(accountId: string, updateData: Partial<SocialMediaAccount>): Promise<SocialMediaAccount> {
    const account = await this.getAccount(accountId);
    
    Object.assign(account, updateData);
    return this.accountRepository.save(account);
  }

  async deleteAccount(accountId: string): Promise<boolean> {
    const account = await this.getAccount(accountId);
    account.isActive = false;
    await this.accountRepository.save(account);
    return true;
  }

  async syncAccount(accountId: string, accessToken: string): Promise<SocialMediaAccount> {
    const account = await this.getAccount(accountId);
    const provider = this.providerFactory.getProvider(account.platform.type);

    try {
      const accountInfo = await provider.getAccountInfo(accessToken);
      
      account.accountName = accountInfo.name;
      account.displayName = accountInfo.displayName;
      account.profilePictureUrl = accountInfo.profilePictureUrl;
      account.bio = accountInfo.bio;
      account.websiteUrl = accountInfo.websiteUrl;
      account.followersCount = accountInfo.followersCount;
      account.followingCount = accountInfo.followingCount;
      account.accountType = accountInfo.accountType as AccountType;
      account.metadata = accountInfo.metadata;
      account.lastSyncAt = new Date();

      return this.accountRepository.save(account);
    } catch (error) {
      throw new Error(`Failed to sync account: ${error.message}`);
    }
  }

  async getAccountsByPlatform(workspaceId: string, platformType: PlatformType): Promise<SocialMediaAccount[]> {
    const platform = await this.getPlatform(platformType);
    
    return this.accountRepository.find({
      where: { workspaceId, platformId: platform.id, isActive: true },
      relations: ['platform'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAccountByExternalId(workspaceId: string, platformType: PlatformType, externalAccountId: string): Promise<SocialMediaAccount> {
    const platform = await this.getPlatform(platformType);
    
    const account = await this.accountRepository.findOne({
      where: {
        workspaceId,
        platformId: platform.id,
        externalAccountId,
        isActive: true,
      },
      relations: ['platform'],
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  // Platform-specific operations
  async getSupportedPlatforms(): Promise<PlatformType[]> {
    return this.providerFactory.getSupportedPlatforms();
  }

  async isPlatformSupported(platformType: PlatformType): Promise<boolean> {
    return this.providerFactory.isPlatformSupported(platformType);
  }

  async getPlatformFeatures(platformType: PlatformType): Promise<string[]> {
    const provider = this.providerFactory.getProvider(platformType);
    return provider.getSupportedFeatures();
  }

  async getPlatformApiLimits(platformType: PlatformType): Promise<Record<string, any>> {
    const provider = this.providerFactory.getProvider(platformType);
    return provider.getApiLimits();
  }

  // Bulk operations
  async syncAllWorkspaceAccounts(workspaceId: string): Promise<SocialMediaAccount[]> {
    const accounts = await this.getWorkspaceAccounts(workspaceId);
    const syncedAccounts: SocialMediaAccount[] = [];

    for (const account of accounts) {
      try {
        // Get the latest auth token for this account
        const auth = await this.getLatestAuth(account.id);
        if (auth && auth.accessToken) {
          const syncedAccount = await this.syncAccount(account.id, auth.accessToken);
          syncedAccounts.push(syncedAccount);
        }
      } catch (error) {
        console.error(`Failed to sync account ${account.id}:`, error);
      }
    }

    return syncedAccounts;
  }

  private async getLatestAuth(accountId: string): Promise<any> {
    // This would be implemented to get the latest auth token
    // For now, return null
    return null;
  }
}
