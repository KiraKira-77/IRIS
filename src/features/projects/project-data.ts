import { isSuperAdminUser } from '@/features/plans/plan-assignee-options'
import type { PageResult, Project, ProjectStatus, ProjectUpsertPayload, SystemUser, TeamMember } from '@/types'

interface BackendPage<T> {
  records?: T[]
  list?: T[]
  total: number
  pageNo?: number
  page?: number
  pageSize: number
}

export interface ProjectCreateForm {
  name: string
  source: 'plan' | 'manual'
  planId?: string
  planName?: string
  description?: string
  startDate: string
  endDate?: string
  checklistIds: string[]
  members: Array<Omit<TeamMember, 'id' | 'avatar'>>
}

export function normalizeProjectPage(page: BackendPage<Project>): PageResult<Project> {
  return {
    list: (page.records || page.list || []).map(normalizeProject),
    total: page.total,
    page: page.pageNo || page.page || 1,
    pageSize: page.pageSize,
  }
}

export function normalizeProject(project: Project): Project {
  return {
    ...project,
    members: getProjectMembers(project),
    tasks: project.tasks || [],
    checklistIds: project.checklistIds || [],
  }
}

export function getProjectMembers(project: Pick<Project, 'members' | 'team'>): TeamMember[] {
  return project.members || project.team || []
}

export function filterProjectMemberUsers(users: SystemUser[]): SystemUser[] {
  return users.filter((user) => user.status === 1 && !isSuperAdminUser(user))
}

export function getAssignableProjectMembers<T extends Pick<TeamMember, 'role'>>(members: readonly T[]): T[] {
  return members.filter((member) => member.role === 'leader' || member.role === 'auditor')
}

export function projectChecklistCount(project: Pick<Project, 'checklistIds'>): number {
  return project.checklistIds?.length || 0
}

export function projectProgress(project: Pick<Project, 'progress' | 'tasks'>): number {
  if (typeof project.progress === 'number') return project.progress
  const tasks = project.tasks || []
  if (tasks.length === 0) return 0
  const done = tasks.filter((task) => ['passed', 'nonconforming', 'approved'].includes(task.status)).length
  return Math.round((done / tasks.length) * 100)
}

export function projectStatusLabel(status?: string): string {
  const labels: Record<ProjectStatus, string> = {
    not_started: '待启动',
    in_progress: '进行中',
    completed: '已完成',
    archived: '已归档',
  }
  return labels[status as ProjectStatus] || status || ''
}

export function projectStatusType(status?: string): string {
  const types: Record<ProjectStatus, string> = {
    not_started: 'info',
    in_progress: 'primary',
    completed: 'success',
    archived: 'info',
  }
  return types[status as ProjectStatus] || 'info'
}

export function taskStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    pending: '待办',
    in_progress: '进行中',
    dispatched: '已分发',
    uploaded: '已上传',
    submitted: '已提交',
    reviewing: '审核中',
    approved: '已通过',
    passed: '通过',
    nonconforming: '不符合项',
    rejected: '已退回',
    rectifying: '整改中',
  }
  return labels[status || ''] || status || ''
}

export function taskStatusType(status?: string): string {
  const types: Record<string, string> = {
    pending: 'info',
    in_progress: 'primary',
    dispatched: 'primary',
    uploaded: 'warning',
    submitted: 'warning',
    reviewing: 'warning',
    approved: 'success',
    passed: 'success',
    nonconforming: 'danger',
    rejected: 'danger',
    rectifying: 'danger',
  }
  return types[status || ''] || 'info'
}

export function projectSourceLabel(source?: string): string {
  return source === 'plan' ? '计划生成' : '手动创建'
}

export function projectTimeText(project: Pick<Project, 'startDate' | 'endDate'>): string {
  return project.endDate ? `${project.startDate} ~ ${project.endDate}` : project.startDate
}

export function buildProjectUpsertPayload(form: ProjectCreateForm): ProjectUpsertPayload {
  const leader = form.members.find((member) => member.role === 'leader')
  if (!leader) {
    throw new Error('PROJECT_LEADER_REQUIRED')
  }

  return {
    name: form.name.trim(),
    source: form.source,
    planId: form.source === 'plan' ? form.planId || undefined : undefined,
    planName: form.source === 'plan' ? form.planName || undefined : undefined,
    description: form.description?.trim() || undefined,
    startDate: form.startDate,
    endDate: form.endDate || undefined,
    leaderId: leader.personnelId,
    leaderName: leader.personnelName,
    checklistIds: form.checklistIds,
    members: form.members,
  }
}
