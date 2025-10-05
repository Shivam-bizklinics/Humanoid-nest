# Social Ads Module - Architecture Diagrams

## 📊 System Architecture

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React/Vue/Angular)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Workspaces  │  │ Social Ads   │  │  Campaigns   │  │  Analytics   │     │
│  │    List      │  │  Dashboard   │  │   Manager    │  │   Dashboard  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │                 │            │
│         └─────────────────┴──────────────────┴─────────────────┘            │
│                                    │                                        │
│                              REST API Calls                                 │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (NestJS)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────-┐    │
│  │                    SOCIAL ADS MODULE                                │    │
│  ├────────────────────────────────────────────────────────────────────-┤    │
│  │                                                                     │    │
│  │  CONTROLLERS                 SERVICES                PROVIDERS      │    │
│  │  ┌──────────────┐          ┌──────────────┐      ┌─────────────┐    │    │
│  │  │ Social Ads   │────────→ │ Social Media │ ───→ │ Meta Service│    │    │
│  │  │ Controller   │          │   Service    │      │  (SDK)      │    │    │
│  │  └──────────────┘          └──────────────┘      └─────────────┘    │    │
│  │  ┌──────────────┐          ┌──────────────┐      ┌─────────────┐    │    │
│  │  │  Campaign    │────────→ │  Campaign    │ ───→ │  LinkedIn   │    │    │
│  │  │ Controller   │          │   Service    │      │  Service    │    │    │
│  │  └──────────────┘          └──────────────┘      └─────────────┘    │    │
│  │  ┌──────────────┐          ┌──────────────┐      ┌─────────────┐    │    │
│  │  │   Agency     │────────→ │   Agency     │ ───→ │  Twitter    │    │    │
│  │  │ Controller   │          │   Service    │      │  Service    │    │    │
│  │  └──────────────┘          └──────────────┘      └─────────────┘    │    │
│  │  ┌──────────────┐          ┌──────────────┐      ┌─────────────┐    │    │
│  │  │    Auth      │────────→ │  Auth        │ ───→ │  Snapchat   │    │    │
│  │  │ Controller   │          │   Service    │      │  Service    │    │    │
│  │  └──────────────┘          └──────────────┘      └─────────────┘    │    │
│  │                                   │                                 │    │
│  │                                   ▼                                 │    │
│  │                            PROVIDER FACTORY                         │    │
│  │                          (Selects Provider)                         │    │
│  │                                                                     │    │
│  └─────────────────────────────────┼───────────────────────────────────     │
│                                    │                                        │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────-┐    │
│  │                    DATABASE (PostgreSQL)                            │    │
│  ├────────────────────────────────────────────────────────────────────-┤    │
│  │  - Users                    - SocialMediaAccounts                   │    │
│  │  - Workspaces               - SocialMediaAuth                       │    │
│  │  - Permissions              - AgencyAccounts (NEW)                  │    │
│  │  - UserWorkspacePermissions - AgencyAuth (NEW)                      │    │
│  │  - SocialAds                - SocialAdCampaigns                     │    │
│  │  - SocialAdCreatives        - SocialAdTargeting                     │    │
│  │  - SocialAdPerformance      - SocialMediaPlatforms                  │    │
│  └────────────────────────────────────────────────────────────────────-┘    │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL PLATFORMS (Meta, LinkedIn, etc.)                │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐    │
│  │   Meta Graph API     │  │   LinkedIn Ads API   │  │  Twitter Ads    │    │
│  │  (via Business SDK)  │  │                      │  │      API        │    │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### **Diagram 1: Direct Mode Flow**

```
User (Frontend)
    │
    │ 1. Navigate to Social Ads
    ▼
┌─────────────────────────────────────┐
│ GET /workspaces/:id/social-ads/     │
│         accounts                     │
└─────────────────────────────────────┘
    │
    │ 2. Click "Connect Account"
    ▼
┌─────────────────────────────────────┐
│ POST /social-media-auth/initiate/   │
│       :accountId                     │
│ Returns: authUrl                     │
└─────────────────────────────────────┘
    │
    │ 3. Redirect to Meta OAuth
    ▼
┌─────────────────────────────────────┐
│  Meta OAuth (facebook.com)          │
│  User authorizes app                │
└─────────────────────────────────────┘
    │
    │ 4. Callback with code
    ▼
┌─────────────────────────────────────┐
│ POST /social-media-auth/complete/   │
│       :accountId                     │
│ Body: { code, state }               │
└─────────────────────────────────────┘
    │
    │ 5. Token stored
    ▼
┌─────────────────────────────────────┐
│ Backend stores:                      │
│ - Access Token (short-lived)         │
│ - Refresh Token                      │
│ - Account linked to workspace        │
└─────────────────────────────────────┘
    │
    │ 6. Create ad
    ▼
┌─────────────────────────────────────┐
│ POST /workspaces/:id/social-ads/ads │
│ Uses: Account's own token            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Meta SDK creates ad                  │
│ Ad stored in database                │
└─────────────────────────────────────┘
```

