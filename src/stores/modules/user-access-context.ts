import type { AuthCurrentUser, ResourceScopeMember, UserAccessContext } from '@/types'
import { buildAccessContextFromScopeMembers } from '@/features/permissions/user-access'

export function resolveCurrentUserAccessContext(
  currentUser: AuthCurrentUser,
  memberships: ResourceScopeMember[],
): UserAccessContext {
  return buildAccessContextFromScopeMembers(currentUser.roles, memberships)
}
