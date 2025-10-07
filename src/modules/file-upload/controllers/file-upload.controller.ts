import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserWorkspacePermissionGuard } from '../../rbac/guards/user-workspace-permission.guard';
import { RequirePermission } from '../../../shared/decorators/permission.decorator';
import { CurrentUserId } from '../../../shared/decorators/current-user-id.decorator';
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { FileUploadService } from '../services/file-upload.service';
import { S3Service } from '../services/s3.service';
import {
  GeneratePresignedUrlDto,
  ConfirmUploadDto,
  UpdateFileMetadataDto,
  FileListQueryDto,
  WorkspaceThumbnailsDto,
  PresignedUrlResponseDto,
  FileUploadResponseDto,
} from '../dto/file-upload.dto';

@ApiTags('File Upload')
@ApiBearerAuth()
@Controller('file-upload')
@UseGuards(UserWorkspacePermissionGuard)
export class FileUploadController {
  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('generate-presigned-url')
  @RequirePermission(Resource.WORKSPACE, Action.CREATE)
  @ApiOperation({ summary: 'Generate pre-signed URL for file upload' })
  @ApiResponse({ 
    status: 201, 
    description: 'Pre-signed URL generated successfully',
    type: PresignedUrlResponseDto
  })
  async generatePresignedUrl(
    @Body() generateDto: GeneratePresignedUrlDto,
    @CurrentUserId() userId: string,
  ) {
    const result = await this.fileUploadService.generatePresignedUploadUrl(
      generateDto,
      userId,
    );

    return {
      success: true,
      data: {
        fileUploadId: result.fileUploadId,
        presignedUrl: result.presignedUrl,
        filePath: result.filePath,
        fields: {}, // S3 fields if needed
        uploadUrl: result.uploadUrl,
        expiresIn: result.expiresIn,
      },
      message: 'Pre-signed URL generated successfully',
    };
  }

  @Post('confirm-upload')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Confirm file upload completion' })
  @ApiResponse({ 
    status: 200, 
    description: 'File upload confirmed successfully',
    type: FileUploadResponseDto
  })
  async confirmUpload(
    @Body() confirmDto: ConfirmUploadDto,
    @CurrentUserId() userId: string,
  ) {
    const file = await this.fileUploadService.confirmUpload(confirmDto, userId);

    return {
      success: true,
      data: file,
      message: 'File upload confirmed successfully',
    };
  }

  @Get('workspaces/:workspaceId/files')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get workspace files with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Workspace files retrieved successfully' })
  @ApiQuery({ name: 'fileType', required: false, enum: ['image', 'video', 'document', 'audio'] })
  @ApiQuery({ name: 'status', required: false, enum: ['uploading', 'uploaded', 'processing', 'ready', 'failed'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async getWorkspaceFiles(
    @Param('workspaceId') workspaceId: string,
    @Query() queryDto: FileListQueryDto,
  ) {
    const result = await this.fileUploadService.getWorkspaceFiles(workspaceId, queryDto);

    return {
      success: true,
      data: result,
      message: 'Workspace files retrieved successfully',
    };
  }

  @Get('workspaces/:workspaceId/thumbnails')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get workspace thumbnails for gallery view' })
  @ApiResponse({ 
    status: 200, 
    description: 'Workspace thumbnails retrieved successfully',
    type: WorkspaceThumbnailsDto
  })
  async getWorkspaceThumbnails(@Param('workspaceId') workspaceId: string) {
    const thumbnails = await this.fileUploadService.getWorkspaceThumbnails(workspaceId);

    return {
      success: true,
      data: thumbnails,
      message: 'Workspace thumbnails retrieved successfully',
    };
  }

  @Get('files/:fileId')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get file details by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'File details retrieved successfully',
    type: FileUploadResponseDto
  })
  async getFileById(@Param('fileId') fileId: string) {
    const file = await this.fileUploadService.getFileById(fileId);

    return {
      success: true,
      data: file,
      message: 'File details retrieved successfully',
    };
  }

  @Put('files/:fileId')
  @RequirePermission(Resource.WORKSPACE, Action.UPDATE)
  @ApiOperation({ summary: 'Update file metadata' })
  @ApiResponse({ 
    status: 200, 
    description: 'File metadata updated successfully',
    type: FileUploadResponseDto
  })
  async updateFileMetadata(
    @Param('fileId') fileId: string,
    @Body() updateDto: UpdateFileMetadataDto,
    @CurrentUserId() userId: string,
  ) {
    const file = await this.fileUploadService.updateFileMetadata(
      fileId,
      updateDto,
      userId,
    );

    return {
      success: true,
      data: file,
      message: 'File metadata updated successfully',
    };
  }

  @Delete('files/:fileId')
  @RequirePermission(Resource.WORKSPACE, Action.DELETE)
  @ApiOperation({ summary: 'Delete file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUserId() userId: string,
  ) {
    const deleted = await this.fileUploadService.deleteFile(fileId, userId);

    return {
      success: deleted,
      message: deleted ? 'File deleted successfully' : 'Failed to delete file',
    };
  }

  @Get('files/:fileId/download-url')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Generate download URL for file' })
  @ApiResponse({ status: 200, description: 'Download URL generated successfully' })
  @ApiQuery({ name: 'expiresIn', required: false, type: Number, description: 'Expiration time in seconds (default: 3600)' })
  async generateDownloadUrl(
    @Param('fileId') fileId: string,
    @Query('expiresIn') expiresIn: number = 3600,
  ) {
    const downloadUrl = await this.fileUploadService.generateDownloadUrl(fileId, expiresIn);

    return {
      success: true,
      data: {
        downloadUrl,
        expiresIn,
        fileId,
      },
      message: 'Download URL generated successfully',
    };
  }

  @Get('workspaces/:workspaceId/stats')
  @RequirePermission(Resource.WORKSPACE, Action.VIEW)
  @ApiOperation({ summary: 'Get workspace file statistics' })
  @ApiResponse({ status: 200, description: 'File statistics retrieved successfully' })
  async getWorkspaceFileStats(@Param('workspaceId') workspaceId: string) {
    const stats = await this.fileUploadService.getWorkspaceFileStats(workspaceId);

    return {
      success: true,
      data: stats,
      message: 'File statistics retrieved successfully',
    };
  }

  @Post('workspaces/:workspaceId/cleanup')
  @RequirePermission(Resource.WORKSPACE, Action.DELETE)
  @ApiOperation({ summary: 'Clean up all workspace files (Admin only)' })
  @ApiResponse({ status: 200, description: 'Workspace files cleaned up successfully' })
  async cleanupWorkspaceFiles(@Param('workspaceId') workspaceId: string) {
    const result = await this.fileUploadService.cleanupWorkspaceFiles(workspaceId);

    return {
      success: true,
      data: result,
      message: 'Workspace files cleaned up successfully',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check file upload service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    return {
      success: true,
      data: {
        service: 'file-upload',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      message: 'File upload service is healthy',
    };
  }
}
