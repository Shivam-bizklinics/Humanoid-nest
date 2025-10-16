import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MetaCampaign, PlatformAsset } from '../entities';
import { 
  MetaCampaignObjective, 
  MetaCampaignStatus,
  MetaBidStrategy,
  Platform,
  AssetType,
} from '../enums';
import { MetaSdkService } from './meta-sdk.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { IMetaCampaign, IMetaAdSet, IMetaAd } from '../interfaces';

/**
 * Marketing API Service
 * Manages advertising campaigns at scale using Marketing API
 * Supports campaign, ad set, and ad creation/management
 * Optimized for high-volume operations with 100K+ users
 */
@Injectable()
export class MarketingApiService {
  private readonly logger = new Logger(MarketingApiService.name);

  constructor(
    @InjectRepository(MetaCampaign)
    private readonly metaCampaignRepository: Repository<MetaCampaign>,
    @InjectRepository(PlatformAsset)
    private readonly platformAssetRepository: Repository<PlatformAsset>,
    private readonly metaSdkService: MetaSdkService,
  ) {}

  /**
   * Create Meta campaign
   */
  async createMetaCampaign(
    adAccountId: string,
    name: string,
    objective: MetaCampaignObjective,
    status: MetaCampaignStatus,
    userId: string,
    options?: {
      dailyBudget?: number;
      lifetimeBudget?: number;
      bidStrategy?: MetaBidStrategy;
      specialAdCategories?: string[];
      startTime?: Date;
      stopTime?: Date;
    },
  ): Promise<MetaCampaign> {
    // Get ad account
    const adAccount = await this.platformAssetRepository.findOne({
      where: {
        id: adAccountId,
        assetType: AssetType.AD_ACCOUNT,
        platform: Platform.META,
      },
      relations: ['businessManager'],
    });

    if (!adAccount) {
      throw new BusinessException('Ad account not found');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(
        adAccount.businessManagerId,
      );

      // Prepare campaign data
      const campaignData: any = {
        name,
        objective,
        status,
      };

      if (options?.dailyBudget) {
        campaignData.daily_budget = Math.round(options.dailyBudget * 100); // Convert to cents
      }

      if (options?.lifetimeBudget) {
        campaignData.lifetime_budget = Math.round(options.lifetimeBudget * 100);
      }

      if (options?.bidStrategy) {
        campaignData.bid_strategy = options.bidStrategy;
      }

      if (options?.specialAdCategories) {
        campaignData.special_ad_categories = options.specialAdCategories;
      }

      if (options?.startTime) {
        campaignData.start_time = options.startTime.toISOString();
      }

      if (options?.stopTime) {
        campaignData.stop_time = options.stopTime.toISOString();
      }

      // Create campaign via Meta API
      const response: IMetaCampaign = await this.metaSdkService.graphApiRequest(
        `${adAccount.platformAssetId}/campaigns`,
        'POST',
        campaignData,
        token,
      );

      // Save campaign to database
      const campaign = this.metaCampaignRepository.create({
        platformCampaignId: response.id,
        name,
        objective,
        status,
        bidStrategy: options?.bidStrategy,
        adAccountId,
        dailyBudget: options?.dailyBudget,
        lifetimeBudget: options?.lifetimeBudget,
        startTime: options?.startTime,
        stopTime: options?.stopTime,
        specialAdCategories: options?.specialAdCategories,
        platformData: {
          accountId: response.account_id,
          campaignId: response.id,
          createdTime: response.created_time,
          updatedTime: response.updated_time,
          buyingType: response.buying_type,
        },
        lastSyncedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      });

      await this.metaCampaignRepository.save(campaign);

      this.logger.log(`Created Meta campaign: ${name} (${response.id})`);

      return campaign;
    } catch (error) {
      this.logger.error('Error creating Meta campaign:', error);
      throw new BusinessException(`Failed to create campaign: ${error.message}`);
    }
  }

