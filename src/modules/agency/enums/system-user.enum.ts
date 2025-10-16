/**
 * System User and Authentication enums
 */

export enum SystemUserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  PARTNER = 'partner',
}

export enum SystemUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  REVOKED = 'revoked',
}

export enum AuthTokenType {
  SYSTEM_USER = 'system_user', // Long-lived system user token
  USER_ACCESS = 'user_access', // User access token
  PAGE_ACCESS = 'page_access', // Page access token
  APP_ACCESS = 'app_access', // App access token
}

export enum AuthTokenStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  REFRESHING = 'refreshing',
}

