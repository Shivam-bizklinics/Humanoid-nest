# Social Ads Module - Frontend Integration Guide v2.0

**Last Updated**: With Agency Account Support & Meta SDK Integration

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Operation Modes](#operation-modes)
4. [Complete User Flows](#complete-user-flows)
5. [API Reference](#api-reference)
6. [TypeScript Interfaces](#typescript-interfaces)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## 🏗️ Architecture Overview

### **System Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HUMANOID PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  USER                                                                   │
│   │                                                                     │
│   ├─── Workspace A (Client 1)                                           │
│   │     ├─ Social Media Accounts                                        │
│   │     │   ├─ Facebook Page A1 [Direct Mode]                           │
│   │     │   └─ Instagram A2 [Agency Mode]   ──┐                         │
│   │     ├─ Campaigns                          │                         │
│   │     └─ Ads                                │                         │
│   │                                           │                         │
│   ├─── Workspace B (Client 2)                 │                         │
│   │     ├─ Social Media Accounts              │                         │
│   │     │   └─ Facebook Page B1 [Agency Mode]─┤                         │
│   │     ├─ Campaigns                          │                         │
│   │     └─ Ads                                │                         │
│   │                                           │                         │
│   └─── Agency Account (Optional)              │                         │
│         ├─ Meta Business Manager              │                         │
│         ├─ Long-lived Token (60 days)         │                         │
│         └─ Manages ───────────────────────────┘                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                       META/FACEBOOK PLATFORM                            │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │  Business Manager (bm-123)                                       │  │
│   │   ├─ Page A1 (if claimed)                                        │  │
│   │   ├─ Instagram A2 (claimed)                                      │  │
│   │   └─ Facebook Page B1 (claimed)                                  │  │
│   │                                                                  │  │
│   │  Individual Pages (Direct Access)                                │  │
│   │   └─ Facebook Page A1 (own token)                                │  │
│   └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### **Data Flow Diagram**

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │ ───→ │   Backend    │ ───→ │  Meta SDK    │
│              │      │              │      │              │
│ React/Vue/   │ ←─── │ NestJS API   │ ←─── │ Graph API    │
│ Angular      │      │              │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                      │
       │                     │                      │
       ↓                     ↓                      ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ User Actions │      │  Token Mgmt  │      │   Facebook   │
│ - Create Ad  │      │  - Agency    │      │  - Pages     │
│ - Link to    │      │  - Direct    │      │  - Ads       │
│   Agency     │      │  - Auto Pick │      │  - Analytics │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## ✅ Prerequisites & Setup

### **Required for All Users:**
1. ✅ Humanoid account with authentication token
2. ✅ Workspace created with proper permissions
3. ✅ Workspace permissions: `workspace.view`, `workspace.create`, `workspace.update`

### **For Direct Mode (Default):**
4. ✅ Facebook/Instagram account to connect

### **For Agency Mode (Optional):**
5. ✅ Meta Business Manager account
6. ✅ Client pages added to Business Manager
7. ✅ Agency account connected in Humanoid

---

## 🔀 Operation Modes

### **Mode 1: Direct Account Management**

**Who:** Small businesses, individual marketers
**Setup:** Simple
**Token:** Account's own (short-lived)

```typescript
Workspace → Connect Facebook Page → OAuth → Create Ads
(No agency needed)
```

### **Mode 2: Agency Management**

**Who:** Agencies, enterprises, power users
**Setup:** Advanced
**Token:** Agency's (long-lived, 60 days)

```typescript
User → Create Agency → Add Pages to Business Manager →
Link in Humanoid → Create Ads for All Clients
(Optional, more powerful)
```

---

## 📱 Complete User Flows

### **Flow 1: Direct Mode - Connect Account & Create Ad**

#### **Pages Required:**
- Social Ads → Accounts
- Social Ads → Create Ad

#### **Step-by-Step:**

```typescript
// STEP 1: Get supported platforms
GET /social-ads/platforms

Response:
{
  "success": true,
  "data": [
    { "id": "p1", "name": "Facebook", "type": "meta", "status": "active" }
  ]
}

// STEP 2: Check existing accounts
GET /workspaces/:workspaceId/social-ads/accounts

// STEP 3: Connect Facebook Page (initiate OAuth)
POST /social-media-auth/initiate/:accountId
// Returns authUrl → Redirect user

// STEP 4: Handle OAuth callback
POST /social-media-auth/complete/:accountId
{
  "code": "oauth-code",
  "state": "state-string"
}

// STEP 5: Sync account data
POST /workspaces/:workspaceId/social-ads/accounts/:accountId/sync

// STEP 6: Create ad
POST /workspaces/:workspaceId/social-ads/ads
{
  "accountId": "account-456",
  "name": "Summer Sale",
  "objective": "sales",
  "adType": "image",
  "headline": "50% Off!",
  "primaryText": "Limited time offer...",
  "callToAction": "SHOP_NOW",
  "linkUrl": "https://example.com",
  "budget": 50,
  "creatives": [{
    "type": "image",
    "mediaUrl": "https://cdn.example.com/image.jpg"
  }]
}
```

---

### **Flow 2: Agency Mode - Setup & Link Accounts**

#### **Pages Required:**
- Settings → Agency Accounts
- Social Ads → Accounts (with agency options)

#### **Step-by-Step:**

```typescript
// ═══════════════════════════════════════════════
// PHASE 1: Set Up Agency Account (One-time)
// ═══════════════════════════════════════════════

// STEP 1: Create agency account
POST /agency-accounts
{
  "platformType": "meta",
  "externalAccountId": "bm-123456",
  "accountName": "My Marketing Agency",
  "businessManagerId": "bm-123456",
  "accountType": "business_manager"
}

// STEP 2: Initiate agency OAuth
POST /agency-accounts/:agencyAccountId/auth/initiate
// Returns authUrl → Redirect to Meta

// STEP 3: Complete agency OAuth
POST /agency-accounts/:agencyAccountId/auth/complete
{
  "code": "oauth-code",
  "state": "state-string"
}

// ═══════════════════════════════════════════════
// PHASE 2: Client Connects Their Page
// ═══════════════════════════════════════════════

// STEP 4: Client connects their Facebook Page
// (Same as Direct Mode - OAuth required)
POST /workspaces/:workspaceId/social-ads/accounts
// Client completes OAuth

// ═══════════════════════════════════════════════
// PHASE 3: Agency Claims Page (Manual)
// ═══════════════════════════════════════════════

// STEP 5: Agency owner goes to business.facebook.com
// - Business Settings → Pages → Add
// - Request access to client's page
// - Client accepts request

// ═══════════════════════════════════════════════
// PHASE 4: Verification & Linking (Humanoid)
// ═══════════════════════════════════════════════

// STEP 6: Check accessible pages (optional - for UI)
GET /agency-accounts/:agencyAccountId/accessible-pages

Response:
{
  "success": true,
  "data": [
    { "id": "page-111", "name": "Client A Page" },
    { "id": "page-222", "name": "Client B Page" }
  ]
}

// STEP 7: Link account to agency (with automatic verification)
POST /agency-accounts/:agencyAccountId/link/:socialMediaAccountId

// Backend automatically verifies page is in Business Manager
// Success if page found, error if not

Response (Success):
{
  "success": true,
  "data": {
    "id": "social-acc-abc",
    "agencyAccountId": "agency-123"  // ✅ Linked
  }
}

Response (Failure - Page not in Business Manager):
{
  "success": false,
  "statusCode": 409,
  "message": "Agency does not have access to this page in Meta Business Manager. Page not found. Agency has access to 2 pages. Please add this page to your Business Manager first."
}

// STEP 8: Get managed accounts
GET /agency-accounts/:agencyAccountId/managed-accounts

// ═══════════════════════════════════════════════
// PHASE 5: Create Ads (Automatic Token Selection)
// ═══════════════════════════════════════════════

// STEP 9: Create ad (same API as direct mode!)
POST /workspaces/:workspaceId/social-ads/ads
{
  "accountId": "social-acc-abc",  // Agency-managed account
  "name": "Client's Ad",
  ...
}

// Backend automatically:
// - Detects agencyAccountId is set
// - Uses agency token (not client token)
// - Creates ad with elevated permissions
```

---

### **Flow 3: Create Campaign & Ads**

```typescript
// STEP 1: Get connected accounts
GET /workspaces/:workspaceId/social-ads/accounts

Response:
{
  "data": [
    {
      "id": "acc-1",
      "accountName": "My Facebook Page",
      "platform": { "type": "meta" },
      "agencyAccountId": "agency-123",  // Shows if agency-managed
      "agencyAccount": {  // Included if linked
        "accountName": "My Marketing Agency"
      }
    }
  ]
}

// STEP 2: Create campaign
POST /workspaces/:workspaceId/social-ad-campaigns
{
  "accountId": "acc-1",
  "name": "Summer Sale 2024",
  "objective": "sales",
  "budgetType": "daily",
  "budget": 100,
  "startDate": "2024-06-01",
  "endDate": "2024-06-30"
}

// STEP 3: Create ad in campaign
POST /workspaces/:workspaceId/social-ads/ads
{
  "accountId": "acc-1",
  "campaignId": "campaign-789",
  "name": "Summer Sale Ad 1",
  "objective": "sales",
  "adType": "image",
  "headline": "50% Off Everything!",
  "primaryText": "Don't miss our biggest sale of the year...",
  "callToAction": "SHOP_NOW",
  "linkUrl": "https://example.com/summer-sale",
  "budget": 50,
  "creatives": [{
    "type": "image",
    "mediaUrl": "https://cdn.example.com/summer-dress.jpg",
    "altText": "Summer dress on sale"
  }],
  "targeting": {
    "locations": ["US"],
    "ageRange": { "min": 25, "max": 45 },
    "gender": "female",
    "interests": ["fashion", "shopping"]
  }
}

// STEP 4: Get campaign stats
GET /workspaces/:workspaceId/social-ad-campaigns/:campaignId/stats

// STEP 5: Get performance
GET /workspaces/:workspaceId/social-ads/ads/:adId/performance?startDate=2024-06-01&endDate=2024-06-15
```

---

## 📚 Complete API Reference

### **Platform Management**

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | `/social-ads/platforms` | ✅ | - | Get all platforms |
| GET | `/social-ads/platforms/:type` | ✅ | - | Get platform details |
| GET | `/social-ads/platforms/:type/features` | ✅ | - | Get platform features |

### **Account Management**

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| GET | `/workspaces/:workspaceId/social-ads/accounts` | ✅ | workspace.view | Get workspace accounts |
| GET | `/workspaces/:workspaceId/social-ads/accounts/:accountId` | ✅ | workspace.view | Get account details |
| POST | `/workspaces/:workspaceId/social-ads/accounts/:accountId/sync` | ✅ | workspace.update | Sync account data |

### **Authentication (Direct Mode)**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/social-media-auth/initiate/:accountId` | ✅ | Start OAuth flow |
| POST | `/social-media-auth/complete/:accountId` | ✅ | Complete OAuth flow |
| POST | `/social-media-auth/refresh/:authId` | ✅ | Refresh token |
| GET | `/social-media-auth/accounts/:accountId/is-authenticated` | ✅ | Check auth status |

### **Agency Accounts (Optional)**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/agency-accounts` | ✅ | Create agency account |
| GET | `/agency-accounts` | ✅ | Get user's agency accounts |
| GET | `/agency-accounts/:id` | ✅ | Get agency details |
| PUT | `/agency-accounts/:id` | ✅ | Update agency account |
| DELETE | `/agency-accounts/:id` | ✅ | Delete agency account |
| POST | `/agency-accounts/:id/auth/initiate` | ✅ | Start agency OAuth |
| POST | `/agency-accounts/:id/auth/complete` | ✅ | Complete agency OAuth |
| GET | `/agency-accounts/:id/is-authenticated` | ✅ | Check agency auth |
| POST | `/agency-accounts/:id/sync` | ✅ | Sync agency data |

### **Agency Verification & Linking**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/agency-accounts/:id/accessible-pages` | ✅ | Get pages in Business Manager |
| GET | `/agency-accounts/:id/accessible-ad-accounts` | ✅ | Get ad accounts in Business Manager |
| POST | `/agency-accounts/:agencyId/link/:accountId` | ✅ | Link account to agency (with verification) |
| DELETE | `/agency-accounts/:agencyId/unlink/:accountId` | ✅ | Unlink account from agency |
| GET | `/agency-accounts/:id/managed-accounts` | ✅ | Get accounts managed by agency |
| GET | `/agency-accounts/social-account/:id/agency` | ✅ | Get agency managing account |

### **Campaign Management**

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| POST | `/workspaces/:workspaceId/social-ad-campaigns` | ✅ | workspace.create | Create campaign |
| GET | `/workspaces/:workspaceId/social-ad-campaigns` | ✅ | workspace.view | Get campaigns |
| GET | `/workspaces/:workspaceId/social-ad-campaigns/:campaignId` | ✅ | workspace.view | Get campaign details |
| PUT | `/workspaces/:workspaceId/social-ad-campaigns/:campaignId` | ✅ | workspace.update | Update campaign |
| DELETE | `/workspaces/:workspaceId/social-ad-campaigns/:campaignId` | ✅ | workspace.delete | Delete campaign |
| POST | `/workspaces/:workspaceId/social-ad-campaigns/:campaignId/pause` | ✅ | workspace.update | Pause campaign |
| POST | `/workspaces/:workspaceId/social-ad-campaigns/:campaignId/resume` | ✅ | workspace.update | Resume campaign |
| GET | `/workspaces/:workspaceId/social-ad-campaigns/:campaignId/stats` | ✅ | workspace.view | Get campaign stats |
| GET | `/workspaces/:workspaceId/social-ad-campaigns/:campaignId/performance` | ✅ | workspace.view | Get performance data |
| GET | `/workspaces/:workspaceId/social-ad-campaigns/:campaignId/ads` | ✅ | workspace.view | Get campaign ads |

### **Ad Management**

| Method | Endpoint | Auth | Permission | Description |
|--------|----------|------|------------|-------------|
| POST | `/workspaces/:workspaceId/social-ads/ads` | ✅ | workspace.create | Create ad |
| GET | `/workspaces/:workspaceId/social-ads/ads` | ✅ | workspace.view | Get workspace ads |
| GET | `/workspaces/:workspaceId/social-ads/ads/:adId` | ✅ | workspace.view | Get ad details |
| PUT | `/workspaces/:workspaceId/social-ads/ads/:adId` | ✅ | workspace.update | Update ad |
| DELETE | `/workspaces/:workspaceId/social-ads/ads/:adId` | ✅ | workspace.delete | Delete ad |
| POST | `/workspaces/:workspaceId/social-ads/ads/:adId/pause` | ✅ | workspace.update | Pause ad |
| POST | `/workspaces/:workspaceId/social-ads/ads/:adId/resume` | ✅ | workspace.update | Resume ad |
| GET | `/workspaces/:workspaceId/social-ads/ads/:adId/performance` | ✅ | workspace.view | Get ad performance |
| POST | `/workspaces/:workspaceId/social-ads/ads/:adId/creatives` | ✅ | workspace.create | Add creative |
| GET | `/workspaces/:workspaceId/social-ads/ads/:adId/creatives` | ✅ | workspace.view | Get ad creatives |

---

## 🎨 Page Structure & Components

### **Recommended Navigation:**

```
📱 App
  └── 📁 Workspaces
      └── 📁 Workspace: "ABC Company"
          ├── 📊 Overview
          ├── 🎯 Social Ads ← NEW MODULE
          │   ├── 📱 Connected Accounts
          │   │   ├── List of connected social accounts
          │   │   ├── "Connect Account" button
          │   │   └── "Link to Agency" option (if agency exists)
          │   ├── 📢 Campaigns
          │   │   ├── Campaigns list/table
          │   │   ├── "Create Campaign" button
          │   │   └── Campaign details page
          │   ├── 🎨 Ads
          │   │   ├── Ads list/table
          │   │   ├── "Create Ad" button
          │   │   └── Ad details page
          │   └── 📊 Analytics
          │       ├── Performance dashboard
          │       ├── Charts and graphs
          │       └── Date range selector
          ├── ⚙️ Settings
          │   └── 🏢 Agency Accounts ← NEW SECTION (optional)
          │       ├── List of user's agency accounts
          │       ├── "Connect Agency Account" button
          │       ├── OAuth flow for agency
          │       └── View managed accounts per agency
          └── ... (other modules)
```

---

## 💻 TypeScript Interfaces

```typescript
// ═══════════════════════════════════════════════
// Core Interfaces
// ═══════════════════════════════════════════════

interface SocialMediaAccount {
  id: string;
  workspaceId: string;
  platformId: string;
  externalAccountId: string;
  accountName: string;
  displayName?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  accountType: 'personal' | 'business' | 'creator';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  agencyAccountId?: string;  // ← NEW: Links to agency if managed
  platform: Platform;
  agencyAccount?: AgencyAccount;  // ← Populated if linked
  lastSyncAt?: Date;
}

interface AgencyAccount {
  id: string;
  userId: string;
  platformId: string;
  externalAccountId: string;
  accountName: string;
  businessManagerId?: string;
  agencyId?: string;
  accountType: 'business_manager' | 'partner' | 'reseller';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  platform: Platform;
  managedAccounts?: SocialMediaAccount[];  // ← Accounts this agency manages
  isAuthenticated?: boolean;
}

interface Campaign {
  id: string;
  workspaceId: string;  // ← Workspace isolation
  accountId: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  objective: 'awareness' | 'traffic' | 'engagement' | 'leads' | 'sales';
  budgetType: 'daily' | 'lifetime';
  budget: number;
  startDate?: Date;
  endDate?: Date;
  account: SocialMediaAccount;
  ads?: Ad[];
}

interface Ad {
  id: string;
  workspaceId: string;  // ← Workspace isolation
  accountId: string;
  campaignId?: string;
  name: string;
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected';
  objective: string;
  adType: 'image' | 'video' | 'carousel' | 'story' | 'reels';
  headline?: string;
  primaryText?: string;
  callToAction?: string;
  linkUrl?: string;
  budget?: number;
  account: SocialMediaAccount;
  campaign?: Campaign;
  creatives?: Creative[];
}

// ═══════════════════════════════════════════════
// Helper Interfaces
// ═══════════════════════════════════════════════

interface AccessiblePage {
  id: string;
  name: string;
  access_token?: string;
}

interface VerificationResult {
  verified: boolean;
  message: string;
  accessiblePages?: AccessiblePage[];
}
```

---

## 🎨 UI Components Implementation

### **1. Agency Account Management Page**

```typescript
function AgencyAccountsPage() {
  const [agencies, setAgencies] = useState<AgencyAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    const res = await api.get('/agency-accounts');
    setAgencies(res.data);
    setLoading(false);
  };

  const handleConnect = async () => {
    // Show modal for Business Manager ID input
    const { businessManagerId, accountName } = await showAgencyModal();

    // Create agency account
    const res = await api.post('/agency-accounts', {
      platformType: 'meta',
      externalAccountId: businessManagerId,
      accountName,
      businessManagerId,
      accountType: 'business_manager'
    });

    const agencyId = res.data.id;

    // Initiate OAuth
    const authRes = await api.post(`/agency-accounts/${agencyId}/auth/initiate`);
    
    // Redirect to Meta
    window.location.href = authRes.data.authUrl;
  };

  return (
    <div className="agency-accounts-page">
      <header>
        <h1>Agency Accounts</h1>
        <p>Connect your Meta Business Manager to manage multiple client accounts</p>
        <button onClick={handleConnect}>+ Connect Agency Account</button>
      </header>

      {loading ? <Spinner /> : (
        <div className="agencies-grid">
          {agencies.map(agency => (
            <AgencyCard key={agency.id} agency={agency} onUpdate={fetchAgencies} />
          ))}
        </div>
      )}

      {agencies.length === 0 && !loading && (
        <EmptyState
          icon="🏢"
          title="No agency accounts connected"
          description="Connect your Meta Business Manager to manage ads for multiple clients with a single authentication"
          action={<button onClick={handleConnect}>Connect Agency Account</button>}
        />
      )}
    </div>
  );
}
```

### **2. Link Account to Agency Component**

```typescript
function LinkToAgencyDialog({ account, onSuccess, onClose }) {
  const [agencies, setAgencies] = useState<AgencyAccount[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [accessiblePages, setAccessiblePages] = useState<AccessiblePage[]>([]);
  const [verificationResult, setVerificationResult] = useState<{
    canLink: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    const res = await api.get('/agency-accounts');
    // Filter by same platform
    const compatible = res.data.filter(
      ag => ag.platform.type === account.platform.type
    );
    setAgencies(compatible);
  };

  const handleAgencySelect = async (agencyId: string) => {
    setSelectedAgency(agencyId);
    setVerifying(true);
    setVerificationResult(null);

    try {
      // Check accessible pages
      const res = await api.get(`/agency-accounts/${agencyId}/accessible-pages`);
      setAccessiblePages(res.data);

      // Check if current page is accessible
      const isAccessible = res.data.some(
        (page: AccessiblePage) => page.id === account.externalAccountId
      );

      if (isAccessible) {
        setVerificationResult({
          canLink: true,
          message: '✅ Agency has access to this page in Business Manager'
        });
      } else {
        setVerificationResult({
          canLink: false,
          message: `⚠️ Page not found in Business Manager. Agency has access to ${res.data.length} pages. Please add this page to your Business Manager first.`
        });
      }
    } catch (error) {
      setVerificationResult({
        canLink: false,
        message: `❌ Error checking access: ${error.message}`
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleLink = async () => {
    if (!selectedAgency) return;

    try {
      await api.post(`/agency-accounts/${selectedAgency}/link/${account.id}`);
      toast.success('Account linked to agency successfully!');
      onSuccess();
    } catch (error) {
      if (error.statusCode === 409) {
        toast.error(error.message);
        setVerificationResult({
          canLink: false,
          message: error.message
        });
      } else {
        toast.error('Failed to link account');
      }
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Link to Agency Account</DialogTitle>
      
      <DialogContent>
        <div className="account-info">
          <h4>Account to Link:</h4>
          <p><strong>{account.accountName}</strong></p>
          <p className="text-muted">Page ID: {account.externalAccountId}</p>
          <p className="text-muted">Workspace: {account.workspace?.name}</p>
        </div>

        <div className="agency-select">
          <label>Select Agency:</label>
          <select 
            value={selectedAgency || ''} 
            onChange={(e) => handleAgencySelect(e.target.value)}
          >
            <option value="">-- Select Agency --</option>
            {agencies.map(agency => (
              <option key={agency.id} value={agency.id}>
                {agency.accountName}
              </option>
            ))}
          </select>
        </div>

        {verifying && (
          <div className="verification-status">
            <Spinner size="small" />
            <span>Checking Business Manager access...</span>
          </div>
        )}

        {verificationResult && (
          <div className={`verification-result ${verificationResult.canLink ? 'success' : 'warning'}`}>
            <p>{verificationResult.message}</p>
            
            {!verificationResult.canLink && (
              <div className="instructions">
                <h4>How to add page to Business Manager:</h4>
                <ol>
                  <li>Go to <a href="https://business.facebook.com" target="_blank">business.facebook.com</a></li>
                  <li>Navigate to Business Settings → Pages</li>
                  <li>Click "Add" → "Request Access to a Page"</li>
                  <li>Enter Page ID: <code>{account.externalAccountId}</code></li>
                  <li>Send request and wait for page owner to accept</li>
                  <li>Return here and try again</li>
                </ol>
                
                {accessiblePages.length > 0 && (
                  <details>
                    <summary>Pages currently accessible ({accessiblePages.length})</summary>
                    <ul>
                      {accessiblePages.map(page => (
                        <li key={page.id}>{page.name} ({page.id})</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <DialogActions>
        <button onClick={onClose}>Cancel</button>
        <button 
          onClick={handleLink}
          disabled={!verificationResult?.canLink || verifying}
        >
          Link to Agency
        </button>
      </DialogActions>
    </Dialog>
  );
}
```

### **3. Social Media Account Card with Agency Status**

```typescript
function SocialMediaAccountCard({ account, workspaceId, onUpdate }) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const handleUnlink = async () => {
    if (!confirm('Unlink this account from agency? Future ads will use the account\'s own token.')) {
      return;
    }

    try {
      await api.delete(`/agency-accounts/${account.agencyAccountId}/unlink/${account.id}`);
      toast.success('Account unlinked from agency');
      onUpdate();
    } catch (error) {
      toast.error('Failed to unlink account');
    }
  };

  const handleSync = async () => {
    try {
      await api.post(`/workspaces/${workspaceId}/social-ads/accounts/${account.id}/sync`);
      toast.success('Account synced successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to sync account');
    }
  };

  return (
    <div className="account-card">
      <div className="account-header">
        <img src={account.profilePictureUrl} alt={account.accountName} />
        <div>
          <h3>{account.accountName}</h3>
          <span className={`platform-badge ${account.platform.type}`}>
            {account.platform.name}
          </span>
        </div>
      </div>

      <div className="account-stats">
        <div className="stat">
          <span className="label">Followers</span>
          <span className="value">{account.followersCount?.toLocaleString() || 'N/A'}</span>
        </div>
        <div className="stat">
          <span className="label">Status</span>
          <StatusBadge status={account.status} />
        </div>
        <div className="stat">
          <span className="label">Last Synced</span>
          <span className="value">{formatDate(account.lastSyncAt)}</span>
        </div>
      </div>

      {/* Agency Management Section */}
      <div className="agency-section">
        <h4>Management</h4>
        {account.agencyAccountId ? (
          <div className="agency-managed">
            <div className="agency-badge">
              🏢 Managed by Agency
            </div>
            <p className="agency-name">
              <strong>{account.agencyAccount?.accountName}</strong>
            </p>
            <p className="text-muted">
              Ads created using agency token (longer-lived, better permissions)
            </p>
            <button 
              onClick={handleUnlink}
              className="btn-secondary btn-sm"
            >
              Remove Agency Management
            </button>
          </div>
        ) : (
          <div className="direct-mode">
            <div className="badge badge-success">
              ✓ Direct Management
            </div>
            <p className="text-muted">
              Using account's own authentication
            </p>
            <button 
              onClick={() => setShowLinkDialog(true)}
              className="btn-secondary btn-sm"
            >
              Link to Agency (Optional)
            </button>
          </div>
        )}
      </div>

      <div className="account-actions">
        <button onClick={handleSync}>
          🔄 Sync
        </button>
        <button onClick={() => navigate(`/accounts/${account.id}`)}>
          View Details
        </button>
      </div>

      {showLinkDialog && (
        <LinkToAgencyDialog
          account={account}
          onSuccess={() => {
            setShowLinkDialog(false);
            onUpdate();
          }}
          onClose={() => setShowLinkDialog(false)}
        />
      )}
    </div>
  );
}
```

### **4. Create Ad Form with Agency Detection**

```typescript
function CreateAdForm({ workspaceId }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState<SocialMediaAccount | null>(null);
  const [formData, setFormData] = useState({
    accountId: '',
    name: '',
    objective: 'sales',
    adType: 'image',
    headline: '',
    primaryText: '',
    callToAction: 'SHOP_NOW',
    linkUrl: '',
    budget: 50,
    creatives: []
  });

  useEffect(() => {
    fetchAccounts();
  }, [workspaceId]);

  const fetchAccounts = async () => {
    const res = await api.get(`/workspaces/${workspaceId}/social-ads/accounts`);
    setAccounts(res.data);
  };

  const handleAccountSelect = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    setSelectedAccount(account);
    setFormData({ ...formData, accountId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post(
        `/workspaces/${workspaceId}/social-ads/ads`,
        formData
      );

      toast.success('Ad created successfully!');
      navigate(`/workspaces/${workspaceId}/social-ads/ads/${res.data.id}`);
    } catch (error) {
      toast.error(`Failed to create ad: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-ad-form">
      <h2>Create New Ad</h2>

      {/* Account Selection */}
      <section className="form-section">
        <label>Social Media Account *</label>
        <select 
          value={formData.accountId} 
          onChange={(e) => handleAccountSelect(e.target.value)}
          required
        >
          <option value="">-- Select Account --</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.accountName}
              {acc.agencyAccountId && ' 🏢 (Agency Managed)'}
            </option>
          ))}
        </select>

        {selectedAccount?.agencyAccountId && (
          <div className="info-box info-success">
            <span className="icon">🏢</span>
            <div>
              <strong>Managed by {selectedAccount.agencyAccount?.accountName}</strong>
              <p>This ad will be created using your agency account with elevated permissions and longer-lived tokens.</p>
            </div>
          </div>
        )}

        {selectedAccount && !selectedAccount.agencyAccountId && (
          <div className="info-box info-default">
            <span className="icon">✓</span>
            <div>
              <strong>Direct Management</strong>
              <p>This ad will be created using the account's own authentication.</p>
              <button 
                type="button"
                onClick={() => showLinkToAgencyDialog(selectedAccount)}
                className="btn-link"
              >
                Want to use agency account? Link here
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Ad Details */}
      <section className="form-section">
        <label>Ad Name *</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Summer Sale - Product Ad 1"
          required
        />
      </section>

      <section className="form-section">
        <label>Objective *</label>
        <select 
          value={formData.objective}
          onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
          required
        >
          <option value="awareness">Brand Awareness</option>
          <option value="traffic">Traffic</option>
          <option value="engagement">Engagement</option>
          <option value="leads">Lead Generation</option>
          <option value="sales">Conversions/Sales</option>
          <option value="app_installs">App Installs</option>
        </select>
      </section>

      {/* Ad Creative */}
      <section className="form-section">
        <label>Headline *</label>
        <input
          value={formData.headline}
          onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
          placeholder="e.g., 50% Off Summer Dresses!"
          maxLength={100}
          required
        />
        <small>{formData.headline.length}/100</small>
      </section>

      <section className="form-section">
        <label>Primary Text *</label>
        <textarea
          value={formData.primaryText}
          onChange={(e) => setFormData({ ...formData, primaryText: e.target.value })}
          placeholder="Write your ad copy here..."
          maxLength={2000}
          rows={4}
          required
        />
        <small>{formData.primaryText.length}/2000</small>
      </section>

      {/* More fields... */}

      <div className="form-actions">
        <button type="button" onClick={() => navigate(-1)}>Cancel</button>
        <button type="submit">Create Ad</button>
      </div>
    </form>
  );
}
```

---

## ⚠️ Error Handling

### **Common Errors & Solutions:**

```typescript
// Error 1: Agency not authenticated
{
  "statusCode": 401,
  "message": "Agency account is not authenticated"
}
// Solution: Re-authenticate agency account

