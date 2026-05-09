import type {
  AlertEvent,
  Archive,
  ControlChecklist,
  ControlPlan,
  LogEntry,
  Project,
  RectStatus,
  RectificationOrder,
  TaskStatus,
} from '@/types'

export type WorkbenchCardType = 'danger' | 'warning' | 'primary' | 'info' | 'success'

export interface WorkbenchMetricCard {
  title: string
  value: string
  note: string
  type: WorkbenchCardType
}

export interface WorkbenchTodoItem {
  id: string
  itemType: 'task' | 'rectification'
  title: string
  projectId?: string
  projectName: string
  assigneeName: string
  status: TaskStatus | RectStatus
  statusText: string
  statusType: string
  dateText: string
  priority: 'high' | 'medium' | 'low'
  targetPath: string
  targetQuery?: Record<string, string>
}

export interface WorkbenchChartSeries {
  name: string
  data: number[]
}

export interface WorkbenchDistributionItem {
  name: string
  value: number
  color: string
}

export interface WorkbenchActivityItem {
  id: string
  title: string
  timeText: string
  type: 'project' | 'plan' | 'checklist' | 'rectification' | 'log'
}

export interface WorkbenchRiskItem {
  id: string
  title: string
  scope: string
  level: '高' | '中' | '低'
}

export interface WorkbenchAlertItem {
  id: string
  title: string
  content: string
  level: AlertEvent['level']
  timeText: string
}

export interface WorkbenchCommandItem {
  title: string
  value: string
}

export interface WorkbenchStanceNode {
  title: string
  value: string
}

export interface WorkbenchDashboardData {
  header: {
    todayText: string
    pendingCount: number
    completionRateText: string
    riskLevel: string
  }
  cards: WorkbenchMetricCard[]
  todoList: WorkbenchTodoItem[]
  projectTrend: {
    labels: string[]
    series: WorkbenchChartSeries[]
  }
  distribution: WorkbenchDistributionItem[]
  activities: WorkbenchActivityItem[]
  healthScore: number
  healthSummary: string
  riskItems: WorkbenchRiskItem[]
  alertItems: WorkbenchAlertItem[]
  commandItems: WorkbenchCommandItem[]
  stanceNodes: WorkbenchStanceNode[]
  emptyText: string
}

interface BuildWorkbenchDashboardDataParams {
  projects: Project[]
  plans: ControlPlan[]
  checklists: ControlChecklist[]
  rectifications?: RectificationOrder[]
  archives?: Archive[]
  alerts?: AlertEvent[]
  logs?: LogEntry[]
  now?: Date
}

const pendingTaskStatuses = new Set<TaskStatus>([
  'pending',
  'in_progress',
  'dispatched',
  'uploaded',
  'submitted',
  'reviewing',
  'rejected',
  'rectifying',
])

const completedTaskStatuses = new Set<TaskStatus>(['approved', 'passed', 'nonconforming'])
const closedRectificationStatuses = new Set<RectStatus>(['approved'])

const statusLabels: Record<string, string> = {
  not_started: '待启动项目',
  in_progress: '进行中项目',
  completed: '已完成项目',
  archived: '已归档项目',
}

const statusColors: Record<string, string> = {
  not_started: 'oklch(61% 0.04 248)',
  in_progress: 'oklch(58% 0.16 250)',
  completed: 'oklch(58% 0.13 155)',
  archived: 'oklch(52% 0.03 248)',
}

