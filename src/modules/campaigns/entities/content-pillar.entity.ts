import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../authentication/entities/user.entity';
import { Workspace } from '../../workspaces/entities/workspace.entity';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { SystemContentPillar } from '../../../shared/enums/campaign.enum';

export enum ContentPillarType {
  SYSTEM = 'system',
  CUSTOM = 'custom',
}

@Entity('content_pillars')
export class ContentPillar implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ContentPillarType,
    default: ContentPillarType.CUSTOM,
  })
  type: ContentPillarType;

  @Column({
    type: 'enum',
    enum: SystemContentPillar,
    nullable: true,
  })
  systemPillar?: SystemContentPillar;

  @Column('uuid')
  workspaceId: string;

  @Column('uuid', { nullable: true })
  createdBy: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column('uuid', { nullable: true })
  updatedBy?: string;

  // Relations
  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;
}
