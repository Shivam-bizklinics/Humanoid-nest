# Meta Business SDK Integration Guide

## 🎯 Overview

The Social Ads module now uses the **official Facebook/Meta Business SDK** (`facebook-nodejs-business-sdk`) instead of direct HTTP calls. This provides several key advantages:

### ✅ Benefits of Using Meta SDK

1. **Type Safety** - Full TypeScript support with Meta's official types
2. **Automatic Updates** - SDK handles API version changes
3. **Built-in Error Handling** - Better error messages and retry logic
4. **Rate Limiting** - Automatic rate limit handling
5. **Batch Operations** - Built-in support for batch requests
6. **No Breaking Changes** - Meta maintains backward compatibility in SDK
7. **Official Support** - Direct support from Meta for SDK issues
8. **Helper Methods** - Utilities for common operations

### ❌ What We Avoided (Direct HTTP Calls)

Without SDK, you would need to:
- Manually handle API version changes
- Write your own retry logic
- Implement rate limiting yourself
- Handle pagination manually
- Debug cryptic API errors
- Update code when Meta changes endpoints

---

## 📦 Installation

```bash
npm install facebook-nodejs-business-sdk --save
```

**Current Version**: Uses Meta Graph API v18.0 (configurable)

---

## 🏗️ Architecture

### SDK Initialization

```typescript
import bizSdk from 'facebook-nodejs-business-sdk';

const {
  FacebookAdsApi,
  AdAccount,
  Campaign,
  Ad,
  AdSet,
  AdCreative,
  AdsInsights,
  CustomAudience,
  Page,
  User,
} = bizSdk;

// Initialize API (access token set per request)
this.api = FacebookAdsApi.init(null);
```

### Setting Access Token

```typescript
// Set access token for each request
this.api.setAccessToken(accessToken);

// Now all SDK operations use this token
const user = new User('me');
const userData = await user.read(['id', 'name', 'email']);
```

---

## 🔑 Key Features Implemented

### 1. **Authentication**

#### OAuth Flow
```typescript
// Generate OAuth URL
getAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: this.clientId,
    redirect_uri: this.redirectUri,
    scope: [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
      'pages_manage_ads',
      'instagram_basic',
      'instagram_manage_insights'
    ].join(','),
    response_type: 'code',
    ...(state && { state })
  });

  return `https://www.facebook.com/${this.apiVersion}/dialog/oauth?${params.toString()}`;
}
```

#### Token Exchange
```typescript
// Exchange code for long-lived token
async exchangeCodeForToken(code: string): Promise<AuthResult> {
  // 1. Get short-lived token
  const shortLivedToken = await this.getShortLivedToken(code);
  
  // 2. Exchange for long-lived token (60 days)
  const longLivedToken = await this.exchangeForLongLivedToken(shortLivedToken);
  
  return {
    success: true,
    accessToken: longLivedToken.access_token,
    expiresIn: longLivedToken.expires_in
  };
}
```

### 2. **Account Management**

#### Get User Info
```typescript
async getAccountInfo(accessToken: string): Promise<AccountInfo> {
  this.api.setAccessToken(accessToken);
  
  const user = new User('me');
  const userData = await user.read(['id', 'name', 'picture']);
  
  return {
    id: userData.id,
    name: userData.name,
    profilePictureUrl: userData.picture?.data?.url,
    accountType: 'personal'
  };
}
```

#### Get Ad Accounts
```typescript
async getAccounts(accessToken: string): Promise<AccountInfo[]> {
  this.api.setAccessToken(accessToken);
  
  const user = new User('me');
  const adAccounts = await user.getAdAccounts([
    'id',
    'name',
    'account_status',
    'currency',
    'timezone_name'
  ]);
  
  return adAccounts.map(account => ({
    id: account.id,
    name: account.name,
    accountType: 'business',
    metadata: {
      account_status: account.account_status,
      currency: account.currency,
      timezone: account.timezone_name
    }
  }));
}
```

### 3. **Campaign Management**

#### Create Campaign
```typescript
async createCampaign(accessToken: string, data: CampaignCreationData): Promise<Campaign> {
  this.api.setAccessToken(accessToken);
  
  const adAccount = new AdAccount(data.accountId);
  
  const campaign = await adAccount.createCampaign([], {
    name: data.name,
    objective: this.mapObjectiveToMeta(data.objective),
    status: Campaign.Status.paused,
    special_ad_categories: [],
    ...(data.budgetType === 'daily' && {
      daily_budget: Math.round(data.budget * 100) // Convert to cents
    }),
    ...(data.budgetType === 'lifetime' && {
      lifetime_budget: Math.round(data.budget * 100),
      start_time: data.startDate,
      stop_time: data.endDate
    })
  });
  
  return campaign;
}
```

#### Update Campaign
```typescript
async updateCampaign(accessToken: string, campaignId: string, data: Partial<CampaignCreationData>): Promise<Campaign> {
  this.api.setAccessToken(accessToken);
  
  const campaign = new Campaign(campaignId);
  
  await campaign.update([], {
    name: data.name,
    daily_budget: data.budget ? Math.round(data.budget * 100) : undefined
  });
  
  return campaign;
}
```

#### Pause/Resume Campaign
```typescript
// Pause
const campaign = new Campaign(campaignId);
await campaign.update([], {
  status: Campaign.Status.paused
});

