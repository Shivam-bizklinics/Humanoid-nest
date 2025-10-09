import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsUUID, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignType, SocialPlatform, ContentType, SystemContentPillar } from '../../../shared/enums/campaign.enum';

export class PostCountsDto {
  @ApiPropertyOptional({ description: 'Number of image posts' })
  @IsOptional()
  @IsNumber()
  image?: number;

  @ApiPropertyOptional({ description: 'Number of GIF posts' })
  @IsOptional()
  @IsNumber()
  gif?: number;

  @ApiPropertyOptional({ description: 'Number of carousel posts' })
  @IsOptional()
  @IsNumber()
  carousel?: number;

  @ApiPropertyOptional({ description: 'Number of story posts' })
  @IsOptional()
  @IsNumber()
  story?: number;

  @ApiPropertyOptional({ description: 'Number of video posts' })
  @IsOptional()
  @IsNumber()
  video?: number;

  @ApiPropertyOptional({ description: 'Number of reel posts' })
  @IsOptional()
  @IsNumber()
  reel?: number;

  @ApiPropertyOptional({ description: 'Number of IGTV posts' })
  @IsOptional()
  @IsNumber()
  igtv?: number;

  @ApiPropertyOptional({ description: 'Number of live posts' })
  @IsOptional()
  @IsNumber()
  live?: number;

  @ApiPropertyOptional({ description: 'Number of poll posts' })
  @IsOptional()
  @IsNumber()
  poll?: number;

  @ApiPropertyOptional({ description: 'Number of quiz posts' })
  @IsOptional()
  @IsNumber()
  quiz?: number;

  @ApiPropertyOptional({ description: 'Number of text posts' })
  @IsOptional()
  @IsNumber()
  text?: number;

  @ApiPropertyOptional({ description: 'Number of link posts' })
  @IsOptional()
  @IsNumber()
  link?: number;
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Campaign type' })
  @IsOptional()
  @IsEnum(CampaignType)
  campaignType?: CampaignType;

  @ApiPropertyOptional({ description: 'Social platforms for the campaign', enum: SocialPlatform, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  socialPlatforms?: SocialPlatform[];

  @ApiPropertyOptional({ description: 'Total number of posts' })
  @IsOptional()
  @IsNumber()
  totalPosts?: number;

  @ApiPropertyOptional({ description: 'Count of each type of post' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostCountsDto)
  postCounts?: PostCountsDto;

  @ApiPropertyOptional({ description: 'Content type' })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @ApiPropertyOptional({ description: 'Things to promote' })
  @IsOptional()
  @IsString()
  thingsToPromote?: string;

  @ApiPropertyOptional({ description: 'Content pillars (array of IDs or names)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentPillars?: string[];

  @ApiPropertyOptional({ description: 'Campaign start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Campaign end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Workspace ID' })
  @IsUUID()
  workspaceId: string;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional({ description: 'Campaign name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Campaign type' })
  @IsOptional()
  @IsEnum(CampaignType)
  campaignType?: CampaignType;

  @ApiPropertyOptional({ description: 'Social platforms for the campaign', enum: SocialPlatform, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SocialPlatform, { each: true })
  socialPlatforms?: SocialPlatform[];

  @ApiPropertyOptional({ description: 'Total number of posts' })
  @IsOptional()
  @IsNumber()
  totalPosts?: number;

  @ApiPropertyOptional({ description: 'Count of each type of post' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PostCountsDto)
  postCounts?: PostCountsDto;

  @ApiPropertyOptional({ description: 'Content type' })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @ApiPropertyOptional({ description: 'Things to promote' })
  @IsOptional()
  @IsString()
  thingsToPromote?: string;

  @ApiPropertyOptional({ description: 'Content pillars (array of IDs or names)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentPillars?: string[];

  @ApiPropertyOptional({ description: 'Campaign start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Campaign end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CampaignResponseDto {
  @ApiProperty({ description: 'Campaign ID' })
  id: string;

  @ApiProperty({ description: 'Campaign name' })
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Campaign type' })
  campaignType?: CampaignType;

  @ApiPropertyOptional({ description: 'Social platforms', enum: SocialPlatform, isArray: true })
  socialPlatforms?: SocialPlatform[];

  @ApiPropertyOptional({ description: 'Total number of posts' })
  totalPosts?: number;

  @ApiPropertyOptional({ description: 'Count of each type of post' })
  postCounts?: PostCountsDto;

  @ApiPropertyOptional({ description: 'Content type' })
  contentType?: ContentType;

  @ApiPropertyOptional({ description: 'Things to promote' })
  thingsToPromote?: string;

  @ApiPropertyOptional({ description: 'Content pillars' })
  contentPillars?: string[];

  @ApiPropertyOptional({ description: 'Campaign start date' })
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Campaign end date' })
  endDate?: Date;

  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class CampaignWithPillarsResponseDto extends CampaignResponseDto {
  @ApiProperty({ description: 'Selected content pillars for this campaign' })
  selectedContentPillars: string[];

  @ApiProperty({ description: 'All available system content pillars', enum: SystemContentPillar, isArray: true })
  availableSystemPillars: SystemContentPillar[];
}

export class ContentPillarSelectionDto {
  @ApiPropertyOptional({ description: 'Selected content pillars (mix of system and custom pillar names/IDs)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentPillars?: string[];
}
