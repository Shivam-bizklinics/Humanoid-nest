import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity';
import { UserWorkspace } from '../../rbac/entities/user-workspace.entity';
import { WorkspaceAccessLevel } from '../../rbac/entities/user-workspace.entity';
import { User } from '../../authentication/entities/user.entity';
import { PermissionSeederService } from '../../rbac/services/permission-seeder.service';
import { UserWorkspacePermissionService } from '../../rbac/services/user-workspace-permission.service';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepository: Repository<UserWorkspace>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly permissionSeederService: PermissionSeederService,
    private readonly userWorkspacePermissionService: UserWorkspacePermissionService,
  ) {}

  async createWorkspace(
    name: string,
    description: string,
    createdById: string,
  ): Promise<Workspace> {
    // Step 1: Ensure all permissions are seeded in the database
    await this.permissionSeederService.seedAllPermissions();

    // Step 2: Create the workspace
    const workspace = this.workspaceRepository.create({
      name,
      description,
      ownerId: createdById,
      createdBy: createdById,
      updatedBy: createdById,
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    // Step 3: Automatically add the creator as owner of the workspace
    const userWorkspace = this.userWorkspaceRepository.create({
      userId: createdById,
      workspaceId: savedWorkspace.id,
      accessLevel: WorkspaceAccessLevel.OWNER,
      createdBy: createdById,
      updatedBy: createdById,
    });

    await this.userWorkspaceRepository.save(userWorkspace);

    // Step 4: Assign ALL permissions to the workspace creator
    await this.assignAllPermissionsToUser(createdById, savedWorkspace.id);

    return savedWorkspace;
  }

  /**
   * Assign all permissions for all resources and actions to a user in a workspace
   */
  private async assignAllPermissionsToUser(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const resources = Object.values(Resource);
    const actions = Object.values(Action);

    const permissionPromises = [];

    // Assign all combinations of resource and action
    for (const resource of resources) {
      for (const action of actions) {
        // Skip invalid combinations (e.g., UPLOAD for non-designer resources)
        if (action === Action.UPLOAD && resource !== Resource.DESIGNER) {
          continue;
        }

        permissionPromises.push(
          this.userWorkspacePermissionService.assignPermission({
            userId,
            workspaceId,
            resource,
            action,
          }, userId), // Use userId as assignedById since they're assigning to themselves
        );
      }
    }

    await Promise.all(permissionPromises);
  }

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    return this.workspaceRepository.findOne({ where: { id } });
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const userWorkspaces = await this.userWorkspaceRepository.find({
      where: { userId, isActive: true },
      relations: ['workspace'],
    });

    return userWorkspaces.map(uw => uw.workspace);
  }

  async updateWorkspace(
    id: string,
    name: string,
    description: string,
    updatedById: string,
  ): Promise<Workspace> {
    await this.workspaceRepository.update(id, {
      name,
      description,
      updatedBy: updatedById,
    });

    return this.getWorkspaceById(id);
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const result = await this.workspaceRepository.softDelete(id);
    return result.affected > 0;
  }

  async addUserToWorkspace(
    workspaceId: string,
    userId: string,
    accessLevel: WorkspaceAccessLevel,
    addedBy: string,
  ): Promise<UserWorkspace> {
    // Check if workspace exists
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already in workspace
    const existingUserWorkspace = await this.userWorkspaceRepository.findOne({
      where: { userId, workspaceId, isActive: true },
    });

    if (existingUserWorkspace) {
      throw new ConflictException('User is already a member of this workspace');
    }

    // Add user to workspace
    const userWorkspace = this.userWorkspaceRepository.create({
      userId,
      workspaceId,
      accessLevel,
      createdBy: addedBy,
      updatedBy: addedBy,
    });

    return this.userWorkspaceRepository.save(userWorkspace);
  }

  async removeUserFromWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.userWorkspaceRepository.update(
      { userId, workspaceId },
      { isActive: false },
    );

    return result.affected > 0;
  }

  async getWorkspaceUsers(workspaceId: string): Promise<UserWorkspace[]> {
    return this.userWorkspaceRepository.find({
      where: { workspaceId, isActive: true },
      relations: ['user'],
    });
  }

  async updateUserAccessLevel(
    workspaceId: string,
    userId: string,
    accessLevel: WorkspaceAccessLevel,
    updatedBy: string,
  ): Promise<UserWorkspace> {
    const userWorkspace = await this.userWorkspaceRepository.findOne({
      where: { userId, workspaceId, isActive: true },
    });

    if (!userWorkspace) {
      throw new NotFoundException('User is not a member of this workspace');
    }

    userWorkspace.accessLevel = accessLevel;
    userWorkspace.updatedBy = updatedBy;

    return this.userWorkspaceRepository.save(userWorkspace);
  }
}
