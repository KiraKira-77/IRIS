import type {
  ControlPlan,
  ResourceScope,
  ScopeAction,
  ScopeGrant,
  ScopePermission,
  UserAccessContext,
} from '../../types/index.ts'

export type PlanAccessContext = UserAccessContext

export interface PlanAccessState {
  canView: boolean
  canEdit: boolean
  canSubmit: boolean
  canDelete: boolean
  canCreateChild: boolean
  canManage: boolean
}

export function filterVisiblePlans(
  plans: ControlPlan[],
  context: PlanAccessContext,
): ControlPlan[] {
  return plans.filter((plan) => buildPlanAccessState(plan, context).canView)
}

export function filterEditablePlanOwnerScopes(
  scopes: ResourceScope[],
  context: PlanAccessContext,
): ResourceScope[] {
  const activeScopes = scopes.filter((scope) => scope.status === 1)
  if (context.isSuperAdmin) {
    return activeScopes
  }
  return activeScopes.filter((scope) => hasOwnerEditAccess(context, scope.id))
}

export function buildPlanAccessState(
  plan: ControlPlan,
  context: PlanAccessContext,
): PlanAccessState {
  const canEditByLifecycle =
    plan.status === 'draft' || plan.status === 'approved' || plan.status === 'in_progress'
  const canSubmitByLifecycle = plan.status === 'draft'
  const canCreateChildByLifecycle = !plan.parentId && canEditByLifecycle && plan.status !== 'draft'

  if (context.isSuperAdmin) {
    return {
      canView: true,
      canEdit: canEditByLifecycle,
      canSubmit: canSubmitByLifecycle,
      canDelete: true,
      canCreateChild: canCreateChildByLifecycle,
      canManage: true,
    }
  }

  const canManage = hasOwnerAction(context, plan.ownerScopeId, 'manage')
  const hasEdit = hasOwnerEditAccess(context, plan.ownerScopeId)

  return {
    canView: canViewPlan(plan, context),
    canEdit: hasEdit && canEditByLifecycle,
    canSubmit: hasEdit && canSubmitByLifecycle,
    canDelete: hasEdit,
    canCreateChild: hasEdit && canCreateChildByLifecycle,
    canManage,
  }
}

function canViewPlan(plan: ControlPlan, context: PlanAccessContext): boolean {
  if (hasOwnerAnyAccess(context, plan.ownerScopeId)) {
    return true
  }

  return (plan.grants || []).some((grant) => hasGrantAccess(context, grant, 'view'))
}

function hasOwnerEditAccess(context: PlanAccessContext, scopeId: string): boolean {
  return hasOwnerAction(context, scopeId, 'edit') || hasOwnerAction(context, scopeId, 'manage')
}

function hasOwnerAction(
  context: PlanAccessContext,
  scopeId: string,
  action: ScopeAction,
): boolean {
  const membership = findScopeMembership(context, scopeId)
  return membership ? includesAction(membership.actions, action) : false
}

function hasOwnerAnyAccess(context: PlanAccessContext, scopeId: string): boolean {
  const membership = findScopeMembership(context, scopeId)
  return Boolean(membership?.actions.length)
}

function hasGrantAccess(
  context: PlanAccessContext,
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
  context: PlanAccessContext,
  scopeId: string,
): ScopePermission | undefined {
  return context.scopePermissions.find((entry) => entry.scopeId === scopeId)
}

function includesAction(actions: ScopeAction[], action: ScopeAction): boolean {
  return actions.includes(action) || actions.includes('manage')
}
