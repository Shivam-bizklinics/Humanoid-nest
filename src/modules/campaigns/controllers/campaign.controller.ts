import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserWorkspacePermissionGuard } from '../../rbac/guards/user-workspace-permission.guard';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { CampaignService } from '../services/campaign.service';
import { 
  CreateCampaignDto, 
  UpdateCampaignDto, 
  CampaignWithPillarsResponseDto,
  ContentPillarSelectionDto 
} from '../dto/campaign.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
@UseGuards(UserWorkspacePermissionGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get('system-content-pillars')
  @RequirePermission(Resource.CAMPAIGN, Action.VIEW)
  @ApiOperation({ summary: 'Get all available system content pillars' })
  @ApiResponse({ status: 200, description: 'System content pillars retrieved successfully' })
  async getSystemContentPillars() {
    const pillars = await this.campaignService.getSystemContentPillarsWithDisplayNames();
    return {
      success: true,
      data: pillars,
      message: 'System content pillars retrieved successfully'
    };
  }

  @Post()
  @RequirePermission(Resource.CAMPAIGN, Action.CREATE)
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async createCampaign(@Body() createCampaignDto: CreateCampaignDto, @CurrentUserId() userId: string) {
    const campaign = await this.campaignService.createCampaign({
      ...createCampaignDto,
      createdBy: userId,
    });

    return {
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    };
  }

  @Get(':campaignId')
  @RequirePermission(Resource.CAMPAIGN, Action.VIEW)
  @ApiOperation({ summary: 'Get campaign with content pillars information' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved successfully', type: CampaignWithPillarsResponseDto })
  async getCampaignWithPillars(@Param('campaignId') campaignId: string) {
    const result = await this.campaignService.getCampaignWithPillars(campaignId);
    
    const response = {
      ...result.campaign,
      selectedContentPillars: result.selectedContentPillars,
      availableSystemPillars: result.availableSystemPillars,
    };

    return {
      success: true,
      data: response,
      message: 'Campaign retrieved successfully'
    };
  }

  @Put(':campaignId')
  @RequirePermission(Resource.CAMPAIGN, Action.UPDATE)
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  async updateCampaign(
    @Param('campaignId') campaignId: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
    @CurrentUserId() userId: string,
  ) {
    const campaign = await this.campaignService.updateCampaign(campaignId, {
      ...updateCampaignDto,
      updatedBy: userId,
    });

    return {
      success: true,
      data: campaign,
      message: 'Campaign updated successfully'
    };
  }

  @Put(':campaignId/content-pillars')
  @RequirePermission(Resource.CAMPAIGN, Action.UPDATE)
  @ApiOperation({ summary: 'Update campaign content pillars selection' })
  @ApiResponse({ status: 200, description: 'Campaign content pillars updated successfully' })
  async updateCampaignContentPillars(
    @Param('campaignId') campaignId: string,
    @Body() contentPillarSelectionDto: ContentPillarSelectionDto,
    @CurrentUserId() userId: string,
  ) {
    const campaign = await this.campaignService.updateCampaign(campaignId, {
      contentPillars: contentPillarSelectionDto.contentPillars,
      updatedBy: userId,
    });

    return {
      success: true,
      data: campaign,
      message: 'Campaign content pillars updated successfully'
    };
  }

  @Delete(':campaignId')
  @RequirePermission(Resource.CAMPAIGN, Action.DELETE)
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  async deleteCampaign(@Param('campaignId') campaignId: string) {
    const deleted = await this.campaignService.deleteCampaign(campaignId);

    return {
      success: deleted,
      message: deleted ? 'Campaign deleted successfully' : 'Campaign not found'
    };
  }

  @Get('workspace/:workspaceId')
  @RequirePermission(Resource.CAMPAIGN, Action.VIEW)
  @ApiOperation({ summary: 'Get all campaigns for a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace campaigns retrieved successfully' })
  async getWorkspaceCampaigns(@Param('workspaceId') workspaceId: string) {
    const campaigns = await this.campaignService.getWorkspaceCampaigns(workspaceId);

    return {
      success: true,
      data: campaigns,
      message: 'Workspace campaigns retrieved successfully'
    };
  }
}
