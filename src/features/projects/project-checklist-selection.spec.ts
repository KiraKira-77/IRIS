import { describe, expect, it } from 'vitest'
import type { ControlChecklist, ControlPlan } from '@/types'
import * as checklistSelection from './project-checklist-selection'
import {
  collectPlanChecklistIds,
  countGeneratedChecklistItems,
  filterVisibleProjectChecklists,
  generateProjectChecklistItems,
  groupProjectChecklistItemsByChecklist,
  isControlFrequencyAllowedForPlanCycle,
  paginateProjectChecklistItems,
} from './project-checklist-selection'

describe('project-checklist-selection', () => {
  it('shows only plan checklists by default when creating a project from a plan', () => {
    const plan = createPlan(['checklist-a', 'checklist-b'])
    const checklists = [
      createChecklist('checklist-a'),
      createChecklist('checklist-b'),
      createChecklist('checklist-extra'),
    ]

    expect(
      filterVisibleProjectChecklists({
        source: 'plan',
        linkedPlan: plan,
        checklists,
        selectedChecklistIds: collectPlanChecklistIds(plan),
      }).map((item) => item.id),
    ).toEqual(['checklist-a', 'checklist-b'])
  })

  it('keeps manually added extra checklists visible after the picker adds them', () => {
    const plan = createPlan(['checklist-a'])
    const checklists = [
      createChecklist('checklist-a'),
      createChecklist('checklist-b'),
      createChecklist('checklist-extra'),
    ]

    expect(
      filterVisibleProjectChecklists({
        source: 'plan',
        linkedPlan: plan,
        checklists,
        selectedChecklistIds: ['checklist-a', 'checklist-extra'],
      }).map((item) => item.id),
    ).toEqual(['checklist-a', 'checklist-extra'])
  })

  it('shows only selected checklists for manually created projects', () => {
    const checklists = [createChecklist('checklist-a'), createChecklist('checklist-b')]

    expect(
      filterVisibleProjectChecklists({
        source: 'manual',
        linkedPlan: null,
        checklists,
        selectedChecklistIds: ['checklist-b'],
      }).map((item) => item.id),
    ).toEqual(['checklist-b'])
  })

  it('shows no checklist before a plan is selected for plan-generated projects', () => {
    const checklists = [createChecklist('checklist-a'), createChecklist('checklist-b')]

    expect(
      filterVisibleProjectChecklists({
        source: 'plan',
        linkedPlan: null,
        checklists,
        selectedChecklistIds: [],
      }),
    ).toEqual([])
  })

  it('allows only control frequencies no longer than the plan cycle', () => {
    expect(isControlFrequencyAllowedForPlanCycle('yearly', 'monthly')).toBe(false)
    expect(isControlFrequencyAllowedForPlanCycle('quarterly', 'monthly')).toBe(false)
    expect(isControlFrequencyAllowedForPlanCycle('monthly', 'monthly')).toBe(true)
    expect(isControlFrequencyAllowedForPlanCycle('weekly', 'monthly')).toBe(true)
    expect(isControlFrequencyAllowedForPlanCycle('daily', 'monthly')).toBe(true)
    expect(isControlFrequencyAllowedForPlanCycle('per_occurrence', 'monthly')).toBe(true)

    expect(isControlFrequencyAllowedForPlanCycle('yearly', 'quarterly')).toBe(false)
    expect(isControlFrequencyAllowedForPlanCycle('quarterly', 'quarterly')).toBe(true)
    expect(isControlFrequencyAllowedForPlanCycle('yearly', 'yearly')).toBe(true)
    expect(isControlFrequencyAllowedForPlanCycle('每月', 'monthly')).toBe(true)
    expect(isControlFrequencyAllowedForPlanCycle('每季度', 'monthly')).toBe(false)
    expect(isControlFrequencyAllowedForPlanCycle('每半年度', 'half-yearly')).toBe(true)
  })

  it('counts generated items after applying the linked plan cycle', () => {
    const monthlyPlan = createPlan(['checklist-a'], 'monthly')
    const yearlyPlan = createPlan(['checklist-a'], 'yearly')
    const checklists = [
      createChecklist('checklist-a', [
        { id: 'item-1', controlFrequency: 'per_occurrence' },
        { id: 'item-2', controlFrequency: 'monthly' },
        { id: 'item-3', controlFrequency: 'quarterly' },
        { id: 'item-4', controlFrequency: 'yearly' },
      ]),
    ]

    expect(
      countGeneratedChecklistItems({
        checklists,
        selectedChecklistIds: ['checklist-a'],
        linkedPlan: monthlyPlan,
      }),
    ).toBe(2)
    expect(
      countGeneratedChecklistItems({
        checklists,
        selectedChecklistIds: ['checklist-a'],
        linkedPlan: yearlyPlan,
      }),
    ).toBe(4)
  })

  it('generates all selected checklist items in full mode', () => {
    const plan = createPlan(['checklist-a'], 'monthly')
    const checklists = [
      createChecklist('checklist-a', [
        { id: 'item-1', controlFrequency: 'monthly' },
        { id: 'item-2', controlFrequency: 'quarterly' },
      ]),
    ]

    expect(
      generateProjectChecklistItems({
        mode: 'full',
        checklists,
        selectedChecklistIds: ['checklist-a'],
        linkedPlan: plan,
      }).map((item) => item.id),
    ).toEqual(['item-1', 'item-2'])
  })

  it('generates only frequency-matched items in periodic mode', () => {
    const plan = createPlan(['checklist-a'], 'monthly')
    const checklists = [
      createChecklist('checklist-a', [
        { id: 'item-1', controlFrequency: 'per_occurrence' },
        { id: 'item-2', controlFrequency: 'monthly' },
        { id: 'item-3', controlFrequency: 'quarterly' },
      ]),
    ]

    expect(
      generateProjectChecklistItems({
        mode: 'periodic',
        checklists,
        selectedChecklistIds: ['checklist-a'],
        linkedPlan: plan,
      }).map((item) => item.id),
    ).toEqual(['item-1', 'item-2'])
  })

  it('randomly samples the requested number from candidate items', () => {
    const checklists = [
      createChecklist('checklist-a', [
        { id: 'item-1' },
        { id: 'item-2' },
        { id: 'item-3' },
      ]),
    ]

    expect(
      generateProjectChecklistItems({
        mode: 'random',
        randomCount: 2,
        checklists,
        selectedChecklistIds: ['checklist-a'],
        linkedPlan: null,
        random: () => 0,
      }).map((item) => item.id),
    ).toEqual(['item-2', 'item-3'])
  })

  it('paginates checklist items by page and page size', () => {
    const items = Array.from({ length: 25 }, (_, index) => ({
      ...createChecklist('checklist-a', [{ id: `item-${index + 1}` }]).items[0]!,
      checklistName: 'checklist-a',
    }))

    const page = paginateProjectChecklistItems(items, 2, 10)

    expect(page).toEqual({
      items: items.slice(10, 20),
      page: 2,
      pageSize: 10,
      total: 25,
    })
  })

  it('groups checklist items by their checklist', () => {
    const items = [
      {
        ...createChecklist('checklist-a', [{ id: 'item-a1' }]).items[0]!,
        checklistName: 'Checklist A',
      },
      {
        ...createChecklist('checklist-b', [{ id: 'item-b1' }]).items[0]!,
        checklistName: 'Checklist B',
      },
      {
        ...createChecklist('checklist-a', [{ id: 'item-a2' }]).items[0]!,
        checklistName: 'Checklist A',
      },
    ]

    expect(groupProjectChecklistItemsByChecklist(items)).toEqual([
      {
        checklistId: 'checklist-a',
        checklistName: 'Checklist A',
        items: [items[0], items[2]],
      },
      {
        checklistId: 'checklist-b',
        checklistName: 'Checklist B',
        items: [items[1]],
      },
    ])
  })

  it('returns only selected items for a checklist card summary', () => {
    const getSelectedChecklistItems = (checklistSelection as Record<string, unknown>)
      .getSelectedChecklistItems as
      | ((
          checklist: ControlChecklist,
          selectedChecklistItemIds: string[],
        ) => ControlChecklist['items'])
      | undefined
    const checklist = createChecklist('checklist-a', [
      { id: 'item-1' },
      { id: 'item-2' },
      { id: 'item-3' },
      { id: 'item-4' },
    ])

    expect(getSelectedChecklistItems).toBeTypeOf('function')
    expect(getSelectedChecklistItems?.(checklist, ['item-2']).map((item) => item.id)).toEqual([
      'item-2',
    ])
  })
})

