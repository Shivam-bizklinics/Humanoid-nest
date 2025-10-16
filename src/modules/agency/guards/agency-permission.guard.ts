import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformAsset, BusinessManager } from '../entities';
import { UserWorkspace } from '../../rbac/entities/user-workspace.entity';

/**
 * Agency Permission Guard
 * Ensures users can only access agency resources they have permission for
 * Checks workspace access and business manager ownership
 */
@Injectable()
export class AgencyPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(UserWorkspace)
    private userWorkspaceRepository: Repository<UserWorkspace>,
    @InjectRepository(PlatformAsset)
    private platformAssetRepository: Repository<PlatformAsset>,
    @InjectRepository(BusinessManager)
    private businessManagerRepository: Repository<BusinessManager>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract resource identifiers from request
    const { workspaceId, assetId, businessManagerId, campaignId } = {
      ...request.params,
      ...request.query,
      ...request.body,
    };

    // Check workspace access if workspaceId is provided
    if (workspaceId) {
      const hasAccess = await this.checkWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        throw new ForbiddenException('No access to this workspace');
      }
    }

    // Check asset access if assetId is provided
    if (assetId) {
      const hasAccess = await this.checkAssetAccess(user.id, assetId);
      if (!hasAccess) {
        throw new ForbiddenException('No access to this asset');
      }
    }

    // Check business manager access if businessManagerId is provided
    if (businessManagerId) {
      const hasAccess = await this.checkBusinessManagerAccess(user.id, businessManagerId);
      if (!hasAccess) {
        throw new ForbiddenException('No access to this business manager');
      }
    }

    return true;
  }

  private async checkWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
    const userWorkspace = await this.userWorkspaceRepository.findOne({
      where: {
        userId,
        workspaceId,
      },
    });

    return !!userWorkspace;
  }

  private async checkAssetAccess(userId: string, assetId: string): Promise<boolean> {
    const asset = await this.platformAssetRepository.findOne({
      where: { id: assetId },
    });

    if (!asset) {
      return false;
    }

    // Check if user has access to the workspace associated with the asset
    if (asset.workspaceId) {
      return this.checkWorkspaceAccess(userId, asset.workspaceId);
    }

    // Check if user has access to the business manager
    if (asset.businessManagerId) {
      return this.checkBusinessManagerAccess(userId, asset.businessManagerId);
    }

    return false;
  }

  private async checkBusinessManagerAccess(userId: string, businessManagerId: string): Promise<boolean> {
    const businessManager = await this.businessManagerRepository.findOne({
      where: { id: businessManagerId },
    });

    if (!businessManager) {
      return false;
    }

    // Check if user owns this business manager
    if (businessManager.userId === userId) {
      return true;
    }

    // Check if user created the business manager (for parent BMs or admins)
    if (businessManager.createdBy === userId) {
      return true;
    }

    // For parent BM, all users can access (they'll use it for workspaces if they have no BM)
    if (businessManager.type === 'parent') {
      return true;
    }

    return false;
  }
}

