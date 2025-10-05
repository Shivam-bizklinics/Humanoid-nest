export enum Action {
  CREATE = 'create',
  UPDATE = 'update',
  VIEW = 'view',
  DELETE = 'delete',
  APPROVE = 'approve',
  UPLOAD = 'upload',
}

export enum ActionDisplayName {
  CREATE = 'Create',
  UPDATE = 'Update',
  VIEW = 'View',
  DELETE = 'Delete',
  APPROVE = 'Approve',
  UPLOAD = 'Upload',
}

export const ACTION_CONFIG = {
  [Action.CREATE]: {
    displayName: ActionDisplayName.CREATE,
    description: 'Create new resources',
    icon: 'add',
    color: '#10B981',
    verb: 'create',
    pastTense: 'created',
  },
  [Action.UPDATE]: {
    displayName: ActionDisplayName.UPDATE,
    description: 'Modify existing resources',
    icon: 'edit',
    color: '#3B82F6',
    verb: 'update',
    pastTense: 'updated',
  },
  [Action.VIEW]: {
    displayName: ActionDisplayName.VIEW,
    description: 'View and read resources',
    icon: 'visibility',
    color: '#6B7280',
    verb: 'view',
    pastTense: 'viewed',
  },
  [Action.DELETE]: {
    displayName: ActionDisplayName.DELETE,
    description: 'Remove resources',
    icon: 'delete',
    color: '#EF4444',
    verb: 'delete',
    pastTense: 'deleted',
  },
  [Action.APPROVE]: {
    displayName: ActionDisplayName.APPROVE,
    description: 'Approve resources for publication',
    icon: 'check_circle',
    color: '#059669',
    verb: 'approve',
    pastTense: 'approved',
  },
  [Action.UPLOAD]: {
    displayName: ActionDisplayName.UPLOAD,
    description: 'Upload resources',
    icon: 'upload',
    color: '#10B981',
    verb: 'upload',
    pastTense: 'uploaded',
  },
} as const;

export type ActionConfig = typeof ACTION_CONFIG[Action];
