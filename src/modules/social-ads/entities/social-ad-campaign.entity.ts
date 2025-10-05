import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { SocialMediaAccount } from './social-media-account.entity';
import { SocialAd } from './social-ad.entity';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum CampaignObjective {
  AWARENESS = 'awareness',
  TRAFFIC = 'traffic',
  ENGAGEMENT = 'engagement',
  LEADS = 'leads',
  SALES = 'sales',
  APP_INSTALLS = 'app_installs',
  VIDEO_VIEWS = 'video_views',
  REACH = 'reach',
  BRAND_AWARENESS = 'brand_awareness',
  CONVERSIONS = 'conversions',
}

export enum BudgetType {
  DAILY = 'daily',
  LIFETIME = 'lifetime',
}

@Entity('social_ad_campaigns')
export class SocialAdCampaign implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid')
  accountId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  externalCampaignId: string; // ID from the social media platform

  @Column({ default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column({ default: CampaignObjective.AWARENESS })
  objective: CampaignObjective;

  @Column({ default: BudgetType.DAILY })
  budgetType: BudgetType;

  @Column('decimal', { precision: 10, scale: 2 })
  budget: number;

  @Column({ nullable: true })
  startDate?: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

  @Column('json', { nullable: true })
  platformSpecificData?: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

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

  @ManyToOne(() => SocialMediaAccount)
  @JoinColumn({ name: 'accountId' })
  account: SocialMediaAccount;

  @OneToMany(() => SocialAd, ad => ad.campaign)
  ads?: SocialAd[];
}
