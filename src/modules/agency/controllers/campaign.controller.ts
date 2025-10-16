import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { MarketingApiService } from '../services';
import {
  CreateMetaCampaignDto,
  UpdateMetaCampaignDto,
  BatchCreateCampaignsDto,
  BatchUpdateCampaignStatusDto,
  SyncCampaignDto,
  SyncAdAccountCampaignsDto,
} from '../dto';
import { AgencyPermissionGuard } from '../guards/agency-permission.guard';

@ApiTags('Agency - Campaigns')
@ApiBearerAuth()
@Controller('agency/campaigns')
@UseGuards(JwtAuthGuard, AgencyPermissionGuard)
export class CampaignController {
  constructor(private readonly marketingApiService: MarketingApiService) {}

  @Post()
  @ApiOperation({ summary: 'Create Meta campaign' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Campaign created' })
  async createCampaign(
    @Body() dto: CreateMetaCampaignDto,
    @CurrentUserId() userId: string,
  ) {
    return this.marketingApiService.createMetaCampaign(
      dto.adAccountId,
      dto.name,
      dto.objective,
      dto.status,
      userId,
      {
        dailyBudget: dto.dailyBudget,
        lifetimeBudget: dto.lifetimeBudget,
        bidStrategy: dto.bidStrategy,
        specialAdCategories: dto.specialAdCategories,
        startTime: dto.startTime,
        stopTime: dto.stopTime,
      },
    );
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch create campaigns' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Campaigns created' })
  async batchCreateCampaigns(
    @Body() dto: BatchCreateCampaignsDto,
    @CurrentUserId() userId: string,
  ) {
    const campaigns = dto.campaigns.map(campaign => ({
      ...campaign,
      adAccountId: dto.adAccountId,
    }));
    
    return this.marketingApiService.batchCreateCampaigns(campaigns, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign retrieved' })
  async getCampaignById(@Param('id') id: string) {
    return this.marketingApiService.getCampaignById(id);
  }

  @Get('ad-account/:adAccountId')
  @ApiOperation({ summary: 'Get campaigns for ad account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaigns retrieved' })
  async getCampaignsByAdAccount(@Param('adAccountId') adAccountId: string) {
    return this.marketingApiService.getCampaignsByAdAccount(adAccountId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign updated' })
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateMetaCampaignDto,
    @CurrentUserId() userId: string,
  ) {
    return this.marketingApiService.updateMetaCampaign(id, userId, dto);
  }

  @Post('batch/update-status')
  @ApiOperation({ summary: 'Batch update campaign statuses' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign statuses updated' })
  async batchUpdateCampaignStatus(
    @Body() dto: BatchUpdateCampaignStatusDto,
    @CurrentUserId() userId: string,
  ) {
    const count = await this.marketingApiService.batchUpdateCampaignStatus(
      dto.campaignIds,
      dto.status,
      userId,
    );
    return { message: `Updated ${count} campaigns`, count };
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync campaign from platform' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign synced' })
  async syncCampaign(
    @Body() dto: SyncCampaignDto,
    @CurrentUserId() userId: string,
  ) {
    return this.marketingApiService.syncMetaCampaign(dto.campaignId, userId);
  }

  @Post('sync/ad-account')
  @ApiOperation({ summary: 'Sync all campaigns for ad account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ad account campaigns synced' })
  async syncAdAccountCampaigns(
    @Body() dto: SyncAdAccountCampaignsDto,
    @CurrentUserId() userId: string,
  ) {
    return this.marketingApiService.syncAdAccountCampaigns(dto.adAccountId, userId);
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get campaign performance summary' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign performance retrieved' })
  async getCampaignPerformance(@Param('id') id: string) {
    return this.marketingApiService.getCampaignPerformance(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign deleted' })
  async deleteCampaign(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    await this.marketingApiService.deleteMetaCampaign(id, userId);
    return { message: 'Campaign deleted successfully' };
  }
}

