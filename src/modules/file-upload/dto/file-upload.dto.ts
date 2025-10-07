import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType, FileStatus } from '../entities/file-upload.entity';

export class GeneratePresignedUrlDto {
  @ApiProperty({ description: 'Original file name' })
  @IsString()
  originalName: string;

  @ApiProperty({ description: 'File MIME type' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  fileSize: number;

  @ApiProperty({ description: 'File type', enum: FileType })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiProperty({ description: 'Workspace ID' })
  @IsUUID()
  workspaceId: string;

  @ApiPropertyOptional({ description: 'File description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Custom metadata' })
  @IsOptional()
  @IsObject()
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    tags?: string[];
    altText?: string;
  };
}

export class ConfirmUploadDto {
  @ApiProperty({ description: 'File upload ID' })
  @IsUUID()
  fileUploadId: string;

  @ApiProperty({ description: 'S3 key/path where file was uploaded' })
  @IsString()
  filePath: string;

  @ApiProperty({ description: 'Final file URL' })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Updated metadata after upload' })
  @IsOptional()
  @IsObject()
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    tags?: string[];
    altText?: string;
  };
}

export class UpdateFileMetadataDto {
  @ApiPropertyOptional({ description: 'File description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Custom metadata' })
  @IsOptional()
  @IsObject()
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    tags?: string[];
    altText?: string;
  };
}

export class FileUploadResponseDto {
  @ApiProperty({ description: 'File upload ID' })
  id: string;

  @ApiProperty({ description: 'Original file name' })
  originalName: string;

  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'File URL' })
  fileUrl: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'File type', enum: FileType })
  fileType: FileType;

  @ApiProperty({ description: 'File status', enum: FileStatus })
  status: FileStatus;

  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;

  @ApiPropertyOptional({ description: 'File description' })
  description?: string;

  @ApiPropertyOptional({ description: 'File metadata' })
  metadata?: any;

  @ApiPropertyOptional({ description: 'Thumbnail metadata' })
  thumbnailMetadata?: any;

  @ApiProperty({ description: 'Upload date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'File upload ID' })
  fileUploadId: string;

  @ApiProperty({ description: 'Pre-signed URL for upload' })
  presignedUrl: string;

  @ApiProperty({ description: 'S3 key/path for the file' })
  filePath: string;

  @ApiProperty({ description: 'Upload fields for multipart upload' })
  fields: Record<string, string>;

  @ApiProperty({ description: 'Upload URL endpoint' })
  uploadUrl: string;

  @ApiProperty({ description: 'Expiration time in seconds' })
  expiresIn: number;
}

export class FileListQueryDto {
  @ApiPropertyOptional({ description: 'File type filter', enum: FileType })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType;

  @ApiPropertyOptional({ description: 'File status filter', enum: FileStatus })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @ApiPropertyOptional({ description: 'Search term for file names' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class WorkspaceThumbnailsDto {
  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;

  @ApiProperty({ description: 'Array of thumbnail files' })
  thumbnails: Array<{
    id: string;
    originalName: string;
    thumbnailUrl: string;
    fileType: FileType;
    createdAt: Date;
    description?: string;
  }>;
}

export class DeleteFileDto {
  @ApiProperty({ description: 'File upload ID to delete' })
  @IsUUID()
  fileUploadId: string;
}
