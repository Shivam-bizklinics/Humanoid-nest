import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { InsightsApiService } from '../services';
import {
  FetchAdAccountInsightsDto,
  FetchCampaignInsightsDto,
  GetWorkspaceInsightsDto,
  GetCampaignsInsightsDto,
  GetTopPerformingCampaignsDto,
  BatchFetchInsightsDto,
} from '../dto';
import { AgencyPermissionGuard } from '../guards/agency-permission.guard';

@ApiTags('Agency - Insights & Analytics')
@ApiBearerAuth()
@Controller('agency/insights')
@UseGuards(JwtAuthGuard, AgencyPermissionGuard)
export class InsightsController {
  constructor(private readonly insightsApiService: InsightsApiService) {}

  @Post('ad-account/fetch')
  @ApiOperation({ summary: 'Fetch and store insights for ad account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ad account insights fetched' })
  async fetchAdAccountInsights(
    @Body() dto: FetchAdAccountInsightsDto,
    @CurrentUserId() userId: string,
  ) {
    return this.insightsApiService.fetchAdAccountInsights(
      dto.adAccountId,
      dto.datePreset,
      userId,
      dto.startDate && dto.endDate
        ? { startDate: dto.startDate, endDate: dto.endDate }
        : undefined,
    );
  }

  @Post('campaign/fetch')
  @ApiOperation({ summary: 'Fetch and store insights for campaign' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign insights fetched' })
  async fetchCampaignInsights(
    @Body() dto: FetchCampaignInsightsDto,
    @CurrentUserId() userId: string,
  ) {
    return this.insightsApiService.fetchCampaignInsights(
      dto.campaignId,
      dto.datePreset,
      userId,
      dto.startDate && dto.endDate
        ? { startDate: dto.startDate, endDate: dto.endDate }
        : undefined,
      dto.breakdowns,
    );
  }

  @Post('workspace')
  @ApiOperation({ summary: 'Get aggregated insights for workspace' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Workspace insights retrieved' })
  async getWorkspaceInsights(@Body() dto: GetWorkspaceInsightsDto) {
    return this.insightsApiService.getWorkspaceInsights(
      dto.workspaceId,
      dto.startDate,
      dto.endDate,
    );
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Get insights for multiple campaigns' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Campaign insights retrieved' })
  async getCampaignsInsights(@Body() dto: GetCampaignsInsightsDto) {
    const insightsMap = await this.insightsApiService.getCampaignsInsights(
      dto.campaignIds,
      dto.startDate,
      dto.endDate,
    );
    
    // Convert Map to array for JSON response
    return Array.from(insightsMap.values());
  }

  @Post('top-performing')
  @ApiOperation({ summary: 'Get top performing campaigns' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Top performing campaigns retrieved' })
  async getTopPerformingCampaigns(@Body() dto: GetTopPerformingCampaignsDto) {
    return this.insightsApiService.getTopPerformingCampaigns(
      dto.workspaceId,
      dto.metric,
      dto.limit || 10,
      dto.startDate,
      dto.endDate,
    );
  }

  @Post('batch/fetch')
  @ApiOperation({ summary: 'Batch fetch insights for multiple ad accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch insights fetched' })
  async batchFetchInsights(
    @Body() dto: BatchFetchInsightsDto,
    @CurrentUserId() userId: string,
  ) {
    const resultsMap = await this.insightsApiService.batchFetchInsights(
      dto.adAccountIds,
      dto.datePreset,
      userId,
    );
    
    // Convert Map to object for JSON response
    const results: any = {};
    resultsMap.forEach((value, key) => {
      results[key] = value;
    });
    
    return results;
  }
}

