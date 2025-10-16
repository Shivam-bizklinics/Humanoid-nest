import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { PlatformAsset, BusinessManager } from '../entities';
import { AssetType, Platform, AssetStatus } from '../enums';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { AssetManagementService } from './asset-management.service';

/**
 * Workspace Integration Service
 * Handles automatic workspace creation from platform assets
 * Each page/brand can be onboarded as a separate workspace for multi-tenancy
 */
@Injectable()
export class WorkspaceIntegrationService {
  private readonly logger = new Logger(WorkspaceIntegrationService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(PlatformAsset)
    private readonly platformAssetRepository: Repository<PlatformAsset>,
    @InjectRepository(BusinessManager)
    private readonly businessManagerRepository: Repository<BusinessManager>,
    private readonly assetManagementService: AssetManagementService,
  ) {}

  /**
   * Onboard page as workspace
   * Creates a workspace from a Meta/social media page
   */
  async onboardPageAsWorkspace(
    pageAssetId: string,
    userId: string,
    options?: {
      description?: string;
      autoLinkAssets?: boolean; // Auto-link ad accounts from same business
    },
  ): Promise<Workspace> {
    const pageAsset = await this.platformAssetRepository.findOne({
      where: {
        id: pageAssetId,
        assetType: AssetType.PAGE,
      },
      relations: ['businessManager'],
    });

    if (!pageAsset) {
      throw new BusinessException('Page asset not found');
    }

    // Check if workspace already exists for this page
    let workspace = await this.workspaceRepository.findOne({
      where: {
        brandName: pageAsset.name,
        ownerId: userId,
      },
    });

    if (workspace) {
      this.logger.log(`Workspace already exists for page: ${pageAsset.name}`);
      return workspace;
    }

    // Create workspace
    workspace = this.workspaceRepository.create({
      name: `${pageAsset.name} Workspace`,
      brandName: pageAsset.name,
      description: options?.description || `Workspace for ${pageAsset.name}`,
      brandWebsite: pageAsset.platformConfig?.link || null,
      brandDescription: pageAsset.description || null,
      brandLogo: pageAsset.platformConfig?.pictureUrl || null,
      ownerId: userId,
      setupStatus: 'completed',
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });

    await this.workspaceRepository.save(workspace);

    // Link page asset to workspace
    pageAsset.workspaceId = workspace.id;
    await this.platformAssetRepository.save(pageAsset);

    // Link business manager to workspace if not already linked
    if (!pageAsset.businessManager.workspaceId) {
      pageAsset.businessManager.workspaceId = workspace.id;
      await this.businessManagerRepository.save(pageAsset.businessManager);
    }

    // Auto-link related assets if requested
    if (options?.autoLinkAssets) {
      await this.autoLinkBusinessAssets(workspace.id, pageAsset.businessManagerId, userId);
    }

    this.logger.log(`Onboarded page as workspace: ${workspace.name}`);

    return workspace;
  }

  /**
   * Auto-link all business assets to workspace
   */
  async autoLinkBusinessAssets(
    workspaceId: string,
    businessManagerId: string,
    userId: string,
  ): Promise<number> {
    // Get all assets from the business manager that aren't linked to a workspace
    const unlinkedAssets = await this.platformAssetRepository.find({
      where: {
        businessManagerId,
        workspaceId: null,
      },
    });

    let linkedCount = 0;

    for (const asset of unlinkedAssets) {
      try {
        await this.assetManagementService.assignAssetToWorkspace(
          asset.id,
          workspaceId,
          userId,
        );
        linkedCount++;
      } catch (error) {
        this.logger.error(`Failed to link asset ${asset.name}:`, error);
      }
    }

    this.logger.log(`Auto-linked ${linkedCount} assets to workspace`);

    return linkedCount;
  }

  /**
   * Batch onboard multiple pages as workspaces
   */
  async batchOnboardPages(
    pageAssetIds: string[],
    userId: string,
    autoLinkAssets: boolean = true,
  ): Promise<Workspace[]> {
    const workspaces: Workspace[] = [];

    for (const pageAssetId of pageAssetIds) {
      try {
        const workspace = await this.onboardPageAsWorkspace(
          pageAssetId,
          userId,
          { autoLinkAssets },
        );
        workspaces.push(workspace);
      } catch (error) {
        this.logger.error(`Failed to onboard page ${pageAssetId}:`, error);
      }
    }

    this.logger.log(`Batch onboarded ${workspaces.length} pages as workspaces`);

    return workspaces;
  }

  /**
   * Link ad account to workspace
   */
  async linkAdAccountToWorkspace(
    adAccountId: string,
    workspaceId: string,
    userId: string,
  ): Promise<PlatformAsset> {
    const adAccount = await this.platformAssetRepository.findOne({
      where: {
        id: adAccountId,
        assetType: AssetType.AD_ACCOUNT,
      },
    });

    if (!adAccount) {
      throw new BusinessException('Ad account not found');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BusinessException('Workspace not found');
    }

    // Link ad account to workspace
    adAccount.workspaceId = workspaceId;
    adAccount.updatedBy = userId;

    await this.platformAssetRepository.save(adAccount);

    this.logger.log(`Linked ad account ${adAccount.name} to workspace ${workspace.name}`);

    return adAccount;
  }

