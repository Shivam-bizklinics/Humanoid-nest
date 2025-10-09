import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { CampaignType, SocialPlatform, ContentType } from '../../../shared/enums/campaign.enum';

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('campaigns')
export class Campaign implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid', { nullable: true })
  createdBy: string;

  // New campaign fields
  @Column({
    type: 'enum',
    enum: CampaignType,
    nullable: true,
  })
  campaignType?: CampaignType;

  @Column({
    type: 'json',
    nullable: true,
  })
  socialPlatforms?: SocialPlatform[];

  @Column({ default: 0 })
  totalPosts: number;

  @Column({
    type: 'json',
    nullable: true,
  })
  postCounts?: {
    image?: number;
    gif?: number;
    carousel?: number;
    story?: number;
    video?: number;
    reel?: number;
    igtv?: number;
    live?: number;
    poll?: number;
    quiz?: number;
    text?: number;
    link?: number;
  };

  @Column({
    type: 'enum',
    enum: ContentType,
    nullable: true,
  })
  contentType?: ContentType;

  @Column({ nullable: true })
  thingsToPromote?: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  contentPillars?: string[]; // Array of content pillar IDs or names

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  // Relations for audit trail
  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;

  // Relations
  @OneToMany('Post', 'campaign')
  posts: any[];
}
