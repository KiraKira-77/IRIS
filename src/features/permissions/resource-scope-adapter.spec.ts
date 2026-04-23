import { describe, expect, it } from 'vitest'
import {
  createResourceScopeMemberPayload,
  filterGrantScopeOptions,
  filterOwnerScopeOptions,
  formatResourceScopeOptionLabel,
  getResourceScopeTypeHint,
  getResourceScopeTypeLabel,
  mapResourceScopeMemberToActions,
  mapResourceScopeMemberToPermission,
  mapResourceScopesToOptions,
  mergeResourceScopeOptions,
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
          scopeType: 'RESOURCE',
          status: 1,
          remark: 'finance',
        },
      ]),
    ).toEqual([
      {
        id: '9001',
        code: 'FINANCE',
        label: 'Finance Scope',
        type: 'RESOURCE',
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

  it('merges scope options with primary values taking precedence', () => {
    expect(
      mergeResourceScopeOptions(
        [{ id: '9001', code: 'FINANCE', label: 'Finance Scope', type: 'RESOURCE', status: 1 }],
        [
          { id: '9001', code: 'FINANCE', label: '财务内控域', type: 'RESOURCE', status: 1 },
          { id: '9002', code: 'IT', label: 'IT 信息内控域', type: 'RESOURCE', status: 1 },
        ],
      ),
    ).toEqual([
      { id: '9001', code: 'FINANCE', label: 'Finance Scope', type: 'RESOURCE', status: 1 },
      { id: '9002', code: 'IT', label: 'IT 信息内控域', type: 'RESOURCE', status: 1 },
    ])
  })

  it('maps scope types to chinese labels', () => {
    expect(getResourceScopeTypeLabel('RESOURCE')).toBe('维护域')
    expect(getResourceScopeTypeLabel('STANDARD')).toBe('共享域')
    expect(getResourceScopeTypeLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('maps scope types to chinese hints', () => {
    expect(getResourceScopeTypeHint('RESOURCE')).toContain('维护域可作为标准的维护域')
    expect(getResourceScopeTypeHint('STANDARD')).toContain('不能作为维护域选择')
    expect(getResourceScopeTypeHint('UNKNOWN')).toBe('')
  })

  it('filters owner scope options to maintenance scopes only', () => {
    expect(
      filterOwnerScopeOptions([
        { id: '9001', code: 'FINANCE', label: '财务内控域', type: 'RESOURCE', status: 1 },
        { id: '9008', code: 'SHARED', label: '专家共享域', type: 'STANDARD', status: 1 },
      ]),
    ).toEqual([{ id: '9001', code: 'FINANCE', label: '财务内控域', type: 'RESOURCE', status: 1 }])
  })

  it('keeps shared-only scopes available in grant scope options', () => {
    expect(
      filterGrantScopeOptions(
        [
          { id: '9001', code: 'FINANCE', label: '财务内控域', type: 'RESOURCE', status: 1 },
          { id: '9008', code: 'SHARED', label: '专家共享域', type: 'STANDARD', status: 1 },
        ],
        '9001',
      ),
    ).toEqual([{ id: '9008', code: 'SHARED', label: '专家共享域', type: 'STANDARD', status: 1 }])
  })

  it('formats scope option labels with chinese type names', () => {
    expect(
      formatResourceScopeOptionLabel({
        id: '9008',
        code: 'SHARED',
        label: '专家共享域',
        type: 'STANDARD',
        status: 1,
      }),
    ).toBe('专家共享域（共享域）')
  })
})