  /**
   * Update Meta campaign
   */
  async updateMetaCampaign(
    campaignId: string,
    userId: string,
    updates: {
      name?: string;
      status?: MetaCampaignStatus;
      dailyBudget?: number;
      lifetimeBudget?: number;
      bidStrategy?: MetaBidStrategy;
    },
  ): Promise<MetaCampaign> {
    const campaign = await this.metaCampaignRepository.findOne({
      where: { id: campaignId },
      relations: ['adAccount', 'adAccount.businessManager'],
    });

    if (!campaign) {
      throw new BusinessException('Campaign not found');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(
        campaign.adAccount.businessManagerId,
      );

      // Prepare update data
      const updateData: any = {};

      if (updates.name) {
        updateData.name = updates.name;
        campaign.name = updates.name;
      }

      if (updates.status) {
        updateData.status = updates.status;
        campaign.status = updates.status;
      }

      if (updates.dailyBudget !== undefined) {
        updateData.daily_budget = Math.round(updates.dailyBudget * 100);
        campaign.dailyBudget = updates.dailyBudget;
      }

      if (updates.lifetimeBudget !== undefined) {
        updateData.lifetime_budget = Math.round(updates.lifetimeBudget * 100);
        campaign.lifetimeBudget = updates.lifetimeBudget;
      }

      if (updates.bidStrategy) {
        updateData.bid_strategy = updates.bidStrategy;
        campaign.bidStrategy = updates.bidStrategy;
      }

      // Update campaign via Meta API
      if (Object.keys(updateData).length > 0) {
        await this.metaSdkService.graphApiRequest(
          campaign.platformCampaignId,
          'POST',
          updateData,
          token,
        );
      }

      campaign.lastSyncedAt = new Date();
      campaign.updatedBy = userId;

      await this.metaCampaignRepository.save(campaign);

      this.logger.log(`Updated Meta campaign: ${campaign.name}`);

      return campaign;
    } catch (error) {
      this.logger.error('Error updating Meta campaign:', error);
      throw new BusinessException(`Failed to update campaign: ${error.message}`);
    }
  }

  /**
   * Delete Meta campaign
   */
  async deleteMetaCampaign(
    campaignId: string,
    userId: string,
  ): Promise<void> {
    const campaign = await this.metaCampaignRepository.findOne({
      where: { id: campaignId },
      relations: ['adAccount', 'adAccount.businessManager'],
    });

    if (!campaign) {
      throw new BusinessException('Campaign not found');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(
        campaign.adAccount.businessManagerId,
      );

      // Delete campaign via Meta API
      await this.metaSdkService.graphApiRequest(
        campaign.platformCampaignId,
        'DELETE',
        {},
        token,
      );

      campaign.status = MetaCampaignStatus.DELETED;
      campaign.updatedBy = userId;
      
      await this.metaCampaignRepository.softDelete(campaignId);

      this.logger.log(`Deleted Meta campaign: ${campaign.name}`);
    } catch (error) {
      this.logger.error('Error deleting Meta campaign:', error);
      throw new BusinessException(`Failed to delete campaign: ${error.message}`);
    }
  }

