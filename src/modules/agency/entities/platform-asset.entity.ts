import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { BusinessManager } from './business-manager.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { 
  AssetType, 
  AssetStatus, 
  AssetOwnership,
  AssetPermissionLevel,
  Platform 
} from '../enums';

/**
 * Platform Asset Entity
 * Generic entity for all platform assets (ad accounts, pages, channels, etc.)
 * Supports multi-platform architecture
 */
@Entity('platform_assets')
@Index(['platform', 'assetType', 'platformAssetId'], { unique: true })
@Index(['businessManagerId'])
@Index(['workspaceId'])
@Index(['status'])
@Index(['ownership'])
export class PlatformAsset implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Platform,
  })
  @Index()
  platform: Platform;

  @Column({
    type: 'enum',
    enum: AssetType,
  })
  @Index()
  assetType: AssetType;

  @Column()
  platformAssetId: string; // Asset ID from platform (e.g., act_123456789)

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AssetStatus,
    default: AssetStatus.PENDING,
  })
  status: AssetStatus;

  @Column({
    type: 'enum',
    enum: AssetOwnership,
  })
  ownership: AssetOwnership;

  @Column({
    type: 'enum',
    enum: AssetPermissionLevel,
  })
  permissionLevel: AssetPermissionLevel;

  // Business Manager association
  @Column('uuid')
  @Index()
  businessManagerId: string;

  @ManyToOne(() => BusinessManager)
  @JoinColumn({ name: 'businessManagerId' })
  businessManager: BusinessManager;

  // Workspace association (for access control)
  @Column('uuid', { nullable: true })
  @Index()
  workspaceId?: string;

  @ManyToOne(() => Workspace, { nullable: true })
  @JoinColumn({ name: 'workspaceId' })
  workspace?: Workspace;

  // Platform-specific configuration
  @Column('jsonb', { nullable: true })
  platformConfig?: {
    // Ad Account specific
    accountId?: string;
    currency?: string;
    timezone?: string;
    spendCap?: string;
    businessId?: string;
    
    // Page specific
    pageId?: string;
    category?: string;
    categoryList?: any[];
    link?: string;
    pictureUrl?: string;
    coverUrl?: string;
    fanCount?: number;
    
    // Instagram specific
    instagramBusinessAccountId?: string;
    username?: string;
    profilePictureUrl?: string;
    followersCount?: number;
    followsCount?: number;
    mediaCount?: number;
    
    // Generic
    [key: string]: any;
  };

  // Access tracking
  @Column({ type: 'timestamp', nullable: true })
  accessGrantedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  accessRevokedAt?: Date;

  // Sync tracking
  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt?: Date;

  @Column({ type: 'text', nullable: true })
  syncError?: string;

  // Usage and performance metrics
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalSpend: number; // For ad accounts

  @Column({ type: 'int', default: 0 })
  activeCampaigns: number; // For ad accounts

  @Column('jsonb', { nullable: true })
  performanceMetrics?: Record<string, any>;

  // Metadata
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}

