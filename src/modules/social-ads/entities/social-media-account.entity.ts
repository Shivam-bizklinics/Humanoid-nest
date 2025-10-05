import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { SocialMediaPlatform } from './social-media-platform.entity';
import { SocialMediaAuth } from './social-media-auth.entity';
import { SocialAd } from './social-ad.entity';
import { AgencyAccount } from './agency-account.entity';

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  DISCONNECTED = 'disconnected',
}

export enum AccountType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  CREATOR = 'creator',
  AGENCY = 'agency',
}

@Entity('social_media_accounts')
export class SocialMediaAccount implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid')
  platformId: string;

  @Column('uuid', { nullable: true })
  agencyAccountId?: string; // Optional: If this account is managed by an agency

  @Column()
  externalAccountId: string; // ID from the social media platform

  @Column()
  accountName: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  profilePictureUrl?: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  websiteUrl?: string;

  @Column({ nullable: true })
  followersCount?: number;

  @Column({ nullable: true })
  followingCount?: number;

  @Column({ default: AccountType.PERSONAL })
  accountType: AccountType;

  @Column({ default: AccountStatus.ACTIVE })
  status: AccountStatus;

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
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => SocialMediaPlatform)
  @JoinColumn({ name: 'platformId' })
  platform: SocialMediaPlatform;

  @OneToMany(() => SocialMediaAuth, auth => auth.account)
  auths?: SocialMediaAuth[];

  @ManyToOne(() => AgencyAccount, agencyAccount => agencyAccount.managedAccounts)
  @JoinColumn({ name: 'agencyAccountId' })
  agencyAccount?: AgencyAccount;

  @OneToMany(() => SocialAd, ad => ad.account)
  ads?: SocialAd[];
}
