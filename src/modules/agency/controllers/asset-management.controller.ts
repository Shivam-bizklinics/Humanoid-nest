import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { AssetManagementService, AssetGroupService } from '../services';
import {
  DiscoverAssetsDto,
  AssignAssetToWorkspaceDto,
  RequestAssetAccessDto,
  SyncAssetDto,
  GetAssetsByTypeDto,
  CreateAssetGroupDto,
  UpdateAssetGroupDto,
  AddAssetsToGroupDto,
  RemoveAssetsFromGroupDto,
} from '../dto';
import { AgencyPermissionGuard } from '../guards/agency-permission.guard';

@ApiTags('Agency - Asset Management')
@ApiBearerAuth()
@Controller('agency/assets')
@UseGuards(JwtAuthGuard, AgencyPermissionGuard)
export class AssetManagementController {
  constructor(
    private readonly assetManagementService: AssetManagementService,
    private readonly assetGroupService: AssetGroupService,
  ) {}

  @Post('discover')
  @ApiOperation({ summary: 'Discover and sync all assets for a business manager' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Assets discovered and synced' })
  async discoverBusinessAssets(
    @Body() dto: DiscoverAssetsDto,
    @CurrentUserId() userId: string,
  ) {
    return this.assetManagementService.discoverBusinessAssets(dto.businessManagerId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get assets by filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Assets retrieved' })
  async getAssets(@Query() query: GetAssetsByTypeDto) {
    if (query.workspaceId) {
      return this.assetManagementService.getAssetsByWorkspace(
        query.workspaceId,
        query.assetType,
      );
    }
    if (query.businessManagerId) {
      return this.assetManagementService.getAssetsByBusinessManager(
        query.businessManagerId,
        query.assetType,
      );
    }
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset retrieved' })
  async getAssetById(@Param('id') id: string) {
    return this.assetManagementService.getAssetById(id);
  }

  @Post('assign-workspace')
  @ApiOperation({ summary: 'Assign asset to workspace' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset assigned to workspace' })
  async assignAssetToWorkspace(
    @Body() dto: AssignAssetToWorkspaceDto,
    @CurrentUserId() userId: string,
  ) {
    return this.assetManagementService.assignAssetToWorkspace(
      dto.assetId,
      dto.workspaceId,
      userId,
    );
  }

  @Post('request-access')
  @ApiOperation({ summary: 'Request access to an asset' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset access requested' })
  async requestAssetAccess(
    @Body() dto: RequestAssetAccessDto,
    @CurrentUserId() userId: string,
  ) {
    await this.assetManagementService.requestAssetAccess(
      dto.assetId,
      dto.targetBusinessManagerId,
      dto.permission,
      userId,
    );
    return { message: 'Asset access requested successfully' };
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync asset data from platform' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset synced' })
  async syncAsset(
    @Body() dto: SyncAssetDto,
    @CurrentUserId() userId: string,
  ) {
    return this.assetManagementService.syncAsset(dto.assetId, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete asset' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset deleted' })
  async deleteAsset(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    await this.assetManagementService.deleteAsset(id, userId);
    return { message: 'Asset deleted successfully' };
  }

  // Asset Group endpoints
  @Post('groups')
  @ApiOperation({ summary: 'Create asset group' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Asset group created' })
  async createAssetGroup(
    @Body() dto: CreateAssetGroupDto,
    @CurrentUserId() userId: string,
  ) {
    return this.assetGroupService.createAssetGroup(
      dto.businessManagerId,
      dto.name,
      dto.description,
      dto.groupType,
      userId,
      dto.assetIds,
      dto.syncToPlatform,
    );
  }

  @Get('groups/business-manager/:businessManagerId')
  @ApiOperation({ summary: 'Get asset groups for a business manager' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset groups retrieved' })
  async getAssetGroupsByBusinessManager(@Param('businessManagerId') businessManagerId: string) {
    return this.assetGroupService.getAssetGroupsByBusinessManager(businessManagerId);
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get asset group by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset group retrieved' })
  async getAssetGroupById(@Param('id') id: string) {
    return this.assetGroupService.getAssetGroupById(id);
  }

  @Post('groups/:id/add-assets')
  @ApiOperation({ summary: 'Add assets to group' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Assets added to group' })
  async addAssetsToGroup(
    @Param('id') id: string,
    @Body() dto: AddAssetsToGroupDto,
    @CurrentUserId() userId: string,
  ) {
    return this.assetGroupService.addAssetsToGroup(id, dto.assetIds, userId);
  }

  @Post('groups/:id/remove-assets')
  @ApiOperation({ summary: 'Remove assets from group' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Assets removed from group' })
  async removeAssetsFromGroup(
    @Param('id') id: string,
    @Body() dto: RemoveAssetsFromGroupDto,
    @CurrentUserId() userId: string,
  ) {
    return this.assetGroupService.removeAssetsFromGroup(id, dto.assetIds, userId);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete asset group' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset group deleted' })
  async deleteAssetGroup(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    await this.assetGroupService.deleteAssetGroup(id, userId);
    return { message: 'Asset group deleted successfully' };
  }

  @Post('groups/discover/:businessManagerId')
  @ApiOperation({ summary: 'Discover asset groups from platform' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Asset groups discovered' })
  async discoverPlatformAssetGroups(
    @Param('businessManagerId') businessManagerId: string,
    @CurrentUserId() userId: string,
  ) {
    return this.assetGroupService.discoverPlatformAssetGroups(businessManagerId, userId);
  }
}

