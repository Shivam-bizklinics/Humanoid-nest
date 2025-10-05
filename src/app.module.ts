import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { SharedModule } from './shared/shared.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { DesignerModule } from './modules/designer/designer.module';
import { PublisherModule } from './modules/publisher/publisher.module';
import { ApprovalWorkflowModule } from './modules/approval-workflow/approval-workflow.module';
import { SocialAdsModule } from './modules/social-ads/social-ads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    DatabaseModule,
    AuthenticationModule,
    RbacModule,
    WorkspacesModule,
    CampaignsModule,
    DesignerModule,
    PublisherModule,
    ApprovalWorkflowModule,
    SocialAdsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
