import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PlatformAsset, BusinessManager } from '../entities';
import { 
  AssetType, 
  AssetStatus, 
  AssetOwnership,
  AssetPermissionLevel,
  Platform,
} from '../enums';
import { MetaSdkService } from './meta-sdk.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { 
  IMetaAdAccount, 
  IMetaPage, 
  IMetaInstagramAccount, 
  IMetaPixel 
} from '../interfaces';

/**
 * Asset Management Service
 * Manages platform assets using Business Asset Management API
 * Handles asset discovery, claiming, permissions, and synchronization
 */
@Injectable()
export class AssetManagementService {
  private readonly logger = new Logger(AssetManagementService.name);

  constructor(
    @InjectRepository(PlatformAsset)
    private readonly platformAssetRepository: Repository<PlatformAsset>,
    @InjectRepository(BusinessManager)
    private readonly businessManagerRepository: Repository<BusinessManager>,
    private readonly metaSdkService: MetaSdkService,
  ) {}

  /**
   * Discover and sync all assets for a business manager
   */
  async discoverBusinessAssets(
    businessManagerId: string,
    userId: string,
  ): Promise<PlatformAsset[]> {
    const businessManager = await this.businessManagerRepository.findOne({
      where: { id: businessManagerId },
    });

    if (!businessManager) {
      throw new BusinessException('Business manager not found');
    }

    if (businessManager.platform === Platform.META) {
      return this.discoverMetaAssets(businessManager, userId);
    }

    throw new BusinessException(`Asset discovery not supported for ${businessManager.platform}`);
  }

