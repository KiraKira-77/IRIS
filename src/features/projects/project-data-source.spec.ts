import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  buildProjectUpsertPayload,
  filterProjectMemberUsers,
  getAssignableProjectMembers,
  normalizeProjectPage,
  projectChecklistCount,
  projectProgress,
  projectStatusLabel,
  workOrderProviderLabel,
} from './project-data'
import type { PageResult, Project, SystemUser } from '@/types'

const here = dirname(fileURLToPath(import.meta.url))
const projectListSource = readFileSync(join(here, '../../views/project/list/index.vue'), 'utf8')
const projectCreateSource = readFileSync(join(here, '../../views/project/create/index.vue'), 'utf8')
const projectDetailSource = readFileSync(join(here, '../../views/project/detail/index.vue'), 'utf8')
const projectTaskSource = readFileSync(join(here, '../../views/project/task/index.vue'), 'utf8')
const rectificationListSource = readFileSync(
  join(here, '../../views/rectification/list/index.vue'),
  'utf8',
)
const rectificationCreateSource = readFileSync(
  join(here, '../../views/rectification/create/index.vue'),
  'utf8',
)
const rectificationDetailSource = readFileSync(
  join(here, '../../views/rectification/detail/index.vue'),
  'utf8',
)
const archiveSource = readFileSync(join(here, '../../views/resource/archives/index.vue'), 'utf8')
const logCenterSource = readFileSync(join(here, '../../views/workbench/logs/index.vue'), 'utf8')
const alertCenterSource = readFileSync(join(here, '../../views/workbench/alerts/index.vue'), 'utf8')
const modelLibrarySource = readFileSync(join(here, '../../views/smart/models/index.vue'), 'utf8')
const apiSource = readFileSync(join(here, '../../api/index.ts'), 'utf8')
const routerSource = readFileSync(join(here, '../../router/index.ts'), 'utf8')
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

  it('uses project leader, auditor, and observer as the only project team roles', () => {
    expect(projectCreateSource).toContain('label="项目负责人" value="leader"')
    expect(projectCreateSource).toContain('label="项目审计人员" value="auditor"')
    expect(projectCreateSource).toContain('label="观察员" value="observer"')
    expect(projectCreateSource).not.toContain('label="审核人"')
    expect(projectCreateSource).not.toContain('label="评审人"')
    expect(projectCreateSource).not.toContain('label="检查员"')
    expect(typeSource).toContain("'observer'")
  })

  it('only allows project leaders and auditors to be assigned to inspection items', () => {
    const members = [
      { personnelId: '2001', personnelName: '负责人', role: 'leader' },
      { personnelId: '2002', personnelName: '审计人员', role: 'auditor' },
      { personnelId: '2003', personnelName: '观察员', role: 'observer' },
    ] as const

    expect(getAssignableProjectMembers(members).map((member) => member.personnelId)).toEqual([
      '2001',
      '2002',
    ])
    expect(projectDetailSource).toContain('canAssignInspectionItems')
    expect(projectDetailSource).toContain(
      "canManageProject.value &&\n    ['not_started', 'in_progress'].includes(project.value.status)",
    )
    expect(projectDetailSource).toContain('class="assignee-select"')
    expect(projectDetailSource).toContain('label="负责人" min-width="180"')
    expect(projectDetailSource).not.toContain('style="width: 120px"')
  })

  it('does not load inspection item work orders for view-only project members', () => {
    expect(projectTaskSource).toContain('canViewTaskWorkOrders')
    expect(projectTaskSource).toContain('if (!canViewTaskWorkOrders.value)')
    expect(projectTaskSource).toContain('当前用户仅可查看检查项基础信息')
  })

  it('does not expose batch assignment controls on project inspection items', () => {
    expect(projectDetailSource).not.toContain('type="selection"')
    expect(projectDetailSource).not.toContain('批量分配负责人')
    expect(projectDetailSource).not.toContain('batchAssignDialogVisible')
    expect(projectDetailSource).not.toContain('selectedTaskIds')
    expect(projectDetailSource).not.toContain('handleBatchAssignTasks')
    expect(projectDetailSource).not.toContain('taskIds: selectedTaskIds.value')
    expect(projectDetailSource).not.toContain(':disabled="selectedTaskIds.length === 0"')
  })

  it('handles inspection items from the detail page that can create multiple work orders', () => {
    expect(projectDetailSource).toContain('办理')
    expect(projectDetailSource).toContain('canSeeInspectionItemHandleAction(row)')
    expect(projectDetailSource).toContain('canHandleInspectionItem(row)')
    expect(projectDetailSource).toContain(':disabled="!canHandleInspectionItem(row)"')
    expect(projectDetailSource).toContain('inspectionItemHandleTip(row)')
    expect(projectDetailSource).toContain("openInspectionItemDetail(row, 'handle')")
    expect(projectDetailSource).not.toContain('openWorkOrderDialog(row)')
    expect(projectDetailSource).not.toContain('workOrderDialogVisible')

    expect(projectTaskSource).toContain("route.query.action === 'handle'")
    expect(projectTaskSource).toContain('inspection-summary')
    expect(projectTaskSource).toContain('controlFrequencyLabel(task.controlFrequency)')
    expect(projectTaskSource).toContain('evaluationTypeLabel(task.evaluationType)')
    expect(projectTaskSource).toContain('work-order-panel')
    expect(projectTaskSource).toContain('canHandleInspectionItem')
    expect(projectDetailSource).toContain('currentUserIdentityValues')
    expect(projectTaskSource).toContain('isCurrentInspectionItemAssignee')
    expect(projectTaskSource).toContain('task.value?.assigneeName')
    expect(projectTaskSource).toContain('member.employeeNo')
    expect(projectTaskSource).toContain('workOrderForm.handlerId')
    expect(projectTaskSource).toContain('workOrderForm.taskName')
    expect(projectTaskSource).toContain('workOrderForm.taskDescription')
    expect(projectTaskSource).not.toContain('workOrderForm.contactId')
    expect(projectTaskSource).toContain('workOrderForm.issuedAt')
    expect(projectTaskSource).not.toContain('contactUserOptions')
    expect(projectTaskSource).not.toContain('systemUserApi.list')
    expect(projectTaskSource).not.toContain('filterProjectMemberUsers(systemUsers.value)')
    expect(projectTaskSource).toContain('handlerEmployeeNo')
    expect(projectTaskSource).toContain('taskApi.createWorkOrders')
    expect(projectTaskSource).toContain('handlers: workOrderHandlers.value')
    expect(projectTaskSource).not.toContain('contactName: selectedWorkOrderContact.value?.username')
    expect(projectTaskSource).toContain('issuedAt: workOrderForm.value.issuedAt')
    expect(projectTaskSource).not.toContain('completedAt: workOrderForm.value.completedAt')
    expect(projectTaskSource).not.toContain('auditResult: workOrderForm.value.auditResult')
    expect(projectTaskSource).toContain('normalizeDateText(currentTask.issuedAt)')
    expect(projectTaskSource).toContain('value-format="YYYY-MM-DD"')
    expect(projectTaskSource).not.toContain('issuedAt: normalizeDateTimeText(currentTask.issuedAt)')
    expect(projectTaskSource).toContain("project.value.status === 'in_progress'")
    expect(projectDetailSource).toContain(
      'currentUserIdentityValues.value.has(normalizeIdentityValue(task.assigneeId))',
    )
  })

  it('uses OMS as the only work order provider and keeps the archive snapshot preview', () => {
    expect(workOrderProviderLabel('oms')).toBe('OMS 工单')

    expect(projectTaskSource).toContain('workOrderMode')
    expect(projectTaskSource).toContain('workOrderModeOptions')
    expect(projectTaskSource).not.toContain('localWorkOrderForm')
    expect(projectTaskSource).not.toContain('localWorkOrderCreated')
    expect(projectTaskSource).not.toContain('localWorkOrderLogForm')
    expect(projectTaskSource).not.toContain('localWorkOrderLogs')
    expect(projectTaskSource).not.toContain('inspectionConclusionForm')
    expect(projectTaskSource).not.toContain('handleConfirmInspectionConclusion')
    expect(projectTaskSource).toContain('inspectionAuditResultText')
    expect(projectTaskSource).not.toContain('handleCreateLocalWorkOrder')
    expect(projectTaskSource).not.toContain('handleAddLocalWorkOrderLog')
    expect(projectTaskSource).toContain('provider-badge')
    expect(projectTaskSource).toContain('workOrderProviderOf')
    expect(projectTaskSource).toContain('workOrderProviderIcon')
    expect(projectTaskSource).not.toContain('创建本地工单')
    expect(projectTaskSource).not.toContain('提交工作日志')
    expect(projectTaskSource).not.toContain('localWorkOrderDetailRows')
    expect(projectTaskSource).toContain('workOrderRecordRows')
    expect(projectTaskSource).toContain('workOrderDisplayTitle')
    expect(projectTaskSource).toContain('workOrderDisplayCode')
    expect(projectTaskSource).toContain('openWorkOrderDetail')
    expect(projectTaskSource).toContain('workOrderLogRows')
    expect(projectTaskSource).toContain('omsLogPayload')
    expect(projectTaskSource).toContain('RECORD_RQ')
    expect(projectTaskSource).toContain('RECORD_GS')
    expect(projectTaskSource).toContain('RECORD_FJ')
    expect(projectTaskSource).toContain('parseWorkOrderLogAttachments')
    expect(projectTaskSource).toContain('工单日志')
    expect(projectTaskSource).toContain('任务名称')
    expect(projectTaskSource).toContain('任务描述')
    expect(projectTaskSource).not.toContain('对接人')
    expect(projectTaskSource).toContain('下达时间')
    expect(projectTaskSource).toContain('完成时间')
    expect(projectTaskSource).toContain('审核结果')
    expect(projectTaskSource).toContain('workOrderReviewForm')
    expect(projectTaskSource).toContain('toggleWorkOrderReview')
    expect(projectTaskSource).toContain('handleConfirmWorkOrderReview')
    expect(projectTaskSource).toContain('handleDeleteWorkOrder')
    expect(projectTaskSource).toContain('taskApi.deleteWorkOrder')
    expect(projectTaskSource).toContain('确认删除该工单吗')
    expect(projectTaskSource).toContain('收起')
    expect(projectTaskSource).not.toContain('task.workOrderCount || visibleWorkOrders.length')
    expect(apiSource).toContain('deleteWorkOrder')
    expect(apiSource).toContain(
      'request.delete(`/v1/projects/${projectId}/tasks/${taskId}/work-orders/${workOrderId}`)',
    )
    expect(projectTaskSource).toContain('inspectionAuditResultText')
    expect(projectTaskSource).toContain('archivePreviewVisible')
    expect(projectTaskSource).toContain('el-drawer')
    expect(projectTaskSource).not.toContain('archivePreviewPanels')
    expect(projectTaskSource).not.toContain('archive-preview-collapse')
    expect(projectTaskSource.indexOf('workOrderReviewForm')).toBeLessThan(
      projectTaskSource.indexOf('办理检查项'),
    )
    expect(projectTaskSource.indexOf('archivePreviewVisible')).toBeLessThan(
      projectTaskSource.indexOf('办理检查项'),
    )
    expect(projectTaskSource).toContain('详情')
    expect(projectTaskSource).not.toContain('localResultLabel(log.result)')
    expect(projectTaskSource).not.toContain('manualWorkOrderForm')
    expect(projectTaskSource).toContain('archiveSnapshotPreview')
    expect(projectTaskSource).toContain('归档快照预览')
    expect(projectTaskSource).toContain("workOrderMode === 'oms'")
    expect(projectTaskSource).not.toContain("workOrderMode === 'local'")
    expect(projectTaskSource).not.toContain("workOrderMode === 'manual'")
  })

  it('reviews OMS work orders through task APIs without exposing local work orders', () => {
    expect(apiSource).not.toContain('createLocalWorkOrders')
    expect(apiSource).not.toContain('work-orders/local')
    expect(apiSource).toContain('reviewWorkOrder')
    expect(apiSource).toContain(
      '`/v1/projects/${projectId}/tasks/${taskId}/work-orders/${workOrderId}/review`',
    )
    expect(projectTaskSource).not.toContain('taskApi.createLocalWorkOrders')
    expect(projectTaskSource).toContain('taskApi.reviewWorkOrder')
    expect(projectTaskSource).toContain('taskApi.returnWorkOrder')
    expect(projectTaskSource).toContain('taskApi.createWorkOrderRectification')
    expect(projectTaskSource).toContain('taskApi.acceptWorkOrderRisk')
    expect(projectTaskSource).toContain('handleReturnWorkOrder')
    expect(projectTaskSource).toContain('handleCreateWorkOrderRectification')
    expect(projectTaskSource).toContain('handleAcceptWorkOrderRisk')
    expect(projectTaskSource).not.toContain('handleCreateAllPendingRectifications')
    expect(projectTaskSource).not.toContain('openAllPendingWorkOrderRisk')
    expect(projectTaskSource).not.toContain('handleAcceptAllPendingWorkOrderRisk')
    expect(projectTaskSource).not.toContain('workOrderDispositionReady')
    expect(projectTaskSource).not.toContain('pendingNonconformingWorkOrders')
    expect(projectTaskSource).not.toContain('为每个待处置工单生成整改单')
    expect(projectTaskSource).toContain('生成该工单整改单')
    expect(projectTaskSource).not.toContain('待处置工单承担风险')
    expect(projectTaskSource).not.toContain('确认这些工单不生成整改单，承担风险')
    expect(projectTaskSource).not.toContain('batch-risk-panel')
    expect(projectTaskSource).not.toContain('workOrderBatch')
    expect(projectTaskSource).toContain('work-order-summary-grid')
    expect(projectTaskSource).toContain('work-order-title-block')
    expect(projectTaskSource).toContain('workOrderReturnForm')
    expect(projectTaskSource).toContain('workOrderRiskForm')
    expect(projectTaskSource).toContain('toggleWorkOrderReturn')
    expect(projectTaskSource).not.toContain('order.reviewLocked === true &&')
    expect(projectTaskSource).toContain('workOrderReviewable(order)')
    expect(projectTaskSource).toContain('workOrderReturnable(order)')
    expect(projectTaskSource).toContain('workOrderNonconformityPending(order)')
    expect(projectTaskSource).not.toContain('!order.rectificationId')
    expect(projectTaskSource).toContain('nonconformityDispositionLabel')
    expect(projectTaskSource).toContain('v-if="workOrderReviewable(order)"')
    expect(projectTaskSource).toContain('workOrderReviewableStatusLabels')
    expect(projectTaskSource).toContain("['已完成', '已归档']")
    expect(projectTaskSource).not.toContain(
      'const reason = workOrderReviewForm.value.opinion.trim()',
    )
    expect(projectTaskSource).toContain('omsStatusLabelMap')
    expect(projectTaskSource).toContain('omsStatusColorMap')
    expect(projectTaskSource).toContain('workOrderStatusStyle(order)')
    expect(projectTaskSource).toContain("'0': '待分配'")
    expect(projectTaskSource).toContain("'20': '已完成'")
    expect(projectTaskSource).toContain("'25': '已终止'")
    expect(projectTaskSource).toContain("background: '#f5ffee'")
    expect(projectTaskSource).toContain("color: '#3ec73a'")
    expect(projectTaskSource).toContain("background: '#F53F3F'")
    expect(projectTaskSource).toContain("complete: '已完成'")
    expect(projectTaskSource).not.toContain("'25': '已完成'")
    expect(apiSource).toContain('returnWorkOrder')
    expect(apiSource).toContain('createWorkOrderRectification')
    expect(apiSource).toContain('acceptWorkOrderRisk')
    expect(apiSource).toContain('/rectification')
    expect(apiSource).toContain('/risk-acceptance')
    expect(apiSource).toContain(
      '`/v1/projects/${projectId}/tasks/${taskId}/work-orders/${workOrderId}/return`',
    )
    expect(projectTaskSource).toContain('value="rectification_required"')
    expect(projectTaskSource).not.toContain('value="nonconforming"')
    expect(projectTaskSource.indexOf("return '待审核'")).toBeLessThan(
      projectTaskSource.indexOf("return '不符合项'"),
    )
  })

  it('keeps inspection item view mode read-only while preserving detail and archive preview', () => {
    expect(projectTaskSource).toContain('const canOperateInspectionItem = computed')
    expect(projectTaskSource).toContain(
      'handleModeRequested.value && canHandleInspectionItem.value',
    )
    expect(projectTaskSource).toContain('v-if="handleModeRequested"')
    expect(projectTaskSource).toContain('canOperateInspectionItem.value &&')
    expect(projectTaskSource).toContain(
      'const workOrderDeletable = (order: ProjectTaskWorkOrder) =>',
    )
    expect(projectTaskSource).toContain('!workOrderReviewLocked(order)')
    expect(projectTaskSource).toContain('@click="openWorkOrderDetail(order)"')
    expect(projectTaskSource).toContain('@click="archivePreviewVisible = true"')
  })

  it('uses rectification APIs instead of mock rectifications on rectification pages', () => {
    expect(rectificationListSource).toContain('rectificationApi.list')
    expect(rectificationListSource).toContain('handleDelete(row)')
    expect(rectificationListSource).toContain("row.status === 'pending'")
    expect(rectificationListSource).toContain('确认删除整改单')
    expect(rectificationCreateSource).toContain('rectificationApi.create')
    expect(rectificationCreateSource).toContain('projectApi.list')
    expect(rectificationDetailSource).toContain('rectificationApi.detail')
    expect(rectificationDetailSource).toContain('handleDeleteRectification')
    expect(rectificationDetailSource).toContain('rectificationApi.createWorkOrder')
    expect(rectificationDetailSource).toContain('rectificationApi.returnWorkOrder')
    expect(rectificationDetailSource).toContain('rectificationApi.review')
    expect(rectificationDetailSource).toContain('workOrderForm.taskName')
    expect(rectificationDetailSource).toContain('workOrderForm.taskDescription')
    expect(rectificationDetailSource).toContain('workOrderForm.handlerId')
    expect(rectificationDetailSource).toContain('projectApi.detail')
    expect(rectificationDetailSource).toContain('getAssignableProjectMembers')
    expect(rectificationDetailSource).toContain('const canOperateRectification = computed')
    expect(rectificationDetailSource).toContain('isCurrentProjectLeader.value')
    expect(rectificationDetailSource).toContain('isCurrentRectificationAssignee.value')
    expect(rectificationDetailSource).toContain('当前用户仅有查看权限')
    expect(rectificationListSource).toContain('canDeleteRow(row)')
    expect(rectificationListSource).toContain('row.assigneeId')
    expect(rectificationListSource).toContain('row.assigneeName')
    expect(rectificationDetailSource).toContain('payloadFieldLabelMap')
    expect(rectificationDetailSource).toContain('label: payloadFieldLabel(label, index)')
    expect(rectificationDetailSource).not.toContain('扩展字段')
    expect(rectificationDetailSource).toContain('omsStatusLabelMap')
    expect(rectificationDetailSource).toContain('omsStatusColorMap')
    expect(rectificationDetailSource).toContain('rectificationOmsStatusStyle')
    expect(rectificationDetailSource).toContain("background: '#f5ffee'")
    expect(rectificationDetailSource).toContain("background: '#F53F3F'")
    expect(rectificationDetailSource).toContain("'5': '待领取'")
    expect(apiSource).toContain('delete: (id: string) => request.delete(`/v1/rectifications/${id}`)')

    for (const source of [
      rectificationListSource,
      rectificationCreateSource,
      rectificationDetailSource,
    ]) {
      expect(source).not.toContain('mockRectifications')
    }
    expect(rectificationCreateSource).not.toContain('mockProjects')
  })

  it('renames project task wording to inspection item wording', () => {
    expect(projectDetailSource).toContain('检查项')
    expect(projectTaskSource).toContain('检查项详情')
    expect(projectTaskSource).toContain('检查项信息')
    expect(projectTaskSource).not.toContain('核查任务')
    expect(projectTaskSource).not.toContain('任务详情')
    expect(projectTaskSource).not.toContain('任务分配')
  })

  it('does not expose project tags, maintenance domain, or shared domain', () => {
    const projectSources = [
      projectListSource,
      projectCreateSource,
      projectDetailSource,
      projectTaskSource,
    ]
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
    expect(projectApiSource).toContain('archive: (id: string)')
    expect(projectApiSource).toContain('`/v1/projects/${id}/archive`')
    expect(projectApiSource).toContain('update: (id: string, data: ProjectUpsertPayload)')
    expect(projectApiSource).toContain('delete: (id: string)')
    expect(projectApiSource).not.toContain('/close')
    expect(projectApiSource).not.toContain('update: (id: string, data: Partial<Project>)')
  })

  it('archives completed projects from project detail into a single project archive', () => {
    expect(projectDetailSource).toContain('handleArchiveProject')
    expect(projectDetailSource).toContain('projectApi.archive')
    expect(projectDetailSource).toContain("project.status === 'completed'")
    expect(projectDetailSource).toContain('归档项目')
  })

  it('archives completed projects directly from the project list operation column', () => {
    expect(projectListSource).toContain('canArchiveProject(row)')
    expect(projectListSource).toContain('handleArchiveProject(row)')
    expect(projectListSource).toContain('projectApi.archive')
    expect(projectListSource).toContain("row.status === 'completed'")
    expect(projectListSource).toContain('归档')
  })

  it('uses real archive APIs and shows one project archive with full snapshot metadata', () => {
    expect(archiveSource).toContain('archiveApi.list')
    expect(archiveSource).toContain('archiveApi.detail')
    expect(archiveSource).toContain('snapshotJson')
    expect(archiveSource).toContain('taskCount')
    expect(archiveSource).toContain('workOrderCount')
    expect(archiveSource).toContain('rectificationCount')
    expect(archiveSource).not.toContain('mockArchives')
  })

  it('allows archived OMS attachments to be downloaded from archive details', () => {
    expect(archiveSource).toContain('archiveDocumentDownloadItems')
    expect(archiveSource).toContain('minioUrl')
    expect(archiveSource).toContain('download')
    expect(archiveSource).toContain('下载')
  })

  it('uses real log APIs instead of mock logs on the log center page', () => {
    expect(logCenterSource).toContain('logApi.list')
    expect(logCenterSource).toContain('loadLogs')
    expect(logCenterSource).not.toContain('mockLogs')
  })

  it('shows the operator name returned by the real log API on the log center page', () => {
    expect(typeSource).toContain('operatorName?: string')
    expect(logCenterSource).toContain('prop="operatorName"')
    expect(logCenterSource).toContain('selectedLog.operatorName')
  })

  it('uses real alert APIs instead of mock alerts on the alert center page', () => {
    expect(alertCenterSource).toContain('alertApi.list')
    expect(alertCenterSource).toContain('alertApi.acknowledge')
    expect(alertCenterSource).toContain('loadAlerts')
    expect(alertCenterSource).not.toContain('mockAlerts')
  })

  it('uses real model configuration APIs instead of mock models on the model library page', () => {
    expect(modelLibrarySource).toContain('modelApi.list')
    expect(modelLibrarySource).toContain('modelApi.create')
    expect(modelLibrarySource).toContain('modelApi.update')
    expect(modelLibrarySource).toContain('modelApi.test')
    expect(modelLibrarySource).not.toContain('mockModels')
    expect(apiSource).toContain('create: (data: AIModelUpsertPayload)')
    expect(apiSource).toContain('test: (id: string)')
    expect(apiSource).toContain('`/v1/models/${id}/test`')
  })

  it('exposes OpenAI Compatible model configuration fields with Chinese labels', () => {
    expect(typeSource).toContain('providerType: AIModelProviderType')
    expect(typeSource).toContain('baseUrl: string')
    expect(typeSource).toContain('modelName: string')
    expect(typeSource).toContain('apiKeyConfigured: boolean')
    expect(typeSource).toContain('export interface AIModelUpsertPayload')
    expect(typeSource).toContain('apiKey?: string')

    expect(modelLibrarySource).toContain('接口地址')
    expect(modelLibrarySource).toContain('模型名称')
    expect(modelLibrarySource).toContain('API Key')
    expect(modelLibrarySource).toContain('密钥状态')
    expect(modelLibrarySource).toContain('默认模型')
    expect(modelLibrarySource).not.toContain('扩展字段')
  })

  it('shows a project start action on the project list for not started projects', () => {
    expect(projectListSource).toContain('handleStartProject(row)')
    expect(projectListSource).toContain('projectApi.start')
    expect(projectListSource).toContain('canStartProject(row)')
    expect(projectListSource).toContain('canManageProjectRow')
    expect(projectListSource).toContain('启动')
  })

  it('uses create wording for the project creation entry', () => {
    expect(projectListSource).toContain('新建项目')
    expect(routerSource).toContain("title: '新建项目'")
    expect(projectCreateSource).toContain("'新建项目'")
    expect(projectListSource).not.toContain('>项目启动</el-button>')
  })

  it('shows associated plans as a parent-child tree in project creation', () => {
    expect(projectCreateSource).toContain('el-tree-select')
    expect(projectCreateSource).toContain('planTreeOptions')
    expect(projectCreateSource).toContain('buildControlPlanTree')
    expect(projectCreateSource).toContain(':check-strictly="true"')
    expect(projectCreateSource).not.toContain('v-for="p in availablePlans"')
  })

  it('allows project leaders to edit projects until they are archived', () => {
    expect(projectListSource).toContain("row.status !== 'archived'")
    expect(projectListSource).toContain('router.push(`/project/create?id=${row.id}`)')
    expect(projectDetailSource).toContain('canEditProject')
    expect(projectDetailSource).toContain("project.status !== 'archived'")
    expect(projectDetailSource).toContain('router.push(`/project/create?id=${project.id}`)')
    expect(projectCreateSource).toContain('isEditMode')
    expect(projectCreateSource).toContain('projectApi.detail')
    expect(projectCreateSource).toContain('projectApi.update')
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