// Error 2: Page not in Business Manager
{
  "statusCode": 409,
  "message": "Agency does not have access to this page in Meta Business Manager..."
}
// Solution: Add page to Business Manager, then retry

// Error 3: Platform mismatch
{
  "statusCode": 409,
  "message": "Social media account and agency account must be on the same platform"
}
// Solution: Select an agency account for the same platform

// Error 4: Permission denied
{
  "statusCode": 403,
  "message": "Insufficient permissions: create on workspace..."
}
// Solution: Request workspace permissions from admin
```

---

## 🔄 Complete Integration Checklist

### **Phase 1: Basic Setup**
- [ ] Implement authentication (login/logout)
- [ ] Implement workspace selection
- [ ] Add Social Ads to navigation

### **Phase 2: Direct Mode (Required)**
- [ ] Connected Accounts page
- [ ] OAuth flow for social accounts
- [ ] Account list/grid view
- [ ] Sync account functionality

### **Phase 3: Campaign & Ad Management**
- [ ] Campaigns list page
- [ ] Create campaign form
- [ ] Campaign details page
- [ ] Ads list page
- [ ] Create ad form (multi-step or single-page)
- [ ] Ad details page
- [ ] Ad preview component

### **Phase 4: Performance & Analytics**
- [ ] Performance metrics cards
- [ ] Charts (line, bar, pie)
- [ ] Date range selector
- [ ] Export functionality

### **Phase 5: Agency Mode (Optional - Advanced)**
- [ ] Agency Accounts page (in Settings)
- [ ] Create agency account flow
- [ ] OAuth flow for agency
- [ ] Link account to agency dialog
- [ ] Unlink functionality
- [ ] Accessible pages list
- [ ] Agency status indicators

---

## 📖 Quick Start Guide for Frontend Devs

### **1. Authentication**
```typescript
// Set up axios/fetch with auth token
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### **2. Workspace Selection**
```typescript
// Get workspaces
const workspaces = await api.get('/workspaces');

// Check permissions
const permissions = await api.get(`/user-workspace-permissions/user/${userId}/workspace/${workspaceId}`);
```

