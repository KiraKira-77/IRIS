import type {
  ScopeAction,
  ScopeGrant,
  ScopePermission,
  Standard,
  UserAccessContext,
} from '../../types/index.ts'

export type StandardAccessContext = UserAccessContext

export interface StandardAccessState {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManage: boolean
}

export function filterVisibleStandards(
  standards: Standard[],
  context: StandardAccessContext,
): Standard[] {
  return standards.filter((standard) => buildStandardAccessState(standard, context).canView)
}

export function buildStandardAccessState(
  standard: Standard,
  context: StandardAccessContext,
): StandardAccessState {
  const canDeleteByLifecycle = standard.status === 'draft'

  if (context.isSuperAdmin) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: canDeleteByLifecycle,
      canManage: true,
    }
  }

  const canManage = hasOwnerAction(context, standard.ownerScopeId, 'manage')
  const canCreate = canManage || hasOwnerAction(context, standard.ownerScopeId, 'create')
  const canEdit =
    (canManage || hasOwnerAction(context, standard.ownerScopeId, 'edit')) &&
    standard.status !== 'archived'
  const canDelete =
    (canManage || hasOwnerAction(context, standard.ownerScopeId, 'delete')) && canDeleteByLifecycle

  return {
    canView: canViewStandard(standard, context),
    canCreate,
    canEdit,
    canDelete,
    canManage,
  }
}

function canViewStandard(standard: Standard, context: StandardAccessContext): boolean {
  if (standard.visibilityLevel === 'PUBLIC') {
    return true
  }

  if (hasOwnerAnyAccess(context, standard.ownerScopeId)) {
    return true
  }

  return standard.grants.some((grant) => hasGrantAccess(context, grant, 'view'))
}

function hasOwnerAction(
  context: StandardAccessContext,
  scopeId: string,
  action: ScopeAction,
): boolean {
  const membership = findScopeMembership(context, scopeId)
  return membership ? includesAction(membership.actions, action) : false
}

function hasOwnerAnyAccess(context: StandardAccessContext, scopeId: string): boolean {
  const membership = findScopeMembership(context, scopeId)
  return Boolean(membership?.actions.length)
}

function hasGrantAccess(
  context: StandardAccessContext,
  grant: ScopeGrant,
  action: ScopeAction,
): boolean {
  if (!includesAction(grant.actions, action)) {
    return false
  }

  const membership = findScopeMembership(context, grant.scopeId)
  return membership ? includesAction(membership.actions, action) : false
}

function findScopeMembership(
  context: StandardAccessContext,
  scopeId: string,
): ScopePermission | undefined {
  return context.scopePermissions.find((entry) => entry.scopeId === scopeId)
}

function includesAction(actions: ScopeAction[], action: ScopeAction): boolean {
  return actions.includes(action) || actions.includes('manage')
}
