/**
 * Meta-specific enums for campaigns, ads, and insights
 */

export enum MetaPermission {
  // Business management permissions
  BUSINESS_MANAGEMENT = 'business_management',
  ADS_MANAGEMENT = 'ads_management',
  
  // Page permissions
  PAGES_MANAGE_ADS = 'pages_manage_ads',
  PAGES_MANAGE_METADATA = 'pages_manage_metadata',
  PAGES_MANAGE_POSTS = 'pages_manage_posts',
  PAGES_READ_ENGAGEMENT = 'pages_read_engagement',
  PAGES_READ_USER_CONTENT = 'pages_read_user_content',
  PAGES_SHOW_LIST = 'pages_show_list',
  
  // Instagram permissions
  INSTAGRAM_BASIC = 'instagram_basic',
  INSTAGRAM_CONTENT_PUBLISH = 'instagram_content_publish',
  INSTAGRAM_MANAGE_COMMENTS = 'instagram_manage_comments',
  INSTAGRAM_MANAGE_INSIGHTS = 'instagram_manage_insights',
  
  // Ad insights
  ADS_READ = 'ads_read',
  READ_INSIGHTS = 'read_insights',
  
  // Catalog permissions
  CATALOG_MANAGEMENT = 'catalog_management',
  
  // Lead management
  LEADS_RETRIEVAL = 'leads_retrieval',
}

export enum MetaAdAccountStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  UNSETTLED = 'UNSETTLED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PENDING_SETTLEMENT = 'PENDING_SETTLEMENT',
  IN_GRACE_PERIOD = 'IN_GRACE_PERIOD',
  PENDING_CLOSURE = 'PENDING_CLOSURE',
  CLOSED = 'CLOSED',
  ANY_ACTIVE = 'ANY_ACTIVE',
  ANY_CLOSED = 'ANY_CLOSED',
}

export enum MetaPageStatus {
  ACTIVE = 'active',
  UNPUBLISHED = 'unpublished',
  DELETED = 'deleted',
}

export enum MetaCampaignObjective {
  OUTCOME_APP_PROMOTION = 'OUTCOME_APP_PROMOTION',
  OUTCOME_AWARENESS = 'OUTCOME_AWARENESS',
  OUTCOME_ENGAGEMENT = 'OUTCOME_ENGAGEMENT',
  OUTCOME_LEADS = 'OUTCOME_LEADS',
  OUTCOME_SALES = 'OUTCOME_SALES',
  OUTCOME_TRAFFIC = 'OUTCOME_TRAFFIC',
}

export enum MetaCampaignStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DELETED = 'DELETED',
  ARCHIVED = 'ARCHIVED',
}

export enum MetaAdSetStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DELETED = 'DELETED',
  ARCHIVED = 'ARCHIVED',
}

export enum MetaAdStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DELETED = 'DELETED',
  ARCHIVED = 'ARCHIVED',
}

export enum MetaBidStrategy {
  LOWEST_COST_WITHOUT_CAP = 'LOWEST_COST_WITHOUT_CAP',
  LOWEST_COST_WITH_BID_CAP = 'LOWEST_COST_WITH_BID_CAP',
  COST_CAP = 'COST_CAP',
}

export enum MetaOptimizationGoal {
  NONE = 'NONE',
  APP_INSTALLS = 'APP_INSTALLS',
  AD_RECALL_LIFT = 'AD_RECALL_LIFT',
  ENGAGED_USERS = 'ENGAGED_USERS',
  EVENT_RESPONSES = 'EVENT_RESPONSES',
  IMPRESSIONS = 'IMPRESSIONS',
  LEAD_GENERATION = 'LEAD_GENERATION',
  QUALITY_LEAD = 'QUALITY_LEAD',
  LINK_CLICKS = 'LINK_CLICKS',
  OFFSITE_CONVERSIONS = 'OFFSITE_CONVERSIONS',
  PAGE_LIKES = 'PAGE_LIKES',
  POST_ENGAGEMENT = 'POST_ENGAGEMENT',
  QUALITY_CALL = 'QUALITY_CALL',
  REACH = 'REACH',
  LANDING_PAGE_VIEWS = 'LANDING_PAGE_VIEWS',
  VISIT_INSTAGRAM_PROFILE = 'VISIT_INSTAGRAM_PROFILE',
  VALUE = 'VALUE',
  THRUPLAY = 'THRUPLAY',
  DERIVED_EVENTS = 'DERIVED_EVENTS',
  APP_INSTALLS_AND_OFFSITE_CONVERSIONS = 'APP_INSTALLS_AND_OFFSITE_CONVERSIONS',
  CONVERSATIONS = 'CONVERSATIONS',
  IN_APP_VALUE = 'IN_APP_VALUE',
}