---

### **Diagram 2: Agency Mode Flow**

```
Agency Owner (Frontend)
    │
    │ PHASE 1: Set Up Agency (One-time)
    ▼
┌─────────────────────────────────────┐
│ POST /agency-accounts                │
│ Body: { businessManagerId, ... }     │
└─────────────────────────────────────┘
    │
    │ Agency OAuth
    ▼
┌─────────────────────────────────────┐
│ POST /agency-accounts/:id/auth/      │
│       complete                       │
│ Stores: Long-lived token (60 days)   │
└─────────────────────────────────────┘
    │
    │ PHASE 2: Client Connects Page
    ▼
┌─────────────────────────────────────┐
│ Workspace Owner connects page        │
│ (Same OAuth flow as Direct Mode)     │
│ Account created: agencyAccountId=null│
└─────────────────────────────────────┘
    │
    │ PHASE 3: Add to Business Manager (Manual)
    ▼
┌─────────────────────────────────────┐
│ business.facebook.com                │
│ Agency adds client's page            │
│ Client accepts request               │
└─────────────────────────────────────┘
    │
    │ PHASE 4: Verify & Link (Humanoid)
    ▼
┌─────────────────────────────────────┐
│ GET /agency-accounts/:id/            │
│      accessible-pages                │
│ Check: Is client page in list?       │
└─────────────────────────────────────┘
    │
    │ If page found ✅
    ▼
┌─────────────────────────────────────┐
│ POST /agency-accounts/:agencyId/     │
│       link/:socialAccountId          │
│                                      │
│ Backend verifies via API:            │
│ - hasPageAccess(token, pageId)       │
│ - Returns true/false                 │
└─────────────────────────────────────┘
    │
    │ Link successful
    ▼
┌─────────────────────────────────────┐
│ Account updated:                     │
│ agencyAccountId = "agency-123"       │
└─────────────────────────────────────┘
    │
    │ PHASE 5: Create Ads (Automatic)
    ▼
┌─────────────────────────────────────┐
│ POST /workspaces/:id/social-ads/ads │
│ Body: { accountId: "social-acc" }    │
└─────────────────────────────────────┘
    │
    │ Backend checks agencyAccountId
    ▼
┌─────────────────────────────────────┐
│ if (account.agencyAccountId) {       │
│   token = getAgencyToken();          │
│ } else {                             │
│   token = getAccountToken();         │
│ }                                    │
└─────────────────────────────────────┘
    │
    │ Uses agency token
    ▼
┌─────────────────────────────────────┐
│ Meta SDK creates ad                  │
│ Ad stored with workspaceId           │
└─────────────────────────────────────┘
```

---

## 🗄️ Database Schema Diagram

```
┌──────────────────────┐
│      Users           │
│──────────────────────│
│ id (PK)              │
│ email                │
│ name                 │
│ password             │-|
└──────────────────────┘ |
         │ 1             |
         │ owns          |
         │ *             |
┌──────────────────────┐ |      ┌──────────────────────┐
│   AgencyAccounts     │ |      │    Workspaces        │
│──────────────────────│ |      │──────────────────────│
│ id (PK)              │ |      │ id (PK)              │
│ userId (FK) ─────────┘-|      │ name                 │
│ platformId (FK)      │        │ description          │
│ externalAccountId    │        └──────────────────────┘
│ businessManagerId    │                │ 1
│ accountName          │                │ contains
│ accountType          │                │ *
│ status               │<-|      ┌──────────────────────┐
└──────────────────────┘  |      │ SocialMediaAccounts  │
         │ 1              |      │──────────────────────│
         │ has            |      │ id (PK)              │
         │ *              |      │ workspaceId (FK) ────┘
┌──────────────────────┐  |      │ platformId (FK)      │
│    AgencyAuth        │  |      │ agencyAccountId (FK) │◄─┐
│──────────────────────│  |      │ externalAccountId    │  │
│ id (PK)              │  |      │ accountName          │  │
│ agencyAccountId (FK) ┼──|      │ accountType          │  │
│ accessToken          │  |      │ status               │  │
│ refreshToken         │  │      └──────────────────────┘  │
│ expiresAt            │  │             │ 1                │
│ status               │  │             │ has              │
└──────────────────────┘  │             │ *                │
                          │    ┌──────────────────────┐    │
                          │    │ SocialMediaAuth      │    │
                          │    │──────────────────────│    │
                          │    │ id (PK)              │    │
                          │    │ accountId (FK) ──────┘----│
                          │    │ accessToken          │    │
                          │    │ refreshToken         │    │
                          │    │ expiresAt            │    │
                          │    │ status               │    │
                          │    └──────────────────────┘    │
                          │             │                  │
                          │             │ 1                │
                          │             │ used for         │
                          │             │ *                │
                          │    ┌──────────────────────┐    │
                          │    │    SocialAds         │    │
                          │    │──────────────────────│    │
                               ┤ workspaceId (FK)     │    │
manages *                      │ accountId (FK)    ───|--──┘  
                               │ campaignId (FK)      │
                               │ externalAdId         │
                               │ name                 │
                               │ status               │
                               │ objective            │
                               │ budget               │
                               └──────────────────────┘
                                        │ 1
                                        │ has
                                        │ *
                               ┌──────────────────────┐
                               │  SocialAdCreatives   │
                               │──────────────────────│
                               │ id (PK)              │
                               │ adId (FK)            │
                               │ type                 │
                               │ mediaUrl             │
                               │ headline             │
                               └──────────────────────┘
```

