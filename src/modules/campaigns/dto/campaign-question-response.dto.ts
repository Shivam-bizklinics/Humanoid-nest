import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsUUID, IsObject } from 'class-validator';

export class ResponseMetadataDto {
  @ApiPropertyOptional({ description: 'File URLs for file upload questions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileUrls?: string[];

  @ApiPropertyOptional({ description: 'Selected options for multi-select questions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptions?: string[];

  @ApiPropertyOptional({ description: 'Rating value for rating questions' })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class CreateCampaignQuestionResponseDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsUUID()
  campaignId: string;

  @ApiProperty({ description: 'Question ID' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ description: 'Answer to the question' })
  @IsString()
  answer: string;

  @ApiPropertyOptional({ description: 'Response metadata' })
  @IsOptional()
  @IsObject()
  metadata?: ResponseMetadataDto;
}

export class UpdateCampaignQuestionResponseDto {
  @ApiPropertyOptional({ description: 'Answer to the question' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiPropertyOptional({ description: 'Response metadata' })
  @IsOptional()
  @IsObject()
  metadata?: ResponseMetadataDto;
}

export class SubmitQuestionnaireDto {
  @ApiProperty({ description: 'Campaign ID' })
  @IsUUID()
  campaignId: string;

  @ApiProperty({ description: 'Array of question responses' })
  @IsArray()
  @IsObject({ each: true })
  responses: Array<{
    questionId: string;
    answer: string;
    metadata?: ResponseMetadataDto;
  }>;
}

export class CampaignQuestionResponseResponseDto {
  @ApiProperty({ description: 'Response ID' })
  id: string;

  @ApiProperty({ description: 'Campaign ID' })
  campaignId: string;

  @ApiProperty({ description: 'Question ID' })
  questionId: string;

  @ApiProperty({ description: 'Answer' })
  answer: string;

  @ApiPropertyOptional({ description: 'Response metadata' })
  metadata?: ResponseMetadataDto;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class QuestionnaireProgressDto {
  @ApiProperty({ description: 'Total number of questions' })
  totalQuestions: number;

  @ApiProperty({ description: 'Number of answered questions' })
  answeredQuestions: number;

  @ApiProperty({ description: 'Number of required questions' })
  requiredQuestions: number;

  @ApiProperty({ description: 'Number of answered required questions' })
  answeredRequiredQuestions: number;

  @ApiProperty({ description: 'Completion percentage' })
  completionPercentage: number;

  @ApiProperty({ description: 'Can complete campaign setup' })
  canCompleteSetup: boolean;
}