// Resume
await campaign.update([], {
  status: Campaign.Status.active
});
```

### 4. **Ad Management**

#### Create Ad (Multi-Step Process)

Creating an ad requires 3 steps:

```typescript
async createAd(accessToken: string, data: AdCreationData): Promise<Ad> {
  this.api.setAccessToken(accessToken);
  
  const adAccount = new AdAccount(data.accountId);
  
  // STEP 1: Create Ad Creative
  const creative = await adAccount.createAdCreative([], {
    name: `${data.name} - Creative`,
    object_story_spec: {
      page_id: data.pageId, // Facebook Page ID
      link_data: {
        message: data.primaryText,
        link: data.linkUrl,
        name: data.headline,
        call_to_action: {
          type: data.callToAction || 'LEARN_MORE',
          value: { link: data.linkUrl }
        },
        image_hash: data.creatives?.[0]?.imageHash
      }
    }
  });
  
  // STEP 2: Create Ad Set
  const adSet = await adAccount.createAdSet([], {
    name: `${data.name} - AdSet`,
    campaign_id: data.campaignId,
    daily_budget: data.budget ? Math.round(data.budget * 100) : undefined,
    targeting: data.targeting || {
      geo_locations: { countries: ['US'] },
      age_min: 18,
      age_max: 65
    },
    status: AdSet.Status.paused,
    start_time: data.startDate,
    end_time: data.endDate
  });
  
  // STEP 3: Create Ad
  const ad = await adAccount.createAd([], {
    name: data.name,
    adset_id: adSet.id,
    creative: { creative_id: creative.id },
    status: Ad.Status.paused
  });
  
  return ad;
}
```

### 5. **Performance Analytics**

#### Get Ad Insights
```typescript
async getAdPerformance(
  accessToken: string,
  adId: string,
  startDate: Date,
  endDate: Date
): Promise<PerformanceData[]> {
  this.api.setAccessToken(accessToken);
  
  const ad = new Ad(adId);
  const insights = await ad.getInsights([
    AdsInsights.Fields.impressions,
    AdsInsights.Fields.reach,
    AdsInsights.Fields.frequency,
    AdsInsights.Fields.clicks,
    AdsInsights.Fields.ctr,
    AdsInsights.Fields.spend,
    AdsInsights.Fields.cpc,
    AdsInsights.Fields.cpm,
    AdsInsights.Fields.actions,
    AdsInsights.Fields.cost_per_action_type
  ], {
    time_range: {
      since: startDate.toISOString().split('T')[0],
      until: endDate.toISOString().split('T')[0]
    },
    time_increment: 1 // Daily breakdown
  });
  
  // Transform insights to our format
  return this.transformInsights(insights);
}
```

#### Available Metrics

The SDK provides access to all Meta metrics:

| Metric | SDK Field | Description |
|--------|-----------|-------------|
| Impressions | `AdsInsights.Fields.impressions` | Number of times ad was shown |
| Reach | `AdsInsights.Fields.reach` | Number of unique people who saw ad |
| Frequency | `AdsInsights.Fields.frequency` | Average times each person saw ad |
| Clicks | `AdsInsights.Fields.clicks` | Number of clicks on ad |
| CTR | `AdsInsights.Fields.ctr` | Click-through rate |
| Spend | `AdsInsights.Fields.spend` | Amount spent |
| CPC | `AdsInsights.Fields.cpc` | Cost per click |
| CPM | `AdsInsights.Fields.cpm` | Cost per 1000 impressions |
| Conversions | `AdsInsights.Fields.actions` | Conversion events |
| ROAS | Custom calculation | Return on ad spend |

### 6. **Custom Audiences**

#### Create Custom Audience
```typescript
async createCustomAudience(
  accessToken: string,
  name: string,
  description: string
): Promise<string> {
  this.api.setAccessToken(accessToken);
  
  const adAccount = new AdAccount(accountId);
  const audience = await adAccount.createCustomAudience([], {
    name,
    description,
    subtype: CustomAudience.Subtype.custom
  });
  
  return audience.id;
}
```

#### Get Custom Audiences
```typescript
async getCustomAudiences(accessToken: string, accountId: string): Promise<CustomAudience[]> {
  this.api.setAccessToken(accessToken);
  
  const adAccount = new AdAccount(accountId);
  const audiences = await adAccount.getCustomAudiences([
    'id',
    'name',
    'description',
    'approximate_count'
  ]);
  
  return audiences;
}
```

---

## 🛡️ Error Handling

### SDK-Specific Errors

The SDK throws typed errors that are easier to handle:

```typescript
try {
  const campaign = await adAccount.createCampaign([], campaignData);
} catch (error) {
  if (error.code === 190) {
    // Invalid OAuth access token
    // Re-authenticate user
  } else if (error.code === 100) {
    // Invalid parameter
    // Show validation error
  } else if (error.code === 17) {
    // User request limit reached
    // Implement retry with backoff
  }
}
```

### Common Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 190 | Invalid OAuth token | Re-authenticate user |
| 100 | Invalid parameter | Validate input data |
| 17 | Rate limit exceeded | Implement exponential backoff |
| 200 | Permission denied | Check user permissions |
| 368 | Temporarily blocked | Wait and retry |
| 1 | Unknown error | Log and alert team |

---

## 🔄 API Version Management

### Current Version
```typescript
// Set in config
META_API_VERSION=v18.0
```

### Updating API Version

When Meta releases a new API version:

1. **Update Environment Variable**
   ```bash
   META_API_VERSION=v19.0
   ```

2. **Update SDK Package**
   ```bash
   npm update facebook-nodejs-business-sdk
   ```

3. **Test Changes**
   - SDK handles most changes automatically
   - Check changelog for breaking changes
   - Test critical flows

### Version Compatibility

The SDK maintains backward compatibility:
- Old API versions supported for 2 years
- SDK auto-handles deprecation warnings
- Gradual migration path provided

---

## 🚀 Performance Optimizations

### 1. Batch Requests

SDK supports batch operations:

```typescript
// Create multiple ads in one request
const batch = [];

