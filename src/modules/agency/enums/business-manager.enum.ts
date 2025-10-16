/**
 * Business Manager related enums
 */

export enum BusinessManagerType {
  PARENT = 'parent', // Humanoid's main business manager (root level)
  CLIENT = 'client', // Client's business manager
  AGENCY = 'agency', // Agency business manager
}

export enum BusinessManagerStatus {
  PENDING = 'pending', // Awaiting connection
  CONNECTED = 'connected', // Active and connected
  DISCONNECTED = 'disconnected', // Connection lost
  VERIFICATION_REQUIRED = 'verification_required', // Needs verification
  ACCESS_REQUESTED = 'access_requested', // Access request sent
  ACCESS_GRANTED = 'access_granted', // Access granted
  ACCESS_DENIED = 'access_denied', // Access denied
  ERROR = 'error', // Error state
  SUSPENDED = 'suspended', // Temporarily suspended
}

export enum BusinessManagerRelationship {
  OWNED = 'owned', // Owned by Humanoid
  CLIENT = 'client', // Client relationship
  AGENCY = 'agency', // Agency partnership
  SHARED = 'shared', // Shared access
}

