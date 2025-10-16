import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AssetGroup, PlatformAsset, BusinessManager } from '../entities';
import { AssetGroupType, AssetGroupStatus, Platform } from '../enums';
import { MetaSdkService } from './meta-sdk.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';

/**
 * Asset Group Service
 * Manages asset groups for organizing platform assets
 * Supports automated asset group creation and synchronization
 */
@Injectable()
export class AssetGroupService {
  private readonly logger = new Logger(AssetGroupService.name);

  constructor(
    @InjectRepository(AssetGroup)
    private readonly assetGroupRepository: Repository<AssetGroup>,
    @InjectRepository(PlatformAsset)
    private readonly platformAssetRepository: Repository<PlatformAsset>,
    @InjectRepository(BusinessManager)
    private readonly businessManagerRepository: Repository<BusinessManager>,
    private readonly metaSdkService: MetaSdkService,
  ) {}

  /**
   * Create asset group
   */
  async createAssetGroup(
    businessManagerId: string,
    name: string,
    description: string,
    groupType: AssetGroupType,
    userId: string,
    assetIds?: string[],
    syncToPlatform: boolean = false,
  ): Promise<AssetGroup> {
    const businessManager = await this.businessManagerRepository.findOne({
      where: { id: businessManagerId },
    });

    if (!businessManager) {
      throw new BusinessException('Business manager not found');
    }

    // Create asset group
    const assetGroup = this.assetGroupRepository.create({
      platform: businessManager.platform,
      name,
      description,
      groupType,
      status: AssetGroupStatus.ACTIVE,
      businessManagerId,
      createdBy: userId,
      updatedBy: userId,
    });

    await this.assetGroupRepository.save(assetGroup);

    // Add assets to group if provided
    if (assetIds && assetIds.length > 0) {
      await this.addAssetsToGroup(assetGroup.id, assetIds, userId);
    }

    // Sync to platform if requested
    if (syncToPlatform && businessManager.platform === Platform.META) {
      await this.syncGroupToPlatform(assetGroup.id, userId);
    }

    this.logger.log(`Created asset group: ${name}`);

    return assetGroup;
  }

  /**
   * Sync asset group to platform (Meta)
   */
  private async syncGroupToPlatform(
    assetGroupId: string,
    userId: string,
  ): Promise<AssetGroup> {
    const assetGroup = await this.assetGroupRepository.findOne({
      where: { id: assetGroupId },
      relations: ['assets', 'businessManager'],
    });

    if (!assetGroup) {
      throw new BusinessException('Asset group not found');
    }

    if (assetGroup.platform !== Platform.META) {
      throw new BusinessException('Platform sync only supported for Meta');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(
        assetGroup.businessManagerId,
      );

      // Create asset group via Meta API
      const response = await this.metaSdkService.graphApiRequest(
        `${assetGroup.businessManager.platformBusinessId}/asset_groups`,
        'POST',
        {
          name: assetGroup.name,
        },
        token,
      );

      assetGroup.platformAssetGroupId = response.id;
      assetGroup.lastSyncedAt = new Date();
      assetGroup.syncError = null;
      assetGroup.updatedBy = userId;

      await this.assetGroupRepository.save(assetGroup);

      // Add assets to the platform asset group
      if (assetGroup.assets && assetGroup.assets.length > 0) {
        await this.syncAssetsToMetaGroup(assetGroup, token);
      }

      this.logger.log(`Synced asset group to Meta: ${assetGroup.name}`);

      return assetGroup;
    } catch (error) {
      this.logger.error('Error syncing asset group to platform:', error);
      assetGroup.syncError = error.message;
      assetGroup.lastSyncedAt = new Date();
      await this.assetGroupRepository.save(assetGroup);
      
      throw new BusinessException('Failed to sync asset group to platform');
    }
  }

  /**
   * Sync assets to Meta asset group
   */
  private async syncAssetsToMetaGroup(
    assetGroup: AssetGroup,
    token: string,
  ): Promise<void> {
    if (!assetGroup.platformAssetGroupId || !assetGroup.assets) {
      return;
    }

    try {
      for (const asset of assetGroup.assets) {
        // Add asset to group via Meta API
        await this.metaSdkService.graphApiRequest(
          `${assetGroup.platformAssetGroupId}/assets`,
          'POST',
          {
            asset_id: asset.platformAssetId,
            asset_type: this.mapAssetTypeToMeta(asset.assetType),
          },
          token,
        );
      }

      this.logger.log(`Added ${assetGroup.assets.length} assets to Meta asset group`);
    } catch (error) {
      this.logger.error('Error adding assets to Meta group:', error);
      throw error;
    }
  }