---

## 🔄 Token Selection Flow

```
                    Create Ad Request
                            │
                            ▼
            ┌───────────────────────────────┐
            │  Get Social Media Account     │
            │  by accountId                 │
            └───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │  Check: agencyAccountId set?  │
            └───────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
               YES                     NO
                │                       │
                ▼                       ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │ Get Agency Token    │   │ Get Account Token   │
    │                     │   │                     │
    │ Source:             │   │ Source:             │
    │ AgencyAuth table    │   │ SocialMediaAuth     │
    │                     │   │                     │
    │ Type:               │   │ Type:               │
    │ Long-lived (60d)    │   │ Short-lived (hours) │
    │                     │   │                     │
    │ Scope:              │   │ Scope:              │
    │ Business Manager    │   │ Account-level       │
    └─────────────────────┘   └─────────────────────┘
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │    Use Token for API Call     │
            │    (Meta SDK automatically    │
            │     handles the call)         │
            └───────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Ad Created on Meta          │
            │   Stored in Database          │
            │   workspaceId preserved       │
            └───────────────────────────────┘
```

---

## 🏢 Agency Account Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER (Agency Owner)                               │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
    ┌───────────────────────────┐   ┌──────────────────────┐
    │   Personal Workspaces     │   │  Agency Account      │
    │   (Own businesses)        │   │  (Business Manager)  │
    └───────────────────────────┘   └──────────────────────┘
                │                              │
        ┌───────┴───────┐                     │
        │               │                     │
        ▼               ▼                     │
┌──────────────┐ ┌──────────────┐            │
│ Workspace A  │ │ Workspace B  │            │
│ (Own Biz 1)  │ │ (Own Biz 2)  │            │
└──────────────┘ └──────────────┘            │
        │               │                     │
        ▼               ▼                     │
  [Direct Mode]   [Direct Mode]              │
   Use own token   Use own token             │
                                              │
                    ┌─────────────────────────┘
                    │ manages
        ┌───────────┼────────────┐
        │           │            │
        ▼           ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Workspace C  │ │ Workspace D  │ │ Workspace E  │
│ (Client 1)   │ │ (Client 2)   │ │ (Client 3)   │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │            │
        ▼               ▼            ▼
  [Agency Mode]   [Agency Mode]  [Agency Mode]
   Use agency      Use agency     Use agency
     token           token          token
```

---

## 🔐 Permission & Access Control Flow

```
                    User Request
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Authentication Guard         │
        │   (Check JWT token)            │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Workspace Permission Guard   │
        │   (Check workspace.* perms)    │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Extract workspaceId          │
        │   from URL params              │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Query:                       │
        │   SELECT * FROM                │
        │   social_media_accounts        │
        │   WHERE workspaceId = ?        │
        │   AND id = ?                   │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Account belongs to           │
        │   this workspace?              │
        └────────────────────────────────┘
                         │
                ┌────────┴────────┐
               YES               NO
                │                 │
                ▼                 ▼
        ┌──────────────┐   ┌──────────────┐
        │   Allowed    │   │  403 Error   │
        │   Proceed    │   │  Forbidden   │
        └──────────────┘   └──────────────┘
