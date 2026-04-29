import { describe, expect, it } from 'vitest'
import type { ControlPlan, PlanUpsertPayload } from '@/types'
import { PLAN_SUBMIT_STATUS, createPlanUpsertPayload, normalizePlanPage } from './plan-data'

describe('plan-data', () => {
  it('normalizes backend page records into frontend list shape', () => {
    const plan = {
      id: '9001',
      code: 'PL-2026-001',
      name: '2026 annual control plan',
      cycle: 'yearly',
      year: 2026,
      period: 'full-year',
      status: 'draft',
      ownerScopeId: '9001',
      grants: [{ scopeId: '9002', actions: ['view'] }],
      items: [],
      createdBy: '2001',
      createdAt: '2026-04-27T10:00:00',
      updatedAt: '2026-04-27T10:00:00',
    } satisfies ControlPlan

    const page = normalizePlanPage({
      records: [plan],
      total: 1,
      pageNo: 2,
      pageSize: 20,
    })

    expect(page.list).toEqual([plan])
    expect(page.page).toBe(2)
    expect(page.pageSize).toBe(20)
  })

  it('creates upsert payload with owner and shared scope ids', () => {
    const payload = createPlanUpsertPayload({
      code: 'PL-2026-001',
      name: '2026 annual control plan',
      cycle: 'yearly',
      year: 2026,
      period: 'full-year',
      status: 'approved',
      description: 'annual scope',
      ownerScopeId: '9001',
      grantScopeIds: ['9001', '9002'],
      parentId: undefined,
      items: [],
    } satisfies PlanUpsertPayload)

    expect(payload.ownerScopeId).toBe('9001')
    expect(payload.grantScopeIds).toEqual(['9001', '9002'])
    expect(payload.status).toBe('approved')
  })

  it('uses approved as the direct submit status while plan approval is disabled', () => {
    expect(PLAN_SUBMIT_STATUS).toBe('approved')
  })
})
