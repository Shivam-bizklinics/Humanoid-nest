import { IsString, IsEnum, IsOptional, IsUUID, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetGroupType, AssetGroupStatus } from '../enums';

export class CreateAssetGroupDto {
  @ApiProperty()
  @IsUUID()
  businessManagerId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AssetGroupType })
  @IsEnum(AssetGroupType)
  groupType: AssetGroupType;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assetIds?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  syncToPlatform?: boolean;
}

export class UpdateAssetGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AssetGroupStatus })
  @IsOptional()
  @IsEnum(AssetGroupStatus)
  status?: AssetGroupStatus;
}

export class AddAssetsToGroupDto {
  @ApiProperty()
  @IsUUID()
  assetGroupId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  assetIds: string[];
}

export class RemoveAssetsFromGroupDto {
  @ApiProperty()
  @IsUUID()
  assetGroupId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  assetIds: string[];
}

