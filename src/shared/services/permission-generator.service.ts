import { Injectable } from '@nestjs/common';
import { Resource } from '../enums/resource.enum';
import { Action } from '../enums/action.enum';
import { PermissionName, getPermissionName } from '../enums/permission.enum';

export interface PermissionData {
  name: string;
  resource: Resource;
  action: Action;
  description: string;
}

@Injectable()
export class PermissionGeneratorService {
  /**
   * Generate all standard permissions for the system
   */
  generateAllPermissions(): PermissionData[] {
    const permissions: PermissionData[] = [];

    // Generate all permissions for each resource
    const resources = Object.values(Resource);
    const actions = Object.values(Action);

    for (const resource of resources) {
      for (const action of actions) {
        permissions.push({
          name: getPermissionName(resource, action),
          resource,
          action,
          description: `${action} permission for ${resource}`,
        });
      }
    }

    return permissions;
  }

  /**
   * Generate permissions for a specific resource
   */
  generateResourcePermissions(resource: Resource): PermissionData[] {
    const permissions: PermissionData[] = [];
    const actions = Object.values(Action);

    for (const action of actions) {
      permissions.push({
        name: getPermissionName(resource, action),
        resource,
        action,
        description: `${action} permission for ${resource}`,
      });
    }

    return permissions;
  }

  /**
   * Generate permissions for a specific action across all resources
   */
  generateActionPermissions(action: Action): PermissionData[] {
    const permissions: PermissionData[] = [];
    const resources = Object.values(Resource);

    for (const resource of resources) {
      permissions.push({
        name: getPermissionName(resource, action),
        resource,
        action,
        description: `${action} permission for ${resource}`,
      });
    }

    return permissions;
  }

  /**
   * Get permission name from enum
   */
  getPermissionName(resource: Resource, action: Action): string {
    return getPermissionName(resource, action);
  }

  /**
   * Validate if a permission name is valid
   */
  isValidPermissionName(permissionName: string): boolean {
    const allPermissions = this.generateAllPermissions();
    return allPermissions.some(perm => perm.name === permissionName);
  }

  /**
   * Parse permission name to get resource and action
   */
  parsePermissionName(permissionName: string): { resource: Resource; action: Action } | null {
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
}
