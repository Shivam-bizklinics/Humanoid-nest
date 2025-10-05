export enum Resource {
  WORKSPACE = 'workspace',
  CAMPAIGN = 'campaign',
  DESIGNER = 'designer',
  PUBLISHER = 'publisher',
}

export enum ResourceDisplayName {
  WORKSPACE = 'Workspace',
  CAMPAIGN = 'Campaign',
  DESIGNER = 'Designer',
  PUBLISHER = 'Publisher',
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
} as const;

export type ResourceConfig = typeof RESOURCE_CONFIG[Resource];
