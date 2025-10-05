import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialMediaProvider } from '../../interfaces/social-media-provider.interface';
import {
  AuthResult,
  AccountInfo,
  AdCreationData,
  CampaignCreationData,
  PerformanceData,
} from '../../interfaces/social-media-provider.interface';
import { SocialAd } from '../../entities/social-ad.entity';
import { SocialAdCampaign } from '../../entities/social-ad-campaign.entity';

// Import Meta Business SDK
import * as bizSdk from 'facebook-nodejs-business-sdk';

const {
  FacebookAdsApi,
  AdAccount,
  Campaign,
  AdSet,
  Ad,
  AdCreative,
  AdsInsights,
  CustomAudience,
  Page,
  User,
} = bizSdk;

@Injectable()
export class MetaService implements SocialMediaProvider {
  private readonly logger = new Logger(MetaService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly apiVersion: string;
  private api: typeof FacebookAdsApi;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('META_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('META_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('META_REDIRECT_URI');
    this.apiVersion = this.configService.get<string>('META_API_VERSION', 'v18.0');

    // Initialize Facebook Ads API - will be set with token when needed
    this.api = FacebookAdsApi.init('dummy_token'); // Will be overridden with real token
  }

  // ==================== Helper Methods ====================

  private setAccessToken(accessToken: string): void {
    this.setAccessToken(accessToken);
  }

  // ==================== Authentication Methods ====================

  getAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: [
        'ads_management',
        'ads_read',
        'business_management',
        'pages_read_engagement',
        'pages_manage_ads',
        'pages_read_user_content',
        'pages_manage_metadata',
        'instagram_basic',
        'instagram_manage_insights',
      ].join(','),
      response_type: 'code',
      ...(state && { state }),
    });

    return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, state?: string): Promise<AuthResult> {
    try {
      // Use SDK's OAuth helper - but since SDK doesn't have this, we use fetch
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/oauth/access_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            code,
          }),
        },
      );

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          error: data.error.message,
        };
      }

      // Exchange short-lived token for long-lived token
      const longLivedToken = await this.exchangeForLongLivedToken(data.access_token);

      return {
        success: true,
        accessToken: longLivedToken.access_token,
        expiresIn: longLivedToken.expires_in,
        scope: data.scope?.split(',') || [],
      };
    } catch (error) {
      this.logger.error('Error exchanging code for token:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async exchangeForLongLivedToken(
    shortLivedToken: string,
  ): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/oauth/access_token`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      fb_exchange_token: shortLivedToken,
    });

    const longLivedResponse = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?${params.toString()}`,
    );

    return longLivedResponse.json();
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/oauth/access_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'fb_exchange_token',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            fb_exchange_token: refreshToken,
          }),
        },
      );

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          error: data.error.message,
        };
      }

      return {
        success: true,
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      this.logger.error('Error refreshing token:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      // Set access token for this request
      this.setAccessToken(accessToken);

      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/me/permissions`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.ok;
    } catch (error) {
      this.logger.error('Error revoking token:', error);
      return false;
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);
      
      // Use SDK to validate token
      const user = new User('me');
      await user.read(['id', 'name']);
      
      return true;
    } catch (error) {
      this.logger.error('Error validating token:', error);
      return false;
    }
  }

  // ==================== Account Management ====================

  async getAccountInfo(accessToken: string): Promise<AccountInfo> {
    try {
      this.setAccessToken(accessToken);

      // Use SDK to get user info
      const user = new User('me');
      const userData = await user.read(['id', 'name', 'picture']);

      return {
        id: userData.id,
        name: userData.name,
        profilePictureUrl: userData.picture?.data?.url,
        accountType: 'personal',
        metadata: userData,
      };
    } catch (error) {
      this.logger.error('Error getting account info:', error);
      throw error;
    }
  }

  async getAccounts(accessToken: string): Promise<AccountInfo[]> {
    try {
      this.setAccessToken(accessToken);

      // Get ad accounts using SDK
      const user = new User('me');
      const adAccounts = await user.getAdAccounts([
        'id',
        'name',
        'account_status',
        'currency',
        'timezone_name',
      ]);

      return adAccounts.map((account: any) => ({
        id: account.id,
        name: account.name,
        displayName: account.name,
        accountType: 'business',
        metadata: {
          account_status: account.account_status,
          currency: account.currency,
          timezone: account.timezone_name,
        },
      }));
    } catch (error) {
      this.logger.error('Error getting accounts:', error);
      throw error;
    }
  }

  async updateAccount(
    accessToken: string,
    accountId: string,
    data: Partial<AccountInfo>,
  ): Promise<AccountInfo> {
    try {
      this.setAccessToken(accessToken);

      const page = new Page(accountId);
      await page.update({
        name: data.name,
      });

      const updatedPage = await page.read(['id', 'name']);

      return {
        id: updatedPage.id,
        name: updatedPage.name,
        accountType: 'business',
      };
    } catch (error) {
      this.logger.error('Error updating account:', error);
      throw error;
    }
  }

  // ==================== Campaign Management ====================

  async createCampaign(
    accessToken: string,
    data: CampaignCreationData,
  ): Promise<SocialAdCampaign> {
    try {
      this.setAccessToken(accessToken);

      const adAccount = new AdAccount(data.accountId);

      // Map objective to Meta's objective types
      const metaObjective = this.mapObjectiveToMeta(data.objective);

      // Create campaign using SDK
      const campaign = await adAccount.createCampaign([], {
        name: data.name,
        objective: metaObjective,
        status: Campaign.Status.paused, // Start paused for review
        special_ad_categories: [],
        ...(data.budgetType === 'daily' && {
          daily_budget: Math.round(data.budget * 100), // Convert to cents
        }),
        ...(data.budgetType === 'lifetime' && {
          lifetime_budget: Math.round(data.budget * 100),
          start_time: data.startDate,
          stop_time: data.endDate,
        }),
      });

      return {
        id: campaign.id,
        name: data.name,
        description: data.description,
        externalCampaignId: campaign.id,
        status: 'draft',
        objective: data.objective,
        budgetType: data.budgetType,
        budget: data.budget,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SocialAdCampaign;
    } catch (error) {
      this.logger.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getCampaigns(accessToken: string, accountId: string): Promise<SocialAdCampaign[]> {
    try {
      this.setAccessToken(accessToken);

      const adAccount = new AdAccount(accountId);
      const campaigns = await adAccount.getCampaigns([
        'id',
        'name',
        'objective',
        'status',
        'daily_budget',
        'lifetime_budget',
        'start_time',
        'stop_time',
        'created_time',
        'updated_time',
      ]);

      return campaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        externalCampaignId: campaign.id,
        status: this.mapMetaStatusToOur(campaign.status),
        objective: this.mapMetaObjectiveToOur(campaign.objective),
        budgetType: campaign.daily_budget ? 'daily' : 'lifetime',
        budget: campaign.daily_budget
          ? campaign.daily_budget / 100
          : campaign.lifetime_budget / 100,
        startDate: campaign.start_time ? new Date(campaign.start_time) : undefined,
        endDate: campaign.stop_time ? new Date(campaign.stop_time) : undefined,
        isActive: campaign.status === 'ACTIVE',
        createdAt: new Date(campaign.created_time),
        updatedAt: new Date(campaign.updated_time),
      })) as SocialAdCampaign[];
    } catch (error) {
      this.logger.error('Error getting campaigns:', error);
      throw error;
    }
  }

  async getCampaign(accessToken: string, campaignId: string): Promise<SocialAdCampaign> {
    try {
      this.setAccessToken(accessToken);

      const campaign = new Campaign(campaignId);
      const campaignData = await campaign.read([
        'id',
        'name',
        'objective',
        'status',
        'daily_budget',
        'lifetime_budget',
        'start_time',
        'stop_time',
        'created_time',
        'updated_time',
      ]);

      return {
        id: campaignData.id,
        name: campaignData.name,
        externalCampaignId: campaignData.id,
        status: this.mapMetaStatusToOur(campaignData.status),
        objective: this.mapMetaObjectiveToOur(campaignData.objective),
        budgetType: campaignData.daily_budget ? 'daily' : 'lifetime',
        budget: campaignData.daily_budget
          ? campaignData.daily_budget / 100
          : campaignData.lifetime_budget / 100,
        startDate: campaignData.start_time ? new Date(campaignData.start_time) : undefined,
        endDate: campaignData.stop_time ? new Date(campaignData.stop_time) : undefined,
        isActive: campaignData.status === 'ACTIVE',
        createdAt: new Date(campaignData.created_time),
        updatedAt: new Date(campaignData.updated_time),
      } as SocialAdCampaign;
    } catch (error) {
      this.logger.error('Error getting campaign:', error);
      throw error;
    }
  }

  async updateCampaign(
    accessToken: string,
    campaignId: string,
    data: Partial<CampaignCreationData>,
  ): Promise<SocialAdCampaign> {
    try {
      this.setAccessToken(accessToken);

      const campaign = new Campaign(campaignId);
      
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.budget && data.budgetType === 'daily') {
        updateData.daily_budget = Math.round(data.budget * 100);
      }
      if (data.budget && data.budgetType === 'lifetime') {
        updateData.lifetime_budget = Math.round(data.budget * 100);
      }

      await campaign.update([], updateData);

      return this.getCampaign(accessToken, campaignId);
    } catch (error) {
      this.logger.error('Error updating campaign:', error);
      throw error;
    }
  }

  async deleteCampaign(accessToken: string, campaignId: string): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);

      const campaign = new Campaign(campaignId);
      await campaign.delete();

      return true;
    } catch (error) {
      this.logger.error('Error deleting campaign:', error);
      return false;
    }
  }

  async pauseCampaign(accessToken: string, campaignId: string): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);

      const campaign = new Campaign(campaignId);
      await campaign.update([], {
        status: Campaign.Status.paused,
      });

      return true;
    } catch (error) {
      this.logger.error('Error pausing campaign:', error);
      return false;
    }
  }

  async resumeCampaign(accessToken: string, campaignId: string): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);

      const campaign = new Campaign(campaignId);
      await campaign.update([], {
        status: Campaign.Status.active,
      });

      return true;
    } catch (error) {
      this.logger.error('Error resuming campaign:', error);
      return false;
    }
  }

  // ==================== Ad Management ====================

  async createAd(accessToken: string, data: AdCreationData): Promise<SocialAd> {
    try {
      this.setAccessToken(accessToken);

      const adAccount = new AdAccount(data.accountId);

      // Step 1: Create Ad Creative
      const creative = await adAccount.createAdCreative([], {
        name: `${data.name} - Creative`,
        object_story_spec: {
          page_id: data.pageId, // Required
          link_data: {
            message: data.primaryText,
            link: data.linkUrl,
            name: data.headline,
            call_to_action: {
              type: data.callToAction || 'LEARN_MORE',
              value: {
                link: data.linkUrl,
              },
            },
            image_hash: data.creatives?.[0]?.imageHash, // Upload image first
          },
        },
      });

      // Step 2: Create Ad Set (required for ad)
      const adSet = await adAccount.createAdSet([], {
        name: `${data.name} - AdSet`,
        campaign_id: data.campaignId,
        daily_budget: data.budget ? Math.round(data.budget * 100) : undefined,
        bid_amount: data.bidAmount ? Math.round(data.bidAmount * 100) : undefined,
        billing_event: AdSet.BillingEvent.impressions,
        optimization_goal: AdSet.OptimizationGoal.reach,
        targeting: data.targeting || {
          geo_locations: { countries: ['US'] },
          age_min: 18,
          age_max: 65,
        },
        status: AdSet.Status.paused,
        start_time: data.startDate,
        end_time: data.endDate,
      });

      // Step 3: Create Ad
      const ad = await adAccount.createAd([], {
        name: data.name,
        adset_id: adSet.id,
        creative: { creative_id: creative.id },
        status: Ad.Status.paused,
      });

      return {
        id: ad.id,
        name: data.name,
        description: data.description,
        externalAdId: ad.id,
        status: 'draft',
        objective: data.objective,
        adType: data.adType,
        headline: data.headline,
        primaryText: data.primaryText,
        callToAction: data.callToAction,
        linkUrl: data.linkUrl,
        displayUrl: data.displayUrl,
        budget: data.budget,
        bidAmount: data.bidAmount,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SocialAd;
    } catch (error) {
      this.logger.error('Error creating ad:', error);
      throw error;
    }
  }

  async getAds(accessToken: string, accountId: string): Promise<SocialAd[]> {
    try {
      this.setAccessToken(accessToken);

      const adAccount = new AdAccount(accountId);
      const ads = await adAccount.getAds([
        'id',
        'name',
        'status',
        'creative',
        'created_time',
        'updated_time',
      ]);

      return ads.map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        externalAdId: ad.id,
        status: this.mapMetaStatusToOur(ad.status),
        isActive: ad.status === 'ACTIVE',
        createdAt: new Date(ad.created_time),
        updatedAt: new Date(ad.updated_time),
      })) as SocialAd[];
    } catch (error) {
      this.logger.error('Error getting ads:', error);
      throw error;
    }
  }

  async getAd(accessToken: string, adId: string): Promise<SocialAd> {
    try {
      this.setAccessToken(accessToken);

      const ad = new Ad(adId);
      const adData = await ad.read([
        'id',
        'name',
        'status',
        'creative',
        'created_time',
        'updated_time',
      ]);

      return {
        id: adData.id,
        name: adData.name,
        externalAdId: adData.id,
        status: this.mapMetaStatusToOur(adData.status),
        isActive: adData.status === 'ACTIVE',
        createdAt: new Date(adData.created_time),
        updatedAt: new Date(adData.updated_time),
      } as SocialAd;
    } catch (error) {
      this.logger.error('Error getting ad:', error);
      throw error;
    }
  }

  async updateAd(
    accessToken: string,
    adId: string,
    data: Partial<AdCreationData>,
  ): Promise<SocialAd> {
    try {
      this.setAccessToken(accessToken);

      const ad = new Ad(adId);
      
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      // Status is handled by pause/resume methods, not through update

      await ad.update([], updateData);

      return this.getAd(accessToken, adId);
    } catch (error) {
      this.logger.error('Error updating ad:', error);
      throw error;
    }
  }

  async deleteAd(accessToken: string, adId: string): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);

      const ad = new Ad(adId);
      await ad.delete();

      return true;
    } catch (error) {
      this.logger.error('Error deleting ad:', error);
      return false;
    }
  }

  async pauseAd(accessToken: string, adId: string): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);

      const ad = new Ad(adId);
      await ad.update([], {
        status: Ad.Status.paused,
      });

      return true;
    } catch (error) {
      this.logger.error('Error pausing ad:', error);
      return false;
    }
  }

  async resumeAd(accessToken: string, adId: string): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);

      const ad = new Ad(adId);
      await ad.update([], {
        status: Ad.Status.active,
      });

      return true;
    } catch (error) {
      this.logger.error('Error resuming ad:', error);
      return false;
    }
  }

  // ==================== Performance & Analytics ====================

  async getAdPerformance(
    accessToken: string,
    adId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceData[]> {
    try {
      this.setAccessToken(accessToken);

      const ad = new Ad(adId);
      const insights = await ad.getInsights([
        AdsInsights.Fields.impressions,
        AdsInsights.Fields.reach,
        AdsInsights.Fields.frequency,
        AdsInsights.Fields.clicks,
        AdsInsights.Fields.ctr,
        AdsInsights.Fields.spend,
        AdsInsights.Fields.cpc,
        AdsInsights.Fields.cpm,
        AdsInsights.Fields.actions,
        AdsInsights.Fields.cost_per_action_type,
      ], {
        time_range: {
          since: startDate.toISOString().split('T')[0],
          until: endDate.toISOString().split('T')[0],
        },
        time_increment: 1, // Daily breakdown
      });

      const performanceData: PerformanceData[] = [];

      insights.forEach((insight: any) => {
        const date = new Date(insight.date_start);

        // Map each metric to our performance data structure
        if (insight.impressions) {
          performanceData.push({
            adId,
            date,
            metric: 'impressions',
            value: parseFloat(insight.impressions),
            breakdown: insight,
          });
        }

        if (insight.reach) {
          performanceData.push({
            adId,
            date,
            metric: 'reach',
            value: parseFloat(insight.reach),
            breakdown: insight,
          });
        }

        if (insight.clicks) {
          performanceData.push({
            adId,
            date,
            metric: 'clicks',
            value: parseFloat(insight.clicks),
            breakdown: insight,
          });
        }

        if (insight.ctr) {
          performanceData.push({
            adId,
            date,
            metric: 'ctr',
            value: parseFloat(insight.ctr),
            breakdown: insight,
          });
        }

        if (insight.spend) {
          performanceData.push({
            adId,
            date,
            metric: 'spend',
            value: parseFloat(insight.spend),
            currency: 'USD',
            breakdown: insight,
          });
        }

        if (insight.cpc) {
          performanceData.push({
            adId,
            date,
            metric: 'cost_per_click',
            value: parseFloat(insight.cpc),
            currency: 'USD',
            breakdown: insight,
          });
        }
      });

      return performanceData;
    } catch (error) {
      this.logger.error('Error getting ad performance:', error);
      throw error;
    }
  }

  async getCampaignPerformance(
    accessToken: string,
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceData[]> {
    try {
      this.setAccessToken(accessToken);

      const campaign = new Campaign(campaignId);
      const insights = await campaign.getInsights([
        AdsInsights.Fields.impressions,
        AdsInsights.Fields.reach,
        AdsInsights.Fields.clicks,
        AdsInsights.Fields.ctr,
        AdsInsights.Fields.spend,
        AdsInsights.Fields.cpc,
      ], {
        time_range: {
          since: startDate.toISOString().split('T')[0],
          until: endDate.toISOString().split('T')[0],
        },
        time_increment: 1,
      });

      const performanceData: PerformanceData[] = [];

      insights.forEach((insight: any) => {
        const date = new Date(insight.date_start);

        Object.keys(insight).forEach((key) => {
          if (key !== 'date_start' && key !== 'date_stop' && insight[key]) {
            performanceData.push({
              adId: campaignId,
              date,
              metric: key,
              value: parseFloat(insight[key]),
              breakdown: insight,
            });
          }
        });
      });

      return performanceData;
    } catch (error) {
      this.logger.error('Error getting campaign performance:', error);
      throw error;
    }
  }

  async getAccountPerformance(
    accessToken: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PerformanceData[]> {
    try {
      this.setAccessToken(accessToken);

      const adAccount = new AdAccount(accountId);
      const insights = await adAccount.getInsights([
        AdsInsights.Fields.impressions,
        AdsInsights.Fields.reach,
        AdsInsights.Fields.clicks,
        AdsInsights.Fields.spend,
      ], {
        time_range: {
          since: startDate.toISOString().split('T')[0],
          until: endDate.toISOString().split('T')[0],
        },
        time_increment: 1,
      });

      const performanceData: PerformanceData[] = [];

      insights.forEach((insight: any) => {
        const date = new Date(insight.date_start);

        Object.keys(insight).forEach((key) => {
          if (key !== 'date_start' && key !== 'date_stop' && insight[key]) {
            performanceData.push({
              adId: accountId,
              date,
              metric: key,
              value: parseFloat(insight[key]),
              breakdown: insight,
            });
          }
        });
      });

      return performanceData;
    } catch (error) {
      this.logger.error('Error getting account performance:', error);
      throw error;
    }
  }

  // ==================== Targeting & Audiences ====================

  async getTargetingOptions(accessToken: string): Promise<Record<string, any>> {
    try {
      this.setAccessToken(accessToken);

      // Get targeting search suggestions
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/search?type=adinterest&access_token=${accessToken}`,
      );
      const data = await response.json();

      return {
        interests: data.data || [],
        demographics: {},
        behaviors: {},
        locations: {},
      };
    } catch (error) {
      this.logger.error('Error getting targeting options:', error);
      throw error;
    }
  }

  async createCustomAudience(
    accessToken: string,
    name: string,
    description: string,
    data: any[],
  ): Promise<string> {
    try {
      this.setAccessToken(accessToken);

      const adAccount = new AdAccount(data[0].accountId);
      const audience = await adAccount.createCustomAudience([], {
        name,
        description,
        subtype: CustomAudience.Subtype.custom,
      });

      return audience.id;
    } catch (error) {
      this.logger.error('Error creating custom audience:', error);
      throw error;
    }
  }

  async getCustomAudiences(accessToken: string, accountId: string): Promise<any[]> {
    try {
      this.setAccessToken(accessToken);

      const adAccount = new AdAccount(accountId);
      const audiences = await adAccount.getCustomAudiences([
        'id',
        'name',
        'description',
        'approximate_count',
      ]);

      return audiences;
    } catch (error) {
      this.logger.error('Error getting custom audiences:', error);
      throw error;
    }
  }

  async updateCustomAudience(
    accessToken: string,
    audienceId: string,
    data: any,
  ): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);

      const audience = new CustomAudience(audienceId);
      await audience.update([], {
        name: data.name,
        description: data.description,
      });

      return true;
    } catch (error) {
      this.logger.error('Error updating custom audience:', error);
      return false;
    }
  }

  async deleteCustomAudience(accessToken: string, audienceId: string): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);

      const audience = new CustomAudience(audienceId);
      await audience.delete();

      return true;
    } catch (error) {
      this.logger.error('Error deleting custom audience:', error);
      return false;
    }
  }

  // ==================== Agency-Specific Methods ====================

  /**
   * Check if agency has access to a specific page in Business Manager
   */
  async hasPageAccess(accessToken: string, pageId: string): Promise<boolean> {
    try {
      this.setAccessToken(accessToken);

      const page = new Page(pageId);
      
      // Try to read page data - if successful, agency has access
      await page.read(['id', 'name', 'access_token']);
      
      return true;
    } catch (error) {
      this.logger.error(`Agency does not have access to page ${pageId}:`, error);
      return false;
    }
  }

  /**
   * Get all pages accessible by this Business Manager
   */
  async getBusinessManagerPages(accessToken: string, businessManagerId: string): Promise<any[]> {
    try {
      this.setAccessToken(accessToken);

      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${businessManagerId}/owned_pages?fields=id,name,access_token&access_token=${accessToken}`,
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.data || [];
    } catch (error) {
      this.logger.error('Error getting Business Manager pages:', error);
      throw error;
    }
  }

  /**
   * Get all ad accounts accessible by this Business Manager
   */
  async getBusinessManagerAdAccounts(accessToken: string, businessManagerId: string): Promise<any[]> {
    try {
      this.setAccessToken(accessToken);

      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${businessManagerId}/owned_ad_accounts?fields=id,name,account_status&access_token=${accessToken}`,
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.data || [];
    } catch (error) {
      this.logger.error('Error getting Business Manager ad accounts:', error);
      throw error;
    }
  }

  /**
   * Request access to a page (for agency to claim client's page)
   */
  async requestPageAccess(
    agencyToken: string,
    businessManagerId: string,
    pageId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.api.setAccessToken(agencyToken);

      // Request to add page to Business Manager
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${businessManagerId}/pages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_id: pageId,
            permitted_tasks: [
              'ADVERTISE',
              'ANALYZE',
              'CREATE_CONTENT',
              'MODERATE',
              'MANAGE',
            ],
            access_token: agencyToken,
          }),
        },
      );

      const data = await response.json();

      if (data.error) {
        return {
          success: false,
          message: data.error.message,
        };
      }

      return {
        success: true,
        message: 'Page access requested successfully',
      };
    } catch (error) {
      this.logger.error('Error requesting page access:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ==================== Platform-specific features ====================

  getSupportedFeatures(): string[] {
    return [
      'campaign_management',
      'ad_creation',
      'targeting',
      'audience_creation',
      'performance_analytics',
      'creative_management',
      'budget_management',
      'scheduling',
      'instagram_integration',
      'facebook_pages',
      'conversion_tracking',
    ];
  }

  getApiLimits(): Record<string, any> {
    return {
      rate_limit: '200 calls per hour per user',
      daily_limit: '4800 calls per day per user',
      batch_limit: '50 requests per batch',
      sdk_version: this.apiVersion,
    };
  }

  async validateAdData(data: AdCreationData): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!data.name) {
      errors.push('Ad name is required');
    }

    if (!data.objective) {
      errors.push('Ad objective is required');
    }

    if (data.budget && data.budget < 1) {
      errors.push('Budget must be at least $1');
    }

    if (data.linkUrl && !this.isValidUrl(data.linkUrl)) {
      errors.push('Invalid link URL format');
    }

    if (!data.pageId) {
      errors.push('Facebook Page ID is required for creating ads');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validateCampaignData(
    data: CampaignCreationData,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!data.name) {
      errors.push('Campaign name is required');
    }

    if (!data.objective) {
      errors.push('Campaign objective is required');
    }

    if (data.budget < 1) {
      errors.push('Budget must be at least $1');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ==================== Helper Methods ====================

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private mapObjectiveToMeta(objective: string): string {
    const mapping: Record<string, string> = {
      awareness: Campaign.Objective.brand_awareness,
      traffic: Campaign.Objective.link_clicks,
      engagement: Campaign.Objective.post_engagement,
      leads: Campaign.Objective.lead_generation,
      sales: Campaign.Objective.conversions,
      app_installs: Campaign.Objective.app_installs,
      video_views: Campaign.Objective.video_views,
      reach: Campaign.Objective.reach,
    };

    return mapping[objective] || Campaign.Objective.reach;
  }

  private mapMetaObjectiveToOur(metaObjective: string): string {
    const mapping: Record<string, string> = {
      [Campaign.Objective.brand_awareness]: 'awareness',
      [Campaign.Objective.link_clicks]: 'traffic',
      [Campaign.Objective.post_engagement]: 'engagement',
      [Campaign.Objective.lead_generation]: 'leads',
      [Campaign.Objective.conversions]: 'sales',
      [Campaign.Objective.app_installs]: 'app_installs',
      [Campaign.Objective.video_views]: 'video_views',
      [Campaign.Objective.reach]: 'reach',
    };

    return mapping[metaObjective] || 'awareness';
  }

  private mapMetaStatusToOur(metaStatus: string): string {
    const mapping: Record<string, string> = {
      ACTIVE: 'active',
      PAUSED: 'paused',
      ARCHIVED: 'archived',
      DELETED: 'archived',
    };

    return mapping[metaStatus] || 'draft';
  }

  private mapOurStatusToMeta(ourStatus: string): string {
    const mapping: Record<string, string> = {
      active: 'ACTIVE',
      paused: 'PAUSED',
      archived: 'ARCHIVED',
      draft: 'PAUSED',
    };

    return mapping[ourStatus] || 'PAUSED';
  }
}