### **3. Connect Account (Direct Mode)**
```typescript
// Initiate OAuth
const { authUrl } = await api.post(`/social-media-auth/initiate/${accountId}`);
window.location.href = authUrl;

// Handle callback
const urlParams = new URLSearchParams(window.location.search);
await api.post(`/social-media-auth/complete/${accountId}`, {
  code: urlParams.get('code'),
  state: urlParams.get('state')
});
```

### **4. Create Ad**
```typescript
const ad = await api.post(`/workspaces/${workspaceId}/social-ads/ads`, {
  accountId: 'account-id',
  name: 'My Ad',
  objective: 'sales',
  adType: 'image',
  headline: '50% Off!',
  primaryText: 'Shop now...',
  callToAction: 'SHOP_NOW',
  linkUrl: 'https://example.com',
  budget: 50,
  creatives: [{ type: 'image', mediaUrl: 'https://...' }]
});
```

### **5. Link to Agency (Optional)**
```typescript
// Check accessible pages first
const pages = await api.get(`/agency-accounts/${agencyId}/accessible-pages`);

// Link if page is accessible
if (pages.data.some(p => p.id === account.externalAccountId)) {
  await api.post(`/agency-accounts/${agencyId}/link/${account.id}`);
}
```

---

## 🎯 Architecture Principles

