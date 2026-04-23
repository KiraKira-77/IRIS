import { describe, expect, it } from 'vitest'
import type { AuthCurrentUser, ResourceScopeMember } from '@/types'
import { resolveCurrentUserAccessContext } from './user-access-context.ts'

describe('resolveCurrentUserAccessContext', () => {
  it('builds current user scope permissions from current-user memberships', () => {
    const currentUser: AuthCurrentUser = {
      userId: 2047157959175438300,
      tenantId: 1001,
      username: '00320283',
      displayName: '财务管理员',
      tenantName: 'Default Tenant',
      roles: ['AUDITOR'],
    }

    const memberships: ResourceScopeMember[] = [
      {
        id: '9104',
        scopeId: '9001',
        userId: '2047157959175438300',
        account: '00320283',
        username: '财务管理员',
        canView: 1,
        canCreate: 1,
        canEdit: 1,
        canDelete: 0,
        canManage: 0,
        remark: 'finance member',
      },
    ]

    expect(resolveCurrentUserAccessContext(currentUser, memberships)).toEqual({
      isSuperAdmin: false,
      scopePermissions: [
        {
          scopeId: '9001',
          actions: ['view', 'create', 'edit'],
        },
      ],
    })
  })
})
