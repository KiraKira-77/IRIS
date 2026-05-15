import type { ChecklistItem, ChecklistItemUpsertPayload } from '@/types'
import {
  CHECKLIST_ORGANIZATION_OPTIONS,
  CONTROL_FREQUENCY_OPTIONS,
  EVALUATION_TYPE_OPTIONS,
} from './checklist-data'

export const CHECKLIST_ITEM_IMPORT_HEADERS = [
  '序号',
  '检查内容',
  '判断标准',
  '控制频率',
  '评估类',
  '关联组织',
] as const

export type ChecklistItemImportMode = 'append' | 'replace'
export type ChecklistItemImportRowStatus = 'valid' | 'invalid'

export interface ChecklistItemImportPreviewRow {
  rowNumber: number
  importSequence?: number
  status: ChecklistItemImportRowStatus
  errors: string[]
  item?: ChecklistItemUpsertPayload
  raw: Record<string, unknown>
}

export interface ChecklistItemImportResult {
  rows: ChecklistItemImportPreviewRow[]
  validItems: ChecklistItemUpsertPayload[]
  errorCount: number
}

export interface ChecklistItemImportDuplicate {
  importedIndex: number
  source: 'existing' | 'imported'
}

export type ChecklistItemImportTemplateValidationRule =
  | {
      header: (typeof CHECKLIST_ITEM_IMPORT_HEADERS)[number]
      type: 'list'
      values: string[]
    }
  | {
      header: (typeof CHECKLIST_ITEM_IMPORT_HEADERS)[number]
      type: 'prompt'
      prompt: string
    }

const IMPORT_EXAMPLE_ROW = {
  序号: 1,
  检查内容: '检查付款审批记录',
  判断标准: '审批链路完整且留痕',
  控制频率: '每月',
  评估类: '设计与执行',
  关联组织: '财务部、法务部',
}

export const buildChecklistItemImportTemplateRows = () => [IMPORT_EXAMPLE_ROW]

export const buildChecklistItemImportTemplateValidationRules =
  (): ChecklistItemImportTemplateValidationRule[] => [
    {
      header: '控制频率',
      type: 'list',
      values: CONTROL_FREQUENCY_OPTIONS.map((option) => option.label),
    },
    {
      header: '评估类',
      type: 'list',
      values: EVALUATION_TYPE_OPTIONS.map((option) => option.label),
    },
    {
      header: '关联组织',
      type: 'prompt',
      prompt: `可填写一个或多个组织，多个组织请用顿号分隔。可选组织：${CHECKLIST_ORGANIZATION_OPTIONS
        .map((option) => option.label)
        .join('、')}`,
    },
  ]

export const parseChecklistItemImportRows = (
  rows: Record<string, unknown>[],
): ChecklistItemImportResult => {
  const previewRows = rows
    .map((row, index) => ({ row, rowNumber: index + 2 }))
    .filter(({ row }) => !isEmptyImportRow(row))
    .map(({ row, rowNumber }) => parseChecklistItemImportRow(row, rowNumber))
  markDuplicateImportSequences(previewRows)
  const sortedRows = [...previewRows].sort(compareImportPreviewRows)

  return {
    rows: sortedRows,
    validItems: sortedRows.flatMap((row) => (row.item ? [row.item] : [])),
    errorCount: sortedRows.filter((row) => row.status === 'invalid').length,
  }
}

export const mergeChecklistImportItems = (
  existingItems: ChecklistItem[],
  importedItems: ChecklistItemUpsertPayload[],
  mode: ChecklistItemImportMode,
): Array<ChecklistItem | ChecklistItemUpsertPayload> => {
  if (mode === 'replace') {
    return importedItems
  }
  return [...existingItems, ...importedItems]
}

export const findDuplicateChecklistImportItems = (
  existingItems: ChecklistItem[],
  importedItems: ChecklistItemUpsertPayload[],
  mode: ChecklistItemImportMode,
): ChecklistItemImportDuplicate[] => {
  const duplicates: ChecklistItemImportDuplicate[] = []
  const seenKeys = new Set<string>()

  if (mode === 'append') {
    existingItems.forEach((item) => seenKeys.add(checklistItemDuplicateKey(item)))
  }

  importedItems.forEach((item, importedIndex) => {
    const key = checklistItemDuplicateKey(item)
    if (seenKeys.has(key)) {
      duplicates.push({
        importedIndex,
        source:
          mode === 'append' &&
          existingItems.some((existingItem) => checklistItemDuplicateKey(existingItem) === key)
            ? 'existing'
            : 'imported',
      })
      return
    }
    seenKeys.add(key)
  })

  return duplicates
}