  /**
   * Get workspaces with their associated assets
   */
  async getWorkspaceWithAssets(workspaceId: string): Promise<{
    workspace: Workspace;
    assets: {
      pages: PlatformAsset[];
      adAccounts: PlatformAsset[];
      instagramAccounts: PlatformAsset[];
      pixels: PlatformAsset[];
      other: PlatformAsset[];
    };
  }> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BusinessException('Workspace not found');
    }

    const allAssets = await this.platformAssetRepository.find({
      where: { workspaceId },
    });

    // Group assets by type
    const assets = {
      pages: allAssets.filter(a => a.assetType === AssetType.PAGE),
      adAccounts: allAssets.filter(a => a.assetType === AssetType.AD_ACCOUNT),
      instagramAccounts: allAssets.filter(a => a.assetType === AssetType.INSTAGRAM_ACCOUNT),
      pixels: allAssets.filter(a => a.assetType === AssetType.PIXEL),
      other: allAssets.filter(a => 
        ![AssetType.PAGE, AssetType.AD_ACCOUNT, AssetType.INSTAGRAM_ACCOUNT, AssetType.PIXEL].includes(a.assetType as any)
      ),
    };

    return {
      workspace,
      assets,
    };
  }

  /**
   * Sync workspace brand info from primary page
   */
  async syncWorkspaceBrandInfo(
    workspaceId: string,
    userId: string,
  ): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BusinessException('Workspace not found');
    }

    // Find primary page asset
    const primaryPage = await this.platformAssetRepository.findOne({
      where: {
        workspaceId,
        assetType: AssetType.PAGE,
      },
      order: {
        createdAt: 'ASC', // Use oldest (likely the primary page)
      },
    });

    if (primaryPage) {
      // Sync page asset to get latest data
      await this.assetManagementService.syncAsset(primaryPage.id, userId);

      // Update workspace with page info
      workspace.brandName = primaryPage.name;
      workspace.brandLogo = primaryPage.platformConfig?.pictureUrl || workspace.brandLogo;
      workspace.brandWebsite = primaryPage.platformConfig?.link || workspace.brandWebsite;
      workspace.updatedBy = userId;

      await this.workspaceRepository.save(workspace);

      this.logger.log(`Synced workspace brand info from page: ${primaryPage.name}`);
    }

    return workspace;
  }

  /**
   * Unlink asset from workspace
   */
  async unlinkAssetFromWorkspace(
    assetId: string,
    userId: string,
  ): Promise<PlatformAsset> {
    const asset = await this.platformAssetRepository.findOne({
      where: { id: assetId },
    });

    if (!asset) {
      throw new BusinessException('Asset not found');
    }

    asset.workspaceId = null;
    asset.updatedBy = userId;

    await this.platformAssetRepository.save(asset);

    this.logger.log(`Unlinked asset ${asset.name} from workspace`);

    return asset;
  }

  /**
   * Get workspace assets summary
   */
  async getWorkspaceAssetsSummary(workspaceId: string): Promise<{
    totalAssets: number;
    activeAssets: number;
    assetsByType: Record<string, number>;
    totalSpend: number;
    activeCampaigns: number;
  }> {
    const assets = await this.platformAssetRepository.find({
      where: { workspaceId },
    });

    const assetsByType: Record<string, number> = {};
    let totalSpend = 0;
    let activeCampaigns = 0;

    for (const asset of assets) {
      // Count by type
      assetsByType[asset.assetType] = (assetsByType[asset.assetType] || 0) + 1;

      // Aggregate spend
      if (asset.assetType === AssetType.AD_ACCOUNT) {
        totalSpend += Number(asset.totalSpend || 0);
        activeCampaigns += asset.activeCampaigns || 0;
      }
    }

    return {
      totalAssets: assets.length,
      activeAssets: assets.filter(a => a.status === AssetStatus.ACTIVE).length,
      assetsByType,
      totalSpend,
      activeCampaigns,
    };
  }

  /**
   * Discover and onboard all available pages from business manager
   */
  async discoverAndOnboardPages(
    businessManagerId: string,
    userId: string,
    autoLinkAssets: boolean = true,
  ): Promise<Workspace[]> {
    // First discover all assets
    await this.assetManagementService.discoverBusinessAssets(businessManagerId, userId);

    // Get all pages from the business manager
    const pages = await this.platformAssetRepository.find({
      where: {
        businessManagerId,
        assetType: AssetType.PAGE,
      },
    });

    // Onboard each page as a workspace
    const workspaces: Workspace[] = [];

    for (const page of pages) {
      try {
        const workspace = await this.onboardPageAsWorkspace(
          page.id,
          userId,
          { autoLinkAssets },
        );
        workspaces.push(workspace);
      } catch (error) {
        this.logger.error(`Failed to onboard page ${page.name}:`, error);
      }
    }

    this.logger.log(`Discovered and onboarded ${workspaces.length} pages from business manager`);

    return workspaces;
  }

  /**
   * Get all workspaces for a user with asset counts
   */
  async getUserWorkspacesWithAssets(userId: string): Promise<Array<{
    workspace: Workspace;
    assetCount: number;
    adAccountCount: number;
    pageCount: number;
  }>> {
    const workspaces = await this.workspaceRepository.find({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
    });

    const result = [];

    for (const workspace of workspaces) {
      const assets = await this.platformAssetRepository.find({
        where: { workspaceId: workspace.id },
      });

      result.push({
        workspace,
        assetCount: assets.length,
        adAccountCount: assets.filter(a => a.assetType === AssetType.AD_ACCOUNT).length,
        pageCount: assets.filter(a => a.assetType === AssetType.PAGE).length,
      });
    }

    return result;
  }
}

