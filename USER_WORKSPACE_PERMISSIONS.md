# User Workspace Permissions System

## Overview

This system allows you to assign permissions directly to users for specific workspaces, **without using roles**. Each user can have different permissions for different workspaces. This is a simplified, direct permission assignment system that provides maximum flexibility.

## ⚠️ **Important Changes**
- **No more roles**: All role-based entities (`Role`, `UserRole`, `WorkspaceRole`) have been removed
- **Direct permissions**: Users are assigned permissions directly for specific workspaces
- **Simplified system**: No complex role hierarchies or role management

## Key Features

- **Direct Permission Assignment**: Assign permissions directly to users for specific workspaces
- **Granular Control**: Each user can have different permissions for different workspaces
- **No Role Dependency**: No need to create and manage roles
- **Workspace-Scoped**: Permissions are tied to specific workspaces
- **Flexible Management**: Easy to add/remove permissions per user per workspace

## Database Schema

### UserWorkspacePermission Entity
```typescript
{
  id: string;
  userId: string;           // User ID
  workspaceId: string;      // Workspace ID
  permissionId: string;     // Permission ID (resource.action)
  isActive: boolean;        // Active status
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;       // Who assigned this permission
  updatedBy?: string;       // Who last updated this permission
}
```

## API Endpoints

### 1. Assign Single Permission
```bash
POST /user-workspace-permissions/assign
{
  "userId": "user-123",
  "workspaceId": "workspace-456",
  "resource": "campaign",
  "action": "create"
}
```

### 2. Assign Multiple Permissions
```bash
POST /user-workspace-permissions/assign-multiple
{
  "userId": "user-123",
  "workspaceId": "workspace-456",
  "permissions": [
    { "resource": "workspace", "action": "view" },
    { "resource": "campaign", "action": "create" },
    { "resource": "campaign", "action": "update" },
    { "resource": "campaign", "action": "view" },
    { "resource": "designer", "action": "view" }
  ]
}
```

### 3. Bulk Assign to Multiple Users
```bash
POST /user-workspace-permissions/bulk-assign/workspace-456
{
  "userPermissions": [
    {
      "userId": "user-123",
      "permissions": [
        { "resource": "campaign", "action": "create" },
        { "resource": "campaign", "action": "update" }
      ]
    },
    {
      "userId": "user-456",
      "permissions": [
        { "resource": "campaign", "action": "view" }
      ]
    }
  ]
}
```

### 4. Remove Specific Permission
```bash
DELETE /user-workspace-permissions/remove/user-123/workspace-456?resource=campaign&action=create
```

### 5. Remove All User Permissions for Workspace
```bash
DELETE /user-workspace-permissions/remove-all/user-123/workspace-456
```

### 6. Get User Permissions for Workspace
```bash
GET /user-workspace-permissions/user/user-123/workspace/workspace-456
```

### 7. Get All User Workspaces with Permissions
```bash
GET /user-workspace-permissions/user/user-123/workspaces
```

### 8. Get All Users with Permissions for Workspace
```bash
GET /user-workspace-permissions/workspace/workspace-456/users
```

### 9. Check User Permission
```bash
GET /user-workspace-permissions/check/user-123/workspace-456?resource=campaign&action=create
```

### 10. Check User Workspace Access
```bash
GET /user-workspace-permissions/check-workspace-access/user-123/workspace-456
```

### 11. Seed All Permissions
```bash
POST /permissions/seeder/seed-all
```

### 12. Seed Resource Permissions
```bash
POST /permissions/seeder/seed-resource/workspace
POST /permissions/seeder/seed-resource/campaign
POST /permissions/seeder/seed-resource/designer
POST /permissions/seeder/seed-resource/publisher
```

### 13. Get All Permissions
```bash
GET /permissions/seeder
```

### 14. Get Permissions by Resource
```bash
GET /permissions/seeder/resource/workspace
GET /permissions/seeder/resource/campaign
```

### 15. Get Permissions by Action
```bash
GET /permissions/seeder/action/create
GET /permissions/seeder/action/view
```

## Usage Examples

### Example 1: Marketing Team Setup

```typescript
// Assign permissions to marketing team members for workspace-123
const marketingPermissions = [
  {
    userId: "marketing-director-123",
    workspaceId: "workspace-123",
    permissions: [
      { resource: "workspace", action: "view" },
      { resource: "workspace", action: "update" },
      { resource: "campaign", action: "create" },
      { resource: "campaign", action: "update" },
      { resource: "campaign", action: "view" },
      { resource: "campaign", action: "delete" },
      { resource: "designer", action: "view" },
      { resource: "publisher", action: "view" }
    ]
  },
  {
    userId: "campaign-manager-456",
    workspaceId: "workspace-123",
    permissions: [
      { resource: "workspace", action: "view" },
      { resource: "campaign", action: "create" },
      { resource: "campaign", action: "update" },
      { resource: "campaign", action: "view" },
      { resource: "designer", action: "view" }
      // No publisher permissions
    ]
  },
  {
    userId: "content-creator-789",
    workspaceId: "workspace-123",
    permissions: [
      { resource: "workspace", action: "view" },
      { resource: "campaign", action: "view" },
      { resource: "designer", action: "create" },
      { resource: "designer", action: "update" },
      { resource: "designer", action: "view" }
      // No publisher permissions
    ]
  }
];

// Bulk assign permissions
await userWorkspacePermissionService.bulkAssignPermissions(
  "workspace-123",
  marketingPermissions,
  "super-admin-id"
);
```

