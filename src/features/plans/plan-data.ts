import type { PageResult, PlanUpsertPayload, ControlPlan } from '@/types'

export const PLAN_SUBMIT_STATUS = 'approved' as const

interface BackendPage<T> {
  records?: T[]
  list?: T[]
  total: number
  pageNo?: number
  page?: number
  pageSize: number
}

export function normalizePlanPage(page: BackendPage<ControlPlan>): PageResult<ControlPlan> {
  return {
    list: page.records || page.list || [],
    total: page.total,
    page: page.pageNo || page.page || 1,
    pageSize: page.pageSize,
  }
}

export function createPlanUpsertPayload(payload: PlanUpsertPayload): PlanUpsertPayload {
  return {
    ...payload,
    description: payload.description?.trim() || undefined,
    grantScopeIds: payload.grantScopeIds || [],
    items: payload.items.map((item, index) => ({
      ...item,
      sequence: index + 1,
      remark: item.remark?.trim() || undefined,
    })),
  }
}