export function buildWorkbenchDashboardData({
  projects,
  plans,
  checklists,
  rectifications = [],
  archives = [],
  alerts = [],
  logs = [],
  now = new Date(),
}: BuildWorkbenchDashboardDataParams): WorkbenchDashboardData {
  const tasks = projects.flatMap((project) =>
    (project.tasks || []).map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
      projectEndDate: project.endDate,
    })),
  )
  const pendingTasks = tasks.filter((task) => pendingTaskStatuses.has(task.status))
  const pendingRectifications = rectifications.filter(
    (rectification) => !closedRectificationStatuses.has(rectification.status),
  )
  const closedRectifications = rectifications.filter((rectification) =>
    closedRectificationStatuses.has(rectification.status),
  )
  const completedTasks = tasks.filter((task) => completedTaskStatuses.has(task.status))
  const completionRate = tasks.length === 0 ? 0 : Math.round((completedTasks.length / tasks.length) * 100)
  const rectificationCloseRate =
    rectifications.length === 0 ? 0 : Math.round((closedRectifications.length / rectifications.length) * 100)
  const activeChecklists = checklists.filter((item) => item.status === 'active')
  const projectStatusCounts = countBy(projects, (project) => project.status)
  const pendingCount = pendingTasks.length + pendingRectifications.length
  const criticalAlertCount = alerts.filter(
    (alert) => alert.level === 'critical' && !alert.acknowledged,
  ).length
  const warningAlertCount = alerts.filter(
    (alert) => alert.level === 'warning' && !alert.acknowledged,
  ).length
  const overdueRectificationCount = pendingRectifications.filter((rectification) =>
    isBeforeToday(rectification.deadline, now),
  ).length
  const rejectedTaskCount = pendingTasks.filter(
    (task) => task.status === 'rejected' || task.status === 'rectifying',
  ).length
  const highRiskCount = criticalAlertCount + overdueRectificationCount + rejectedTaskCount
  const archiveDocumentCount = archives.reduce(
    (sum, archive) => sum + (archive.documentCount ?? archive.documents?.length ?? 0),
    0,
  )
  const healthScore = resolveHealthScore({
    highRiskCount,
    warningAlertCount,
    pendingRectificationCount: pendingRectifications.length,
    pendingTaskCount: pendingTasks.length,
  })

  return {
    header: {
      todayText: formatFullDate(now),
      pendingCount,
      completionRateText: `${completionRate}%`,
      riskLevel: resolveRiskLevel(pendingCount, projects.length),
    },
    cards: [
      {
        title: '待处理检查项',
        value: String(pendingTasks.length),
        note: pendingTasks.length > 0 ? '需要跟进' : '暂无待处理',
        type: 'danger',
      },
      {
        title: '待整改项',
        value: String(pendingRectifications.length),
        note: `待闭环 ${pendingRectifications.length} / 共 ${rectifications.length}`,
        type: 'warning',
      },
      {
        title: '进行中项目',
        value: String(projectStatusCounts.in_progress || 0),
        note: `项目总数 ${projects.length}`,
        type: 'primary',
      },
      {
        title: '有效检查清单',
        value: String(activeChecklists.length),
        note: `检查项 ${activeChecklists.reduce((sum, item) => sum + (item.items?.length || 0), 0)}`,
        type: 'info',
      },
      {
        title: '检查项完成率',
        value: `${completionRate}%`,
        note: `已完成 ${completedTasks.length} / 共 ${tasks.length}`,
        type: 'success',
      },
      {
        title: '档案归集',
        value: String(archives.length),
        note: `文档 ${archiveDocumentCount} 份`,
        type: 'info',
      },
      {
        title: '整改闭环率',
        value: `${rectificationCloseRate}%`,
        note: `已闭环 ${closedRectifications.length} / 共 ${rectifications.length}`,
        type: 'success',
      },
    ],
    todoList: buildTodoList(pendingTasks, pendingRectifications, now),
    projectTrend: buildProjectTrend(projects, now),
    distribution: buildDistribution(projectStatusCounts),
    activities: buildActivities(projects, plans, rectifications, logs),
    healthScore,
    healthSummary: `高风险 ${highRiskCount} 项，告警 ${alerts.length} 条`,
    riskItems: buildRiskItems({
      alerts,
      tasks: pendingTasks,
      rectifications: pendingRectifications,
      projects,
      now,
    }),
    alertItems: buildAlertItems(alerts),
    commandItems: buildCommandItems({
      highRiskCount,
      projects,
      pendingRectifications,
      archives,
      archiveDocumentCount,
    }),
    stanceNodes: [
      {
        title: '项目执行',
        value: `${projectStatusCounts.in_progress || 0} 个进行中`,
      },
      {
        title: '整改闭环',
        value: `${pendingRectifications.length} 个待推进`,
      },
      {
        title: '档案归集',
        value: `${archives.length} 个已归集`,
      },
      {
        title: '责任动态',
        value: `${logs.length} 条日志`,
      },
    ],
    emptyText:
      projects.length === 0 &&
      plans.length === 0 &&
      checklists.length === 0 &&
      rectifications.length === 0 &&
      archives.length === 0 &&
      alerts.length === 0 &&
      logs.length === 0
        ? '暂无项目、计划或清单数据'
        : '',
  }
}

