import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * Email Service
 * Handles sending verification emails for password reset
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter(): void {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    // Only create transporter if credentials are properly configured
    if (!smtpUser || !smtpPass || smtpUser.includes('your-email') || smtpPass.includes('your-app-password')) {
      this.logger.warn('SMTP credentials not properly configured. Email functionality will be disabled.');
      this.transporter = null;
      return;
    }

    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: this.configService.get<boolean>('SMTP_SECURE') || false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  /**
   * Send password reset verification code
   */
  async sendPasswordResetCode(email: string, code: string, expiresInMinutes: number = 15): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`SMTP credentials not configured. Password reset code for ${email}: ${code} (expires in ${expiresInMinutes} minutes)`);
      return true; // Return true to not break the password reset flow
    }

    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@humanoid.com',
        to: email,
        subject: 'Password Reset Verification Code',
        html: this.generatePasswordResetEmailTemplate(code, expiresInMinutes),
        text: this.generatePasswordResetEmailText(code, expiresInMinutes),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset code sent to ${email}. Message ID: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset code to ${email}:`, error);
      return false;
    }
  }

  /**
   * Generate HTML email template for password reset
   */
  private generatePasswordResetEmailTemplate(code: string, expiresInMinutes: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Verification</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3B82F6;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .verification-code {
            background-color: #1f2937;
            color: #f9fafb;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 4px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Password Reset Verification</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p>You requested a password reset for your Humanoid account. Use the verification code below to reset your password:</p>
          
          <div class="verification-code">${code}</div>
          
          <div class="warning">
            <strong>Important:</strong> This code will expire in ${expiresInMinutes} minutes. Do not share this code with anyone.
          </div>
          
          <p>If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
          
          <p>For security reasons, this code can only be used once and will expire automatically.</p>
        </div>
        <div class="footer">
          <p>This email was sent by Humanoid. If you have any questions, please contact our support team.</p>
          <p>&copy; ${new Date().getFullYear()} Humanoid. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email for password reset
   */
  private generatePasswordResetEmailText(code: string, expiresInMinutes: number): string {
    return `
Password Reset Verification

Hello!

You requested a password reset for your Humanoid account. Use the verification code below to reset your password:

VERIFICATION CODE: ${code}

IMPORTANT: This code will expire in ${expiresInMinutes} minutes. Do not share this code with anyone.

If you didn't request this password reset, please ignore this email. Your account remains secure.

For security reasons, this code can only be used once and will expire automatically.

This email was sent by Humanoid. If you have any questions, please contact our support team.

© ${new Date().getFullYear()} Humanoid. All rights reserved.
    `;
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Email transporter not configured');
      return false;
    }
    
    try {
      await this.transporter.verify();
      this.logger.log('Email configuration is valid');
      return true;
    } catch (error) {
      this.logger.error('Email configuration is invalid:', error);
      return false;
    }
  }
}
