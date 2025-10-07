import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocialAdService } from '../services/social-ad.service';
import { SocialAdCampaignService } from '../services/social-ad-campaign.service';
import { SocialMediaService } from '../services/social-media.service';
import { SocialMediaAuthGuard } from '../guards/social-media-auth.guard';
import { UserWorkspacePermissionGuard } from '../../rbac/guards/user-workspace-permission.guard';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { AdStatus, AdObjective, AdType } from '../entities/social-ad.entity';
import { CampaignStatus, CampaignObjective, BudgetType } from '../entities/social-ad-campaign.entity';
import { PlatformType } from '../entities/social-media-platform.entity';

@ApiTags('Social Ads')
@ApiBearerAuth()
@Controller('workspaces/:workspaceId/social-ads')
@UseGuards(UserWorkspacePermissionGuard)
export class SocialAdsController {
  constructor(
    private readonly socialAdService: SocialAdService,
    private readonly campaignService: SocialAdCampaignService,
    private readonly socialMediaService: SocialMediaService,
  ) {}

  // Platform Management
  @Get('platforms')
  @ApiOperation({ summary: 'Get all supported social media platforms' })
  @ApiResponse({ status: 200, description: 'Platforms retrieved successfully' })
  async getPlatforms() {
    const platforms = await this.socialMediaService.getPlatforms();
    return {
      success: true,
      data: platforms,
      message: 'Platforms retrieved successfully',
    };
  }

  @Get('platforms/:type')
  @ApiOperation({ summary: 'Get specific platform details' })
  @ApiResponse({ status: 200, description: 'Platform details retrieved successfully' })
  async getPlatform(@Param('type') type: PlatformType) {
    const platform = await this.socialMediaService.getPlatform(type);
    return {
      success: true,
      data: platform,
      message: 'Platform details retrieved successfully',
    };
  }

  @Get('platforms/:type/features')
  @ApiOperation({ summary: 'Get platform features' })
  @ApiResponse({ status: 200, description: 'Platform features retrieved successfully' })
  async getPlatformFeatures(@Param('type') type: PlatformType) {
    const features = await this.socialMediaService.getPlatformFeatures(type);
    return {
      success: true,
      data: features,
      message: 'Platform features retrieved successfully',
    };
  }

