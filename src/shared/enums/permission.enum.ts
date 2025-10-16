// Re-export for backward compatibility
export { Action as PermissionAction } from './action.enum';
export { Resource as PermissionResource } from './resource.enum';

import { Resource } from './resource.enum';
import { Action } from './action.enum';

export enum PermissionName {
  // Workspace permissions
  WORKSPACE_CREATE = 'workspace.create',
  WORKSPACE_UPDATE = 'workspace.update', 
  WORKSPACE_VIEW = 'workspace.view', // -> Campaign,Designer,Publisher -> view
  WORKSPACE_DELETE = 'workspace.delete',

  // Campaign permissions
  CAMPAIGN_CREATE = 'campaign.create',
  CAMPAIGN_UPDATE = 'campaign.update',
  CAMPAIGN_VIEW = 'campaign.view',
  CAMPAIGN_DELETE = 'campaign.delete',
  CAMPAIGN_APPROVE = 'campaign.approve',

  // Designer permissions
  DESIGNER_CREATE = 'designer.create',
  DESIGNER_UPDATE = 'designer.update',
  DESIGNER_VIEW = 'designer.view',
  DESIGNER_DELETE = 'designer.delete',
  DESIGNER_APPROVE = 'designer.approve',
  //DESIGNER_UPLOAD = 'designer.upload',

  // Publisher permissions
  PUBLISHER_CREATE = 'publisher.create',
  PUBLISHER_UPDATE = 'publisher.update',
  PUBLISHER_VIEW = 'publisher.view',
  PUBLISHER_DELETE = 'publisher.delete',
  PUBLISHER_APPROVE = 'publisher.approve',

  // Agency permissions
  AGENCY_CREATE = 'agency.create',
  AGENCY_UPDATE = 'agency.update',
  AGENCY_VIEW = 'agency.view',
  AGENCY_DELETE = 'agency.delete',

  // Social Media permissions
  SOCIAL_MEDIA_CREATE = 'social_media.create',
  SOCIAL_MEDIA_UPDATE = 'social_media.update',
  SOCIAL_MEDIA_VIEW = 'social_media.view',
  SOCIAL_MEDIA_DELETE = 'social_media.delete',
}

/**
 * Generate permission name from resource and action
 */
export function getPermissionName(resource: Resource, action: Action): string {
  return `${resource}.${action}`;
}

/**
 * Parse permission name to get resource and action
 */
export function parsePermissionName(permissionName: string): { resource: Resource; action: Action } | null {
  const parts = permissionName.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [resourceStr, actionStr] = parts;
  
  const resource = Object.values(Resource).find(r => r === resourceStr);
  const action = Object.values(Action).find(a => a === actionStr);

  if (!resource || !action) {
    return null;
  }

  return { resource, action };
}
