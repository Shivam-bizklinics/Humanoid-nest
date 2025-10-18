import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { PasswordResetService } from '../services/password-reset.service';
import { RegisterDto, LoginDto, AuthResponseDto, RefreshTokenDto } from '../dto/auth.dto';
import { ForgotPasswordDto, VerifyResetCodeDto, ResetPasswordDto, PasswordResetResponseDto } from '../dto/password-reset.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { user, tokens } = await this.authService.register(registerDto);
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const { user, tokens } = await this.authService.login(loginDto);
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Body() body: { userId: string }): Promise<{ message: string }> {
    await this.authService.logout(body.userId);
    return { message: 'Successfully logged out' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset - send verification code' })
  @ApiResponse({ status: 200, description: 'Verification code sent to email', type: PasswordResetResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid email or too many requests' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.requestPasswordReset(forgotPasswordDto);
  }

  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset code' })
  @ApiResponse({ status: 200, description: 'Verification code is valid', type: PasswordResetResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired verification code' })
  async verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.verifyResetCode(verifyResetCodeDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with verification code' })
  @ApiResponse({ status: 200, description: 'Password reset successfully', type: PasswordResetResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired verification code' })
  @ApiResponse({ status: 400, description: 'Invalid password format' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<PasswordResetResponseDto> {
    return this.passwordResetService.resetPassword(resetPasswordDto);
  }
}
