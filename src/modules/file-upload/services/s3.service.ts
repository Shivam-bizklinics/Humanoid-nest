import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Generate pre-signed URL for file upload
   */
  async generatePresignedUploadUrl(
    workspaceId: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
    expiresIn: number = 3600, // 1 hour
  ): Promise<{
    presignedUrl: string;
    filePath: string;
    uploadUrl: string;
    expiresIn: number;
  }> {
    try {
      // Generate unique file path
      const fileExtension = this.getFileExtension(fileName);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const filePath = `workspaces/${workspaceId}/files/${uniqueFileName}`;

      // Create command for S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
        ContentType: mimeType,
        ContentLength: fileSize,
        Metadata: {
          originalName: fileName,
          workspaceId: workspaceId,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Generate pre-signed URL
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return {
        presignedUrl,
        filePath,
        uploadUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filePath}`,
        expiresIn,
      };
    } catch (error) {
      this.logger.error('Error generating pre-signed URL:', error);
      throw new BadRequestException('Failed to generate upload URL');
    }
  }

  /**
   * Generate pre-signed URL for thumbnail upload
   */
  async generatePresignedThumbnailUrl(
    workspaceId: string,
    originalFilePath: string,
    thumbnailData: Buffer,
    mimeType: string,
    expiresIn: number = 3600,
  ): Promise<{
    presignedUrl: string;
    thumbnailPath: string;
    thumbnailUrl: string;
  }> {
    try {
      // Generate thumbnail path
      const thumbnailFileName = `thumb_${this.getFileNameFromPath(originalFilePath)}`;
      const thumbnailPath = `workspaces/${workspaceId}/thumbnails/${thumbnailFileName}`;

      // Create command for S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: thumbnailPath,
        Body: thumbnailData,
        ContentType: mimeType,
        ContentLength: thumbnailData.length,
        Metadata: {
          originalFilePath: originalFilePath,
          workspaceId: workspaceId,
          isThumbnail: 'true',
          uploadedAt: new Date().toISOString(),
        },
      });

      // Generate pre-signed URL
      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return {
        presignedUrl,
        thumbnailPath,
        thumbnailUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${thumbnailPath}`,
      };
    } catch (error) {
      this.logger.error('Error generating thumbnail pre-signed URL:', error);
      throw new BadRequestException('Failed to generate thumbnail upload URL');
    }
  }

  /**
   * Generate pre-signed URL for file download
   */
  async generatePresignedDownloadUrl(
    filePath: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error('Error generating download URL:', error);
      throw new BadRequestException('Failed to generate download URL');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting file from S3:', error);
      return false;
    }
  }

  /**
   * Delete multiple files from S3
   */
  async deleteMultipleFiles(filePaths: string[]): Promise<{
    deleted: string[];
    failed: string[];
  }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const filePath of filePaths) {
      try {
        const success = await this.deleteFile(filePath);
        if (success) {
          deleted.push(filePath);
        } else {
          failed.push(filePath);
        }
      } catch (error) {
        failed.push(filePath);
      }
    }

    return { deleted, failed };
  }

  /**
   * Upload thumbnail directly to S3
   */
  async uploadThumbnail(
    workspaceId: string,
    originalFilePath: string,
    thumbnailData: Buffer,
    mimeType: string,
  ): Promise<{
    thumbnailPath: string;
    thumbnailUrl: string;
  }> {
    try {
      const thumbnailFileName = `thumb_${this.getFileNameFromPath(originalFilePath)}`;
      const thumbnailPath = `workspaces/${workspaceId}/thumbnails/${thumbnailFileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: thumbnailPath,
        Body: thumbnailData,
        ContentType: mimeType,
        ContentLength: thumbnailData.length,
        Metadata: {
          originalFilePath: originalFilePath,
          workspaceId: workspaceId,
          isThumbnail: 'true',
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      return {
        thumbnailPath,
        thumbnailUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${thumbnailPath}`,
      };
    } catch (error) {
      this.logger.error('Error uploading thumbnail to S3:', error);
      throw new BadRequestException('Failed to upload thumbnail');
    }
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  /**
   * Get filename from S3 path
   */
  private getFileNameFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    return pathParts[pathParts.length - 1];
  }

  /**
   * Validate file type and size
   */
  validateFile(fileName: string, mimeType: string, fileSize: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    // Check file size
    if (fileSize > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(mimeType)) {
      errors.push(`File type ${mimeType} is not allowed`);
    }

    // Check file extension
    const extension = this.getFileExtension(fileName);
    if (!extension) {
      errors.push('File must have an extension');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get workspace file paths for cleanup
   */
  async getWorkspaceFilePaths(workspaceId: string): Promise<{
    files: string[];
    thumbnails: string[];
  }> {
    // This would require S3 ListObjects operation
    // For now, returning empty arrays - implement if needed
    return {
      files: [],
      thumbnails: [],
    };
  }
}