for (const adData of adsToCreate) {
  batch.push(
    adAccount.createAd([], adData)
  );
}

// Execute batch (max 50 per batch)
const results = await Promise.all(batch);
```

### 2. Field Selection

Only request fields you need:

```typescript
// ❌ Bad - Gets all fields
const campaign = await campaign.read();

// ✅ Good - Gets only needed fields
const campaign = await campaign.read([
  'id',
  'name',
  'status'
]);
```

### 3. Pagination

Handle large result sets:

```typescript
const campaigns = await adAccount.getCampaigns(
  ['id', 'name'],
  {
    limit: 100 // Max 100 per page
  }
);

// SDK handles pagination automatically
```

---

## 🔐 Security Best Practices

### 1. Token Storage

```typescript
// ❌ Never store in code
const accessToken = 'EAABwzLix...';

// ✅ Store in database (encrypted)
const auth = await this.authService.getActiveAuth(accountId);
const accessToken = await this.decrypt(auth.accessToken);
```

### 2. Token Refresh

```typescript
// Auto-refresh before expiry
if (auth.expiresAt < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
  const refreshed = await this.refreshToken(auth.refreshToken);
  auth.accessToken = refreshed.accessToken;
  await this.authRepository.save(auth);
}
```

### 3. Scope Management

Only request needed permissions:

```typescript
// ❌ Too broad
scope: 'email,public_profile,ads_management,pages_manage_ads,...'

