/**
 * Asset related enums
 */

export enum AssetType {
  // Meta assets
  AD_ACCOUNT = 'ad_account',
  PAGE = 'page',
  PIXEL = 'pixel',
  INSTAGRAM_ACCOUNT = 'instagram_account',
  PRODUCT_CATALOG = 'product_catalog',
  OFFLINE_CONVERSION_DATA_SET = 'offline_conversion_data_set',
  APP = 'app',
  
  // LinkedIn assets
  ORGANIZATION = 'organization',
  CAMPAIGN_GROUP = 'campaign_group',
  
  // YouTube assets
  CHANNEL = 'channel',
  VIDEO = 'video',
  PLAYLIST = 'playlist',
  
  // Google Ads assets
  CUSTOMER = 'customer',
  CAMPAIGN = 'campaign',
  AD_GROUP = 'ad_group',
  
  // Twitter assets
  TWITTER_ACCOUNT = 'twitter_account',
  FUNDING_INSTRUMENT = 'funding_instrument',
  
  // TikTok assets
  ADVERTISER = 'advertiser',
  BUSINESS_CENTER = 'business_center',
  
  // Pinterest assets
  BOARD = 'board',
  PIN = 'pin',
  
  // Generic
  ORGANIZATION_ACCOUNT = 'organization_account',
}

export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DISABLED = 'disabled',
  DELETED = 'deleted',
  SUSPENDED = 'suspended',
  VERIFICATION_REQUIRED = 'verification_required',
}

export enum AssetOwnership {
  OWNED = 'owned', // Owned by Humanoid or client
  AGENCY_SHARED = 'agency_shared', // Shared by agency
  CLIENT_SHARED = 'client_shared', // Shared by client
  CLAIMED = 'claimed', // Claimed for access
}

export enum AssetPermissionLevel {
  ADMIN = 'admin',
  ADVERTISER = 'advertiser',
  ANALYST = 'analyst',
  CREATIVE = 'creative',
  VIEWER = 'viewer',
  EDITOR = 'editor',
  MODERATOR = 'moderator',
}

export enum AssetGroupType {
  STANDARD = 'standard',
  AGENCY_SHARED = 'agency_shared',
  CLIENT = 'client',
  CAMPAIGN_SPECIFIC = 'campaign_specific',
  CUSTOM = 'custom',
}

export enum AssetGroupStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

