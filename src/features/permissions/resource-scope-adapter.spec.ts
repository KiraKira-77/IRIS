import { describe, expect, it } from 'vitest'
import {
  createResourceScopeMemberPayload,
  createUserResourceScopeMembershipPayload,
  filterGrantScopeOptions,
  filterOwnerScopeOptions,
  formatUserResourceScopeSummary,
  formatResourceScopeOptionLabel,
  mapResourceScopeMemberToActions,
  mapResourceScopeMemberToPermission,
  mapResourceScopesToOptions,
  mergeResourceScopeOptions,
  resolveResourceScopeOptions,
} from './resource-scope-adapter.ts'

describe('resource scope adapter', () => {
  it('maps resource scopes to selector options', () => {
    expect(
      mapResourceScopesToOptions([
        {
          id: '9001',
          tenantId: '1001',
          scopeCode: 'FINANCE',
          scopeName: 'Finance Scope',
          status: 1,
          remark: 'finance',
        },
      ]),
    ).toEqual([
      {
        id: '9001',
        code: 'FINANCE',
        label: 'Finance Scope',
        status: 1,
      },
    ])
  })

  it('maps member flags to actions', () => {
    expect(
      mapResourceScopeMemberToActions({
        id: '9101',
        scopeId: '9001',
        userId: '2001',
        account: 'admin',
        username: 'Platform Administrator',
        canView: 1,
        canCreate: 1,
        canEdit: 1,
        canDelete: 0,
        canManage: 1,
        remark: 'admin member',
      }),
    ).toEqual(['view', 'create', 'edit', 'manage'])
  })

  it('maps member permissions to scoped permission payload', () => {
    expect(
      mapResourceScopeMemberToPermission({
        id: '9106',
        scopeId: '9003',
        userId: '2004',
        account: 'auditor_1',
        username: 'Senior Auditor',
        canView: 1,
        canCreate: 0,
        canEdit: 0,
        canDelete: 0,
        canManage: 0,
        remark: 'readonly',
      }),
    ).toEqual({
      scopeId: '9003',
      actions: ['view'],
    })
  })

  it('expands manage permission when building member payload', () => {
    expect(
      createResourceScopeMemberPayload({
        userId: '2002',
        actions: ['manage'],
        remark: 'finance manager',
      }),
    ).toEqual({
      userId: '2002',
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canManage: true,
      remark: 'finance manager',
    })
  })

  it('expands manage permission when building user membership payload', () => {
    expect(
      createUserResourceScopeMembershipPayload({
        scopeId: '9001',
        actions: ['manage'],
        remark: 'finance manager',
      }),
    ).toEqual({
      scopeId: '9001',
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canManage: true,
      remark: 'finance manager',
    })
  })

  it('formats user resource scope membership summary', () => {
    expect(
      formatUserResourceScopeSummary(
        [
          {
            id: '9101',
            scopeId: '9001',
            userId: '2002',
            account: 'auditor',
            username: 'Auditor',
            canView: 1,
            canCreate: 0,
            canEdit: 0,
            canDelete: 0,
            canManage: 0,
          },
          {
            id: '9102',
            scopeId: '9002',
            userId: '2002',
            account: 'auditor',
            username: 'Auditor',
            canView: 1,
            canCreate: 1,
            canEdit: 1,
            canDelete: 0,
            canManage: 0,
          },
          {
            id: '9103',
            scopeId: '9003',
            userId: '2002',
            account: 'auditor',
            username: 'Auditor',
            canView: 1,
            canCreate: 1,
            canEdit: 1,
            canDelete: 1,
            canManage: 1,
          },
        ],
        [
          { id: '9001', tenantId: '1001', scopeCode: 'FIN', scopeName: '财务域', status: 1 },
          { id: '9002', tenantId: '1001', scopeCode: 'IT', scopeName: 'IT域', status: 1 },
          { id: '9003', tenantId: '1001', scopeCode: 'LEG', scopeName: '法务域', status: 1 },
        ],
      ),
    ).toBe('财务域、IT域 +1')
  })

  it('merges scope options with primary values taking precedence', () => {
    expect(
      mergeResourceScopeOptions(
        [{ id: '9001', code: 'FINANCE', label: 'Finance Scope', status: 1 }],
        [
          { id: '9001', code: 'FINANCE', label: '财务内控域', status: 1 },
          { id: '9002', code: 'IT', label: 'IT 信息内控域', status: 1 },
        ],
      ),
    ).toEqual([
      { id: '9001', code: 'FINANCE', label: 'Finance Scope', status: 1 },
      { id: '9002', code: 'IT', label: 'IT 信息内控域', status: 1 },
    ])
  })

  it('prefers live scope options over default fallback options', () => {
    expect(
      resolveResourceScopeOptions(
        [
          { id: '9201', code: 'FINANCE', label: '财务内控域', status: 1 },
          { id: '9202', code: 'IT', label: 'IT 信息内控域', status: 1 },
        ],
        [
          { id: '9001', code: 'FINANCE', label: '财务内控域', status: 1 },
          { id: '9002', code: 'IT', label: 'IT 信息内控域', status: 1 },
          { id: '9003', code: 'COMPLIANCE', label: '内控合规域', status: 1 },
        ],
      ),
    ).toEqual([
      { id: '9201', code: 'FINANCE', label: '财务内控域', status: 1 },
      { id: '9202', code: 'IT', label: 'IT 信息内控域', status: 1 },
    ])
  })

  it('keeps all scopes available in owner scope options', () => {
    expect(
      filterOwnerScopeOptions([
        { id: '9001', code: 'FINANCE', label: '财务内控域', status: 1 },
        { id: '9008', code: 'SHARED', label: '专家共享域', status: 1 },
      ]),
    ).toEqual([
      { id: '9001', code: 'FINANCE', label: '财务内控域', status: 1 },
      { id: '9008', code: 'SHARED', label: '专家共享域', status: 1 },
    ])
  })

  it('keeps all other scopes available in grant scope options', () => {
    expect(
      filterGrantScopeOptions(
        [
          { id: '9001', code: 'FINANCE', label: '财务内控域', status: 1 },
          { id: '9002', code: 'IT', label: 'IT 内控域', status: 1 },
          { id: '9008', code: 'SHARED', label: '专家共享域', status: 1 },
          { id: '9009', code: 'LEGAL', label: '法务共享域', status: 1 },
        ],
        '9001',
      ),
    ).toEqual([
      { id: '9002', code: 'IT', label: 'IT 内控域', status: 1 },
      { id: '9008', code: 'SHARED', label: '专家共享域', status: 1 },
      { id: '9009', code: 'LEGAL', label: '法务共享域', status: 1 },
    ])
  })

  it('formats scope option labels without type names', () => {
    expect(
      formatResourceScopeOptionLabel({
        id: '9008',
        code: 'SHARED',
        label: '专家共享域',
        status: 1,
      }),
    ).toBe('专家共享域')
  })
})
