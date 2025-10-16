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
import { BusinessManager } from './business-manager.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { 
  SystemUserRole, 
  SystemUserStatus,
  Platform 
} from '../enums';

/**
 * System User Entity
 * Represents platform system users (e.g., Meta System User)
 * Enables one-time authentication for long-term API access
 */
@Entity('system_users')
@Index(['platform', 'platformSystemUserId'], { unique: true })
@Index(['businessManagerId'])
@Index(['status'])
export class SystemUser implements BaseEntity {
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

  @Column({ unique: true })
  platformSystemUserId: string; // System User ID from platform

  @Column({
    type: 'enum',
    enum: SystemUserRole,
    default: SystemUserRole.EMPLOYEE,
  })
  role: SystemUserRole;

  @Column({
    type: 'enum',
    enum: SystemUserStatus,
    default: SystemUserStatus.PENDING,
  })
  status: SystemUserStatus;

  // Business Manager association
  @Column('uuid')
  businessManagerId: string;

  @ManyToOne(() => BusinessManager)
  @JoinColumn({ name: 'businessManagerId' })
  businessManager: BusinessManager;

  // Platform-specific configuration
  @Column('jsonb', { nullable: true })
  platformConfig?: {
    tasks?: string[]; // Tasks/permissions assigned to system user
    assets?: string[]; // Asset IDs accessible
    appId?: string; // Associated app ID
  };

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

