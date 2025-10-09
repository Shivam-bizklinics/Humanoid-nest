import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';

export enum QuestionType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  SINGLE_SELECT = 'single_select',
  MULTI_SELECT = 'multi_select',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  RATING = 'rating',
  FILE_UPLOAD = 'file_upload',
}

@Entity('campaign_questions')
export class CampaignQuestion implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.TEXT,
  })
  type: QuestionType;

  @Column({
    type: 'json',
    nullable: true,
  })
  options?: string[]; // For select/multi-select questions

  @Column({ default: 1 })
  displayOrder: number;

  @Column({ default: false })
  isRequired: boolean;

  @Column({
    type: 'json',
    nullable: true,
  })
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    customMessage?: string;
  };

  @Column({
    type: 'json',
    nullable: true,
  })
  metadata?: {
    placeholder?: string;
    helpText?: string;
    category?: string;
    tags?: string[];
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
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}
