# Agency Account Integration Guide

## 📋 Overview

The **Agency Account** feature allows Humanoid users to bring their own **Meta Business Manager** or **Agency accounts** to manage ads on behalf of their workspace social media accounts. This provides two operation modes:

### **Mode 1: Direct Account Management (Default)**
- Workspace connects its own Facebook/Instagram account
- Uses the account's own access token for ad operations
- Suitable for: Small businesses, individual marketers

### **Mode 2: Agency Management (Optional)**
- User sets up their Meta Business Manager/Agency account
- Agency account manages ads for multiple workspace accounts
- Uses agency's access token with elevated permissions
- Suitable for: Agencies, enterprise users, power users with multiple clients

---

## 🎯 Why Use Agency Accounts?

### **Benefits**

1. **Centralized Management**
   - One agency token manages multiple client accounts
   - No need to authenticate each workspace account separately
   - Better token lifespan and reliability

2. **Enhanced Permissions**
   - Agency accounts have elevated permissions
   - Can access client accounts without individual OAuth
   - Better API limits and quotas

3. **Professional Setup**
   - Matches real-world agency workflows
   - Client-agency relationship properly modeled
   - Better compliance and audit trails

4. **Scalability**
   - Manage hundreds of client accounts
   - Bulk operations across clients
   - Consolidated reporting

---

## 🏗️ Database Schema

### **New Entities**

#### **1. AgencyAccount**
```typescript
{
  id: string;
  userId: string;  // Owner of the agency account
  platformId: string;  // Meta, LinkedIn, etc.
  externalAccountId: string;  // Business Manager ID
  accountName: string;
  businessManagerId?: string;
  agencyId?: string;
  accountType: 'business_manager' | 'partner' | 'reseller';
  status: 'active' | 'inactive' | 'suspended';
  timezone?: string;
  currency?: string;
  capabilities?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### **2. AgencyAuth**
```typescript
{
  id: string;
  agencyAccountId: string;
  authType: 'oauth2' | 'system_user' | 'api_key';
  status: 'active' | 'expired' | 'revoked';
  accessToken: string;  // Long-lived token
  refreshToken?: string;
  systemUserToken?: string;  // For Meta System Users
  expiresAt?: Date;
  scope: string;
  permissions: string[];
  isActive: boolean;
}
```

#### **3. SocialMediaAccount (Updated)**
```typescript
{
  // ... existing fields
  agencyAccountId?: string;  // NEW: Links to agency if managed
  // When set, ad operations use agency token instead of account token
}
```

---

## 🔄 User Flows

### **Flow 1: Set Up Agency Account**

#### **User Journey:**
1. User navigates to "Settings" → "Agency Accounts"
2. User clicks "Connect Agency Account"
3. User selects platform (Meta Business Manager)
4. User enters Business Manager ID
5. User initiates OAuth flow
6. User authorizes app with Business Manager permissions
7. Agency account is connected
8. User can now manage workspace accounts using this agency

#### **API Sequence:**

```typescript
// STEP 1: Create agency account record
POST /agency-accounts
Request:
{
  "platformType": "meta",
  "externalAccountId": "123456789",  // Business Manager ID
  "accountName": "My Marketing Agency",
  "businessManagerId": "123456789",
  "accountType": "business_manager",
  "timezone": "America/New_York",
  "currency": "USD"
}

Response:
{
  "success": true,
  "data": {
    "id": "agency-acc-123",
    "userId": "user-456",
    "platformId": "platform-meta",
    "externalAccountId": "123456789",
    "accountName": "My Marketing Agency",
    "status": "active"
  }
}

// STEP 2: Initiate OAuth for agency
POST /agency-accounts/:agencyAccountId/auth/initiate

Response:
{
  "success": true,
  "data": {
    "authUrl": "https://www.facebook.com/v18.0/dialog/oauth?...",
    "state": "random-state-123"
  }
}

// STEP 3: User visits authUrl and authorizes
window.location.href = authUrl;

// STEP 4: Handle callback and complete OAuth
POST /agency-accounts/:agencyAccountId/auth/complete
Request:
{
  "code": "auth-code-from-meta",
  "state": "random-state-123"
}

Response:
{
  "success": true,
  "data": {
    "id": "agency-auth-789",
    "agencyAccountId": "agency-acc-123",
    "status": "active",
    "authType": "oauth2",
    "expiresAt": "2025-03-30T00:00:00Z",  // 60-day token
    "permissions": ["ads_management", "business_management"]
  }
}

