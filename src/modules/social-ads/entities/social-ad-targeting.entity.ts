import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { SocialAd } from './social-ad.entity';

export enum TargetingType {
  DEMOGRAPHIC = 'demographic',
  INTEREST = 'interest',
  BEHAVIOR = 'behavior',
  LOCATION = 'location',
  CUSTOM_AUDIENCE = 'custom_audience',
  LOOKALIKE = 'lookalike',
  RETARGETING = 'retargeting',
}

@Entity('social_ad_targeting')
export class SocialAdTargeting implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  adId: string;

  @Column()
  name: string;

  @Column({ default: TargetingType.DEMOGRAPHIC })
  type: TargetingType;

  @Column('json')
  criteria: Record<string, any>;

  @Column({ nullable: true })
  description?: string;

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
  @ManyToOne(() => SocialAd, ad => ad.targeting)
  @JoinColumn({ name: 'adId' })
  ad: SocialAd;
}
