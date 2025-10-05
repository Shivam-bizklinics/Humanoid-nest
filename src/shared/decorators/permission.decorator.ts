import { SetMetadata } from '@nestjs/common';
import { Resource } from '../enums/resource.enum';
import { Action } from '../enums/action.enum';

export const PERMISSION_KEY = 'permission';

export interface PermissionMetadata {
  resource: Resource;
  action: Action;
}

/**
 * Decorator to require specific permission
 * @param resource - The resource to check permission for
 * @param action - The action to check permission for
 */
export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action });

/**
 * Decorator to require workspace permission
 * @param action - The action to check permission for
 */
export const RequireWorkspacePermission = (action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource: Resource.WORKSPACE, action });

/**
 * Decorator to require campaign permission
 * @param action - The action to check permission for
 */
export const RequireCampaignPermission = (action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource: Resource.CAMPAIGN, action });

/**
 * Decorator to require designer permission
 * @param action - The action to check permission for
 */
export const RequireDesignerPermission = (action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource: Resource.DESIGNER, action });

/**
 * Decorator to require publisher permission
 * @param action - The action to check permission for
 */
export const RequirePublisherPermission = (action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource: Resource.PUBLISHER, action });

/**
 * Decorator to require approval permission for any resource
 * @param resource - The resource to check approval permission for
 */
export const RequireApprovalPermission = (resource: Resource) =>
  SetMetadata(PERMISSION_KEY, { resource, action: Action.APPROVE });
