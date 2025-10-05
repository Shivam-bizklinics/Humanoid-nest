import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserWorkspacePermissionGuard } from '../../rbac/guards/user-workspace-permission.guard';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { WorkspaceService } from '../services/workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto, AddUserToWorkspaceDto, WorkspaceResponseDto } from '../dto/workspace.dto';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
@UseGuards(UserWorkspacePermissionGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}
  
  @Get()
  @ApiOperation({ summary: 'Get all workspaces user has access to' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async getWorkspaces(@Request() req) {
    const workspaces = await this.workspaceService.getUserWorkspaces(req.user.id);
    return {
      success: true,
      data: workspaces,
      message: 'Workspaces retrieved successfully'
    };
  }

  @Get(':workspaceId')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get workspace details' })
  @ApiResponse({ status: 200, description: 'Workspace details', type: WorkspaceResponseDto })
  async getWorkspace(@Param('workspaceId') workspaceId: string) {
    const workspace = await this.workspaceService.getWorkspaceById(workspaceId);
    if (!workspace) {
      return {
        success: false,
        message: 'Workspace not found'
      };
    }

    return {
      success: true,
      data: workspace,
      message: 'Workspace retrieved successfully'
    };
  }

  @Post()
  @RequirePermission(Resource.WORKSPACE, Action.CREATE)
  @ApiOperation({ summary: 'Create new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created' })
  async createWorkspace(@Body() createWorkspaceDto: CreateWorkspaceDto, @Request() req) {
    const workspace = await this.workspaceService.createWorkspace(
      createWorkspaceDto.name,
      createWorkspaceDto.description,
      req.user.id
    );
    
    return {
      success: true,
      data: workspace,
      message: 'Workspace created successfully'
    };
  }

  @Put(':workspaceId')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Update workspace' })
  @ApiResponse({ status: 200, description: 'Workspace updated', type: WorkspaceResponseDto })
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @Request() req,
  ) {
    const workspace = await this.workspaceService.updateWorkspace(
      workspaceId,
      updateWorkspaceDto.name,
      updateWorkspaceDto.description,
      req.user.id
    );

    return {
      success: true,
      data: workspace,
      message: 'Workspace updated successfully'
    };
  }

  @Delete(':workspaceId')
  @RequirePermission(Resource.WORKSPACE, Action.DELETE)
  @ApiOperation({ summary: 'Delete workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted' })
  async deleteWorkspace(@Param('workspaceId') workspaceId: string) {
    const deleted = await this.workspaceService.deleteWorkspace(workspaceId);
    
    if (!deleted) {
      return {
        success: false,
        message: 'Workspace not found or could not be deleted'
      };
    }

    return {
      success: true,
      message: 'Workspace deleted successfully'
    };
  }

  @Post(':workspaceId/users')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Add user to workspace' })
  @ApiResponse({ status: 201, description: 'User added to workspace' })
  async addUserToWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() addUserDto: AddUserToWorkspaceDto,
    @Request() req,
  ) {
    const userWorkspace = await this.workspaceService.addUserToWorkspace(
      workspaceId,
      addUserDto.userId,
      addUserDto.accessLevel,
      req.user.id
    );

    return {
      success: true,
      data: userWorkspace,
      message: 'User added to workspace successfully'
    };
  }

  @Delete(':workspaceId/users/:userId')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Remove user from workspace' })
  @ApiResponse({ status: 200, description: 'User removed from workspace' })
  async removeUserFromWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
  ) {
    const removed = await this.workspaceService.removeUserFromWorkspace(
      workspaceId,
      userId
    );

    if (!removed) {
      return {
        success: false,
        message: 'User not found in workspace or could not be removed'
      };
    }

    return {
      success: true,
      message: 'User removed from workspace successfully'
    };
  }

  @Get(':workspaceId/users')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get workspace users' })
  @ApiResponse({ status: 200, description: 'Workspace users retrieved' })
  async getWorkspaceUsers(@Param('workspaceId') workspaceId: string) {
    const users = await this.workspaceService.getWorkspaceUsers(workspaceId);
    
    return {
      success: true,
      data: users,
      message: 'Workspace users retrieved successfully'
    };
  }

  @Put(':workspaceId/users/:userId/access-level')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Update user access level in workspace' })
  @ApiResponse({ status: 200, description: 'User access level updated' })
  async updateUserAccessLevel(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() body: { accessLevel: string },
    @Request() req,
  ) {
    const userWorkspace = await this.workspaceService.updateUserAccessLevel(
      workspaceId,
      userId,
      body.accessLevel as any,
      req.user.id
    );

    return {
      success: true,
      data: userWorkspace,
      message: 'User access level updated successfully'
    };
  }
}
