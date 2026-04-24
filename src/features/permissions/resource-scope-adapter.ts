import type {
  ResourceScope,
  ResourceScopeMember,
  ResourceScopeMemberUpsertPayload,
  ResourceScopeOption,
  ScopePermission,
  ScopeAction,
} from '../../types/index.ts'

export function mapResourceScopesToOptions(scopes: ResourceScope[]): ResourceScopeOption[] {
  return scopes.map((scope) => ({
    id: String(scope.id),
    code: scope.scopeCode,
    label: scope.scopeName,
    type: scope.scopeType,
    status: scope.status,
  }))
}

export function getResourceScopeTypeLabel(type: string): string {
  if (type === 'RESOURCE') {
    return '维护域'
  }

  if (type === 'STANDARD') {
    return '共享域'
  }

  return type
}

export function getResourceScopeTypeHint(type: string): string {
  if (type === 'RESOURCE') {
    return '维护域可作为标准的维护域，用于控制创建、编辑、删除等维护权限。'
  }

  if (type === 'STANDARD') {
    return '共享域只能在标准的共享可见范围内使用，不能作为维护域选择。'
  }

  return ''
}

export function formatResourceScopeOptionLabel(scope: ResourceScopeOption): string {
  return `${scope.label}（${getResourceScopeTypeLabel(scope.type)}）`
}

export function filterOwnerScopeOptions(scopes: ResourceScopeOption[]): ResourceScopeOption[] {
  return scopes.filter((scope) => scope.type === 'RESOURCE')
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
