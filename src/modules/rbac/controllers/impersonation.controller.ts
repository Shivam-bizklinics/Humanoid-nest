import { Controller, Get, Post, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserWorkspacePermissionGuard } from '../guards/user-workspace-permission.guard';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { ImpersonationService, StartImpersonationDto } from '../services/impersonation.service';
import { User } from '../../authentication/entities/user.entity';

@ApiTags('User Impersonation')
@ApiBearerAuth()
@Controller('impersonation')
@UseGuards(UserWorkspacePermissionGuard)
export class ImpersonationController {
  constructor(private readonly impersonationService: ImpersonationService) {}

  @Post('start')
  @RequirePermission(Resource.USER, Action.IMPERSONATE)
  @ApiOperation({ summary: 'Start impersonating another user' })
  @ApiResponse({ status: 201, description: 'Impersonation started successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions to impersonate' })
  async startImpersonation(
    @Body() startImpersonationDto: StartImpersonationDto,
    @CurrentUserId() impersonatorId: string,
  ) {
    const session = await this.impersonationService.startImpersonation(
      impersonatorId,
      startImpersonationDto,
    );

    return {
      success: true,
      data: session,
      message: 'Impersonation started successfully',
    };
  }

  @Post('stop/:sessionId')
  @RequirePermission(Resource.USER, Action.IMPERSONATE)
  @ApiOperation({ summary: 'Stop impersonation session' })
  @ApiResponse({ status: 200, description: 'Impersonation stopped successfully' })
  async stopImpersonation(
    @Param('sessionId') sessionId: string,
    @CurrentUserId() userId: string,
  ) {
    const session = await this.impersonationService.endImpersonation(sessionId, userId);

    return {
      success: true,
      data: session,
      message: 'Impersonation stopped successfully',
    };
  }

  @Get('active')
  @RequirePermission(Resource.USER, Action.IMPERSONATE)
  @ApiOperation({ summary: 'Get active impersonation session' })
  @ApiResponse({ status: 200, description: 'Active session retrieved successfully' })
  async getActiveSession(@CurrentUserId() userId: string) {
    const session = await this.impersonationService.getActiveImpersonationSession(userId);

    return {
      success: true,
      data: session,
      message: session ? 'Active session found' : 'No active session',
    };
  }

  @Get('context')
  @RequirePermission(Resource.USER, Action.IMPERSONATE)
  @ApiOperation({ summary: 'Get current impersonation context' })
  @ApiResponse({ status: 200, description: 'Impersonation context retrieved successfully' })
  async getImpersonationContext(@CurrentUserId() userId: string) {
    const context = await this.impersonationService.getImpersonationContext(userId);

    return {
      success: true,
      data: context,
      message: context ? 'Impersonation context found' : 'Not in impersonation mode',
    };
  }

  @Get('users')
  @RequirePermission(Resource.USER, Action.IMPERSONATE)
  @ApiOperation({ summary: 'Get all users that can be impersonated' })
  @ApiResponse({ status: 200, description: 'Impersonatable users retrieved successfully' })
  async getImpersonatableUsers(@CurrentUserId() userId: string) {
    const users = await this.impersonationService.getImpersonatableUsers(userId);

    return {
      success: true,
      data: users,
      message: `${users.length} users available for impersonation`,
    };
  }

  @Get('history')
  @RequirePermission(Resource.USER, Action.IMPERSONATE)
  @ApiOperation({ summary: 'Get impersonation history' })
  @ApiResponse({ status: 200, description: 'Impersonation history retrieved successfully' })
  async getImpersonationHistory(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: string,
  ) {
    const sessions = await this.impersonationService.getImpersonationHistory(
      userId,
      limit ? parseInt(limit) : 50,
    );

    return {
      success: true,
      data: sessions,
      message: `${sessions.length} impersonation sessions found`,
    };
  }

  @Get('admin/all-active')
  @RequirePermission(Resource.USER, Action.IMPERSONATE)
  @ApiOperation({ summary: 'Get all active impersonation sessions (Admin only)' })
  @ApiResponse({ status: 200, description: 'All active sessions retrieved successfully' })
  async getAllActiveSessions() {
    const sessions = await this.impersonationService.getAllActiveSessions();

    return {
      success: true,
      data: sessions,
      message: `${sessions.length} active impersonation sessions found`,
    };
  }

  @Post('check-permissions')
  @RequirePermission(Resource.USER, Action.IMPERSONATE)
  @ApiOperation({ summary: 'Check if user can impersonate' })
  @ApiResponse({ status: 200, description: 'Permission check completed' })
  async checkImpersonationPermissions(@CurrentUserId() userId: string) {
    const canImpersonate = await this.impersonationService.canImpersonate(userId);

    return {
      success: true,
      data: { canImpersonate },
      message: canImpersonate 
        ? 'User can impersonate other users' 
        : 'User cannot impersonate other users',
    };
  }
}
