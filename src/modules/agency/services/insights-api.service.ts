import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { InsightData, PlatformAsset, MetaCampaign } from '../entities';
import { 
  Platform,
  MetaInsightDatePreset,
  MetaInsightBreakdown,
  MetaInsightMetric,
  AssetType,
} from '../enums';
import { MetaSdkService } from './meta-sdk.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { IMetaInsights, IMetaInsightsParams } from '../interfaces';

/**
 * Insights API Service
 * Pulls analytics and performance data from platform APIs
 * Centralizes insights across all campaigns and accounts
 * Optimized for fast queries and aggregations
 */
@Injectable()
export class InsightsApiService {
  private readonly logger = new Logger(InsightsApiService.name);

  constructor(
    @InjectRepository(InsightData)
    private readonly insightDataRepository: Repository<InsightData>,
    @InjectRepository(PlatformAsset)
    private readonly platformAssetRepository: Repository<PlatformAsset>,
    @InjectRepository(MetaCampaign)
    private readonly metaCampaignRepository: Repository<MetaCampaign>,
    private readonly metaSdkService: MetaSdkService,
  ) {}

  /**
   * Fetch and store insights for ad account
   */
  async fetchAdAccountInsights(
    adAccountId: string,
    datePreset: MetaInsightDatePreset,
    userId: string,
    dateRange?: { startDate: Date; endDate: Date },
  ): Promise<InsightData[]> {
    const adAccount = await this.platformAssetRepository.findOne({
      where: {
        id: adAccountId,
        assetType: AssetType.AD_ACCOUNT,
        platform: Platform.META,
      },
      relations: ['businessManager', 'workspace'],
    });

    if (!adAccount) {
      throw new BusinessException('Ad account not found');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(
        adAccount.businessManagerId,
      );

      // Prepare insights params
      const params: IMetaInsightsParams = {
        fields: [
          'impressions',
          'clicks',
          'spend',
          'reach',
          'frequency',
          'cpm',
          'cpc',
          'ctr',
          'cpp',
          'cost_per_unique_click',
          'actions',
          'action_values',
          'conversions',
          'conversion_values',
          'cost_per_action_type',
          'purchase_roas',
        ],
        level: 'account',
        date_preset: datePreset,
        time_increment: 1, // Daily breakdown
      };

      if (dateRange) {
        params.time_range = {
          since: dateRange.startDate.toISOString().split('T')[0],
          until: dateRange.endDate.toISOString().split('T')[0],
        };
      }

      // Fetch insights from Meta
      const response = await this.metaSdkService.graphApiRequest(
        `${adAccount.platformAssetId}/insights`,
        'GET',
        params,
        token,
      );

      const insights: InsightData[] = [];

      for (const data of response.data || []) {
        const insightData = await this.saveMetaInsights(
          data,
          'account',
          adAccount.platformAssetId,
          adAccount.name,
          adAccount.businessManagerId,
          adAccount.workspaceId,
          adAccountId,
          userId,
        );
        
        insights.push(insightData);
      }

      this.logger.log(`Fetched ${insights.length} insight records for ad account ${adAccount.name}`);

      return insights;
    } catch (error) {
      this.logger.error('Error fetching ad account insights:', error);
      throw new BusinessException(`Failed to fetch insights: ${error.message}`);
    }
  }

