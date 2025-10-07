import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';

export enum ImpersonationStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
  EXPIRED = 'expired',
}

@Entity('impersonation_sessions')
export class ImpersonationSession implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  impersonatorId: string; // User who is impersonating

  @Column('uuid')
  impersonatedUserId: string; // User being impersonated

  @Column({
    type: 'enum',
    enum: ImpersonationStatus,
    default: ImpersonationStatus.ACTIVE
  })
  status: ImpersonationStatus;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'text', nullable: true })
  reason?: string; // Reason for impersonation

  @Column({ type: 'json', nullable: true })
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    workspaceId?: string; // If impersonation is workspace-specific
    permissions?: string[]; // Specific permissions during impersonation
  };

  @Column({ default: true })
  isActive: boolean;

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
  @ManyToOne(() => User)
  @JoinColumn({ name: 'impersonatorId' })
  impersonator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'impersonatedUserId' })
  impersonatedUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}
