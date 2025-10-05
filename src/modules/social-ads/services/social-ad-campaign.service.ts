import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAdCampaign, CampaignStatus, CampaignObjective, BudgetType } from '../entities/social-ad-campaign.entity';
import { SocialAd } from '../entities/social-ad.entity';
import { SocialMediaAccount } from '../entities/social-media-account.entity';
import { SocialMediaAuthService } from './social-media-auth.service';
import { SocialMediaProviderFactory } from './social-media-provider.factory';
import { CampaignCreationData, PerformanceData } from '../interfaces/social-media-provider.interface';

@Injectable()
export class SocialAdCampaignService {
  constructor(
    @InjectRepository(SocialAdCampaign)
    private readonly campaignRepository: Repository<SocialAdCampaign>,
    @InjectRepository(SocialAd)
    private readonly adRepository: Repository<SocialAd>,
    @InjectRepository(SocialMediaAccount)
    private readonly accountRepository: Repository<SocialMediaAccount>,
    private readonly authService: SocialMediaAuthService,
    private readonly providerFactory: SocialMediaProviderFactory,
  ) {}

  // Campaign Management
  async createCampaign(campaignData: {
    workspaceId: string;
    accountId: string;
    name: string;
    description?: string;
    objective: CampaignObjective;
    budgetType: BudgetType;
    budget: number;
    startDate?: Date;
    endDate?: Date;
    targeting?: Record<string, any>;
  }): Promise<SocialAdCampaign> {
    const account = await this.accountRepository.findOne({
      where: { id: campaignData.accountId, workspaceId: campaignData.workspaceId, isActive: true },
      relations: ['platform'],
    });

    if (!account) {
      throw new NotFoundException('Account not found or access denied');
    }

    // Check if account is authenticated
    if (!(await this.authService.isAccountAuthenticated(campaignData.accountId))) {
      throw new UnauthorizedException('Account not authenticated');
    }

    const provider = this.providerFactory.getProvider(account.platform.type);
    
    // Validate campaign data
    const validation = await provider.validateCampaignData({
      name: campaignData.name,
      description: campaignData.description,
      objective: campaignData.objective,
      budgetType: campaignData.budgetType,
      budget: campaignData.budget,
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      targeting: campaignData.targeting,
    });

    if (!validation.valid) {
      throw new Error(`Campaign validation failed: ${validation.errors.join(', ')}`);
    }

    // Get access token
    const accessToken = await this.authService.getValidAccessToken(campaignData.accountId);

    // Create campaign on the platform
    const platformCampaign = await provider.createCampaign(accessToken, {
      name: campaignData.name,
      description: campaignData.description,
      objective: campaignData.objective,
      budgetType: campaignData.budgetType,
      budget: campaignData.budget,
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      targeting: campaignData.targeting,
    });

    // Save campaign to database
    const campaign = this.campaignRepository.create({
      workspaceId: campaignData.workspaceId,
      accountId: campaignData.accountId,
      name: campaignData.name,
      description: campaignData.description,
      externalCampaignId: platformCampaign.externalCampaignId,
      status: platformCampaign.status as CampaignStatus,
      objective: campaignData.objective,
      budgetType: campaignData.budgetType,
      budget: campaignData.budget,
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      platformSpecificData: platformCampaign.platformSpecificData,
      isActive: true,
    });

    return this.campaignRepository.save(campaign);
  }