  /**
   * Fetch and store insights for campaign
   */
  async fetchCampaignInsights(
    campaignId: string,
    datePreset: MetaInsightDatePreset,
    userId: string,
    dateRange?: { startDate: Date; endDate: Date },
    breakdowns?: MetaInsightBreakdown[],
  ): Promise<InsightData[]> {
    const campaign = await this.metaCampaignRepository.findOne({
      where: { id: campaignId },
      relations: ['adAccount', 'adAccount.businessManager', 'adAccount.workspace'],
    });

    if (!campaign) {
      throw new BusinessException('Campaign not found');
    }

    try {
      const token = await this.metaSdkService.getBusinessManagerToken(
        campaign.adAccount.businessManagerId,
      );

      const params: IMetaInsightsParams = {
        fields: [
          'impressions',
          'clicks',
          'spend',
          'reach',
          'frequency',
          'cpm',
          'cpc',
          'ctr',
          'actions',
          'action_values',
          'conversions',
          'conversion_values',
          'cost_per_action_type',
          'purchase_roas',
          'video_play_actions',
          'video_avg_time_watched_actions',
        ],
        level: 'campaign',
        date_preset: datePreset,
        time_increment: 1,
      };

      if (dateRange) {
        params.time_range = {
          since: dateRange.startDate.toISOString().split('T')[0],
          until: dateRange.endDate.toISOString().split('T')[0],
        };
      }

      if (breakdowns && breakdowns.length > 0) {
        params.breakdowns = breakdowns;
      }

      // Fetch insights from Meta
      const response = await this.metaSdkService.graphApiRequest(
        `${campaign.platformCampaignId}/insights`,
        'GET',
        params,
        token,
      );

      const insights: InsightData[] = [];

      for (const data of response.data || []) {
        const insightData = await this.saveMetaInsights(
          data,
          'campaign',
          campaign.platformCampaignId,
          campaign.name,
          campaign.adAccount.businessManagerId,
          campaign.adAccount.workspaceId,
          campaign.adAccountId,
          userId,
        );
        
        insights.push(insightData);

        // Update campaign cached metrics
        await this.updateCampaignMetrics(campaign, data);
      }

      this.logger.log(`Fetched ${insights.length} insight records for campaign ${campaign.name}`);

      return insights;
    } catch (error) {
      this.logger.error('Error fetching campaign insights:', error);
      throw new BusinessException(`Failed to fetch campaign insights: ${error.message}`);
    }
  }

  /**
   * Save Meta insights to database
   */
  private async saveMetaInsights(
    data: IMetaInsights,
    level: string,
    platformEntityId: string,
    entityName: string,
    businessManagerId: string,
    workspaceId: string,
    adAccountId: string,
    userId: string,
  ): Promise<InsightData> {
    const reportDate = data.date_start ? new Date(data.date_start) : new Date();

    // Check if insight already exists
    let insight = await this.insightDataRepository.findOne({
      where: {
        platform: Platform.META,
        insightLevel: level,
        platformEntityId,
        reportDate,
      },
    });

    const metrics = this.extractMetaMetrics(data);

    if (insight) {
      // Update existing
      Object.assign(insight, metrics);
      insight.updatedBy = userId;
    } else {
      // Create new
      insight = this.insightDataRepository.create({
        platform: Platform.META,
        insightLevel: level,
        platformEntityId,
        entityName,
        reportDate,
        dateStart: data.date_start ? new Date(data.date_start) : null,
        dateStop: data.date_stop ? new Date(data.date_stop) : null,
        businessManagerId,
        workspaceId,
        adAccountId,
        ...metrics,
        actions: data.actions,
        actionValues: data.action_values,
        rawData: data,
        createdBy: userId,
        updatedBy: userId,
      });
    }

    await this.insightDataRepository.save(insight);

    return insight;
  }

  /**
   * Extract metrics from Meta insights data
   */
  private extractMetaMetrics(data: IMetaInsights): any {
    return {
      impressions: parseInt(data.impressions || '0'),
      clicks: parseInt(data.clicks || '0'),
      spend: parseFloat(data.spend || '0'),
      reach: parseInt(data.reach || '0'),
      frequency: parseFloat(data.frequency || '0'),
      cpm: parseFloat(data.cpm || '0'),
      cpc: parseFloat(data.cpc || '0'),
      ctr: parseFloat(data.ctr || '0'),
      cpp: parseFloat(data.cpp || '0'),
      
      // Extract conversions
      conversions: this.extractActionValue(data.actions, 'offsite_conversion'),
      conversionValue: this.extractActionValue(data.action_values, 'offsite_conversion'),
      costPerConversion: this.extractActionValue(data.cost_per_action_type, 'offsite_conversion'),
      roas: this.extractActionValue(data.purchase_roas, 'purchase'),
      
      // Engagement metrics
      postEngagement: this.extractActionValue(data.actions, 'post_engagement'),
      pageEngagement: this.extractActionValue(data.actions, 'page_engagement'),
      linkClicks: this.extractActionValue(data.actions, 'link_click'),
      reactions: this.extractActionValue(data.actions, 'post_reaction'),
      comments: this.extractActionValue(data.actions, 'comment'),
      shares: this.extractActionValue(data.actions, 'post'),
      
      // Video metrics
      videoViews: this.extractActionValue(data.video_play_actions, 'video_view'),
      avgWatchTime: this.extractActionValue(data.video_avg_time_watched_actions, 'video_view'),
    };
  }

