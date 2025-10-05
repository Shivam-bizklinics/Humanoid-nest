import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialAd, AdStatus, AdObjective, AdType } from '../entities/social-ad.entity';
import { SocialAdCreative, CreativeType, MediaFormat } from '../entities/social-ad-creative.entity';
import { SocialAdTargeting, TargetingType } from '../entities/social-ad-targeting.entity';
import { SocialAdPerformance, PerformanceMetric } from '../entities/social-ad-performance.entity';
import { SocialMediaAccount } from '../entities/social-media-account.entity';
import { SocialMediaAuthService } from './social-media-auth.service';
import { SocialMediaProviderFactory } from './social-media-provider.factory';
import { AgencyAccountService } from './agency-account.service';
import { AdCreationData, CreativeData, PerformanceData } from '../interfaces/social-media-provider.interface';

@Injectable()
export class SocialAdService {
  constructor(
    @InjectRepository(SocialAd)
    private readonly adRepository: Repository<SocialAd>,
    @InjectRepository(SocialAdCreative)
    private readonly creativeRepository: Repository<SocialAdCreative>,
    @InjectRepository(SocialAdTargeting)
    private readonly targetingRepository: Repository<SocialAdTargeting>,
    @InjectRepository(SocialAdPerformance)
    private readonly performanceRepository: Repository<SocialAdPerformance>,
    @InjectRepository(SocialMediaAccount)
    private readonly accountRepository: Repository<SocialMediaAccount>,
    private readonly authService: SocialMediaAuthService,
    private readonly agencyAccountService: AgencyAccountService,
    private readonly providerFactory: SocialMediaProviderFactory,
  ) {}

  // Ad Management
  async createAd(adData: {
    workspaceId: string;
    accountId: string;
    campaignId?: string;
    name: string;
    description?: string;
    objective: AdObjective;
    adType: AdType;
    headline?: string;
    primaryText?: string;
    callToAction?: string;
    linkUrl?: string;
    displayUrl?: string;
    budget?: number;
    bidAmount?: number;
    startDate?: Date;
    endDate?: Date;
    targeting?: Record<string, any>;
    creatives?: CreativeData[];
  }): Promise<SocialAd> {
    const account = await this.accountRepository.findOne({
      where: { id: adData.accountId, workspaceId: adData.workspaceId, isActive: true },
      relations: ['platform'],
    });

    if (!account) {
      throw new NotFoundException('Account not found or access denied');
    }

    // Get appropriate access token (agency or account)
    const tokenInfo = await this.getAccessTokenForAccount(adData.accountId);
    const accessToken = tokenInfo.accessToken;

    const provider = this.providerFactory.getProvider(account.platform.type);
    
    // Validate ad data
    const validation = await provider.validateAdData({
      name: adData.name,
      description: adData.description,
      objective: adData.objective,
      adType: adData.adType,
      headline: adData.headline,
      primaryText: adData.primaryText,
      callToAction: adData.callToAction,
      linkUrl: adData.linkUrl,
      displayUrl: adData.displayUrl,
      budget: adData.budget,
      bidAmount: adData.bidAmount,
      startDate: adData.startDate,
      endDate: adData.endDate,
      targeting: adData.targeting,
      creatives: adData.creatives,
    });

    if (!validation.valid) {
      throw new Error(`Ad validation failed: ${validation.errors.join(', ')}`);
    }

    // Create ad on the platform
    const platformAd = await provider.createAd(accessToken, {
      name: adData.name,
      description: adData.description,
      objective: adData.objective,
      adType: adData.adType,
      headline: adData.headline,
      primaryText: adData.primaryText,
      callToAction: adData.callToAction,
      linkUrl: adData.linkUrl,
      displayUrl: adData.displayUrl,
      budget: adData.budget,
      bidAmount: adData.bidAmount,
      startDate: adData.startDate,
      endDate: adData.endDate,
      targeting: adData.targeting,
      creatives: adData.creatives,
    });

    // Save ad to database
    const ad = this.adRepository.create({
      workspaceId: adData.workspaceId,
      accountId: adData.accountId,
      campaignId: adData.campaignId,
      name: adData.name,
      description: adData.description,
      externalAdId: platformAd.externalAdId,
      status: platformAd.status as AdStatus,
      objective: adData.objective,
      adType: adData.adType,
      headline: adData.headline,
      primaryText: adData.primaryText,
      callToAction: adData.callToAction,
      linkUrl: adData.linkUrl,
      displayUrl: adData.displayUrl,
      budget: adData.budget,
      bidAmount: adData.bidAmount,
      startDate: adData.startDate,
      endDate: adData.endDate,
      platformSpecificData: platformAd.platformSpecificData,
      isActive: true,
    });

    const savedAd = await this.adRepository.save(ad);

    // Save creatives if provided
    if (adData.creatives && adData.creatives.length > 0) {
      for (const creativeData of adData.creatives) {
        const creative = this.creativeRepository.create({
          adId: savedAd.id,
          name: creativeData.caption || 'Creative',
          type: creativeData.type as CreativeType,
          mediaUrl: creativeData.mediaUrl,
          thumbnailUrl: creativeData.thumbnailUrl,
          altText: creativeData.altText,
          caption: creativeData.caption,
          headline: creativeData.headline,
          description: creativeData.description,
          callToAction: creativeData.callToAction,
          linkUrl: creativeData.linkUrl,
          displayUrl: creativeData.displayUrl,
          metadata: creativeData.metadata,
          isActive: true,
        });

        await this.creativeRepository.save(creative);
      }
    }

    // Save targeting if provided
    if (adData.targeting) {
      const targeting = this.targetingRepository.create({
        adId: savedAd.id,
        name: 'Default Targeting',
        type: TargetingType.DEMOGRAPHIC,
        criteria: adData.targeting,
        isActive: true,
      });

      await this.targetingRepository.save(targeting);
    }

    return savedAd;
  }

