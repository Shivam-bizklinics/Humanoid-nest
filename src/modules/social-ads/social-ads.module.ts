import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgencyAccountController } from './controllers/agency-account.controller';
import { SocialAdCampaignController } from './controllers/social-ad-campaign.controller';
import { SocialAdsController } from './controllers/social-ads.controller';
import { SocialMediaAuthController } from './controllers/social-media-auth.controller';
import { AgencyAccount } from './entities/agency-account.entity';
import { AgencyAuth } from './entities/agency-auth.entity';
import { SocialAdCampaign } from './entities/social-ad-campaign.entity';
import { SocialAdCreative } from './entities/social-ad-creative.entity';
import { SocialAdPerformance } from './entities/social-ad-performance.entity';
import { SocialAdTargeting } from './entities/social-ad-targeting.entity';
import { SocialAd } from './entities/social-ad.entity';
import { SocialMediaAccount } from './entities/social-media-account.entity';
import { SocialMediaAuth } from './entities/social-media-auth.entity';
import { SocialMediaPlatform } from './entities/social-media-platform.entity';
import { SocialMediaAuthGuard } from './guards/social-media-auth.guard';
import { AgencyAccountService } from './services/agency-account.service';
import { LinkedInService } from './services/providers/linkedin.service';
import { MetaService } from './services/providers/meta.service';
import { SnapchatService } from './services/providers/snapchat.service';
import { TwitterService } from './services/providers/twitter.service';
import { SocialAdCampaignService } from './services/social-ad-campaign.service';
import { SocialAdService } from './services/social-ad.service';
import { SocialMediaAuthService } from './services/social-media-auth.service';
import { SocialMediaProviderFactory } from './services/social-media-provider.factory';
import { SocialMediaService } from './services/social-media.service';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocialMediaPlatform,
      SocialMediaAccount,
      SocialMediaAuth,
      SocialAd,
      SocialAdCampaign,
      SocialAdCreative,
      SocialAdTargeting,
      SocialAdPerformance,
      AgencyAccount,
      AgencyAuth,
    ]),
    RbacModule,
  ],
  controllers: [
    SocialAdsController,
    SocialMediaAuthController,
    SocialAdCampaignController,
    AgencyAccountController,
  ],
  providers: [
    SocialMediaService,
    SocialMediaAuthService,
    SocialAdService,
    SocialAdCampaignService,
    AgencyAccountService,
    MetaService,
    LinkedInService,
    TwitterService,
    SnapchatService,
    SocialMediaProviderFactory,
    SocialMediaAuthGuard,
  ],
  exports: [
    SocialMediaService,
    SocialMediaAuthService,
    SocialAdService,
    SocialAdCampaignService,
    AgencyAccountService,
    SocialMediaProviderFactory,
  ],
})
export class SocialAdsModule {}