function countBy<T>(items: T[], pickKey: (item: T) => string | undefined): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = pickKey(item) || 'unknown'
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {})
}

function buildTodoList(
  tasks: Array<{
    id: string
    projectId: string
    projectName: string
    projectEndDate?: string
    checkContent: string
    assigneeName?: string
    status: TaskStatus
  }>,
  rectifications: RectificationOrder[],
  now: Date,
): WorkbenchTodoItem[] {
  const taskTodos = tasks.map((task) => ({
    id: task.id,
    itemType: 'task' as const,
    title: task.checkContent,
    projectId: task.projectId,
    projectName: task.projectName,
    assigneeName: task.assigneeName || '未分配',
    status: task.status,
    statusText: taskStatusLabel(task.status),
    statusType: taskStatusType(task.status),
    dateText: task.projectEndDate ? `截止 ${task.projectEndDate}` : '未设置截止日期',
    priority: task.status === 'rejected' || task.status === 'rectifying' ? ('high' as const) : ('medium' as const),
    targetPath: `/project/task/${task.id}`,
    targetQuery: { action: 'handle' },
  }))
  const rectificationTodos = rectifications.map((rectification) => ({
    id: rectification.id,
    itemType: 'rectification' as const,
    title: rectification.title,
    projectId: rectification.projectId,
    projectName: rectification.projectName || '整改管理',
    assigneeName: rectification.assigneeName || '未分配',
    status: rectification.status,
    statusText: rectificationStatusLabel(rectification.status),
    statusType: rectificationStatusType(rectification.status),
    dateText: rectification.deadline ? `截止 ${rectification.deadline}` : '未设置截止日期',
    priority: rectificationPriority(rectification, now),
    targetPath: `/rectification/detail/${rectification.id}`,
  }))

  return [...taskTodos, ...rectificationTodos]
    .sort((left, right) => priorityWeight(right.status) - priorityWeight(left.status))
    .slice(0, 6)
}

function buildProjectTrend(projects: Project[], now: Date): WorkbenchDashboardData['projectTrend'] {
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (6 - index))
    return date
  })
  const labels = days.map(formatShortDate)
  const counts = days.map((date) => {
    const key = formatIsoDate(date)
    return projects.filter((project) => {
      const projectDate = firstDate(project.updatedAt, project.startDate, project.createdAt)
      return projectDate === key
    }).length
  })

  return {
    labels,
    series: [{ name: '项目更新', data: counts }],
  }
}

function buildDistribution(statusCounts: Record<string, number>): WorkbenchDistributionItem[] {
  return Object.entries(statusCounts)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      name: statusLabels[status] || status,
      value,
      color: statusColors[status] || 'oklch(56% 0.03 248)',
    }))
}

