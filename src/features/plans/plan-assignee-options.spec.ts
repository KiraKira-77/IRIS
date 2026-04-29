import { describe, expect, it } from 'vitest'
import type { ResourceScopeMember, SystemUser } from '@/types'
import { filterPlanAssigneeUsers, resolvePlanAssigneeScopeIds } from './plan-assignee-options'

const user = (id: string, roleCodes: string[] = []): SystemUser => ({
  id,
  tenantId: '1001',
  account: `u${id}`,
  username: `User ${id}`,
  status: 1,
  roleIds: [],
  roleCodes,
})

const member = (scopeId: string, userId: string): ResourceScopeMember => ({
  id: `${scopeId}-${userId}`,
  scopeId,
  userId,
  account: `u${userId}`,
  username: `User ${userId}`,
  canView: 1,
  canCreate: 0,
  canEdit: 0,
  canDelete: 0,
  canManage: 0,
})

describe('plan assignee options', () => {
  it('uses the plan owner scope and shared scopes as assignable scopes', () => {
    expect(resolvePlanAssigneeScopeIds('9001', ['9002', '9001', '', '9003'])).toEqual([
      '9001',
      '9002',
      '9003',
    ])
  })

  it('allows only non-admin members of the assignable plan scopes', () => {
    const users = [
      user('1', ['PLATFORM_ADMIN']),
      user('2'),
      user('3'),
      user('4', ['NORMAL_USER']),
      user('5', ['SUPER_ADMIN']),
      { ...user('6'), account: 'admin' },
    ]

    const filtered = filterPlanAssigneeUsers(users, [
      member('9001', '1'),
      member('9001', '2'),
      member('9002', '3'),
      member('9002', '5'),
      member('9002', '6'),
    ])

    expect(filtered.map((item) => item.id)).toEqual(['2', '3'])
  })
})
