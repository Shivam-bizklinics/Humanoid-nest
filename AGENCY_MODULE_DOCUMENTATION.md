# Agency Module - Comprehensive Documentation

## Overview

The Agency Module is a comprehensive, enterprise-grade solution for managing Meta Business Manager integrations at scale. Built to support 100K+ users, it provides a 2-tier business manager hierarchy, automated asset management, campaign operations, and centralized analytics.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Setup & Configuration](#setup--configuration)
4. [Core Concepts](#core-concepts)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)
7. [Permission System](#permission-system)
8. [Multi-Platform Support](#multi-platform-support)
9. [Scalability & Performance](#scalability--performance)
10. [Testing Guide](#testing-guide)

---

## Architecture

### Multi-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Controllers Layer                        │
│  (Business Managers, Assets, Campaigns, Insights, WS)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                     Services Layer                           │
│  • Meta SDK Service (Authentication & API)                  │
│  • Business Manager Service (2-Tier Hierarchy)              │
│  • Asset Management Service (BAM API)                       │
│  • Asset Group Service (Organization)                       │
│  • Marketing API Service (Campaign Management)              │
│  • Insights API Service (Analytics & Reporting)             │
│  • Workspace Integration Service (Onboarding)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                     Data Layer                               │
│  Entities: BusinessManager, SystemUser, AuthToken,          │
│           PlatformAsset, AssetGroup, MetaCampaign,          │
│           InsightData                                        │
└──────────────────────────────────────────────────────────────┘
```

### Database Schema

#### Core Entities

1. **BusinessManager**: 2-tier hierarchy (Parent → Child)
2. **SystemUser**: Long-lived authentication
3. **AuthToken**: Encrypted access tokens
4. **PlatformAsset**: Universal asset storage (pages, ad accounts, pixels, etc.)
5. **AssetGroup**: Asset organization
6. **MetaCampaign**: Campaign tracking
7. **InsightData**: Centralized analytics

---

## Features

### 1. Two-Tier Business Manager Hierarchy

**Parent Business Manager (Humanoid)**
- Central control of all client/agency relationships
- System user management
- Cross-account operations

**Child Business Managers (Clients/Agencies)**
- Isolated per user (one BM per user who has their own BM)
- Pages/Assets isolated per workspace
- If user has no BM: workspaces directly under parent BM
- Automated setup
- Asset inheritance

### 2. System User Authentication

- **One-Time Setup**: Create system users once
- **Long-Lived Tokens**: Never expire, no repeated logins
- **Automated Access**: Full programmatic control

### 3. Business Asset Management API Integration

- **Automatic Discovery**: Find all owned & shared assets
- **Access Requests**: Automate partnership requests
- **Permission Management**: Granular access control
- **Multi-Asset Support**: Ad accounts, pages, pixels, Instagram, catalogs

### 4. Asset Group Management

- **Organization**: Group assets logically
- **Sync to Platform**: Create groups on Meta
- **Auto-Management**: Automated asset addition

### 5. Marketing API Integration

- **Campaign CRUD**: Create, update, delete at scale
- **Batch Operations**: Manage 100s of campaigns
- **Status Management**: Bulk pause/activate
- **Budget Control**: Daily/lifetime budgets

### 6. Ads Insights API Integration

- **Centralized Analytics**: All campaigns in one place
- **Historical Data**: Store insights over time
- **Aggregated Reports**: Workspace-level metrics
- **Performance Tracking**: Top campaigns, trends

### 7. Workspace Integration

- **Automatic Onboarding**: Pages → Workspaces
- **Asset Linking**: Auto-link related assets
- **Brand Sync**: Update workspace from page data
- **Multi-Tenancy**: Isolated per workspace

### 8. Multi-Platform Ready

- **Extensible Architecture**: Easy to add LinkedIn, YouTube, Google Ads
- **Platform Abstraction**: Generic entities & services
- **Future-Proof**: Built for expansion

---

## Setup & Configuration

### 1. Environment Variables

Add to your `.env` file:

```bash
# Meta Configuration
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_long_lived_token
META_API_VERSION=v18.0

# Parent Business Manager (Humanoid's)
PARENT_BUSINESS_ID=your_business_manager_id
```

### 2. Database Migration

Run migrations to create tables:

```bash
npm run migration:generate -- src/migrations/CreateAgencyModule
npm run migration:run
```

### 3. Module Import

Add to `app.module.ts`:

```typescript
import { AgencyModule } from './modules/agency/agency.module';

@Module({
  imports: [
    // ... other modules
    AgencyModule,
  ],
})
export class AppModule {}
```

### 4. Initial Setup

```typescript
// 1. Create/Get Parent Business Manager
POST /agency/business-managers/parent
{
  "platform": "meta",
  "platformBusinessId": "YOUR_BM_ID",
  "name": "Humanoid Business Manager"
}

// 2. Create System User
POST /agency/business-managers/system-users
{
  "businessManagerId": "parent_bm_uuid",
  "name": "Humanoid System User",
  "role": "admin",
  "platform": "meta"
}

// 3. Generate System User Token
POST /agency/business-managers/system-users/generate-token
{
  "systemUserId": "system_user_uuid",
  "appId": "YOUR_APP_ID",
  "scope": ["business_management", "ads_management", "pages_manage_ads"]
}
```

---

## Core Concepts

### Business Manager Hierarchy

#### Option 1: User HAS their own Business Manager
```
Humanoid (Parent BM)
├── User A's Business Manager (Child BM) ← Isolated by USER
│   ├── Workspace 1 ← Assets isolated here
│   │   ├── Page: Brand A Page
│   │   ├── Ad Account: act_123
│   │   └── Pixel: pixel_456
│   └── Workspace 2 ← Assets isolated here
│       ├── Page: Brand B Page
│       └── Ad Account: act_789
└── User B's Business Manager (Child BM) ← Isolated by USER
    └── Workspace 3 ← Assets isolated here
```

#### Option 2: User DOES NOT have Business Manager
```
Humanoid (Parent BM)
├── User C's Workspace 1 ← Direct child, assets isolated here
│   ├── Page: Brand C Page
│   └── Ad Account: act_456
└── User C's Workspace 2 ← Direct child, assets isolated here
    ├── Page: Brand D Page
    └── Ad Account: act_101
```

**Key Points:**
- Child BMs are isolated by **USER** (one per user if they have their own BM)
- Assets (pages, ad accounts) are isolated by **WORKSPACE**
- Users without their own BM have workspaces directly under parent BM

### Asset Ownership Types

1. **OWNED**: Directly owned by Humanoid/client
2. **AGENCY_SHARED**: Shared by partner agency
3. **CLIENT_SHARED**: Shared by client
4. **CLAIMED**: Requested and approved

### Permission Levels

1. **ADMIN**: Full control
2. **ADVERTISER**: Create/manage campaigns
3. **ANALYST**: View-only analytics
4. **CREATIVE**: Create ad creatives
5. **VIEWER**: Basic view access

---

## API Endpoints

### Business Managers

```http
# Create Parent BM
POST /agency/business-managers/parent

# Connect Child BM
POST /agency/business-managers/connect

# Get BM Details
GET /agency/business-managers/:id

# Get Children
GET /agency/business-managers/parent/:parentId/children

# Get by Workspace
GET /agency/business-managers/workspace/:workspaceId

# Sync from Platform
POST /agency/business-managers/:id/sync

# Request Access
POST /agency/business-managers/request-access
```

### Assets

```http
# Discover Assets
POST /agency/assets/discover
{
  "businessManagerId": "bm_uuid"
}

# Get Assets
GET /agency/assets?workspaceId=ws_uuid&assetType=ad_account

# Assign to Workspace
POST /agency/assets/assign-workspace
{
  "assetId": "asset_uuid",
  "workspaceId": "ws_uuid"
}

# Request Access
POST /agency/assets/request-access
{
  "assetId": "asset_uuid",
  "targetBusinessManagerId": "bm_id",
  "permission": "advertiser"
}

# Sync Asset
POST /agency/assets/sync
{
  "assetId": "asset_uuid"
}
```

### Asset Groups

```http
# Create Asset Group
POST /agency/assets/groups
{
  "businessManagerId": "bm_uuid",
  "name": "Campaign Assets Q4",
  "groupType": "campaign_specific",
  "assetIds": ["asset1", "asset2"],
  "syncToPlatform": true
}

# Add Assets to Group
POST /agency/assets/groups/:id/add-assets
{
  "assetIds": ["asset3", "asset4"]
}

# Discover Platform Groups
POST /agency/assets/groups/discover/:businessManagerId
```

### Campaigns

```http
# Create Campaign
POST /agency/campaigns
{
  "adAccountId": "asset_uuid",
  "name": "Q4 Holiday Campaign",
  "objective": "OUTCOME_SALES",
  "status": "PAUSED",
  "dailyBudget": 100,
  "bidStrategy": "LOWEST_COST_WITHOUT_CAP"
}

# Batch Create
POST /agency/campaigns/batch
{
  "adAccountId": "asset_uuid",
  "campaigns": [...]
}

# Update Campaign
PUT /agency/campaigns/:id
{
  "status": "ACTIVE",
  "dailyBudget": 150
}

# Batch Update Status
POST /agency/campaigns/batch/update-status
{
  "campaignIds": ["camp1", "camp2"],
  "status": "PAUSED"
}

# Sync from Platform
POST /agency/campaigns/sync
{
  "campaignId": "campaign_uuid"
}

# Sync All for Ad Account
POST /agency/campaigns/sync/ad-account
{
  "adAccountId": "asset_uuid"
}
```

### Insights & Analytics

```http
# Fetch Ad Account Insights
POST /agency/insights/ad-account/fetch
{
  "adAccountId": "asset_uuid",
  "datePreset": "last_7d"
}

# Fetch Campaign Insights
POST /agency/insights/campaign/fetch
{
  "campaignId": "campaign_uuid",
  "datePreset": "last_30d",
  "breakdowns": ["age", "gender"]
}

# Get Workspace Insights
POST /agency/insights/workspace
{
  "workspaceId": "ws_uuid",
  "startDate": "2025-10-01",
  "endDate": "2025-10-09"
}

# Get Top Performing Campaigns
POST /agency/insights/top-performing
{
  "workspaceId": "ws_uuid",
  "metric": "roas",
  "limit": 10
}

# Batch Fetch (Multiple Accounts)
POST /agency/insights/batch/fetch
{
  "adAccountIds": ["asset1", "asset2", "asset3"],
  "datePreset": "yesterday"
}
```

### Workspace Integration

```http
# Onboard Page as Workspace
POST /agency/workspace-integration/onboard-page
{
  "pageAssetId": "page_asset_uuid",
  "description": "Main brand workspace",
  "autoLinkAssets": true
}

# Batch Onboard Pages
POST /agency/workspace-integration/batch-onboard-pages
{
  "pageAssetIds": ["page1", "page2", "page3"],
  "autoLinkAssets": true
}

# Discover and Onboard All
POST /agency/workspace-integration/discover-and-onboard
{
  "businessManagerId": "bm_uuid",
  "autoLinkAssets": true
}

# Link Ad Account
POST /agency/workspace-integration/link-ad-account
{
  "adAccountId": "asset_uuid",
  "workspaceId": "ws_uuid"
}

# Get Workspace Assets
GET /agency/workspace-integration/workspace/:id/assets

# Get Workspace Summary
GET /agency/workspace-integration/workspace/:id/summary
```

---

## Usage Examples

### Complete Onboarding Flow

```typescript
// Step 1: Connect Client Business Manager
const clientBM = await POST('/agency/business-managers/connect', {
  platform: 'meta',
  platformBusinessId: '1234567890',
  parentBusinessManagerId: parentBMId,
  type: 'client',
  relationship: 'client',
});

// Step 2: Discover All Assets
const assets = await POST('/agency/assets/discover', {
  businessManagerId: clientBM.id,
});

// Step 3: Onboard Pages as Workspaces
const workspaces = await POST('/agency/workspace-integration/batch-onboard-pages', {
  pageAssetIds: assets.filter(a => a.assetType === 'page').map(a => a.id),
  autoLinkAssets: true,
});

// Step 4: Sync Campaigns
for (const workspace of workspaces) {
  const adAccounts = assets.filter(a => 
    a.assetType === 'ad_account' && a.workspaceId === workspace.id
  );
  
  for (const adAccount of adAccounts) {
    await POST('/agency/campaigns/sync/ad-account', {
      adAccountId: adAccount.id,
    });
  }
}

// Step 5: Fetch Initial Insights
await POST('/agency/insights/batch/fetch', {
  adAccountIds: adAccounts.map(a => a.id),
  datePreset: 'last_30d',
});
```

### Campaign Management at Scale

```typescript
// Create 100 campaigns across 10 ad accounts
const campaigns = adAccounts.flatMap(adAccount =>
  Array.from({ length: 10 }, (_, i) => ({
    adAccountId: adAccount.id,
    name: `Campaign ${i + 1} - ${adAccount.name}`,
    objective: 'OUTCOME_SALES',
    status: 'PAUSED',
    dailyBudget: 50,
  }))
);

const created = await POST('/agency/campaigns/batch', { campaigns });

// Activate top 50 by budget
const topCampaigns = created.slice(0, 50);
await POST('/agency/campaigns/batch/update-status', {
  campaignIds: topCampaigns.map(c => c.id),
  status: 'ACTIVE',
});
```

### Analytics Dashboard

```typescript
// Get workspace overview
const summary = await POST('/agency/insights/workspace', {
  workspaceId,
  startDate: '2025-10-01',
  endDate: '2025-10-09',
});

// Get top performing campaigns
const topCampaigns = await POST('/agency/insights/top-performing', {
  workspaceId,
  metric: 'roas',
  limit: 10,
});

// Get detailed campaign insights
const campaigns = await GET(`/agency/campaigns/ad-account/${adAccountId}`);
const campaignInsights = await POST('/agency/insights/campaigns', {
  campaignIds: campaigns.map(c => c.id),
  startDate: '2025-10-01',
  endDate: '2025-10-09',
});
```

---

## Permission System

### RBAC Integration

The agency module integrates with the existing RBAC system:

```typescript
// Resource Types
AGENCY = 'agency'           // Business managers, system users
SOCIAL_MEDIA = 'social_media' // Assets, campaigns, insights

// Actions
CREATE, UPDATE, VIEW, DELETE

// Permission Examples
agency.create        // Create business managers
agency.update        // Update business managers
agency.view          // View business managers
social_media.create  // Create campaigns
social_media.update  // Update campaigns & assets
social_media.view    // View analytics
```

### Workspace-Based Access Control

```typescript
// User can only access:
// 1. Assets in their workspaces
// 2. Business managers linked to their workspaces
// 3. Campaigns in their ad accounts
// 4. Insights for their assets

// Enforced by AgencyPermissionGuard
@UseGuards(JwtAuthGuard, AgencyPermissionGuard)
```

---

## Multi-Platform Support

### Adding New Platforms

The architecture is designed for easy platform expansion:

1. **Add Platform Enum**:
```typescript
enum Platform {
  META = 'meta',
  LINKEDIN = 'linkedin', // New platform
  YOUTUBE = 'youtube',   // New platform
}
```

2. **Create Platform Service**:
```typescript
@Injectable()
export class LinkedInSdkService {
  // Similar structure to MetaSdkService
}
```

3. **Extend Services**:
```typescript
// AssetManagementService
private async discoverLinkedInAssets(...) {
  // Platform-specific logic
}
```

4. **Platform-Specific Entities** (optional):
```typescript
@Entity('linkedin_campaigns')
export class LinkedInCampaign {
  // LinkedIn-specific fields
}
```

---

## Scalability & Performance

### Database Optimization

1. **Indexes**: All foreign keys and frequently queried fields
2. **Partitioning**: Insight data by date
3. **Caching**: Redis for frequently accessed data
4. **Connection Pooling**: TypeORM configuration

### API Rate Limiting

```typescript
// Meta API: 200 calls/hour per user
// Batch operations to stay within limits
// Implement exponential backoff
```

### Concurrent Operations

```typescript
// Process in batches
const batchSize = 5;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await Promise.all(batch.map(item => processItem(item)));
}
```

### Data Retention

```typescript
// Insights: Keep 90 days detailed, 1 year aggregated
// Campaigns: Soft delete, archive after 1 year
// Assets: Never delete, mark as inactive
```

---

## Testing Guide

### Testing with Graph API Explorer

1. **Generate Test Token**:
   - Go to: https://developers.facebook.com/tools/explorer
   - Select your app
   - Get Token → Get User Access Token
   - Select permissions: `business_management`, `ads_management`, `pages_manage_ads`

2. **Test Business Manager**:
```http
GET /{business-id}?fields=id,name,permitted_tasks,primary_page
```

3. **Test Ad Accounts**:
```http
GET /{business-id}/owned_ad_accounts?fields=id,name,account_status,currency
```

4. **Test Pages**:
```http
GET /{business-id}/owned_pages?fields=id,name,fan_count,instagram_business_account
```

5. **Test Insights**:
```http
GET /act_{ad-account-id}/insights?fields=impressions,clicks,spend&date_preset=last_7d
```

### Unit Testing

```typescript
describe('BusinessManagerService', () => {
  it('should create parent business manager', async () => {
    const result = await service.getOrCreateParentBusinessManager(...);
    expect(result.type).toBe('parent');
  });
});
```

### Integration Testing

```typescript
describe('Agency Module E2E', () => {
  it('should complete full onboarding flow', async () => {
    // 1. Connect BM
    // 2. Discover assets
    // 3. Onboard pages
    // 4. Sync campaigns
    // 5. Fetch insights
  });
});
```

### Performance Testing

```bash
# Test with 100K requests
npm run test:load
```

---

## Best Practices

### 1. Error Handling

```typescript
try {
  await metaSdkService.graphApiRequest(...);
} catch (error) {
  if (error.code === 'ECONNRESET') {
    // Retry with backoff
  } else if (error.error?.code === 190) {
    // Token expired, refresh
  } else {
    // Log and throw
  }
}
```

### 2. Token Management

- Store tokens encrypted
- Implement automatic refresh
- Monitor token expiration
- Use system users for long-term access

### 3. Data Synchronization

- Schedule regular syncs (daily for insights, weekly for assets)
- Implement incremental sync
- Handle conflicts gracefully
- Log sync errors for review

### 4. Security

- Never expose access tokens
- Validate all inputs
- Implement rate limiting
- Use HTTPS only
- Encrypt sensitive data

---

## Troubleshooting

### Common Issues

**Issue**: "No access token found"
**Solution**: Generate system user token or refresh user token

**Issue**: "Rate limit exceeded"
**Solution**: Implement exponential backoff, reduce batch size

**Issue**: "Asset not found"
**Solution**: Sync assets from platform, check permissions

**Issue**: "Permission denied"
**Solution**: Verify user has workspace access, check RBAC permissions

---

## Future Enhancements

1. **LinkedIn Integration**: Add LinkedIn Ads support
2. **Google Ads Integration**: Connect Google Ads accounts
3. **YouTube Integration**: Manage YouTube channels
4. **TikTok Integration**: TikTok For Business
5. **Advanced Analytics**: Predictive analytics, anomaly detection
6. **Automation Rules**: Auto-pause low performers
7. **Budget Optimization**: AI-powered budget allocation
8. **Creative Testing**: A/B testing automation

---

## Support & Resources

- **Meta Business API**: https://developers.facebook.com/docs/business-api
- **Marketing API**: https://developers.facebook.com/docs/marketing-api
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer
- **Meta Business Manager**: https://business.facebook.com

---

## Changelog

### v1.0.0 (2025-10-09)
- Initial release
- Meta platform support
- 2-tier business manager hierarchy
- Asset management
- Campaign management
- Insights API
- Workspace integration
- Multi-platform architecture

---

## License

Proprietary - Humanoid Project

