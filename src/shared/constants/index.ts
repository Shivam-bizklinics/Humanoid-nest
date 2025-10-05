export const MODULE_NAMES = {
  AUTHENTICATION: 'authentication',
  RBAC: 'rbac',
  WORKSPACES: 'workspaces',
  CAMPAIGNS: 'campaigns',
  DESIGNER: 'designer',
  PUBLISHER: 'publisher',
  APPROVAL_WORKFLOW: 'approval-workflow',
} as const;

export const ENTITY_NAMES = {
  USER: 'user',
  ROLE: 'role',
  PERMISSION: 'permission',
  WORKSPACE: 'workspace',
  CAMPAIGN: 'campaign',
  DESIGN: 'design',
  PUBLICATION: 'publication',
  APPROVAL: 'approval',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