function buildRiskItems({
  alerts,
  tasks,
  rectifications,
  projects,
  now,
}: {
  alerts: AlertEvent[]
  tasks: Array<{
    id: string
    projectName: string
    checkContent: string
    status: TaskStatus
  }>
  rectifications: RectificationOrder[]
  projects: Project[]
  now: Date
}): WorkbenchRiskItem[] {
  const alertRisks = alerts
    .filter((alert) => !alert.acknowledged && alert.level !== 'info')
    .map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      scope: alert.source || alert.content,
      level: alert.level === 'critical' ? ('高' as const) : ('中' as const),
      weight: alert.level === 'critical' ? 4 : 3,
      timeText: alert.timestamp,
    }))
  const taskRisks = tasks
    .filter((task) => task.status === 'rejected' || task.status === 'rectifying')
    .map((task) => ({
      id: `task-${task.id}`,
      title: task.checkContent,
      scope: task.projectName,
      level: '高' as const,
      weight: 3,
      timeText: '',
    }))
  const rectificationRisks = rectifications.map((rectification) => ({
    id: `rectification-${rectification.id}`,
    title: rectification.title,
    scope: rectification.projectName || '整改管理',
    level: isBeforeToday(rectification.deadline, now) ? ('高' as const) : ('中' as const),
    weight: isBeforeToday(rectification.deadline, now) ? 4 : 2,
    timeText: rectification.updatedAt || rectification.createdAt || rectification.deadline,
  }))
  const delayedProjectRisks = projects
    .filter((project) => project.status !== 'completed' && project.status !== 'archived' && isBeforeToday(project.endDate, now))
    .map((project) => ({
      id: `project-${project.id}`,
      title: project.name,
      scope: '项目进度已超过截止日期',
      level: '中' as const,
      weight: 2,
      timeText: project.updatedAt || project.createdAt || project.endDate || '',
    }))

  const risks = [...alertRisks, ...taskRisks, ...rectificationRisks, ...delayedProjectRisks]
    .sort((left, right) => right.weight - left.weight || dateValue(right.timeText) - dateValue(left.timeText))
    .slice(0, 5)
    .map(({ id, title, scope, level }) => ({ id, title, scope, level }))

  return risks.length > 0
    ? risks
    : [
        {
          id: 'risk-empty',
          title: '当前权限下暂无高风险记录',
          scope: '来自项目、整改与告警数据',
          level: '低',
        },
      ]
}

function buildAlertItems(alerts: AlertEvent[]): WorkbenchAlertItem[] {
  return [...alerts]
    .sort((left, right) => dateValue(right.timestamp) - dateValue(left.timestamp))
    .slice(0, 5)
    .map((alert) => ({
      id: alert.id,
      title: alert.title,
      content: alert.content,
      level: alert.level,
      timeText: alert.timestamp,
    }))
}

function buildCommandItems({
  highRiskCount,
  projects,
  pendingRectifications,
  archives,
  archiveDocumentCount,
}: {
  highRiskCount: number
  projects: Project[]
  pendingRectifications: RectificationOrder[]
  archives: Archive[]
  archiveDocumentCount: number
}): WorkbenchCommandItem[] {
  const archivableProjectCount = projects.filter((project) => project.status === 'completed').length

  return [
    {
      title: '今日建议',
      value: highRiskCount > 0 ? `优先处理 ${highRiskCount} 个高风险` : '当前无高风险待处理',
    },
    {
      title: '项目推进',
      value: archivableProjectCount > 0 ? `${archivableProjectCount} 个项目可归档` : `${projects.length} 个项目可查看`,
    },
    {
      title: '整改策略',
      value:
        pendingRectifications.length > 0
          ? `${pendingRectifications.length} 个整改待推进`
          : '整改项均已闭环或暂无数据',
    },
    {
      title: '数据质量',
      value: `${archives.length} 个档案，${archiveDocumentCount} 份文档`,
    },
  ]
}