  /**
   * Extract specific action value from actions array
   */
  private extractActionValue(
    actions: Array<{ action_type: string; value: string }> | undefined,
    actionType: string,
  ): number {
    if (!actions) return 0;
    
    const action = actions.find(a => a.action_type.includes(actionType));
    return action ? parseFloat(action.value) : 0;
  }

  /**
   * Update campaign cached metrics
   */
  private async updateCampaignMetrics(
    campaign: MetaCampaign,
    insights: IMetaInsights,
  ): Promise<void> {
    campaign.totalSpend = parseFloat(insights.spend || '0');
    campaign.impressions = parseInt(insights.impressions || '0');
    campaign.clicks = parseInt(insights.clicks || '0');
    campaign.reach = parseInt(insights.reach || '0');
    campaign.ctr = parseFloat(insights.ctr || '0');
    campaign.cpc = parseFloat(insights.cpc || '0');
    campaign.cpm = parseFloat(insights.cpm || '0');
    campaign.metricsLastSyncedAt = new Date();

    await this.metaCampaignRepository.save(campaign);
  }

  /**
   * Get aggregated insights for workspace
   */
  async getWorkspaceInsights(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalReach: number;
    avgCtr: number;
    avgCpc: number;
    avgCpm: number;
    totalConversions: number;
    totalConversionValue: number;
  }> {
    const insights = await this.insightDataRepository.find({
      where: {
        workspaceId,
        reportDate: Between(startDate, endDate),
      },
    });

    const aggregated = insights.reduce(
      (acc, insight) => ({
        totalSpend: acc.totalSpend + Number(insight.spend),
        totalImpressions: acc.totalImpressions + Number(insight.impressions),
        totalClicks: acc.totalClicks + Number(insight.clicks),
        totalReach: acc.totalReach + Number(insight.reach),
        totalConversions: acc.totalConversions + Number(insight.conversions),
        totalConversionValue: acc.totalConversionValue + Number(insight.conversionValue),
      }),
      {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalReach: 0,
        totalConversions: 0,
        totalConversionValue: 0,
      },
    );

    return {
      ...aggregated,
      avgCtr: aggregated.totalImpressions > 0 
        ? (aggregated.totalClicks / aggregated.totalImpressions) * 100 
        : 0,
      avgCpc: aggregated.totalClicks > 0 
        ? aggregated.totalSpend / aggregated.totalClicks 
        : 0,
      avgCpm: aggregated.totalImpressions > 0 
        ? (aggregated.totalSpend / aggregated.totalImpressions) * 1000 
        : 0,
    };
  }

