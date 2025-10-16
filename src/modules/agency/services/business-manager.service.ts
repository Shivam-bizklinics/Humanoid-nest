import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BusinessManager, SystemUser, AuthToken } from '../entities';
import { 
  BusinessManagerType, 
  BusinessManagerStatus, 
  BusinessManagerRelationship,
  Platform,
  SystemUserRole,
  SystemUserStatus,
  AuthTokenType,
  AuthTokenStatus,
} from '../enums';
import { MetaSdkService } from './meta-sdk.service';
import { BusinessException } from '../../../shared/exceptions/business.exception';
import { IMetaBusinessManager } from '../interfaces';

/**
 * Business Manager Service
 * Manages 2-tier hierarchy: Parent (Humanoid) -> Child (Client/Agency)
 * Handles business manager creation, connection, and relationship management
 */
@Injectable()
export class BusinessManagerService {
  private readonly logger = new Logger(BusinessManagerService.name);

  constructor(
    @InjectRepository(BusinessManager)
    private readonly businessManagerRepository: Repository<BusinessManager>,
    @InjectRepository(SystemUser)
    private readonly systemUserRepository: Repository<SystemUser>,
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
    private readonly metaSdkService: MetaSdkService,
  ) {}

  /**
   * Get or create parent business manager (Humanoid's main BM)
   */
  async getOrCreateParentBusinessManager(
    platform: Platform,
    platformBusinessId: string,
    name: string,
    userId: string,
  ): Promise<BusinessManager> {
    // Check if parent BM already exists
    let parentBm = await this.businessManagerRepository.findOne({
      where: {
        platform,
        platformBusinessId,
        type: BusinessManagerType.PARENT,
        parentBusinessManagerId: IsNull(),
      },
    });

    if (parentBm) {
      return parentBm;
    }

    // Create new parent business manager
    parentBm = this.businessManagerRepository.create({
      platform,
      platformBusinessId,
      name,
      type: BusinessManagerType.PARENT,
      status: BusinessManagerStatus.CONNECTED,
      relationship: BusinessManagerRelationship.OWNED,
      createdBy: userId,
      updatedBy: userId,
    });

    await this.businessManagerRepository.save(parentBm);
    
    this.logger.log(`Created parent business manager: ${name} (${platformBusinessId})`);
    
    return parentBm;
  }

  /**
   * Connect a child business manager (Client/Agency)
   * Child BMs are isolated by user, not workspace
   */
  async connectChildBusinessManager(
    platform: Platform,
    platformBusinessId: string,
    parentBusinessManagerId: string,
    type: BusinessManagerType,
    relationship: BusinessManagerRelationship,
    userId: string,
  ): Promise<BusinessManager> {
    // Verify parent exists and is a parent type
    const parentBm = await this.businessManagerRepository.findOne({
      where: { id: parentBusinessManagerId },
    });

    if (!parentBm || parentBm.type !== BusinessManagerType.PARENT) {
      throw new BusinessException('Invalid parent business manager');
    }

    // Check if already connected (one BM per user)
    let childBm = await this.businessManagerRepository.findOne({
      where: {
        platform,
        platformBusinessId,
        parentBusinessManagerId,
        userId, // Isolate by user
      },
    });

    if (childBm) {
      return childBm;
    }

    // Fetch business manager details from platform
    let bmDetails: any = {};
    try {
      if (platform === Platform.META) {
        bmDetails = await this.getMetaBusinessManagerDetails(platformBusinessId, userId);
      }
    } catch (error) {
      this.logger.warn(`Could not fetch BM details: ${error.message}`);
    }

    // Create child business manager (isolated by user)
    childBm = this.businessManagerRepository.create({
      platform,
      platformBusinessId,
      name: bmDetails.name || `Business Manager ${platformBusinessId}`,
      type,
      status: BusinessManagerStatus.PENDING,
      relationship,
      parentBusinessManagerId,
      userId, // Isolate by user, not workspace
      platformConfig: bmDetails.platformConfig,
      createdBy: userId,
      updatedBy: userId,
    });

    await this.businessManagerRepository.save(childBm);
    
    this.logger.log(`Connected child business manager: ${childBm.name}`);
    
    return childBm;
  }

