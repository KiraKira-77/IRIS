import type {
  AuthCurrentUser,
  ResourceScopeMember,
  ResourceScopeOption,
  ScopePermission,
  UserAccessContext,
  UserInfo,
} from '../../types/index.ts'
import { buildMenuCodesFromRoles } from './menu-access.ts'
import { mapResourceScopeMemberToPermission } from './resource-scope-adapter.ts'

export const STANDARD_SCOPE_IDS = {
  finance: '9001',
  it: '9002',
  compliance: '9003',
} as const

export const DEFAULT_RESOURCE_SCOPE_OPTIONS: ResourceScopeOption[] = [
  {
    id: STANDARD_SCOPE_IDS.finance,
    code: 'FINANCE',
    label: '财务内控域',
    type: 'RESOURCE',
    status: 1,
  },
  {
    id: STANDARD_SCOPE_IDS.it,
    code: 'IT',
    label: 'IT 信息内控域',
    type: 'RESOURCE',
    status: 1,
  },
  {
    id: STANDARD_SCOPE_IDS.compliance,
    code: 'COMPLIANCE',
    label: '内控合规域',
    type: 'RESOURCE',
    status: 1,
  },
]

export function buildLocalAccessContext(roles: string[]): UserAccessContext {
  const normalizedRoles = roles.map((role) => role.toUpperCase())

  if (normalizedRoles.includes('PLATFORM_ADMIN') || normalizedRoles.includes('SUPER_ADMIN')) {
    return {
      isSuperAdmin: true,
      scopePermissions: [],
    }
  }

  return {
    isSuperAdmin: false,
    scopePermissions: [],
  }
}

export function mapCurrentUserToUserInfo(
  currentUser: AuthCurrentUser,
  accessContext = buildLocalAccessContext(currentUser.roles),
  menuCodes = buildMenuCodesFromRoles(currentUser.roles),
): UserInfo {
  const permissions = currentUser.roles.includes('PLATFORM_ADMIN') ? ['*'] : []

  return {
    id: String(currentUser.userId),
    tenantId: currentUser.tenantId,
    username: currentUser.username,
    name: currentUser.displayName || currentUser.username,
    avatar: '',
    department: currentUser.tenantName || '',
    email: '',
    phone: '',
    roles: currentUser.roles,
    menuCodes,
    permissions,
    accessContext,
  }
}

export function buildAccessContextFromScopeMembers(
  roles: string[],
  members: ResourceScopeMember[],
): UserAccessContext {
  const localContext = buildLocalAccessContext(roles)

  if (localContext.isSuperAdmin) {
    return localContext
  }

  const memberContext: UserAccessContext = {
    isSuperAdmin: false,
    scopePermissions: members
      .map((member) => mapResourceScopeMemberToPermission(member))
      .filter((permission): permission is ScopePermission => Boolean(permission)),
  }

  return mergeAccessContexts(localContext, memberContext)
}

export function mergeAccessContexts(
  base: UserAccessContext,
  incoming: UserAccessContext,
): UserAccessContext {
  if (base.isSuperAdmin || incoming.isSuperAdmin) {
    return {
      isSuperAdmin: true,
      scopePermissions: [],
    }
  }

  const merged = new Map<string, Set<ScopePermission['actions'][number]>>()

  for (const permission of [...base.scopePermissions, ...incoming.scopePermissions]) {
    const actions = merged.get(permission.scopeId) || new Set<ScopePermission['actions'][number]>()
    for (const action of permission.actions) {
      actions.add(action)
    }
    merged.set(permission.scopeId, actions)
  }

  return {
    isSuperAdmin: false,
    scopePermissions: Array.from(merged.entries()).map(([scopeId, actions]) => ({
      scopeId,
      actions: Array.from(actions),
    })),
  }
}
