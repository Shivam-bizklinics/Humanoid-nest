import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { AgencyAccount } from './agency-account.entity';

export enum AgencyAuthStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  INVALID = 'invalid',
  PENDING = 'pending',
}

export enum AgencyAuthType {
  OAUTH2 = 'oauth2',
  SYSTEM_USER = 'system_user', // Meta System User tokens
  API_KEY = 'api_key',
}

@Entity('agency_auths')
export class AgencyAuth implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  agencyAccountId: string;

  @Column({ default: AgencyAuthType.OAUTH2 })
  authType: AgencyAuthType;

  @Column({ default: AgencyAuthStatus.ACTIVE })
  status: AgencyAuthStatus;

  @Column({ nullable: true })
  accessToken?: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  systemUserToken?: string; // For Meta System User

  @Column({ nullable: true })
  tokenType?: string;

  @Column({ nullable: true })
  expiresAt?: Date;

  @Column({ nullable: true })
  scope?: string;

  @Column('json', { nullable: true })
  tokenMetadata?: Record<string, any>;

  @Column('json', { nullable: true })
  permissions?: string[];

  @Column({ nullable: true })
  lastUsedAt?: Date;

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
  @ManyToOne(() => AgencyAccount, agencyAccount => agencyAccount.auths)
  @JoinColumn({ name: 'agencyAccountId' })
  agencyAccount: AgencyAccount;
}
