import { describe, expect, it } from 'vitest'
import {
  CHECKLIST_EDITOR_FIELDS,
  CHECKLIST_ITEM_EDITOR_FIELDS,
  CHECKLIST_LIST_FIELDS,
  CHECKLIST_SEARCH_FIELDS,
  countChecklistItems,
} from './checklist-data'
import type { ControlChecklist } from '@/types'

describe('checklist-data', () => {
  it('keeps checklist page fields aligned with the source field spreadsheet', () => {
    expect(CHECKLIST_SEARCH_FIELDS.map((field) => field.label)).toEqual([
      '清单名称',
      '状态',
      '标签',
    ])
    expect(CHECKLIST_LIST_FIELDS.map((field) => field.label)).toEqual([
      '清单名称',
      '检查项数',
      '版本',
      '标签',
      '上传日期',
      '状态',
    ])
    expect(CHECKLIST_EDITOR_FIELDS.map((field) => field.label)).toEqual([
      '清单编号',
      '清单名称',
      '描述',
      '版本',
      '标签',
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
})