function buildActivities(
  projects: Project[],
  plans: ControlPlan[],
  rectifications: RectificationOrder[],
  logs: LogEntry[],
): WorkbenchActivityItem[] {
  const projectActivities = projects.map((project) => ({
    id: `project-${project.id}`,
    title: `${projectActivityPrefix(project.status)}:${project.name}`,
    timeText: project.updatedAt || project.createdAt || project.startDate,
    type: 'project' as const,
  }))
  const planActivities = plans.map((plan) => ({
    id: `plan-${plan.id}`,
    title: `${planActivityPrefix(plan.status)}:${plan.name}`,
    timeText: plan.updatedAt || plan.createdAt,
    type: 'plan' as const,
  }))
  const rectificationActivities = rectifications.map((rectification) => ({
    id: `rectification-${rectification.id}`,
    title: `${rectificationActivityPrefix(rectification.status)}:${rectification.title}`,
    timeText: rectification.updatedAt || rectification.createdAt || rectification.deadline,
    type: 'rectification' as const,
  }))
  const logActivities = logs.map((log) => ({
    id: `log-${log.id}`,
    title: log.message,
    timeText: log.timestamp,
    type: 'log' as const,
  }))

  return [...projectActivities, ...planActivities, ...rectificationActivities, ...logActivities]
    .sort((left, right) => dateValue(right.timeText) - dateValue(left.timeText))
    .slice(0, 5)
}

function projectActivityPrefix(status: string): string {
  if (status === 'completed') return '项目已完成'
  if (status === 'in_progress') return '项目推进中'
  if (status === 'archived') return '项目已归档'
  return '项目待启动'
}

function planActivityPrefix(status: string): string {
  if (status === 'approved') return '计划已批准'
  if (status === 'completed') return '计划已完成'
  if (status === 'in_progress') return '计划执行中'
  return '计划已更新'
}

function rectificationActivityPrefix(status: RectStatus): string {
  if (status === 'approved') return '整改已闭环'
  if (status === 'in_progress') return '整改处理中'
  return '整改待处理'
}

function taskStatusLabel(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
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
  return labels[status]
}

function taskStatusType(status: TaskStatus): string {
  if (status === 'approved' || status === 'passed') return 'success'
  if (status === 'rejected' || status === 'rectifying' || status === 'nonconforming') return 'danger'
  if (status === 'reviewing' || status === 'submitted' || status === 'uploaded') return 'warning'
  return 'primary'
}

function rectificationStatusLabel(status: RectStatus): string {
  const labels: Record<RectStatus, string> = {
    pending: '待整改',
    in_progress: '整改中',
    approved: '已闭环',
  }
  return labels[status]
}

function rectificationStatusType(status: RectStatus): string {
  if (status === 'approved') return 'success'
  return 'primary'
}

function rectificationPriority(rectification: RectificationOrder, now: Date): 'high' | 'medium' | 'low' {
  if (isBeforeToday(rectification.deadline, now)) return 'high'
  if (rectification.status === 'pending' || rectification.status === 'in_progress') return 'medium'
  return 'low'
}

function priorityWeight(status: TaskStatus | RectStatus): number {
  if (status === 'rejected' || status === 'rectifying') return 3
  if (status === 'reviewing' || status === 'submitted') return 2
  return 1
}

function resolveRiskLevel(pendingCount: number, projectCount: number): string {
  if (pendingCount >= 10 || projectCount >= 20) return '高'
  if (pendingCount >= 4 || projectCount >= 8) return '中'
  return '低'
}

function resolveHealthScore({
  highRiskCount,
  warningAlertCount,
  pendingRectificationCount,
  pendingTaskCount,
}: {
  highRiskCount: number
  warningAlertCount: number
  pendingRectificationCount: number
  pendingTaskCount: number
}): number {
  return clamp(
    100 - highRiskCount * 9 - warningAlertCount * 4 - pendingRectificationCount * 3 - pendingTaskCount * 2,
    0,
    100,
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatFullDate(date: Date): string {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(date)
  return `${year}年${month}月${day}日，${weekday}`
}

function formatShortDate(date: Date): string {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function firstDate(...values: Array<string | undefined>): string {
  const value = values.find((item) => item?.trim())
  return value?.slice(0, 10) || ''
}

function isBeforeToday(value: string | undefined, now: Date): boolean {
  if (!value) return false
  return value.slice(0, 10) < formatIsoDate(now)
}

function dateValue(value: string): number {
  return new Date(value.replace(' ', 'T')).getTime() || 0
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