function createPlan(checklistIds: string[], cycle: ControlPlan['cycle'] = 'yearly'): ControlPlan {
  return {
    id: '9001',
    code: 'PL-2026-001',
    name: '2026 annual control plan',
    cycle,
    year: 2026,
    period: 'full-year',
    status: 'approved',
    ownerScopeId: 'scope.finance',
    grants: [],
    items: [
      {
        id: '9101',
        planId: '9001',
        sequence: 1,
        targetScope: 'Finance',
        checklistIds,
        plannedStartDate: '2026-01-01',
        plannedEndDate: '2026-12-31',
      },
    ],
    createdBy: '2001',
    createdAt: '2026-04-27 10:00:00',
    updatedAt: '2026-04-27 10:00:00',
  }
}

function createChecklist(
  id: string,
  items: Array<Partial<ControlChecklist['items'][number]>> = [],
): ControlChecklist {
  return {
    id,
    code: id,
    name: id,
    description: '',
    version: 'V1.0',
    ownerScopeId: 'scope.finance',
    grants: [],
    items: items.map((item, index) => ({
      id: item.id || `${id}-item-${index + 1}`,
      checklistId: id,
      sequence: index + 1,
      content: item.content || `item ${index + 1}`,
      criterion: item.criterion || `criterion ${index + 1}`,
      controlFrequency: item.controlFrequency || 'monthly',
      evaluationType: item.evaluationType || 'operation',
      organizationIds: item.organizationIds || [],
    })),
    status: 'active',
    uploadDate: '2026-04-27',
    createdAt: '2026-04-27 10:00:00',
    updatedAt: '2026-04-27 10:00:00',
  }
}
