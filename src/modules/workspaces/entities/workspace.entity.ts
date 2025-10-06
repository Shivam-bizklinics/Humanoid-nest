import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { UserWorkspace } from '../../rbac/entities/user-workspace.entity';

export enum WorkspaceSetupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('workspaces')
export class Workspace implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: WorkspaceSetupStatus,
    default: WorkspaceSetupStatus.PENDING
  })
  setupStatus: WorkspaceSetupStatus;

  @Column({ nullable: true })
  brandName?: string;

  @Column({ nullable: true })
  brandWebsite?: string;

  @Column({ type: 'text', nullable: true })
  brandDescription?: string;

  @Column({ nullable: true })
  brandLogo?: string;

  @Column('uuid')
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

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

  // Relations for audit trail
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;

  // User relationships
  @OneToMany(() => UserWorkspace, userWorkspace => userWorkspace.workspace)
  userWorkspaces?: UserWorkspace[];
}
