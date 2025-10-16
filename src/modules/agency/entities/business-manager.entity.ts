import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { 
  BusinessManagerType, 
  BusinessManagerStatus, 
  BusinessManagerRelationship,
  Platform 
} from '../enums';

/**
 * Business Manager Entity
 * Manages 2-tier hierarchy: Parent (Humanoid) -> Child (Client/Agency)
 * Supports multi-platform business managers
 */
@Entity('business_managers')
@Index(['platform', 'platformBusinessId'], { unique: true })
@Index(['parentBusinessManagerId'])
@Index(['workspaceId'])
@Index(['status'])
export class BusinessManager implements BaseEntity {
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

  @Column({ unique: true })
  platformBusinessId: string; // Business Manager ID from platform (e.g., Meta Business ID)

  @Column({
    type: 'enum',
    enum: BusinessManagerType,
  })
  type: BusinessManagerType;

  @Column({
    type: 'enum',
    enum: BusinessManagerStatus,
    default: BusinessManagerStatus.PENDING,
  })
  status: BusinessManagerStatus;

  @Column({
    type: 'enum',
    enum: BusinessManagerRelationship,
  })
  relationship: BusinessManagerRelationship;

  // Parent-Child relationship for 2-tier hierarchy
  @Column('uuid', { nullable: true })
  parentBusinessManagerId?: string;

  @ManyToOne(() => BusinessManager, { nullable: true })
  @JoinColumn({ name: 'parentBusinessManagerId' })
  parentBusinessManager?: BusinessManager;

  @OneToMany(() => BusinessManager, bm => bm.parentBusinessManager)
  childBusinessManagers?: BusinessManager[];

  // User association (one business manager per user for isolation)
  // If user has their own BM, it's isolated by user
  // If user has no BM, their workspaces link directly to parent BM
  @Column('uuid', { nullable: true })
  @Index()
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  // Platform-specific configuration
  @Column('jsonb', { nullable: true })
  platformConfig?: {
    timezone?: string;
    currency?: string;
    businessVerificationStatus?: string;
    permitedTasks?: string[];
    twoFactorType?: string;
    verticalId?: number;
    primaryPage?: string;
  };

  // Access and permission tracking
  @Column({ type: 'timestamp', nullable: true })
  accessGrantedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  accessRevokedAt?: Date;

  @Column({ nullable: true })
  accessGrantedBy?: string;

  // Verification data
  @Column({ nullable: true })
  verificationCode?: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

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

