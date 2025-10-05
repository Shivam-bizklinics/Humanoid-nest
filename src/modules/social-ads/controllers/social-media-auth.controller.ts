import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SocialMediaAuthService } from '../services/social-media-auth.service';
import { SocialMediaService } from '../services/social-media.service';
import { PlatformType } from '../entities/social-media-platform.entity';

@ApiTags('Social Media Authentication')
@ApiBearerAuth()
@Controller('social-media-auth')
export class SocialMediaAuthController {
  constructor(
    private readonly authService: SocialMediaAuthService,
    private readonly socialMediaService: SocialMediaService,
  ) {}

  @Post('initiate/:accountId')
  @ApiOperation({ summary: 'Initiate social media authentication' })
  @ApiResponse({ status: 200, description: 'Authentication initiated successfully' })
  async initiateAuth(@Param('accountId') accountId: string, @Request() req) {
    const account = await this.socialMediaService.getAccount(accountId);
    const { authUrl, state } = await this.authService.initiateAuth(accountId, account.platform.type);
    
    return {
      success: true,
      data: { authUrl, state },
      message: 'Authentication initiated successfully',
    };
  }

  @Post('complete/:accountId')
  @ApiOperation({ summary: 'Complete social media authentication' })
  @ApiResponse({ status: 200, description: 'Authentication completed successfully' })
  async completeAuth(
    @Param('accountId') accountId: string,
    @Body() body: { code: string; state: string },
    @Request() req,
  ) {
    const auth = await this.authService.completeAuth(accountId, body.code, body.state);
    return {
      success: true,
      data: auth,
      message: 'Authentication completed successfully',
    };
  }

  @Post('refresh/:authId')
  @ApiOperation({ summary: 'Refresh authentication token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  async refreshAuth(@Param('authId') authId: string, @Request() req) {
    const auth = await this.authService.refreshAuth(authId);
    return {
      success: true,
      data: auth,
      message: 'Token refreshed successfully',
    };
  }

  @Post('revoke/:authId')
  @ApiOperation({ summary: 'Revoke authentication token' })
  @ApiResponse({ status: 200, description: 'Token revoked successfully' })
  async revokeAuth(@Param('authId') authId: string, @Request() req) {
    const success = await this.authService.revokeAuth(authId);
    return {
      success,
      message: success ? 'Token revoked successfully' : 'Failed to revoke token',
    };
  }

  @Get('validate/:authId')
  @ApiOperation({ summary: 'Validate authentication token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  async validateAuth(@Param('authId') authId: string, @Request() req) {
    const isValid = await this.authService.validateAuth(authId);
    return {
      success: true,
      data: { isValid },
      message: isValid ? 'Token is valid' : 'Token is invalid',
    };
  }

  @Get('accounts/:accountId/auths')
  @ApiOperation({ summary: 'Get account authentication records' })
  @ApiResponse({ status: 200, description: 'Authentication records retrieved successfully' })
  async getAccountAuths(@Param('accountId') accountId: string, @Request() req) {
    const auths = await this.authService.getAccountAuths(accountId);
    return {
      success: true,
      data: auths,
      message: 'Authentication records retrieved successfully',
    };
  }

  @Get('accounts/:accountId/active-auth')
  @ApiOperation({ summary: 'Get active authentication for account' })
  @ApiResponse({ status: 200, description: 'Active authentication retrieved successfully' })
  async getActiveAuth(@Param('accountId') accountId: string, @Request() req) {
    const auth = await this.authService.getActiveAuth(accountId);
    return {
      success: true,
      data: auth,
      message: 'Active authentication retrieved successfully',
    };
  }

  @Get('auths/:authId')
  @ApiOperation({ summary: 'Get specific authentication record' })
  @ApiResponse({ status: 200, description: 'Authentication record retrieved successfully' })
  async getAuth(@Param('authId') authId: string, @Request() req) {
    const auth = await this.authService.getAuth(authId);
    return {
      success: true,
      data: auth,
      message: 'Authentication record retrieved successfully',
    };
  }

  @Get('accounts/:accountId/access-token')
  @ApiOperation({ summary: 'Get valid access token for account' })
  @ApiResponse({ status: 200, description: 'Access token retrieved successfully' })
  async getValidAccessToken(@Param('accountId') accountId: string, @Request() req) {
    const accessToken = await this.authService.getValidAccessToken(accountId);
    return {
      success: true,
      data: { accessToken },
      message: 'Access token retrieved successfully',
    };
  }

  @Get('accounts/:accountId/is-authenticated')
  @ApiOperation({ summary: 'Check if account is authenticated' })
  @ApiResponse({ status: 200, description: 'Authentication status retrieved successfully' })
  async isAccountAuthenticated(@Param('accountId') accountId: string, @Request() req) {
    const isAuthenticated = await this.authService.isAccountAuthenticated(accountId);
    return {
      success: true,
      data: { isAuthenticated },
      message: isAuthenticated ? 'Account is authenticated' : 'Account is not authenticated',
    };
  }

  @Get('accounts/:accountId/permissions')
  @ApiOperation({ summary: 'Get account permissions' })
  @ApiResponse({ status: 200, description: 'Permissions retrieved successfully' })
  async getAccountPermissions(@Param('accountId') accountId: string, @Request() req) {
    const permissions = await this.authService.getAccountPermissions(accountId);
    return {
      success: true,
      data: permissions,
      message: 'Permissions retrieved successfully',
    };
  }
}
