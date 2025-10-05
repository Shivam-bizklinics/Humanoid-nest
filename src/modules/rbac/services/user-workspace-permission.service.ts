import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWorkspacePermission } from '../entities/user-workspace-permission.entity';
import { User } from '../../authentication/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { Permission } from '../entities/permission.entity';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';

export interface AssignPermissionDto {
  userId: string;
  workspaceId: string;
  resource: Resource;
  action: Action;
}

export interface UserWorkspacePermissionsDto {
  userId: string;
  workspaceId: string;
  permissions: {
    resource: Resource;
    action: Action;
  }[];
}

@Injectable()
export class UserWorkspacePermissionService {
  constructor(
    @InjectRepository(UserWorkspacePermission)
    private readonly userWorkspacePermissionRepository: Repository<UserWorkspacePermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Assign a specific permission to a user for a workspace
   */
  async assignPermission(
    assignDto: AssignPermissionDto,
    assignedById: string,
  ): Promise<UserWorkspacePermission> {
    // Check if user has permission to assign permissions (Super Admin only)
    const hasPermission = await this.checkUserCanAssignPermissions(assignedById);
    if (!hasPermission) {
      throw new ForbiddenException('Only Super Admins can assign permissions');
    }

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: assignDto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate workspace exists
    const workspace = await this.workspaceRepository.findOne({ where: { id: assignDto.workspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Get permission
    const permission = await this.permissionRepository.findOne({
      where: {
        resource: assignDto.resource,
        action: assignDto.action,
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Check if permission already exists
    const existingPermission = await this.userWorkspacePermissionRepository.findOne({
      where: {
        userId: assignDto.userId,
        workspaceId: assignDto.workspaceId,
        permissionId: permission.id,
        isActive: true,
      },
    });

    if (existingPermission) {
      throw new ForbiddenException('User already has this permission for this workspace');
    }

    // Create the permission assignment
    const userWorkspacePermission = this.userWorkspacePermissionRepository.create({
      userId: assignDto.userId,
      workspaceId: assignDto.workspaceId,
      permissionId: permission.id,
      createdBy: assignedById,
      updatedBy: assignedById,
    });

    return this.userWorkspacePermissionRepository.save(userWorkspacePermission);
  }

  /**
   * Assign multiple permissions to a user for a workspace
   */
  async assignMultiplePermissions(
    assignDto: UserWorkspacePermissionsDto,
    assignedById: string,
  ): Promise<UserWorkspacePermission[]> {
    const results: UserWorkspacePermission[] = [];

    for (const permData of assignDto.permissions) {
      const assignPermissionDto: AssignPermissionDto = {
        userId: assignDto.userId,
        workspaceId: assignDto.workspaceId,
        resource: permData.resource,
        action: permData.action,
      };

      try {
        const result = await this.assignPermission(assignPermissionDto, assignedById);
        results.push(result);
      } catch (error) {
        // Skip if permission already exists, continue with others
        if (error instanceof ForbiddenException && error.message.includes('already has this permission')) {
          continue;
        }
        throw error;
      }
    }

    return results;
  }

  /**
   * Remove a specific permission from a user for a workspace
   */
  async removePermission(
    userId: string,
    workspaceId: string,
    resource: Resource,
    action: Action,
  ): Promise<boolean> {
    const permission = await this.permissionRepository.findOne({
      where: { resource, action },
    });

    if (!permission) {
      return false;
    }

    const result = await this.userWorkspacePermissionRepository.update(
      {
        userId,
        workspaceId,
        permissionId: permission.id,
        isActive: true,
      },
      { isActive: false }
    );

    return result.affected > 0;
  }

  /**
   * Remove all permissions for a user in a workspace
   */
  async removeAllUserWorkspacePermissions(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const result = await this.userWorkspacePermissionRepository.update(
      {
        userId,
        workspaceId,
        isActive: true,
      },
      { isActive: false }
    );

    return result.affected > 0;
  }

  /**
   * Get all permissions for a user in a specific workspace
   */
  async getUserWorkspacePermissions(
    userId: string,
    workspaceId: string,
  ): Promise<UserWorkspacePermission[]> {
    return this.userWorkspacePermissionRepository.find({
      where: {
        userId,
        workspaceId,
        isActive: true,
      },
      relations: ['permission', 'workspace', 'user'],
    });
  }

  /**
   * Get all workspaces a user has access to with their permissions
   */
  async getUserWorkspacesWithPermissions(userId: string): Promise<{
    workspace: Workspace;
    permissions: UserWorkspacePermission[];
  }[]> {
    const userPermissions = await this.userWorkspacePermissionRepository.find({
      where: { userId, isActive: true },
      relations: ['permission', 'workspace'],
    });

    // Group by workspace
    const workspaceMap = new Map<string, {
      workspace: Workspace;
      permissions: UserWorkspacePermission[];
    }>();

    for (const permission of userPermissions) {
      const workspaceId = permission.workspaceId;
      
      if (!workspaceMap.has(workspaceId)) {
        workspaceMap.set(workspaceId, {
          workspace: permission.workspace,
          permissions: [],
        });
      }

      workspaceMap.get(workspaceId)!.permissions.push(permission);
    }

    return Array.from(workspaceMap.values());
  }

  /**
   * Check if user has specific permission in a workspace
   */
  async userHasPermission(
    userId: string,
    workspaceId: string,
    resource: Resource,
    action: Action,
  ): Promise<boolean> {
    const permission = await this.permissionRepository.findOne({
      where: { resource, action },
    });

    if (!permission) {
      return false;
    }

    const userPermission = await this.userWorkspacePermissionRepository.findOne({
      where: {
        userId,
        workspaceId,
        permissionId: permission.id,
        isActive: true,
      },
    });

    return !!userPermission;
  }

  /**
   * Check if user has any permission in a workspace
   */
  async userHasWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
    const count = await this.userWorkspacePermissionRepository.count({
      where: {
        userId,
        workspaceId,
        isActive: true,
      },
    });

    return count > 0;
  }

  /**
   * Get all users with permissions for a specific workspace
   */
  async getWorkspaceUsersWithPermissions(workspaceId: string): Promise<{
    user: User;
    permissions: UserWorkspacePermission[];
  }[]> {
    const workspacePermissions = await this.userWorkspacePermissionRepository.find({
      where: { workspaceId, isActive: true },
      relations: ['permission', 'user'],
    });

    // Group by user
    const userMap = new Map<string, {
      user: User;
      permissions: UserWorkspacePermission[];
    }>();

    for (const permission of workspacePermissions) {
      const userId = permission.userId;
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: permission.user,
          permissions: [],
        });
      }

      userMap.get(userId)!.permissions.push(permission);
    }

    return Array.from(userMap.values());
  }

  /**
   * Check if user can assign permissions (Super Admin only)
   */
  private async checkUserCanAssignPermissions(userId: string): Promise<boolean> {
    // For now, we'll implement a simple check
    // In a real system, you might check if user has Super Admin role
    // or check against a specific permission
    
    // This could be enhanced to check against a Super Admin role
    // or a specific permission like 'user.manage' or 'permission.assign'
    
    // For now, we'll assume all authenticated users can assign permissions
    // You can modify this based on your requirements
    return true;
  }

  /**
   * Bulk assign permissions to multiple users for a workspace
   */
  async bulkAssignPermissions(
    workspaceId: string,
    userPermissions: Array<{
      userId: string;
      permissions: { resource: Resource; action: Action }[];
    }>,
    assignedById: string,
  ): Promise<UserWorkspacePermission[]> {
    const results: UserWorkspacePermission[] = [];

    for (const userPerm of userPermissions) {
      const assignDto: UserWorkspacePermissionsDto = {
        userId: userPerm.userId,
        workspaceId,
        permissions: userPerm.permissions,
      };

      const userResults = await this.assignMultiplePermissions(assignDto, assignedById);
      results.push(...userResults);
    }

    return results;
  }
}
