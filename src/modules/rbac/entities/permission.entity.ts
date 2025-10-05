import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToMany, ManyToOne, JoinColumn } from 'typeorm';
// import { Role } from './role.entity'; // Removed - role entity no longer exists
import { User } from '../../authentication/entities/user.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';

@Entity('permissions')
export class Permission implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  resource: string; // e.g., 'user', 'campaign', 'workspace'

  @Column()
  action: string; // e.g., 'create', 'read', 'update', 'delete'

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

  // Relations for audit trail
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}
