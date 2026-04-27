import { describe, expect, it } from 'vitest'
import {
  CHECKLIST_EDITOR_FIELDS,
  CHECKLIST_ITEM_EDITOR_FIELDS,
  CHECKLIST_LIST_FIELDS,
  CHECKLIST_SEARCH_FIELDS,
  countChecklistItems,
  normalizeChecklistPageFromApi,
} from './checklist-data'
import type { ControlChecklist } from '@/types'

describe('checklist-data', () => {
  it('keeps checklist page fields aligned with the source field spreadsheet', () => {
    expect(CHECKLIST_SEARCH_FIELDS.map((field) => field.label)).toEqual([
      '清单名称',
      '状态',
      '维护域',
    ])
    expect(CHECKLIST_LIST_FIELDS.map((field) => field.label)).toEqual([
      '清单名称',
      '检查项数',
      '版本',
      '维护域',
      '上传日期',
      '状态',
    ])
    expect(CHECKLIST_EDITOR_FIELDS.map((field) => field.label)).toEqual([
      '清单编号',
      '清单名称',
      '描述',
      '版本',
      '维护域',
      '共享域',
      '状态',
    ])
    expect(CHECKLIST_ITEM_EDITOR_FIELDS.map((field) => field.label)).toEqual([
      '检查项',
      '判断标准',
      '控制频率',
      '评估类',
      '关联组织',
    ])
  })

  it('derives checklist item count from the actual item list', () => {
    const checklist = {
      items: [{ id: 'ci-1' }, { id: 'ci-2' }],
    } as ControlChecklist

    expect(countChecklistItems(checklist)).toBe(2)
  })

  it('normalizes backend checklist page records into frontend page shape', () => {
    const page = normalizeChecklistPageFromApi({
      records: [
        {
          id: 'chk-1',
          code: 'CL-2026-001',
          name: '资金活动内控检查清单',
          version: 'V1.0',
          ownerScopeId: '9001',
          grants: [{ scopeId: '9002', actions: ['view'] }],
          items: [],
          status: 'active',
          uploadDate: '2026-04-27',
          createdAt: '2026-04-27T10:00:00',
          updatedAt: '2026-04-27T10:00:00',
        },
      ],
      total: 1,
      pageNo: 2,
      pageSize: 20,
    })

    expect(page.list).toHaveLength(1)
    expect(page.page).toBe(2)
    expect(page.pageSize).toBe(20)
    expect(page.list[0]!.ownerScopeId).toBe('9001')
    expect(page.list[0]!.grants).toEqual([{ scopeId: '9002', actions: ['view'] }])
  })
})
