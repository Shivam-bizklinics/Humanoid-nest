import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceAccessLevel } from '../../rbac/entities/user-workspace.entity';

export class CreateWorkspaceDto {
  @ApiProperty({ description: 'Workspace name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Workspace description' })
  @IsOptional()
  @IsString()
  description?: string;
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

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
