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

export function canEditControlPlan(plan: Pick<ControlPlan, 'status'>): boolean {
  return plan.status === 'draft' || plan.status === 'approved'
}

export function canDeleteControlPlan(plan: ControlPlan, allPlans: ControlPlan[]): boolean {
  const plans = flattenControlPlans(allPlans)
  const childrenByParentId = plans.reduce<Map<string, ControlPlan[]>>((map, item) => {
    if (!item.parentId) return map
    map.set(item.parentId, [...(map.get(item.parentId) || []), item])
    return map
  }, new Map())
  const planIds = new Set<string>()
  const pendingIds = [plan.id]

  while (pendingIds.length > 0) {
    const currentId = pendingIds.shift()!
    if (planIds.has(currentId)) continue
    planIds.add(currentId)
    pendingIds.push(...(childrenByParentId.get(currentId) || []).map((item) => item.id))
  }

  return plans
    .filter((item) => planIds.has(item.id))
    .every((item) => item.items.every((planItem) => !planItem.projectId?.trim()))
}

function flattenControlPlans(plans: ControlPlan[]): ControlPlan[] {
  const flattened: ControlPlan[] = []
  const visit = (plan: ControlPlan) => {
    flattened.push(plan)
    plan.children?.forEach(visit)
  }
  plans.forEach(visit)
  return flattened
}

const padDatePart = (value: number) => String(value).padStart(2, '0')

const formatDate = (year: number, month: number, day: number) =>
  `${year}-${padDatePart(month)}-${padDatePart(day)}`

const cycleSortOrder: Record<PlanCycle, number> = {
  monthly: 1,
  quarterly: 2,
  'half-yearly': 3,
  yearly: 4,
}

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

export function resolveControlPlanDateRange(
  plan: Pick<ControlPlan, 'year' | 'cycle' | 'period'>,
): { start: string; end: string } {
  const [start, end] = resolvePlanPeriodDateRange(plan.year, plan.cycle, plan.period)
  return { start, end }
}

export function sortControlPlansByPeriod(plans: ControlPlan[]): ControlPlan[] {
  return [...plans].sort((left, right) => {
    const [leftStart, leftEnd] = resolvePlanPeriodDateRange(left.year, left.cycle, left.period)
    const [rightStart, rightEnd] = resolvePlanPeriodDateRange(right.year, right.cycle, right.period)

    return (
      left.year - right.year ||
      cycleSortOrder[left.cycle] - cycleSortOrder[right.cycle] ||
      leftStart.localeCompare(rightStart) ||
      leftEnd.localeCompare(rightEnd) ||
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id)
    )
  })
}

export function buildControlPlanTree(plans: ControlPlan[]): Array<ControlPlan & { children: ControlPlan[] }> {
  const roots = sortControlPlansByPeriod(plans.filter((plan) => !plan.parentId))

  return roots.map((root) => ({
    ...root,
    children: sortControlPlansByPeriod(plans.filter((plan) => plan.parentId === root.id)),
  }))
}