const parseChecklistItemImportRow = (
  row: Record<string, unknown>,
  rowNumber: number,
): ChecklistItemImportPreviewRow => {
  const importSequenceText = readImportCell(row, '序号')
  const content = readImportCell(row, '检查内容')
  const criterion = readImportCell(row, '判断标准')
  const controlFrequencyText = readImportCell(row, '控制频率')
  const evaluationTypeText = readImportCell(row, '评估类')
  const organizationText = readImportCell(row, '关联组织')
  const errors: string[] = []

  const importSequenceResult = resolveImportSequence(importSequenceText)
  if (importSequenceResult.error) {
    errors.push(importSequenceResult.error)
  }

  if (!content) {
    errors.push('检查内容不能为空')
  }
  if (!criterion) {
    errors.push('判断标准不能为空')
  }

  const controlFrequency = resolveOptionValue(CONTROL_FREQUENCY_OPTIONS, controlFrequencyText)
  if (!controlFrequency) {
    errors.push('控制频率无效')
  }

  const evaluationType = resolveOptionValue(EVALUATION_TYPE_OPTIONS, evaluationTypeText)
  if (!evaluationType) {
    errors.push('评估类无效')
  }

  const organizationResult = resolveOrganizationIds(organizationText)
  if (organizationResult.error) {
    errors.push(organizationResult.error)
  }

  const item =
    errors.length === 0
      ? {
          content,
          criterion,
          controlFrequency: controlFrequency!,
          evaluationType: evaluationType!,
          organizationIds: organizationResult.organizationIds,
        }
      : undefined

  return {
    rowNumber,
    importSequence: importSequenceResult.importSequence,
    status: errors.length === 0 ? 'valid' : 'invalid',
    errors,
    item,
    raw: row,
  }
}

const readImportCell = (row: Record<string, unknown>, header: string): string => {
  const value = row[header]
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}

const isEmptyImportRow = (row: Record<string, unknown>) =>
  CHECKLIST_ITEM_IMPORT_HEADERS.every((header) => !readImportCell(row, header))

const resolveOptionValue = (
  options: { label: string; value: string }[],
  input: string,
): string | undefined => {
  const normalizedInput = normalizeImportText(input)
  return options.find((option) =>
    [option.label, option.value].some((value) => normalizeImportText(value) === normalizedInput),
  )?.value
}

const resolveOrganizationIds = (
  input: string,
): { organizationIds: string[]; error?: string } => {
  const names = input
    .split(/[、,，;；\n]/)
    .map((name) => name.trim())
    .filter(Boolean)
  const invalidNames: string[] = []
  const organizationIds: string[] = []

  for (const name of names) {
    const value = resolveOptionValue(CHECKLIST_ORGANIZATION_OPTIONS, name)
    if (!value) {
      invalidNames.push(name)
      continue
    }
    if (!organizationIds.includes(value)) {
      organizationIds.push(value)
    }
  }

  if (invalidNames.length > 0) {
    return { organizationIds, error: `关联组织无效：${invalidNames.join('、')}` }
  }
  if (organizationIds.length === 0) {
    return { organizationIds, error: '关联组织不能为空' }
  }
  return { organizationIds }
}

const normalizeImportText = (value: string) => value.trim().toLowerCase()

const resolveImportSequence = (
  input: string,
): { importSequence?: number; error?: string } => {
  if (!input) {
    return {}
  }
  if (!/^\d+$/.test(input)) {
    return { error: '序号必须为正整数' }
  }

  const importSequence = Number(input)
  if (!Number.isSafeInteger(importSequence) || importSequence <= 0) {
    return { error: '序号必须为正整数' }
  }
  return { importSequence }
}

const markDuplicateImportSequences = (rows: ChecklistItemImportPreviewRow[]) => {
  const rowsBySequence = new Map<number, ChecklistItemImportPreviewRow[]>()
  rows.forEach((row) => {
    if (row.importSequence === undefined) {
      return
    }
    rowsBySequence.set(row.importSequence, [
      ...(rowsBySequence.get(row.importSequence) || []),
      row,
    ])
  })

  rowsBySequence.forEach((sequenceRows) => {
    if (sequenceRows.length <= 1) {
      return
    }
    sequenceRows.forEach((row) => {
      row.errors.push('序号不能重复')
      row.status = 'invalid'
      row.item = undefined
    })
  })
}

const compareImportPreviewRows = (
  left: ChecklistItemImportPreviewRow,
  right: ChecklistItemImportPreviewRow,
) => {
  const leftOrder = left.importSequence ?? left.rowNumber
  const rightOrder = right.importSequence ?? right.rowNumber
  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }
  return left.rowNumber - right.rowNumber
}

const checklistItemDuplicateKey = (
  item: ChecklistItem | ChecklistItemUpsertPayload,
): string =>
  [
    normalizeImportText(item.content),
    normalizeImportText(item.criterion),
    normalizeImportText(item.controlFrequency),
    normalizeImportText(item.evaluationType),
    [...item.organizationIds].sort().map(normalizeImportText).join('|'),
  ].join('\u0001')
