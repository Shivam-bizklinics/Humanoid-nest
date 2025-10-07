import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/authentication/entities/user.entity';
import { Permission } from '../modules/rbac/entities/permission.entity';
import { UserWorkspace } from '../modules/rbac/entities/user-workspace.entity';
import { UserWorkspacePermission } from '../modules/rbac/entities/user-workspace-permission.entity';
import { Workspace } from '../modules/workspaces/entities/workspace.entity';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { Design } from '../modules/designer/entities/design.entity';
import { Publication } from '../modules/publisher/entities/publication.entity';
import { Approval } from '../modules/approval-workflow/entities/approval.entity';
import { SocialMediaPlatform } from '../modules/social-ads/entities/social-media-platform.entity';
import { SocialMediaAccount } from '../modules/social-ads/entities/social-media-account.entity';
import { SocialMediaAuth } from '../modules/social-ads/entities/social-media-auth.entity';
import { SocialAd } from '../modules/social-ads/entities/social-ad.entity';
import { SocialAdCampaign } from '../modules/social-ads/entities/social-ad-campaign.entity';
import { SocialAdCreative } from '../modules/social-ads/entities/social-ad-creative.entity';
import { SocialAdTargeting } from '../modules/social-ads/entities/social-ad-targeting.entity';
import { SocialAdPerformance } from '../modules/social-ads/entities/social-ad-performance.entity';
import { AgencyAccount } from '../modules/social-ads/entities/agency-account.entity';
import { AgencyAuth } from '../modules/social-ads/entities/agency-auth.entity';
import { BrandQuestion } from '../modules/workspaces/entities/brand-question.entity';
import { BrandQuestionResponse } from '../modules/workspaces/entities/brand-question-response.entity';
import { FileUpload } from '../modules/file-upload/entities/file-upload.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
                entities: [
                  User,
                  Permission,
                  UserWorkspace,
                  UserWorkspacePermission,
                  Workspace,
                  Campaign,
                  Design,
                  Publication,
                  Approval,
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
                  BrandQuestion,
                  BrandQuestionResponse,
                  FileUpload,
                ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}