export enum MetaBillingEvent {
  APP_INSTALLS = 'APP_INSTALLS',
  CLICKS = 'CLICKS',
  IMPRESSIONS = 'IMPRESSIONS',
  LINK_CLICKS = 'LINK_CLICKS',
  NONE = 'NONE',
  OFFER_CLAIMS = 'OFFER_CLAIMS',
  PAGE_LIKES = 'PAGE_LIKES',
  POST_ENGAGEMENT = 'POST_ENGAGEMENT',
  THRUPLAY = 'THRUPLAY',
  PURCHASE = 'PURCHASE',
  LISTING_INTERACTION = 'LISTING_INTERACTION',
}

export enum MetaInsightMetric {
  // Campaign metrics
  IMPRESSIONS = 'impressions',
  CLICKS = 'clicks',
  SPEND = 'spend',
  REACH = 'reach',
  FREQUENCY = 'frequency',
  CPM = 'cpm',
  CPC = 'cpc',
  CTR = 'ctr',
  CPP = 'cpp',
  COST_PER_UNIQUE_CLICK = 'cost_per_unique_click',
  
  // Conversion metrics
  CONVERSIONS = 'conversions',
  CONVERSION_VALUES = 'conversion_values',
  COST_PER_CONVERSION = 'cost_per_conversion',
  PURCHASE_ROAS = 'purchase_roas',
  
  // Engagement metrics
  POST_ENGAGEMENT = 'post_engagement',
  PAGE_ENGAGEMENT = 'page_engagement',
  LINK_CLICKS = 'link_clicks',
  POST_REACTIONS = 'post_reactions',
  POST_COMMENTS = 'post_comments',
  POST_SHARES = 'post_shares',
  PAGE_LIKES = 'page_likes',
  
  // Video metrics
  VIDEO_VIEWS = 'video_views',
  VIDEO_VIEW_RATE = 'video_view_rate',
  VIDEO_THRUPLAY_WATCHED_ACTIONS = 'video_thruplay_watched_actions',
  VIDEO_AVG_TIME_WATCHED_ACTIONS = 'video_avg_time_watched_actions',
  VIDEO_P25_WATCHED_ACTIONS = 'video_p25_watched_actions',
  VIDEO_P50_WATCHED_ACTIONS = 'video_p50_watched_actions',
  VIDEO_P75_WATCHED_ACTIONS = 'video_p75_watched_actions',
  VIDEO_P95_WATCHED_ACTIONS = 'video_p95_watched_actions',
  VIDEO_P100_WATCHED_ACTIONS = 'video_p100_watched_actions',
  
  // App metrics
  APP_INSTALLS = 'app_install',
  COST_PER_APP_INSTALL = 'cost_per_action_type:app_install',
  
  // Lead metrics
  LEADS = 'leads',
  COST_PER_LEAD = 'cost_per_action_type:lead',
}

export enum MetaInsightBreakdown {
  AGE = 'age',
  GENDER = 'gender',
  COUNTRY = 'country',
  REGION = 'region',
  DMA = 'dma',
  PLACEMENT = 'placement',
  DEVICE_PLATFORM = 'device_platform',
  PUBLISHER_PLATFORM = 'publisher_platform',
  PLATFORM_POSITION = 'platform_position',
  IMPRESSION_DEVICE = 'impression_device',
  PRODUCT_ID = 'product_id',
}

export enum MetaInsightDatePreset {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LIFETIME = 'lifetime',
  LAST_3_DAYS = 'last_3d',
  LAST_7_DAYS = 'last_7d',
  LAST_14_DAYS = 'last_14d',
  LAST_28_DAYS = 'last_28d',
  LAST_30_DAYS = 'last_30d',
  LAST_90_DAYS = 'last_90d',
  LAST_WEEK_MON_SUN = 'last_week_mon_sun',
  LAST_WEEK_SUN_SAT = 'last_week_sun_sat',
  LAST_QUARTER = 'last_quarter',
  LAST_YEAR = 'last_year',
  THIS_WEEK_MON_TODAY = 'this_week_mon_today',
  THIS_WEEK_SUN_TODAY = 'this_week_sun_today',
  THIS_YEAR = 'this_year',
}

export enum MetaInsightLevel {
  ACCOUNT = 'account',
  CAMPAIGN = 'campaign',
  ADSET = 'adset',
  AD = 'ad',
}

export enum MetaInsightTimeIncrement {
  ALL_DAYS = 'all_days',
  MONTHLY = 'monthly',
  DAILY = 1,
}

