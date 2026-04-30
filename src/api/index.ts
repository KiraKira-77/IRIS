import request from './request'
import type {
  AuthCurrentUser,
  AuthLoginResult,
  PageQuery,
  PageResult,
  Standard,
  StandardRollbackPayload,
  StandardUpgradePayload,
  StandardUpsertPayload,
  ControlChecklist,
  ChecklistUpsertPayload,
  Archive,
  Personnel,
  ControlPlan,
  PlanUpsertPayload,
  PlanChange,
  Project,
  ProjectUpsertPayload,
  RectificationOrder,
  RoleRecord,
  RoleUpsertPayload,
  DashboardStats,
  AlertEvent,
  LogEntry,
  Rule,
  AIModel,
  Tool,
} from '@/types'

export const authApi = {
  login: (data: { account: string; password: string }) =>
    request.post<AuthLoginResult>('/v1/auth/login', data),
  logout: () => request.post<void>('/v1/auth/logout'),
  getUserInfo: () => request.get<AuthCurrentUser>('/v1/auth/me'),
}

export const standardApi = {
  list: (params?: PageQuery) => request.get<PageResult<Standard>>('/v1/standards', params),
  detail: (id: string) => request.get<Standard>(`/v1/standards/${id}`),
  create: (data: StandardUpsertPayload) => request.post<Standard>('/v1/standards', data),
  upgrade: (id: string, data: StandardUpgradePayload) =>
    request.post<Standard>(`/v1/standards/${id}/upgrade`, data),
  publish: (id: string) => request.post<Standard>(`/v1/standards/${id}/publish`),
  rollback: (id: string, data: StandardRollbackPayload) =>
    request.post<Standard>(`/v1/standards/${id}/rollback`, data),
  versions: (id: string) => request.get<Standard[]>(`/v1/standards/${id}/versions`),
  update: (id: string, data: StandardUpsertPayload) =>
    request.put<Standard>(`/v1/standards/${id}`, data),
  delete: (id: string) => request.delete(`/v1/standards/${id}`),
  uploadAttachment: (id: string, file: File) =>
    request.upload(`/v1/standards/${id}/attachments`, file),
  deleteAttachment: (id: string, fileId: string) =>
    request.delete(`/v1/standards/${id}/attachments/${fileId}`),
}

export const checklistApi = {
  list: (params: PageQuery) => request.get<PageResult<ControlChecklist>>('/v1/checklists', params),
  detail: (id: string) => request.get<ControlChecklist>(`/v1/checklists/${id}`),
  create: (data: ChecklistUpsertPayload) => request.post<ControlChecklist>('/v1/checklists', data),
  update: (id: string, data: ChecklistUpsertPayload) =>
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

export const planApi = {
  list: (params: PageQuery) => request.get<PageResult<ControlPlan>>('/v1/plans', params),
  detail: (id: string) => request.get<ControlPlan>(`/v1/plans/${id}`),
  create: (data: PlanUpsertPayload) => request.post<ControlPlan>('/v1/plans', data),
  update: (id: string, data: PlanUpsertPayload) =>
    request.put<ControlPlan>(`/v1/plans/${id}`, data),
  delete: (id: string) => request.delete(`/v1/plans/${id}`),
  submit: (id: string) => request.post<ControlPlan>(`/v1/plans/${id}/submit`),
  approve: (id: string) => request.post<ControlPlan>(`/v1/plans/${id}/approve`),
  changes: (id: string) => request.get<PlanChange[]>(`/v1/plans/${id}/changes`),
  submitChange: (id: string, data: Partial<PlanChange>) =>
    request.post(`/v1/plans/${id}/changes`, data),
  generate: (id: string) => request.post(`/v1/plans/${id}/generate`),
}

export const projectApi = {
  list: (params: PageQuery) => request.get<PageResult<Project>>('/v1/projects', params),
  detail: (id: string) => request.get<Project>(`/v1/projects/${id}`),
  create: (data: ProjectUpsertPayload) => request.post<Project>('/v1/projects', data),
  update: (id: string, data: ProjectUpsertPayload) =>
    request.put<Project>(`/v1/projects/${id}`, data),
  start: (id: string) => request.post<Project>(`/v1/projects/${id}/start`),
  complete: (id: string) => request.post<Project>(`/v1/projects/${id}/complete`),
  assignTasks: (
    id: string,
    data: {
      taskIds: string[]
      assigneeId: string
      assigneeName: string
      contactId?: string
      contactName?: string
    },
  ) => request.post<Project>(`/v1/projects/${id}/tasks/assign`, data),
  delete: (id: string) => request.delete(`/v1/projects/${id}`),
}

export const taskApi = {
  listWorkOrders: (projectId: string, taskId: string) =>
    request.get(`/v1/projects/${projectId}/tasks/${taskId}/work-orders`),
  createWorkOrders: (
    projectId: string,
    taskId: string,
    data: {
      title?: string
      description?: string
      handlers: Array<{ handlerId: string; handlerEmployeeNo: string; handlerName: string }>
    },
  ) => request.post(`/v1/projects/${projectId}/tasks/${taskId}/work-orders`, data),
  refreshWorkOrder: (projectId: string, taskId: string, workOrderId: string) =>
    request.post(`/v1/projects/${projectId}/tasks/${taskId}/work-orders/${workOrderId}/refresh`),
}

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

export const dashboardApi = {
  stats: () => request.get<DashboardStats>('/v1/dashboard/stats'),
}

export const roleApi = {
  list: () => request.get<RoleRecord[]>('/v1/system/roles'),
  detail: (id: string | number) => request.get<RoleRecord>(`/v1/system/roles/${id}`),
  create: (data: RoleUpsertPayload) => request.post<RoleRecord>('/v1/system/roles', data),
  update: (id: string | number, data: RoleUpsertPayload) =>
    request.put<RoleRecord>(`/v1/system/roles/${id}`, data),
  delete: (id: string | number) => request.delete<void>(`/v1/system/roles/${id}`),
}

export const alertApi = {
  list: (params: PageQuery) => request.get<PageResult<AlertEvent>>('/v1/alerts', params),
  acknowledge: (id: string) => request.put(`/v1/alerts/${id}/ack`),
}

export const logApi = {
  list: (params: PageQuery) => request.get<PageResult<LogEntry>>('/v1/logs', params),
}

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

export { resourceScopeApi, systemUserApi } from './resource-scope'