### Example 2: Client-Specific Access

```typescript
// Different permissions for different clients
const clientAPermissions = [
  {
    userId: "client-a-manager",
    workspaceId: "client-a-workspace",
    permissions: [
      { resource: "workspace", action: "view" },
      { resource: "campaign", action: "view" },
      { resource: "designer", action: "view" }
    ]
  }
];

const clientBPermissions = [
  {
    userId: "client-b-editor",
    workspaceId: "client-b-workspace",
    permissions: [
      { resource: "workspace", action: "view" },
      { resource: "campaign", action: "create" },
      { resource: "campaign", action: "update" },
      { resource: "campaign", action: "view" }
    ]
  }
];
```

### Example 3: Controller Usage with Guards

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UserWorkspacePermissionGuard } from '../rbac/guards/user-workspace-permission.guard';
import { RequireCampaignPermission } from '../shared/decorators/permission.decorator';
import { Action } from '../shared/enums/action.enum';

@Controller('campaigns')
@UseGuards(UserWorkspacePermissionGuard)
export class CampaignController {
  
  @Get(':workspaceId')
  @RequireCampaignPermission(Action.VIEW)
  async getCampaigns(@Param('workspaceId') workspaceId: string) {
    // User must have 'campaign.view' permission for this workspace
    return this.campaignService.getCampaigns(workspaceId);
  }

  @Post(':workspaceId')
  @RequireCampaignPermission(Action.CREATE)
  async createCampaign(
    @Param('workspaceId') workspaceId: string,
    @Body() createDto: any
  ) {
    // User must have 'campaign.create' permission for this workspace
    return this.campaignService.createCampaign(workspaceId, createDto);
  }

  @Put(':workspaceId/:campaignId')
  @RequireCampaignPermission(Action.UPDATE)
  async updateCampaign(
    @Param('workspaceId') workspaceId: string,
    @Param('campaignId') campaignId: string,
    @Body() updateDto: any
  ) {
    // User must have 'campaign.update' permission for this workspace
    return this.campaignService.updateCampaign(workspaceId, campaignId, updateDto);
  }

  @Delete(':workspaceId/:campaignId')
  @RequireCampaignPermission(Action.DELETE)
  async deleteCampaign(
    @Param('workspaceId') workspaceId: string,
    @Param('campaignId') campaignId: string
  ) {
    // User must have 'campaign.delete' permission for this workspace
    return this.campaignService.deleteCampaign(workspaceId, campaignId);
  }
}
```

### Example 4: Service Usage

```typescript
import { Injectable } from '@nestjs/common';
import { UserWorkspacePermissionService } from '../rbac/services/user-workspace-permission.service';
import { Resource } from '../shared/enums/resource.enum';
import { Action } from '../shared/enums/action.enum';

@Injectable()
export class CampaignService {
  constructor(
    private readonly userWorkspacePermissionService: UserWorkspacePermissionService,
  ) {}

  async createCampaign(workspaceId: string, createDto: any, userId: string) {
    // Check if user has permission to create campaigns in this workspace
    const hasPermission = await this.userWorkspacePermissionService.userHasPermission(
      userId,
      workspaceId,
      Resource.CAMPAIGN,
      Action.CREATE
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to create campaigns');
    }

    // Create campaign
    return this.campaignRepository.create({
      ...createDto,
      workspaceId,
      createdBy: userId,
    });
  }

  async getCampaigns(workspaceId: string, userId: string) {
    // Check if user has permission to view campaigns in this workspace
    const hasPermission = await this.userWorkspacePermissionService.userHasPermission(
      userId,
      workspaceId,
      Resource.CAMPAIGN,
      Action.VIEW
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions to view campaigns');
    }

    return this.campaignRepository.find({ where: { workspaceId } });
  }
}
```

## Permission Matrix Example

| User | Workspace | Campaign | Designer | Publisher |
|------|-----------|----------|----------|-----------|
| Marketing Director | view, update | create, update, view, delete | view | view |
| Campaign Manager | view | create, update, view | view | - |
| Content Creator | view | view | create, update, view | - |
| Publisher | view | view | view | create, update, view |

## Benefits

### 1. **Granular Control**
- Each user can have different permissions for different workspaces
- No need to create complex role hierarchies
- Easy to customize permissions per user per workspace

### 2. **Flexibility**
- Add/remove permissions easily
- No role management overhead
- Direct permission assignment

### 3. **Scalability**
- Works well with multiple workspaces
- Easy to manage large teams
- Simple permission model

### 4. **Audit Trail**
- Track who assigned permissions
- Track when permissions were assigned
- Full audit history

### 5. **Security**
- Workspace-scoped permissions
- No cross-workspace access unless explicitly granted
- Fine-grained access control

## Migration from Role-Based System

If you're migrating from a role-based system:

1. **Identify existing role assignments**
2. **Map roles to specific permissions**
3. **Assign permissions directly to users for workspaces**
4. **Remove role dependencies**
5. **Update guards and decorators**

## Best Practices

1. **Use Bulk Assignment**: For multiple users, use bulk assignment endpoints
2. **Regular Audits**: Regularly review user permissions
3. **Principle of Least Privilege**: Only assign necessary permissions
4. **Workspace Isolation**: Keep permissions workspace-scoped
5. **Documentation**: Document permission assignments for teams

This system provides maximum flexibility for managing user permissions across different workspaces!
