import type {
  ControlChecklist,
  ScopeAction,
  ScopeGrant,
  ScopePermission,
  UserAccessContext,
} from '../../types/index.ts'

export type ChecklistAccessContext = UserAccessContext

export interface ChecklistAccessState {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canManage: boolean
}

export function filterVisibleChecklists(
  checklists: ControlChecklist[],
  context: ChecklistAccessContext,
): ControlChecklist[] {
  return checklists.filter((checklist) => buildChecklistAccessState(checklist, context).canView)
}

export function buildChecklistAccessState(
  checklist: ControlChecklist,
  context: ChecklistAccessContext,
): ChecklistAccessState {
  if (context.isSuperAdmin) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canManage: true,
    }
  }

  const canManage = hasOwnerAction(context, checklist.ownerScopeId, 'manage')
  const canCreate = canManage || hasOwnerAction(context, checklist.ownerScopeId, 'create')
  const canEdit = canManage || hasOwnerAction(context, checklist.ownerScopeId, 'edit')
  const canDelete = canManage || hasOwnerAction(context, checklist.ownerScopeId, 'delete')

  return {
    canView: canViewChecklist(checklist, context),
    canCreate,
    canEdit,
    canDelete,
    canManage,
  }
}

function canViewChecklist(
  checklist: ControlChecklist,
  context: ChecklistAccessContext,
): boolean {
  if (hasOwnerAnyAccess(context, checklist.ownerScopeId)) {
    return true
  }

  return checklist.grants.some((grant) => hasGrantAccess(context, grant, 'view'))
}

function hasOwnerAction(
  context: ChecklistAccessContext,
  scopeId: string,
  action: ScopeAction,
): boolean {
  const membership = findScopeMembership(context, scopeId)
  return membership ? includesAction(membership.actions, action) : false
}

function hasOwnerAnyAccess(context: ChecklistAccessContext, scopeId: string): boolean {
  const membership = findScopeMembership(context, scopeId)
  return Boolean(membership?.actions.length)
}

function hasGrantAccess(
  context: ChecklistAccessContext,
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
  context: ChecklistAccessContext,
  scopeId: string,
): ScopePermission | undefined {
  return context.scopePermissions.find((entry) => entry.scopeId === scopeId)
}

function includesAction(actions: ScopeAction[], action: ScopeAction): boolean {
  return actions.includes(action) || actions.includes('manage')
}
