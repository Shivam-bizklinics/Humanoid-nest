import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { SocialMediaAccount } from './social-media-account.entity';

export enum PlatformType {
  META = 'meta',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  SNAPCHAT = 'snapchat',
  TIKTOK = 'tiktok',
  YOUTUBE = 'youtube',
  PINTEREST = 'pinterest',
}

export enum PlatformStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DEPRECATED = 'deprecated',
}

@Entity('social_media_platforms')
export class SocialMediaPlatform implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  type: PlatformType;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  websiteUrl?: string;

  @Column({ default: PlatformStatus.ACTIVE })
  status: PlatformStatus;

  @Column('json', { nullable: true })
  configuration?: Record<string, any>;

  @Column('json', { nullable: true })
  apiEndpoints?: Record<string, string>;

  @Column('json', { nullable: true })
  supportedFeatures?: string[];

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
  @OneToMany(() => SocialMediaAccount, account => account.platform)
  accounts?: SocialMediaAccount[];
}
