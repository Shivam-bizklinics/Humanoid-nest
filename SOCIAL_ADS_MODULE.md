# Social Ads Module Documentation

## Overview

The Social Ads module is a comprehensive solution for managing social media advertising across multiple platforms. It provides a unified interface for creating, managing, and monitoring ads on various social media platforms including Meta (Facebook, Instagram, WhatsApp), LinkedIn, Twitter, and Snapchat.

## Architecture

### Design Principles

1. **Provider Pattern**: Each social media platform is implemented as a separate provider, making it easy to add new platforms
2. **Modular Design**: Self-contained module that can be easily extracted into a microservice
3. **SOLID Principles**: Follows Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles
4. **Extensible**: Easy to add new social media platforms and features

### Core Components

#### Entities
- **SocialMediaPlatform**: Defines supported social media platforms
- **SocialMediaAccount**: User accounts on social media platforms
- **SocialMediaAuth**: Authentication tokens and permissions
- **SocialAd**: Individual social media ads
- **SocialAdCampaign**: Campaigns containing multiple ads
- **SocialAdCreative**: Creative assets (images, videos, etc.)
- **SocialAdTargeting**: Targeting criteria for ads
- **SocialAdPerformance**: Performance metrics and analytics

#### Services
- **SocialMediaService**: Core platform and account management
- **SocialMediaAuthService**: Authentication and token management
- **SocialAdService**: Ad creation and management
- **SocialAdCampaignService**: Campaign management
- **SocialMediaProviderFactory**: Factory for platform-specific providers

#### Providers
- **MetaService**: Facebook, Instagram, WhatsApp integration
- **LinkedInService**: LinkedIn advertising (placeholder)
- **TwitterService**: Twitter advertising (placeholder)
- **SnapchatService**: Snapchat advertising (placeholder)

## Features

### Platform Management
- Support for multiple social media platforms
- Platform-specific feature detection
- API limits and capabilities management

### Account Management
- Connect multiple social media accounts
- Account synchronization
- Authentication token management
- Permission tracking

### Ad Management
- Create, update, delete ads
- Ad status management (active, paused, draft)
- Creative asset management
- Targeting configuration
- Performance tracking

### Campaign Management
- Campaign creation and management
- Budget management
- Campaign performance analytics
- Ad grouping within campaigns

### Authentication
- OAuth2 flow for each platform
- Token refresh and validation
- Permission management
- Secure token storage

## API Endpoints

### Platform Management
- `GET /social-ads/platforms` - Get all supported platforms
- `GET /social-ads/platforms/:type` - Get specific platform details
- `GET /social-ads/platforms/:type/features` - Get platform features

### Account Management
- `GET /social-ads/accounts` - Get user accounts
- `GET /social-ads/accounts/:accountId` - Get account details
- `POST /social-ads/accounts/:accountId/sync` - Sync account data

### Authentication
- `POST /social-media-auth/initiate/:accountId` - Start OAuth flow
- `POST /social-media-auth/complete/:accountId` - Complete OAuth flow
- `POST /social-media-auth/refresh/:authId` - Refresh token
- `POST /social-media-auth/revoke/:authId` - Revoke token

### Ad Management
- `POST /social-ads/ads` - Create ad
- `GET /social-ads/ads` - Get user ads
- `GET /social-ads/ads/:adId` - Get ad details
- `PUT /social-ads/ads/:adId` - Update ad
- `DELETE /social-ads/ads/:adId` - Delete ad
- `POST /social-ads/ads/:adId/pause` - Pause ad
- `POST /social-ads/ads/:adId/resume` - Resume ad

### Campaign Management
- `POST /social-ad-campaigns` - Create campaign
- `GET /social-ad-campaigns` - Get user campaigns
- `GET /social-ad-campaigns/:campaignId` - Get campaign details
- `PUT /social-ad-campaigns/:campaignId` - Update campaign
- `DELETE /social-ad-campaigns/:campaignId` - Delete campaign

## Meta Integration (Facebook/Instagram)

### Features Implemented
- OAuth2 authentication
- Account management
- Campaign creation and management
- Ad creation and management
- Performance analytics
- Targeting options
- Custom audience management

### API Endpoints Used
- Facebook Graph API v18.0
- OAuth endpoints for authentication
- Campaign and ad management endpoints
- Insights API for performance data