// ✅ Minimal required
scope: 'ads_management,ads_read,business_management'
```

---

## 🧪 Testing

### Mock SDK for Testing

```typescript
// test/mocks/meta-sdk.mock.ts
export const mockMetaSDK = {
  FacebookAdsApi: {
    init: jest.fn(),
    setAccessToken: jest.fn()
  },
  Campaign: jest.fn().mockImplementation(() => ({
    read: jest.fn().mockResolvedValue({
      id: 'campaign-123',
      name: 'Test Campaign'
    }),
    update: jest.fn().mockResolvedValue(true)
  })),
  // ... other mocks
};

// In test file
jest.mock('facebook-nodejs-business-sdk', () => mockMetaSDK);
```

---

## 📊 Monitoring & Logging

### SDK Event Logging

```typescript
// Log all API calls
this.api.setDebug(process.env.NODE_ENV === 'development');

// Custom logging
FacebookAdsApi.on('response', (response) => {
  this.logger.log({
    endpoint: response.endpoint,
    method: response.method,
    status: response.status,
    duration: response.duration
  });
});
```

---

## 🔄 Migration from Direct HTTP to SDK

### Before (Direct HTTP)
```typescript
// ❌ Manual HTTP calls
const response = await fetch(
  `https://graph.facebook.com/v18.0/${campaignId}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'PAUSED' })
  }
);

const data = await response.json();
```

### After (SDK)
```typescript
// ✅ SDK methods
this.api.setAccessToken(accessToken);

const campaign = new Campaign(campaignId);
await campaign.update([], {
  status: Campaign.Status.paused
});
```

---

## 🆘 Troubleshooting

### Common Issues

#### 1. **Token Expired**
```
Error: OAuth access token has expired
```
**Solution**: Implement auto-refresh or re-authenticate

#### 2. **Invalid Parameters**
```
Error: Invalid parameter for ad creative
```
**Solution**: Use SDK's validation methods

#### 3. **Rate Limiting**
```
Error: Application request limit reached
```
**Solution**: Implement exponential backoff

#### 4. **Permission Denied**
```
Error: User hasn't granted permission
```
**Solution**: Request correct OAuth scopes

---

## 📚 SDK Documentation Links

### Official Resources
- [Meta Business SDK Docs](https://developers.facebook.com/docs/business-sdk)
- [Node.js SDK GitHub](https://github.com/facebook/facebook-nodejs-business-sdk)
- [Marketing API Reference](https://developers.facebook.com/docs/marketing-apis)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)

### API References
- [Campaign API](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group)
- [Ad API](https://developers.facebook.com/docs/marketing-api/reference/adgroup)
- [Insights API](https://developers.facebook.com/docs/marketing-api/insights)
- [Targeting API](https://developers.facebook.com/docs/marketing-api/audiences/reference/basic-targeting)

---

## 🎯 Next Steps

### Immediate
1. ✅ SDK is integrated and working
2. ✅ Environment variables configured
3. ✅ Authentication flow implemented
4. ✅ Basic CRUD operations ready

### Future Enhancements
1. **Batch Operations** - Implement bulk ad creation
2. **Advanced Targeting** - Add lookalike audiences
3. **A/B Testing** - Campaign split testing
4. **Real-time Updates** - WebHooks for instant notifications
5. **Instagram Integration** - Cross-posting capabilities
6. **WhatsApp Business** - Message campaigns

---

## 💡 Key Takeaways

### ✅ **Why SDK is Better**

1. **No Manual API Changes** - SDK auto-updates
2. **Type Safety** - Full TypeScript support
3. **Error Handling** - Better error messages
4. **Rate Limiting** - Automatic handling
5. **Official Support** - Direct from Meta
6. **Future-Proof** - Backward compatible

### ⚠️ **What to Watch**

1. **SDK Version** - Keep updated
2. **API Version** - Plan migrations
3. **Token Expiry** - Implement refresh
4. **Rate Limits** - Monitor usage
5. **Permissions** - Request minimally

---

## 🔗 Related Files

- `/src/modules/social-ads/services/providers/meta.service.ts` - Main implementation
- `/src/modules/social-ads/interfaces/social-media-provider.interface.ts` - Provider interface
- `/.env.example` - Environment variables template
- `/SOCIAL_ADS_FRONTEND_INTEGRATION.md` - Frontend guide

---

**Last Updated**: With Meta SDK v18.0
**Maintained By**: Backend Team
**Questions**: Contact backend team or refer to Meta's documentation
