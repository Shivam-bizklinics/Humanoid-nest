import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { SocialAd } from './social-ad.entity';

export enum PerformanceMetric {
  IMPRESSIONS = 'impressions',
  REACH = 'reach',
  FREQUENCY = 'frequency',
  CLICKS = 'clicks',
  CTR = 'ctr', // Click-through rate
  ENGAGEMENT = 'engagement',
  LIKES = 'likes',
  COMMENTS = 'comments',
  SHARES = 'shares',
  SAVES = 'saves',
  VIDEO_VIEWS = 'video_views',
  VIDEO_COMPLETION_RATE = 'video_completion_rate',
  CONVERSIONS = 'conversions',
  CONVERSION_RATE = 'conversion_rate',
  COST_PER_CLICK = 'cost_per_click',
  COST_PER_IMPRESSION = 'cost_per_impression',
  COST_PER_CONVERSION = 'cost_per_conversion',
  SPEND = 'spend',
  ROAS = 'roas', // Return on ad spend
}

@Entity('social_ad_performance')
export class SocialAdPerformance implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  adId: string;

  @Column()
  date: Date;

  @Column({ default: PerformanceMetric.IMPRESSIONS })
  metric: PerformanceMetric;

  @Column('decimal', { precision: 15, scale: 4 })
  value: number;

  @Column({ nullable: true })
  currency?: string;

  @Column('json', { nullable: true })
  breakdown?: Record<string, any>;

  @Column('json', { nullable: true })
  metadata?: Record<string, any>;

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
  @ManyToOne(() => SocialAd, ad => ad.performance)
  @JoinColumn({ name: 'adId' })
  ad: SocialAd;
}
