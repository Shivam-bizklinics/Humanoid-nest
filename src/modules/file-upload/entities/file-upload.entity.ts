import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { User } from '../../authentication/entities/user.entity';

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
}

export enum FileStatus {
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('file_uploads')
export class FileUpload implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  fileName: string; // Generated unique filename

  @Column()
  filePath: string; // S3 key/path

  @Column()
  fileUrl: string; // S3 URL

  @Column({ nullable: true })
  thumbnailUrl?: string; // Thumbnail S3 URL

  @Column({ nullable: true })
  thumbnailPath?: string; // Thumbnail S3 key/path

  @Column()
  mimeType: string;

  @Column()
  fileSize: number; // Size in bytes

  @Column({
    type: 'enum',
    enum: FileType,
  })
  fileType: FileType;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.UPLOADING,
  })
  status: FileStatus;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid')
  uploadedById: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: {
    width?: number; // For images/videos
    height?: number; // For images/videos
    duration?: number; // For videos/audio
    format?: string; // File format
    tags?: string[]; // Custom tags
    altText?: string; // For accessibility
  };

  @Column({ type: 'json', nullable: true })
  thumbnailMetadata?: {
    width: number;
    height: number;
    size: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}