  /**
   * Map internal asset type to Meta asset type
   */
  private mapAssetTypeToMeta(assetType: string): string {
    const typeMap: Record<string, string> = {
      'ad_account': 'AD_ACCOUNT',
      'page': 'PAGE',
      'pixel': 'PIXEL',
      'instagram_account': 'INSTAGRAM_ACCOUNT',
      'product_catalog': 'PRODUCT_CATALOG',
      'app': 'APPLICATION',
    };

    return typeMap[assetType] || assetType.toUpperCase();
  }

  /**
   * Add assets to group
   */
  async addAssetsToGroup(
    assetGroupId: string,
    assetIds: string[],
    userId: string,
  ): Promise<AssetGroup> {
    const assetGroup = await this.assetGroupRepository.findOne({
      where: { id: assetGroupId },
      relations: ['assets'],
    });

    if (!assetGroup) {
      throw new BusinessException('Asset group not found');
    }

    const assets = await this.platformAssetRepository.find({
      where: {
        id: In(assetIds),
        businessManagerId: assetGroup.businessManagerId,
      },
    });

    if (assets.length !== assetIds.length) {
      throw new BusinessException('Some assets not found or do not belong to this business manager');
    }

    // Add new assets (avoid duplicates)
    const existingAssetIds = new Set(assetGroup.assets?.map(a => a.id) || []);
    const newAssets = assets.filter(a => !existingAssetIds.has(a.id));

    if (newAssets.length > 0) {
      assetGroup.assets = [...(assetGroup.assets || []), ...newAssets];
      assetGroup.updatedBy = userId;
      await this.assetGroupRepository.save(assetGroup);

      // Sync to platform if group is already synced
      if (assetGroup.platformAssetGroupId && assetGroup.platform === Platform.META) {
        try {
          const token = await this.metaSdkService.getBusinessManagerToken(
            assetGroup.businessManagerId,
          );
          
          for (const asset of newAssets) {
            await this.metaSdkService.graphApiRequest(
              `${assetGroup.platformAssetGroupId}/assets`,
              'POST',
              {
                asset_id: asset.platformAssetId,
                asset_type: this.mapAssetTypeToMeta(asset.assetType),
              },
              token,
            );
          }
        } catch (error) {
          this.logger.error('Error syncing new assets to Meta group:', error);
        }
      }

      this.logger.log(`Added ${newAssets.length} assets to group ${assetGroup.name}`);
    }

    return assetGroup;
  }

  /**
   * Remove assets from group
   */
  async removeAssetsFromGroup(
    assetGroupId: string,
    assetIds: string[],
    userId: string,
  ): Promise<AssetGroup> {
    const assetGroup = await this.assetGroupRepository.findOne({
      where: { id: assetGroupId },
      relations: ['assets'],
    });

    if (!assetGroup) {
      throw new BusinessException('Asset group not found');
    }

    const assetIdsToRemove = new Set(assetIds);
    assetGroup.assets = assetGroup.assets?.filter(a => !assetIdsToRemove.has(a.id)) || [];
    assetGroup.updatedBy = userId;

    await this.assetGroupRepository.save(assetGroup);

    // Sync removal to platform if group is synced
    if (assetGroup.platformAssetGroupId && assetGroup.platform === Platform.META) {
      try {
        const token = await this.metaSdkService.getBusinessManagerToken(
          assetGroup.businessManagerId,
        );

        const assetsToRemove = await this.platformAssetRepository.find({
          where: { id: In(assetIds) },
        });

        for (const asset of assetsToRemove) {
          await this.metaSdkService.graphApiRequest(
            `${assetGroup.platformAssetGroupId}/assets`,
            'DELETE',
            {
              asset_id: asset.platformAssetId,
            },
            token,
          );
        }
      } catch (error) {
        this.logger.error('Error removing assets from Meta group:', error);
      }
    }

    this.logger.log(`Removed ${assetIds.length} assets from group ${assetGroup.name}`);

    return assetGroup;
  }

