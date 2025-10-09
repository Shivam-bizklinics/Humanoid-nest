import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { ContentPillar } from './content-pillar.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { PostType } from '../../../shared/enums/campaign.enum';

@Entity('posts')
export class Post implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PostType,
  })
  type: PostType;

  @Column('uuid')
  campaignId: string;

  @Column('uuid', { nullable: true })
  contentPillarId?: string;

  @Column({ nullable: true })
  goals?: string;

  @Column({ nullable: true })
  contentIdea?: string;

  @Column({ nullable: true })
  callToAction?: string;

  @Column('text', { nullable: true })
  hashtags?: string;

  @Column('text', { nullable: true })
  fullCaption?: string;

  @Column({ type: 'json', nullable: true })
  mediaUrls?: {
    images?: string[];
    videos?: string[];
    thumbnails?: string[];
  };

  @Column({ type: 'json', nullable: true })
  metadata?: {
    dimensions?: { width: number; height: number };
    duration?: number; // for videos
    fileSize?: number;
    format?: string;
  };

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('uuid', { nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne('Campaign', 'posts')
  @JoinColumn({ name: 'campaignId' })
  campaign: any;

  @ManyToOne(() => ContentPillar)
  @JoinColumn({ name: 'contentPillarId' })
  contentPillar?: ContentPillar;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}