  async getAds(workspaceId: string, accountId?: string): Promise<SocialAd[]> {
    const where: any = { workspaceId, isActive: true };
    if (accountId) {
      where.accountId = accountId;
    }

    return this.adRepository.find({
      where,
      relations: ['account', 'account.platform', 'campaign', 'creatives', 'targeting'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAd(adId: string, workspaceId: string): Promise<SocialAd> {
    const ad = await this.adRepository.findOne({
      where: { id: adId, workspaceId, isActive: true },
      relations: ['account', 'account.platform', 'campaign', 'creatives', 'targeting'],
    });

    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    return ad;
  }

  async updateAd(adId: string, workspaceId: string, updateData: Partial<SocialAd>): Promise<SocialAd> {
    const ad = await this.getAd(adId, workspaceId);
    
    // If updating external ad, sync with platform
    if (updateData.status || updateData.budget || updateData.bidAmount) {
      const account = await this.accountRepository.findOne({
        where: { id: ad.accountId },
        relations: ['platform'],
      });

      if (account && await this.authService.isAccountAuthenticated(ad.accountId)) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(ad.accountId);

        await provider.updateAd(accessToken, ad.externalAdId, {
          name: updateData.name,
          description: updateData.description,
          objective: updateData.objective,
          adType: updateData.adType,
          headline: updateData.headline,
          primaryText: updateData.primaryText,
          callToAction: updateData.callToAction,
          linkUrl: updateData.linkUrl,
          displayUrl: updateData.displayUrl,
          budget: updateData.budget,
          bidAmount: updateData.bidAmount,
          startDate: updateData.startDate,
          endDate: updateData.endDate,
        });
      }
    }

    Object.assign(ad, updateData);
    return this.adRepository.save(ad);
  }

  async deleteAd(adId: string, workspaceId: string): Promise<boolean> {
    const ad = await this.getAd(adId, workspaceId);

    // Delete from platform if authenticated
    if (await this.authService.isAccountAuthenticated(ad.accountId)) {
      const account = await this.accountRepository.findOne({
        where: { id: ad.accountId },
        relations: ['platform'],
      });

      if (account) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(ad.accountId);
        await provider.deleteAd(accessToken, ad.externalAdId);
      }
    }

    ad.isActive = false;
    await this.adRepository.save(ad);
    return true;
  }

  async pauseAd(adId: string, workspaceId: string): Promise<boolean> {
    const ad = await this.getAd(adId, workspaceId);

    if (await this.authService.isAccountAuthenticated(ad.accountId)) {
      const account = await this.accountRepository.findOne({
        where: { id: ad.accountId },
        relations: ['platform'],
      });

      if (account) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(ad.accountId);
        await provider.pauseAd(accessToken, ad.externalAdId);
      }
    }

    ad.status = AdStatus.PAUSED;
    await this.adRepository.save(ad);
    return true;
  }

  async resumeAd(adId: string, workspaceId: string): Promise<boolean> {
    const ad = await this.getAd(adId, workspaceId);

    if (await this.authService.isAccountAuthenticated(ad.accountId)) {
      const account = await this.accountRepository.findOne({
        where: { id: ad.accountId },
        relations: ['platform'],
      });

      if (account) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(ad.accountId);
        await provider.resumeAd(accessToken, ad.externalAdId);
      }
    }

    ad.status = AdStatus.ACTIVE;
    await this.adRepository.save(ad);
    return true;
  }

