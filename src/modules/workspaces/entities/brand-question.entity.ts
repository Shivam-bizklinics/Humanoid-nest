import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { BrandQuestionResponse } from './brand-question-response.entity';


export enum QuestionType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  URL = 'url',
  EMAIL = 'email',
  NUMBER = 'number',
  DATE = 'date',
  FILE_UPLOAD = 'file_upload',
}

@Entity('brand_questions')
export class BrandQuestion implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  questionText: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.TEXT
  })
  questionType: QuestionType;

  @Column({ type: 'json', nullable: true })
  options?: string[]; // For select, radio, checkbox, multi_select types

  @Column({ type: 'json', nullable: true })
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
  };

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ default: false })
  isMandatory: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  helpText?: string;

  @Column({ type: 'json', nullable: true })
  conditionalLogic?: {
    dependsOn?: string; // Question ID this depends on
    condition?: string; // Condition to show this question
    value?: any; // Value to check against
  };

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
  @OneToMany(() => BrandQuestionResponse, response => response.question)
  responses?: BrandQuestionResponse[];
}
