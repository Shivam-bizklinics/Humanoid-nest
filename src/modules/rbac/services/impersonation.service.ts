import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImpersonationSession, ImpersonationStatus } from '../entities/impersonation-session.entity';
import { User } from '../../authentication/entities/user.entity';
import { UserWorkspacePermissionService } from './user-workspace-permission.service';

export interface StartImpersonationDto {
  impersonatedUserId: string;
  reason?: string;
  expiresAt?: Date;
  workspaceId?: string;
  permissions?: string[];
}

export interface ImpersonationContext {
  session: ImpersonationSession;
  impersonator: User;
  impersonatedUser: User;
}

@Injectable()
export class ImpersonationService {
  constructor(
    @InjectRepository(ImpersonationSession)
    private readonly impersonationSessionRepository: Repository<ImpersonationSession>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userWorkspacePermissionService: UserWorkspacePermissionService,
  ) {}

  /**
   * Check if a user can impersonate other users
   */
  async canImpersonate(impersonatorId: string): Promise<boolean> {
    // Check if user has impersonation permission in any workspace
    const hasPermission = await this.userWorkspacePermissionService.userHasPermissionInAnyWorkspace(
      impersonatorId,
      'user',
      'impersonate'
    );
    return hasPermission;
  }

  /**
   * Start impersonation session
   */
  async startImpersonation(
    impersonatorId: string,
    startImpersonationDto: StartImpersonationDto,
  ): Promise<ImpersonationSession> {
    // Check if impersonator has permission to impersonate
    const canImpersonate = await this.canImpersonate(impersonatorId);
    if (!canImpersonate) {
      throw new ForbiddenException('You do not have permission to impersonate users');
    }

    // Check if impersonated user exists
    const impersonatedUser = await this.userRepository.findOne({
      where: { id: startImpersonationDto.impersonatedUserId }
    });
    if (!impersonatedUser) {
      throw new NotFoundException('User to impersonate not found');
    }

    // Prevent self-impersonation
    if (impersonatorId === startImpersonationDto.impersonatedUserId) {
      throw new BadRequestException('Cannot impersonate yourself');
    }

    // Check if there's already an active impersonation session for this impersonator
    const existingSession = await this.impersonationSessionRepository.findOne({
      where: {
        impersonatorId,
        status: ImpersonationStatus.ACTIVE,
        isActive: true,
      }
    });

    if (existingSession) {
      throw new BadRequestException('You already have an active impersonation session. Please end it first.');
    }

    // Create new impersonation session
    const session = this.impersonationSessionRepository.create({
      impersonatorId,
      impersonatedUserId: startImpersonationDto.impersonatedUserId,
      status: ImpersonationStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: startImpersonationDto.expiresAt,
      reason: startImpersonationDto.reason,
      metadata: {
        workspaceId: startImpersonationDto.workspaceId,
        permissions: startImpersonationDto.permissions,
      },
      createdBy: impersonatorId,
      updatedBy: impersonatorId,
    });

    return this.impersonationSessionRepository.save(session);
  }

  /**
   * End impersonation session
   */
  async endImpersonation(sessionId: string, endedById: string): Promise<ImpersonationSession> {
    const session = await this.impersonationSessionRepository.findOne({
      where: { id: sessionId, isActive: true },
      relations: ['impersonator', 'impersonatedUser']
    });

    if (!session) {
      throw new NotFoundException('Impersonation session not found');
    }

    // Only the impersonator or an admin can end the session
    if (session.impersonatorId !== endedById) {
      // Check if the user ending the session has admin permissions
      const canManageImpersonation = await this.userWorkspacePermissionService.userHasPermissionInAnyWorkspace(
        endedById,
        'user',
        'impersonate'
      );
      if (!canManageImpersonation) {
        throw new ForbiddenException('You can only end your own impersonation sessions');
      }
    }

    session.status = ImpersonationStatus.ENDED;
    session.endedAt = new Date();
    session.updatedBy = endedById;

    return this.impersonationSessionRepository.save(session);
  }

  /**
   * Get active impersonation session for a user
   */
  async getActiveImpersonationSession(impersonatorId: string): Promise<ImpersonationSession | null> {
    return this.impersonationSessionRepository.findOne({
      where: {
        impersonatorId,
        status: ImpersonationStatus.ACTIVE,
        isActive: true,
      },
      relations: ['impersonatedUser', 'impersonator']
    });
  }

  /**
   * Get impersonation context (impersonator + impersonated user info)
   */
  async getImpersonationContext(impersonatorId: string): Promise<ImpersonationContext | null> {
    const session = await this.getActiveImpersonationSession(impersonatorId);
    if (!session) {
      return null;
    }

    const impersonator = await this.userRepository.findOne({
      where: { id: impersonatorId }
    });

    if (!impersonator) {
      return null;
    }

    return {
      session,
      impersonator,
      impersonatedUser: session.impersonatedUser,
    };
  }

  /**
   * Get all users that can be impersonated by a specific user
   */
  async getImpersonatableUsers(impersonatorId: string): Promise<User[]> {
    // For now, return all users except the impersonator
    // You can add more sophisticated filtering here based on business rules
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :impersonatorId', { impersonatorId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .select(['user.id', 'user.email', 'user.firstName', 'user.lastName', 'user.createdAt'])
      .getMany();
  }

  /**
   * Get impersonation history for a user
   */
  async getImpersonationHistory(impersonatorId: string, limit = 50): Promise<ImpersonationSession[]> {
    return this.impersonationSessionRepository.find({
      where: { impersonatorId, isActive: true },
      relations: ['impersonatedUser'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Check if a session is expired and update its status
   */
  async checkAndUpdateExpiredSessions(): Promise<void> {
    const now = new Date();
    await this.impersonationSessionRepository.update(
      {
        status: ImpersonationStatus.ACTIVE,
        isActive: true,
      },
      {
        status: ImpersonationStatus.EXPIRED,
        endedAt: now,
        updatedAt: now,
      }
    );
  }

  /**
   * Get all active impersonation sessions (admin function)
   */
  async getAllActiveSessions(): Promise<ImpersonationSession[]> {
    return this.impersonationSessionRepository.find({
      where: {
        status: ImpersonationStatus.ACTIVE,
        isActive: true,
      },
      relations: ['impersonator', 'impersonatedUser'],
      order: { startedAt: 'DESC' },
    });
  }
}
