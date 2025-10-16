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
import { PlatformAsset } from './platform-asset.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { 
  MetaCampaignObjective, 
  MetaCampaignStatus,
  MetaBidStrategy 
} from '../enums';

/**
 * Meta Campaign Entity
 * Represents Meta advertising campaigns
 * Synced with Meta Marketing API
 */
@Entity('meta_campaigns')
@Index(['platformCampaignId'], { unique: true })
@Index(['adAccountId'])
@Index(['status'])
export class MetaCampaign implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  platformCampaignId: string; // Campaign ID from Meta

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: MetaCampaignObjective,
  })
  objective: MetaCampaignObjective;

  @Column({
    type: 'enum',
    enum: MetaCampaignStatus,
    default: MetaCampaignStatus.PAUSED,
  })
  status: MetaCampaignStatus;

  @Column({
    type: 'enum',
    enum: MetaBidStrategy,
    nullable: true,
  })
  bidStrategy?: MetaBidStrategy;

  // Ad Account association
  @Column('uuid')
  @Index()
  adAccountId: string;

  @ManyToOne(() => PlatformAsset)
  @JoinColumn({ name: 'adAccountId' })
  adAccount: PlatformAsset;

  // Campaign configuration
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  dailyBudget?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  lifetimeBudget?: number;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  stopTime?: Date;

  // Special ad categories (for regulated verticals)
  @Column('text', { array: true, nullable: true })
  specialAdCategories?: string[];

  // Campaign performance metrics (cached for quick access)
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalSpend: number;

  @Column({ type: 'bigint', default: 0 })
  impressions: number;

  @Column({ type: 'bigint', default: 0 })
  clicks: number;

  @Column({ type: 'bigint', default: 0 })
  reach: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  ctr: number; // Click-through rate

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cpc: number; // Cost per click

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cpm: number; // Cost per mille (thousand impressions)

  // Platform data
  @Column('jsonb', { nullable: true })
  platformData?: {
    accountId?: string;
    campaignId?: string;
    createdTime?: string;
    updatedTime?: string;
    effectiveStatus?: string;
    buyingType?: string;
    spendCap?: string;
    issues?: any[];
    recommendations?: any[];
  };

  // Sync tracking
  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  metricsLastSyncedAt?: Date;

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

