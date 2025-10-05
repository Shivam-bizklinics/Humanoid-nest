import { SocialMediaAccount } from '../entities/social-media-account.entity';
import { SocialAd } from '../entities/social-ad.entity';
import { SocialAdCampaign } from '../entities/social-ad-campaign.entity';

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string[];
  error?: string;
}

export interface AccountInfo {
  id: string;
  name: string;
  displayName?: string;
  profilePictureUrl?: string;
  bio?: string;
  websiteUrl?: string;
  followersCount?: number;
  followingCount?: number;
  accountType: string;
  metadata?: Record<string, any>;
}

export interface AdCreationData {
  accountId?: string;
  campaignId?: string;
  pageId?: string; // Facebook Page ID (required for Meta)
  name: string;
  description?: string;
  objective: string;
  adType: string;
  headline?: string;
  primaryText?: string;
  callToAction?: string;
  linkUrl?: string;
  displayUrl?: string;
  budget?: number;
  bidAmount?: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  targeting?: Record<string, any>;
  creatives?: CreativeData[];
}

export interface CreativeData {
  type: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  headline?: string;
  description?: string;
  callToAction?: string;
  linkUrl?: string;
  displayUrl?: string;
  imageHash?: string; // Hash of uploaded image (Meta-specific)
  videoId?: string; // ID of uploaded video (Meta-specific)
  metadata?: Record<string, any>;
}

export interface CampaignCreationData {
  accountId?: string;
  name: string;
  description?: string;
  objective: string;
  budgetType: string;
  budget: number;
  startDate?: Date;
  endDate?: Date;
  targeting?: Record<string, any>;
}

export interface PerformanceData {
  adId: string;
  date: Date;
  metric: string;
  value: number;
  currency?: string;
  breakdown?: Record<string, any>;
}

export interface SocialMediaProvider {
  // Authentication
  getAuthUrl(state?: string): string;
  exchangeCodeForToken(code: string, state?: string): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  revokeToken(accessToken: string): Promise<boolean>;
  validateToken(accessToken: string): Promise<boolean>;

  // Account Management
  getAccountInfo(accessToken: string): Promise<AccountInfo>;
  getAccounts(accessToken: string): Promise<AccountInfo[]>;
  updateAccount(accessToken: string, accountId: string, data: Partial<AccountInfo>): Promise<AccountInfo>;

  // Campaign Management
  createCampaign(accessToken: string, data: CampaignCreationData): Promise<SocialAdCampaign>;
  getCampaigns(accessToken: string, accountId: string): Promise<SocialAdCampaign[]>;
  getCampaign(accessToken: string, campaignId: string): Promise<SocialAdCampaign>;
  updateCampaign(accessToken: string, campaignId: string, data: Partial<CampaignCreationData>): Promise<SocialAdCampaign>;
  deleteCampaign(accessToken: string, campaignId: string): Promise<boolean>;
  pauseCampaign(accessToken: string, campaignId: string): Promise<boolean>;
  resumeCampaign(accessToken: string, campaignId: string): Promise<boolean>;

  // Ad Management
  createAd(accessToken: string, data: AdCreationData): Promise<SocialAd>;
  getAds(accessToken: string, accountId: string): Promise<SocialAd[]>;
  getAd(accessToken: string, adId: string): Promise<SocialAd>;
  updateAd(accessToken: string, adId: string, data: Partial<AdCreationData>): Promise<SocialAd>;
  deleteAd(accessToken: string, adId: string): Promise<boolean>;
  pauseAd(accessToken: string, adId: string): Promise<boolean>;
  resumeAd(accessToken: string, adId: string): Promise<boolean>;

  // Performance & Analytics
  getAdPerformance(accessToken: string, adId: string, startDate: Date, endDate: Date): Promise<PerformanceData[]>;
  getCampaignPerformance(accessToken: string, campaignId: string, startDate: Date, endDate: Date): Promise<PerformanceData[]>;
  getAccountPerformance(accessToken: string, accountId: string, startDate: Date, endDate: Date): Promise<PerformanceData[]>;

  // Targeting & Audiences
  getTargetingOptions(accessToken: string): Promise<Record<string, any>>;
  createCustomAudience(accessToken: string, name: string, description: string, data: any[]): Promise<string>;
  getCustomAudiences(accessToken: string, accountId: string): Promise<any[]>;
  updateCustomAudience(accessToken: string, audienceId: string, data: any): Promise<boolean>;
  deleteCustomAudience(accessToken: string, audienceId: string): Promise<boolean>;

  // Platform-specific features
  getSupportedFeatures(): string[];
  getApiLimits(): Record<string, any>;
  validateAdData(data: AdCreationData): Promise<{ valid: boolean; errors: string[] }>;
  validateCampaignData(data: CampaignCreationData): Promise<{ valid: boolean; errors: string[] }>;
}
