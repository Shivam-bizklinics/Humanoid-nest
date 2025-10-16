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
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { BusinessManager } from './business-manager.entity';
import { PlatformAsset } from './platform-asset.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { 
  AssetGroupType, 
  AssetGroupStatus,
  Platform 
} from '../enums';

/**
 * Asset Group Entity
 * Organizes platform assets (ad accounts, pixels, pages) into groups
 * Enables efficient asset management and permission assignment
 */
@Entity('asset_groups')
@Index(['platform', 'platformAssetGroupId'], { unique: true, where: 'platform_asset_group_id IS NOT NULL' })
@Index(['businessManagerId'])
@Index(['status'])
export class AssetGroup implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Platform,
  })
  @Index()
  platform: Platform;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true, unique: true })
  platformAssetGroupId?: string; // Asset Group ID from platform (if synced)

  @Column({
    type: 'enum',
    enum: AssetGroupType,
  })
  groupType: AssetGroupType;

  @Column({
    type: 'enum',
    enum: AssetGroupStatus,
    default: AssetGroupStatus.ACTIVE,
  })
  status: AssetGroupStatus;

  // Business Manager association
  @Column('uuid')
  @Index()
  businessManagerId: string;

  @ManyToOne(() => BusinessManager)
  @JoinColumn({ name: 'businessManagerId' })
  businessManager: BusinessManager;

  // Assets in this group
  @ManyToMany(() => PlatformAsset)
  @JoinTable({
    name: 'asset_group_members',
    joinColumn: { name: 'asset_group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'platform_asset_id', referencedColumnName: 'id' },
  })
  assets?: PlatformAsset[];

  // Platform-specific configuration
  @Column('jsonb', { nullable: true })
  platformConfig?: {
    autoAdd?: boolean; // Automatically add new assets
    assetTypes?: string[]; // Types of assets to include
    rules?: any[]; // Asset inclusion rules
  };

  // Sync tracking
  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt?: Date;

  @Column({ type: 'text', nullable: true })
  syncError?: string;

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

