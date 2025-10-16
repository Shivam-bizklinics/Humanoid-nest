/**
 * Meta API related interfaces
 */

export interface IMetaBusinessManager {
  id: string;
  name: string;
  created_time?: string;
  timezone_id?: number;
  primary_page?: {
    id: string;
    name: string;
  };
  permitted_tasks?: string[];
  two_factor_type?: string;
  verification_status?: string;
  vertical_id?: number;
}

export interface IMetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  timezone_offset_hours_utc: number;
  business?: {
    id: string;
    name: string;
  };
  amount_spent?: string;
  balance?: string;
  spend_cap?: string;
  funding_source_details?: any;
  is_personal?: boolean;
  disable_reason?: number;
}

export interface IMetaPage {
  id: string;
  name: string;
  category?: string;
  category_list?: Array<{
    id: string;
    name: string;
  }>;
  link?: string;
  picture?: {
    data: {
      url: string;
    };
  };
  cover?: {
    source: string;
  };
  fan_count?: number;
  access_token?: string;
  instagram_business_account?: {
    id: string;
  };
}

export interface IMetaInstagramAccount {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  biography?: string;
  website?: string;
}

export interface IMetaPixel {
  id: string;
  name: string;
  code: string;
  is_unavailable?: boolean;
  last_fired_time?: string;
}

export interface IMetaSystemUser {
  id: string;
  name: string;
  role: string;
  created_time: string;
}

export interface IMetaAccessToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface IMetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  effective_status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  start_time?: string;
  stop_time?: string;
  created_time: string;
  updated_time: string;
  account_id?: string;
  buying_type?: string;
  can_use_spend_cap?: boolean;
  spend_cap?: string;
  special_ad_categories?: string[];
  issues_info?: any[];
  recommendations?: any[];
}

export interface IMetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  effective_status?: string;
  billing_event?: string;
  bid_amount?: number;
  budget_remaining?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal?: string;
  targeting?: any;
  start_time?: string;
  end_time?: string;
  created_time: string;
  updated_time: string;
}

export interface IMetaAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: string;
  effective_status?: string;
  creative?: {
    id: string;
    name?: string;
  };
  created_time: string;
  updated_time: string;
}

export interface IMetaInsights {
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  frequency?: string;
  cpm?: string;
  cpc?: string;
  ctr?: string;
  cpp?: string;
  cost_per_unique_click?: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  action_values?: Array<{
    action_type: string;
    value: string;
  }>;
  conversions?: Array<{
    action_type: string;
    value: string;
  }>;
  conversion_values?: Array<{
    action_type: string;
    value: string;
  }>;
  cost_per_action_type?: Array<{
    action_type: string;
    value: string;
  }>;
  purchase_roas?: Array<{
    action_type: string;
    value: string;
  }>;
  video_play_actions?: Array<{
    action_type: string;
    value: string;
  }>;
  video_avg_time_watched_actions?: Array<{
    action_type: string;
    value: string;
  }>;
  date_start?: string;
  date_stop?: string;
}

export interface IMetaInsightsParams {
  fields: string[];
  level?: 'account' | 'campaign' | 'adset' | 'ad';
  time_range?: {
    since: string;
    until: string;
  };
  date_preset?: string;
  breakdowns?: string[];
  time_increment?: string | number;
  filtering?: any[];
  sort?: string[];
  limit?: number;
}

export interface IMetaAssetPermission {
  business_id: string;
  business_name?: string;
  permission_type: string;
  tasks?: string[];
  status?: string;
}

