import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsObject, IsArray } from 'class-validator';
import { PostType } from '../../../shared/enums/campaign.enum';

export class MediaUrlsDto {
  @ApiPropertyOptional({ description: 'Array of image URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Array of video URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @ApiPropertyOptional({ description: 'Array of thumbnail URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  thumbnails?: string[];
}

export class PostMetadataDto {
  @ApiPropertyOptional({ description: 'Media dimensions' })
  @IsOptional()
  @IsObject()
  dimensions?: { width: number; height: number };

  @ApiPropertyOptional({ description: 'Video duration in seconds' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'File format' })
  @IsOptional()
  @IsString()
  format?: string;
}

export class CreatePostDto {
  @ApiProperty({ description: 'Post title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Post description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Post type' })
  @IsEnum(PostType)
  type: PostType;

  @ApiProperty({ description: 'Campaign ID' })
  @IsUUID()
  campaignId: string;

  @ApiPropertyOptional({ description: 'Content pillar ID' })
  @IsOptional()
  @IsUUID()
  contentPillarId?: string;

  @ApiPropertyOptional({ description: 'Post goals' })
  @IsOptional()
  @IsString()
  goals?: string;

  @ApiPropertyOptional({ description: 'Content idea' })
  @IsOptional()
  @IsString()
  contentIdea?: string;

  @ApiPropertyOptional({ description: 'Call to action' })
  @IsOptional()
  @IsString()
  callToAction?: string;

  @ApiPropertyOptional({ description: 'Hashtags' })
  @IsOptional()
  @IsString()
  hashtags?: string;

  @ApiPropertyOptional({ description: 'Full caption' })
  @IsOptional()
  @IsString()
  fullCaption?: string;

  @ApiPropertyOptional({ description: 'Media URLs' })
  @IsOptional()
  @IsObject()
  mediaUrls?: MediaUrlsDto;

  @ApiPropertyOptional({ description: 'Post metadata' })
  @IsOptional()
  @IsObject()
  metadata?: PostMetadataDto;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ description: 'Post title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Post description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Post type' })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiPropertyOptional({ description: 'Content pillar ID' })
  @IsOptional()
  @IsUUID()
  contentPillarId?: string;

  @ApiPropertyOptional({ description: 'Post goals' })
  @IsOptional()
  @IsString()
  goals?: string;

  @ApiPropertyOptional({ description: 'Content idea' })
  @IsOptional()
  @IsString()
  contentIdea?: string;

  @ApiPropertyOptional({ description: 'Call to action' })
  @IsOptional()
  @IsString()
  callToAction?: string;

  @ApiPropertyOptional({ description: 'Hashtags' })
  @IsOptional()
  @IsString()
  hashtags?: string;

  @ApiPropertyOptional({ description: 'Full caption' })
  @IsOptional()
  @IsString()
  fullCaption?: string;

  @ApiPropertyOptional({ description: 'Media URLs' })
  @IsOptional()
  @IsObject()
  mediaUrls?: MediaUrlsDto;

  @ApiPropertyOptional({ description: 'Post metadata' })
  @IsOptional()
  @IsObject()
  metadata?: PostMetadataDto;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class PostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiPropertyOptional({ description: 'Post description' })
  description?: string;

  @ApiProperty({ description: 'Post type' })
  type: PostType;

  @ApiProperty({ description: 'Campaign ID' })
  campaignId: string;

  @ApiPropertyOptional({ description: 'Content pillar ID' })
  contentPillarId?: string;

  @ApiPropertyOptional({ description: 'Post goals' })
  goals?: string;

  @ApiPropertyOptional({ description: 'Content idea' })
  contentIdea?: string;

  @ApiPropertyOptional({ description: 'Call to action' })
  callToAction?: string;

  @ApiPropertyOptional({ description: 'Hashtags' })
  hashtags?: string;

  @ApiPropertyOptional({ description: 'Full caption' })
  fullCaption?: string;

  @ApiPropertyOptional({ description: 'Media URLs' })
  mediaUrls?: MediaUrlsDto;

  @ApiPropertyOptional({ description: 'Post metadata' })
  metadata?: PostMetadataDto;

  @ApiPropertyOptional({ description: 'Display order' })
  displayOrder?: number;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}
