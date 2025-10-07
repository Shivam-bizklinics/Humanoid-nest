import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUpload } from './entities/file-upload.entity';
import { FileUploadController } from './controllers/file-upload.controller';
import { FileUploadService } from './services/file-upload.service';
import { S3Service } from './services/s3.service';
import { ThumbnailService } from './services/thumbnail.service';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUpload]),
    RbacModule,
  ],
  controllers: [FileUploadController],
  providers: [
    FileUploadService,
    S3Service,
    ThumbnailService,
  ],
  exports: [
    FileUploadService,
    S3Service,
    ThumbnailService,
  ],
})
export class FileUploadModule {}
