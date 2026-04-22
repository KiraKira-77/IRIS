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
  code: number | string
  message: string
  data: T
  success?: boolean
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
export interface AuthLoginResult {
  token: string
  userId: number
  tenantId: number
  username: string
  tenantName: string
}
export interface AuthCurrentUser {
  userId: number
  tenantId: number
  username: string
  displayName: string
  tenantName: string
  roles: string[]
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
  parentId?: string // 父计划ID（子计划才有）
  children?: ControlPlan[] // 子计划列表（前端展示用）
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
  checklistIds: string[] // 关联的检查清单ID列表
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
  checklistId: string // 所属清单ID
  checklistItemId: string
  checkContent: string
  checkCriterion: string
  assigneeId?: string // 负责人（一人一条任务）
  assigneeName?: string
  reviewerId?: string
  reviewerName?: string
  workOrderId?: string // 外部工单系统的工单ID
  workOrderStatus?: string // 外部工单状态码
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
// 外部工单系统
// ===========================
export type WorkOrderStatus =
  | '0' // 待分配
  | '5' // 待领取
  | '10' // 处理中
  | '13' // 转办中
  | '15' // 挂起中
  | '20' // 已完成
  | '25' // 已关闭
  | '30' // 已归档（申请人确认）
  | '40' // 已退回（申请人退回）
export interface WorkOrder {
  id?: string // 外部工单ID（创建后回填）
  title: string // 工单标题
  responsibleId: string // 负责人工号
  responsibleName: string
  collaboratorIds?: string[] // 协同人
  serviceType: string // 服务类型
  orderType: string // 工单类型: 普通工单 等
  category: string // 多级类别
  systemName?: string // 系统名称
  moduleName?: string // 模块名称
  labels?: string[] // 节点标签
  relatedProject?: string // 关联项目
  // 申请人
  applicantName: string
  applicantId: string // 工号
  applicantEmail?: string
  applicantDept?: string
  // 实施人
  implementerName: string
  implementerId: string
  implementerEmail?: string
  implementerDept?: string
  // 内容
  priority: 'normal' | 'medium' | 'urgent' | 'immediate'
  content: string
  attachments?: string[]
  // 时间
  plannedStartDate: string
  expectedEndDate: string
  ccUserIds?: string[] // 抄送
  // 状态
  status: WorkOrderStatus
  // 关联
  taskId: string // IRIS CheckTask ID
  projectId: string // IRIS Project ID
}

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