### **1. Workspace Isolation**
```typescript
// All data scoped to workspace
GET /workspaces/:workspaceId/social-ads/...

// Even with agency, data stays separate
workspace-abc → ads for ABC Company only
workspace-xyz → ads for XYZ Corp only
```

### **2. Optional Agency**
```typescript
// Direct Mode (default)
if (!account.agencyAccountId) {
  token = getAccountToken(account.id);
}

// Agency Mode (optional)
if (account.agencyAccountId) {
  token = getAgencyToken(account.agencyAccountId);
}
```

### **3. Verification First**
```typescript
// Before linking, verify access
const hasAccess = await checkBusinessManagerAccess(agencyId, pageId);

if (!hasAccess) {
  showError('Add page to Business Manager first');
  return;
}

// Proceed with linking
await linkToAgency(accountId, agencyId);
```

---

## 📚 Additional Resources

- **`AGENCY_COMPLETE_SOLUTION.md`** - Complete agency implementation
- **`AGENCY_VERIFICATION_FLOW.md`** - Verification process details
- **`META_SDK_INTEGRATION.md`** - Meta SDK technical guide
- **`META_SDK_SETUP.md`** - Setup instructions
- **`WHY_USE_META_SDK.md`** - SDK benefits explained

---

**Ready to integrate? Start with Direct Mode, add Agency Mode when needed!** 🚀
