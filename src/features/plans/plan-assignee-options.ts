import type { ResourceScopeMember, SystemUser } from '@/types'

const SUPER_ADMIN_ROLE_CODES = new Set(['PLATFORM_ADMIN', 'SUPER_ADMIN'])

export function resolvePlanAssigneeScopeIds(
  ownerScopeId?: string,
  grantScopeIds: string[] = [],
): string[] {
  return Array.from(new Set([ownerScopeId, ...grantScopeIds].filter((id): id is string => Boolean(id))))
}

export function isSuperAdminUser(user: Pick<SystemUser, 'account' | 'roleCodes'>): boolean {
  if (user.account.trim().toLowerCase() === 'admin') {
    return true
  }

  return (user.roleCodes || []).some((roleCode) =>
    SUPER_ADMIN_ROLE_CODES.has(roleCode.trim().toUpperCase()),
  )
}

export function filterPlanAssigneeUsers(
  users: SystemUser[],
  scopeMembers: ResourceScopeMember[],
): SystemUser[] {
  const memberUserIds = new Set(scopeMembers.map((member) => String(member.userId)))

  return users.filter(
    (user) => user.status === 1 && !isSuperAdminUser(user) && memberUserIds.has(String(user.id)),
  )
}
