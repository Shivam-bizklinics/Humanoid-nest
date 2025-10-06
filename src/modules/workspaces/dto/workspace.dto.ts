import { IsString, IsOptional, IsUUID, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceAccessLevel } from '../../rbac/entities/user-workspace.entity';
import { WorkspaceSetupStatus } from '../entities/workspace.entity';

export class CreateWorkspaceDto {
  @ApiProperty({ description: 'Workspace name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Workspace description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({ description: 'Brand website URL' })
  @IsOptional()
  @IsUrl()
  brandWebsite?: string;

  @ApiPropertyOptional({ description: 'Brand description' })
  @IsOptional()
  @IsString()
  brandDescription?: string;

  @ApiPropertyOptional({ description: 'Brand logo URL' })
  @IsOptional()
  @IsString()
  brandLogo?: string;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ description: 'Workspace name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Workspace description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Workspace setup status', enum: WorkspaceSetupStatus })
  @IsOptional()
  @IsEnum(WorkspaceSetupStatus)
  setupStatus?: WorkspaceSetupStatus;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({ description: 'Brand website URL' })
  @IsOptional()
  @IsUrl()
  brandWebsite?: string;

  @ApiPropertyOptional({ description: 'Brand description' })
  @IsOptional()
  @IsString()
  brandDescription?: string;

  @ApiPropertyOptional({ description: 'Brand logo URL' })
  @IsOptional()
  @IsString()
  brandLogo?: string;
}

export class AddUserToWorkspaceDto {
  @ApiProperty({ description: 'User ID to add to workspace' })
  @IsUUID()
  userId: string;

  @ApiProperty({ 
    description: 'Access level for the user in workspace',
    enum: WorkspaceAccessLevel,
    default: WorkspaceAccessLevel.VIEWER
  })
  @IsEnum(WorkspaceAccessLevel)
  accessLevel: WorkspaceAccessLevel;
}

export class WorkspaceResponseDto {
  @ApiProperty({ description: 'Workspace ID' })
  id: string;

  @ApiProperty({ description: 'Workspace name' })
  name: string;

  @ApiPropertyOptional({ description: 'Workspace description' })
  description?: string;

  @ApiProperty({ description: 'Workspace owner ID' })
  ownerId: string;

  @ApiProperty({ description: 'Is workspace active' })
  isActive: boolean;

  @ApiProperty({ description: 'Workspace setup status', enum: WorkspaceSetupStatus })
  setupStatus: WorkspaceSetupStatus;

  @ApiPropertyOptional({ description: 'Brand name' })
  brandName?: string;

  @ApiPropertyOptional({ description: 'Brand website URL' })
  brandWebsite?: string;

  @ApiPropertyOptional({ description: 'Brand description' })
  brandDescription?: string;

  @ApiPropertyOptional({ description: 'Brand logo URL' })
  brandLogo?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