  /**
   * Discover Meta business assets
   */
  private async discoverMetaAssets(
    businessManager: BusinessManager,
    userId: string,
  ): Promise<PlatformAsset[]> {
    const assets: PlatformAsset[] = [];

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(businessManager.id);

      // Discover ad accounts
      const adAccounts = await this.discoverMetaAdAccounts(
        businessManager.platformBusinessId,
        token,
      );
      assets.push(...await this.saveMetaAdAccounts(adAccounts, businessManager.id, userId));

      // Discover pages
      const pages = await this.discoverMetaPages(
        businessManager.platformBusinessId,
        token,
      );
      assets.push(...await this.saveMetaPages(pages, businessManager.id, userId));

      // Discover pixels
      const pixels = await this.discoverMetaPixels(
        businessManager.platformBusinessId,
        token,
      );
      assets.push(...await this.saveMetaPixels(pixels, businessManager.id, userId));

      this.logger.log(`Discovered ${assets.length} assets for business manager ${businessManager.name}`);

      return assets;
    } catch (error) {
      this.logger.error('Error discovering Meta assets:', error);
      throw new BusinessException('Failed to discover assets');
    }
  }

  /**
   * Discover Meta ad accounts
   */
  private async discoverMetaAdAccounts(
    businessId: string,
    token: string,
  ): Promise<IMetaAdAccount[]> {
    try {
      const response = await this.metaSdkService.graphApiRequest(
        `${businessId}/owned_ad_accounts`,
        'GET',
        {
          fields: 'id,account_id,name,account_status,currency,timezone_name,timezone_offset_hours_utc,business,amount_spent,balance,spend_cap,is_personal,disable_reason',
          limit: 100,
        },
        token,
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Error discovering ad accounts:', error);
      return [];
    }
  }

  /**
   * Discover Meta pages
   */
  private async discoverMetaPages(
    businessId: string,
    token: string,
  ): Promise<IMetaPage[]> {
    try {
      const response = await this.metaSdkService.graphApiRequest(
        `${businessId}/owned_pages`,
        'GET',
        {
          fields: 'id,name,category,category_list,link,picture,cover,fan_count,instagram_business_account',
          limit: 100,
        },
        token,
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Error discovering pages:', error);
      return [];
    }
  }

  /**
   * Discover Meta pixels
   */
  private async discoverMetaPixels(
    businessId: string,
    token: string,
  ): Promise<IMetaPixel[]> {
    try {
      const response = await this.metaSdkService.graphApiRequest(
        `${businessId}/owned_pixels`,
        'GET',
        {
          fields: 'id,name,code,is_unavailable,last_fired_time',
          limit: 100,
        },
        token,
      );

      return response.data || [];
    } catch (error) {
      this.logger.error('Error discovering pixels:', error);
      return [];
    }
  }

  /**
   * Save Meta ad accounts to database
   */
  private async saveMetaAdAccounts(
    adAccounts: IMetaAdAccount[],
    businessManagerId: string,
    userId: string,
  ): Promise<PlatformAsset[]> {
    const assets: PlatformAsset[] = [];

    for (const adAccount of adAccounts) {
      let asset = await this.platformAssetRepository.findOne({
        where: {
          platform: Platform.META,
          assetType: AssetType.AD_ACCOUNT,
          platformAssetId: adAccount.id,
        },
      });

      const status = this.mapMetaAdAccountStatus(adAccount.account_status);

      if (asset) {
        // Update existing
        asset.name = adAccount.name;
        asset.status = status;
        asset.platformConfig = {
          accountId: adAccount.account_id,
          currency: adAccount.currency,
          timezone: adAccount.timezone_name,
          spendCap: adAccount.spend_cap,
          businessId: adAccount.business?.id,
          isPersonal: adAccount.is_personal,
          disableReason: adAccount.disable_reason,
        };
        asset.updatedBy = userId;
      } else {
        // Create new
        asset = this.platformAssetRepository.create({
          platform: Platform.META,
          assetType: AssetType.AD_ACCOUNT,
          platformAssetId: adAccount.id,
          name: adAccount.name,
          status,
          ownership: AssetOwnership.OWNED,
          permissionLevel: AssetPermissionLevel.ADMIN,
          businessManagerId,
          platformConfig: {
            accountId: adAccount.account_id,
            currency: adAccount.currency,
            timezone: adAccount.timezone_name,
            spendCap: adAccount.spend_cap,
            businessId: adAccount.business?.id,
            isPersonal: adAccount.is_personal,
            disableReason: adAccount.disable_reason,
          },
          accessGrantedAt: new Date(),
          totalSpend: parseFloat(adAccount.amount_spent || '0'),
          createdBy: userId,
          updatedBy: userId,
        });
      }

      await this.platformAssetRepository.save(asset);
      assets.push(asset);
    }

    return assets;
  }

  /**
   * Save Meta pages to database
   */
  private async saveMetaPages(
    pages: IMetaPage[],
    businessManagerId: string,
    userId: string,
  ): Promise<PlatformAsset[]> {
    const assets: PlatformAsset[] = [];

    for (const page of pages) {
      let asset = await this.platformAssetRepository.findOne({
        where: {
          platform: Platform.META,
          assetType: AssetType.PAGE,
          platformAssetId: page.id,
        },
      });

      if (asset) {
        // Update existing
        asset.name = page.name;
        asset.platformConfig = {
          ...asset.platformConfig,
          pageId: page.id,
          category: page.category,
          categoryList: page.category_list,
          link: page.link,
          pictureUrl: page.picture?.data?.url,
          coverUrl: page.cover?.source,
          fanCount: page.fan_count,
          instagramBusinessAccountId: page.instagram_business_account?.id,
        };
        asset.updatedBy = userId;
      } else {
        // Create new
        asset = this.platformAssetRepository.create({
          platform: Platform.META,
          assetType: AssetType.PAGE,
          platformAssetId: page.id,
          name: page.name,
          status: AssetStatus.ACTIVE,
          ownership: AssetOwnership.OWNED,
          permissionLevel: AssetPermissionLevel.ADMIN,
          businessManagerId,
          platformConfig: {
            pageId: page.id,
            category: page.category,
            categoryList: page.category_list,
            link: page.link,
            pictureUrl: page.picture?.data?.url,
            coverUrl: page.cover?.source,
            fanCount: page.fan_count,
            instagramBusinessAccountId: page.instagram_business_account?.id,
          },
          accessGrantedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        });
      }

      await this.platformAssetRepository.save(asset);
      assets.push(asset);

      // If page has Instagram account, create that as well
      if (page.instagram_business_account?.id) {
        await this.fetchAndSaveInstagramAccount(
          page.instagram_business_account.id,
          businessManagerId,
          userId,
        );
      }
    }

    return assets;
  }

  /**
   * Fetch and save Instagram account
   */
  private async fetchAndSaveInstagramAccount(
    instagramAccountId: string,
    businessManagerId: string,
    userId: string,
  ): Promise<PlatformAsset | null> {
    try {
      const token = await this.metaSdkService.getBusinessManagerToken(businessManagerId);

      const igAccount: IMetaInstagramAccount = await this.metaSdkService.graphApiRequest(
        instagramAccountId,
        'GET',
        {
          fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website',
        },
        token,
      );

      let asset = await this.platformAssetRepository.findOne({
        where: {
          platform: Platform.META,
          assetType: AssetType.INSTAGRAM_ACCOUNT,
          platformAssetId: igAccount.id,
        },
      });

      if (asset) {
        asset.name = igAccount.username;
        asset.platformConfig = {
          ...asset.platformConfig,
          instagramBusinessAccountId: igAccount.id,
          username: igAccount.username,
          profilePictureUrl: igAccount.profile_picture_url,
          followersCount: igAccount.followers_count,
          followsCount: igAccount.follows_count,
          mediaCount: igAccount.media_count,
          biography: igAccount.biography,
          website: igAccount.website,
        };
        asset.updatedBy = userId;
      } else {
        asset = this.platformAssetRepository.create({
          platform: Platform.META,
          assetType: AssetType.INSTAGRAM_ACCOUNT,
          platformAssetId: igAccount.id,
          name: igAccount.username,
          status: AssetStatus.ACTIVE,
          ownership: AssetOwnership.OWNED,
          permissionLevel: AssetPermissionLevel.ADMIN,
          businessManagerId,
          platformConfig: {
            instagramBusinessAccountId: igAccount.id,
            username: igAccount.username,
            profilePictureUrl: igAccount.profile_picture_url,
            followersCount: igAccount.followers_count,
            followsCount: igAccount.follows_count,
            mediaCount: igAccount.media_count,
            biography: igAccount.biography,
            website: igAccount.website,
          },
          accessGrantedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        });
      }

      await this.platformAssetRepository.save(asset);
      return asset;
    } catch (error) {
      this.logger.error(`Error fetching Instagram account ${instagramAccountId}:`, error);
      return null;
    }
  }

  /**
   * Save Meta pixels to database
   */
  private async saveMetaPixels(
    pixels: IMetaPixel[],
    businessManagerId: string,
    userId: string,
  ): Promise<PlatformAsset[]> {
    const assets: PlatformAsset[] = [];

    for (const pixel of pixels) {
      let asset = await this.platformAssetRepository.findOne({
        where: {
          platform: Platform.META,
          assetType: AssetType.PIXEL,
          platformAssetId: pixel.id,
        },
      });

      if (asset) {
        asset.name = pixel.name;
        asset.platformConfig = {
          ...asset.platformConfig,
          code: pixel.code,
          isUnavailable: pixel.is_unavailable,
          lastFiredTime: pixel.last_fired_time,
        };
        asset.updatedBy = userId;
      } else {
        asset = this.platformAssetRepository.create({
          platform: Platform.META,
          assetType: AssetType.PIXEL,
          platformAssetId: pixel.id,
          name: pixel.name,
          status: pixel.is_unavailable ? AssetStatus.INACTIVE : AssetStatus.ACTIVE,
          ownership: AssetOwnership.OWNED,
          permissionLevel: AssetPermissionLevel.ADMIN,
          businessManagerId,
          platformConfig: {
            code: pixel.code,
            isUnavailable: pixel.is_unavailable,
            lastFiredTime: pixel.last_fired_time,
          },
          accessGrantedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        });
      }

      await this.platformAssetRepository.save(asset);
      assets.push(asset);
    }

    return assets;
  }

  /**
   * Map Meta ad account status to our enum
   */
  private mapMetaAdAccountStatus(statusCode: number): AssetStatus {
    // Meta status codes: 1=ACTIVE, 2=DISABLED, 3=UNSETTLED, etc.
    switch (statusCode) {
      case 1:
        return AssetStatus.ACTIVE;
      case 2:
        return AssetStatus.DISABLED;
      case 3:
      case 7:
      case 8:
      case 9:
        return AssetStatus.SUSPENDED;
      case 101:
        return AssetStatus.DELETED;
      default:
        return AssetStatus.INACTIVE;
    }
  }

  /**
   * Get assets by business manager
   */
  async getAssetsByBusinessManager(
    businessManagerId: string,
    assetType?: AssetType,
  ): Promise<PlatformAsset[]> {
    const where: any = { businessManagerId };
    
    if (assetType) {
      where.assetType = assetType;
    }

    return this.platformAssetRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get assets by workspace
   */
  async getAssetsByWorkspace(
    workspaceId: string,
    assetType?: AssetType,
  ): Promise<PlatformAsset[]> {
    const where: any = { workspaceId };
    
    if (assetType) {
      where.assetType = assetType;
    }

    return this.platformAssetRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get asset by ID
   */
  async getAssetById(id: string): Promise<PlatformAsset> {
    const asset = await this.platformAssetRepository.findOne({
      where: { id },
      relations: ['businessManager', 'workspace'],
    });

    if (!asset) {
      throw new BusinessException('Asset not found');
    }

    return asset;
  }

  /**
   * Assign asset to workspace
   */
  async assignAssetToWorkspace(
    assetId: string,
    workspaceId: string,
    userId: string,
  ): Promise<PlatformAsset> {
    const asset = await this.getAssetById(assetId);
    
    asset.workspaceId = workspaceId;
    asset.updatedBy = userId;

    return this.platformAssetRepository.save(asset);
  }

  /**
   * Request access to agency-shared asset
   */
  async requestAssetAccess(
    assetId: string,
    targetBusinessManagerId: string,
    permission: AssetPermissionLevel,
    userId: string,
  ): Promise<void> {
    const asset = await this.getAssetById(assetId);

    if (asset.platform !== Platform.META) {
      throw new BusinessException('Asset access request only supported for Meta');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(
        asset.businessManagerId,
      );

      // Request asset access via Meta API
      await this.metaSdkService.graphApiRequest(
        `${asset.platformAssetId}`,
        'POST',
        {
          business: targetBusinessManagerId,
          permitted_tasks: this.getMetaPermissionTasks(permission),
        },
        token,
      );

      this.logger.log(`Requested access to asset ${asset.name}`);
    } catch (error) {
      this.logger.error('Error requesting asset access:', error);
      throw new BusinessException('Failed to request asset access');
    }
  }

  /**
   * Get Meta permission tasks based on permission level
   */
  private getMetaPermissionTasks(permission: AssetPermissionLevel): string[] {
    const taskMap = {
      [AssetPermissionLevel.ADMIN]: ['MANAGE', 'ADVERTISE', 'ANALYZE'],
      [AssetPermissionLevel.ADVERTISER]: ['ADVERTISE', 'ANALYZE'],
      [AssetPermissionLevel.ANALYST]: ['ANALYZE'],
      [AssetPermissionLevel.CREATIVE]: ['CREATE_CONTENT'],
      [AssetPermissionLevel.VIEWER]: ['VIEW'],
    };

    return taskMap[permission] || ['VIEW'];
  }

  /**
   * Sync asset data from platform
   */
  async syncAsset(assetId: string, userId: string): Promise<PlatformAsset> {
    const asset = await this.getAssetById(assetId);

    try {
      // Re-discover this specific asset
      const businessManager = await this.businessManagerRepository.findOne({
        where: { id: asset.businessManagerId },
      });

      if (!businessManager) {
        throw new BusinessException('Business manager not found');
      }

      const token = await this.metaSdkService.getBusinessManagerToken(businessManager.id);

      // Fetch fresh data based on asset type
      if (asset.assetType === AssetType.AD_ACCOUNT) {
        const data: IMetaAdAccount = await this.metaSdkService.graphApiRequest(
          asset.platformAssetId,
          'GET',
          {
            fields: 'id,account_id,name,account_status,currency,timezone_name,amount_spent,balance,spend_cap',
          },
          token,
        );

        asset.name = data.name;
        asset.status = this.mapMetaAdAccountStatus(data.account_status);
        asset.totalSpend = parseFloat(data.amount_spent || '0');
        asset.platformConfig = {
          ...asset.platformConfig,
          accountId: data.account_id,
          currency: data.currency,
          timezone: data.timezone_name,
          spendCap: data.spend_cap,
        };
      } else if (asset.assetType === AssetType.PAGE) {
        const data: IMetaPage = await this.metaSdkService.graphApiRequest(
          asset.platformAssetId,
          'GET',
          {
            fields: 'id,name,category,fan_count,link',
          },
          token,
        );

        asset.name = data.name;
        asset.platformConfig = {
          ...asset.platformConfig,
          category: data.category,
          fanCount: data.fan_count,
          link: data.link,
        };
      }

      asset.lastSyncedAt = new Date();
      asset.syncError = null;
      asset.updatedBy = userId;

      return this.platformAssetRepository.save(asset);
    } catch (error) {
      asset.syncError = error.message;
      asset.lastSyncedAt = new Date();
      await this.platformAssetRepository.save(asset);
      
      throw error;
    }
  }

  /**
   * Delete asset (soft delete)
   */
  async deleteAsset(assetId: string, userId: string): Promise<void> {
    const asset = await this.getAssetById(assetId);
    
    asset.updatedBy = userId;
    await this.platformAssetRepository.softDelete(assetId);
    
    this.logger.log(`Deleted asset: ${asset.name}`);
  }
}

