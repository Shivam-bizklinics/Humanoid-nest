import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserWorkspacePermissionGuard } from '../../rbac/guards/user-workspace-permission.guard';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { WorkspaceService } from '../services/workspace.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto, AddUserToWorkspaceDto, WorkspaceResponseDto } from '../dto/workspace.dto';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { WorkspaceSetupStatus } from '../entities/workspace.entity';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
@UseGuards(UserWorkspacePermissionGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}
  
  @Get()
  @ApiOperation({ summary: 'Get all workspaces user has access to' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async getWorkspaces(@CurrentUserId() userId: string) {
    const workspaces = await this.workspaceService.getUserWorkspaces(userId);
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
  async createWorkspace(@Body() createWorkspaceDto: CreateWorkspaceDto, @CurrentUserId() userId: string) {
    const workspace = await this.workspaceService.createWorkspace(
      createWorkspaceDto.name,
      createWorkspaceDto.description,
      userId,
      createWorkspaceDto.brandName,
      createWorkspaceDto.brandWebsite,
      createWorkspaceDto.brandDescription,
      createWorkspaceDto.brandLogo
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
    @CurrentUserId() userId: string,
  ) {
    const workspace = await this.workspaceService.updateWorkspace(
      workspaceId,
      {
        name: updateWorkspaceDto.name,
        description: updateWorkspaceDto.description,
        setupStatus: updateWorkspaceDto.setupStatus,
        brandName: updateWorkspaceDto.brandName,
        brandWebsite: updateWorkspaceDto.brandWebsite,
        brandDescription: updateWorkspaceDto.brandDescription,
        brandLogo: updateWorkspaceDto.brandLogo,
      },
      userId
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
    @CurrentUserId() userId: string,
  ) {
    const userWorkspace = await this.workspaceService.addUserToWorkspace(
      workspaceId,
      addUserDto.userId,
      addUserDto.accessLevel,
      userId
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
    @CurrentUserId() currentUserId: string,
  ) {
    const userWorkspace = await this.workspaceService.updateUserAccessLevel(
      workspaceId,
      userId,
      body.accessLevel as any,
      currentUserId
    );

    return {
      success: true,
      data: userWorkspace,
      message: 'User access level updated successfully'
    };
  }

  @Put(':workspaceId/setup-status')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Update workspace setup status' })
  @ApiResponse({ status: 200, description: 'Workspace setup status updated' })
  async updateWorkspaceSetupStatus(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { setupStatus: WorkspaceSetupStatus },
    @CurrentUserId() userId: string,
  ) {
    const workspace = await this.workspaceService.updateWorkspaceSetupStatus(
      workspaceId,
      body.setupStatus,
      userId
    );

    return {
      success: true,
      data: workspace,
      message: 'Workspace setup status updated successfully'
    };
  }

  @Post(':workspaceId/complete-setup')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Complete workspace setup' })
  @ApiResponse({ status: 200, description: 'Workspace setup completed' })
  async completeWorkspaceSetup(
    @Param('workspaceId') workspaceId: string,
    @CurrentUserId() userId: string,
  ) {
    const workspace = await this.workspaceService.completeWorkspaceSetup(
      workspaceId,
      userId
    );

    return {
      success: true,
      data: workspace,
      message: 'Workspace setup completed successfully'
    };
  }

  @Get('by-setup-status/:setupStatus')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get workspaces by setup status' })
  @ApiResponse({ status: 200, description: 'Workspaces retrieved by setup status' })
  async getWorkspacesBySetupStatus(
    @Param('setupStatus') setupStatus: WorkspaceSetupStatus,
  ) {
    const workspaces = await this.workspaceService.getWorkspacesBySetupStatus(setupStatus);
    
    return {
      success: true,
      data: workspaces,
      message: `Workspaces with ${setupStatus} status retrieved successfully`
    };
  }

  @Post(':workspaceId/complete-setup-validated')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Complete workspace setup with validation' })
  @ApiResponse({ status: 200, description: 'Workspace setup completed with validation' })
  async completeWorkspaceSetupWithValidation(
    @Param('workspaceId') workspaceId: string,
    @CurrentUserId() userId: string,
  ) {
    const workspace = await this.workspaceService.completeWorkspaceSetupWithValidation(
      workspaceId,
      userId
    );

    return {
      success: true,
      data: workspace,
      message: 'Workspace setup completed successfully with validation'
    };
  }

  @Get(':workspaceId/setup-progress')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get workspace setup progress' })
  @ApiResponse({ status: 200, description: 'Workspace setup progress retrieved successfully' })
  async getWorkspaceSetupProgress(
    @Param('workspaceId') workspaceId: string,
  ) {
    const progress = await this.workspaceService.getWorkspaceSetupProgress(workspaceId);
    
    return {
      success: true,
      data: progress,
      message: 'Workspace setup progress retrieved successfully'
    };
  }

  @Get(':workspaceId/can-complete')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Check if workspace can be completed' })
  @ApiResponse({ status: 200, description: 'Completion validation retrieved successfully' })
  async canCompleteWorkspaceSetup(
    @Param('workspaceId') workspaceId: string,
  ) {
    const validation = await this.workspaceService.canCompleteWorkspaceSetup(workspaceId);
    
    return {
      success: true,
      data: validation,
      message: 'Completion validation retrieved successfully'
    };
  }
}