```

---

## 📱 UI Component Hierarchy

```
App
│
├── AuthProvider
│   └── UserContext (user, token, permissions)
│
├── WorkspaceProvider
│   └── WorkspaceContext (currentWorkspace, workspaces)
│
└── Router
    │
    ├── /workspaces
    │   └── WorkspacesListPage
    │
    ├── /workspaces/:workspaceId
    │   ├── WorkspaceLayout
    │   │   ├── WorkspaceSidebar
    │   │   └── WorkspaceContent
    │   │
    │   └── /social-ads
    │       │
    │       ├── /accounts
    │       │   ├── AccountsListPage
    │       │   │   ├── AccountCard[]
    │       │   │   │   ├── AgencyStatusBadge
    │       │   │   │   └── LinkToAgencyButton
    │       │   │   └── ConnectAccountButton
    │       │   │
    │       │   └── ConnectAccountFlow
    │       │       ├── PlatformSelector
    │       │       ├── OAuthRedirect
    │       │       └── OAuthCallback
    │       │
    │       ├── /campaigns
    │       │   ├── CampaignsListPage
    │       │   │   ├── CampaignCard[]
    │       │   │   └── CreateCampaignButton
    │       │   │
    │       │   ├── CreateCampaignPage
    │       │   │   ├── CampaignForm
    │       │   │   ├── AccountSelector (shows agency status)
    │       │   │   ├── BudgetInput
    │       │   │   └── TargetingBuilder
    │       │   │
    │       │   └── CampaignDetailsPage
    │       │       ├── CampaignHeader
    │       │       ├── PerformanceMetrics
    │       │       ├── CampaignAds[]
    │       │       └── ActionButtons
    │       │
    │       ├── /ads
    │       │   ├── AdsListPage
    │       │   │   ├── AdCard[]
    │       │   │   └── CreateAdButton
    │       │   │
    │       │   ├── CreateAdPage
    │       │   │   ├── AdForm
    │       │   │   ├── AccountSelector (shows agency)
    │       │   │   ├── CreativeUploader
    │       │   │   ├── AdPreview
    │       │   │   └── TargetingBuilder
    │       │   │
    │       │   └── AdDetailsPage
    │       │       ├── AdPreview
    │       │       ├── PerformanceCharts
    │       │       ├── CreativeGallery
    │       │       └── ActionButtons
    │       │
    │       └── /analytics
    │           └── AnalyticsDashboard
    │               ├── DateRangeSelector
    │               ├── MetricsCards
    │               ├── PerformanceCharts
    │               └── ExportButton
    │
    └── /settings
        └── /agency-accounts (NEW)
            ├── AgencyAccountsListPage
            │   ├── AgencyCard[]
            │   │   ├── ManagedAccountsList
            │   │   └── AccessiblePagesList
            │   └── ConnectAgencyButton
            │
            └── ConnectAgencyFlow
                ├── BusinessManagerIdInput
                ├── OAuthRedirect
                └── OAuthCallback
```

---

## 🔄 State Management Recommendation

```typescript
// Using Context + Hooks

// 1. Social Ads Context
interface SocialAdsContext {
  // Current workspace
  workspaceId: string;
  
  // Accounts
  accounts: SocialMediaAccount[];
  loadingAccounts: boolean;
  
  // Agency accounts (global - user-level)
  agencyAccounts: AgencyAccount[];
  
  // Campaigns
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  
  // Ads
  ads: Ad[];
  selectedAd: Ad | null;
  
  // Actions
  refreshAccounts: () => Promise<void>;
  linkToAgency: (accountId: string, agencyId: string) => Promise<void>;
  createAd: (adData: CreateAdDto) => Promise<Ad>;
}

// 2. Custom Hooks
function useSocialAccounts(workspaceId: string) {
  return useQuery(['accounts', workspaceId], () =>
    api.get(`/workspaces/${workspaceId}/social-ads/accounts`)
  );
}

function useAgencyAccounts() {
  return useQuery(['agency-accounts'], () =>
    api.get('/agency-accounts')
  );
}

function useLinkToAgency() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ agencyId, accountId }) =>
      api.post(`/agency-accounts/${agencyId}/link/${accountId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      queryClient.invalidateQueries(['agency-accounts']);
    }
  });
}
```

---

## 🎯 Complete Integration Summary

### **✅ What's Been Built:**

1. **Workspace-scoped architecture** - Full multi-tenancy
2. **Direct & Agency modes** - Flexible operation
3. **Meta SDK integration** - Future-proof API calls
4. **Verification system** - Checks Business Manager access
5. **Automatic token selection** - Transparent to users
6. **Permission-based access** - Secure RBAC
7. **Complete API** - All CRUD operations
8. **Performance tracking** - Full analytics

### **📚 Documentation Provided:**

1. `SOCIAL_ADS_FRONTEND_GUIDE_V2.md` - Complete frontend guide
2. `SOCIAL_ADS_ARCHITECTURE_DIAGRAMS.md` - This file
3. `AGENCY_COMPLETE_SOLUTION.md` - Agency implementation
4. `AGENCY_VERIFICATION_FLOW.md` - Verification process
5. `META_SDK_INTEGRATION.md` - SDK technical guide
6. `META_SDK_SETUP.md` - Setup instructions

---

**Architecture is complete and production-ready!** 🚀
