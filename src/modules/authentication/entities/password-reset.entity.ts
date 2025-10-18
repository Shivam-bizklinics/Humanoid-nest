import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../shared/interfaces/base.interface';

/**
 * Password Reset Entity
 * Stores password reset verification codes and their expiration
 */
@Entity('password_resets')
@Index(['email', 'code'], { unique: true })
@Index(['email'])
@Index(['code'])
@Index(['expiresAt'])
export class PasswordReset implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  code: string; // 6-digit verification code

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date;

  @Column({ default: 0 })
  attempts: number; // Number of verification attempts

  @Column({ type: 'timestamp', nullable: true })
  lastAttemptAt?: Date;

  // Base entity fields
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column('uuid')
  createdBy: string;

  @Column('uuid')
  updatedBy: string;

  /**
   * Check if the reset code is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the reset code is valid (not used and not expired)
   */
  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }

  /**
   * Mark the reset code as used
   */
  markAsUsed(): void {
    this.isUsed = true;
    this.usedAt = new Date();
  }

  /**
   * Increment attempt count
   */
  incrementAttempts(): void {
    this.attempts += 1;
    this.lastAttemptAt = new Date();
  }
}
