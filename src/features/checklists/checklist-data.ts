import type { ControlChecklist, PageResult } from '@/types'

export interface ChecklistFieldDefinition {
  key: string
  label: string
}

export interface ChecklistApiPageRecord {
  records?: ControlChecklist[]
  list?: ControlChecklist[]
  total?: number
  pageNo?: number
  page?: number
  pageSize?: number
}

export const CHECKLIST_SEARCH_FIELDS: ChecklistFieldDefinition[] = [
  { key: 'name', label: '清单名称' },
  { key: 'status', label: '状态' },
  { key: 'ownerScopeId', label: '维护域' },
]

export const CHECKLIST_LIST_FIELDS: ChecklistFieldDefinition[] = [
  { key: 'name', label: '清单名称' },
  { key: 'itemCount', label: '检查项数' },
  { key: 'version', label: '版本' },
  { key: 'ownerScopeId', label: '维护域' },
  { key: 'uploadDate', label: '上传日期' },
  { key: 'status', label: '状态' },
]

export const CHECKLIST_EDITOR_FIELDS: ChecklistFieldDefinition[] = [
  { key: 'code', label: '清单编号' },
  { key: 'name', label: '清单名称' },
  { key: 'description', label: '描述' },
  { key: 'version', label: '版本' },
  { key: 'ownerScopeId', label: '维护域' },
  { key: 'grantScopeIds', label: '共享域' },
  { key: 'status', label: '状态' },
]

export const CHECKLIST_ITEM_EDITOR_FIELDS: ChecklistFieldDefinition[] = [
  { key: 'content', label: '检查项' },
  { key: 'criterion', label: '判断标准' },
  { key: 'controlFrequency', label: '控制频率' },
  { key: 'evaluationType', label: '评估类' },
  { key: 'organizationIds', label: '关联组织' },
]

export const CONTROL_FREQUENCY_OPTIONS = [
  { label: '每次发生', value: 'per_occurrence' },
  { label: '每日', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每季度', value: 'quarterly' },
  { label: '每半年度', value: 'half-yearly' },
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

export function normalizeChecklistPageFromApi(
  page: ChecklistApiPageRecord,
): PageResult<ControlChecklist> {
  const records = Array.isArray(page.records) ? page.records : page.list || []

  return {
    list: records.map(normalizeChecklistFromApi),
    total: Number(page.total || 0),
    page: Number(page.pageNo || page.page || 1),
    pageSize: Number(page.pageSize || 10),
  }
}

export function normalizeChecklistFromApi(checklist: ControlChecklist): ControlChecklist {
  return {
    ...checklist,
    description: checklist.description || '',
    ownerScopeId: checklist.ownerScopeId || '',
    grants: Array.isArray(checklist.grants) ? checklist.grants : [],
    items: Array.isArray(checklist.items) ? checklist.items : [],
    uploadDate: checklist.uploadDate || '',
  }
}
