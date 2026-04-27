import type { ControlChecklist } from '@/types'

export interface ChecklistFieldDefinition {
  key: string
  label: string
}

export const CHECKLIST_SEARCH_FIELDS: ChecklistFieldDefinition[] = [
  { key: 'name', label: '清单名称' },
  { key: 'status', label: '状态' },
  { key: 'tags', label: '标签' },
]

export const CHECKLIST_LIST_FIELDS: ChecklistFieldDefinition[] = [
  { key: 'name', label: '清单名称' },
  { key: 'itemCount', label: '检查项数' },
  { key: 'version', label: '版本' },
  { key: 'tags', label: '标签' },
  { key: 'uploadDate', label: '上传日期' },
  { key: 'status', label: '状态' },
]

export const CHECKLIST_EDITOR_FIELDS: ChecklistFieldDefinition[] = [
  { key: 'code', label: '清单编号' },
  { key: 'name', label: '清单名称' },
  { key: 'description', label: '描述' },
  { key: 'version', label: '版本' },
  { key: 'tags', label: '标签' },
  { key: 'status', label: '状态' },
]

export const CHECKLIST_ITEM_EDITOR_FIELDS: ChecklistFieldDefinition[] = [
  { key: 'content', label: '检查项' },
  { key: 'criterion', label: '判断标准' },
  { key: 'controlFrequency', label: '控制频率' },
  { key: 'evaluationType', label: '评估类' },
  { key: 'organizationIds', label: '关联组织' },
]

export const CHECKLIST_TAG_OPTIONS = [
  { label: '财务', value: 'finance' },
  { label: '采购', value: 'purchase' },
  { label: '资产', value: 'asset' },
  { label: '合同', value: 'contract' },
  { label: 'IT', value: 'it' },
  { label: '人力', value: 'hr' },
  { label: '销售', value: 'sales' },
  { label: '运营', value: 'operation' },
]

export const CONTROL_FREQUENCY_OPTIONS = [
  { label: '每次发生', value: 'per_occurrence' },
  { label: '每日', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每季度', value: 'quarterly' },
  { label: '每年度', value: 'yearly' },
]

export const EVALUATION_TYPE_OPTIONS = [
  { label: '设计有效性', value: 'design' },
  { label: '执行有效性', value: 'operation' },
  { label: '设计与执行', value: 'both' },
]

export const CHECKLIST_ORGANIZATION_OPTIONS = [
  { label: '财务部', value: 'org-finance' },
  { label: '采购部', value: 'org-purchase' },
  { label: '资产管理部', value: 'org-asset' },
  { label: '法务部', value: 'org-legal' },
  { label: '信息技术部', value: 'org-it' },
  { label: '人力资源部', value: 'org-hr' },
  { label: '销售部', value: 'org-sales' },
]

export function countChecklistItems(checklist: Pick<ControlChecklist, 'items'>): number {
  return checklist.items.length
}

export function optionLabel(options: { label: string; value: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label || value
}

export function tagLabels(primaryTagId?: string, secondaryTagIds: string[] = []): string[] {
  const tagIds = [primaryTagId, ...secondaryTagIds].filter((tagId): tagId is string =>
    Boolean(tagId),
  )

  return tagIds.map((tagId) => optionLabel(CHECKLIST_TAG_OPTIONS, tagId))
}
