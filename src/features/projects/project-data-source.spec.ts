import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  buildProjectUpsertPayload,
  filterProjectMemberUsers,
  normalizeProjectPage,
  projectChecklistCount,
  projectProgress,
  projectStatusLabel,
} from './project-data'
import type { PageResult, Project, SystemUser } from '@/types'

const here = dirname(fileURLToPath(import.meta.url))
const projectListSource = readFileSync(join(here, '../../views/project/list/index.vue'), 'utf8')
const projectCreateSource = readFileSync(join(here, '../../views/project/create/index.vue'), 'utf8')
const projectDetailSource = readFileSync(join(here, '../../views/project/detail/index.vue'), 'utf8')
const projectTaskSource = readFileSync(join(here, '../../views/project/task/index.vue'), 'utf8')
const apiSource = readFileSync(join(here, '../../api/index.ts'), 'utf8')
const typeSource = readFileSync(join(here, '../../types/index.ts'), 'utf8')

describe('project management data sources', () => {
  it('uses project APIs instead of mock projects on project pages', () => {
    expect(projectListSource).toContain('projectApi.list')
    expect(projectCreateSource).toContain('projectApi.create')
    expect(projectDetailSource).toContain('projectApi.detail')
    expect(projectTaskSource).not.toContain('mockProjects')
    expect(projectListSource).not.toContain('mockProjects')
    expect(projectCreateSource).not.toContain('mockProjects')
    expect(projectDetailSource).not.toContain('mockProjects')
  })

  it('keeps the project list aligned with the standards management page structure', () => {
    expect(projectListSource).toContain('project-hero')
    expect(projectListSource).toContain('project-toolbar')
    expect(projectListSource).toContain('table-shell')
    expect(projectListSource).toContain('row-actions')
    expect(projectListSource).toContain('background: oklch')
    expect(projectListSource).not.toContain('linear-gradient')
  })

  it('uses backend project lifecycle states', () => {
    expect(typeSource).toContain("'not_started'")
    expect(typeSource).not.toContain("| 'preparing'")
    expect(typeSource).not.toContain("| 'closing'")
    expect(projectListSource).toContain('value="not_started"')
    expect(projectListSource).not.toContain('value="preparing"')
    expect(projectDetailSource).not.toContain("status === 'preparing'")
    expect(projectStatusLabel('not_started')).toBe('待启动')
  })

  it('filters super administrators out of project member options', () => {
    const user = (id: string, account: string, roleCodes: string[] = []): SystemUser => ({
      id,
      tenantId: '1001',
      account,
      username: `用户${id}`,
      status: 1,
      roleIds: [],
      roleCodes,
    })

    expect(
      filterProjectMemberUsers([
        user('1', 'admin'),
        user('2', 'platform', ['PLATFORM_ADMIN']),
        user('3', 'root', ['SUPER_ADMIN']),
        user('4', 'auditor', ['AUDITOR']),
        { ...user('5', 'disabled', ['AUDITOR']), status: 0 },
      ]).map((item) => item.id),
    ).toEqual(['4'])
    expect(projectCreateSource).toContain('filterProjectMemberUsers')
  })

  it('does not expose project tags, maintenance domain, or shared domain', () => {
    const projectSources = [projectListSource, projectCreateSource, projectDetailSource, projectTaskSource]
    for (const source of projectSources) {
      expect(source).not.toContain('标签')
      expect(source).not.toContain('维护域')
      expect(source).not.toContain('共享域')
      expect(source).not.toContain('tagIds')
      expect(source).not.toContain('tagNames')
    }
  })

  it('keeps project API methods aligned with backend endpoints', () => {
    const projectApiStart = apiSource.indexOf('export const projectApi')
    const taskApiStart = apiSource.indexOf('export const taskApi', projectApiStart)
    const projectApiSource = apiSource.slice(projectApiStart, taskApiStart)

    expect(projectApiSource).toContain('start: (id: string)')
    expect(projectApiSource).toContain('complete: (id: string)')
    expect(projectApiSource).toContain('delete: (id: string)')
    expect(projectApiSource).not.toContain('/close')
    expect(projectApiSource).not.toContain('/archive')
    expect(projectApiSource).not.toContain('update: (id: string, data: Partial<Project>)')
  })

  it('normalizes backend project pages', () => {
    const page = normalizeProjectPage({
      records: [
        {
          id: '7001',
          code: 'PRJ-001',
          name: '资金检查',
          source: 'plan',
          status: 'not_started',
          startDate: '2026-04-01',
          checklistIds: ['8801', '8802'],
          members: [],
          tasks: [],
          progress: 0,
          createdAt: '2026-04-29 10:00:00',
          updatedAt: '2026-04-29 10:00:00',
        } satisfies Project,
      ],
      total: 1,
      pageNo: 2,
      pageSize: 20,
    })

    expect(page).toEqual<PageResult<Project>>({
      list: expect.any(Array),
      total: 1,
      page: 2,
      pageSize: 20,
    })
    const firstProject = page.list[0]
    expect(firstProject).toBeDefined()
    expect(projectChecklistCount(firstProject!)).toBe(2)
    expect(projectProgress(firstProject!)).toBe(0)
  })

  it('builds create payload without tags because project members define access', () => {
    const payload = buildProjectUpsertPayload({
      name: '项目 A',
      source: 'manual',
      planId: '',
      planName: '',
      description: '  描述  ',
      startDate: '2026-04-29',
      endDate: '',
      checklistIds: ['8801'],
      members: [
        {
          personnelId: '2001',
          personnelName: '负责人',
          employeeNo: 'E2001',
          department: '内控部',
          role: 'leader',
        },
      ],
    })

    expect(payload).not.toHaveProperty('tagIds')
    expect(payload).not.toHaveProperty('tagNames')
    expect(payload).toMatchObject({
      name: '项目 A',
      source: 'manual',
      leaderId: '2001',
      leaderName: '负责人',
      description: '描述',
      checklistIds: ['8801'],
    })
  })
})
