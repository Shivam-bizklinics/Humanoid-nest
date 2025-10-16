export enum Resource {
  WORKSPACE = 'workspace',
  CAMPAIGN = 'campaign',
  DESIGNER = 'designer',
  PUBLISHER = 'publisher',
  USER = 'user',
  AGENCY = 'agency',
  SOCIAL_MEDIA = 'social_media',
}

export enum ResourceDisplayName {
  WORKSPACE = 'Workspace',
  CAMPAIGN = 'Campaign',
  DESIGNER = 'Designer',
  PUBLISHER = 'Publisher',
  USER = 'User',
  AGENCY = 'Agency',
  SOCIAL_MEDIA = 'Social Media',
}

export const RESOURCE_CONFIG = {
  [Resource.WORKSPACE]: {
    displayName: ResourceDisplayName.WORKSPACE,
    description: 'Workspace management and access control',
    icon: 'workspace',
    color: '#3B82F6',
  },
  [Resource.CAMPAIGN]: {
    displayName: ResourceDisplayName.CAMPAIGN,
    description: 'Campaign creation and management',
    icon: 'campaign',
    color: '#10B981',
  },
  [Resource.DESIGNER]: {
    displayName: ResourceDisplayName.DESIGNER,
    description: 'Design tools and content creation',
    icon: 'design',
    color: '#F59E0B',
  },
  [Resource.PUBLISHER]: {
    displayName: ResourceDisplayName.PUBLISHER,
    description: 'Content publishing and distribution',
    icon: 'publish',
    color: '#EF4444',
  },
  [Resource.USER]: {
    displayName: ResourceDisplayName.USER,
    description: 'User management and impersonation',
    icon: 'person',
    color: '#8B5CF6',
  },
  [Resource.AGENCY]: {
    displayName: ResourceDisplayName.AGENCY,
    description: 'Agency and business manager administration',
    icon: 'business',
    color: '#06B6D4',
  },
  [Resource.SOCIAL_MEDIA]: {
    displayName: ResourceDisplayName.SOCIAL_MEDIA,
    description: 'Social media accounts and advertising management',
    icon: 'share',
    color: '#EC4899',
  },
} as const;

export type ResourceConfig = typeof RESOURCE_CONFIG[Resource];