  // Performance & Analytics
  async getAdPerformance(adId: string, workspaceId: string, startDate: Date, endDate: Date): Promise<SocialAdPerformance[]> {
    const ad = await this.getAd(adId, workspaceId);

    // Get performance from platform if authenticated
    if (await this.authService.isAccountAuthenticated(ad.accountId)) {
      const account = await this.accountRepository.findOne({
        where: { id: ad.accountId },
        relations: ['platform'],
      });

      if (account) {
        const provider = this.providerFactory.getProvider(account.platform.type);
        const accessToken = await this.authService.getValidAccessToken(ad.accountId);
        const platformPerformance = await provider.getAdPerformance(accessToken, ad.externalAdId, startDate, endDate);

        // Save performance data to database
        for (const perf of platformPerformance) {
          const performance = this.performanceRepository.create({
            adId: ad.id,
            date: perf.date,
            metric: perf.metric as PerformanceMetric,
            value: perf.value,
            currency: perf.currency,
            breakdown: perf.breakdown,
            isActive: true,
          });

          await this.performanceRepository.save(performance);
        }
      }
    }

    // Return performance from database
    return this.performanceRepository.find({
      where: { adId: ad.id, isActive: true },
      order: { date: 'DESC' },
    });
  }

  async syncAdPerformance(adId: string, workspaceId: string): Promise<SocialAdPerformance[]> {
    const ad = await this.getAd(adId, workspaceId);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

    return this.getAdPerformance(adId, workspaceId, startDate, endDate);
  }

  // Creative Management
  async addCreative(adId: string, workspaceId: string, creativeData: CreativeData): Promise<SocialAdCreative> {
    const ad = await this.getAd(adId, workspaceId);

    const creative = this.creativeRepository.create({
      adId: ad.id,
      name: creativeData.caption || 'Creative',
      type: creativeData.type as CreativeType,
      mediaUrl: creativeData.mediaUrl,
      thumbnailUrl: creativeData.thumbnailUrl,
      altText: creativeData.altText,
      caption: creativeData.caption,
      headline: creativeData.headline,
      description: creativeData.description,
      callToAction: creativeData.callToAction,
      linkUrl: creativeData.linkUrl,
      displayUrl: creativeData.displayUrl,
      metadata: creativeData.metadata,
      isActive: true,
    });

    return this.creativeRepository.save(creative);
  }

  async getAdCreatives(adId: string, workspaceId: string): Promise<SocialAdCreative[]> {
    const ad = await this.getAd(adId, workspaceId);

    return this.creativeRepository.find({
      where: { adId: ad.id, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // Targeting Management
  async addTargeting(adId: string, workspaceId: string, targetingData: {
    name: string;
    type: TargetingType;
    criteria: Record<string, any>;
  }): Promise<SocialAdTargeting> {
    const ad = await this.getAd(adId, workspaceId);

    const targeting = this.targetingRepository.create({
      adId: ad.id,
      name: targetingData.name,
      type: targetingData.type,
      criteria: targetingData.criteria,
      isActive: true,
    });

    return this.targetingRepository.save(targeting);
  }

  async getAdTargeting(adId: string, workspaceId: string): Promise<SocialAdTargeting[]> {
    const ad = await this.getAd(adId, workspaceId);

    return this.targetingRepository.find({
      where: { adId: ad.id, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ==================== Helper Methods ====================

  /**
   * Get appropriate access token for account
   * If account is managed by agency, use agency token
   * Otherwise, use account's own token
   */
  private async getAccessTokenForAccount(accountId: string): Promise<{
    accessToken: string;
    isAgencyToken: boolean;
    agencyAccountId?: string;
  }> {
    // Check if account is managed by an agency
    const isManaged = await this.agencyAccountService.isAccountManagedByAgency(accountId);

    if (isManaged) {
      // Use agency token
      return this.agencyAccountService.getAccessTokenForAccount(accountId);
    } else {
      // Use account's own token
      const accessToken = await this.authService.getValidAccessToken(accountId);
      return {
        accessToken,
        isAgencyToken: false,
      };
    }
  }
}
