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
} from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { SystemUser } from './system-user.entity';
import { BusinessManager } from './business-manager.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { 
  AuthTokenType, 
  AuthTokenStatus,
  Platform 
} from '../enums';

/**
 * Auth Token Entity
 * Stores platform access tokens (encrypted)
 * Enables long-term API access without repeated user login
 */
@Entity('auth_tokens')
@Index(['platform', 'tokenType'])
@Index(['systemUserId'])
@Index(['businessManagerId'])
@Index(['status'])
@Index(['expiresAt'])
export class AuthToken implements BaseEntity {
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
    enum: AuthTokenType,
  })
  tokenType: AuthTokenType;

  @Column({
    type: 'enum',
    enum: AuthTokenStatus,
    default: AuthTokenStatus.ACTIVE,
  })
  status: AuthTokenStatus;

  // Encrypted access token (IMPORTANT: Must be encrypted in production)
  @Column('text')
  accessToken: string;

  // Token metadata
  @Column('text', { array: true, default: [] })
  scopes: string[]; // Permissions/scopes granted

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  // System User association (for system user tokens)
  @Column('uuid', { nullable: true })
  systemUserId?: string;

  @ManyToOne(() => SystemUser, { nullable: true })
  @JoinColumn({ name: 'systemUserId' })
  systemUser?: SystemUser;

  // Business Manager association
  @Column('uuid', { nullable: true })
  businessManagerId?: string;

  @ManyToOne(() => BusinessManager, { nullable: true })
  @JoinColumn({ name: 'businessManagerId' })
  businessManager?: BusinessManager;

  // User association (for user access tokens)
  @Column('uuid', { nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  // Platform-specific data
  @Column({ nullable: true })
  platformUserId?: string; // User ID on the platform

  @Column({ nullable: true })
  platformAssetId?: string; // Asset ID (e.g., page ID for page tokens)

  // Rate limiting and usage tracking
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastRefreshedAt?: Date;

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

