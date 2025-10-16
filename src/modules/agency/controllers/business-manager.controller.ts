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
import { BusinessManagerService } from '../services';
import {
  CreateBusinessManagerDto,
  UpdateBusinessManagerDto,
  ConnectBusinessManagerDto,
  RequestBusinessAccessDto,
  CreateSystemUserDto,
  GenerateSystemUserTokenDto,
} from '../dto';
import { AgencyPermissionGuard } from '../guards/agency-permission.guard';

@ApiTags('Agency - Business Managers')
@ApiBearerAuth()
@Controller('agency/business-managers')
@UseGuards(JwtAuthGuard, AgencyPermissionGuard)
export class BusinessManagerController {
  constructor(private readonly businessManagerService: BusinessManagerService) {}

  @Post('parent')
  @ApiOperation({ summary: 'Create or get parent business manager (Humanoid main BM)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Parent business manager created/retrieved' })
  async createParentBusinessManager(
    @Body() dto: CreateBusinessManagerDto,
    @CurrentUserId() userId: string,
  ) {
    return this.businessManagerService.getOrCreateParentBusinessManager(
      dto.platform,
      dto.platformBusinessId,
      dto.name,
      userId,
    );
  }

  @Post('connect')
  @ApiOperation({ summary: 'Connect a child business manager (Client/Agency)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Child business manager connected' })
  async connectChildBusinessManager(
    @Body() dto: ConnectBusinessManagerDto,
    @CurrentUserId() userId: string,
  ) {
    return this.businessManagerService.connectChildBusinessManager(
      dto.platform,
      dto.platformBusinessId,
      dto.parentBusinessManagerId,
      dto.type,
      dto.relationship,
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business manager by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Business manager retrieved' })
  async getBusinessManagerById(@Param('id') id: string) {
    return this.businessManagerService.getBusinessManagerById(id);
  }

  @Get('parent/:parentId/children')
  @ApiOperation({ summary: 'Get child business managers' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Child business managers retrieved' })
  async getChildBusinessManagers(@Param('parentId') parentId: string) {
    return this.businessManagerService.getChildBusinessManagers(parentId);
  }

  @Get('user/me')
  @ApiOperation({ summary: 'Get business managers for current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Business managers retrieved' })
  async getBusinessManagersByUser(@CurrentUserId() userId: string) {
    return this.businessManagerService.getBusinessManagersByUser(userId);
  }

  @Get('user/me/or-parent')
  @ApiOperation({ summary: 'Get user business manager or parent BM if user has none' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Business manager retrieved' })
  async getUserOrParentBusinessManager(@CurrentUserId() userId: string) {
    return this.businessManagerService.getOrCreateUserBusinessManager(userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update business manager' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Business manager updated' })
  async updateBusinessManager(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessManagerDto,
    @CurrentUserId() userId: string,
  ) {
    if (dto.status) {
      return this.businessManagerService.updateBusinessManagerStatus(id, dto.status, userId);
    }
    // Add more update logic as needed
    return this.businessManagerService.getBusinessManagerById(id);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync business manager data from platform' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Business manager synced' })
  async syncBusinessManager(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.businessManagerService.syncBusinessManager(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete business manager' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Business manager deleted' })
  async deleteBusinessManager(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
  ) {
    await this.businessManagerService.deleteBusinessManager(id, userId);
    return { message: 'Business manager deleted successfully' };
  }

  @Post('request-access')
  @ApiOperation({ summary: 'Request access to a business manager' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Access request sent' })
  async requestBusinessAccess(
    @Body() dto: RequestBusinessAccessDto,
    @CurrentUserId() userId: string,
  ) {
    await this.businessManagerService.requestBusinessAccess(
      dto.targetBusinessId,
      dto.parentBusinessManagerId,
      userId,
      dto.platform,
    );
    return { message: 'Access request sent successfully' };
  }

  // System User endpoints
  @Post('system-users')
  @ApiOperation({ summary: 'Create system user for a business manager' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'System user created' })
  async createSystemUser(
    @Body() dto: CreateSystemUserDto,
    @CurrentUserId() userId: string,
  ) {
    return this.businessManagerService.createSystemUser(
      dto.businessManagerId,
      dto.name,
      dto.role,
      userId,
      dto.platform,
    );
  }

  @Post('system-users/generate-token')
  @ApiOperation({ summary: 'Generate access token for system user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Access token generated' })
  async generateSystemUserToken(
    @Body() dto: GenerateSystemUserTokenDto,
    @CurrentUserId() userId: string,
  ) {
    return this.businessManagerService.generateSystemUserToken(
      dto.systemUserId,
      dto.appId,
      dto.scope,
      userId,
    );
  }
}

