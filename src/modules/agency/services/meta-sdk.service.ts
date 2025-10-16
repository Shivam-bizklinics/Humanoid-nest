import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bizSdk from 'facebook-nodejs-business-sdk';
import { AuthToken, SystemUser } from '../entities';
import { AuthTokenStatus, AuthTokenType, Platform } from '../enums';
import { BusinessException } from '../../../shared/exceptions/business.exception';

/**
 * Meta SDK Service
 * Configures and manages Meta SDK, handles authentication and token management
 * Supports system user tokens for long-term API access
 */
@Injectable()
export class MetaSdkService implements OnModuleInit {
  private readonly logger = new Logger(MetaSdkService.name);
  private readonly apiVersion: string;
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly accessToken: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AuthToken)
    private readonly authTokenRepository: Repository<AuthToken>,
    @InjectRepository(SystemUser)
    private readonly systemUserRepository: Repository<SystemUser>,
  ) {
    // Load Meta configuration from environment
    this.apiVersion = this.configService.get<string>('META_API_VERSION', 'v18.0');
    this.appId = this.configService.get<string>('META_APP_ID');
    this.appSecret = this.configService.get<string>('META_APP_SECRET');
    this.accessToken = this.configService.get<string>('META_ACCESS_TOKEN');
  }

  onModuleInit() {
    this.initializeSdk();
  }

  /**
   * Initialize Meta SDK with app credentials
   */
  private initializeSdk(): void {
    if (!this.appId || !this.appSecret) {
      this.logger.warn('Meta credentials not configured. Some features may not work.');
      return;
    }

    try {
      bizSdk.FacebookAdsApi.init(this.accessToken);
      
      const api = bizSdk.FacebookAdsApi.getInstance();
      api.setDebug(this.configService.get('NODE_ENV') === 'development');
      
      this.logger.log(`Meta SDK initialized with API version ${this.apiVersion}`);
    } catch (error) {
      this.logger.error('Failed to initialize Meta SDK:', error);
    }
  }

  /**
   * Get Meta API instance with specific access token
   */
  getApiInstance(accessToken: string): typeof bizSdk.FacebookAdsApi {
    const api = bizSdk.FacebookAdsApi.getInstance();
    api.setAccessToken(accessToken);
    return api;
  }

  /**
   * Get active access token for a system user
   */
  async getSystemUserToken(systemUserId: string): Promise<string> {
    const token = await this.authTokenRepository.findOne({
      where: {
        systemUserId,
        platform: Platform.META,
        tokenType: AuthTokenType.SYSTEM_USER,
        status: AuthTokenStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!token) {
      throw new BusinessException('No active access token found for system user');
    }

    // Check if token is expired
    if (token.expiresAt && new Date() > token.expiresAt) {
      token.status = AuthTokenStatus.EXPIRED;
      await this.authTokenRepository.save(token);
      throw new BusinessException('Access token has expired. Please refresh the token.');
    }

    // Update last used timestamp
    token.lastUsedAt = new Date();
    token.usageCount += 1;
    await this.authTokenRepository.save(token);

    return token.accessToken;
  }

  /**
   * Get active access token for a business manager
   */
  async getBusinessManagerToken(businessManagerId: string): Promise<string> {
    const token = await this.authTokenRepository.findOne({
      where: {
        businessManagerId,
        platform: Platform.META,
        status: AuthTokenStatus.ACTIVE,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!token) {
      throw new BusinessException('No active access token found for business manager');
    }

    // Check if token is expired
    if (token.expiresAt && new Date() > token.expiresAt) {
      // Try to get system user token as fallback
      if (token.systemUserId) {
        return this.getSystemUserToken(token.systemUserId);
      }
      throw new BusinessException('Access token has expired. Please refresh the token.');
    }

    // Update last used timestamp
    token.lastUsedAt = new Date();
    token.usageCount += 1;
    await this.authTokenRepository.save(token);

    return token.accessToken;
  }

  /**
   * Exchange user access token for long-lived token
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?` +
        `grant_type=fb_exchange_token&` +
        `client_id=${this.appId}&` +
        `client_secret=${this.appSecret}&` +
        `fb_exchange_token=${shortLivedToken}`
      );

      const data = await response.json();

      if (data.error) {
        throw new BusinessException(`Failed to exchange token: ${data.error.message}`);
      }

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 5184000, // Default 60 days
      };
    } catch (error) {
      this.logger.error('Error exchanging token:', error);
      throw new BusinessException('Failed to exchange access token');
    }
  }

  /**
   * Verify access token and get token info
   */
  async debugToken(accessToken: string): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/debug_token?` +
        `input_token=${accessToken}&` +
        `access_token=${this.appId}|${this.appSecret}`
      );

      const data = await response.json();

      if (data.error) {
        throw new BusinessException(`Failed to debug token: ${data.error.message}`);
      }

      return data.data;
    } catch (error) {
      this.logger.error('Error debugging token:', error);
      throw new BusinessException('Failed to verify access token');
    }
  }

  /**
   * Get user permissions for an access token
   */
  async getUserPermissions(userId: string, accessToken: string): Promise<string[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${userId}/permissions?` +
        `access_token=${accessToken}`
      );

      const data = await response.json();

      if (data.error) {
        throw new BusinessException(`Failed to get permissions: ${data.error.message}`);
      }

      return data.data
        .filter((p: any) => p.status === 'granted')
        .map((p: any) => p.permission);
    } catch (error) {
      this.logger.error('Error getting user permissions:', error);
      throw new BusinessException('Failed to get user permissions');
    }
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(redirectUri: string, state: string, scopes: string[]): string {
    const scopeString = scopes.join(',');
    return (
      `https://www.facebook.com/${this.apiVersion}/dialog/oauth?` +
      `client_id=${this.appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scopeString)}&` +
      `response_type=code`
    );
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    accessToken: string;
    expiresIn?: number;
  }> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/oauth/access_token?` +
        `client_id=${this.appId}&` +
        `client_secret=${this.appSecret}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${code}`
      );

      const data = await response.json();

      if (data.error) {
        throw new BusinessException(`Failed to exchange code: ${data.error.message}`);
      }

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      this.logger.error('Error exchanging code for token:', error);
      throw new BusinessException('Failed to exchange authorization code');
    }
  }

  /**
   * Make a Graph API request
   */
  async graphApiRequest(
    path: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    params: Record<string, any> = {},
    accessToken?: string,
  ): Promise<any> {
    const token = accessToken || this.accessToken;
    
    try {
      const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${path}`);
      
      if (method === 'GET') {
        Object.keys(params).forEach(key => {
          url.searchParams.append(key, params[key]);
        });
        url.searchParams.append('access_token', token);
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (method === 'POST') {
        options.body = JSON.stringify({
          ...params,
          access_token: token,
        });
      }

      const response = await fetch(url.toString(), options);
      const data = await response.json();

      if (data.error) {
        throw new BusinessException(`Graph API error: ${data.error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`Graph API request failed for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Batch requests to Meta API (for efficiency)
   */
  async batchRequest(
    requests: Array<{ method: string; relative_url: string }>,
    accessToken: string,
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batch: requests,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new BusinessException(`Batch request failed: ${data.error.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error('Batch request failed:', error);
      throw new BusinessException('Failed to execute batch request');
    }
  }

  /**
   * Get SDK classes for direct use
   */
  getSdkClasses() {
    return {
      AdAccount: bizSdk.AdAccount,
      Campaign: bizSdk.Campaign,
      AdSet: bizSdk.AdSet,
      Ad: bizSdk.Ad,
      Business: bizSdk.Business,
      Page: bizSdk.Page,
      AdCreative: bizSdk.AdCreative,
      CustomAudience: bizSdk.CustomAudience,
      AdImage: bizSdk.AdImage,
      AdVideo: bizSdk.AdVideo,
    };
  }
}

