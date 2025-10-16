import { IsString, IsEnum, IsOptional, IsUUID, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  BusinessManagerType, 
  BusinessManagerStatus, 
  BusinessManagerRelationship,
  Platform 
} from '../enums';

export class CreateBusinessManagerDto {
  @ApiProperty({ enum: Platform })
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty()
  @IsString()
  platformBusinessId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: BusinessManagerType })
  @IsEnum(BusinessManagerType)
  type: BusinessManagerType;

  @ApiProperty({ enum: BusinessManagerRelationship })
  @IsEnum(BusinessManagerRelationship)
  relationship: BusinessManagerRelationship;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentBusinessManagerId?: string;
}

export class UpdateBusinessManagerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: BusinessManagerStatus })
  @IsOptional()
  @IsEnum(BusinessManagerStatus)
  status?: BusinessManagerStatus;
}

export class ConnectBusinessManagerDto {
  @ApiProperty({ enum: Platform })
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty()
  @IsString()
  platformBusinessId: string;

  @ApiProperty()
  @IsUUID()
  parentBusinessManagerId: string;

  @ApiProperty({ enum: BusinessManagerType })
  @IsEnum(BusinessManagerType)
  type: BusinessManagerType;

  @ApiProperty({ enum: BusinessManagerRelationship })
  @IsEnum(BusinessManagerRelationship)
  relationship: BusinessManagerRelationship;
}

export class RequestBusinessAccessDto {
  @ApiProperty()
  @IsString()
  targetBusinessId: string;

  @ApiProperty()
  @IsUUID()
  parentBusinessManagerId: string;

  @ApiProperty({ enum: Platform, default: Platform.META })
  @IsEnum(Platform)
  platform: Platform;
}

