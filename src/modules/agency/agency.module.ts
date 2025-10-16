import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import {
  BusinessManager,
  SystemUser,
  AuthToken,
  PlatformAsset,
  AssetGroup,
  MetaCampaign,
  InsightData,
} from './entities';

// Services
import {
  MetaSdkService,
  BusinessManagerService,
  AssetManagementService,
  AssetGroupService,
  MarketingApiService,
  InsightsApiService,
  WorkspaceIntegrationService,
} from './services';

// Controllers
import {
  BusinessManagerController,
  AssetManagementController,
  CampaignController,
  InsightsController,
  WorkspaceIntegrationController,
} from './controllers';

// Repositories
import {
  BusinessManagerRepository,
  PlatformAssetRepository,
  InsightDataRepository,
} from './repositories';

// Guards
import { AgencyPermissionGuard } from './guards/agency-permission.guard';

// Shared modules
import { Workspace } from '../workspaces/entities/workspace.entity';
import { UserWorkspace } from '../rbac/entities/user-workspace.entity';
import { User } from '../authentication/entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      // Agency entities
      BusinessManager,
      SystemUser,
      AuthToken,
      PlatformAsset,
      AssetGroup,
      MetaCampaign,
      InsightData,
      // Related entities from other modules
      Workspace,
      UserWorkspace,
      User,
    ]),
  ],
  providers: [
    // Services
    MetaSdkService,
    BusinessManagerService,
    AssetManagementService,
    AssetGroupService,
    MarketingApiService,
    InsightsApiService,
    WorkspaceIntegrationService,
    // Repositories
    BusinessManagerRepository,
    PlatformAssetRepository,
    InsightDataRepository,
    // Guards
    AgencyPermissionGuard,
  ],
  controllers: [
    BusinessManagerController,
    AssetManagementController,
    CampaignController,
    InsightsController,
    WorkspaceIntegrationController,
  ],
  exports: [
    // Export services for use in other modules
    MetaSdkService,
    BusinessManagerService,
    AssetManagementService,
    AssetGroupService,
    MarketingApiService,
    InsightsApiService,
    WorkspaceIntegrationService,
  ],
})
export class AgencyModule {}