// STEP 5: Verify authentication
GET /agency-accounts/:agencyAccountId/is-authenticated

Response:
{
  "success": true,
  "data": { "isAuthenticated": true }
}
```

---

### **Flow 2: Link Workspace Account to Agency**

#### **User Journey:**
1. User has workspace with connected Facebook Page
2. User navigates to workspace social media accounts
3. User sees "Manage with Agency" option
4. User selects their agency account
5. System links the account to agency
6. All future ads use agency token

#### **API Sequence:**

```typescript
// STEP 1: Get user's agency accounts
GET /agency-accounts

Response:
{
  "success": true,
  "data": [
    {
      "id": "agency-acc-123",
      "accountName": "My Marketing Agency",
      "platform": {
        "name": "Facebook",
        "type": "meta"
      },
      "status": "active",
      "managedAccounts": [] // Currently managing 0 accounts
    }
  ]
}

// STEP 2: Get workspace social media accounts
GET /workspaces/:workspaceId/social-ads/accounts

Response:
{
  "success": true,
  "data": [
    {
      "id": "social-acc-456",
      "accountName": "Client's Facebook Page",
      "agencyAccountId": null,  // Not managed by agency yet
      "platform": {
        "type": "meta"
      }
    }
  ]
}

// STEP 3: Link account to agency
POST /agency-accounts/:agencyAccountId/link/:socialMediaAccountId

Response:
{
  "success": true,
  "data": {
    "id": "social-acc-456",
    "accountName": "Client's Facebook Page",
    "agencyAccountId": "agency-acc-123",  // Now managed by agency
    "workspace": {
      "name": "Client Workspace A"
    }
  },
  "message": "Social media account linked to agency successfully"
}

// STEP 4: Verify linkage
GET /agency-accounts/:agencyAccountId/managed-accounts

Response:
{
  "success": true,
  "data": [
    {
      "id": "social-acc-456",
      "accountName": "Client's Facebook Page",
      "workspace": {
        "id": "workspace-123",
        "name": "Client Workspace A"
      },
      "platform": {
        "name": "Facebook"
      }
    }
  ]
}
```

---

### **Flow 3: Create Ad Using Agency Account**

#### **User Journey:**
1. User creates an ad for a workspace account
2. System detects account is managed by agency
3. System uses agency token instead of account token
4. Ad is created with agency permissions

#### **What Happens Behind the Scenes:**

```typescript
// When user creates an ad:
POST /workspaces/:workspaceId/social-ads/ads
Request:
{
  "accountId": "social-acc-456",  // This account is agency-managed
  "name": "Summer Sale Ad",
  "objective": "sales",
  ...
}

// Backend automatically:
// 1. Checks if accountId is linked to an agency
const isManaged = await agencyService.isAccountManagedByAgency('social-acc-456');
// → Returns: true

// 2. Gets agency token instead of account token
const tokenInfo = await agencyService.getAccessTokenForAccount('social-acc-456');
// → Returns: {
//     accessToken: 'agency-long-lived-token',
//     isAgencyToken: true,
//     agencyAccountId: 'agency-acc-123'
//   }

// 3. Creates ad using agency token
const ad = await metaService.createAd(tokenInfo.accessToken, adData);
// → Uses agency permissions (more powerful, longer-lived)

// 4. Returns created ad
Response:
{
  "success": true,
  "data": {
    "id": "ad-101",
    "name": "Summer Sale Ad",
    "externalAdId": "fb-ad-123456",
    // Created using agency account
  }
}
```

---

## 🔀 Operation Mode Comparison

### **Direct Mode (Default)**
```
Workspace Account
    ↓
  OAuth (User authorizes workspace account)
    ↓
  Short-lived Token (few hours)
    ↓
  Create Ads
