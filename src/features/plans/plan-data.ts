import type { PageResult, PlanCycle, PlanUpsertPayload, ControlPlan } from '@/types'

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

const padDatePart = (value: number) => String(value).padStart(2, '0')

const formatDate = (year: number, month: number, day: number) =>
  `${year}-${padDatePart(month)}-${padDatePart(day)}`

const parsePeriodIndex = (period: string, prefix: string, fallback: number) => {
  const normalized = period.trim().toUpperCase()
  const prefixMatch = normalized.match(new RegExp(`^${prefix}(\\d+)$`))
  if (prefixMatch) return Number(prefixMatch[1])

  const numberMatch = normalized.match(/^(\d+)/)
  if (numberMatch) return Number(numberMatch[1])

  return fallback
}

export function resolvePlanPeriodDateRange(
  year: number,
  cycle: PlanCycle,
  period: string,
): [string, string] {
  if (cycle === 'yearly') {
    return [formatDate(year, 1, 1), formatDate(year, 12, 31)]
  }

  const monthRanges: Record<Exclude<PlanCycle, 'yearly'>, [number, number]> = {
    monthly: [parsePeriodIndex(period, 'M', 1), parsePeriodIndex(period, 'M', 1)],
    quarterly: (() => {
      const quarter = parsePeriodIndex(period, 'Q', 1)
      return [(quarter - 1) * 3 + 1, quarter * 3] as [number, number]
    })(),
    'half-yearly': (() => {
      const half = parsePeriodIndex(period, 'H', 1)
      return [half === 2 ? 7 : 1, half === 2 ? 12 : 6] as [number, number]
    })(),
  }

  const [startMonth, endMonth] = monthRanges[cycle]
  const endDay = new Date(year, endMonth, 0).getDate()

  return [formatDate(year, startMonth, 1), formatDate(year, endMonth, endDay)]
}
