import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { Design } from '../../designer/entities/design.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';

export enum PublicationStatus {
  SCHEDULED = 'scheduled',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('publications')
export class Publication implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PublicationStatus,
    default: PublicationStatus.SCHEDULED,
  })
  status: PublicationStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'json', nullable: true })
  publicationData?: any; // Store platform-specific data

  @Column({ nullable: true })
  externalId?: string; // ID from external platform

  @Column({ nullable: true })
  url?: string; // Published content URL

  @Column('uuid')
  designId: string;

  @Column('uuid')
  publishedById: string;

  @ManyToOne(() => Design)
  @JoinColumn({ name: 'designId' })
  design: Design;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'publishedById' })
  publishedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  // Relations for audit trail
  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}
