import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '../entities/brand-question.entity';

export class CreateBrandQuestionDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  questionText: string;

  @ApiPropertyOptional({ description: 'Question description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Question type', enum: QuestionType })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiPropertyOptional({ description: 'Options for select/radio/checkbox questions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsObject()
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
  };

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is question mandatory' })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ description: 'Help text for the question' })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiPropertyOptional({ description: 'Conditional logic for showing question' })
  @IsOptional()
  @IsObject()
  conditionalLogic?: {
    dependsOn?: string;
    condition?: string;
    value?: any;
  };
}

export class UpdateBrandQuestionDto {
  @ApiPropertyOptional({ description: 'Question text' })
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional({ description: 'Question description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Question type', enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @ApiPropertyOptional({ description: 'Options for select/radio/checkbox questions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsObject()
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    required?: boolean;
  };

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is question mandatory' })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ description: 'Help text for the question' })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiPropertyOptional({ description: 'Conditional logic for showing question' })
  @IsOptional()
  @IsObject()
  conditionalLogic?: {
    dependsOn?: string;
    condition?: string;
    value?: any;
  };

  @ApiPropertyOptional({ description: 'Is question active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BrandQuestionResponseDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Answer text' })
  @IsString()
  answer: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: {
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    additionalData?: any;
  };
}

export class SubmitBrandQuestionnaireDto {
  @ApiProperty({ description: 'Array of question responses' })
  @IsArray()
  responses: BrandQuestionResponseDto[];
}

export class ReorderQuestionsDto {
  @ApiProperty({ description: 'Array of question IDs in new order' })
  @IsArray()
  @IsString({ each: true })
  questionIds: string[];
}

export class QuestionnaireCompletionStatusDto {
  @ApiProperty({ description: 'Total number of questions' })
  totalQuestions: number;

  @ApiProperty({ description: 'Number of answered questions' })
  answeredQuestions: number;

  @ApiProperty({ description: 'Number of mandatory questions' })
  mandatoryQuestions: number;

  @ApiProperty({ description: 'Number of answered mandatory questions' })
  answeredMandatory: number;

  @ApiProperty({ description: 'Whether questionnaire is complete' })
  isComplete: boolean;
}

export class QuestionnaireResponseDto {
  @ApiProperty({ description: 'Questions in the questionnaire' })
  questions: any[];

  @ApiProperty({ description: 'Existing responses' })
  responses: any[];

  @ApiProperty({ description: 'Completion status', type: QuestionnaireCompletionStatusDto })
  completionStatus: QuestionnaireCompletionStatusDto;
}
