import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { Platform } from '../enums';

/**
 * Insight Data Entity
 * Stores aggregated analytics and performance data from platform APIs
 * Centralized analytics for all campaigns across platforms
 * Optimized for fast reads and aggregations
 */
@Entity('insight_data')
@Index(['platform', 'insightLevel', 'platformEntityId', 'reportDate'], { unique: true })
@Index(['platform', 'insightLevel', 'reportDate'])
@Index(['businessManagerId'])
@Index(['workspaceId'])
@Index(['reportDate'])
export class InsightData implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: Platform,
  })
  @Index()
  platform: Platform;

  // Entity identification
  @Column()
  insightLevel: string; // 'account', 'campaign', 'adset', 'ad', 'page', etc.

  @Column()
  platformEntityId: string; // ID of the entity (campaign ID, ad set ID, etc.)

  @Column()
  entityName: string; // Name of the entity

  // Date range for this insight
  @Column({ type: 'date' })
  @Index()
  reportDate: Date;

  @Column({ type: 'date', nullable: true })
  dateStart?: Date;

  @Column({ type: 'date', nullable: true })
  dateStop?: Date;

  // Business context
  @Column('uuid', { nullable: true })
  @Index()
  businessManagerId?: string;

  @Column('uuid', { nullable: true })
  @Index()
  workspaceId?: string;

  @Column('uuid', { nullable: true })
  adAccountId?: string; // Internal platform_asset ID

  // Core metrics (common across platforms)
  @Column({ type: 'bigint', default: 0 })
  impressions: number;

  @Column({ type: 'bigint', default: 0 })
  clicks: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  spend: number;

  @Column({ type: 'bigint', default: 0 })
  reach: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  frequency: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cpm: number; // Cost per 1000 impressions

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cpc: number; // Cost per click

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  ctr: number; // Click-through rate

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cpp: number; // Cost per 1000 people reached

  // Conversion metrics
  @Column({ type: 'int', default: 0 })
  conversions: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  conversionValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  costPerConversion: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  roas: number; // Return on ad spend

  // Engagement metrics
  @Column({ type: 'int', default: 0 })
  postEngagement: number;

  @Column({ type: 'int', default: 0 })
  pageEngagement: number;

  @Column({ type: 'int', default: 0 })
  linkClicks: number;

  @Column({ type: 'int', default: 0 })
  reactions: number;

  @Column({ type: 'int', default: 0 })
  comments: number;

  @Column({ type: 'int', default: 0 })
  shares: number;

  @Column({ type: 'int', default: 0 })
  saves: number;

  // Video metrics
  @Column({ type: 'bigint', default: 0 })
  videoViews: number;

  @Column({ type: 'int', default: 0 })
  videoThruPlays: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  videoViewRate: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  avgWatchTime: number;

  // Platform-specific metrics and breakdowns
  @Column('jsonb', { nullable: true })
  platformMetrics?: {
    // Meta specific
    frequency?: number;
    socialSpend?: number;
    qualityRanking?: string;
    engagementRateRanking?: string;
    conversionRateRanking?: string;
    
    // LinkedIn specific
    viralImpressions?: number;
    viralClicks?: number;
    
    // YouTube specific
    averageViewDuration?: number;
    averageViewPercentage?: number;
    
    // Any platform-specific metrics
    [key: string]: any;
  };

  @Column('jsonb', { nullable: true })
  breakdowns?: {
    age?: Record<string, any>;
    gender?: Record<string, any>;
    country?: Record<string, any>;
    placement?: Record<string, any>;
    device?: Record<string, any>;
    [key: string]: any;
  };

  // Actions breakdown (for conversions)
  @Column('jsonb', { nullable: true })
  actions?: Array<{
    actionType: string;
    value: number;
  }>;

  @Column('jsonb', { nullable: true })
  actionValues?: Array<{
    actionType: string;
    value: number;
  }>;

  // Raw data from platform (for debugging and future use)
  @Column('jsonb', { nullable: true })
  rawData?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @Column('uuid', { nullable: true })
  updatedBy?: string;
}

