import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { SocialAd } from './social-ad.entity';

export enum CreativeType {
  IMAGE = 'image',
  VIDEO = 'video',
  CAROUSEL = 'carousel',
  COLLECTION = 'collection',
  STORY = 'story',
  REELS = 'reels',
  TEXT = 'text',
}

export enum MediaFormat {
  JPG = 'jpg',
  PNG = 'png',
  GIF = 'gif',
  MP4 = 'mp4',
  MOV = 'mov',
  WEBM = 'webm',
}

@Entity('social_ad_creatives')
export class SocialAdCreative implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  adId: string;

  @Column()
  name: string;

  @Column({ default: CreativeType.IMAGE })
  type: CreativeType;

  @Column()
  mediaUrl: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  altText?: string;

  @Column({ nullable: true })
  caption?: string;

  @Column({ nullable: true })
  headline?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  callToAction?: string;

  @Column({ nullable: true })
  linkUrl?: string;

  @Column({ nullable: true })
  displayUrl?: string;

  @Column({ nullable: true })
  mediaFormat?: MediaFormat;

  @Column({ nullable: true })
  fileSize?: number;

  @Column({ nullable: true })
  duration?: number; // For videos, in seconds

  @Column({ nullable: true })
  width?: number;

  @Column({ nullable: true })
  height?: number;

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
  @ManyToOne(() => SocialAd, ad => ad.creatives)
  @JoinColumn({ name: 'adId' })
  ad: SocialAd;
}
