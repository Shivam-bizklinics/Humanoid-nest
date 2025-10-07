import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import * as sharp from 'sharp';

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);
  private readonly thumbnailSizes: Array<{ width: number; height: number; suffix: string }>;

  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {
    // Define thumbnail sizes
    this.thumbnailSizes = [
      { width: 150, height: 150, suffix: '_thumb' },
      { width: 300, height: 300, suffix: '_medium' },
      { width: 600, height: 600, suffix: '_large' },
    ];
  }

  /**
   * Generate thumbnail from image buffer
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    size: { width: number; height: number } = { width: 150, height: 150 },
  ): Promise<{
    thumbnailBuffer: Buffer;
    thumbnailMimeType: string;
    dimensions: { width: number; height: number };
  }> {
    try {
      if (!this.isImageFile(mimeType)) {
        throw new Error('File is not an image');
      }

      // Get original image info
      const imageInfo = await sharp(imageBuffer).metadata();
      
      // Calculate new dimensions maintaining aspect ratio
      const { width: newWidth, height: newHeight } = this.calculateThumbnailDimensions(
        imageInfo.width || 0,
        imageInfo.height || 0,
        size.width,
        size.height,
      );

      // Generate thumbnail
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(newWidth, newHeight, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      return {
        thumbnailBuffer,
        thumbnailMimeType: 'image/jpeg',
        dimensions: { width: newWidth, height: newHeight },
      };
    } catch (error) {
      this.logger.error('Error generating thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Generate multiple thumbnail sizes
   */
  async generateMultipleThumbnails(
    imageBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ): Promise<Array<{
    size: { width: number; height: number };
    buffer: Buffer;
    mimeType: string;
    suffix: string;
  }>> {
    const thumbnails = [];

    for (const sizeConfig of this.thumbnailSizes) {
      try {
        const thumbnail = await this.generateThumbnail(
          imageBuffer,
          originalFileName,
          mimeType,
          { width: sizeConfig.width, height: sizeConfig.height },
        );

        thumbnails.push({
          size: thumbnail.dimensions,
          buffer: thumbnail.thumbnailBuffer,
          mimeType: thumbnail.thumbnailMimeType,
          suffix: sizeConfig.suffix,
        });
      } catch (error) {
        this.logger.warn(`Failed to generate thumbnail size ${sizeConfig.width}x${sizeConfig.height}:`, error);
      }
    }

    return thumbnails;
  }

  /**
   * Upload thumbnail to S3 and return URL
   */
  async uploadThumbnailToS3(
    workspaceId: string,
    originalFilePath: string,
    thumbnailBuffer: Buffer,
    thumbnailMimeType: string,
  ): Promise<{
    thumbnailPath: string;
    thumbnailUrl: string;
  }> {
    try {
      return await this.s3Service.uploadThumbnail(
        workspaceId,
        originalFilePath,
        thumbnailBuffer,
        thumbnailMimeType,
      );
    } catch (error) {
      this.logger.error('Error uploading thumbnail to S3:', error);
      throw new Error('Failed to upload thumbnail to S3');
    }
  }

  /**
   * Process uploaded image and generate thumbnail
   */
  async processImageUpload(
    workspaceId: string,
    originalFilePath: string,
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<{
    thumbnailPath: string;
    thumbnailUrl: string;
    dimensions: { width: number; height: number };
    thumbnailDimensions: { width: number; height: number };
  }> {
    try {
      // Get original image dimensions
      const imageInfo = await sharp(imageBuffer).metadata();
      const originalDimensions = {
        width: imageInfo.width || 0,
        height: imageInfo.height || 0,
      };

      // Generate thumbnail
      const thumbnail = await this.generateThumbnail(
        imageBuffer,
        originalFilePath,
        mimeType,
        { width: 150, height: 150 },
      );

      // Upload thumbnail to S3
      const thumbnailUpload = await this.uploadThumbnailToS3(
        workspaceId,
        originalFilePath,
        thumbnail.thumbnailBuffer,
        thumbnail.thumbnailMimeType,
      );

      return {
        thumbnailPath: thumbnailUpload.thumbnailPath,
        thumbnailUrl: thumbnailUpload.thumbnailUrl,
        dimensions: originalDimensions,
        thumbnailDimensions: thumbnail.dimensions,
      };
    } catch (error) {
      this.logger.error('Error processing image upload:', error);
      throw new Error('Failed to process image upload');
    }
  }

  /**
   * Check if file is an image
   */
  private isImageFile(mimeType: string): boolean {
    const imageMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
    ];
    return imageMimeTypes.includes(mimeType);
  }

  /**
   * Calculate thumbnail dimensions maintaining aspect ratio
   */
  private calculateThumbnailDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ): { width: number; height: number } {
    if (originalWidth === 0 || originalHeight === 0) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    
    let newWidth = maxWidth;
    let newHeight = maxHeight;

    if (aspectRatio > 1) {
      // Landscape
      newHeight = Math.round(maxWidth / aspectRatio);
    } else {
      // Portrait or square
      newWidth = Math.round(maxHeight * aspectRatio);
    }

    return { width: newWidth, height: newHeight };
  }

  /**
   * Generate thumbnail from S3 URL (for existing files)
   */
  async generateThumbnailFromS3Url(
    s3Url: string,
    workspaceId: string,
  ): Promise<{
    thumbnailPath: string;
    thumbnailUrl: string;
    dimensions: { width: number; height: number };
  }> {
    try {
      // This would require downloading the file from S3 first
      // For now, returning placeholder - implement if needed
      throw new Error('Not implemented - requires S3 file download');
    } catch (error) {
      this.logger.error('Error generating thumbnail from S3 URL:', error);
      throw new Error('Failed to generate thumbnail from S3 URL');
    }
  }

  /**
   * Validate image file
   */
  validateImageFile(mimeType: string, fileSize: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxImageSize = 10 * 1024 * 1024; // 10MB for images
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (fileSize > maxImageSize) {
      errors.push(`Image size exceeds maximum allowed size of ${maxImageSize / (1024 * 1024)}MB`);
    }

    if (!allowedImageTypes.includes(mimeType)) {
      errors.push(`Image type ${mimeType} is not supported for thumbnail generation`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