  /**
   * Sync campaign from Meta
   */
  async syncMetaCampaign(
    campaignId: string,
    userId: string,
  ): Promise<MetaCampaign> {
    const campaign = await this.metaCampaignRepository.findOne({
      where: { id: campaignId },
      relations: ['adAccount', 'adAccount.businessManager'],
    });

    if (!campaign) {
      throw new BusinessException('Campaign not found');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(
        campaign.adAccount.businessManagerId,
      );

      // Fetch campaign data from Meta
      const data: IMetaCampaign = await this.metaSdkService.graphApiRequest(
        campaign.platformCampaignId,
        'GET',
        {
          fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,created_time,updated_time,buying_type,special_ad_categories',
        },
        token,
      );

      // Update campaign
      campaign.name = data.name;
      campaign.objective = data.objective as MetaCampaignObjective;
      campaign.status = data.status as MetaCampaignStatus;
      
      if (data.daily_budget) {
        campaign.dailyBudget = parseFloat(data.daily_budget) / 100;
      }
      
      if (data.lifetime_budget) {
        campaign.lifetimeBudget = parseFloat(data.lifetime_budget) / 100;
      }

      campaign.startTime = data.start_time ? new Date(data.start_time) : null;
      campaign.stopTime = data.stop_time ? new Date(data.stop_time) : null;
      campaign.specialAdCategories = data.special_ad_categories;

      campaign.platformData = {
        ...campaign.platformData,
        effectiveStatus: data.effective_status,
        buyingType: data.buying_type,
        updatedTime: data.updated_time,
        issues: data.issues_info,
        recommendations: data.recommendations,
      };

      campaign.lastSyncedAt = new Date();
      campaign.syncError = null;
      campaign.updatedBy = userId;

      await this.metaCampaignRepository.save(campaign);

      this.logger.log(`Synced Meta campaign: ${campaign.name}`);

      return campaign;
    } catch (error) {
      this.logger.error('Error syncing Meta campaign:', error);
      campaign.syncError = error.message;
      campaign.lastSyncedAt = new Date();
      await this.metaCampaignRepository.save(campaign);
      
      throw new BusinessException(`Failed to sync campaign: ${error.message}`);
    }
  }

  /**
   * Sync all campaigns for an ad account
   */
  async syncAdAccountCampaigns(
    adAccountId: string,
    userId: string,
  ): Promise<MetaCampaign[]> {
    const adAccount = await this.platformAssetRepository.findOne({
      where: {
        id: adAccountId,
        assetType: AssetType.AD_ACCOUNT,
        platform: Platform.META,
      },
      relations: ['businessManager'],
    });

    if (!adAccount) {
      throw new BusinessException('Ad account not found');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(
        adAccount.businessManagerId,
      );

      // Fetch all campaigns from Meta
      const response = await this.metaSdkService.graphApiRequest(
        `${adAccount.platformAssetId}/campaigns`,
        'GET',
        {
          fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time,special_ad_categories',
          limit: 100,
        },
        token,
      );

      const campaigns: MetaCampaign[] = [];

      for (const data of response.data || []) {
        let campaign = await this.metaCampaignRepository.findOne({
          where: { platformCampaignId: data.id },
        });

        if (campaign) {
          // Update existing
          campaign.name = data.name;
          campaign.objective = data.objective;
          campaign.status = data.status;
          
          if (data.daily_budget) {
            campaign.dailyBudget = parseFloat(data.daily_budget) / 100;
          }
          
          if (data.lifetime_budget) {
            campaign.lifetimeBudget = parseFloat(data.lifetime_budget) / 100;
          }

          campaign.startTime = data.start_time ? new Date(data.start_time) : null;
          campaign.stopTime = data.stop_time ? new Date(data.stop_time) : null;
          campaign.specialAdCategories = data.special_ad_categories;
          campaign.lastSyncedAt = new Date();
          campaign.syncError = null;
          campaign.updatedBy = userId;
        } else {
          // Create new
          campaign = this.metaCampaignRepository.create({
            platformCampaignId: data.id,
            name: data.name,
            objective: data.objective,
            status: data.status,
            adAccountId,
            dailyBudget: data.daily_budget ? parseFloat(data.daily_budget) / 100 : null,
            lifetimeBudget: data.lifetime_budget ? parseFloat(data.lifetime_budget) / 100 : null,
            startTime: data.start_time ? new Date(data.start_time) : null,
            stopTime: data.stop_time ? new Date(data.stop_time) : null,
            specialAdCategories: data.special_ad_categories,
            platformData: {
              accountId: adAccount.platformAssetId,
              campaignId: data.id,
              createdTime: data.created_time,
              updatedTime: data.updated_time,
              effectiveStatus: data.effective_status,
            },
            lastSyncedAt: new Date(),
            createdBy: userId,
            updatedBy: userId,
          });
        }

        await this.metaCampaignRepository.save(campaign);
        campaigns.push(campaign);
      }

      this.logger.log(`Synced ${campaigns.length} campaigns for ad account ${adAccount.name}`);

      return campaigns;
    } catch (error) {
      this.logger.error('Error syncing ad account campaigns:', error);
      throw new BusinessException(`Failed to sync campaigns: ${error.message}`);
    }
  }