```

### **Agency Mode (Optional)**
```
Agency Account (User's Business Manager)
    ↓
  OAuth (User authorizes Business Manager)
    ↓
  Long-lived Token (60 days)
    ↓
  Link to Workspace Accounts (multiple)
    ↓
  Create Ads for All Linked Accounts
```

---

## 🎨 UI/UX Implementation

### **Settings Page: Agency Accounts**

```
┌─────────────────────────────────────────────────────────┐
│  Agency Accounts                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [+ Connect Agency Account]                             │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 🏢 My Marketing Agency (Meta)                  │    │
│  │ Business Manager ID: 123456789                 │    │
│  │ Status: ✅ Active | Authenticated              │    │
│  │ Managing: 3 accounts                           │    │
│  │                                                 │    │
│  │ [View Managed Accounts] [Sync] [Disconnect]   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **Workspace Social Accounts Page (Updated)**

```
┌─────────────────────────────────────────────────────────┐
│  Connected Social Media Accounts                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │ 📘 Client's Facebook Page                      │    │
│  │ Platform: Facebook | Status: Active            │    │
│  │                                                 │    │
│  │ Management Mode:                               │    │
│  │ ○ Direct (Use account's own token)            │    │
│  │ ● Agency (Managed by agency)                  │    │
│  │                                                 │    │
│  │ Agency: 🏢 My Marketing Agency                 │    │
│  │ [Change Agency] [Remove Agency]                │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 API Reference

### **Agency Account Management**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agency-accounts` | Create agency account |
| GET | `/agency-accounts` | Get user's agency accounts |
| GET | `/agency-accounts/:id` | Get agency account details |
| PUT | `/agency-accounts/:id` | Update agency account |
| DELETE | `/agency-accounts/:id` | Delete agency account |

### **Agency Authentication**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agency-accounts/:id/auth/initiate` | Start OAuth flow |
| POST | `/agency-accounts/:id/auth/complete` | Complete OAuth flow |
| GET | `/agency-accounts/:id/is-authenticated` | Check auth status |
| POST | `/agency-accounts/:id/sync` | Sync agency data |

### **Agency-Client Relationship**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agency-accounts/:agencyId/link/:accountId` | Link account to agency |
| DELETE | `/agency-accounts/:agencyId/unlink/:accountId` | Unlink account from agency |
| GET | `/agency-accounts/:agencyId/managed-accounts` | Get managed accounts |
| GET | `/agency-accounts/social-account/:accountId/agency` | Get managing agency |

---

## 💻 Frontend Implementation

### **1. Agency Account Setup Page**

```typescript
// Component: AgencyAccountsPage.tsx

function AgencyAccountsPage() {
  const [agencyAccounts, setAgencyAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgencyAccounts();
  }, []);

  const fetchAgencyAccounts = async () => {
    const response = await fetch('/agency-accounts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setAgencyAccounts(data.data);
    setLoading(false);
  };

  const handleConnectAgency = async () => {
    // Show modal to create agency account
    const agencyData = {
      platformType: 'meta',
      externalAccountId: businessManagerId,
      accountName: 'My Agency'
    };

    const response = await fetch('/agency-accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agencyData)
    });

    const result = await response.json();
    const agencyAccountId = result.data.id;

    // Initiate OAuth
    const authResponse = await fetch(
      `/agency-accounts/${agencyAccountId}/auth/initiate`,
      { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
    );

    const authData = await authResponse.json();
    
    // Redirect to Facebook OAuth
    window.location.href = authData.data.authUrl;
  };

  return (
    <div>
      <h1>Agency Accounts</h1>
      <button onClick={handleConnectAgency}>
        Connect Agency Account
      </button>

      {agencyAccounts.map(agency => (
        <AgencyAccountCard key={agency.id} agency={agency} />
      ))}
    </div>
  );
}
```

### **2. Link Account to Agency**

```typescript
// Component: SocialMediaAccountCard.tsx

function SocialMediaAccountCard({ account, workspaceId }) {
  const [agencyAccounts, setAgencyAccounts] = useState([]);
  const [selectedAgency, setSelectedAgency] = useState(null);

  const fetchAgencyAccounts = async () => {
    const response = await fetch('/agency-accounts', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    // Filter by same platform
    const compatible = data.data.filter(
      agency => agency.platform.type === account.platform.type
    );
    setAgencyAccounts(compatible);
  };

  const handleLinkToAgency = async (agencyId) => {
    const response = await fetch(
      `/agency-accounts/${agencyId}/link/${account.id}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.ok) {
      alert('Account linked to agency successfully!');
      // Refresh account data
      fetchAccountData();
    }
  };

  const handleUnlinkFromAgency = async () => {
    const response = await fetch(
      `/agency-accounts/${account.agencyAccountId}/unlink/${account.id}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.ok) {
      alert('Account unlinked from agency successfully!');
      fetchAccountData();
    }
  };

  return (
    <div className="account-card">
      <h3>{account.accountName}</h3>
      
      {account.agencyAccountId ? (
        <div className="agency-managed">
          <span>🏢 Managed by Agency</span>
          <p>Agency: {account.agencyAccount?.accountName}</p>
          <button onClick={handleUnlinkFromAgency}>
            Remove Agency Management
          </button>
        </div>
      ) : (
        <div className="agency-select">
          <label>Manage with Agency (Optional)</label>
          <select onChange={(e) => setSelectedAgency(e.target.value)}>
            <option value="">-- No Agency --</option>
            {agencyAccounts.map(agency => (
              <option key={agency.id} value={agency.id}>
                {agency.accountName}
              </option>
            ))}
          </select>
          {selectedAgency && (
            <button onClick={() => handleLinkToAgency(selectedAgency)}>
              Link to Agency
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

### **3. Ad Creation (Automatic Agency Detection)**

```typescript
// Component: CreateAdForm.tsx

function CreateAdForm({ workspaceId }) {
  const [account, setAccount] = useState(null);
  const [managingAgency, setManagingAgency] = useState(null);

  const handleAccountSelect = async (accountId) => {
    // Get account details
    const response = await fetch(
      `/workspaces/${workspaceId}/social-ads/accounts/${accountId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    setAccount(data.data);

    // Check if managed by agency
    if (data.data.agencyAccountId) {
      const agencyResponse = await fetch(
        `/agency-accounts/social-account/${accountId}/agency`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const agencyData = await agencyResponse.json();
      setManagingAgency(agencyData.data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="account-selection">
        <label>Select Social Media Account</label>
        <select onChange={(e) => handleAccountSelect(e.target.value)}>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.accountName}
              {acc.agencyAccountId && ' (Agency Managed)'}
            </option>
          ))}
        </select>

        {managingAgency && (
          <div className="agency-info">
            <span className="badge badge-success">
              🏢 Managed by {managingAgency.accountName}
            </span>
            <p className="text-muted">
              Ads will be created using your agency account permissions
            </p>
          </div>
        )}
      </div>

      {/* Rest of the form */}
      <input name="name" placeholder="Ad Name" required />
      <textarea name="primaryText" placeholder="Ad Copy" required />
      {/* ... more fields */}

      <button type="submit">Create Ad</button>
    </form>
  );
}

// When form is submitted, backend automatically uses agency token if linked
// No special handling needed in frontend!
```

---

## 🔐 Security & Permissions

### **Access Control**

```typescript
// Only the agency owner can manage their agency accounts
if (agencyAccount.userId !== req.user.id) {
  throw new UnauthorizedException('You do not own this agency account');
}

// Only the agency owner can link/unlink accounts
if (agencyAccount.userId !== userId) {
  throw new UnauthorizedException('Access denied');
}

// Platform must match when linking
if (socialAccount.platformId !== agencyAccount.platformId) {
  throw new ConflictException('Platform mismatch');
}
```

### **Token Management**

```typescript
// Agency tokens are long-lived (60 days for Meta)
// Auto-refresh before expiry
if (auth.expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
  await this.refreshAgencyAuth(auth.id);
}
```

---

## 🎯 How Token Selection Works

### **Automatic Token Selection Logic**

```typescript
// In SocialAdService.createAd()

// 1. Check if account is managed by agency
const isManaged = await agencyAccountService.isAccountManagedByAgency(accountId);

if (isManaged) {
  // 2a. Get agency token
  const tokenInfo = await agencyAccountService.getAccessTokenForAccount(accountId);
  const accessToken = tokenInfo.accessToken;  // Agency token
  const isAgencyToken = true;
} else {
  // 2b. Get account's own token
  const accessToken = await authService.getValidAccessToken(accountId);
  const isAgencyToken = false;
}

// 3. Use the appropriate token for API calls
const ad = await metaService.createAd(accessToken, adData);
```

**This happens automatically - no frontend changes needed!**

---

## 📊 Benefits Breakdown

### **For Users/Agencies:**

| Feature | Direct Mode | Agency Mode |
|---------|-------------|-------------|
| Token Lifespan | Short (hours) | Long (60 days) |
| Re-auth Frequency | Often | Rarely |
| Accounts Managed | 1 per token | Many per token |
| API Limits | Per account | Per agency (higher) |
| Setup Complexity | Low | Medium |
| Best For | Small businesses | Agencies, enterprises |

### **For Humanoid Platform:**

✅ **Flexibility** - Users choose mode that fits their needs
✅ **Professional** - Supports real agency workflows
✅ **Scalable** - Agency token reused across accounts
✅ **Reliable** - Longer-lived tokens = fewer re-auths
✅ **Transparent** - Automatic, users don't need to think about it

---

## 🔄 Complete Integration Flow

```
User Sets Up
    ↓
Option A: Direct Mode          Option B: Agency Mode
    ↓                              ↓
Connect Workspace Account      Create Agency Account
    ↓                              ↓
OAuth per Account              OAuth for Agency (once)
    ↓                              ↓
Short-lived Token              Long-lived Token
    ↓                              ↓
Create Ads                     Link Workspace Accounts
    │                              ↓
    │                          Create Ads for Any Linked Account
    │                              │
    └──────────────┬───────────────┘
                   ↓
            Ads Created on Meta
                   ↓
            Performance Tracking
```

---

## 🧪 Testing

### **Test Scenarios:**

#### **1. Create Agency Account**
```bash
POST /agency-accounts
# Should create and initiate OAuth flow
```

#### **2. Link Account**
```bash
POST /agency-accounts/:agencyId/link/:accountId
# Should link successfully
```

#### **3. Create Ad with Agency**
```bash
POST /workspaces/:workspaceId/social-ads/ads
# Should use agency token automatically
```

#### **4. Unlink and Create**
```bash
DELETE /agency-accounts/:agencyId/unlink/:accountId
POST /workspaces/:workspaceId/social-ads/ads
# Should fail - no authentication
```

---

## 📝 Frontend Checklist

### **UI Components Needed:**

- [ ] Agency Accounts page/section
- [ ] "Connect Agency Account" flow
- [ ] Agency account card with stats
- [ ] Agency selector in account settings
- [ ] "Link to Agency" button
- [ ] "Unlink from Agency" button
- [ ] Agency indicator badge on accounts
- [ ] Agency info in ad creation form

### **API Integrations:**

- [ ] Create agency account
- [ ] OAuth flow for agency
- [ ] Get agency accounts list
- [ ] Link account to agency
- [ ] Unlink account from agency
- [ ] Get managed accounts
- [ ] Display agency status in UI

---

## 🎓 Meta Business Manager Setup

### **How to Get Business Manager ID:**

1. Go to https://business.facebook.com/
2. Create or select your Business Manager
3. Go to **Business Settings**
4. Your Business Manager ID is in the URL:
   ```
   https://business.facebook.com/settings/business-id/XXXXXXXXXX
                                                         ^^^^^^^^^^
                                                    This is your ID
   ```

### **Required Permissions:**

When setting up agency account, request:
- `business_management` - Manage business assets
- `ads_management` - Create and manage ads
- `catalog_management` - Manage product catalogs
- `pages_manage_ads` - Create ads for Pages
- `instagram_basic` - Access Instagram accounts

---

## 🚀 Summary

### **What You Get:**

✅ **Two Operation Modes** - Direct and Agency
✅ **Automatic Token Selection** - System chooses the right token
✅ **Flexible Architecture** - Users decide what works for them
✅ **Professional Workflows** - Supports real agency setups
✅ **Transparent Operations** - Works seamlessly in background
✅ **Better Token Management** - Longer-lived agency tokens

### **User Experience:**

1. **Small Businesses** - Connect accounts directly, simple flow
2. **Agencies** - Set up Business Manager once, manage all clients
3. **Enterprises** - Use agency mode for centralized control
4. **Flexibility** - Can use both modes simultaneously

### **Technical Excellence:**

✅ Uses **Meta SDK** - Future-proof against API changes
✅ **Automatic selection** - Frontend doesn't need to know the difference
✅ **Proper relationships** - Agency-client model in database
✅ **Security** - Only agency owner can manage linkages
✅ **Scalability** - One token manages many accounts

---

## 📞 Questions?

- **What's the difference?** - Agency mode uses Business Manager permissions
- **Is it required?** - No, it's completely optional
- **Can I use both?** - Yes, different accounts can use different modes
- **What's better?** - Agency mode for managing multiple clients, direct mode for simplicity

**The system automatically handles everything - just link accounts and create ads!** 🚀