  /**
   * Get asset group by ID
   */
  async getAssetGroupById(id: string): Promise<AssetGroup> {
    const assetGroup = await this.assetGroupRepository.findOne({
      where: { id },
      relations: ['assets', 'businessManager'],
    });

    if (!assetGroup) {
      throw new BusinessException('Asset group not found');
    }

    return assetGroup;
  }

  /**
   * Get asset groups by business manager
   */
  async getAssetGroupsByBusinessManager(
    businessManagerId: string,
  ): Promise<AssetGroup[]> {
    return this.assetGroupRepository.find({
      where: { businessManagerId },
      relations: ['assets'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update asset group
   */
  async updateAssetGroup(
    id: string,
    name?: string,
    description?: string,
    status?: AssetGroupStatus,
    userId?: string,
  ): Promise<AssetGroup> {
    const assetGroup = await this.getAssetGroupById(id);

    if (name) assetGroup.name = name;
    if (description !== undefined) assetGroup.description = description;
    if (status) assetGroup.status = status;
    if (userId) assetGroup.updatedBy = userId;

    await this.assetGroupRepository.save(assetGroup);

    // Sync changes to platform if synced
    if (assetGroup.platformAssetGroupId && assetGroup.platform === Platform.META) {
      try {
        const token = await this.metaSdkService.getBusinessManagerToken(
          assetGroup.businessManagerId,
        );

        await this.metaSdkService.graphApiRequest(
          assetGroup.platformAssetGroupId,
          'POST',
          {
            name: assetGroup.name,
          },
          token,
        );
      } catch (error) {
        this.logger.error('Error updating Meta asset group:', error);
      }
    }

    this.logger.log(`Updated asset group: ${assetGroup.name}`);

    return assetGroup;
  }

  /**
   * Delete asset group (soft delete)
   */
  async deleteAssetGroup(id: string, userId: string): Promise<void> {
    const assetGroup = await this.getAssetGroupById(id);

    // Delete from platform if synced
    if (assetGroup.platformAssetGroupId && assetGroup.platform === Platform.META) {
      try {
        const token = await this.metaSdkService.getBusinessManagerToken(
          assetGroup.businessManagerId,
        );

        await this.metaSdkService.graphApiRequest(
          assetGroup.platformAssetGroupId,
          'DELETE',
          {},
          token,
        );
      } catch (error) {
        this.logger.error('Error deleting Meta asset group:', error);
      }
    }

    assetGroup.updatedBy = userId;
    await this.assetGroupRepository.softDelete(id);

    this.logger.log(`Deleted asset group: ${assetGroup.name}`);
  }

  /**
   * Discover and sync asset groups from platform
   */
  async discoverPlatformAssetGroups(
    businessManagerId: string,
    userId: string,
  ): Promise<AssetGroup[]> {
    const businessManager = await this.businessManagerRepository.findOne({
      where: { id: businessManagerId },
    });

    if (!businessManager) {
      throw new BusinessException('Business manager not found');
    }

    if (businessManager.platform !== Platform.META) {
      throw new BusinessException('Asset group discovery only supported for Meta');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(businessManagerId);

      const response = await this.metaSdkService.graphApiRequest(
        `${businessManager.platformBusinessId}/asset_groups`,
        'GET',
        {
          fields: 'id,name',
          limit: 100,
        },
        token,
      );

      const groups: AssetGroup[] = [];

      for (const groupData of response.data || []) {
        let group = await this.assetGroupRepository.findOne({
          where: {
            platform: Platform.META,
            platformAssetGroupId: groupData.id,
          },
        });

        if (group) {
          group.name = groupData.name;
          group.lastSyncedAt = new Date();
          group.syncError = null;
          group.updatedBy = userId;
        } else {
          group = this.assetGroupRepository.create({
            platform: Platform.META,
            platformAssetGroupId: groupData.id,
            name: groupData.name,
            groupType: AssetGroupType.STANDARD,
            status: AssetGroupStatus.ACTIVE,
            businessManagerId,
            lastSyncedAt: new Date(),
            createdBy: userId,
            updatedBy: userId,
          });
        }

        await this.assetGroupRepository.save(group);
        groups.push(group);
      }

      this.logger.log(`Discovered ${groups.length} asset groups from Meta`);

      return groups;
    } catch (error) {
      this.logger.error('Error discovering platform asset groups:', error);
      throw new BusinessException('Failed to discover asset groups');
    }
  }
}

