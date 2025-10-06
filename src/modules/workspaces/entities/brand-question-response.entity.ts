import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { BrandQuestion } from './brand-question.entity';
import { Workspace } from './workspace.entity';
import { User } from '../../authentication/entities/user.entity';

@Entity('brand_question_responses')
@Unique(['workspaceId', 'questionId'])
export class BrandQuestionResponse implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid')
  questionId: string;

  @Column({ type: 'text' })
  answer: string;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => BrandQuestion)
  @JoinColumn({ name: 'questionId' })
  question: BrandQuestion;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}
