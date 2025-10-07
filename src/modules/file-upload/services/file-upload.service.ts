import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, Between } from 'typeorm';
import { FileUpload, FileType, FileStatus } from '../entities/file-upload.entity';
import { S3Service } from './s3.service';
import { ThumbnailService } from './thumbnail.service';
import {
  GeneratePresignedUrlDto,
  ConfirmUploadDto,
  UpdateFileMetadataDto,
  FileListQueryDto,
  WorkspaceThumbnailsDto,
} from '../dto/file-upload.dto';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    @InjectRepository(FileUpload)
    private readonly fileUploadRepository: Repository<FileUpload>,
    private readonly s3Service: S3Service,
    private readonly thumbnailService: ThumbnailService,
  ) {}

  /**
   * Generate pre-signed URL for file upload
   */
  async generatePresignedUploadUrl(
    generateDto: GeneratePresignedUrlDto,
    uploadedById: string,
  ): Promise<{
    fileUploadId: string;
    presignedUrl: string;
    filePath: string;
    uploadUrl: string;
    expiresIn: number;
  }> {
    try {
      // Validate file
      const validation = this.s3Service.validateFile(
        generateDto.originalName,
        generateDto.mimeType,
        generateDto.fileSize,
      );

      if (!validation.isValid) {
        throw new BadRequestException(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate unique filename and path
      const fileExtension = this.getFileExtension(generateDto.originalName);
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}${fileExtension}`;

      // Generate S3 pre-signed URL
      const s3Response = await this.s3Service.generatePresignedUploadUrl(
        generateDto.workspaceId,
        uniqueFileName,
        generateDto.mimeType,
        generateDto.fileSize,
      );

      // Create file upload record
      const fileUpload = this.fileUploadRepository.create({
        originalName: generateDto.originalName,
        fileName: uniqueFileName,
        filePath: s3Response.filePath,
        mimeType: generateDto.mimeType,
        fileSize: generateDto.fileSize,
        fileType: generateDto.fileType,
        workspaceId: generateDto.workspaceId,
        uploadedById,
        description: generateDto.description,
        metadata: generateDto.metadata,
        status: FileStatus.UPLOADING,
        createdBy: uploadedById,
        updatedBy: uploadedById,
      });

      const savedFileUpload = await this.fileUploadRepository.save(fileUpload);

      return {
        fileUploadId: savedFileUpload.id,
        presignedUrl: s3Response.presignedUrl,
        filePath: s3Response.filePath,
        uploadUrl: s3Response.uploadUrl,
        expiresIn: s3Response.expiresIn,
      };
    } catch (error) {
      this.logger.error('Error generating pre-signed upload URL:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to generate upload URL');
    }
  }

  /**
   * Confirm file upload and process if needed
   */
  async confirmUpload(confirmDto: ConfirmUploadDto, userId: string): Promise<FileUpload> {
    try {
      const fileUpload = await this.fileUploadRepository.findOne({
        where: { id: confirmDto.fileUploadId },
      });

      if (!fileUpload) {
        throw new NotFoundException('File upload record not found');
      }

      // Update file upload record
      fileUpload.fileUrl = confirmDto.fileUrl;
      fileUpload.status = FileStatus.UPLOADED;
      fileUpload.updatedBy = userId;

      if (confirmDto.metadata) {
        fileUpload.metadata = { ...fileUpload.metadata, ...confirmDto.metadata };
      }

      // Process image thumbnail if it's an image
      if (this.isImageFile(fileUpload.mimeType)) {
        try {
          fileUpload.status = FileStatus.PROCESSING;
          await this.fileUploadRepository.save(fileUpload);

          // Generate thumbnail (this would require downloading from S3)
          // For now, we'll mark as ready and handle thumbnail generation separately
          fileUpload.status = FileStatus.READY;
        } catch (thumbnailError) {
          this.logger.warn('Failed to generate thumbnail:', thumbnailError);
          fileUpload.status = FileStatus.READY; // Still mark as ready even if thumbnail fails
        }
      } else {
        fileUpload.status = FileStatus.READY;
      }

      return await this.fileUploadRepository.save(fileUpload);
    } catch (error) {
      this.logger.error('Error confirming upload:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to confirm upload');
    }
  }

  /**
   * Get files for workspace with filtering and pagination
   */
  async getWorkspaceFiles(
    workspaceId: string,
    queryDto: FileListQueryDto,
  ): Promise<{
    files: FileUpload[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC', ...filters } = queryDto;

      const whereConditions: FindOptionsWhere<FileUpload> = {
        workspaceId,
        deletedAt: null,
      };

      // Apply filters
      if (filters.fileType) {
        whereConditions.fileType = filters.fileType;
      }

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      if (filters.search) {
        whereConditions.originalName = Like(`%${filters.search}%`);
      }

      // Build query
      const queryBuilder = this.fileUploadRepository
        .createQueryBuilder('file')
        .where(whereConditions)
        .orderBy(`file.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit);

      // Execute query
      const [files, total] = await queryBuilder.getManyAndCount();

      return {
        files,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Error getting workspace files:', error);
      throw new BadRequestException('Failed to get workspace files');
    }
  }

  /**
   * Get workspace thumbnails
   */
  async getWorkspaceThumbnails(workspaceId: string): Promise<WorkspaceThumbnailsDto> {
    try {
      const files = await this.fileUploadRepository.find({
        where: {
          workspaceId,
          fileType: FileType.IMAGE,
          status: FileStatus.READY,
          thumbnailUrl: Like('%'), // Has thumbnail
          deletedAt: null,
        },
        order: { createdAt: 'DESC' },
        take: 50, // Limit to 50 thumbnails
      });

      const thumbnails = files.map(file => ({
        id: file.id,
        originalName: file.originalName,
        thumbnailUrl: file.thumbnailUrl!,
        fileType: file.fileType,
        createdAt: file.createdAt,
        description: file.description,
      }));

      return {
        workspaceId,
        thumbnails,
      };
    } catch (error) {
      this.logger.error('Error getting workspace thumbnails:', error);
      throw new BadRequestException('Failed to get workspace thumbnails');
    }
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<FileUpload> {
    const file = await this.fileUploadRepository.findOne({
      where: { id: fileId, deletedAt: null },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  /**
   * Update file metadata
   */
  async updateFileMetadata(
    fileId: string,
    updateDto: UpdateFileMetadataDto,
    userId: string,
  ): Promise<FileUpload> {
    try {
      const file = await this.getFileById(fileId);

      // Update fields
      if (updateDto.description !== undefined) {
        file.description = updateDto.description;
      }

      if (updateDto.metadata) {
        file.metadata = { ...file.metadata, ...updateDto.metadata };
      }

      file.updatedBy = userId;

      return await this.fileUploadRepository.save(file);
    } catch (error) {
      this.logger.error('Error updating file metadata:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update file metadata');
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      const file = await this.getFileById(fileId);

      // Delete from S3
      const s3DeleteSuccess = await this.s3Service.deleteFile(file.filePath);
      
      // Delete thumbnail if exists
      if (file.thumbnailPath) {
        await this.s3Service.deleteFile(file.thumbnailPath);
      }

      // Soft delete from database
      await this.fileUploadRepository.update(fileId, {
        deletedAt: new Date(),
        updatedBy: userId,
      });

      this.logger.log(`File deleted: ${file.originalName} (ID: ${fileId})`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Generate download URL for file
   */
  async generateDownloadUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    try {
      const file = await this.getFileById(fileId);
      return await this.s3Service.generatePresignedDownloadUrl(file.filePath, expiresIn);
    } catch (error) {
      this.logger.error('Error generating download URL:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to generate download URL');
    }
  }

  /**
   * Get file statistics for workspace
   */
  async getWorkspaceFileStats(workspaceId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<FileType, number>;
    filesByStatus: Record<FileStatus, number>;
  }> {
    try {
      const files = await this.fileUploadRepository.find({
        where: { workspaceId, deletedAt: null },
      });

      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.fileSize, 0),
        filesByType: {
          [FileType.IMAGE]: 0,
          [FileType.VIDEO]: 0,
          [FileType.DOCUMENT]: 0,
          [FileType.AUDIO]: 0,
        },
        filesByStatus: {
          [FileStatus.UPLOADING]: 0,
          [FileStatus.UPLOADED]: 0,
          [FileStatus.PROCESSING]: 0,
          [FileStatus.READY]: 0,
          [FileStatus.FAILED]: 0,
        },
      };

      files.forEach(file => {
        stats.filesByType[file.fileType]++;
        stats.filesByStatus[file.status]++;
      });

      return stats;
    } catch (error) {
      this.logger.error('Error getting workspace file stats:', error);
      throw new BadRequestException('Failed to get workspace file statistics');
    }
  }

  /**
   * Clean up workspace files (for workspace deletion)
   */
  async cleanupWorkspaceFiles(workspaceId: string): Promise<{
    deletedFiles: number;
    deletedSize: number;
  }> {
    try {
      const files = await this.fileUploadRepository.find({
        where: { workspaceId },
      });

      let deletedFiles = 0;
      let deletedSize = 0;

      for (const file of files) {
        try {
          // Delete from S3
          await this.s3Service.deleteFile(file.filePath);
          if (file.thumbnailPath) {
            await this.s3Service.deleteFile(file.thumbnailPath);
          }

          // Delete from database
          await this.fileUploadRepository.delete(file.id);
          
          deletedFiles++;
          deletedSize += file.fileSize;
        } catch (error) {
          this.logger.warn(`Failed to delete file ${file.id}:`, error);
        }
      }

      return { deletedFiles, deletedSize };
    } catch (error) {
      this.logger.error('Error cleaning up workspace files:', error);
      throw new BadRequestException('Failed to cleanup workspace files');
    }
  }

  /**
   * Check if file is an image
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }
}