  // Account Management
  @Get('accounts')
  @ApiOperation({ summary: 'Get workspace social media accounts' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  async getWorkspaceAccounts(@Param('workspaceId') workspaceId: string) {
    const accounts = await this.socialMediaService.getWorkspaceAccounts(workspaceId);
    return {
      success: true,
      data: accounts,
      message: 'Accounts retrieved successfully',
    };
  }

  @Get('accounts/:accountId')
  @ApiOperation({ summary: 'Get specific account details' })
  @ApiResponse({ status: 200, description: 'Account details retrieved successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  async getAccount(@Param('workspaceId') workspaceId: string, @Param('accountId') accountId: string) {
    const account = await this.socialMediaService.getAccount(accountId);
    return {
      success: true,
      data: account,
      message: 'Account details retrieved successfully',
    };
  }

  @Post('accounts/:accountId/sync')
  @ApiOperation({ summary: 'Sync account data from platform' })
  @ApiResponse({ status: 200, description: 'Account synced successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @UseGuards(SocialMediaAuthGuard)
  async syncAccount(@Param('workspaceId') workspaceId: string, @Param('accountId') accountId: string, @CurrentUserId() userId: string) {
    const account = await this.socialMediaService.syncAccount(accountId, userId);
    return {
      success: true,
      data: account,
      message: 'Account synced successfully',
    };
  }

  // Ad Management
  @Post('ads')
  @ApiOperation({ summary: 'Create a new social media ad' })
  @ApiResponse({ status: 201, description: 'Ad created successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.CREATE)
  @UseGuards(SocialMediaAuthGuard)
  async createAd(@Param('workspaceId') workspaceId: string, @Body() createAdDto: any) {
    const ad = await this.socialAdService.createAd({
      ...createAdDto,
      workspaceId,
    });
    return {
      success: true,
      data: ad,
      message: 'Ad created successfully',
    };
  }

  @Get('ads')
  @ApiOperation({ summary: 'Get workspace ads' })
  @ApiResponse({ status: 200, description: 'Ads retrieved successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  async getAds(@Param('workspaceId') workspaceId: string, @Query('accountId') accountId?: string) {
    const ads = await this.socialAdService.getAds(workspaceId, accountId);
    return {
      success: true,
      data: ads,
      message: 'Ads retrieved successfully',
    };
  }

  @Get('ads/:adId')
  @ApiOperation({ summary: 'Get specific ad details' })
  @ApiResponse({ status: 200, description: 'Ad details retrieved successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  async getAd(@Param('workspaceId') workspaceId: string, @Param('adId') adId: string) {
    const ad = await this.socialAdService.getAd(adId, workspaceId);
    return {
      success: true,
      data: ad,
      message: 'Ad details retrieved successfully',
    };
  }

  @Put('ads/:adId')
  @ApiOperation({ summary: 'Update ad' })
  @ApiResponse({ status: 200, description: 'Ad updated successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @UseGuards(SocialMediaAuthGuard)
  async updateAd(@Param('workspaceId') workspaceId: string, @Param('adId') adId: string, @Body() updateAdDto: any) {
    const ad = await this.socialAdService.updateAd(adId, workspaceId, updateAdDto);
    return {
      success: true,
      data: ad,
      message: 'Ad updated successfully',
    };
  }

  @Delete('ads/:adId')
  @ApiOperation({ summary: 'Delete ad' })
  @ApiResponse({ status: 200, description: 'Ad deleted successfully' })
  @RequirePermission(Resource.WORKSPACE, Action.DELETE)
  @UseGuards(SocialMediaAuthGuard)
  async deleteAd(@Param('workspaceId') workspaceId: string, @Param('adId') adId: string) {
    await this.socialAdService.deleteAd(adId, workspaceId);
    return {
      success: true,
      message: 'Ad deleted successfully',
    };
  }

  @Post('ads/:adId/pause')
  @ApiOperation({ summary: 'Pause ad' })
  @ApiResponse({ status: 200, description: 'Ad paused successfully' })
  @UseGuards(SocialMediaAuthGuard)
  async pauseAd(@Param('adId') adId: string, @CurrentUserId() userId: string) {
    await this.socialAdService.pauseAd(adId, userId);
    return {
      success: true,
      message: 'Ad paused successfully',
    };
  }

  @Post('ads/:adId/resume')
  @ApiOperation({ summary: 'Resume ad' })
  @ApiResponse({ status: 200, description: 'Ad resumed successfully' })
  @UseGuards(SocialMediaAuthGuard)
  async resumeAd(@Param('adId') adId: string, @CurrentUserId() userId: string) {
    await this.socialAdService.resumeAd(adId, userId);
    return {
      success: true,
      message: 'Ad resumed successfully',
    };
  }

  @Get('ads/:adId/performance')
  @ApiOperation({ summary: 'Get ad performance data' })
  @ApiResponse({ status: 200, description: 'Performance data retrieved successfully' })
  async getAdPerformance(
    @Param('adId') adId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUserId() userId: string,
  ) {
    const performance = await this.socialAdService.getAdPerformance(
      adId,
      userId,
      new Date(startDate),
      new Date(endDate),
    );
    return {
      success: true,
      data: performance,
      message: 'Performance data retrieved successfully',
    };
  }

  @Post('ads/:adId/sync-performance')
  @ApiOperation({ summary: 'Sync ad performance data from platform' })
  @ApiResponse({ status: 200, description: 'Performance data synced successfully' })
  @UseGuards(SocialMediaAuthGuard)
  async syncAdPerformance(@Param('adId') adId: string, @CurrentUserId() userId: string) {
    const performance = await this.socialAdService.syncAdPerformance(adId, userId);
    return {
      success: true,
      data: performance,
      message: 'Performance data synced successfully',
    };
  }

  // Creative Management
  @Post('ads/:adId/creatives')
  @ApiOperation({ summary: 'Add creative to ad' })
  @ApiResponse({ status: 201, description: 'Creative added successfully' })
  async addCreative(@Param('adId') adId: string, @Body() creativeData: any, @CurrentUserId() userId: string) {
    const creative = await this.socialAdService.addCreative(adId, userId, creativeData);
    return {
      success: true,
      data: creative,
      message: 'Creative added successfully',
    };
  }

  @Get('ads/:adId/creatives')
  @ApiOperation({ summary: 'Get ad creatives' })
  @ApiResponse({ status: 200, description: 'Creatives retrieved successfully' })
  async getAdCreatives(@Param('adId') adId: string, @CurrentUserId() userId: string) {
    const creatives = await this.socialAdService.getAdCreatives(adId, userId);
    return {
      success: true,
      data: creatives,
      message: 'Creatives retrieved successfully',
    };
  }

  // Targeting Management
  @Post('ads/:adId/targeting')
  @ApiOperation({ summary: 'Add targeting to ad' })
  @ApiResponse({ status: 201, description: 'Targeting added successfully' })
  async addTargeting(@Param('adId') adId: string, @Body() targetingData: any, @CurrentUserId() userId: string) {
    const targeting = await this.socialAdService.addTargeting(adId, userId, targetingData);
    return {
      success: true,
      data: targeting,
      message: 'Targeting added successfully',
    };
  }

  @Get('ads/:adId/targeting')
  @ApiOperation({ summary: 'Get ad targeting' })
  @ApiResponse({ status: 200, description: 'Targeting retrieved successfully' })
  async getAdTargeting(@Param('adId') adId: string, @CurrentUserId() userId: string) {
    const targeting = await this.socialAdService.getAdTargeting(adId, userId);
    return {
      success: true,
      data: targeting,
      message: 'Targeting retrieved successfully',
    };
  }
}
