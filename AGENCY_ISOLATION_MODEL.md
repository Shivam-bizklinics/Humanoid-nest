# Agency Module - Isolation Model

## 🔒 Multi-Level Isolation Architecture

The Agency Module implements a sophisticated multi-level isolation model to support 100K+ users with proper data segregation and access control.

---

## Isolation Hierarchy

```
┌─────────────────────────────────────────────────────┐
│           Humanoid (Parent Business Manager)        │
│                 Platform: Meta                      │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│   User A's BM    │      │   User B's BM    │
│ (Child BM)       │      │ (Child BM)       │
│ ISOLATED BY USER │      │ ISOLATED BY USER │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
    ┌────┴────┐               ┌────┴────┐
    ▼         ▼               ▼         ▼
┌────────┐ ┌────────┐    ┌────────┐ ┌────────┐
│ WS 1   │ │ WS 2   │    │ WS 3   │ │ WS 4   │
│ Assets │ │ Assets │    │ Assets │ │ Assets │
│ Pages  │ │ Pages  │    │ Pages  │ │ Pages  │
└────────┘ └────────┘    └────────┘ └────────┘
```

---

## Isolation Levels

### Level 1: Business Manager Isolation (BY USER)

**Rule:** One child business manager per user (if they have their own BM)

```typescript
// User's own business manager
BusinessManager {
  id: 'bm-uuid-1',
  userId: 'user-a-uuid',  // ← ISOLATED BY USER
  parentBusinessManagerId: 'parent-bm-uuid',
  type: 'client',
  name: "User A's Business Manager"
}
```

**Benefits:**
- Each user with their own BM has complete isolation
- User can manage multiple workspaces under their BM
- All assets under user's BM are accessible to that user

**Use Cases:**
- Agencies with their own Facebook Business Manager
- Clients with existing Business Manager
- Enterprise users managing multiple brands

---

### Level 2: Workspace Isolation (BY WORKSPACE)

**Rule:** Assets (pages, ad accounts, pixels) are isolated per workspace

```typescript
// Assets belong to workspaces
PlatformAsset {
  id: 'asset-uuid-1',
  assetType: 'page',
  businessManagerId: 'bm-uuid-1',  // User's BM
  workspaceId: 'ws-uuid-1',        // ← ISOLATED BY WORKSPACE
  name: 'Brand A Page'
}

PlatformAsset {
  id: 'asset-uuid-2',
  assetType: 'ad_account',
  businessManagerId: 'bm-uuid-1',  // Same user's BM
  workspaceId: 'ws-uuid-2',        // ← Different workspace
  name: 'Brand B Ad Account'
}
```

**Benefits:**
- Multiple brands per user
- Clean separation of campaigns and analytics
- Team members can have workspace-specific access

**Use Cases:**
- Agency managing multiple client brands
- User with multiple businesses
- Department-specific campaigns

---

### Level 3: User Without Business Manager (DIRECT TO PARENT)

**Rule:** If user has no BM, their workspaces link directly to parent BM

```
Humanoid (Parent BM)
├── User C's Workspace 1 (Direct child)
│   └── Assets isolated here
└── User C's Workspace 2 (Direct child)
    └── Assets isolated here
```

```typescript
// User without their own BM
PlatformAsset {
  id: 'asset-uuid-3',
  assetType: 'page',
  businessManagerId: 'parent-bm-uuid',  // ← Links to parent directly
  workspaceId: 'ws-uuid-3',             // ← Still workspace-isolated
  name: 'User C Brand Page'
}
```

**Benefits:**
- Simpler onboarding for users without BM
- Still get workspace isolation for assets
- Can upgrade to own BM later

**Use Cases:**
- Small businesses without Facebook BM
- New users getting started
- Testing and MVP scenarios

---

## Access Control Matrix

| Resource | User With Own BM | User Without BM | Team Member |
|----------|------------------|-----------------|-------------|
| **Own Business Manager** | ✅ Full Access | ❌ No BM | ❌ No Access |
| **Parent BM (for workspaces)** | ✅ Read (for linking) | ✅ Read (for linking) | ✅ Read (for linking) |
| **Own Workspace Assets** | ✅ Full Access | ✅ Full Access | ✅ Based on Role |
| **Other User's BM** | ❌ No Access | ❌ No Access | ❌ No Access |
| **Other User's Assets** | ❌ No Access | ❌ No Access | ❌ No Access |

---

## Implementation Details

### Database Schema

```sql
-- Business Manager (Isolated by User)
CREATE TABLE business_managers (
  id UUID PRIMARY KEY,
  user_id UUID,  -- NULL for parent BM, user ID for child BM
  parent_business_manager_id UUID,
  platform VARCHAR(50),
  type VARCHAR(50),  -- 'parent', 'client', 'agency'
  ...
  UNIQUE(platform, platform_business_id, user_id)
);

-- Platform Assets (Isolated by Workspace)
CREATE TABLE platform_assets (
  id UUID PRIMARY KEY,
  business_manager_id UUID NOT NULL,
  workspace_id UUID,  -- Workspace-level isolation
  asset_type VARCHAR(50),
  platform VARCHAR(50),
  ...
  FOREIGN KEY (business_manager_id) REFERENCES business_managers(id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);
```

### API Flow Examples

#### Example 1: User With Own Business Manager

