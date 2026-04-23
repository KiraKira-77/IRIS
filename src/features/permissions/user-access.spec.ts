import { describe, expect, it } from 'vitest'
import {
  buildAccessContextFromScopeMembers,
  buildLocalAccessContext,
  mapCurrentUserToUserInfo,
  STANDARD_SCOPE_IDS,
} from './user-access.ts'
import type { AuthCurrentUser } from '../../types/index.ts'

const baseUser: AuthCurrentUser = {
  userId: 2001,
  tenantId: 1001,
  username: 'auditor',
  displayName: '审计员',
  tenantName: 'IRIS',
  roles: ['AUDITOR'],
}

describe('user access', () => {
  it('treats super admin as full access context', () => {
    const context = buildLocalAccessContext(['SUPER_ADMIN'])
    expect(context).toEqual({
      isSuperAdmin: true,
      scopePermissions: [],
    })
  })

  it('does not derive scoped permissions from non-super roles', () => {
    const context = buildLocalAccessContext(['ADMIN'])
    expect(context).toEqual({
      isSuperAdmin: false,
      scopePermissions: [],
    })
  })

  it('maps current user without role-derived data scope permissions', () => {
    const userInfo = mapCurrentUserToUserInfo(baseUser)
    expect(userInfo.tenantId).toBe(1001)
    expect(userInfo.accessContext).toEqual({
      isSuperAdmin: false,
      scopePermissions: [],
    })
  })

  it('builds scoped permissions only from resource scope members', () => {
    expect(
      buildAccessContextFromScopeMembers(['AUDITOR'], [
        {
          id: '9104',
          scopeId: '9001',
          userId: '2004',
          account: 'auditor_1',
          username: 'Senior Auditor',
          canView: 1,
          canCreate: 0,
          canEdit: 0,
          canDelete: 0,
          canManage: 0,
          remark: 'finance readonly',
        },
      ]),
    ).toEqual({
      isSuperAdmin: false,
      scopePermissions: [
        {
          scopeId: STANDARD_SCOPE_IDS.finance,
          actions: ['view'],
        },
      ],
    })
  })
})