  /**
   * Get campaigns by ad account
   */
  async getCampaignsByAdAccount(adAccountId: string): Promise<MetaCampaign[]> {
    return this.metaCampaignRepository.find({
      where: { adAccountId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<MetaCampaign> {
    const campaign = await this.metaCampaignRepository.findOne({
      where: { id: campaignId },
      relations: ['adAccount', 'adAccount.businessManager', 'adAccount.workspace'],
    });

    if (!campaign) {
      throw new BusinessException('Campaign not found');
    }

    return campaign;
  }

  /**
   * Batch create campaigns (for scale)
   */
  async batchCreateCampaigns(
    campaigns: Array<{
      adAccountId: string;
      name: string;
      objective: MetaCampaignObjective;
      status: MetaCampaignStatus;
      dailyBudget?: number;
      lifetimeBudget?: number;
    }>,
    userId: string,
  ): Promise<MetaCampaign[]> {
    const createdCampaigns: MetaCampaign[] = [];

    // Group campaigns by ad account for efficient processing
    const campaignsByAccount = new Map<string, typeof campaigns>();
    
    for (const campaign of campaigns) {
      const accountCampaigns = campaignsByAccount.get(campaign.adAccountId) || [];
      accountCampaigns.push(campaign);
      campaignsByAccount.set(campaign.adAccountId, accountCampaigns);
    }

    // Create campaigns for each ad account
    for (const [adAccountId, accountCampaigns] of campaignsByAccount) {
      for (const campaignData of accountCampaigns) {
        try {
          const campaign = await this.createMetaCampaign(
            adAccountId,
            campaignData.name,
            campaignData.objective,
            campaignData.status,
            userId,
            {
              dailyBudget: campaignData.dailyBudget,
              lifetimeBudget: campaignData.lifetimeBudget,
            },
          );
          
          createdCampaigns.push(campaign);
        } catch (error) {
          this.logger.error(`Failed to create campaign ${campaignData.name}:`, error);
          // Continue with next campaign
        }
      }
    }

    this.logger.log(`Batch created ${createdCampaigns.length} out of ${campaigns.length} campaigns`);

    return createdCampaigns;
  }

  /**
   * Batch update campaign statuses (for scale)
   */
  async batchUpdateCampaignStatus(
    campaignIds: string[],
    status: MetaCampaignStatus,
    userId: string,
  ): Promise<number> {
    let updatedCount = 0;

    for (const campaignId of campaignIds) {
      try {
        await this.updateMetaCampaign(campaignId, userId, { status });
        updatedCount++;
      } catch (error) {
        this.logger.error(`Failed to update campaign ${campaignId}:`, error);
        // Continue with next campaign
      }
    }

    this.logger.log(`Batch updated status for ${updatedCount} out of ${campaignIds.length} campaigns`);

    return updatedCount;
  }

  /**
   * Get campaign performance summary
   */
  async getCampaignPerformance(campaignId: string): Promise<{
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    ctr: number;
    cpc: number;
    cpm: number;
  }> {
    const campaign = await this.getCampaignById(campaignId);

    return {
      spend: Number(campaign.totalSpend),
      impressions: Number(campaign.impressions),
      clicks: Number(campaign.clicks),
      reach: Number(campaign.reach),
      ctr: Number(campaign.ctr),
      cpc: Number(campaign.cpc),
      cpm: Number(campaign.cpm),
    };
  }
}

