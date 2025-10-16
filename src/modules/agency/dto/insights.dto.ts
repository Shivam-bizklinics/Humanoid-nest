import { IsEnum, IsOptional, IsUUID, IsArray, IsDate, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  MetaInsightDatePreset, 
  MetaInsightBreakdown,
  Platform 
} from '../enums';

export class FetchAdAccountInsightsDto {
  @ApiProperty()
  @IsUUID()
  adAccountId: string;

  @ApiProperty({ enum: MetaInsightDatePreset })
  @IsEnum(MetaInsightDatePreset)
  datePreset: MetaInsightDatePreset;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class FetchCampaignInsightsDto {
  @ApiProperty()
  @IsUUID()
  campaignId: string;

  @ApiProperty({ enum: MetaInsightDatePreset })
  @IsEnum(MetaInsightDatePreset)
  datePreset: MetaInsightDatePreset;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ type: [String], enum: MetaInsightBreakdown })
  @IsOptional()
  @IsArray()
  @IsEnum(MetaInsightBreakdown, { each: true })
  breakdowns?: MetaInsightBreakdown[];
}

export class GetWorkspaceInsightsDto {
  @ApiProperty()
  @IsUUID()
  workspaceId: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}

export class GetCampaignsInsightsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  campaignIds: string[];

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}

export class GetTopPerformingCampaignsDto {
  @ApiProperty()
  @IsUUID()
  workspaceId: string;

  @ApiProperty({ enum: ['spend', 'impressions', 'clicks', 'conversions', 'roas'] })
  @IsEnum(['spend', 'impressions', 'clicks', 'conversions', 'roas'])
  metric: 'spend' | 'impressions' | 'clicks' | 'conversions' | 'roas';

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class BatchFetchInsightsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  adAccountIds: string[];

  @ApiProperty({ enum: MetaInsightDatePreset })
  @IsEnum(MetaInsightDatePreset)
  datePreset: MetaInsightDatePreset;
}

