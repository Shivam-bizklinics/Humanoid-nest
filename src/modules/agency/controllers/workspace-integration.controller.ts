import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { WorkspaceIntegrationService } from '../services';
import {
  OnboardPageAsWorkspaceDto,
  BatchOnboardPagesDto,
  LinkAdAccountToWorkspaceDto,
  AutoLinkBusinessAssetsDto,
  DiscoverAndOnboardPagesDto,
} from '../dto';
import { AgencyPermissionGuard } from '../guards/agency-permission.guard';

@ApiTags('Agency - Workspace Integration')
@ApiBearerAuth()
@Controller('agency/workspace-integration')
@UseGuards(JwtAuthGuard, AgencyPermissionGuard)
export class WorkspaceIntegrationController {
  constructor(
    private readonly workspaceIntegrationService: WorkspaceIntegrationService,
  ) {}

  @Post('onboard-page')
  @ApiOperation({ summary: 'Onboard page as workspace' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Page onboarded as workspace' })
  async onboardPageAsWorkspace(
    @Body() dto: OnboardPageAsWorkspaceDto,
    @CurrentUserId() userId: string,
  ) {
    return this.workspaceIntegrationService.onboardPageAsWorkspace(
      dto.pageAssetId,
      userId,
      {
        description: dto.description,
        autoLinkAssets: dto.autoLinkAssets,
      },
    );
  }

  @Post('batch-onboard-pages')
  @ApiOperation({ summary: 'Batch onboard multiple pages as workspaces' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Pages onboarded as workspaces' })
  async batchOnboardPages(
    @Body() dto: BatchOnboardPagesDto,
    @CurrentUserId() userId: string,
  ) {
    return this.workspaceIntegrationService.batchOnboardPages(
      dto.pageAssetIds,
      userId,
      dto.autoLinkAssets,
    );
  }

  @Post('link-ad-account')
  @ApiOperation({ summary: 'Link ad account to workspace' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ad account linked to workspace' })
  async linkAdAccountToWorkspace(
    @Body() dto: LinkAdAccountToWorkspaceDto,
    @CurrentUserId() userId: string,
  ) {
    return this.workspaceIntegrationService.linkAdAccountToWorkspace(
      dto.adAccountId,
      dto.workspaceId,
      userId,
    );
  }

  @Post('auto-link-assets')
  @ApiOperation({ summary: 'Auto-link all business assets to workspace' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Assets linked to workspace' })
  async autoLinkBusinessAssets(
    @Body() dto: AutoLinkBusinessAssetsDto,
    @CurrentUserId() userId: string,
  ) {
    const count = await this.workspaceIntegrationService.autoLinkBusinessAssets(
      dto.workspaceId,
      dto.businessManagerId,
      userId,
    );
    return { message: `Linked ${count} assets to workspace`, count };
  }

  @Get('workspace/:workspaceId/assets')
  @ApiOperation({ summary: 'Get workspace with associated assets' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Workspace and assets retrieved' })
  async getWorkspaceWithAssets(@Param('workspaceId') workspaceId: string) {
    return this.workspaceIntegrationService.getWorkspaceWithAssets(workspaceId);
  }

  @Get('workspace/:workspaceId/summary')
  @ApiOperation({ summary: 'Get workspace assets summary' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Workspace summary retrieved' })
  async getWorkspaceAssetsSummary(@Param('workspaceId') workspaceId: string) {
    return this.workspaceIntegrationService.getWorkspaceAssetsSummary(workspaceId);
  }

  @Post('workspace/:workspaceId/sync-brand-info')
  @ApiOperation({ summary: 'Sync workspace brand info from primary page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Workspace brand info synced' })
  async syncWorkspaceBrandInfo(
    @Param('workspaceId') workspaceId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.workspaceIntegrationService.syncWorkspaceBrandInfo(workspaceId, userId);
  }

  @Delete('asset/:assetId/unlink')
  @ApiOperation({ summary: 'Unlink asset from workspace' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset unlinked from workspace' })
  async unlinkAssetFromWorkspace(
    @Param('assetId') assetId: string,
    @CurrentUserId() userId: string,
  ) {
    await this.workspaceIntegrationService.unlinkAssetFromWorkspace(assetId, userId);
    return { message: 'Asset unlinked from workspace successfully' };
  }

  @Post('discover-and-onboard')
  @ApiOperation({ summary: 'Discover and onboard all pages from business manager' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Pages discovered and onboarded' })
  async discoverAndOnboardPages(
    @Body() dto: DiscoverAndOnboardPagesDto,
    @CurrentUserId() userId: string,
  ) {
    return this.workspaceIntegrationService.discoverAndOnboardPages(
      dto.businessManagerId,
      userId,
      dto.autoLinkAssets,
    );
  }

  @Get('user/workspaces')
  @ApiOperation({ summary: 'Get all user workspaces with asset counts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User workspaces retrieved' })
  async getUserWorkspacesWithAssets(@CurrentUserId() userId: string) {
    return this.workspaceIntegrationService.getUserWorkspacesWithAssets(userId);
  }
}

