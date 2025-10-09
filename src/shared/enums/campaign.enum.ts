export enum CampaignType {
  BRAND_AWARENESS = 'brand_awareness',
  LEAD_GENERATION = 'lead_generation',
  SALES = 'sales',
  ENGAGEMENT = 'engagement',
  TRAFFIC = 'traffic',
  EVENT_PROMOTION = 'event_promotion',
  PRODUCT_LAUNCH = 'product_launch',
  CUSTOMER_RETENTION = 'customer_retention',
}

export enum SocialPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  PINTEREST = 'pinterest',
  SNAPCHAT = 'snapchat',
  WHATSAPP = 'whatsapp',
}

export enum ContentType {
  TRANSACTIONAL = 'transactional',
  ENGAGEMENT = 'engagement',
  EMOTIONAL = 'emotional',
  ASPIRATIONAL = 'aspirational',
  HUMOROUS = 'humorous',
  EDUCATIONAL = 'educational',
  PROMOTIONAL = 'promotional',
  INSPIRATIONAL = 'inspirational',
}

export enum PostType {
  IMAGE = 'image',
  GIF = 'gif',
  CAROUSEL = 'carousel',
  STORY = 'story',
  VIDEO = 'video',
  REEL = 'reel',
  IGTV = 'igtv',
  LIVE = 'live',
  POLL = 'poll',
  QUIZ = 'quiz',
  TEXT = 'text',
  LINK = 'link',
}

export enum SystemContentPillar {
  EDUCATIONAL = 'educational',
  ENGAGING = 'engaging',
  CUSTOMER_STORIES = 'customer_stories',
  PRODUCT_SERVICES = 'product_services',
  NEWS_TRENDS = 'news_trends',
  CULTURE_BEHIND_SCENE = 'culture_behind_scene',
  USER_GENERATED_CONTENT = 'user_generated_content',
  SPECIAL_DAYS = 'special_days',
  FAQS = 'faqs',
  EXPERT_INSIGHTS = 'expert_insights',
  COMMUNITY_INVOLVEMENT = 'community_involvement',
  MOTIVATIONAL = 'motivational',
  CONTESTS = 'contests',
  PROMOTION = 'promotion',
  EMPLOYEE_SPOTLIGHTS = 'employee_spotlights',
}

// Display names for better UI presentation
export const CAMPAIGN_TYPE_DISPLAY = {
  [CampaignType.BRAND_AWARENESS]: 'Brand Awareness',
  [CampaignType.LEAD_GENERATION]: 'Lead Generation',
  [CampaignType.SALES]: 'Sales',
  [CampaignType.ENGAGEMENT]: 'Engagement',
  [CampaignType.TRAFFIC]: 'Traffic',
  [CampaignType.EVENT_PROMOTION]: 'Event Promotion',
  [CampaignType.PRODUCT_LAUNCH]: 'Product Launch',
  [CampaignType.CUSTOMER_RETENTION]: 'Customer Retention',
};

export const SOCIAL_PLATFORM_DISPLAY = {
  [SocialPlatform.FACEBOOK]: 'Facebook',
  [SocialPlatform.INSTAGRAM]: 'Instagram',
  [SocialPlatform.LINKEDIN]: 'LinkedIn',
  [SocialPlatform.TWITTER]: 'Twitter',
  [SocialPlatform.YOUTUBE]: 'YouTube',
  [SocialPlatform.TIKTOK]: 'TikTok',
  [SocialPlatform.PINTEREST]: 'Pinterest',
  [SocialPlatform.SNAPCHAT]: 'Snapchat',
  [SocialPlatform.WHATSAPP]: 'WhatsApp',
};

export const CONTENT_TYPE_DISPLAY = {
  [ContentType.TRANSACTIONAL]: 'Transactional',
  [ContentType.ENGAGEMENT]: 'Engagement',
  [ContentType.EMOTIONAL]: 'Emotional',
  [ContentType.ASPIRATIONAL]: 'Aspirational',
  [ContentType.HUMOROUS]: 'Humorous',
  [ContentType.EDUCATIONAL]: 'Educational',
  [ContentType.PROMOTIONAL]: 'Promotional',
  [ContentType.INSPIRATIONAL]: 'Inspirational',
};

export const POST_TYPE_DISPLAY = {
  [PostType.IMAGE]: 'Image',
  [PostType.GIF]: 'GIF',
  [PostType.CAROUSEL]: 'Carousel',
  [PostType.STORY]: 'Story',
  [PostType.VIDEO]: 'Video',
  [PostType.REEL]: 'Reel',
  [PostType.IGTV]: 'IGTV',
  [PostType.LIVE]: 'Live',
  [PostType.POLL]: 'Poll',
  [PostType.QUIZ]: 'Quiz',
  [PostType.TEXT]: 'Text',
  [PostType.LINK]: 'Link',
};

export const SYSTEM_CONTENT_PILLAR_DISPLAY = {
  [SystemContentPillar.EDUCATIONAL]: 'Educational',
  [SystemContentPillar.ENGAGING]: 'Engaging',
  [SystemContentPillar.CUSTOMER_STORIES]: 'Customer Stories',
  [SystemContentPillar.PRODUCT_SERVICES]: 'Product/Services',
  [SystemContentPillar.NEWS_TRENDS]: 'News & Trends',
  [SystemContentPillar.CULTURE_BEHIND_SCENE]: 'Culture/Behind the Scene',
  [SystemContentPillar.USER_GENERATED_CONTENT]: 'User Generated Content',
  [SystemContentPillar.SPECIAL_DAYS]: 'Special Days',
  [SystemContentPillar.FAQS]: 'FAQs',
  [SystemContentPillar.EXPERT_INSIGHTS]: 'Expert Insights',
  [SystemContentPillar.COMMUNITY_INVOLVEMENT]: 'Community Involvement',
  [SystemContentPillar.MOTIVATIONAL]: 'Motivational',
  [SystemContentPillar.CONTESTS]: 'Contests',
  [SystemContentPillar.PROMOTION]: 'Promotion',
  [SystemContentPillar.EMPLOYEE_SPOTLIGHTS]: 'Employee Spotlights',
};