  async getCampaigns(workspaceId: string, accountId?: string): Promise<SocialAdCampaign[]> {
    const where: any = { workspaceId, isActive: true };
    if (accountId) {
      where.accountId = accountId;
    }

    return this.campaignRepository.find({
      where,
      relations: ['account', 'account.platform', 'ads'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCampaign(campaignId: string, workspaceId: string): Promise<SocialAdCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId, workspaceId, isActive: true },
      relations: ['account', 'account.platform', 'ads'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async updateCampaign(campaignId: string, workspaceId: string, updateData: Partial<SocialAdCampaign>): Promise<SocialAdCampaign> {
    const campaign = await this.getCampaign(campaignId, workspaceId);
    
    // If updating external campaign, sync with platform
    if (updateData.status || updateData.budget || updateData.budgetType) {
      const account = await this.accountRepository.findOne({
        where: { id: campaign.accountId },
        relations: ['platform'],
      });

      if (account && await this.authService.isAccountAuthenticated(campaign.accountId)) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(campaign.accountId);

        await provider.updateCampaign(accessToken, campaign.externalCampaignId, {
          name: updateData.name,
          description: updateData.description,
          objective: updateData.objective,
          budgetType: updateData.budgetType,
          budget: updateData.budget,
          startDate: updateData.startDate,
          endDate: updateData.endDate,
        });
      }
    }

    Object.assign(campaign, updateData);
    return this.campaignRepository.save(campaign);
  }

  async deleteCampaign(campaignId: string, workspaceId: string): Promise<boolean> {
    const campaign = await this.getCampaign(campaignId, workspaceId);

    // Delete from platform if authenticated
    if (await this.authService.isAccountAuthenticated(campaign.accountId)) {
      const account = await this.accountRepository.findOne({
        where: { id: campaign.accountId },
        relations: ['platform'],
      });

      if (account) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(campaign.accountId);
        await provider.deleteCampaign(accessToken, campaign.externalCampaignId);
      }
    }

    campaign.isActive = false;
    await this.campaignRepository.save(campaign);
    return true;
  }

  async pauseCampaign(campaignId: string, workspaceId: string): Promise<boolean> {
    const campaign = await this.getCampaign(campaignId, workspaceId);

    if (await this.authService.isAccountAuthenticated(campaign.accountId)) {
      const account = await this.accountRepository.findOne({
        where: { id: campaign.accountId },
        relations: ['platform'],
      });

      if (account) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(campaign.accountId);
        await provider.pauseCampaign(accessToken, campaign.externalCampaignId);
      }
    }

    campaign.status = CampaignStatus.PAUSED;
    await this.campaignRepository.save(campaign);
    return true;
  }

  async resumeCampaign(campaignId: string, workspaceId: string): Promise<boolean> {
    const campaign = await this.getCampaign(campaignId, workspaceId);

    if (await this.authService.isAccountAuthenticated(campaign.accountId)) {
      const account = await this.accountRepository.findOne({
        where: { id: campaign.accountId },
        relations: ['platform'],
      });

      if (account) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(campaign.accountId);
        await provider.resumeCampaign(accessToken, campaign.externalCampaignId);
      }
    }

    campaign.status = CampaignStatus.ACTIVE;
    await this.campaignRepository.save(campaign);
    return true;
  }

  // Performance & Analytics
  async getCampaignPerformance(campaignId: string, workspaceId: string, startDate: Date, endDate: Date): Promise<PerformanceData[]> {
    const campaign = await this.getCampaign(campaignId, workspaceId);

    // Get performance from platform if authenticated
    if (await this.authService.isAccountAuthenticated(campaign.accountId)) {
      const account = await this.accountRepository.findOne({
        where: { id: campaign.accountId },
        relations: ['platform'],
      });

      if (account) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(campaign.accountId);
        return provider.getCampaignPerformance(accessToken, campaign.externalCampaignId, startDate, endDate);
      }
    }

    return [];
  }

  async syncCampaignPerformance(campaignId: string, workspaceId: string): Promise<PerformanceData[]> {
    const campaign = await this.getCampaign(campaignId, workspaceId);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    return this.getCampaignPerformance(campaignId, workspaceId, startDate, endDate);
  }

  // Campaign Ads Management
  async getCampaignAds(campaignId: string, workspaceId: string): Promise<SocialAd[]> {
    const campaign = await this.getCampaign(campaignId, workspaceId);

    return this.adRepository.find({
      where: { campaignId: campaign.id, workspaceId, isActive: true },
      relations: ['account', 'account.platform', 'creatives', 'targeting'],
      order: { createdAt: 'DESC' },
    });
  }

  async addAdToCampaign(campaignId: string, adId: string, workspaceId: string): Promise<SocialAd> {
    const campaign = await this.getCampaign(campaignId, workspaceId);
    const ad = await this.adRepository.findOne({
      where: { id: adId, workspaceId, isActive: true },
    });

    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    ad.campaignId = campaign.id;
    return this.adRepository.save(ad);
  }

  async removeAdFromCampaign(campaignId: string, adId: string, workspaceId: string): Promise<SocialAd> {
    const campaign = await this.getCampaign(campaignId, workspaceId);
    const ad = await this.adRepository.findOne({
      where: { id: adId, campaignId: campaign.id, workspaceId, isActive: true },
    });

    if (!ad) {
      throw new NotFoundException('Ad not found in this campaign');
    }

    ad.campaignId = null;
    return this.adRepository.save(ad);
  }

  // Campaign Statistics
  async getCampaignStats(campaignId: string, workspaceId: string): Promise<{
    totalAds: number;
    activeAds: number;
    pausedAds: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
  }> {
    const campaign = await this.getCampaign(campaignId, workspaceId);
    const ads = await this.getCampaignAds(campaignId, workspaceId);

    const totalAds = ads.length;
    const activeAds = ads.filter(ad => ad.status === 'active').length;
    const pausedAds = ads.filter(ad => ad.status === 'paused').length;

    // Get performance data
    const performance = await this.getCampaignPerformance(campaignId, workspaceId, 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());

    const totalSpend = performance
      .filter(p => p.metric === 'spend')
      .reduce((sum, p) => sum + p.value, 0);

    const totalImpressions = performance
      .filter(p => p.metric === 'impressions')
      .reduce((sum, p) => sum + p.value, 0);

    const totalClicks = performance
      .filter(p => p.metric === 'clicks')
      .reduce((sum, p) => sum + p.value, 0);

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      totalAds,
      activeAds,
      pausedAds,
      totalSpend,
      totalImpressions,
      totalClicks,
      ctr,
    };
  }
}
