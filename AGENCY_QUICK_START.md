# Agency Module - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up and test the Agency Module quickly.

---

## Prerequisites

1. ✅ Meta Developer Account
2. ✅ Meta Business Manager Account
3. ✅ Meta App with Business Manager API access
4. ✅ PostgreSQL Database running
5. ✅ Node.js v18+ installed

---

## Step 1: Environment Configuration

Create/update your `.env` file:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=humanoid_db

# Meta Configuration
META_APP_ID=YOUR_APP_ID
META_APP_SECRET=YOUR_APP_SECRET
META_ACCESS_TOKEN=YOUR_LONG_LIVED_TOKEN
META_API_VERSION=v18.0

# Parent Business Manager
PARENT_BUSINESS_ID=YOUR_BUSINESS_MANAGER_ID
```

**Get Your Credentials:**
1. Go to https://developers.facebook.com/apps
2. Create/select your app
3. Go to Settings → Basic
4. Copy App ID and App Secret
5. Go to https://business.facebook.com/settings
6. Copy your Business Manager ID

---

## Step 2: Install & Run Migrations

```bash
# Install dependencies
npm install

# Generate migration
npm run migration:generate -- src/migrations/CreateAgencyModule

# Run migrations
npm run migration:run

# Start the server
npm run start:dev
```

---

## Step 3: Get Your Access Token

### Option A: Using Graph API Explorer (Quick Test)

1. Go to https://developers.facebook.com/tools/explorer
2. Select your app
3. Click "Generate Access Token"
4. Select permissions:
   - ✅ business_management
   - ✅ ads_management
   - ✅ pages_manage_ads
   - ✅ pages_read_engagement
   - ✅ ads_read
5. Click "Generate Access Token"
6. Copy the token

### Option B: OAuth Flow (Production)

Use the authorization URL endpoint:

```http
POST /agency/auth/get-authorization-url
{
  "redirectUri": "https://your-domain.com/callback",
  "state": "random_string",
  "scopes": [
    "business_management",
    "ads_management",
    "pages_manage_ads"
  ]
}
```

---

## Step 4: Initialize Parent Business Manager

```bash
curl -X POST http://localhost:3000/agency/business-managers/parent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "meta",
    "platformBusinessId": "YOUR_BUSINESS_MANAGER_ID",
    "name": "Humanoid Business Manager",
    "type": "parent",
    "relationship": "owned"
  }'
```

**Response:**
```json
{
  "id": "uuid-here",
  "platform": "meta",
  "name": "Humanoid Business Manager",
  "type": "parent",
  "status": "connected"
}
```

---

## Step 5: Create System User

```bash
curl -X POST http://localhost:3000/agency/business-managers/system-users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessManagerId": "PARENT_BM_UUID",
    "name": "Humanoid System User",
    "role": "admin",
    "platform": "meta"
  }'
```

**Response:**
```json
{
  "id": "uuid-here",
  "platformSystemUserId": "meta-system-user-id",
  "name": "Humanoid System User",
  "role": "admin"
}
```

---

## Step 6: Generate System User Token

```bash
curl -X POST http://localhost:3000/agency/business-managers/system-users/generate-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "systemUserId": "SYSTEM_USER_UUID",
    "appId": "YOUR_APP_ID",
    "scope": [
      "business_management",
      "ads_management",
      "pages_manage_ads",
      "ads_read"
    ]
  }'
```

**Response:**
```json
{
  "id": "token-uuid",
  "platform": "meta",
  "tokenType": "system_user",
  "status": "active",
  "scopes": ["business_management", "ads_management", ...]
}
```

---

## Step 7: Discover Assets

```bash
curl -X POST http://localhost:3000/agency/assets/discover \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessManagerId": "PARENT_BM_UUID"
  }'
```

**Response:**
```json
[
  {
    "id": "asset-uuid-1",
    "assetType": "ad_account",
    "name": "My Ad Account",
    "platformAssetId": "act_123456789",
    "status": "active"
  },
  {
    "id": "asset-uuid-2",
    "assetType": "page",
    "name": "My Brand Page",
    "platformAssetId": "123456789",
    "status": "active"
  }
]
```

---

## Step 8: Onboard Page as Workspace

```bash
curl -X POST http://localhost:3000/agency/workspace-integration/onboard-page \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageAssetId": "PAGE_ASSET_UUID",
    "description": "Main brand workspace",
    "autoLinkAssets": true
  }'
