// ===========================
// 通用类型定义
// ===========================
export interface PageQuery {
  page: number
  pageSize: number
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: unknown
}
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}
export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedBy: string
  uploadedAt: string
}
export interface OperationLog {
  id: string
  action: string
  operator: string
  operatorName: string
  remark?: string
  createdAt: string
}
export interface DictItem {
  label: string
  value: string | number
  type?: string
  disabled?: boolean
}
export interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
  parentId?: string
  [key: string]: unknown
}

// ===========================
// 用户 & 认证
// ===========================
export interface UserInfo {
  id: string
  username: string
  name: string
  avatar?: string
  department?: string
  email?: string
  phone?: string
  roles: string[]
  permissions: string[]
}
export interface LoginForm {
  username: string
  password: string
  captcha?: string
}
export interface LoginResult {
  token: string
  refreshToken?: string
  expiresIn: number
  user: UserInfo
}

// ===========================
// 资源管理
// ===========================
export type StandardCategory = 'law' | 'system' | 'industry' | 'internal'
export type StandardStatus = 'draft' | 'active' | 'archived'
export interface Standard {
  id: string
  title: string
  category: StandardCategory
  version: string
  publishDate: string
  status: StandardStatus
  attachments: Attachment[]
  tags: string[]
  description?: string
  createdAt: string
  updatedAt: string
  // 版本控制字段
  standardGroupId: string // 同一标准所有版本共享此 ID
  versionNumber: number // 数值版本号 (1, 2, 3...)
  changeLog?: string // 本次修订说明
  previousVersionId?: string // 前一版本 ID
}
export interface ControlChecklist {
  id: string
  code: string
  name: string
  description?: string
  items: ChecklistItem[]
  status: 'draft' | 'active' | 'disabled'
  createdAt: string
  updatedAt: string
}
export interface ChecklistItem {
  id: string
  checklistId: string
  sequence: number
  content: string
  criterion: string
  method?: string
  riskLevel: 'high' | 'medium' | 'low'
}
export interface Archive {
  id: string
  projectId: string
  projectName: string
  archiveDate: string
  documents: ArchiveDocument[]
  status: 'active' | 'sealed'
}
export interface ArchiveDocument {
  id: string
  archiveId: string
  category: string
  name: string
  attachments: Attachment[]
}
export type PersonnelRole = 'auditor' | 'reviewer' | 'leader' | 'member' | 'expert'
export interface Personnel {
  id: string
  name: string
  department: string
  position: string
  phone?: string
  email?: string
  roles: PersonnelRole[]
  skills: string[]
  status: 'active' | 'inactive'
  avatar?: string
}

// ===========================
// 计划管控
// ===========================
export type PlanCycle = 'monthly' | 'quarterly' | 'yearly'
export type PlanStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
export interface ControlPlan {
  id: string
  code: string
  name: string
  cycle: PlanCycle
  year: number
  period: string
  status: PlanStatus
  description?: string
  items: PlanItem[]
  createdBy: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
}
export interface PlanItem {
  id: string
  planId: string
  sequence: number
  targetScope: string
  checklistIds: string[]
  plannedStartDate: string
  plannedEndDate: string
  assignee?: string
  remark?: string
  projectId?: string
}
export interface PlanChange {
  id: string
  planId: string
  changeType: 'add' | 'modify' | 'delete' | 'reschedule'
  description: string
  beforeSnapshot?: string
  afterSnapshot?: string
  status: 'pending' | 'approved' | 'rejected'
  applicant: string
  reviewer?: string
  createdAt: string
}

// ===========================
// 项目管理
// ===========================
export type ProjectSource = 'plan' | 'manual'
export type ProjectStatus = 'preparing' | 'in_progress' | 'closing' | 'completed' | 'archived'
export interface Project {
  id: string
  code: string
  name: string
  source: ProjectSource
  planId?: string
  status: ProjectStatus
  description?: string
  startDate: string
  endDate?: string
  team: TeamMember[]
  tasks: CheckTask[]
  createdBy: string
  createdAt: string
  updatedAt: string
}
export interface TeamMember {
  id: string
  personnelId: string
  personnelName: string
  role: 'leader' | 'auditor' | 'reviewer' | 'member'
  avatar?: string
}
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'dispatched'
  | 'uploaded'
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'rectifying'
export interface CheckTask {
  id: string
  projectId: string
  checklistItemId: string
  checkContent: string
  checkCriterion: string
  assigneeId?: string
  assigneeName?: string
  reviewerId?: string
  reviewerName?: string
  status: TaskStatus
  attachments: Attachment[]
  reviewComment?: string
  logs: OperationLog[]
  createdAt: string
  updatedAt: string
}
export type TaskAction =
  | 'start'
  | 'dispatch'
  | 'upload'
  | 'submit'
  | 'review_approve'
  | 'review_reject'
  | 'review_rectify'

// ===========================
// 整改管理
// ===========================
export type RectSource = 'task' | 'manual'
export type RectStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'reviewing'
  | 'approved'
  | 'rejected'
export interface RectificationOrder {
  id: string
  code: string
  source: RectSource
  taskId?: string
  projectId?: string
  projectName?: string
  title: string
  description: string
  assigneeId: string
  assigneeName: string
  reviewerId: string
  reviewerName: string
  status: RectStatus
  deadline: string
  attachments: Attachment[]
  reviewComment?: string
  logs: OperationLog[]
  createdAt: string
  updatedAt: string
}

// ===========================
// 工作台
// ===========================
export interface DashboardStats {
  projectOverview: { total: number; inProgress: number; completed: number; overdue: number }
  taskOverview: {
    total: number
    pending: number
    inProgress: number
    completed: number
    rejected: number
  }
  rectificationOverview: { total: number; open: number; closed: number; overdueRate: number }
  recentProjects: Project[]
  todoList: TodoItem[]
}
export interface TodoItem {
  id: string
  type: 'task' | 'rectification' | 'review'
  title: string
  deadline?: string
  sourceId: string
  priority: 'high' | 'medium' | 'low'
}
export interface AlertEvent {
  id: string
  source: string
  level: 'critical' | 'warning' | 'info'
  title: string
  content: string
  timestamp: string
  acknowledged: boolean
}
export interface LogEntry {
  id: string
  source: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  detail?: string
  timestamp: string
}

// ===========================
// 智能内控
// ===========================
export interface Rule {
  id: string
  name: string
  description: string
  category: string
  expression: string
  triggerType: 'manual' | 'scheduled' | 'event'
  schedule?: string
  status: 'active' | 'disabled'
  lastRunAt?: string
  executionLogs: RuleExecution[]
  createdAt: string
  updatedAt: string
}
export interface RuleExecution {
  id: string
  ruleId: string
  status: 'success' | 'failure'
  result?: string
  executedAt: string
  duration?: number
}
export interface AIModel {
  id: string
  name: string
  type: 'llm' | 'ml'
  provider: string
  endpoint: string
  description: string
  status: 'online' | 'offline'
  config?: Record<string, unknown>
}
export interface Tool {
  id: string
  name: string
  type: string
  description: string
  endpoint: string
  status: 'available' | 'unavailable'
  config?: Record<string, unknown>
}
