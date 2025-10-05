import { Controller, Get, Post, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserWorkspacePermissionService, AssignPermissionDto, UserWorkspacePermissionsDto } from '../services/user-workspace-permission.service';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';

@ApiTags('User Workspace Permissions')
@ApiBearerAuth()
@Controller('user-workspace-permissions')
export class UserWorkspacePermissionController {
  constructor(
    private readonly userWorkspacePermissionService: UserWorkspacePermissionService,
  ) {}

  @Post('assign')
  @ApiOperation({ summary: 'Assign permission to user for workspace' })
  @ApiResponse({ status: 201, description: 'Permission assigned successfully' })
  @ApiResponse({ status: 403, description: 'Only Super Admins can assign permissions' })
  @ApiResponse({ status: 404, description: 'User, workspace, or permission not found' })
  async assignPermission(
    @Body() assignDto: AssignPermissionDto,
    @Request() req,
  ) {
    const userWorkspacePermission = await this.userWorkspacePermissionService.assignPermission(
      assignDto,
      req.user.id
    );

    return {
      success: true,
      data: userWorkspacePermission,
      message: 'Permission assigned successfully'
    };
  }

  @Post('assign-multiple')
  @ApiOperation({ summary: 'Assign multiple permissions to user for workspace' })
  @ApiResponse({ status: 201, description: 'Permissions assigned successfully' })
  @ApiResponse({ status: 403, description: 'Only Super Admins can assign permissions' })
  async assignMultiplePermissions(
    @Body() assignDto: UserWorkspacePermissionsDto,
    @Request() req,
  ) {
    const userWorkspacePermissions = await this.userWorkspacePermissionService.assignMultiplePermissions(
      assignDto,
      req.user.id
    );

    return {
      success: true,
      data: userWorkspacePermissions,
      message: 'Permissions assigned successfully'
    };
  }

  @Delete('remove/:userId/:workspaceId')
  @ApiOperation({ summary: 'Remove specific permission from user for workspace' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  async removePermission(
    @Param('userId') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('resource') resource: Resource,
    @Query('action') action: Action,
  ) {
    const removed = await this.userWorkspacePermissionService.removePermission(
      userId,
      workspaceId,
      resource,
      action
    );

    if (!removed) {
      return {
        success: false,
        message: 'Permission not found or could not be removed'
      };
    }

    return {
      success: true,
      message: 'Permission removed successfully'
    };
  }

  @Delete('remove-all/:userId/:workspaceId')
  @ApiOperation({ summary: 'Remove all permissions from user for workspace' })
  @ApiResponse({ status: 200, description: 'All permissions removed successfully' })
  async removeAllUserWorkspacePermissions(
    @Param('userId') userId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    const removed = await this.userWorkspacePermissionService.removeAllUserWorkspacePermissions(
      userId,
      workspaceId
    );

    if (!removed) {
      return {
        success: false,
        message: 'No permissions found or could not be removed'
      };
    }

    return {
      success: true,
      message: 'All permissions removed successfully'
    };
  }

  @Get('user/:userId/workspace/:workspaceId')
  @ApiOperation({ summary: 'Get user permissions for specific workspace' })
  @ApiResponse({ status: 200, description: 'User workspace permissions retrieved successfully' })
  async getUserWorkspacePermissions(
    @Param('userId') userId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    const permissions = await this.userWorkspacePermissionService.getUserWorkspacePermissions(
      userId,
      workspaceId
    );

    return {
      success: true,
      data: permissions,
      message: 'User workspace permissions retrieved successfully'
    };
  }

  @Get('user/:userId/workspaces')
  @ApiOperation({ summary: 'Get all workspaces user has access to with permissions' })
  @ApiResponse({ status: 200, description: 'User workspaces with permissions retrieved successfully' })
  async getUserWorkspacesWithPermissions(@Param('userId') userId: string) {
    const workspacesWithPermissions = await this.userWorkspacePermissionService.getUserWorkspacesWithPermissions(
      userId
    );

    return {
      success: true,
      data: workspacesWithPermissions,
      message: 'User workspaces with permissions retrieved successfully'
    };
  }

  @Get('workspace/:workspaceId/users')
  @ApiOperation({ summary: 'Get all users with permissions for specific workspace' })
  @ApiResponse({ status: 200, description: 'Workspace users with permissions retrieved successfully' })
  async getWorkspaceUsersWithPermissions(@Param('workspaceId') workspaceId: string) {
    const usersWithPermissions = await this.userWorkspacePermissionService.getWorkspaceUsersWithPermissions(
      workspaceId
    );

    return {
      success: true,
      data: usersWithPermissions,
      message: 'Workspace users with permissions retrieved successfully'
    };
  }

  @Get('check/:userId/:workspaceId')
  @ApiOperation({ summary: 'Check if user has specific permission in workspace' })
  @ApiResponse({ status: 200, description: 'Permission check completed' })
  async checkUserPermission(
    @Param('userId') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('resource') resource: Resource,
    @Query('action') action: Action,
  ) {
    const hasPermission = await this.userWorkspacePermissionService.userHasPermission(
      userId,
      workspaceId,
      resource,
      action
    );

    return {
      success: true,
      data: { hasPermission },
      message: `User ${hasPermission ? 'has' : 'does not have'} ${action} permission on ${resource} in workspace ${workspaceId}`
    };
  }

  @Get('check-workspace-access/:userId/:workspaceId')
  @ApiOperation({ summary: 'Check if user has any access to workspace' })
  @ApiResponse({ status: 200, description: 'Workspace access check completed' })
  async checkUserWorkspaceAccess(
    @Param('userId') userId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    const hasAccess = await this.userWorkspacePermissionService.userHasWorkspaceAccess(
      userId,
      workspaceId
    );

    return {
      success: true,
      data: { hasAccess },
      message: `User ${hasAccess ? 'has' : 'does not have'} access to workspace ${workspaceId}`
    };
  }

  @Post('bulk-assign/:workspaceId')
  @ApiOperation({ summary: 'Bulk assign permissions to multiple users for workspace' })
  @ApiResponse({ status: 201, description: 'Permissions assigned successfully' })
  async bulkAssignPermissions(
    @Param('workspaceId') workspaceId: string,
    @Body() body: {
      userPermissions: Array<{
        userId: string;
        permissions: { resource: Resource; action: Action }[];
      }>;
    },
    @Request() req,
  ) {
    const results = await this.userWorkspacePermissionService.bulkAssignPermissions(
      workspaceId,
      body.userPermissions,
      req.user.id
    );

    return {
      success: true,
      data: results,
      message: 'Permissions assigned successfully'
    };
  }
}