```typescript
// 1. Connect user's own BM
POST /agency/business-managers/connect
{
  "platformBusinessId": "123456789",
  "parentBusinessManagerId": "parent-bm-uuid",
  "type": "client",
  "relationship": "owned"
}
// Response: Creates BM with userId = current user

// 2. Discover assets
POST /agency/assets/discover
{
  "businessManagerId": "user-bm-uuid"
}
// Response: All assets under user's BM

// 3. Create workspace and link assets
POST /agency/workspace-integration/onboard-page
{
  "pageAssetId": "page-asset-uuid"
}
// Creates workspace, links asset to workspace
// Asset: businessManagerId = user-bm, workspaceId = new-ws
```

#### Example 2: User Without Business Manager

```typescript
// 1. Get parent BM (user has no own BM)
GET /agency/business-managers/user/me/or-parent
// Response: Returns parent BM

// 2. Create workspace (links to parent BM)
POST /workspaces
{
  "name": "My Brand"
}

// 3. Manually add assets to workspace
POST /agency/assets/assign-workspace
{
  "assetId": "asset-uuid",
  "workspaceId": "workspace-uuid"
}
// Asset: businessManagerId = parent-bm, workspaceId = workspace
```

---

## Security Considerations

### 1. Business Manager Access

```typescript
// Permission Check
@UseGuards(JwtAuthGuard, AgencyPermissionGuard)

// In AgencyPermissionGuard:
checkBusinessManagerAccess(userId, businessManagerId) {
  const bm = await findBusinessManager(businessManagerId);
  
  // User owns this BM
  if (bm.userId === userId) return true;
  
  // Parent BM (accessible to all for workspace linking)
  if (bm.type === 'parent') return true;
  
  // Otherwise, no access
  return false;
}
```

### 2. Asset Access

```typescript
checkAssetAccess(userId, assetId) {
  const asset = await findAsset(assetId);
  
  // Check workspace access via RBAC
  if (asset.workspaceId) {
    return checkWorkspaceAccess(userId, asset.workspaceId);
  }
  
  // Check BM ownership
  const bm = await findBusinessManager(asset.businessManagerId);
  return bm.userId === userId;
}
```

### 3. Workspace Access

```typescript
// Existing RBAC system handles workspace access
checkWorkspaceAccess(userId, workspaceId) {
  const userWorkspace = await findUserWorkspace(userId, workspaceId);
  return !!userWorkspace;
}
```

---

## Migration Path

### For Existing Users

If you need to migrate existing data:

```sql
-- Update business managers to add userId
UPDATE business_managers 
SET user_id = created_by 
WHERE type IN ('client', 'agency');

-- Ensure parent BM has no userId
UPDATE business_managers 
SET user_id = NULL 
WHERE type = 'parent';
```

---

## Best Practices

### 1. Onboarding New User With BM

```typescript
async onboardUserWithBM(userId: string, platformBusinessId: string) {
  // Step 1: Connect user's BM
  const userBM = await connectChildBusinessManager(
    Platform.META,
    platformBusinessId,
    parentBMId,
    'client',
    'owned',
    userId
  );
  
  // Step 2: Discover assets
  const assets = await discoverBusinessAssets(userBM.id, userId);
  
  // Step 3: Onboard pages as workspaces
  const pages = assets.filter(a => a.assetType === 'page');
  for (const page of pages) {
    await onboardPageAsWorkspace(page.id, userId, { autoLinkAssets: true });
  }
}
```

### 2. Onboarding New User Without BM

```typescript
async onboardUserWithoutBM(userId: string) {
  // Step 1: Get parent BM
  const parentBM = await getOrCreateUserBusinessManager(userId);
  
  // Step 2: User creates workspace manually
  // (or through normal workspace creation flow)
  
  // Step 3: User adds assets to workspace
  // (assets will link to parent BM + specific workspace)
}
```

### 3. Upgrading User to Own BM

```typescript
async upgradeUserToOwnBM(userId: string, platformBusinessId: string) {
  // Step 1: Create user's BM
  const userBM = await connectChildBusinessManager(...);
  
  // Step 2: Discover assets from user's new BM
  const newAssets = await discoverBusinessAssets(userBM.id, userId);
  
  // Step 3: Link new assets to existing workspaces
  for (const asset of newAssets) {
    await assignAssetToWorkspace(asset.id, workspaceId, userId);
  }
  
  // Old assets (linked to parent BM) remain in workspaces
  // New assets (from user's BM) added to workspaces
}
```

---

## Troubleshooting

### Issue: User sees assets from other users

**Check:**
1. Business Manager userId is set correctly
2. Workspace access is properly configured via RBAC
3. Permission guards are enabled on endpoints

### Issue: User can't access parent BM

**Solution:** Parent BM should be accessible to all users for workspace linking when they don't have their own BM.

### Issue: Assets not showing in workspace

**Check:**
1. Asset has correct workspaceId
2. User has workspace access via RBAC (UserWorkspace table)
3. Asset's business manager is owned by user or is parent BM

---

## Summary

✅ **Business Managers** → Isolated by **USER**
- One BM per user (if they have one)
- Clean separation between users
- Parent BM accessible to all for workspace linking

✅ **Assets (Pages, Ad Accounts)** → Isolated by **WORKSPACE**
- Multiple workspaces per user
- Assets live in specific workspaces
- Workspace RBAC controls access

✅ **Users Without BM** → **Direct to Parent**
- Link workspaces to parent BM
- Still get workspace-level isolation
- Can upgrade to own BM later

This model provides:
- 🔒 Strong isolation between users
- 🏢 Flexible workspace organization
- 👥 Team collaboration support
- 📈 Scalable to 100K+ users
- 🔄 Easy migration paths


