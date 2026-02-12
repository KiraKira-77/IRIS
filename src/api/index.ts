import request from './request'
import type {
  PageQuery,
  PageResult,
  LoginForm,
  LoginResult,
  UserInfo,
  Standard,
  ControlChecklist,
  Archive,
  Personnel,
  ControlPlan,
  PlanChange,
  Project,
  CheckTask,
  RectificationOrder,
  DashboardStats,
  AlertEvent,
  LogEntry,
  Rule,
  AIModel,
  Tool,
} from '@/types'

// ========== 认证 ==========
export const authApi = {
  login: (data: LoginForm) => request.post<LoginResult>('/v1/auth/login', data),
  logout: () => request.post('/v1/auth/logout'),
  getUserInfo: () => request.get<UserInfo>('/v1/auth/userinfo'),
}

// ========== 资源管理 ==========
export const standardApi = {
  list: (params: PageQuery) => request.get<PageResult<Standard>>('/v1/standards', params),
  detail: (id: string) => request.get<Standard>(`/v1/standards/${id}`),
  create: (data: Partial<Standard>) => request.post<Standard>('/v1/standards', data),
  update: (id: string, data: Partial<Standard>) =>
    request.put<Standard>(`/v1/standards/${id}`, data),
  delete: (id: string) => request.delete(`/v1/standards/${id}`),
}

export const checklistApi = {
  list: (params: PageQuery) => request.get<PageResult<ControlChecklist>>('/v1/checklists', params),
  detail: (id: string) => request.get<ControlChecklist>(`/v1/checklists/${id}`),
  create: (data: Partial<ControlChecklist>) =>
    request.post<ControlChecklist>('/v1/checklists', data),
  update: (id: string, data: Partial<ControlChecklist>) =>
    request.put<ControlChecklist>(`/v1/checklists/${id}`, data),
  delete: (id: string) => request.delete(`/v1/checklists/${id}`),
}

export const archiveApi = {
  list: (params: PageQuery) => request.get<PageResult<Archive>>('/v1/archives', params),
  detail: (id: string) => request.get<Archive>(`/v1/archives/${id}`),
}

export const personnelApi = {
  list: (params: PageQuery) => request.get<PageResult<Personnel>>('/v1/personnel', params),
  detail: (id: string) => request.get<Personnel>(`/v1/personnel/${id}`),
  create: (data: Partial<Personnel>) => request.post<Personnel>('/v1/personnel', data),
  update: (id: string, data: Partial<Personnel>) =>
    request.put<Personnel>(`/v1/personnel/${id}`, data),
  delete: (id: string) => request.delete(`/v1/personnel/${id}`),
}

// ========== 计划管控 ==========
export const planApi = {
  list: (params: PageQuery) => request.get<PageResult<ControlPlan>>('/v1/plans', params),
  detail: (id: string) => request.get<ControlPlan>(`/v1/plans/${id}`),
  create: (data: Partial<ControlPlan>) => request.post<ControlPlan>('/v1/plans', data),
  update: (id: string, data: Partial<ControlPlan>) =>
    request.put<ControlPlan>(`/v1/plans/${id}`, data),
  delete: (id: string) => request.delete(`/v1/plans/${id}`),
  submit: (id: string) => request.post(`/v1/plans/${id}/submit`),
  approve: (id: string) => request.post(`/v1/plans/${id}/approve`),
  changes: (id: string) => request.get<PlanChange[]>(`/v1/plans/${id}/changes`),
  submitChange: (id: string, data: Partial<PlanChange>) =>
    request.post(`/v1/plans/${id}/changes`, data),
  generate: (id: string) => request.post(`/v1/plans/${id}/generate`),
}

// ========== 项目管理 ==========
export const projectApi = {
  list: (params: PageQuery) => request.get<PageResult<Project>>('/v1/projects', params),
  detail: (id: string) => request.get<Project>(`/v1/projects/${id}`),
  create: (data: Partial<Project>) => request.post<Project>('/v1/projects', data),
  update: (id: string, data: Partial<Project>) => request.put<Project>(`/v1/projects/${id}`, data),
  close: (id: string) => request.post(`/v1/projects/${id}/close`),
  archive: (id: string) => request.post(`/v1/projects/${id}/archive`),
}

export const taskApi = {
  list: (projectId: string, params?: PageQuery) =>
    request.get<PageResult<CheckTask>>(`/v1/projects/${projectId}/tasks`, params),
  detail: (id: string) => request.get<CheckTask>(`/v1/tasks/${id}`),
  start: (id: string) => request.post(`/v1/tasks/${id}/start`),
  dispatch: (id: string, assigneeId: string) =>
    request.post(`/v1/tasks/${id}/dispatch`, { assigneeId }),
  upload: (id: string, file: File) => request.upload(`/v1/tasks/${id}/upload`, file),
  submit: (id: string) => request.post(`/v1/tasks/${id}/submit`),
  review: (id: string, data: { action: 'approve' | 'reject' | 'rectify'; comment?: string }) =>
    request.post(`/v1/tasks/${id}/review`, data),
}

// ========== 整改管理 ==========
export const rectificationApi = {
  list: (params: PageQuery) =>
    request.get<PageResult<RectificationOrder>>('/v1/rectifications', params),
  detail: (id: string) => request.get<RectificationOrder>(`/v1/rectifications/${id}`),
  create: (data: Partial<RectificationOrder>) =>
    request.post<RectificationOrder>('/v1/rectifications', data),
  submit: (id: string) => request.post(`/v1/rectifications/${id}/submit`),
  upload: (id: string, file: File) => request.upload(`/v1/rectifications/${id}/upload`, file),
  review: (id: string, data: { action: 'approve' | 'reject'; comment?: string }) =>
    request.post(`/v1/rectifications/${id}/review`, data),
}

// ========== 工作台 ==========
export const dashboardApi = {
  stats: () => request.get<DashboardStats>('/v1/dashboard/stats'),
}

export const alertApi = {
  list: (params: PageQuery) => request.get<PageResult<AlertEvent>>('/v1/alerts', params),
  acknowledge: (id: string) => request.put(`/v1/alerts/${id}/ack`),
}

export const logApi = {
  list: (params: PageQuery) => request.get<PageResult<LogEntry>>('/v1/logs', params),
}

// ========== 智能内控 ==========
export const ruleApi = {
  list: (params: PageQuery) => request.get<PageResult<Rule>>('/v1/rules', params),
  detail: (id: string) => request.get<Rule>(`/v1/rules/${id}`),
  create: (data: Partial<Rule>) => request.post<Rule>('/v1/rules', data),
  update: (id: string, data: Partial<Rule>) => request.put<Rule>(`/v1/rules/${id}`, data),
  execute: (id: string) => request.post(`/v1/rules/${id}/execute`),
}

export const modelApi = {
  list: (params?: PageQuery) => request.get<PageResult<AIModel>>('/v1/models', params),
  update: (id: string, data: Partial<AIModel>) => request.put<AIModel>(`/v1/models/${id}`, data),
}

export const toolApi = {
  list: (params?: PageQuery) => request.get<PageResult<Tool>>('/v1/tools', params),
}

export const analysisApi = {
  projectAnalysis: (params?: Record<string, unknown>) =>
    request.get('/v1/analysis/project', params),
  annualAnalysis: (year?: number) => request.get('/v1/analysis/annual', { year }),
}
