# Separate Enums Usage Guide

## Overview

The system now uses separate enums for resources and actions, making it more modular and easier to maintain.

### 1. Resource Enum (`src/shared/enums/resource.enum.ts`)
```typescript
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
    displayName: 'Workspace',
    description: 'Workspace management and access control',
    icon: 'workspace',
    color: '#3B82F6',
  },
  // ... other resources
};
```

### 2. Action Enum (`src/shared/enums/action.enum.ts`)
```typescript
export enum Action {
  CREATE = 'create',
  UPDATE = 'update',
  VIEW = 'view',
  DELETE = 'delete',
  APPROVE = 'approve',
  UPLOAD = 'upload',
}

export enum ActionDisplayName {
  CREATE = 'Create',
  UPDATE = 'Update',
  VIEW = 'View',
  DELETE = 'Delete',
  APPROVE = 'Approve',
  UPLOAD = 'Upload',
}

export const ACTION_CONFIG = {
  [Action.CREATE]: {
    displayName: 'Create',
    description: 'Create new resources',
    icon: 'add',
    color: '#10B981',
    verb: 'create',
    pastTense: 'created',
  },
  // ... other actions
};
```

## Usage Examples

### 1. Import and Use Separate Enums

```typescript
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';

// Use in controllers
@Controller('campaigns')
export class CampaignController {
  @Get()
  @RequireCampaignPermission(Action.VIEW)
  async getCampaigns() {
    // Implementation
  }

  @Post()
  @RequireCampaignPermission(Action.CREATE)
  async createCampaign() {
    // Implementation
  }

  @Put(':id')
  @RequireCampaignPermission(Action.UPDATE)
  async updateCampaign() {
    // Implementation
  }

  @Delete(':id')
  @RequireCampaignPermission(Action.DELETE)
  async deleteCampaign() {
    // Implementation
  }

  @Post(':id/approve')
  @RequireApprovalPermission(Resource.CAMPAIGN)
  async approveCampaign() {
    // Implementation
  }
}
```

### 2. Permission Generator Service Usage

```typescript
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { PermissionGeneratorService } from '../../../shared/services/permission-generator.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly permissionGeneratorService: PermissionGeneratorService,
  ) {}

  async createCustomRole() {
    // Generate permissions for specific resource
    const workspacePermissions = this.permissionGeneratorService.generateResourcePermissions(
      Resource.WORKSPACE
    );

    // Generate permissions for specific action across all resources
    const viewPermissions = this.permissionGeneratorService.generateActionPermissions(
      Action.VIEW
    );

    // Generate all permissions
    const allPermissions = this.permissionGeneratorService.generateAllPermissions();
  }
}
```

### 3. Permission Utility Functions

```typescript
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { getPermissionName, parsePermissionName } from '../../../shared/enums/permission.enum';

// Generate permission name
const permissionName = getPermissionName(Resource.CAMPAIGN, Action.CREATE);
// Result: 'campaign.create'

// Parse permission name
const parsed = parsePermissionName('workspace.view');
// Result: { resource: Resource.WORKSPACE, action: Action.VIEW }
```

### 4. Resource and Action Configuration

```typescript
import { Resource, RESOURCE_CONFIG } from '../../../shared/enums/resource.enum';
import { Action, ACTION_CONFIG } from '../../../shared/enums/action.enum';

// Get resource configuration
const workspaceConfig = RESOURCE_CONFIG[Resource.WORKSPACE];
console.log(workspaceConfig.displayName); // 'Workspace'
console.log(workspaceConfig.description); // 'Workspace management and access control'
console.log(workspaceConfig.icon); // 'workspace'
console.log(workspaceConfig.color); // '#3B82F6'

// Get action configuration
const createConfig = ACTION_CONFIG[Action.CREATE];
console.log(createConfig.displayName); // 'Create'
console.log(createConfig.description); // 'Create new resources'
console.log(createConfig.icon); // 'add'
console.log(createConfig.color); // '#10B981'
console.log(createConfig.verb); // 'create'
console.log(createConfig.pastTense); // 'created'
```

