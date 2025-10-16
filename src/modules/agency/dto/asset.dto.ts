import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  AssetType, 
  AssetPermissionLevel,
  Platform 
} from '../enums';

export class DiscoverAssetsDto {
  @ApiProperty()
  @IsUUID()
  businessManagerId: string;
}

export class AssignAssetToWorkspaceDto {
  @ApiProperty()
  @IsUUID()
  assetId: string;

  @ApiProperty()
  @IsUUID()
  workspaceId: string;
}

export class RequestAssetAccessDto {
  @ApiProperty()
  @IsUUID()
  assetId: string;

  @ApiProperty()
  @IsString()
  targetBusinessManagerId: string;

  @ApiProperty({ enum: AssetPermissionLevel })
  @IsEnum(AssetPermissionLevel)
  permission: AssetPermissionLevel;
}

export class SyncAssetDto {
  @ApiProperty()
  @IsUUID()
  assetId: string;
}

export class GetAssetsByTypeDto {
  @ApiPropertyOptional({ enum: AssetType })
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  businessManagerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}