  /**
   * Get insights for multiple campaigns
   */
  async getCampaignsInsights(
    campaignIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<Map<string, any>> {
    const campaigns = await this.metaCampaignRepository.find({
      where: {
        id: In(campaignIds),
      },
    });

    const insights = await this.insightDataRepository.find({
      where: {
        insightLevel: 'campaign',
        platformEntityId: In(campaigns.map(c => c.platformCampaignId)),
        reportDate: Between(startDate, endDate),
      },
    });

    // Group insights by campaign
    const insightsByCampaign = new Map<string, InsightData[]>();
    
    for (const insight of insights) {
      const existing = insightsByCampaign.get(insight.platformEntityId) || [];
      existing.push(insight);
      insightsByCampaign.set(insight.platformEntityId, existing);
    }

    // Aggregate insights per campaign
    const result = new Map<string, any>();
    
    for (const campaign of campaigns) {
      const campaignInsights = insightsByCampaign.get(campaign.platformCampaignId) || [];
      
      const aggregated = campaignInsights.reduce(
        (acc, insight) => ({
          spend: acc.spend + Number(insight.spend),
          impressions: acc.impressions + Number(insight.impressions),
          clicks: acc.clicks + Number(insight.clicks),
          reach: acc.reach + Number(insight.reach),
          conversions: acc.conversions + Number(insight.conversions),
        }),
        { spend: 0, impressions: 0, clicks: 0, reach: 0, conversions: 0 },
      );

      result.set(campaign.id, {
        campaignId: campaign.id,
        campaignName: campaign.name,
        ...aggregated,
        ctr: aggregated.impressions > 0 
          ? (aggregated.clicks / aggregated.impressions) * 100 
          : 0,
        cpc: aggregated.clicks > 0 
          ? aggregated.spend / aggregated.clicks 
          : 0,
        cpm: aggregated.impressions > 0 
          ? (aggregated.spend / aggregated.impressions) * 1000 
          : 0,
      });
    }

    return result;
  }

  /**
   * Get insights with breakdowns (for demographic analysis)
   */
  async getInsightsWithBreakdowns(
    entityId: string,
    level: 'account' | 'campaign' | 'adset' | 'ad',
    breakdown: MetaInsightBreakdown,
    startDate: Date,
    endDate: Date,
  ): Promise<InsightData[]> {
    return this.insightDataRepository.find({
      where: {
        insightLevel: level,
        platformEntityId: entityId,
        reportDate: Between(startDate, endDate),
      },
      order: {
        reportDate: 'DESC',
      },
    });
  }

  /**
   * Batch fetch insights for multiple ad accounts (optimized for scale)
   */
  async batchFetchInsights(
    adAccountIds: string[],
    datePreset: MetaInsightDatePreset,
    userId: string,
  ): Promise<Map<string, InsightData[]>> {
    const results = new Map<string, InsightData[]>();

    // Process accounts in parallel (but with rate limiting)
    const batchSize = 5; // Process 5 accounts at a time
    
    for (let i = 0; i < adAccountIds.length; i += batchSize) {
      const batch = adAccountIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (adAccountId) => {
        try {
          const insights = await this.fetchAdAccountInsights(adAccountId, datePreset, userId);
          results.set(adAccountId, insights);
        } catch (error) {
          this.logger.error(`Failed to fetch insights for account ${adAccountId}:`, error);
          results.set(adAccountId, []);
        }
      });

      await Promise.all(promises);
    }

    this.logger.log(`Batch fetched insights for ${adAccountIds.length} ad accounts`);

    return results;
  }

  /**
   * Get top performing campaigns
   */
  async getTopPerformingCampaigns(
    workspaceId: string,
    metric: 'spend' | 'impressions' | 'clicks' | 'conversions' | 'roas',
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const where: any = { workspaceId, insightLevel: 'campaign' };
    
    if (startDate && endDate) {
      where.reportDate = Between(startDate, endDate);
    }

    const insights = await this.insightDataRepository.find({
      where,
    });

    // Group by campaign and aggregate
    const campaignMetrics = new Map<string, any>();
    
    for (const insight of insights) {
      const existing = campaignMetrics.get(insight.platformEntityId) || {
        campaignName: insight.entityName,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        roas: 0,
      };

      existing.spend += Number(insight.spend);
      existing.impressions += Number(insight.impressions);
      existing.clicks += Number(insight.clicks);
      existing.conversions += Number(insight.conversions);
      existing.roas = Number(insight.roas);

      campaignMetrics.set(insight.platformEntityId, existing);
    }

    // Sort by selected metric
    const sorted = Array.from(campaignMetrics.values())
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, limit);

    return sorted;
  }

  /**
   * Schedule automated insights fetch (to be called by cron job)
   */
  async scheduledInsightsFetch(platform: Platform = Platform.META): Promise<void> {
    this.logger.log('Starting scheduled insights fetch...');

    try {
      // Get all active ad accounts
      const adAccounts = await this.platformAssetRepository.find({
        where: {
          platform,
          assetType: AssetType.AD_ACCOUNT,
        },
      });

      // Fetch insights for each account
      for (const adAccount of adAccounts) {
        try {
          await this.fetchAdAccountInsights(
            adAccount.id,
            MetaInsightDatePreset.YESTERDAY,
            'system',
          );
        } catch (error) {
          this.logger.error(`Failed to fetch insights for ${adAccount.name}:`, error);
        }
      }

      this.logger.log(`Completed scheduled insights fetch for ${adAccounts.length} accounts`);
    } catch (error) {
      this.logger.error('Error in scheduled insights fetch:', error);
    }
  }
}

