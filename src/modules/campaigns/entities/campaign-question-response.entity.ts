import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { Campaign } from './campaign.entity';
import { CampaignQuestion } from './campaign-question.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';

@Entity('campaign_question_responses')
export class CampaignQuestionResponse implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  campaignId: string;

  @Column('uuid')
  questionId: string;

  @Column('text')
  answer: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  metadata?: {
    fileUrls?: string[];
    selectedOptions?: string[];
    rating?: number;
    additionalNotes?: string;
  };

  @Column('uuid', { nullable: true })
  createdBy: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne('Campaign', 'questionResponses')
  @JoinColumn({ name: 'campaignId' })
  campaign: any;

  @ManyToOne(() => CampaignQuestion)
  @JoinColumn({ name: 'questionId' })
  question: CampaignQuestion;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}
