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

    // Check if user-workspace record exists
    let existingRecord = await this.userWorkspacePermissionRepository.findOne({
      where: {
        userId: assignDto.userId,
        workspaceId: assignDto.workspaceId,
        isActive: true,
      },
    });

    if (existingRecord) {
      // Check if permission already exists in the array
      if (existingRecord.permissionIds.includes(permission.id)) {
        throw new ForbiddenException('User already has this permission for this workspace');
      }

      // Add permission to existing array
      existingRecord.permissionIds.push(permission.id);
      existingRecord.updatedBy = assignedById;
      return this.userWorkspacePermissionRepository.save(existingRecord);
    } else {
      // Create new record with permission in array
      const userWorkspacePermission = this.userWorkspacePermissionRepository.create({
        userId: assignDto.userId,
        workspaceId: assignDto.workspaceId,
        permissionIds: [permission.id],
        createdBy: assignedById,
        updatedBy: assignedById,
      });

      return this.userWorkspacePermissionRepository.save(userWorkspacePermission);
    }
  }

  /**
   * Assign multiple permissions to a user for a workspace
   */
  async assignMultiplePermissions(
    assignDto: UserWorkspacePermissionsDto,
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

    // Get all permission IDs
    const permissionIds: string[] = [];
    for (const permData of assignDto.permissions) {
      const permission = await this.permissionRepository.findOne({
        where: {
          resource: permData.resource,
          action: permData.action,
        },
      });

      if (permission) {
        permissionIds.push(permission.id);
      }
    }

    if (permissionIds.length === 0) {
      throw new NotFoundException('No valid permissions found');
    }

    // Check if user-workspace record exists
    let existingRecord = await this.userWorkspacePermissionRepository.findOne({
      where: {
        userId: assignDto.userId,
        workspaceId: assignDto.workspaceId,
        isActive: true,
      },
    });

    if (existingRecord) {
      // Add new permissions to existing array (avoid duplicates)
      const newPermissionIds = permissionIds.filter(id => !existingRecord.permissionIds.includes(id));
      if (newPermissionIds.length > 0) {
        existingRecord.permissionIds.push(...newPermissionIds);
        existingRecord.updatedBy = assignedById;
        return this.userWorkspacePermissionRepository.save(existingRecord);
      }
      return existingRecord;
    } else {
      // Create new record with all permissions in array
      const userWorkspacePermission = this.userWorkspacePermissionRepository.create({
        userId: assignDto.userId,
        workspaceId: assignDto.workspaceId,
        permissionIds: permissionIds,
        createdBy: assignedById,
        updatedBy: assignedById,
      });

      return this.userWorkspacePermissionRepository.save(userWorkspacePermission);
    }
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

    // Find the user-workspace record
    const userWorkspacePermission = await this.userWorkspacePermissionRepository.findOne({
      where: {
        userId,
        workspaceId,
        isActive: true,
      },
    });

    if (!userWorkspacePermission) {
      return false;
    }

    // Remove permission from array
    const permissionIndex = userWorkspacePermission.permissionIds.indexOf(permission.id);
    if (permissionIndex === -1) {
      return false; // Permission not found in array
    }

    userWorkspacePermission.permissionIds.splice(permissionIndex, 1);

    // If no permissions left, soft delete the record
    if (userWorkspacePermission.permissionIds.length === 0) {
      userWorkspacePermission.isActive = false;
    }

    await this.userWorkspacePermissionRepository.save(userWorkspacePermission);
    return true;
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
    const userWorkspacePermission = await this.userWorkspacePermissionRepository.findOne({
      where: {
        userId,
        workspaceId,
        isActive: true,
      },
      relations: ['workspace', 'user'],
    });

    if (!userWorkspacePermission) {
      return [];
    }

    // Get permission details for each permission ID
    const permissions = await this.permissionRepository.findByIds(userWorkspacePermission.permissionIds);
    
    // Create individual permission records for backward compatibility
    return permissions.map(permission => ({
      ...userWorkspacePermission,
      permissionIds: [permission.id], // Single permission for each record
      permission,
    } as UserWorkspacePermission));
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
      relations: ['workspace'],
    });

    const result: {
      workspace: Workspace;
      permissions: UserWorkspacePermission[];
    }[] = [];

    for (const userPermission of userPermissions) {
      // Get permission details for each permission ID
      const permissions = await this.permissionRepository.findByIds(userPermission.permissionIds);
      
      // Create individual permission records for backward compatibility
      const permissionRecords = permissions.map(permission => ({
        ...userPermission,
        permissionIds: [permission.id], // Single permission for each record
        permission,
      } as UserWorkspacePermission));

      result.push({
        workspace: userPermission.workspace,
        permissions: permissionRecords,
      });
    }

    return result;
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

    const userWorkspacePermission = await this.userWorkspacePermissionRepository.findOne({
      where: {
        userId,
        workspaceId,
        isActive: true,
      },
    });

    if (!userWorkspacePermission) {
      return false;
    }

    // Check if permission ID exists in the array
    return userWorkspacePermission.permissionIds.includes(permission.id);
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
      relations: ['user'],
    });

    const result: {
      user: User;
      permissions: UserWorkspacePermission[];
    }[] = [];

    for (const userPermission of workspacePermissions) {
      // Get permission details for each permission ID
      const permissions = await this.permissionRepository.findByIds(userPermission.permissionIds);
      
      // Create individual permission records for backward compatibility
      const permissionRecords = permissions.map(permission => ({
        ...userPermission,
        permissionIds: [permission.id], // Single permission for each record
        permission,
      } as UserWorkspacePermission));

      result.push({
        user: userPermission.user,
        permissions: permissionRecords,
      });
    }

    return result;
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
   * Check if user has a specific permission in any workspace
   */
  async userHasPermissionInAnyWorkspace(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    // Get the permission first
    const permission = await this.permissionRepository.findOne({
      where: {
        name: `${resource}.${action}`,
        isActive: true,
      },
    });

    if (!permission) {
      return false;
    }

    // Check if user has this permission in any workspace
    const userPermissions = await this.userWorkspacePermissionRepository.find({
      where: {
        userId,
        isActive: true,
      },
    });

    // Check if any workspace has this permission in the array
    return userPermissions.some(up => up.permissionIds.includes(permission.id));
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

      const userResult = await this.assignMultiplePermissions(assignDto, assignedById);
      results.push(userResult);
    }

    return results;
  }
}
