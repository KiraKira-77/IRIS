import type {
  ChecklistItem,
  ControlChecklist,
  ControlPlan,
  PlanCycle,
  ProjectChecklistGenerationMode,
  ProjectSource,
} from '@/types'

export interface ProjectChecklistPreviewItem extends ChecklistItem {
  checklistName: string
}

const PLAN_CYCLE_RANK: Record<PlanCycle, number> = {
  monthly: 4,
  quarterly: 5,
  'half-yearly': 6,
  yearly: 7,
}

const CONTROL_FREQUENCY_RANK: Record<string, number> = {
  per_occurrence: 0,
  每次发生: 0,
  daily: 1,
  每日: 1,
  weekly: 2,
  每周: 2,
  monthly: 4,
  每月: 4,
  quarterly: 5,
  每季度: 5,
  'half-yearly': 6,
  half_yearly: 6,
  每半年度: 6,
  yearly: 7,
  每年度: 7,
}

export function collectPlanChecklistIds(plan: Pick<ControlPlan, 'items'>): string[] {
  return Array.from(new Set(plan.items.flatMap((item) => item.checklistIds)))
}

export function filterVisibleProjectChecklists({
  source,
  linkedPlan,
  checklists,
  selectedChecklistIds,
}: {
  source: ProjectSource
  linkedPlan: Pick<ControlPlan, 'items'> | null
  checklists: ControlChecklist[]
  selectedChecklistIds: string[]
}): ControlChecklist[] {
  if (source !== 'plan') return checklists
  if (!linkedPlan) return []

  const visibleIds = new Set([...collectPlanChecklistIds(linkedPlan), ...selectedChecklistIds])
  return checklists.filter((checklist) => visibleIds.has(checklist.id))
}

export function isControlFrequencyAllowedForPlanCycle(
  controlFrequency: string,
  planCycle?: PlanCycle,
): boolean {
  if (!planCycle) return true

  const planRank = PLAN_CYCLE_RANK[planCycle]
  const frequencyRank = CONTROL_FREQUENCY_RANK[normalizeFrequencyKey(controlFrequency)]

  if (planRank === undefined || frequencyRank === undefined) return false
  return frequencyRank <= planRank
}

function normalizeFrequencyKey(value: string): string {
  return value.trim().toLowerCase()
}

export function countGeneratedChecklistItems({
  checklists,
  selectedChecklistIds,
  linkedPlan,
}: {
  checklists: ControlChecklist[]
  selectedChecklistIds: string[]
  linkedPlan: Pick<ControlPlan, 'cycle'> | null
}): number {
  const selectedIds = new Set(selectedChecklistIds)
  return checklists.reduce((sum, checklist) => {
    if (!selectedIds.has(checklist.id)) return sum
    return (
      sum +
      checklist.items.filter((item) =>
        isControlFrequencyAllowedForPlanCycle(item.controlFrequency, linkedPlan?.cycle),
      ).length
    )
  }, 0)
}

export function generateProjectChecklistItems({
  mode,
  randomCount,
  checklists,
  selectedChecklistIds,
  linkedPlan,
  random = Math.random,
}: {
  mode: ProjectChecklistGenerationMode
  randomCount?: number
  checklists: ControlChecklist[]
  selectedChecklistIds: string[]
  linkedPlan: Pick<ControlPlan, 'cycle'> | null
  random?: () => number
}): ProjectChecklistPreviewItem[] {
  const candidates = collectCandidateChecklistItems({
    checklists,
    selectedChecklistIds,
    linkedPlan,
    applyPeriodFilter: mode === 'periodic',
  })

  if (mode !== 'random') {
    return candidates
  }

  const count = Math.max(0, Math.floor(Number(randomCount || 0)))
  if (count <= 0) return []
  if (count >= candidates.length) return candidates

  return shuffleItems(candidates, random).slice(0, count)
}

function collectCandidateChecklistItems({
  checklists,
  selectedChecklistIds,
  linkedPlan,
  applyPeriodFilter,
}: {
  checklists: ControlChecklist[]
  selectedChecklistIds: string[]
  linkedPlan: Pick<ControlPlan, 'cycle'> | null
  applyPeriodFilter: boolean
}): ProjectChecklistPreviewItem[] {
  const selectedIds = new Set(selectedChecklistIds)
  return checklists.flatMap((checklist) => {
    if (!selectedIds.has(checklist.id)) return []
    return checklist.items
      .filter(
        (item) =>
          !applyPeriodFilter ||
          isControlFrequencyAllowedForPlanCycle(item.controlFrequency, linkedPlan?.cycle),
      )
      .map((item) => ({ ...item, checklistName: checklist.name }))
  })
}

function shuffleItems<T>(items: T[], random: () => number): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = shuffled[index]!
    shuffled[index] = shuffled[swapIndex]!
    shuffled[swapIndex] = current
  }
  return shuffled
}
