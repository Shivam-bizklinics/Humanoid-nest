import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { User } from '../../authentication/entities/user.entity';
import { SocialMediaPlatform } from './social-media-platform.entity';
import { AgencyAuth } from './agency-auth.entity';
import { SocialMediaAccount } from './social-media-account.entity';

export enum AgencyAccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum AgencyAccountType {
  BUSINESS_MANAGER = 'business_manager',
  PARTNER = 'partner',
  RESELLER = 'reseller',
}

@Entity('agency_accounts')
export class AgencyAccount implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  platformId: string;

  @Column()
  externalAccountId: string; // Business Manager ID or Agency ID

  @Column()
  accountName: string;

  @Column({ nullable: true })
  businessManagerId?: string; // Meta Business Manager ID

  @Column({ nullable: true })
  agencyId?: string; // Meta Agency ID

  @Column({ default: AgencyAccountType.BUSINESS_MANAGER })
  accountType: AgencyAccountType;

  @Column({ default: AgencyAccountStatus.ACTIVE })
  status: AgencyAccountStatus;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ nullable: true })
  currency?: string;

  @Column('json', { nullable: true })
  capabilities?: string[]; // What this agency can do

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastSyncAt?: Date;

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

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => SocialMediaPlatform)
  @JoinColumn({ name: 'platformId' })
  platform: SocialMediaPlatform;

  @OneToMany(() => AgencyAuth, auth => auth.agencyAccount)
  auths?: AgencyAuth[];

  @OneToMany(() => SocialMediaAccount, account => account.agencyAccount)
  managedAccounts?: SocialMediaAccount[];
}