  /**
   * Get Meta business manager details
   */
  private async getMetaBusinessManagerDetails(
    businessId: string,
    userId: string,
  ): Promise<{ name: string; platformConfig: any }> {
    try {
      // Get access token for API call
      const token = await this.authTokenRepository.findOne({
        where: {
          userId,
          platform: Platform.META,
          status: AuthTokenStatus.ACTIVE,
        },
        order: { createdAt: 'DESC' },
      });

      if (!token) {
        throw new BusinessException('No access token available');
      }

      const data: IMetaBusinessManager = await this.metaSdkService.graphApiRequest(
        businessId,
        'GET',
        {
          fields: 'id,name,created_time,timezone_id,primary_page,permitted_tasks,two_factor_type,verification_status,vertical_id',
        },
        token.accessToken,
      );

      return {
        name: data.name,
        platformConfig: {
          timezone: data.timezone_id?.toString(),
          primaryPage: data.primary_page?.id,
          permitedTasks: data.permitted_tasks,
          twoFactorType: data.two_factor_type,
          businessVerificationStatus: data.verification_status,
          verticalId: data.vertical_id,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching Meta BM details:', error);
      throw error;
    }
  }

  /**
   * Create system user for a business manager
   */
  async createSystemUser(
    businessManagerId: string,
    name: string,
    role: SystemUserRole,
    userId: string,
    platform: Platform = Platform.META,
  ): Promise<SystemUser> {
    const businessManager = await this.businessManagerRepository.findOne({
      where: { id: businessManagerId },
    });

    if (!businessManager) {
      throw new BusinessException('Business manager not found');
    }

    // For Meta, we need to create system user via API
    if (platform === Platform.META) {
      return this.createMetaSystemUser(businessManager, name, role, userId);
    }

    throw new BusinessException(`System user creation not supported for ${platform}`);
  }

  /**
   * Create Meta system user
   */
  private async createMetaSystemUser(
    businessManager: BusinessManager,
    name: string,
    role: SystemUserRole,
    userId: string,
  ): Promise<SystemUser> {
    try {
      // Get access token for the parent business manager
      const token = await this.metaSdkService.getBusinessManagerToken(
        businessManager.parentBusinessManagerId || businessManager.id,
      );

      // Create system user via Meta API
      const response = await this.metaSdkService.graphApiRequest(
        `${businessManager.platformBusinessId}/system_users`,
        'POST',
        {
          name,
          role: role.toUpperCase(),
        },
        token,
      );

      // Save system user to database
      const systemUser = this.systemUserRepository.create({
        platform: Platform.META,
        platformSystemUserId: response.id,
        name,
        role,
        status: SystemUserStatus.ACTIVE,
        businessManagerId: businessManager.id,
        createdBy: userId,
        updatedBy: userId,
      });

      await this.systemUserRepository.save(systemUser);
      
      this.logger.log(`Created system user: ${name} for BM ${businessManager.name}`);
      
      return systemUser;
    } catch (error) {
      this.logger.error('Error creating Meta system user:', error);
      throw new BusinessException('Failed to create system user');
    }
  }

  /**
   * Generate access token for system user
   */
  async generateSystemUserToken(
    systemUserId: string,
    appId: string,
    scope: string[],
    userId: string,
  ): Promise<AuthToken> {
    const systemUser = await this.systemUserRepository.findOne({
      where: { id: systemUserId },
      relations: ['businessManager'],
    });

    if (!systemUser) {
      throw new BusinessException('System user not found');
    }

    if (systemUser.platform !== Platform.META) {
      throw new BusinessException('Only Meta system users supported currently');
    }

    try {
      // Get parent BM token to create system user token
      const parentToken = await this.metaSdkService.getBusinessManagerToken(
        systemUser.businessManager.parentBusinessManagerId || systemUser.businessManager.id,
      );

      // Generate token via Meta API
      const response = await this.metaSdkService.graphApiRequest(
        `${systemUser.platformSystemUserId}/access_tokens`,
        'POST',
        {
          app_id: appId,
          scope: scope.join(','),
        },
        parentToken,
      );

      // Save token to database (encrypted in production)
      const authToken = this.authTokenRepository.create({
        platform: Platform.META,
        tokenType: AuthTokenType.SYSTEM_USER,
        status: AuthTokenStatus.ACTIVE,
        accessToken: response.access_token,
        scopes: scope,
        expiresAt: null, // System user tokens don't expire
        systemUserId: systemUser.id,
        businessManagerId: systemUser.businessManagerId,
        createdBy: userId,
        updatedBy: userId,
      });

      await this.authTokenRepository.save(authToken);
      
      this.logger.log(`Generated access token for system user: ${systemUser.name}`);
      
      return authToken;
    } catch (error) {
      this.logger.error('Error generating system user token:', error);
      throw new BusinessException('Failed to generate system user token');
    }
  }

  /**
   * Get all child business managers for a parent
   */
  async getChildBusinessManagers(parentBusinessManagerId: string): Promise<BusinessManager[]> {
    return this.businessManagerRepository.find({
      where: { parentBusinessManagerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get business manager by ID
   */
  async getBusinessManagerById(id: string): Promise<BusinessManager> {
    const bm = await this.businessManagerRepository.findOne({
      where: { id },
      relations: ['workspace', 'parentBusinessManager'],
    });

    if (!bm) {
      throw new BusinessException('Business manager not found');
    }

    return bm;
  }

  /**
   * Get business managers for a user
   */
  async getBusinessManagersByUser(userId: string): Promise<BusinessManager[]> {
    return this.businessManagerRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get or create business manager for user
   * If user has no BM, returns parent BM for direct workspace linking
   */
  async getOrCreateUserBusinessManager(
    userId: string,
    platform: Platform = Platform.META,
  ): Promise<BusinessManager> {
    // Check if user has their own BM
    const userBm = await this.businessManagerRepository.findOne({
      where: { userId, platform },
    });

    if (userBm) {
      return userBm;
    }

    // User has no BM, return parent BM for direct workspace linking
    const parentBm = await this.businessManagerRepository.findOne({
      where: {
        platform,
        type: BusinessManagerType.PARENT,
        parentBusinessManagerId: IsNull(),
      },
    });

    if (!parentBm) {
      throw new BusinessException('Parent business manager not found. Please create it first.');
    }

    return parentBm;
  }

  /**
   * Update business manager status
   */
  async updateBusinessManagerStatus(
    id: string,
    status: BusinessManagerStatus,
    userId: string,
  ): Promise<BusinessManager> {
    const bm = await this.getBusinessManagerById(id);
    
    bm.status = status;
    bm.updatedBy = userId;

    if (status === BusinessManagerStatus.CONNECTED) {
      bm.accessGrantedAt = new Date();
    } else if (status === BusinessManagerStatus.DISCONNECTED) {
      bm.accessRevokedAt = new Date();
    }

    return this.businessManagerRepository.save(bm);
  }

  /**
   * Sync business manager data from platform
   */
  async syncBusinessManager(id: string, userId: string): Promise<BusinessManager> {
    const bm = await this.getBusinessManagerById(id);

    if (bm.platform === Platform.META) {
      try {
        const details = await this.getMetaBusinessManagerDetails(bm.platformBusinessId, userId);
        
        bm.name = details.name;
        bm.platformConfig = details.platformConfig;
        bm.lastSyncedAt = new Date();
        bm.syncError = null;
        bm.updatedBy = userId;

        await this.businessManagerRepository.save(bm);
        
        this.logger.log(`Synced business manager: ${bm.name}`);
      } catch (error) {
        bm.syncError = error.message;
        bm.lastSyncedAt = new Date();
        await this.businessManagerRepository.save(bm);
        
        throw error;
      }
    }

    return bm;
  }

  /**
   * Delete business manager (soft delete)
   */
  async deleteBusinessManager(id: string, userId: string): Promise<void> {
    const bm = await this.getBusinessManagerById(id);
    
    // Don't allow deleting parent BM if it has children
    if (bm.type === BusinessManagerType.PARENT) {
      const children = await this.getChildBusinessManagers(id);
      if (children.length > 0) {
        throw new BusinessException('Cannot delete parent business manager with active children');
      }
    }

    bm.updatedBy = userId;
    await this.businessManagerRepository.softDelete(id);
    
    this.logger.log(`Deleted business manager: ${bm.name}`);
  }

  /**
   * Request access to client/agency business manager
   * This automates the partnership request process
   */
  async requestBusinessAccess(
    targetBusinessId: string,
    parentBusinessManagerId: string,
    userId: string,
    platform: Platform = Platform.META,
  ): Promise<void> {
    if (platform !== Platform.META) {
      throw new BusinessException('Access request only supported for Meta currently');
    }

    try {
      const parentToken = await this.metaSdkService.getBusinessManagerToken(parentBusinessManagerId);

      // Send partnership request via Meta API
      await this.metaSdkService.graphApiRequest(
        `${targetBusinessId}`,
        'POST',
        {
          request_type: 'partnership',
        },
        parentToken,
      );

      this.logger.log(`Requested access to business: ${targetBusinessId}`);
    } catch (error) {
      this.logger.error('Error requesting business access:', error);
      throw new BusinessException('Failed to request business access');
    }
  }
}

