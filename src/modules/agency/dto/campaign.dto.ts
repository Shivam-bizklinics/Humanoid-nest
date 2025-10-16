import { IsString, IsEnum, IsOptional, IsUUID, IsNumber, IsArray, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  MetaCampaignObjective, 
  MetaCampaignStatus,
  MetaBidStrategy 
} from '../enums';

export class CreateMetaCampaignDto {
  @ApiProperty()
  @IsUUID()
  adAccountId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: MetaCampaignObjective })
  @IsEnum(MetaCampaignObjective)
  objective: MetaCampaignObjective;

  @ApiProperty({ enum: MetaCampaignStatus })
  @IsEnum(MetaCampaignStatus)
  status: MetaCampaignStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dailyBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lifetimeBudget?: number;

  @ApiPropertyOptional({ enum: MetaBidStrategy })
  @IsOptional()
  @IsEnum(MetaBidStrategy)
  bidStrategy?: MetaBidStrategy;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialAdCategories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startTime?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  stopTime?: Date;
}

export class UpdateMetaCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: MetaCampaignStatus })
  @IsOptional()
  @IsEnum(MetaCampaignStatus)
  status?: MetaCampaignStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dailyBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lifetimeBudget?: number;

  @ApiPropertyOptional({ enum: MetaBidStrategy })
  @IsOptional()
  @IsEnum(MetaBidStrategy)
  bidStrategy?: MetaBidStrategy;
}

export class BatchCreateCampaignsDto {
  @ApiProperty({
    type: [CreateMetaCampaignDto],
    description: 'Array of campaigns to create',
  })
  @IsArray()
  campaigns: Omit<CreateMetaCampaignDto, 'adAccountId'>[];

  @ApiProperty()
  @IsUUID()
  adAccountId: string;
}

export class BatchUpdateCampaignStatusDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  campaignIds: string[];

  @ApiProperty({ enum: MetaCampaignStatus })
  @IsEnum(MetaCampaignStatus)
  status: MetaCampaignStatus;
}

export class SyncCampaignDto {
  @ApiProperty()
  @IsUUID()
  campaignId: string;
}

export class SyncAdAccountCampaignsDto {
  @ApiProperty()
  @IsUUID()
  adAccountId: string;
}