```

**Response:**
```json
{
  "id": "workspace-uuid",
  "name": "My Brand Page Workspace",
  "brandName": "My Brand Page",
  "setupStatus": "completed",
  "isActive": true
}
```

---

## Step 9: Sync Campaigns

```bash
curl -X POST http://localhost:3000/agency/campaigns/sync/ad-account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adAccountId": "AD_ACCOUNT_ASSET_UUID"
  }'
```

**Response:**
```json
[
  {
    "id": "campaign-uuid-1",
    "platformCampaignId": "23851234567890123",
    "name": "Q4 Sales Campaign",
    "objective": "OUTCOME_SALES",
    "status": "ACTIVE",
    "dailyBudget": 100
  }
]
```

---

## Step 10: Fetch Insights

```bash
curl -X POST http://localhost:3000/agency/insights/ad-account/fetch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adAccountId": "AD_ACCOUNT_ASSET_UUID",
    "datePreset": "last_7d"
  }'
```

**Response:**
```json
[
  {
    "id": "insight-uuid",
    "reportDate": "2025-10-09",
    "impressions": 15000,
    "clicks": 450,
    "spend": 125.50,
    "reach": 12000,
    "ctr": 3.0,
    "cpc": 0.28,
    "cpm": 8.37
  }
]
```

---

## 🎉 Success!

You've successfully set up the Agency Module! You can now:

- ✅ Manage multiple business managers
- ✅ Discover and organize assets
- ✅ Create and manage campaigns
- ✅ Track analytics and insights
- ✅ Onboard clients automatically

---

## Next Steps

### For Development

1. **Test with Postman**: Import `Humanoid-API-Complete-2025.postman_collection.json`
2. **Explore API**: Check `AGENCY_MODULE_DOCUMENTATION.md`
3. **Add More Clients**: Connect child business managers
4. **Create Campaigns**: Use the Marketing API endpoints

### For Production

1. **Security**: Encrypt auth tokens in database
2. **Rate Limiting**: Configure API rate limits
3. **Monitoring**: Set up error tracking
4. **Scheduled Jobs**: Configure cron for daily sync
5. **Backups**: Set up database backups

---

## Troubleshooting

### ❌ "No access token found"
**Solution**: Make sure you've completed Step 6 (Generate System User Token)

### ❌ "Business manager not found"
**Solution**: Verify your `PARENT_BUSINESS_ID` in `.env` matches your actual Business Manager ID

### ❌ "Permission denied"
**Solution**: Check that your Meta app has all required permissions approved

### ❌ "Rate limit exceeded"
**Solution**: Wait 1 hour or reduce batch sizes in your requests

### ❌ "Invalid access token"
**Solution**: Token may have expired, generate a new long-lived token

---

## Testing Endpoints

### Postman Collection

Import the collection and test all endpoints:

```bash
# Collection includes:
- ✅ Business Manager CRUD
- ✅ Asset Discovery & Management
- ✅ Campaign Operations
- ✅ Insights & Analytics
- ✅ Workspace Integration
```

### Sample Test Scenarios

**Scenario 1: Onboard New Client**
```
1. Connect child BM
2. Discover assets
3. Create asset group
4. Onboard pages
5. Sync campaigns
6. Fetch insights
```

**Scenario 2: Campaign Management**
```
1. Create campaign
2. Create ad sets
3. Create ads
4. Monitor performance
5. Pause low performers
```

**Scenario 3: Analytics Dashboard**
```
1. Get workspace summary
2. Get top campaigns
3. Get detailed insights
4. Export reports
```

---

## Support

- 📚 Full Documentation: `AGENCY_MODULE_DOCUMENTATION.md`
- 🐛 Issues: Contact development team
- 💬 Questions: Check the documentation first

---

## Quick Commands

```bash
# Start server
npm run start:dev

# Run migrations
npm run migration:run

# Generate migration
npm run migration:generate -- src/migrations/YourMigrationName

# Test
npm run test

# Build
npm run build

# Production
npm run start:prod
```

---

**Happy Coding! 🚀**

