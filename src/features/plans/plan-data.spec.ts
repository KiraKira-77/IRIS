import { describe, expect, it } from 'vitest'
import type { ControlPlan, PlanUpsertPayload } from '@/types'
import {
  PLAN_SUBMIT_STATUS,
  createPlanUpsertPayload,
  normalizePlanPage,
  resolvePlanPeriodDateRange,
  sortControlPlansByPeriod,
} from './plan-data'

describe('plan-data', () => {
  const createPlan = (overrides: Partial<ControlPlan>) =>
    ({
      id: overrides.id || '9001',
      code: overrides.code || 'PL-2026-001',
      name: overrides.name || '2026 annual control plan',
      cycle: overrides.cycle || 'yearly',
      year: overrides.year || 2026,
      period: overrides.period || 'full-year',
      status: overrides.status || 'draft',
      ownerScopeId: overrides.ownerScopeId || '9001',
      grants: overrides.grants || [{ scopeId: '9002', actions: ['view'] }],
      items: overrides.items || [],
      parentId: overrides.parentId,
      createdBy: overrides.createdBy || '2001',
      createdAt: overrides.createdAt || '2026-04-27T10:00:00',
      updatedAt: overrides.updatedAt || '2026-04-27T10:00:00',
    }) satisfies ControlPlan

  it('normalizes backend page records into frontend list shape', () => {
    const plan = createPlan({})

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

  it('resolves monthly plan period dates', () => {
    expect(resolvePlanPeriodDateRange(2026, 'monthly', 'M1')).toEqual([
      '2026-01-01',
      '2026-01-31',
    ])
    expect(resolvePlanPeriodDateRange(2026, 'monthly', '1月')).toEqual([
      '2026-01-01',
      '2026-01-31',
    ])
  })

  it('resolves quarterly plan period dates', () => {
    expect(resolvePlanPeriodDateRange(2026, 'quarterly', 'Q2')).toEqual([
      '2026-04-01',
      '2026-06-30',
    ])
  })

  it('resolves half-yearly and yearly plan period dates', () => {
    expect(resolvePlanPeriodDateRange(2026, 'half-yearly', 'H2')).toEqual([
      '2026-07-01',
      '2026-12-31',
    ])
    expect(resolvePlanPeriodDateRange(2026, 'yearly', '全年')).toEqual([
      '2026-01-01',
      '2026-12-31',
    ])
  })

  it('uses the real last day of leap-year February', () => {
    expect(resolvePlanPeriodDateRange(2028, 'monthly', 'M2')).toEqual([
      '2028-02-01',
      '2028-02-29',
    ])
  })

  it('sorts child plans by year and period instead of creation order', () => {
    const plans = [
      createPlan({ id: 'm12', cycle: 'monthly', period: 'M12' }),
      createPlan({ id: 'm2', cycle: 'monthly', period: 'M2' }),
      createPlan({ id: 'm1', cycle: 'monthly', period: 'M1' }),
    ]

    expect(sortControlPlansByPeriod(plans).map((plan) => plan.id)).toEqual(['m1', 'm2', 'm12'])
    expect(plans.map((plan) => plan.id)).toEqual(['m12', 'm2', 'm1'])
  })

  it('sorts mixed child plans by cycle group before period', () => {
    const plans = [
      createPlan({ id: 'q1', cycle: 'quarterly', period: 'Q1' }),
      createPlan({ id: 'm2', cycle: 'monthly', period: 'M2' }),
      createPlan({ id: 'm1', cycle: 'monthly', period: 'M1' }),
      createPlan({ id: 'q2', cycle: 'quarterly', period: 'Q2' }),
    ]

    expect(sortControlPlansByPeriod(plans).map((plan) => plan.id)).toEqual(['m1', 'm2', 'q1', 'q2'])
  })

  it('sorts quarterly and half-yearly child plans within their cycle groups', () => {
    const plans = [
      createPlan({ id: 'h2', cycle: 'half-yearly', period: 'H2' }),
      createPlan({ id: 'q4', cycle: 'quarterly', period: 'Q4' }),
      createPlan({ id: 'h1', cycle: 'half-yearly', period: 'H1' }),
      createPlan({ id: 'q2', cycle: 'quarterly', period: 'Q2' }),
      createPlan({ id: 'q1', cycle: 'quarterly', period: 'Q1' }),
    ]

    expect(sortControlPlansByPeriod(plans).map((plan) => plan.id)).toEqual([
      'q1',
      'q2',
      'q4',
      'h1',
      'h2',
    ])
  })
})
