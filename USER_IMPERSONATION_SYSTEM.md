# User Impersonation System

## Overview

The User Impersonation System allows authorized users to impersonate other users and work on their behalf. This is particularly useful for customer support, debugging, and administrative tasks.

## Features

- **Secure Impersonation**: Only users with `user.impersonate` permission can impersonate others
- **Session Tracking**: All impersonation sessions are tracked with timestamps, reasons, and metadata
- **Context Preservation**: The system maintains impersonation context throughout the session
- **Automatic Expiration**: Sessions can be set to expire automatically
- **Audit Trail**: Complete history of all impersonation activities
- **Workspace-Specific**: Impersonation can be limited to specific workspaces

## Architecture

### Components

1. **ImpersonationSession Entity**: Tracks impersonation sessions in the database
2. **ImpersonationService**: Core business logic for managing impersonation
3. **ImpersonationController**: REST API endpoints for impersonation operations
4. **AuthService Integration**: Modified to return impersonated user context
5. **Permission System**: Uses `user.impersonate` permission for authorization

### Database Schema

```sql
CREATE TABLE impersonation_sessions (
  id UUID PRIMARY KEY,
  impersonator_id UUID NOT NULL,
  impersonated_user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  expires_at TIMESTAMP,
  reason TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  created_by UUID,
  updated_by UUID
);
```

## API Endpoints

### Start Impersonation

```http
POST /impersonation/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "impersonatedUserId": "user-uuid-here",
  "reason": "Customer support request #1234",
  "expiresAt": "2024-01-01T12:00:00Z",
  "workspaceId": "workspace-uuid-here",
  "permissions": ["workspace.view", "workspace.update"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "impersonatorId": "impersonator-uuid",
    "impersonatedUserId": "impersonated-user-uuid",
    "status": "active",
    "startedAt": "2024-01-01T10:00:00Z",
    "reason": "Customer support request #1234"
  },
  "message": "Impersonation started successfully"
}
```

### Stop Impersonation

```http
POST /impersonation/stop/{sessionId}
Authorization: Bearer <token>
```

### Get Active Session

```http
GET /impersonation/active
Authorization: Bearer <token>
```

### Get Impersonatable Users

```http
GET /impersonation/users
Authorization: Bearer <token>
```

### Get Impersonation History

```http
GET /impersonation/history?limit=50
Authorization: Bearer <token>
```

### Check Permissions

```http
POST /impersonation/check-permissions
Authorization: Bearer <token>
```

## How It Works

### 1. Permission Assignment

First, assign the impersonation permission to a user:

```typescript
// Assign user.impersonate permission to a user in a workspace
await userWorkspacePermissionService.assignPermission({
  userId: 'admin-user-id',
  workspaceId: 'workspace-id',
  resource: Resource.USER,
  action: Action.IMPERSONATE
}, 'assigner-user-id');
```

### 2. Starting Impersonation

When a user with impersonation permissions starts impersonating another user:

1. The system checks if the user has `user.impersonate` permission
2. Validates that the target user exists and is active
3. Prevents self-impersonation
4. Creates a new impersonation session record
5. Returns session details

### 3. User Context Switching

When an impersonated user makes API calls:

1. The `AuthService.getUserFromToken()` method checks for active impersonation
2. If impersonation is active, it returns the impersonated user's data
3. The impersonation context is preserved in the user object:
   ```typescript
   {
     // Impersonated user data
     id: "impersonated-user-id",
     email: "impersonated@example.com",
     // ... other user fields
     
     // Impersonation metadata
     _impersonationContext: {
       isImpersonated: true,
       impersonator: { /* impersonator user object */ },
       sessionId: "session-uuid",
       startedAt: "2024-01-01T10:00:00Z"
     }
   }
   ```

### 4. Ending Impersonation

When impersonation is ended:

1. The session status is updated to "ended"
2. The `endedAt` timestamp is set
3. Future API calls will return the original user's context

## Security Considerations

### Access Control

- Only users with `user.impersonate` permission can start impersonation
- Users can only end their own impersonation sessions (unless they have admin permissions)
- Self-impersonation is prevented

### Audit Trail

- All impersonation sessions are logged with timestamps
- Reasons for impersonation should be provided
- Session metadata includes IP address and user agent (when available)

### Session Management

- Sessions can be set to expire automatically
- Only one active session per impersonator at a time
- Sessions can be manually ended by the impersonator or admin

## Usage Examples

### Customer Support Scenario

```typescript
// 1. Customer support agent starts impersonating a customer
const session = await impersonationService.startImpersonation('support-agent-id', {
  impersonatedUserId: 'customer-id',
  reason: 'Customer reported login issues - investigating account access',
  expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
});

// 2. Agent now makes API calls as the customer
// All subsequent requests will return customer's user context
// until impersonation is ended

// 3. Agent ends impersonation when investigation is complete
await impersonationService.endImpersonation(session.id, 'support-agent-id');
```

### Administrative Tasks

```typescript
// Admin user impersonating another user to perform tasks on their behalf
const session = await impersonationService.startImpersonation('admin-id', {
  impersonatedUserId: 'target-user-id',
  reason: 'Performing account migration tasks',
  workspaceId: 'specific-workspace-id',
  permissions: ['workspace.view', 'workspace.update', 'campaign.create']
});
```

## Configuration

### Environment Variables

No additional environment variables are required. The system uses existing JWT and database configurations.

### Database Migration

The `ImpersonationSession` entity will be automatically created when the application starts (in development mode with `synchronize: true`).

## Monitoring and Alerts

### Recommended Monitoring

1. **Active Sessions**: Monitor the number of active impersonation sessions
2. **Session Duration**: Track how long impersonation sessions last
3. **Failed Attempts**: Monitor failed impersonation attempts
4. **Permission Changes**: Alert when impersonation permissions are granted/revoked

### Logging

All impersonation activities are logged with:
- User IDs (impersonator and impersonated)
- Timestamps
- Reasons
- Session metadata
- IP addresses and user agents

## Best Practices

1. **Always provide a reason** for impersonation
2. **Set reasonable expiration times** for sessions
3. **Monitor active sessions** regularly
4. **End sessions promptly** when tasks are complete
5. **Use workspace-specific impersonation** when possible
6. **Regularly audit** impersonation permissions
7. **Train users** on proper impersonation procedures

## Troubleshooting

### Common Issues

1. **"Cannot impersonate yourself"**: The system prevents self-impersonation
2. **"Insufficient permissions"**: User needs `user.impersonate` permission
3. **"User not found"**: Target user doesn't exist or is inactive
4. **"Active session exists"**: User already has an active impersonation session

### Debug Information

The system provides detailed error messages and logging to help troubleshoot issues. Check the application logs for specific error details.

## Future Enhancements

Potential improvements to consider:

1. **Role-based impersonation limits**: Restrict which users can be impersonated
2. **Notification system**: Notify users when they're being impersonated
3. **Advanced metadata**: Store more detailed session information
4. **Bulk operations**: Support for multiple concurrent impersonations
5. **Integration hooks**: Events for when impersonation starts/ends
6. **Enhanced security**: Two-factor authentication for impersonation
