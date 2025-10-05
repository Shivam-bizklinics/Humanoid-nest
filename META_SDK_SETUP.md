# Meta SDK Setup Guide

## 🚀 Quick Start

This guide will help you set up the Meta Business SDK integration for the Social Ads module.

---

## 📋 Prerequisites

1. **Facebook Developer Account** - [Create one here](https://developers.facebook.com/)
2. **Facebook App** - Create a new app for your platform
3. **Business Manager** (optional but recommended) - For production use

---

## 🔧 Step 1: Create Facebook App

### 1.1 Go to Facebook Developers
1. Visit https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Select "Business" as app type
4. Fill in app details:
   - **App Name**: Humanoid Social Ads
   - **App Contact Email**: your-email@example.com
   - **Business Manager Account**: (select if you have one)

### 1.2 Get App Credentials
1. Go to **Settings** → **Basic**
2. Copy these values:
   - **App ID** → This is your `META_CLIENT_ID`
   - **App Secret** → Click "Show", this is your `META_CLIENT_SECRET`

---

## 🔑 Step 2: Configure OAuth

### 2.1 Add OAuth Redirect URI
1. Go to your app dashboard
2. Click **Add Product** → Select **Facebook Login**
3. Go to **Facebook Login** → **Settings**
4. Add **Valid OAuth Redirect URIs**:
   ```
   Development:
   http://localhost:3000/auth/facebook/callback
   
   Production:
   https://yourdomain.com/auth/facebook/callback
   ```

### 2.2 Configure Permissions
1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:

#### Required Permissions:
- ✅ `ads_management` - Create and manage ads
- ✅ `ads_read` - Read ad account data
- ✅ `business_management` - Manage business assets
- ✅ `pages_read_engagement` - Read Page data
- ✅ `pages_manage_ads` - Create ads for Pages

#### Optional (for Instagram):
- ✅ `instagram_basic` - Access Instagram account
- ✅ `instagram_manage_insights` - Read Instagram insights

---

## ⚙️ Step 3: Environment Configuration

### 3.1 Create .env File

Create a `.env` file in the project root with these variables:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=humanoid

# Application
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Meta/Facebook Business SDK Configuration
META_CLIENT_ID=your_app_id_here
META_CLIENT_SECRET=your_app_secret_here
META_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
META_API_VERSION=v18.0

# LinkedIn Ads Configuration (Future)
# LINKEDIN_CLIENT_ID=
# LINKEDIN_CLIENT_SECRET=
# LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback

# Twitter Ads Configuration (Future)
# TWITTER_CLIENT_ID=
# TWITTER_CLIENT_SECRET=
# TWITTER_REDIRECT_URI=http://localhost:3000/auth/twitter/callback
```

### 3.2 Replace Placeholder Values

Replace these values:
- `your_app_id_here` → Your Facebook App ID
- `your_app_secret_here` → Your Facebook App Secret
- `your_password` → Your PostgreSQL password
- `your-super-secret-jwt-key-change-this-in-production` → A strong random string

---

## 🏢 Step 4: Business Manager Setup (Production)

For production use, it's recommended to use Facebook Business Manager:

### 4.1 Create Business Manager
1. Go to https://business.facebook.com/
2. Click "Create Account"
3. Enter your business details

### 4.2 Add Your App
1. Go to **Business Settings**
2. Click **Accounts** → **Apps**
3. Click "Add" → Select your app
4. Grant necessary permissions

### 4.3 Add Ad Account
1. Go to **Business Settings** → **Accounts** → **Ad Accounts**
2. Add your ad account
3. Assign your app access to the ad account

---

## 🧪 Step 5: Testing

### 5.1 Install Dependencies
```bash
npm install
```

### 5.2 Build the Project
```bash
npm run build
```

### 5.3 Start Development Server
```bash
npm run start:dev
```

### 5.4 Test OAuth Flow

1. **Get OAuth URL**:
   ```bash
   POST http://localhost:3000/social-media-auth/initiate/:accountId
   ```

2. **Visit the URL** in browser

3. **Authorize the app** with your Facebook account

4. **Get redirected** to callback URL with code

5. **Complete OAuth**:
   ```bash
   POST http://localhost:3000/social-media-auth/complete/:accountId
   Body: { "code": "...", "state": "..." }
   ```

---

## 🔍 Step 6: Verify SDK Integration

### 6.1 Check Connection
```typescript
// Test SDK initialization
GET /social-ads/platforms
```

Should return:
```json
{
  "success": true,
  "data": [
    {
      "name": "Facebook",
      "type": "meta",
      "status": "active"
    }
  ]
}
```

### 6.2 Test Account Connection
```typescript
// After OAuth flow
GET /workspaces/:workspaceId/social-ads/accounts
```

Should return connected Facebook/Instagram accounts.

---

## 📊 Step 7: API Version Management

### Current Version: v18.0

Meta releases new API versions quarterly. Here's how to update:

### 7.1 Check Latest Version
Visit: https://developers.facebook.com/docs/graph-api/changelog

### 7.2 Update Version
1. Update `.env`:
   ```bash
   META_API_VERSION=v19.0  # New version
   ```

2. Update SDK (if needed):
   ```bash
   npm update facebook-nodejs-business-sdk
   ```

3. Test critical flows

### 7.3 Version Support Timeline
- Each version supported for **2 years**
- Deprecation warnings sent 90 days before
- Plan migrations early

---

## 🛡️ Security Best Practices

### 1. **Never Commit Secrets**
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 2. **Use Different Apps for Environments**
- **Development App** - For testing
- **Staging App** - For QA
- **Production App** - For live users

### 3. **Rotate Secrets Regularly**
- Rotate `META_CLIENT_SECRET` every 90 days
- Rotate `JWT_SECRET` every 6 months

### 4. **Implement Token Encryption**
```typescript
// Encrypt access tokens in database
const encrypted = await this.encryptToken(accessToken);
await this.authRepository.save({ accessToken: encrypted });
```

### 5. **Monitor Rate Limits**
- Track API usage
- Implement alerts for 80% usage
- Use batch requests when possible

---

## 🚨 Troubleshooting

### Issue 1: "Invalid OAuth Access Token"
**Cause**: Token expired or revoked
**Solution**: Implement auto-refresh or re-authenticate

### Issue 2: "Application Request Limit Reached"
**Cause**: Rate limit exceeded
**Solution**: Implement exponential backoff retry

### Issue 3: "Invalid App ID"
**Cause**: Wrong `META_CLIENT_ID`
**Solution**: Verify App ID in Facebook Developer Console

### Issue 4: "Redirect URI Mismatch"
**Cause**: `META_REDIRECT_URI` not whitelisted
**Solution**: Add URI to Facebook Login settings

### Issue 5: "Permission Denied"
**Cause**: Missing OAuth permissions
**Solution**: Request permissions in App Review

---

## 📈 Production Checklist

Before going to production, ensure:

- [ ] App reviewed and approved by Facebook
- [ ] All required permissions granted
- [ ] Business Manager configured
- [ ] Production redirect URIs added
- [ ] Environment variables set in production
- [ ] Token encryption implemented
- [ ] Rate limiting configured
- [ ] Error monitoring set up
- [ ] Backup/recovery plan in place
- [ ] Documentation updated

---

## 🔗 Useful Links

### Facebook Resources
- [Meta for Developers](https://developers.facebook.com/)
- [Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)
- [Business SDK Node.js](https://github.com/facebook/facebook-nodejs-business-sdk)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)
- [Business Manager](https://business.facebook.com/)

### Meta Support
- [Developer Community](https://developers.facebook.com/community/)
- [Bug Reports](https://developers.facebook.com/support/bugs/)
- [Platform Status](https://developers.facebook.com/status/)

### Internal Documentation
- [META_SDK_INTEGRATION.md](./META_SDK_INTEGRATION.md) - Technical details
- [SOCIAL_ADS_FRONTEND_INTEGRATION.md](./SOCIAL_ADS_FRONTEND_INTEGRATION.md) - Frontend guide
- [SOCIAL_ADS_MODULE.md](./SOCIAL_ADS_MODULE.md) - Architecture overview

---

## 🆘 Getting Help

### Internal Support
1. Check documentation files listed above
2. Review error logs in the application
3. Contact backend team

### Meta Support
1. [Developer Forums](https://developers.facebook.com/community/)
2. [Submit Bug Report](https://developers.facebook.com/support/bugs/)
3. [Platform Status](https://developers.facebook.com/status/)

---

## 📝 Configuration Summary

After setup, you should have:

```bash
# Meta SDK Configuration
✅ Facebook App created
✅ App ID and Secret obtained
✅ OAuth redirect URIs configured
✅ Required permissions requested
✅ Environment variables set
✅ SDK initialized and tested
✅ OAuth flow working
✅ Ad creation tested
```

---

**SDK Version**: facebook-nodejs-business-sdk (latest)
**API Version**: v18.0
**Maintained By**: Backend Team
