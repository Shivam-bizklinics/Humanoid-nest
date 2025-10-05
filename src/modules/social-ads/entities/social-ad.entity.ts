import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { SocialMediaAccount } from './social-media-account.entity';
import { SocialAdCampaign } from './social-ad-campaign.entity';
import { SocialAdCreative } from './social-ad-creative.entity';
import { SocialAdPerformance } from './social-ad-performance.entity';
import { SocialAdTargeting } from './social-ad-targeting.entity';

export enum AdStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  PAUSED = 'paused',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum AdObjective {
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

export enum AdType {
  IMAGE = 'image',
  VIDEO = 'video',
  CAROUSEL = 'carousel',
  COLLECTION = 'collection',
  STORY = 'story',
  REELS = 'reels',
  TEXT = 'text',
}

@Entity('social_ads')
export class SocialAd implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid')
  accountId: string;

  @Column('uuid', { nullable: true })
  campaignId?: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  externalAdId: string; // ID from the social media platform

  @Column({ default: AdStatus.DRAFT })
  status: AdStatus;

  @Column({ default: AdObjective.AWARENESS })
  objective: AdObjective;

  @Column({ default: AdType.IMAGE })
  adType: AdType;

  @Column({ nullable: true })
  headline?: string;

  @Column({ nullable: true })
  primaryText?: string;

  @Column({ nullable: true })
  callToAction?: string;

  @Column({ nullable: true })
  linkUrl?: string;

  @Column({ nullable: true })
  displayUrl?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  budget?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  bidAmount?: number;

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

  @ManyToOne(() => SocialAdCampaign, campaign => campaign.ads)
  @JoinColumn({ name: 'campaignId' })
  campaign?: SocialAdCampaign;

  @OneToMany(() => SocialAdCreative, creative => creative.ad)
  creatives?: SocialAdCreative[];

  @OneToMany(() => SocialAdTargeting, targeting => targeting.ad)
  targeting?: SocialAdTargeting[];

  @OneToMany(() => SocialAdPerformance, performance => performance.ad)
  performance?: SocialAdPerformance[];
}
