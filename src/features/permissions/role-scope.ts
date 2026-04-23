export const ROLE_SCOPE_TYPE = {
  global: 'GLOBAL',
  business: 'BUSINESS',
} as const

export function normalizeRoleScopeType(scopeType: string) {
  const normalized = scopeType.trim().toUpperCase()

  if (normalized === 'PLATFORM' || normalized === ROLE_SCOPE_TYPE.global) {
    return ROLE_SCOPE_TYPE.global
  }

  if (normalized === 'TENANT' || normalized === ROLE_SCOPE_TYPE.business) {
    return ROLE_SCOPE_TYPE.business
  }

  return normalized
}

export function getRoleScopeTypeLabel(scopeType: string) {
  switch (normalizeRoleScopeType(scopeType)) {
    case ROLE_SCOPE_TYPE.global:
      return '全局级'
    case ROLE_SCOPE_TYPE.business:
      return '业务级'
    default:
      return scopeType
  }
}
