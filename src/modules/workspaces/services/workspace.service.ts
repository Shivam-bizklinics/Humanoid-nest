import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace, WorkspaceSetupStatus } from '../entities/workspace.entity';
import { UserWorkspace } from '../../rbac/entities/user-workspace.entity';
import { WorkspaceAccessLevel } from '../../rbac/entities/user-workspace.entity';
import { User } from '../../authentication/entities/user.entity';
import { PermissionSeederService } from '../../rbac/services/permission-seeder.service';
import { UserWorkspacePermissionService } from '../../rbac/services/user-workspace-permission.service';
import { BrandQuestionService } from './brand-question.service';
import { FileUploadService } from '../../file-upload/services/file-upload.service';
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
    private readonly brandQuestionService: BrandQuestionService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async createWorkspace(
    name: string,
    description: string,
    createdById: string,
    brandName?: string,
    brandWebsite?: string,
    brandDescription?: string,
    brandLogo?: string,
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
      setupStatus: WorkspaceSetupStatus.PENDING,
      brandName,
      brandWebsite,
      brandDescription,
      brandLogo,
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

    // Collect all valid permission combinations
    const permissionCombinations: { resource: Resource; action: Action }[] = [];

    for (const resource of resources) {
      for (const action of actions) {
        // Skip invalid combinations (e.g., UPLOAD for non-designer resources)
        if (action === Action.UPLOAD && resource !== Resource.DESIGNER) {
          continue;
        }

        permissionCombinations.push({ resource, action });
      }
    }

    // Assign all permissions in a single operation
    await this.userWorkspacePermissionService.assignMultiplePermissions({
      userId,
      workspaceId,
      permissions: permissionCombinations,
    }, userId); // Use userId as assignedById since they're assigning to themselves
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
    updateData: {
      name?: string;
      description?: string;
      setupStatus?: WorkspaceSetupStatus;
      brandName?: string;
      brandWebsite?: string;
      brandDescription?: string;
      brandLogo?: string;
    },
    updatedById: string,
  ): Promise<Workspace> {
    await this.workspaceRepository.update(id, {
      ...updateData,
      updatedBy: updatedById,
    });

    return this.getWorkspaceById(id);
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    try {
      // Clean up workspace files
      await this.fileUploadService.cleanupWorkspaceFiles(id);
      
      // Soft delete workspace
      const result = await this.workspaceRepository.softDelete(id);
      return result.affected > 0;
    } catch (error) {
      // Log error but still try to delete workspace
      console.error('Error cleaning up workspace files:', error);
      const result = await this.workspaceRepository.softDelete(id);
      return result.affected > 0;
    }
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

  /**
   * Update workspace setup status
   */
  async updateWorkspaceSetupStatus(
    workspaceId: string,
    setupStatus: WorkspaceSetupStatus,
    updatedById: string,
  ): Promise<Workspace> {
    const workspace = await this.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.workspaceRepository.update(workspaceId, {
      setupStatus,
      updatedBy: updatedById,
    });

    return this.getWorkspaceById(workspaceId);
  }

  /**
   * Complete workspace setup - marks setup as completed
   */
  async completeWorkspaceSetup(
    workspaceId: string,
    completedById: string,
  ): Promise<Workspace> {
    return this.updateWorkspaceSetupStatus(
      workspaceId,
      WorkspaceSetupStatus.COMPLETED,
      completedById,
    );
  }

  /**
   * Get workspaces by setup status
   */
  async getWorkspacesBySetupStatus(
    setupStatus: WorkspaceSetupStatus,
  ): Promise<Workspace[]> {
    return this.workspaceRepository.find({
      where: { setupStatus, isActive: true },
    });
  }

  /**
   * Check if workspace can be marked as completed
   * This includes checking questionnaire completion
   */
  async canCompleteWorkspaceSetup(workspaceId: string): Promise<{
    canComplete: boolean;
    questionnaireComplete: boolean;
    missingRequirements: string[];
  }> {
    const workspace = await this.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check questionnaire completion
    const questionnaireStatus = await this.brandQuestionService.validateQuestionnaireCompletion(workspaceId);
    
    const missingRequirements: string[] = [];
    
    if (!questionnaireStatus.isComplete) {
      missingRequirements.push('Brand questionnaire not completed');
      if (questionnaireStatus.missingMandatory.length > 0) {
        missingRequirements.push(`Missing mandatory questions: ${questionnaireStatus.missingMandatory.join(', ')}`);
      }
    }

    // Add other completion requirements here as needed
    // For example: brand information, integrations, etc.

    const canComplete = questionnaireStatus.isComplete && missingRequirements.length === 0;

    return {
      canComplete,
      questionnaireComplete: questionnaireStatus.isComplete,
      missingRequirements,
    };
  }

  /**
   * Complete workspace setup with validation
   */
  async completeWorkspaceSetupWithValidation(
    workspaceId: string,
    completedById: string,
  ): Promise<Workspace> {
    const validation = await this.canCompleteWorkspaceSetup(workspaceId);
    
    if (!validation.canComplete) {
      throw new ConflictException(
        `Cannot complete workspace setup. Missing requirements: ${validation.missingRequirements.join(', ')}`
      );
    }

    return this.completeWorkspaceSetup(workspaceId, completedById);
  }

  /**
   * Get workspace setup progress
   */
  async getWorkspaceSetupProgress(workspaceId: string): Promise<{
    workspace: Workspace;
    questionnaireStatus: any;
    completionValidation: any;
    overallProgress: number;
  }> {
    const workspace = await this.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const questionnaireStatus = await this.brandQuestionService.validateQuestionnaireCompletion(workspaceId);
    const completionValidation = await this.canCompleteWorkspaceSetup(workspaceId);

    // Calculate overall progress (0-100)
    let progress = 0;
    
    // Basic workspace info (20%)
    if (workspace.name && workspace.description) {
      progress += 20;
    }

    // Brand information (30%)
    if (workspace.brandName && workspace.brandWebsite) {
      progress += 30;
    }

    // Questionnaire completion (50%)
    if (questionnaireStatus.isComplete) {
      progress += 50;
    } else {
      // Get detailed questionnaire status for progress calculation
      const detailedQuestionnaire = await this.brandQuestionService.getQuestionnaireForWorkspace(workspaceId);
      if (detailedQuestionnaire.completionStatus.answeredMandatory > 0) {
        // Partial progress based on answered mandatory questions
        const questionnaireProgress = (detailedQuestionnaire.completionStatus.answeredMandatory / detailedQuestionnaire.completionStatus.mandatoryQuestions) * 50;
        progress += questionnaireProgress;
      }
    }

    return {
      workspace,
      questionnaireStatus,
      completionValidation,
      overallProgress: Math.round(progress),
    };
  }
}
