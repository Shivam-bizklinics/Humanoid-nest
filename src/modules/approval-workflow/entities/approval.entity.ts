import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { Design } from '../../designer/entities/design.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ApprovalType {
  DESIGN = 'design',
  CAMPAIGN = 'campaign',
  PUBLICATION = 'publication',
}

@Entity('approvals')
export class Approval implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ApprovalType,
  })
  type: ApprovalType;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ nullable: true })
  comments?: string;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column('uuid')
  entityId: string; // ID of the entity being approved (design, campaign, etc.)

  @Column('uuid')
  requestedById: string;

  @Column('uuid', { nullable: true })
  approvedById?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedById' })
  approvedBy?: User;

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
