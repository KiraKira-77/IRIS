import { describe, expect, it } from 'vitest'
import {
  CHECKLIST_ITEM_IMPORT_HEADERS,
  buildChecklistItemImportTemplateValidationRules,
  buildChecklistItemImportTemplateRows,
  findDuplicateChecklistImportItems,
  mergeChecklistImportItems,
  parseChecklistItemImportRows,
} from './checklist-import'
import type { ChecklistItem, ChecklistItemUpsertPayload } from '@/types'

describe('checklist-import', () => {
  it('parses valid rows with Chinese headers into checklist item payloads', () => {
    const result = parseChecklistItemImportRows([
      {
        序号: 1,
        检查内容: '检查合同审批记录',
        判断标准: '审批链路完整且留痕',
        控制频率: '每次发生',
        评估类: '设计与执行',
        关联组织: '财务部、法务部',
      },
    ])

    expect(result.validItems).toEqual<ChecklistItemUpsertPayload[]>([
      {
        content: '检查合同审批记录',
        criterion: '审批链路完整且留痕',
        controlFrequency: 'per_occurrence',
        evaluationType: 'both',
        organizationIds: ['org-finance', 'org-legal'],
      },
    ])
    expect(result.rows[0]).toMatchObject({
      rowNumber: 2,
      status: 'valid',
      errors: [],
    })
  })

  it('accepts enum values and splits organizations by comma or Chinese delimiter', () => {
    const result = parseChecklistItemImportRows([
      {
        检查内容: '盘点固定资产',
        判断标准: '账实一致',
        控制频率: 'quarterly',
        评估类: 'operation',
        关联组织: '资产管理部, 信息技术部、财务部',
      },
    ])

    expect(result.validItems[0]).toMatchObject({
      controlFrequency: 'quarterly',
      evaluationType: 'operation',
      organizationIds: ['org-asset', 'org-it', 'org-finance'],
    })
  })

  it('reports required field, enum, and organization validation errors', () => {
    const result = parseChecklistItemImportRows([
      {
        检查内容: '',
        判断标准: '有标准',
        控制频率: '每小时',
        评估类: '抽样',
        关联组织: '不存在部门',
      },
    ])

    expect(result.validItems).toEqual([])
    expect(result.errorCount).toBe(1)
    expect(result.rows[0]!.status).toBe('invalid')
    expect(result.rows[0]!.errors).toEqual([
      '检查内容不能为空',
      '控制频率无效',
      '评估类无效',
      '关联组织无效：不存在部门',
    ])
  })

  it('filters empty rows before validation', () => {
    const result = parseChecklistItemImportRows([
      {},
      { 检查内容: '   ', 判断标准: '', 控制频率: '', 评估类: '', 关联组织: '' },
      {
        检查内容: '检查付款审批',
        判断标准: '审批完整',
        控制频率: '每月',
        评估类: '设计有效性',
        关联组织: '采购部',
      },
    ])

    expect(result.rows).toHaveLength(1)
    expect(result.validItems).toHaveLength(1)
    expect(result.validItems[0]!.controlFrequency).toBe('monthly')
    expect(result.validItems[0]!.evaluationType).toBe('design')
  })

  it('orders valid imported items by template sequence before Excel row order', () => {
    const result = parseChecklistItemImportRows([
      {
        序号: 20,
        检查内容: '第二个导入',
        判断标准: '标准二',
        控制频率: '每月',
        评估类: '设计有效性',
        关联组织: '财务部',
      },
      {
        序号: 10,
        检查内容: '第一个导入',
        判断标准: '标准一',
        控制频率: '每日',
        评估类: '执行有效性',
        关联组织: '法务部',
      },
    ])

    expect(result.validItems.map((item) => item.content)).toEqual(['第一个导入', '第二个导入'])
    expect(result.rows.map((row) => row.rowNumber)).toEqual([3, 2])
  })

  it('reports invalid or duplicate template sequence values', () => {
    const result = parseChecklistItemImportRows([
      {
        序号: 1,
        检查内容: '检查一',
        判断标准: '标准一',
        控制频率: '每日',
        评估类: '执行有效性',
        关联组织: '财务部',
      },
      {
        序号: 1,
        检查内容: '检查二',
        判断标准: '标准二',
        控制频率: '每日',
        评估类: '执行有效性',
        关联组织: '财务部',
      },
      {
        序号: '1.5',
        检查内容: '检查三',
        判断标准: '标准三',
        控制频率: '每日',
        评估类: '执行有效性',
        关联组织: '财务部',
      },
    ])

    expect(result.errorCount).toBe(3)
    expect(result.validItems).toEqual([])
    expect(result.rows[0]!.errors).toContain('序号不能重复')
    expect(result.rows[1]!.errors).toContain('序号不能重复')
    expect(result.rows[2]!.errors).toContain('序号必须为正整数')
  })

  it('builds template rows with the expected headers', () => {
    expect(CHECKLIST_ITEM_IMPORT_HEADERS).toEqual([
      '序号',
      '检查内容',
      '判断标准',
      '控制频率',
      '评估类',
      '关联组织',
    ])

    const rows = buildChecklistItemImportTemplateRows()
    expect(Object.keys(rows[0]!)).toEqual(CHECKLIST_ITEM_IMPORT_HEADERS)
    expect(rows[0]!.检查内容).toContain('审批')
  })

  it('builds Excel validation rules for template dropdown fields', () => {
    expect(buildChecklistItemImportTemplateValidationRules()).toEqual([
      {
        header: '控制频率',
        type: 'list',
        values: ['每次发生', '每日', '每周', '每月', '每季度', '每半年度', '每年度'],
      },
      {
        header: '评估类',
        type: 'list',
        values: ['设计有效性', '执行有效性', '设计与执行'],
      },
      {
        header: '关联组织',
        type: 'prompt',
        prompt:
          '可填写一个或多个组织，多个组织请用顿号分隔。可选组织：财务部、采购部、资产管理部、法务部、信息技术部、人力资源部、销售部',
      },
    ])
  })

  it('merges imported items by append or replace mode', () => {
    const existing: ChecklistItem[] = [
      {
        id: 'item-1',
        checklistId: 'checklist-1',
        sequence: 1,
        content: '已有检查项',
        criterion: '已有标准',
        controlFrequency: 'daily',
        evaluationType: 'design',
        organizationIds: ['org-finance'],
      },
    ]
    const imported: ChecklistItemUpsertPayload[] = [
      {
        content: '导入检查项',
        criterion: '导入标准',
        controlFrequency: 'monthly',
        evaluationType: 'both',
        organizationIds: ['org-legal'],
      },
    ]

    expect(mergeChecklistImportItems(existing, imported, 'append')).toEqual([...existing, ...imported])
    expect(mergeChecklistImportItems(existing, imported, 'replace')).toEqual(imported)
  })

  it('detects duplicate imported checklist items before merging', () => {
    const existing: ChecklistItem[] = [
      {
        id: 'item-1',
        checklistId: 'checklist-1',
        sequence: 1,
        content: '已有检查项',
        criterion: '已有标准',
        controlFrequency: 'daily',
        evaluationType: 'design',
        organizationIds: ['org-finance'],
      },
    ]
    const imported: ChecklistItemUpsertPayload[] = [
      {
        content: '已有检查项',
        criterion: '已有标准',
        controlFrequency: 'daily',
        evaluationType: 'design',
        organizationIds: ['org-finance'],
      },
      {
        content: '导入检查项',
        criterion: '导入标准',
        controlFrequency: 'monthly',
        evaluationType: 'both',
        organizationIds: ['org-legal', 'org-finance'],
      },
      {
        content: '导入检查项',
        criterion: '导入标准',
        controlFrequency: 'monthly',
        evaluationType: 'both',
        organizationIds: ['org-finance', 'org-legal'],
      },
    ]

    expect(findDuplicateChecklistImportItems(existing, imported, 'append')).toEqual([
      { importedIndex: 0, source: 'existing' },
      { importedIndex: 2, source: 'imported' },
    ])
    expect(findDuplicateChecklistImportItems(existing, imported, 'replace')).toEqual([
      { importedIndex: 2, source: 'imported' },
    ])
  })
})
