/**
 * Multi-platform enums for agency module
 * Supports Meta, LinkedIn, YouTube, Google Ads, etc.
 */

export enum Platform {
  META = 'meta',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
  GOOGLE_ADS = 'google_ads',
  TWITTER = 'twitter',
  TIKTOK = 'tiktok',
  PINTEREST = 'pinterest',
  SNAPCHAT = 'snapchat',
}

export enum PlatformDisplayName {
  META = 'Meta (Facebook & Instagram)',
  LINKEDIN = 'LinkedIn',
  YOUTUBE = 'YouTube',
  GOOGLE_ADS = 'Google Ads',
  TWITTER = 'Twitter (X)',
  TIKTOK = 'TikTok',
  PINTEREST = 'Pinterest',
  SNAPCHAT = 'Snapchat',
}

export const PLATFORM_CONFIG = {
  [Platform.META]: {
    displayName: PlatformDisplayName.META,
    icon: 'facebook',
    color: '#1877F2',
    supportedAssetTypes: ['ad_account', 'page', 'pixel', 'instagram_account', 'product_catalog', 'app'],
    apiVersion: 'v18.0',
  },
  [Platform.LINKEDIN]: {
    displayName: PlatformDisplayName.LINKEDIN,
    icon: 'linkedin',
    color: '#0A66C2',
    supportedAssetTypes: ['organization', 'ad_account', 'campaign_group'],
    apiVersion: 'v2',
  },
  [Platform.YOUTUBE]: {
    displayName: PlatformDisplayName.YOUTUBE,
    icon: 'youtube',
    color: '#FF0000',
    supportedAssetTypes: ['channel', 'video', 'playlist'],
    apiVersion: 'v3',
  },
  [Platform.GOOGLE_ADS]: {
    displayName: PlatformDisplayName.GOOGLE_ADS,
    icon: 'google',
    color: '#4285F4',
    supportedAssetTypes: ['customer', 'campaign', 'ad_group'],
    apiVersion: 'v13',
  },
  [Platform.TWITTER]: {
    displayName: PlatformDisplayName.TWITTER,
    icon: 'twitter',
    color: '#1DA1F2',
    supportedAssetTypes: ['account', 'funding_instrument', 'campaign'],
    apiVersion: 'v2',
  },
  [Platform.TIKTOK]: {
    displayName: PlatformDisplayName.TIKTOK,
    icon: 'tiktok',
    color: '#000000',
    supportedAssetTypes: ['advertiser', 'business_center'],
    apiVersion: 'v1.3',
  },
  [Platform.PINTEREST]: {
    displayName: PlatformDisplayName.PINTEREST,
    icon: 'pinterest',
    color: '#E60023',
    supportedAssetTypes: ['ad_account', 'board', 'pin'],
    apiVersion: 'v5',
  },
  [Platform.SNAPCHAT]: {
    displayName: PlatformDisplayName.SNAPCHAT,
    icon: 'snapchat',
    color: '#FFFC00',
    supportedAssetTypes: ['ad_account', 'organization', 'pixel'],
    apiVersion: 'v1',
  },
} as const;