### 5. Frontend Integration

```typescript
// Frontend component for permission selection
import { Resource, RESOURCE_CONFIG } from './enums/resource.enum';
import { Action, ACTION_CONFIG } from './enums/action.enum';

const PermissionSelector = () => {
  const [selectedResource, setSelectedResource] = useState<Resource>(Resource.WORKSPACE);
  const [selectedAction, setSelectedAction] = useState<Action>(Action.VIEW);

  return (
    <div>
      <select value={selectedResource} onChange={(e) => setSelectedResource(e.target.value as Resource)}>
        {Object.values(Resource).map(resource => (
          <option key={resource} value={resource}>
            {RESOURCE_CONFIG[resource].displayName}
          </option>
        ))}
      </select>

      <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value as Action)}>
        {Object.values(Action).map(action => (
          <option key={action} value={action}>
            {ACTION_CONFIG[action].displayName}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### 6. API Response with Configuration

```typescript
@Get('resources')
async getResources() {
  const resources = Object.values(Resource).map(resource => ({
    value: resource,
    ...RESOURCE_CONFIG[resource]
  }));

  return {
    success: true,
    data: resources,
    message: 'Resources retrieved successfully'
  };
}

@Get('actions')
async getActions() {
  const actions = Object.values(Action).map(action => ({
    value: action,
    ...ACTION_CONFIG[action]
  }));

  return {
    success: true,
    data: actions,
    message: 'Actions retrieved successfully'
  };
}
```

### 7. Validation and Type Safety

```typescript
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';

// Type-safe function parameters
function checkPermission(resource: Resource, action: Action): boolean {
  // Implementation
}

// Valid usage
checkPermission(Resource.CAMPAIGN, Action.CREATE); // ✅ Valid

// Invalid usage (TypeScript will catch this)
checkPermission('invalid-resource', Action.CREATE); // ❌ TypeScript error
checkPermission(Resource.CAMPAIGN, 'invalid-action'); // ❌ TypeScript error
```

### 8. Database Seeding with New Enums

```typescript
import { Resource } from '../../../shared/enums/resource.enum';
import { Action } from '../../../shared/enums/action.enum';
import { PermissionSeederService } from './permission-seeder.service';

@Injectable()
export class DatabaseSeederService {
  constructor(
    private readonly permissionSeederService: PermissionSeederService,
  ) {}

  async seedDatabase() {
    // This now uses the separate enums internally
    await this.permissionSeederService.seedDefaultRoles();
    
    console.log('Database seeded with separate enums!');
    console.log('Resources:', Object.values(Resource));
    console.log('Actions:', Object.values(Action));
  }
}
```

## Benefits of Separate Enums

### 1. **Modularity**
- Resources and actions are defined separately
- Easy to add new resources without affecting actions
- Easy to add new actions without affecting resources

### 2. **Type Safety**
- Strong typing for both resources and actions
- Compile-time validation of enum values
- IDE autocomplete and error detection

### 3. **Configuration**
- Rich configuration objects for UI display
- Icons, colors, descriptions for frontend
- Verb forms for dynamic text generation

### 4. **Maintainability**
- Clear separation of concerns
- Easy to understand and modify
- Consistent naming conventions

### 5. **Extensibility**
- Simple to add new resources (e.g., ANALYTICS, REPORTS)
- Simple to add new actions (e.g., EXPORT, SHARE)
- Backward compatibility maintained

### 6. **Reusability**
- Enums can be used across different modules
- Configuration objects can be shared with frontend
- Utility functions work with any combination

## Migration from Old Enums

The old enums are still available for backward compatibility:

```typescript
// Old way (still works)
import { PermissionResource, PermissionAction } from './permission.enum';

// New way (recommended)
import { Resource } from './resource.enum';
import { Action } from './action.enum';

// Both are equivalent
PermissionResource.WORKSPACE === Resource.WORKSPACE; // true
PermissionAction.CREATE === Action.CREATE; // true
```

This design provides a clean, modular, and extensible foundation for the permission system!
