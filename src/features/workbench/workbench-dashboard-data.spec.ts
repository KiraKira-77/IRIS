import { describe, expect, it } from 'vitest'

import { buildWorkbenchDashboardData } from './workbench-dashboard-data'
import type { ControlChecklist, ControlPlan, Project, RectificationOrder } from '@/types'

const baseProject = {
  id: '7001',
  code: 'PRJ-001',
  name: '权限检查',
  source: 'manual',
  status: 'in_progress',
  startDate: '2026-04-25',
  endDate: '2026-05-10',
  checklistIds: ['8801'],
  members: [],
  tasks: [],
  createdAt: '2026-04-25 09:00:00',
  updatedAt: '2026-04-29 11:00:00',
} satisfies Project

const basePlan = {
  id: '9001',
  code: 'PLAN-001',
  name: '四月内控计划',
  cycle: 'monthly',
  year: 2026,
  period: 'M4',
  status: 'approved',
  ownerScopeId: 'scope-1',
  items: [],
  createdBy: 'admin',
  createdAt: '2026-04-01 09:00:00',
  updatedAt: '2026-04-28 09:00:00',
} satisfies ControlPlan

const baseChecklist = {
  id: '8801',
  code: 'CHK-001',
  name: '账号权限检查清单',
  version: 'V1.0',
  ownerScopeId: 'scope-1',
  grants: [],
  items: [],
  status: 'active',
  uploadDate: '2026-04-01',
  createdAt: '2026-04-01 09:00:00',
  updatedAt: '2026-04-01 09:00:00',
} satisfies ControlChecklist

const baseRectification = {
  id: 'rect-001',
  code: 'REC-2026-001',
  source: 'task',
  title: '关于资金支付流程不规范的整改',
  description: '发现部分支付单据缺少必要的审批签字。',
  assigneeId: 'p-001',
  assigneeName: '张三',
  reviewerId: 'p-002',
  reviewerName: '李四',
  status: 'in_progress',
  deadline: '2026-05-08',
  attachments: [],
  logs: [],
  createdAt: '2026-04-25 09:00:00',
  updatedAt: '2026-04-29 10:00:00',
} satisfies RectificationOrder

describe('workbench dashboard data', () => {
  it('builds dashboard summaries from real project, plan, and checklist records', () => {
    const data = buildWorkbenchDashboardData({
      projects: [
        {
          ...baseProject,
          tasks: [
            {
              id: '7201',
              projectId: '7001',
              checklistId: '8801',
              checklistItemId: 'item-1',
              checkContent: '检查管理员账号',
              checkCriterion: '账号已授权',
              assigneeName: '张三',
              status: 'pending',
            },
            {
              id: '7202',
              projectId: '7001',
              checklistId: '8801',
              checklistItemId: 'item-2',
              checkContent: '检查离职账号',
              checkCriterion: '账号已停用',
              assigneeName: '李四',
              status: 'approved',
            },
          ],
        },
      ],
      plans: [basePlan],
      checklists: [baseChecklist],
      now: new Date('2026-04-30T08:00:00+08:00'),
    })

    expect(data.header.todayText).toBe('2026年04月30日，星期四')
    expect(data.header.pendingCount).toBe(1)
    expect(data.header.completionRateText).toBe('50%')
    expect(data.cards.map((card) => [card.title, card.value])).toEqual([
      ['待处理检查项', '1'],
      ['待整改项', '0'],
      ['进行中项目', '1'],
      ['有效检查清单', '1'],
      ['检查项完成率', '50%'],
    ])
    expect(data.todoList).toEqual([
      expect.objectContaining({
        id: '7201',
        title: '检查管理员账号',
        projectName: '权限检查',
        assigneeName: '张三',
      }),
    ])
  })

  it('includes reserved rectification items from mock data while that module is unfinished', () => {
    const data = buildWorkbenchDashboardData({
      projects: [],
      plans: [],
      checklists: [],
      rectifications: [baseRectification],
      now: new Date('2026-04-30T08:00:00+08:00'),
    })

    expect(data.header.pendingCount).toBe(1)
    expect(data.cards.find((card) => card.title === '待整改项')).toMatchObject({
      value: '1',
      note: '待闭环 1 / 共 1',
    })
    expect(data.todoList).toEqual([
      expect.objectContaining({
        id: 'rect-001',
        itemType: 'rectification',
        title: '关于资金支付流程不规范的整改',
        projectName: '整改管理',
        assigneeName: '张三',
        statusText: '整改中',
      }),
    ])
    expect(data.activities.map((item) => item.title)).toEqual([
      '整改处理中:关于资金支付流程不规范的整改',
    ])
    expect(data.emptyText).toBe('')
  })

  it('derives charts and activity items without mock fallback rows', () => {
    const data = buildWorkbenchDashboardData({
      projects: [
        baseProject,
        { ...baseProject, id: '7002', status: 'completed', updatedAt: '2026-04-30 12:00:00' },
      ],
      plans: [basePlan],
      checklists: [{ ...baseChecklist, items: [({ id: '1' } as ControlChecklist['items'][number])] }],
      now: new Date('2026-04-30T08:00:00+08:00'),
    })

    expect(data.projectTrend.series[0]?.data.some((value) => value > 0)).toBe(true)
    expect(data.distribution.map((item) => item.name)).toContain('进行中项目')
    expect(data.activities.map((item) => item.title)).toEqual([
      '项目已完成:权限检查',
      '项目推进中:权限检查',
      '计划已批准:四月内控计划',
    ])
    expect(data.emptyText).toBe('')
  })

  it('returns explicit empty states when APIs have no records', () => {
    const data = buildWorkbenchDashboardData({
      projects: [],
      plans: [],
      checklists: [],
      now: new Date('2026-04-30T08:00:00+08:00'),
    })

    expect(data.cards.every((card) => card.value === '0' || card.value === '0%')).toBe(true)
    expect(data.todoList).toEqual([])
    expect(data.activities).toEqual([])
    expect(data.emptyText).toBe('暂无项目、计划或清单数据')
  })
})
