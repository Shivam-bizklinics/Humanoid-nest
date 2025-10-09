import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean, IsObject, IsUUID } from 'class-validator';
import { QuestionType } from '../entities/campaign-question.entity';

export class ValidationDto {
  @ApiPropertyOptional({ description: 'Minimum length for text inputs' })
  @IsOptional()
  @IsNumber()
  minLength?: number;

  @ApiPropertyOptional({ description: 'Maximum length for text inputs' })
  @IsOptional()
  @IsNumber()
  maxLength?: number;

  @ApiPropertyOptional({ description: 'Minimum value for number inputs' })
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({ description: 'Maximum value for number inputs' })
  @IsOptional()
  @IsNumber()
  max?: number;

  @ApiPropertyOptional({ description: 'Regex pattern for validation' })
  @IsOptional()
  @IsString()
  pattern?: string;

  @ApiPropertyOptional({ description: 'Custom validation message' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

export class QuestionMetadataDto {
  @ApiPropertyOptional({ description: 'Input placeholder text' })
  @IsOptional()
  @IsString()
  placeholder?: string;

  @ApiPropertyOptional({ description: 'Help text for the question' })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiPropertyOptional({ description: 'Question category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Question tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateCampaignQuestionDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  question: string;

  @ApiPropertyOptional({ description: 'Question description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Question type' })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiPropertyOptional({ description: 'Options for select/multi-select questions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is question required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsObject()
  validation?: ValidationDto;

  @ApiPropertyOptional({ description: 'Question metadata' })
  @IsOptional()
  @IsObject()
  metadata?: QuestionMetadataDto;
}

export class UpdateCampaignQuestionDto {
  @ApiPropertyOptional({ description: 'Question text' })
  @IsOptional()
  @IsString()
  question?: string;

  @ApiPropertyOptional({ description: 'Question description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Question type' })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ description: 'Options for select/multi-select questions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is question required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsObject()
  validation?: ValidationDto;

  @ApiPropertyOptional({ description: 'Question metadata' })
  @IsOptional()
  @IsObject()
  metadata?: QuestionMetadataDto;
}

export class CampaignQuestionResponseDto {
  @ApiProperty({ description: 'Question ID' })
  id: string;

  @ApiProperty({ description: 'Question text' })
  question: string;

  @ApiPropertyOptional({ description: 'Question description' })
  description?: string;

  @ApiProperty({ description: 'Question type' })
  type: QuestionType;

  @ApiPropertyOptional({ description: 'Options for select/multi-select questions' })
  options?: string[];

  @ApiProperty({ description: 'Display order' })
  displayOrder: number;

  @ApiProperty({ description: 'Is question required' })
  isRequired: boolean;

  @ApiPropertyOptional({ description: 'Validation rules' })
  validation?: ValidationDto;

  @ApiPropertyOptional({ description: 'Question metadata' })
  metadata?: QuestionMetadataDto;

  @ApiPropertyOptional({ description: 'User response to this question' })
  userResponse?: string;

  @ApiPropertyOptional({ description: 'Response metadata' })
  responseMetadata?: any;
}
