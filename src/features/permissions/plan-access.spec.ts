import { describe, expect, it } from 'vitest'
import type { ControlPlan, ResourceScope } from '../../types/index.ts'
import {
  buildPlanAccessState,
  filterEditablePlanOwnerScopes,
  filterVisiblePlans,
  type PlanAccessContext,
} from './plan-access.ts'

function createPlan(overrides: Partial<ControlPlan> = {}): ControlPlan {
  return {
    id: 'plan-001',
    code: 'PL-2026-001',
    name: '2026 annual control plan',
    cycle: 'yearly',
    year: 2026,
    period: 'full-year',
    status: 'approved',
    description: 'desc',
    ownerScopeId: 'scope.finance',
    grants: [],
    items: [],
    createdBy: '2001',
    createdAt: '2026-04-29 09:00:00',
    updatedAt: '2026-04-29 09:00:00',
    ...overrides,
  }
}

function createScope(overrides: Partial<ResourceScope> = {}): ResourceScope {
  return {
    id: 'scope.finance',
    tenantId: '1001',
    scopeCode: 'FIN',
    scopeName: 'Finance',
    status: 1,
    ...overrides,
  }
}

describe('plan-access', () => {
  it('filters plans to owner or shared scopes visible to current user', () => {
    const ownerVisible = createPlan({ id: 'owner-visible' })
    const sharedVisible = createPlan({
      id: 'shared-visible',
      ownerScopeId: 'scope.hr',
      grants: [{ scopeId: 'scope.finance', actions: ['view'] }],
    })
    const hidden = createPlan({
      id: 'hidden',
      ownerScopeId: 'scope.it',
      grants: [{ scopeId: 'scope.legal', actions: ['view'] }],
    })

    expect(
      filterVisiblePlans([ownerVisible, sharedVisible, hidden], createContext('scope.finance', ['view']))
        .map((item) => item.id),
    ).toEqual(['owner-visible', 'shared-visible'])
  })

  it('allows edit submit delete and child creation only from owner-scope edit or manage access', () => {
    const plan = createPlan({ status: 'draft' })

    expect(buildPlanAccessState(plan, createContext('scope.finance', ['edit']))).toEqual({
      canView: true,
      canEdit: true,
      canSubmit: true,
      canDelete: true,
      canCreateChild: false,
      canManage: false,
    })

    expect(buildPlanAccessState(plan, createContext('scope.finance', ['create'])).canEdit).toBe(false)
    expect(buildPlanAccessState(plan, createContext('scope.finance', ['delete'])).canDelete).toBe(false)
  })

  it('keeps shared-scope access read-only', () => {
    const plan = createPlan({
      ownerScopeId: 'scope.hr',
      grants: [{ scopeId: 'scope.finance', actions: ['view'] }],
    })

    expect(buildPlanAccessState(plan, createContext('scope.finance', ['view']))).toEqual({
      canView: true,
      canEdit: false,
      canSubmit: false,
      canDelete: false,
      canCreateChild: false,
      canManage: false,
    })
  })

  it('applies plan lifecycle limits on top of owner-scope access', () => {
    const context = createContext('scope.finance', ['manage'])

    expect(buildPlanAccessState(createPlan({ status: 'approved' }), context)).toMatchObject({
      canEdit: true,
      canSubmit: false,
      canCreateChild: true,
    })
    expect(buildPlanAccessState(createPlan({ status: 'in_progress' }), context)).toMatchObject({
      canEdit: true,
      canSubmit: false,
      canCreateChild: true,
    })
    expect(
      buildPlanAccessState(createPlan({ status: 'approved', parentId: 'plan-parent' }), context)
        .canCreateChild,
    ).toBe(false)
  })

  it('filters editable owner scopes to active scopes with edit or manage access', () => {
    const scopes = [
      createScope(),
      createScope({ id: 'scope.hr', scopeCode: 'HR', scopeName: 'HR' }),
      createScope({ id: 'scope.closed', status: 0 }),
    ]

    expect(
      filterEditablePlanOwnerScopes(scopes, {
        isSuperAdmin: false,
        scopePermissions: [
          { scopeId: 'scope.finance', actions: ['view', 'edit'] },
          { scopeId: 'scope.hr', actions: ['create'] },
          { scopeId: 'scope.closed', actions: ['manage'] },
        ],
      }).map((scope) => scope.id),
    ).toEqual(['scope.finance'])
  })

  it('gives super admin full plan access within lifecycle rules', () => {
    const context: PlanAccessContext = { isSuperAdmin: true, scopePermissions: [] }

    expect(buildPlanAccessState(createPlan({ status: 'approved' }), context)).toEqual({
      canView: true,
      canEdit: true,
      canSubmit: false,
      canDelete: true,
      canCreateChild: true,
      canManage: true,
    })
    expect(filterEditablePlanOwnerScopes([createScope()], context)).toHaveLength(1)
  })
})

function createContext(
  scopeId: string,
  actions: PlanAccessContext['scopePermissions'][number]['actions'],
): PlanAccessContext {
  return {
    isSuperAdmin: false,
    scopePermissions: [
      {
        scopeId,
        actions,
      },
    ],
  }
}
