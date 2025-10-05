import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocialAdCampaignService } from '../services/social-ad-campaign.service';
import { UserWorkspacePermissionGuard } from '../../rbac/guards/user-workspace-permission.guard';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { CampaignStatus, CampaignObjective, BudgetType } from '../entities/social-ad-campaign.entity';

@ApiTags('Social Ad Campaigns')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/social-ad-campaigns')
@UseGuards(UserWorkspacePermissionGuard)
export class SocialAdCampaignController {
  constructor(private readonly campaignService: SocialAdCampaignService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new social media campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.CREATE)
  async createCampaign(@Param('workspaceId') workspaceId: string, @Body() createCampaignDto: any, @Request() req) {
    const campaign = await this.campaignService.createCampaign({
      ...createCampaignDto,
      workspaceId,
    });
    return {
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get workspace campaigns' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  async getCampaigns(@Param('workspaceId') workspaceId: string, @Query('accountId') accountId?: string, @Request() req?) {
    const campaigns = await this.campaignService.getCampaigns(workspaceId, accountId);
    return {
      success: true,
      data: campaigns,
      message: 'Campaigns retrieved successfully',
    };
  }

  @Get(':campaignId')
  @ApiOperation({ summary: 'Get specific campaign details' })
  @ApiResponse({ status: 200, description: 'Campaign details retrieved successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  async getCampaign(@Param('workspaceId') workspaceId: string, @Param('campaignId') campaignId: string, @Request() req) {
    const campaign = await this.campaignService.getCampaign(campaignId, workspaceId);
    return {
      success: true,
      data: campaign,
      message: 'Campaign details retrieved successfully',
    };
  }

  @Put(':campaignId')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  async updateCampaign(@Param('campaignId') campaignId: string, @Body() updateCampaignDto: any, @Request() req) {
    const campaign = await this.campaignService.updateCampaign(campaignId, req.user.id, updateCampaignDto);
    return {
      success: true,
      data: campaign,
      message: 'Campaign updated successfully',
    };
  }

  @Delete(':campaignId')
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  async deleteCampaign(@Param('campaignId') campaignId: string, @Request() req) {
    await this.campaignService.deleteCampaign(campaignId, req.user.id);
    return {
      success: true,
      message: 'Campaign deleted successfully',
    };
  }

  @Post(':campaignId/pause')
  @ApiOperation({ summary: 'Pause campaign' })
  @ApiResponse({ status: 200, description: 'Campaign paused successfully' })
  async pauseCampaign(@Param('campaignId') campaignId: string, @Request() req) {
    await this.campaignService.pauseCampaign(campaignId, req.user.id);
    return {
      success: true,
      message: 'Campaign paused successfully',
    };
  }

  @Post(':campaignId/resume')
  @ApiOperation({ summary: 'Resume campaign' })
  @ApiResponse({ status: 200, description: 'Campaign resumed successfully' })
  async resumeCampaign(@Param('campaignId') campaignId: string, @Request() req) {
    await this.campaignService.resumeCampaign(campaignId, req.user.id);
    return {
      success: true,
      message: 'Campaign resumed successfully',
    };
  }

  @Get(':campaignId/performance')
  @ApiOperation({ summary: 'Get campaign performance data' })
  @ApiResponse({ status: 200, description: 'Performance data retrieved successfully' })
  async getCampaignPerformance(
    @Param('campaignId') campaignId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ) {
    const performance = await this.campaignService.getCampaignPerformance(
      campaignId,
      req.user.id,
      new Date(startDate),
      new Date(endDate),
    );
    return {
      success: true,
      data: performance,
      message: 'Performance data retrieved successfully',
    };
  }

  @Post(':campaignId/sync-performance')
  @ApiOperation({ summary: 'Sync campaign performance data from platform' })
  @ApiResponse({ status: 200, description: 'Performance data synced successfully' })
  async syncCampaignPerformance(@Param('campaignId') campaignId: string, @Request() req) {
    const performance = await this.campaignService.syncCampaignPerformance(campaignId, req.user.id);
    return {
      success: true,
      data: performance,
      message: 'Performance data synced successfully',
    };
  }

  @Get(':campaignId/ads')
  @ApiOperation({ summary: 'Get campaign ads' })
  @ApiResponse({ status: 200, description: 'Campaign ads retrieved successfully' })
  async getCampaignAds(@Param('campaignId') campaignId: string, @Request() req) {
    const ads = await this.campaignService.getCampaignAds(campaignId, req.user.id);
    return {
      success: true,
      data: ads,
      message: 'Campaign ads retrieved successfully',
    };
  }

  @Post(':campaignId/ads/:adId')
  @ApiOperation({ summary: 'Add ad to campaign' })
  @ApiResponse({ status: 200, description: 'Ad added to campaign successfully' })
  async addAdToCampaign(@Param('campaignId') campaignId: string, @Param('adId') adId: string, @Request() req) {
    const ad = await this.campaignService.addAdToCampaign(campaignId, adId, req.user.id);
    return {
      success: true,
      data: ad,
      message: 'Ad added to campaign successfully',
    };
  }

  @Delete(':campaignId/ads/:adId')
  @ApiOperation({ summary: 'Remove ad from campaign' })
  @ApiResponse({ status: 200, description: 'Ad removed from campaign successfully' })
  async removeAdFromCampaign(@Param('campaignId') campaignId: string, @Param('adId') adId: string, @Request() req) {
    const ad = await this.campaignService.removeAdFromCampaign(campaignId, adId, req.user.id);
    return {
      success: true,
      data: ad,
      message: 'Ad removed from campaign successfully',
    };
  }

  @Get(':campaignId/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  @ApiResponse({ status: 200, description: 'Campaign statistics retrieved successfully' })
  async getCampaignStats(@Param('campaignId') campaignId: string, @Request() req) {
    const stats = await this.campaignService.getCampaignStats(campaignId, req.user.id);
    return {
      success: true,
      data: stats,
      message: 'Campaign statistics retrieved successfully',
    };
  }
}
