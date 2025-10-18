import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from '../entities/password-reset.entity';
import { User } from '../entities/user.entity';
import { EmailService } from './email.service';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, VerifyResetCodeDto, ResetPasswordDto, PasswordResetResponseDto } from '../dto/password-reset.dto';
import { BusinessException } from '../../../shared/exceptions/business.exception';

/**
 * Password Reset Service
 * Handles password reset verification codes and password updates
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 15;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RESEND_COOLDOWN_MINUTES = 1;

  constructor(
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Request password reset - send verification code
   */
  async requestPasswordReset(forgotPasswordDto: ForgotPasswordDto): Promise<PasswordResetResponseDto> {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not for security
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return {
        success: true,
        message: 'If an account with this email exists, a verification code has been sent.',
        expiresIn: this.CODE_EXPIRY_MINUTES,
      };
    }

    // Check for recent reset requests
    const recentReset = await this.passwordResetRepository.findOne({
      where: { email, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (recentReset && !recentReset.isExpired()) {
      const timeSinceLastRequest = Date.now() - recentReset.createdAt.getTime();
      const cooldownMs = this.RESEND_COOLDOWN_MINUTES * 60 * 1000;
      
      if (timeSinceLastRequest < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastRequest) / 1000);
        throw new BadRequestException(
          `Please wait ${remainingSeconds} seconds before requesting another verification code.`
        );
      }
    }

    // Generate verification code
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing unused codes for this email
    await this.passwordResetRepository.update(
      { email, isUsed: false },
      { isUsed: true, usedAt: new Date() }
    );

    // Create new password reset record
    const passwordReset = this.passwordResetRepository.create({
      email,
      code,
      expiresAt,
      createdBy: user.id,
      updatedBy: user.id,
    });

    await this.passwordResetRepository.save(passwordReset);

    // Send verification email
    const emailSent = await this.emailService.sendPasswordResetCode(
      email,
      code,
      this.CODE_EXPIRY_MINUTES
    );

    if (!emailSent) {
      throw new BusinessException('Failed to send verification email. Please try again.');
    }

    this.logger.log(`Password reset code sent to ${email}`);

    return {
      success: true,
      message: 'Verification code sent to your email address.',
      expiresIn: this.CODE_EXPIRY_MINUTES,
    };
  }

  /**
   * Verify reset code
   */
  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto): Promise<PasswordResetResponseDto> {
    const { email, code } = verifyResetCodeDto;

    const passwordReset = await this.passwordResetRepository.findOne({
      where: { email, code, isUsed: false },
    });

    if (!passwordReset) {
      throw new UnauthorizedException('Invalid verification code.');
    }

    if (passwordReset.isExpired()) {
      throw new UnauthorizedException('Verification code has expired. Please request a new one.');
    }

    if (passwordReset.attempts >= this.MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many failed attempts. Please request a new verification code.');
    }

    // Increment attempt count
    passwordReset.incrementAttempts();
    await this.passwordResetRepository.save(passwordReset);

    return {
      success: true,
      message: 'Verification code is valid. You can now reset your password.',
    };
  }

  /**
   * Reset password with verification code
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<PasswordResetResponseDto> {
    const { email, code, newPassword } = resetPasswordDto;

    // Find the password reset record
    const passwordReset = await this.passwordResetRepository.findOne({
      where: { email, code, isUsed: false },
    });

    if (!passwordReset) {
      throw new UnauthorizedException('Invalid verification code.');
    }

    if (passwordReset.isExpired()) {
      throw new UnauthorizedException('Verification code has expired. Please request a new one.');
    }

    if (passwordReset.attempts >= this.MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many failed attempts. Please request a new verification code.');
    }

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Hash new password
    const hashedPassword = await this.authService.hashPassword(newPassword);

    // Update user password
    user.password = hashedPassword;
    user.updatedBy = user.id;
    await this.userRepository.save(user);

    // Mark reset code as used
    passwordReset.markAsUsed();
    await this.passwordResetRepository.save(passwordReset);

    // Invalidate all other reset codes for this email
    await this.passwordResetRepository.update(
      { email, isUsed: false },
      { isUsed: true, usedAt: new Date() }
    );

    this.logger.log(`Password reset successful for user: ${email}`);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  }

  /**
   * Generate 6-digit verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clean up expired password reset records
   */
  async cleanupExpiredResets(): Promise<number> {
    const expiredResets = await this.passwordResetRepository.find({
      where: { isUsed: false },
    });

    const expiredCount = expiredResets.filter(reset => reset.isExpired()).length;

    if (expiredCount > 0) {
      await this.passwordResetRepository.update(
        { isUsed: false },
        { isUsed: true, usedAt: new Date() }
      );
    }

    this.logger.log(`Cleaned up ${expiredCount} expired password reset records`);
    return expiredCount;
  }

  /**
   * Get password reset statistics
   */
  async getPasswordResetStats(): Promise<{
    totalRequests: number;
    usedCodes: number;
    expiredCodes: number;
    activeCodes: number;
  }> {
    const totalRequests = await this.passwordResetRepository.count();
    const usedCodes = await this.passwordResetRepository.count({ where: { isUsed: true } });
    
    const allResets = await this.passwordResetRepository.find({ where: { isUsed: false } });
    const expiredCodes = allResets.filter(reset => reset.isExpired()).length;
    const activeCodes = allResets.filter(reset => !reset.isExpired()).length;

    return {
      totalRequests,
      usedCodes,
      expiredCodes,
      activeCodes,
    };
  }
}