### Configuration
```env
META_CLIENT_ID=your_facebook_app_id
META_CLIENT_SECRET=your_facebook_app_secret
META_REDIRECT_URI=your_redirect_uri
META_API_VERSION=v18.0
```

## Usage Examples

### 1. Connect Facebook Account
```typescript
// Initiate OAuth flow
const { authUrl, state } = await socialMediaAuthService.initiateAuth(accountId, 'meta');

// User visits authUrl and authorizes
// Complete OAuth flow
const auth = await socialMediaAuthService.completeAuth(accountId, code, state);
```

### 2. Create Facebook Ad
```typescript
const ad = await socialAdService.createAd({
  userId: 'user-id',
  accountId: 'account-id',
  name: 'My Facebook Ad',
  objective: AdObjective.AWARENESS,
  adType: AdType.IMAGE,
  headline: 'Amazing Product',
  primaryText: 'Check out our amazing product!',
  callToAction: 'LEARN_MORE',
  linkUrl: 'https://example.com',
  budget: 100,
  creatives: [{
    type: 'image',
    mediaUrl: 'https://example.com/image.jpg',
    caption: 'Product image'
  }]
});
```

### 3. Create Campaign
```typescript
const campaign = await campaignService.createCampaign({
  userId: 'user-id',
  accountId: 'account-id',
  name: 'Summer Sale Campaign',
  objective: CampaignObjective.SALES,
  budgetType: BudgetType.DAILY,
  budget: 50,
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-30')
});
```

## Security Considerations

### Token Management
- Access tokens are encrypted and stored securely
- Automatic token refresh before expiration
- Token validation before API calls
- Secure token revocation

### Permission Management
- Granular permission tracking
- Platform-specific permission mapping
- Permission validation before operations

### Data Protection
- Sensitive data encryption
- Audit trails for all operations
- Secure API communication

## Extensibility

### Adding New Platforms
1. Create new provider class implementing `SocialMediaProvider` interface
2. Add platform type to `PlatformType` enum
3. Register provider in `SocialMediaProviderFactory`
4. Add platform configuration

### Adding New Features
1. Extend entity models as needed
2. Add new service methods
3. Create new API endpoints
4. Update documentation

## Performance Considerations

### Caching
- Platform data caching
- Performance data caching
- Token caching

### Rate Limiting
- Platform-specific rate limiting
- Request queuing
- Exponential backoff

### Monitoring
- API call monitoring
- Performance metrics
- Error tracking

## Future Enhancements

### Planned Features
- TikTok integration
- YouTube advertising
- Pinterest advertising
- Advanced analytics dashboard
- Automated optimization
- A/B testing framework
- Cross-platform campaign management

### Technical Improvements
- GraphQL API
- Real-time performance updates
- Advanced targeting options
- Machine learning optimization
- Bulk operations
- Advanced reporting

## Dependencies

### Required Packages
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/typeorm": "^10.0.0",
  "@nestjs/config": "^3.0.0",
  "typeorm": "^0.3.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0"
}
```

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=humanoid

# Meta/Facebook
META_CLIENT_ID=your_app_id
META_CLIENT_SECRET=your_app_secret
META_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
META_API_VERSION=v18.0

# LinkedIn (when implemented)
LINKEDIN_CLIENT_ID=your_linkedin_app_id
LINKEDIN_CLIENT_SECRET=your_linkedin_app_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback

# Twitter (when implemented)
TWITTER_CLIENT_ID=your_twitter_app_id
TWITTER_CLIENT_SECRET=your_twitter_app_secret
TWITTER_REDIRECT_URI=http://localhost:3000/auth/twitter/callback

# Snapchat (when implemented)
SNAPCHAT_CLIENT_ID=your_snapchat_app_id
SNAPCHAT_CLIENT_SECRET=your_snapchat_app_secret
SNAPCHAT_REDIRECT_URI=http://localhost:3000/auth/snapchat/callback
```

## Testing

### Unit Tests
- Service method testing
- Provider testing
- Entity validation testing

### Integration Tests
- API endpoint testing
- Database integration testing
- External API mocking

### E2E Tests
- Complete user workflows
- Cross-platform testing
- Performance testing

## Deployment

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Environment Setup
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run database migrations
4. Start the application: `npm run start:dev`

## Support

For questions or issues related to the Social Ads module:
1. Check the documentation
2. Review the API endpoints
3. Check the error logs
4. Contact the development team

## License

This module is part of the Humanoid project and follows the same licensing terms.
