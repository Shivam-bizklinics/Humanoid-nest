import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';
import { SocialMediaAccount } from './social-media-account.entity';

export enum AuthStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  INVALID = 'invalid',
  PENDING = 'pending',
}

export enum AuthType {
  OAUTH2 = 'oauth2',
  API_KEY = 'api_key',
  BASIC_AUTH = 'basic_auth',
  JWT = 'jwt',
}

@Entity('social_media_auths')
export class SocialMediaAuth implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  accountId: string;

  @Column({ default: AuthType.OAUTH2 })
  authType: AuthType;

  @Column({ default: AuthStatus.ACTIVE })
  status: AuthStatus;

  @Column({ nullable: true })
  accessToken?: string;

  @Column({ nullable: true })
  refreshToken?: string;

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
  @ManyToOne(() => SocialMediaAccount, account => account.auths)
  @JoinColumn({ name: 'accountId' })
  account: SocialMediaAccount;
}
