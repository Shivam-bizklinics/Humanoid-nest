import { IsUUID, IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardPageAsWorkspaceDto {
  @ApiProperty()
  @IsUUID()
  pageAssetId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoLinkAssets?: boolean;
}

export class BatchOnboardPagesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  pageAssetIds: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoLinkAssets?: boolean;
}

export class LinkAdAccountToWorkspaceDto {
  @ApiProperty()
  @IsUUID()
  adAccountId: string;

  @ApiProperty()
  @IsUUID()
  workspaceId: string;
}

export class AutoLinkBusinessAssetsDto {
  @ApiProperty()
  @IsUUID()
  workspaceId: string;

  @ApiProperty()
  @IsUUID()
  businessManagerId: string;
}

export class DiscoverAndOnboardPagesDto {
  @ApiProperty()
  @IsUUID()
  businessManagerId: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoLinkAssets?: boolean;
}

