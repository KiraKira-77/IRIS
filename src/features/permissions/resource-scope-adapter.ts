import type {
  ResourceScope,
  ResourceScopeMember,
  ResourceScopeMemberUpsertPayload,
  ResourceScopeOption,
  ScopeAction,
  ScopePermission,
  UserResourceScopeMembershipUpsertPayload,
} from '../../types/index.ts'

export function mapResourceScopesToOptions(scopes: ResourceScope[]): ResourceScopeOption[] {
  return scopes.map((scope) => ({
    id: String(scope.id),
    code: scope.scopeCode,
    label: scope.scopeName,
    status: scope.status,
  }))
}

export function formatResourceScopeOptionLabel(scope: ResourceScopeOption): string {
  return scope.label
}

export function filterOwnerScopeOptions(scopes: ResourceScopeOption[]): ResourceScopeOption[] {
  return [...scopes]
}

export function filterGrantScopeOptions(
  scopes: ResourceScopeOption[],
  ownerScopeId?: string,
): ResourceScopeOption[] {
  return scopes.filter((scope) => scope.id !== ownerScopeId)
}

export function mapResourceScopeMemberToActions(member: ResourceScopeMember): ScopeAction[] {
  const actions: ScopeAction[] = []

  if (member.canView) actions.push('view')
  if (member.canCreate) actions.push('create')
  if (member.canEdit) actions.push('edit')
  if (member.canDelete) actions.push('delete')
  if (member.canManage) actions.push('manage')

  return actions
}

export function mapResourceScopeMemberToPermission(
  member: ResourceScopeMember,
): ScopePermission | null {
  const actions = mapResourceScopeMemberToActions(member)

  if (!actions.length) {
    return null
  }

  return {
    scopeId: String(member.scopeId),
    actions,
  }
}

export function createResourceScopeMemberPayload(input: {
  userId: string
  actions: ScopeAction[]
  remark?: string
}): ResourceScopeMemberUpsertPayload {
  const actions = new Set(input.actions)

  return {
    userId: input.userId,
    canView: actions.has('view') || actions.has('manage'),
    canCreate: actions.has('create') || actions.has('manage'),
    canEdit: actions.has('edit') || actions.has('manage'),
    canDelete: actions.has('delete') || actions.has('manage'),
    canManage: actions.has('manage'),
    remark: input.remark,
  }
}

export function createUserResourceScopeMembershipPayload(input: {
  scopeId: string
  actions: ScopeAction[]
  remark?: string
}): UserResourceScopeMembershipUpsertPayload {
  const actions = new Set(input.actions)

  return {
    scopeId: input.scopeId,
    canView: actions.has('view') || actions.has('manage'),
    canCreate: actions.has('create') || actions.has('manage'),
    canEdit: actions.has('edit') || actions.has('manage'),
    canDelete: actions.has('delete') || actions.has('manage'),
    canManage: actions.has('manage'),
    remark: input.remark,
  }
}

export function formatUserResourceScopeSummary(
  memberships: ResourceScopeMember[],
  scopes: ResourceScope[],
  visibleCount = 2,
): string {
  if (memberships.length === 0) {
    return '未配置'
  }

  const scopeNameMap = new Map(scopes.map((scope) => [scope.id, scope.scopeName]))
  const labels = memberships.map((membership) => scopeNameMap.get(membership.scopeId) || membership.scopeId)
  const visibleLabels = labels.slice(0, visibleCount)
  const remainingCount = labels.length - visibleLabels.length

  return remainingCount > 0 ? `${visibleLabels.join('、')} +${remainingCount}` : visibleLabels.join('、')
}

export function mergeResourceScopeOptions(
  primary: ResourceScopeOption[],
  fallback: ResourceScopeOption[] = [],
): ResourceScopeOption[] {
  const merged = new Map<string, ResourceScopeOption>()

  for (const option of fallback) {
    merged.set(option.id, option)
  }

  for (const option of primary) {
    merged.set(option.id, option)
  }

  return Array.from(merged.values())
}

export function resolveResourceScopeOptions(
  primary: ResourceScopeOption[],
  fallback: ResourceScopeOption[] = [],
): ResourceScopeOption[] {
  return primary.length > 0 ? primary : [...fallback]
}
