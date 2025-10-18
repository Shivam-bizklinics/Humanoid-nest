import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { SystemContentPillar } from '../../../shared/enums/campaign.enum';

export class CreateContentPillarDto {
  @ApiProperty({ description: 'Content pillar name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Content pillar description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Content pillar type' })
  @IsOptional()
  @IsEnum(SystemContentPillar)
  type?: SystemContentPillar;

  @ApiPropertyOptional({ description: 'System content pillar (if type is SYSTEM)' })
  @IsOptional()
  @IsEnum(SystemContentPillar)
  systemPillar?: SystemContentPillar;

  @ApiProperty({ description: 'Workspace ID' })
  @IsUUID()
  workspaceId: string;
}

export class UpdateContentPillarDto {
  @ApiPropertyOptional({ description: 'Content pillar name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Content pillar description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Content pillar type' })
  @IsOptional()
  @IsEnum(SystemContentPillar)
  type?: SystemContentPillar;

  @ApiPropertyOptional({ description: 'System content pillar (if type is SYSTEM)' })
  @IsOptional()
  @IsEnum(SystemContentPillar)
  systemPillar?: SystemContentPillar;
}

export class ContentPillarResponseDto {
  @ApiProperty({ description: 'Content pillar ID' })
  id: string;

  @ApiProperty({ description: 'Content pillar name' })
  name: string;

  @ApiPropertyOptional({ description: 'Content pillar description' })
  description?: string;

  @ApiProperty({ description: 'Content pillar type' })
  type: SystemContentPillar;

  @ApiPropertyOptional({ description: 'System content pillar' })
  systemPillar?: SystemContentPillar;

  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}
