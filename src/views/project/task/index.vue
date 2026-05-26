<template>
  <div class="page-container iris-page">
    <section class="task-page" v-if="task" v-loading="loading">
      <div class="task-header">
        <div class="header-main">
          <el-button link :icon="Back" class="back-btn" @click="backToProject">返回项目</el-button>
          <div>
            <div class="title-line">
              <h2 class="page-title">检查项详情</h2>
              <el-tag effect="plain" class="font-mono">{{ task.id }}</el-tag>
            </div>
            <p class="subtitle">{{ task.taskName || task.checkContent }}</p>
          </div>
        </div>
        <div class="header-actions">
          <el-tag :type="taskStatusType(task.status)" effect="dark" size="large" round>
            {{ taskStatusLabel(task.status) }}
          </el-tag>
        </div>
      </div>

      <div class="task-layout">
        <main class="task-main">
          <section class="section-block inspection-summary">
            <div class="section-heading">
              <span class="heading-mark"></span>
              <h3>检查项信息</h3>
            </div>

            <div class="summary-content">
              <div class="summary-row">
                <label>检查项</label>
                <p>{{ task.checkContent }}</p>
              </div>
              <div class="summary-row">
                <label>判断标准</label>
                <p>{{ task.checkCriterion }}</p>
              </div>
            </div>

            <div class="compact-meta-grid">
              <div class="meta-item">
                <label>检查清单</label>
                <span>{{ task.checklistName || getChecklistName(task.checklistId) }}</span>
              </div>
              <div class="meta-item">
                <label>控制频率</label>
                <span>{{ controlFrequencyLabel(task.controlFrequency) }}</span>
              </div>
              <div class="meta-item">
                <label>评估类</label>
                <span>{{ evaluationTypeLabel(task.evaluationType) }}</span>
              </div>
              <div class="meta-item">
                <label>检查项负责人</label>
                <span>{{ task.assigneeName || '待分配' }}</span>
              </div>
              <div class="meta-item">
                <label>下达时间</label>
                <span>{{ normalizeDateText(task.issuedAt) || '—' }}</span>
              </div>
              <div class="meta-item">
                <label>完成时间</label>
                <span>{{ task.completedAt || '—' }}</span>
              </div>
            </div>

            <div v-if="task.taskDescription" class="summary-description">
              <label>检查项说明</label>
              <p>{{ task.taskDescription }}</p>
            </div>
          </section>

          <section v-if="canViewTaskWorkOrders" class="section-block">
            <div class="section-heading">
              <span class="heading-mark"></span>
              <h3>工单记录</h3>
              <div class="work-order-heading-actions">
                <el-button
                  text
                  type="primary"
                  size="small"
                  :icon="View"
                  @click="archivePreviewVisible = true"
                >
                  归档快照预览
                </el-button>
              </div>
            </div>
            <el-empty
              v-if="visibleWorkOrders.length === 0"
              description="暂无工单"
              :image-size="80"
            />
            <div v-else class="work-order-list">
              <div v-for="order in visibleWorkOrders" :key="order.id" class="work-order-item">
                <div class="work-order-main">
                  <div class="work-order-title-block">
                    <div>
                      <strong>{{ workOrderDisplayTitle(order) }}</strong>
                    </div>
                    <span>{{ personText(order.handlerName, order.handlerEmployeeNo) }}</span>
                  </div>
                  <p v-if="workOrderDescriptionText(order)" class="work-order-description">
                    {{ workOrderDescriptionText(order) }}
                  </p>
                  <div class="work-order-summary-grid">
                    <div
                      v-for="item in workOrderRecordRows(order)"
                      :key="item.label"
                      class="work-order-record-field"
                      :class="{ 'is-wide': item.wide }"
                    >
                      <label>{{ item.label }}</label>
                      <span>{{ item.value }}</span>
                    </div>
                  </div>
                </div>
                <div class="work-order-side">
                  <el-tag
                    size="small"
                    effect="light"
                    round
                    class="provider-badge"
                    :type="workOrderProviderTagType(workOrderProviderOf(order))"
                  >
                    <el-icon>
                      <component :is="workOrderProviderIcon(workOrderProviderOf(order))" />
                    </el-icon>
                    {{ workOrderProviderLabel(workOrderProviderOf(order)) }}
                  </el-tag>
                  <el-tag
                    size="small"
                    effect="dark"
                    :type="workOrderStatusType(order)"
                    :style="workOrderStatusStyle(order)"
                  >
                    {{ workOrderStatusLabel(order) }}
                  </el-tag>
                  <el-tag
                    size="small"
                    effect="plain"
                    :type="auditResultTagType(workOrderReviewResultOf(order))"
                  >
                    {{ auditResultLabel(workOrderReviewResultOf(order)) }}
                  </el-tag>
                  <el-button link type="primary" :icon="View" @click="openWorkOrderDetail(order)">
                    详情/日志
                  </el-button>
                  <el-button
                    v-if="workOrderReviewable(order)"
                    link
                    type="primary"
                    @click="toggleWorkOrderReview(order)"
                  >
                    {{ workOrderReviewForm.workOrderId === order.id ? '收起' : '审核' }}
                  </el-button>
                  <el-button
                    v-if="workOrderReturnable(order)"
                    link
                    type="warning"
                    @click="toggleWorkOrderReturn(order)"
                  >
                    {{ workOrderReturnForm.workOrderId === order.id ? '收起退回' : '退回 OMS' }}
                  </el-button>
                  <el-button
                    v-if="workOrderRectificationCreatable(order)"
                    link
                    type="warning"
                    :loading="workOrderRectificationCreatingIds.has(order.id)"
                    @click="handleCreateWorkOrderRectification(order)"
                  >
                    生成该工单整改单
                  </el-button>
                  <el-button
                    v-if="workOrderRiskAcceptable(order)"
                    link
                    type="danger"
                    @click="toggleWorkOrderRisk(order)"
                  >
                    {{ workOrderRiskForm.workOrderId === order.id ? '收起风险' : '承担风险' }}
                  </el-button>
                  <el-popconfirm
                    v-if="workOrderDeletable(order)"
                    title="确认删除该工单吗？"
                    width="220"
                    confirm-button-text="删除"
                    cancel-button-text="取消"
                    @confirm="handleDeleteWorkOrder(order)"
                  >
                    <template #reference>
                      <el-button
                        link
                        type="danger"
                        :icon="DeleteIcon"
                        :loading="workOrderDeletingIds.has(order.id)"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
                <div
                  v-if="workOrderReviewable(order) && workOrderReviewForm.workOrderId === order.id"
                  class="work-order-review-panel"
                >
                  <el-form label-position="top" class="handle-form review-form">
                    <el-form-item label="审核结果">
                      <el-radio-group v-model="workOrderReviewForm.result">
                        <el-radio-button value="passed">通过</el-radio-button>
                        <el-radio-button value="rectification_required">不符合项</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="审核意见">
                      <el-input
                        v-model="workOrderReviewForm.opinion"
                        type="textarea"
                        :rows="3"
                        maxlength="500"
                        show-word-limit
                      />
                    </el-form-item>
                    <el-button
                      type="primary"
                      plain
                      class="submit-btn"
                      @click="handleConfirmWorkOrderReview"
                    >
                      确认工单审核
                    </el-button>
                  </el-form>
                </div>
                <div
                  v-if="workOrderReturnable(order) && workOrderReturnForm.workOrderId === order.id"
                  class="work-order-return-panel"
                >
                  <el-form label-position="top" class="handle-form review-form">
                    <el-form-item label="退回原因">
                      <el-input
                        v-model="workOrderReturnForm.reason"
                        type="textarea"
                        :rows="3"
                        maxlength="500"
                        show-word-limit
                      />
                    </el-form-item>
                    <el-button
                      type="warning"
                      plain
                      class="submit-btn"
                      :loading="workOrderReturningIds.has(order.id)"
                      :disabled="!workOrderReturnForm.reason.trim()"
                      @click="handleReturnWorkOrder(order)"
                    >
                      确认退回 OMS
                    </el-button>
                  </el-form>
                </div>
                <div
                  v-if="
                    workOrderRiskAcceptable(order) &&
                    workOrderRiskForm.workOrderId === order.id
                  "
                  class="work-order-risk-panel"
                >
                  <el-form label-position="top" class="handle-form review-form">
                    <el-form-item label="承担风险原因">
                      <el-input
                        v-model="workOrderRiskForm.reason"
                        type="textarea"
                        :rows="3"
                        maxlength="500"
                        show-word-limit
                      />
                    </el-form-item>
                    <el-button
                      type="danger"
                      plain
                      class="submit-btn"
                      :loading="workOrderRiskAcceptingIds.has(order.id)"
                      :disabled="!workOrderRiskForm.reason.trim()"
                      @click="handleAcceptWorkOrderRisk(order)"
                    >
                      确认承担风险
                    </el-button>
                  </el-form>
                </div>
              </div>
            </div>
          </section>
          <section v-else class="section-block">
            <el-alert
              title="当前用户仅可查看检查项基础信息"
              type="info"
              show-icon
              :closable="false"
            />
          </section>
        </main>

        <aside class="task-side">
          <section class="side-panel">
            <div class="section-heading compact">
              <span class="heading-mark"></span>
              <h3>检查单流程</h3>
            </div>
            <div class="flow-list">
              <div class="flow-item">
                <span>检查项生成</span>
                <strong>已生成</strong>
              </div>
              <div class="flow-item">
                <span>工单数量</span>
                <strong>{{ visibleWorkOrders.length }}</strong>
              </div>
              <div class="flow-item">
                <span>当前结果</span>
                <strong>{{ inspectionAuditResultText }}</strong>
              </div>
            </div>
          </section>

          <section
            v-if="handleModeRequested"
            class="side-panel work-order-panel"
            :class="{ emphasized: handleModeRequested }"
          >
            <div class="section-heading compact">
              <span class="heading-mark"></span>
              <h3>办理检查项</h3>
            </div>

            <el-alert
              v-if="!canHandleInspectionItem"
              :title="inspectionItemHandleTip"
              type="info"
              show-icon
              :closable="false"
              class="handle-alert"
            />

            <template v-else>
              <div class="provider-switch">
                <el-segmented v-model="workOrderMode" :options="workOrderModeOptions" block />
                <p>{{ activeWorkOrderModeDescription }}</p>
              </div>

              <el-form v-if="workOrderMode === 'oms'" label-position="top" class="handle-form">
                <el-form-item label="任务名称">
                  <el-input v-model="workOrderForm.taskName" maxlength="80" show-word-limit />
                </el-form-item>
                <el-form-item label="任务描述">
                  <el-input
                    v-model="workOrderForm.taskDescription"
                    type="textarea"
                    :rows="4"
                    maxlength="300"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item label="下达时间">
                  <el-date-picker
                    v-model="workOrderForm.issuedAt"
                    type="date"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    placeholder="选择下达时间"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="工单负责人">
                  <el-select
                    v-model="workOrderForm.handlerId"
                    placeholder="选择工单负责人"
                    style="width: 100%"
                    filterable
                    remote
                    reserve-keyword
                    clearable
                    :remote-method="searchOmsUsers"
                    :loading="omsUserLoading"
                  >
                    <el-option
                      v-for="user in omsUserOptions"
                      :key="user.userId"
                      :label="omsUserLabel(user)"
                      :value="user.userId"
                    >
                      <span>{{ user.userName }}</span>
                      <span class="option-meta">{{ user.userCode }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-button
                  type="primary"
                  class="submit-btn"
                  :loading="workOrderSubmitting"
                  :disabled="!workOrderForm.taskName.trim() || workOrderHandlers.length === 0"
                  @click="handleCreateWorkOrders"
                >
                  生成 OMS 工单
                </el-button>
              </el-form>
            </template>
          </section>
        </aside>
      </div>

      <el-drawer
        v-model="archivePreviewVisible"
        title="归档快照预览"
        size="520px"
        class="archive-preview-drawer"
      >
        <div class="archive-drawer-content">
          <div class="archive-summary">
            <div v-for="item in archiveSnapshotPreview" :key="item.label" class="archive-item">
              <label>{{ item.label }}</label>
              <span>{{ item.value }}</span>
            </div>
          </div>
          <div class="archive-flow">
            <div
              v-for="item in archiveSnapshotLogPreview"
              :key="item.title"
              class="archive-flow-item"
            >
              <strong>{{ item.title }}</strong>
              <span>{{ item.description }}</span>
            </div>
          </div>
        </div>
      </el-drawer>
      <el-drawer v-model="workOrderDetailVisible" title="工单详情" size="520px" append-to-body>
        <div v-if="selectedWorkOrder" class="work-order-detail">
          <div class="detail-title-row">
            <div>
              <strong>{{ workOrderDisplayTitle(selectedWorkOrder) }}</strong>
              <span>{{ workOrderDisplayCode(selectedWorkOrder) }}</span>
            </div>
            <el-tag
              size="small"
              effect="light"
              round
              :type="workOrderProviderTagType(workOrderProviderOf(selectedWorkOrder))"
            >
              {{ workOrderProviderLabel(workOrderProviderOf(selectedWorkOrder)) }}
            </el-tag>
          </div>

          <div class="detail-grid">
            <div
              v-for="item in workOrderDetailRows(selectedWorkOrder)"
              :key="item.label"
              class="detail-item"
            >
              <label>{{ item.label }}</label>
              <span>{{ item.value }}</span>
            </div>
          </div>

          <div class="detail-section-title">
            <h4>工单日志</h4>
            <el-button
              v-if="workOrderProviderOf(selectedWorkOrder) === 'oms'"
              link
              type="primary"
              :loading="workOrderDetailRefreshing"
              @click="refreshSelectedWorkOrder"
            >
              刷新 OMS 日志
            </el-button>
          </div>
          <el-empty
            v-if="selectedWorkOrderLogRows.length === 0"
            description="暂无工单日志"
            :image-size="72"
          />
          <div v-else class="work-order-log-list">
            <div v-for="log in selectedWorkOrderLogRows" :key="log.id" class="work-order-log-item">
              <div class="log-meta">
                <strong>{{ log.action }}</strong>
                <span>{{ log.occurredAt }}</span>
              </div>
              <p>{{ log.content }}</p>
              <div v-if="log.isWorkLog" class="log-extra">
                <span v-if="log.recordDate">日志时间：{{ log.recordDate }}</span>
                <span v-if="log.duration">处理时长：{{ log.duration }}</span>
              </div>
              <div v-if="log.isWorkLog && log.attachments.length > 0" class="log-attachments">
                <span>附件：</span>
                <el-link
                  v-for="attachment in log.attachments"
                  :key="attachment.id"
                  :href="attachment.url || undefined"
                  :underline="false"
                  :disabled="!attachment.url"
                  target="_blank"
                  type="primary"
                >
                  {{ attachment.name }}
                </el-link>
              </div>
              <div class="log-footer">
                <span>{{ log.operator }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-drawer>
    </section>

    <el-empty v-else-if="!loading" description="未找到该检查项" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back, Connection, Delete as DeleteIcon, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { checklistApi, omsApi, projectApi, rectificationApi, taskApi } from '@/api'
import {
  CONTROL_FREQUENCY_OPTIONS,
  EVALUATION_TYPE_OPTIONS,
  normalizeChecklistPageFromApi,
  optionLabel,
} from '@/features/checklists/checklist-data'
import {
  getProjectMembers,
  normalizeProject,
  normalizeProjectPage,
  taskStatusLabel,
  taskStatusType,
  WORK_ORDER_PROVIDER_OPTIONS,
  workOrderProviderLabel,
} from '@/features/projects/project-data'
import { useUserStore } from '@/stores'
import type {
  CheckTask,
  ControlChecklist,
  Project,
  ProjectTaskWorkOrder,
  RectificationOrder,
  OmsUser,
  WorkOrderProvider,
} from '@/types'

type BackendPage<T> = {
  records?: T[]
  list?: T[]
}

interface WorkOrderLogAttachment {
  id: string
  name: string
  url: string
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const task = ref<CheckTask>()
const project = ref<Project>()
const checklistOptions = ref<ControlChecklist[]>([])
const workOrders = ref<ProjectTaskWorkOrder[]>([])
const omsUserOptions = ref<OmsUser[]>([])
const omsUserLoading = ref(false)
const omsUserSearchSeq = ref(0)
const workOrderSubmitting = ref(false)
const workOrderDeletingIds = ref(new Set<string>())
const workOrderReturningIds = ref(new Set<string>())
const workOrderRectificationCreatingIds = ref(new Set<string>())
const workOrderRiskAcceptingIds = ref(new Set<string>())
const workOrderMode = ref<WorkOrderProvider>('oms')
const workOrderForm = ref({
  taskName: '',
  taskDescription: '',
  issuedAt: '',
  handlerId: '',
})
const workOrderReviewForm = ref({
  workOrderId: '',
  result: '',
  opinion: '',
})
const workOrderReturnForm = ref({
  workOrderId: '',
  reason: '',
})
const workOrderRiskForm = ref({
  workOrderId: '',
  reason: '',
})
const workOrderReviewResults = ref<Record<string, { result: string; opinion: string }>>({})
const workOrderDetailVisible = ref(false)
const selectedWorkOrder = ref<ProjectTaskWorkOrder>()
const workOrderDetailRefreshing = ref(false)
const archivePreviewVisible = ref(false)
const taskRectifications = ref<RectificationOrder[]>([])
const auditResultOptions = [
  { label: '待审核', value: 'pending' },
  { label: '通过', value: 'passed' },
  { label: '不符合项', value: 'rectification_required' },
  { label: '已退回', value: 'returned' },
]

onMounted(async () => {
  await userStore.ensureUserInfoLoaded()
  await Promise.all([loadChecklistOptions(), loadTask()])
  resetWorkOrderForm()
  await Promise.all([loadWorkOrders(), loadTaskRectifications()])
})

const projectId = computed(
  () => (route.query.projectId as string | undefined) || project.value?.id || '',
)
const handleModeRequested = computed(() => route.query.action === 'handle')
const workOrderModeOptions = WORK_ORDER_PROVIDER_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value,
}))
const activeWorkOrderModeDescription = computed(
  () =>
    WORK_ORDER_PROVIDER_OPTIONS.find((item) => item.value === workOrderMode.value)?.description ||
    '',
)
const members = computed(() => (project.value ? getProjectMembers(project.value) : []))
const currentUserIdentityValues = computed(() => {
  const user = userStore.userInfo
  return new Set([user?.id, user?.username, user?.name].map(normalizeIdentityValue).filter(Boolean))
})
const currentProjectMember = computed(() =>
  members.value.find((member) =>
    [member.personnelId, member.employeeNo, member.personnelName]
      .map(normalizeIdentityValue)
      .some((value) => currentUserIdentityValues.value.has(value)),
  ),
)
const canManageProject = computed(() => {
  return (
    (!!project.value?.leaderId &&
      currentUserIdentityValues.value.has(String(project.value.leaderId))) ||
    (!!project.value?.leaderName &&
      currentUserIdentityValues.value.has(project.value.leaderName)) ||
    currentProjectMember.value?.role === 'leader'
  )
})
const completedTaskStatuses = ['passed', 'nonconforming', 'approved']
const unhandleableTaskStatuses = completedTaskStatuses.filter((status) => status !== 'nonconforming')
const hasInspectionItemAssignee = computed(() => {
  return !!normalizeIdentityValue(task.value?.assigneeId || task.value?.assigneeName)
})
const isCurrentInspectionItemAssignee = computed(() => {
  const member = currentProjectMember.value
  return (
    currentUserIdentityValues.value.has(normalizeIdentityValue(task.value?.assigneeId)) ||
    currentUserIdentityValues.value.has(normalizeIdentityValue(task.value?.assigneeName)) ||
    (!!member &&
      (normalizeIdentityValue(member.personnelId) ===
        normalizeIdentityValue(task.value?.assigneeId) ||
        normalizeIdentityValue(member.personnelName) ===
          normalizeIdentityValue(task.value?.assigneeName)))
  )
})
const canHandleInspectionItem = computed(() => {
  return (
    !!project.value &&
    !!task.value &&
    project.value.status === 'in_progress' &&
    hasInspectionItemAssignee.value &&
    !unhandleableTaskStatuses.includes(task.value.status) &&
    (canManageProject.value || isCurrentInspectionItemAssignee.value)
  )
})
const canViewTaskWorkOrders = computed(
  () => canManageProject.value || isCurrentInspectionItemAssignee.value,
)
const canOperateInspectionItem = computed(
  () => handleModeRequested.value && canHandleInspectionItem.value,
)
const inspectionItemHandleTip = computed(() => {
  if (!project.value || !task.value) return '检查项数据加载后才能办理'
  if (!hasInspectionItemAssignee.value) return '请先分配检查项负责人'
  if (project.value.status === 'not_started') return '项目启动后才能办理'
  if (project.value.status === 'completed') return '项目已完成，不能办理'
  if (project.value.status === 'archived') return '项目已归档，不能办理'
  if (unhandleableTaskStatuses.includes(task.value.status)) return '检查项已完成，不能重复办理'
  if (!canManageProject.value && !isCurrentInspectionItemAssignee.value)
    return '只有项目负责人或检查项负责人可以办理'
  return '当前状态不能办理'
})
const workOrderHandlers = computed(() =>
  selectedOmsUser.value
    ? [
        {
          handlerId: selectedOmsUser.value.userId,
          handlerEmployeeNo: normalizeIdentityValue(selectedOmsUser.value.userCode),
          handlerName: selectedOmsUser.value.userName,
        },
      ]
    : [],
)
const selectedOmsUser = computed(() =>
  omsUserOptions.value.find((user) => user.userId === workOrderForm.value.handlerId),
)
const visibleWorkOrders = computed<ProjectTaskWorkOrder[]>(() => workOrders.value)
const selectedWorkOrderLogRows = computed(() =>
  selectedWorkOrder.value ? workOrderLogRows(selectedWorkOrder.value) : [],
)
const workOrderDisplayCode = (order: ProjectTaskWorkOrder) =>
  order.omsWorkOrderId || order.externalWorkOrderId || order.id
const workOrderDisplayTitle = (order: ProjectTaskWorkOrder) =>
  order.taskName ||
  order.workOrderTitle ||
  task.value?.taskName ||
  task.value?.checkContent ||
  workOrderDisplayCode(order)
const workOrderDescriptionText = (order: ProjectTaskWorkOrder) =>
  order.taskDescription || order.workOrderDescription || task.value?.taskDescription || ''
const personText = (name?: string, employeeNo?: string) => {
  if (name && employeeNo) return `${name} (${employeeNo})`
  return name || employeeNo || '—'
}
const workOrderRecordRows = (order: ProjectTaskWorkOrder) => [
  { label: '下达时间', value: normalizeDateText(order.issuedAt) || '—' },
  { label: '完成时间', value: normalizeDateTimeText(order.completedAt) || '—' },
  { label: '审核结果', value: auditResultLabel(workOrderReviewResultOf(order)) },
  ...(workOrderReviewResultOf(order) === 'rectification_required'
    ? [{ label: '处置方式', value: nonconformityDispositionLabel(order) }]
    : []),
  ...(order.nonconformityDisposition === 'risk_accepted'
    ? [{ label: '承担风险原因', value: order.riskAcceptanceReason || '—', wide: true }]
    : []),
]
const workOrderDetailRows = (order: ProjectTaskWorkOrder) => [
  { label: '任务名称', value: workOrderDisplayTitle(order) },
  {
    label: '任务描述',
    value:
      order.taskDescription || order.workOrderDescription || task.value?.taskDescription || '—',
  },
  { label: '工单负责人', value: personText(order.handlerName, order.handlerEmployeeNo) },
  { label: '下达时间', value: normalizeDateText(order.issuedAt) || '—' },
  { label: '完成时间', value: normalizeDateTimeText(order.completedAt) || '—' },
  { label: '工单状态', value: workOrderStatusLabel(order) },
  { label: '审核结果', value: auditResultLabel(workOrderReviewResultOf(order)) },
  ...(workOrderReviewResultOf(order) === 'rectification_required'
    ? [{ label: '处置方式', value: nonconformityDispositionLabel(order) }]
    : []),
  ...(order.nonconformityDisposition === 'risk_accepted'
    ? [
        { label: '承担风险原因', value: order.riskAcceptanceReason || '—' },
        { label: '承担风险时间', value: normalizeDateTimeText(order.riskAcceptedAt) || '—' },
      ]
    : []),
  { label: '同步状态', value: syncStatusLabel(order.syncStatus, order.syncError) },
  { label: '最近同步', value: normalizeDateTimeText(order.lastSyncedAt) || '—' },
]
const inspectionAuditResultText = computed(() => {
  const orders = visibleWorkOrders.value
  if (orders.length === 0) return '待生成工单'
  const results = orders.map((order) => workOrderReviewResultOf(order))
  if (results.some((result) => result === 'pending')) return '待审核'
  if (results.includes('rectification_required')) return '不符合项'
  if (results.length > 0 && results.every((result) => result === 'passed')) return '通过'
  return '待审核'
})
const archiveSnapshotPreview = computed(() => {
  const providerLabel = workOrderProviderLabel(workOrderMode.value)
  return [
    { label: '来源系统', value: providerLabel },
    { label: '检查项', value: task.value?.taskName || task.value?.checkContent || '—' },
    {
      label: '工单负责人',
      value: workOrderHandlers.value.map((handler) => handler.handlerName).join('、') || '待选择',
    },
    { label: '工单数量', value: `${workOrders.value.length} 个 OMS 工单` },
    { label: '检查项结论', value: snapshotResultText.value },
    { label: '附件来源', value: 'OMS 日志附件' },
  ]
})
const archiveSnapshotLogPreview = computed(() => {
  return [
    {
      title: '同步外部工单',
      description: '从 OMS 拉取状态、日志和附件。',
    },
    {
      title: '生成统一快照',
      description: '归档时固化为项目生命周期档案。',
    },
  ]
})
const snapshotResultText = computed(() => {
  return inspectionAuditResultText.value
})

const loadChecklistOptions = async () => {
  const page = normalizeChecklistPageFromApi(await checklistApi.list({ page: 1, pageSize: 100 }))
  checklistOptions.value = page.list
}

const loadTask = async () => {
  loading.value = true
  try {
    const taskId = route.params.id as string
    const queryProjectId = route.query.projectId as string | undefined
    if (queryProjectId) {
      project.value = normalizeProject(await projectApi.detail(queryProjectId))
      task.value = project.value.tasks.find((item) => item.id === taskId)
      return
    }

    const page = normalizeProjectPage(await projectApi.list({ page: 1, pageSize: 100 }))
    const matched = page.list.find((item) =>
      item.tasks.some((candidate) => candidate.id === taskId),
    )
    if (matched) {
      project.value = normalizeProject(await projectApi.detail(matched.id))
      task.value = project.value.tasks.find((item) => item.id === taskId)
    }
  } finally {
    loading.value = false
  }
}

const loadWorkOrders = async () => {
  if (!task.value || !projectId.value) {
    return
  }
  if (!canViewTaskWorkOrders.value) {
    workOrders.value = []
    return
  }
  workOrders.value =
    task.value.workOrders && task.value.workOrders.length > 0
      ? task.value.workOrders
      : await taskApi.listWorkOrders(projectId.value, task.value.id)
}

const loadTaskRectifications = async () => {
  if (!task.value || !projectId.value) {
    taskRectifications.value = []
    return
  }
  const page = (await rectificationApi.list({
    page: 1,
    pageSize: 500,
    projectId: projectId.value,
  })) as BackendPage<RectificationOrder>
  const records = page.records || page.list || []
  taskRectifications.value = records.filter((item) => item.taskId === task.value?.id)
}

const resetWorkOrderForm = () => {
  const currentTask = task.value
  if (!currentTask) return
  workOrderForm.value = {
    taskName: currentTask.taskName || currentTask.checkContent,
    taskDescription: currentTask.taskDescription || currentTask.checkCriterion,
    issuedAt: normalizeDateText(currentTask.issuedAt),
    handlerId: '',
  }
}

const searchOmsUsers = async (keyword: string) => {
  const normalizedKeyword = keyword.trim()
  if (!normalizedKeyword) {
    omsUserOptions.value = []
    return
  }
  const seq = omsUserSearchSeq.value + 1
  omsUserSearchSeq.value = seq
  omsUserLoading.value = true
  try {
    const users = await omsApi.searchUsers({
      keyword: normalizedKeyword,
      page: 1,
      pageSize: 20,
    })
    if (seq === omsUserSearchSeq.value) {
      omsUserOptions.value = users
    }
  } finally {
    if (seq === omsUserSearchSeq.value) {
      omsUserLoading.value = false
    }
  }
}

const omsUserLabel = (user: OmsUser) => `${user.userName} (${user.userCode})`

const handleCreateWorkOrders = async () => {
  if (
    !canOperateInspectionItem.value ||
    !project.value ||
    !task.value ||
    workOrderHandlers.value.length === 0
  )
    return
  const payload = {
    title: workOrderForm.value.taskName.trim() || undefined,
    description: workOrderForm.value.taskDescription.trim() || undefined,
    taskName: workOrderForm.value.taskName.trim() || undefined,
    taskDescription: workOrderForm.value.taskDescription.trim() || undefined,
    issuedAt: workOrderForm.value.issuedAt || undefined,
    handlers: workOrderHandlers.value,
  }
  workOrderSubmitting.value = true
  try {
    await taskApi.createWorkOrders(project.value.id, task.value.id, payload)
    ElMessage.success('工单已生成')
    await loadTask()
    resetWorkOrderForm()
    await loadWorkOrders()
  } catch (error) {
    console.error('create OMS work orders failed', {
      projectId: project.value.id,
      taskId: task.value.id,
      handlers: workOrderHandlers.value,
      payload,
      error,
    })
  } finally {
    workOrderSubmitting.value = false
  }
}

const closeWorkOrderReview = () => {
  workOrderReviewForm.value = {
    workOrderId: '',
    result: '',
    opinion: '',
  }
}

const closeWorkOrderReturn = () => {
  workOrderReturnForm.value = {
    workOrderId: '',
    reason: '',
  }
}

const closeWorkOrderRisk = () => {
  workOrderRiskForm.value = {
    workOrderId: '',
    reason: '',
  }
}

const openWorkOrderReview = (order: ProjectTaskWorkOrder) => {
  if (!workOrderReviewable(order)) return
  const savedReview = workOrderReviewResults.value[order.id]
  workOrderReviewForm.value = {
    workOrderId: order.id,
    result: savedReview?.result || order.irisReviewStatus || '',
    opinion: savedReview?.opinion || order.irisReviewOpinion || '',
  }
  closeWorkOrderReturn()
  closeWorkOrderRisk()
}

const toggleWorkOrderReview = (order: ProjectTaskWorkOrder) => {
  if (workOrderReviewForm.value.workOrderId === order.id) {
    closeWorkOrderReview()
    return
  }
  openWorkOrderReview(order)
}

const openWorkOrderReturn = (order: ProjectTaskWorkOrder) => {
  if (!workOrderReturnable(order)) return
  workOrderReturnForm.value = {
    workOrderId: order.id,
    reason: '',
  }
  closeWorkOrderReview()
  closeWorkOrderRisk()
}

const toggleWorkOrderReturn = (order: ProjectTaskWorkOrder) => {
  if (workOrderReturnForm.value.workOrderId === order.id) {
    closeWorkOrderReturn()
    return
  }
  openWorkOrderReturn(order)
}

const openWorkOrderRisk = (order: ProjectTaskWorkOrder) => {
  if (!workOrderRiskAcceptable(order)) return
  workOrderRiskForm.value = {
    workOrderId: order.id,
    reason: '',
  }
  closeWorkOrderReview()
  closeWorkOrderReturn()
}

const toggleWorkOrderRisk = (order: ProjectTaskWorkOrder) => {
  if (workOrderRiskForm.value.workOrderId === order.id) {
    closeWorkOrderRisk()
    return
  }
  openWorkOrderRisk(order)
}

const handleConfirmWorkOrderReview = async () => {
  if (!task.value || !projectId.value || !workOrderReviewForm.value.workOrderId) return
  const order = workOrders.value.find((item) => item.id === workOrderReviewForm.value.workOrderId)
  if (!order || !workOrderReviewable(order)) return
  const reviewStatus = workOrderReviewForm.value.result
  if (reviewStatus !== 'passed' && reviewStatus !== 'rectification_required') {
    ElMessage.warning('请选择审核结果')
    return
  }
  const reviewed = await taskApi.reviewWorkOrder(
    projectId.value,
    task.value.id,
    workOrderReviewForm.value.workOrderId,
    {
      reviewStatus,
      opinion: workOrderReviewForm.value.opinion.trim() || undefined,
    },
  )
  workOrders.value = workOrders.value.map((item) => (item.id === reviewed.id ? reviewed : item))
  if (selectedWorkOrder.value?.id === reviewed.id) {
    selectedWorkOrder.value = reviewed
  }
  closeWorkOrderReview()
  await loadTask()
  ElMessage.success('工单审核结果已确认')
}

const handleReturnWorkOrder = async (order: ProjectTaskWorkOrder) => {
  if (!task.value || !projectId.value || workOrderReturnForm.value.workOrderId !== order.id) return
  if (!workOrderReturnable(order)) return
  const reason = workOrderReturnForm.value.reason.trim()
  if (!reason) return
  workOrderReturningIds.value = new Set([...workOrderReturningIds.value, order.id])
  try {
    const returned = await taskApi.returnWorkOrder(projectId.value, task.value.id, order.id, {
      reason,
    })
    workOrders.value = workOrders.value.map((item) => (item.id === returned.id ? returned : item))
    delete workOrderReviewResults.value[returned.id]
    if (selectedWorkOrder.value?.id === returned.id) {
      selectedWorkOrder.value = returned
    }
    closeWorkOrderReturn()
    await loadTask()
    ElMessage.success('工单已退回 OMS')
  } finally {
    const nextReturningIds = new Set(workOrderReturningIds.value)
    nextReturningIds.delete(order.id)
    workOrderReturningIds.value = nextReturningIds
  }
}

const handleCreateWorkOrderRectification = async (order: ProjectTaskWorkOrder) => {
  if (!task.value || !projectId.value || !workOrderRectificationCreatable(order)) return
  try {
    await ElMessageBox.confirm(
      '确认基于该 OMS 工单生成整改单，并同步创建整改 OMS 工单吗？',
      '生成整改单',
      {
        type: 'warning',
        confirmButtonText: '确认生成',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }
  workOrderRectificationCreatingIds.value = new Set([
    ...workOrderRectificationCreatingIds.value,
    order.id,
  ])
  try {
    const created = await taskApi.createWorkOrderRectification(
      projectId.value,
      task.value.id,
      order.id,
    )
    closeWorkOrderRisk()
    ElMessage.success('该工单整改单已生成')
    router.push(`/rectification/detail/${created.id}`)
  } finally {
    const nextCreatingIds = new Set(workOrderRectificationCreatingIds.value)
    nextCreatingIds.delete(order.id)
    workOrderRectificationCreatingIds.value = nextCreatingIds
  }
}

const handleAcceptWorkOrderRisk = async (order: ProjectTaskWorkOrder) => {
  if (!task.value || !projectId.value || workOrderRiskForm.value.workOrderId !== order.id) return
  if (!workOrderRiskAcceptable(order)) return
  const reason = workOrderRiskForm.value.reason.trim()
  if (!reason) return
  try {
    await ElMessageBox.confirm('确认该 OMS 工单不生成整改单，并记录为承担风险吗？', '承担风险', {
      type: 'warning',
      confirmButtonText: '确认承担',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  workOrderRiskAcceptingIds.value = new Set([...workOrderRiskAcceptingIds.value, order.id])
  try {
    const disposed = await taskApi.acceptWorkOrderRisk(projectId.value, task.value.id, order.id, {
      reason,
    })
    workOrders.value = workOrders.value.map((item) => (item.id === disposed.id ? disposed : item))
    if (selectedWorkOrder.value?.id === disposed.id) {
      selectedWorkOrder.value = disposed
    }
    closeWorkOrderRisk()
    ElMessage.success('已记录该工单承担风险')
  } finally {
    const nextRiskAcceptingIds = new Set(workOrderRiskAcceptingIds.value)
    nextRiskAcceptingIds.delete(order.id)
    workOrderRiskAcceptingIds.value = nextRiskAcceptingIds
  }
}

const openWorkOrderDetail = async (order: ProjectTaskWorkOrder) => {
  selectedWorkOrder.value = order
  workOrderDetailVisible.value = true
  if (workOrderProviderOf(order) === 'oms') {
    await refreshWorkOrderDetail(order)
  }
}

const refreshSelectedWorkOrder = async () => {
  if (!selectedWorkOrder.value) return
  await refreshWorkOrderDetail(selectedWorkOrder.value)
}

const refreshWorkOrderDetail = async (order: ProjectTaskWorkOrder) => {
  if (!task.value || !projectId.value || workOrderProviderOf(order) !== 'oms') return
  workOrderDetailRefreshing.value = true
  try {
    const refreshed = await taskApi.refreshWorkOrder(projectId.value, task.value.id, order.id)
    workOrders.value = workOrders.value.map((item) => (item.id === refreshed.id ? refreshed : item))
    selectedWorkOrder.value = refreshed
  } finally {
    workOrderDetailRefreshing.value = false
  }
}

const handleDeleteWorkOrder = async (order: ProjectTaskWorkOrder) => {
  if (!task.value || !projectId.value || !workOrderDeletable(order)) return
  workOrderDeletingIds.value = new Set([...workOrderDeletingIds.value, order.id])
  try {
    await taskApi.deleteWorkOrder(projectId.value, task.value.id, order.id)
    workOrders.value = workOrders.value.filter((item) => item.id !== order.id)
    delete workOrderReviewResults.value[order.id]
    if (workOrderReviewForm.value.workOrderId === order.id) {
      closeWorkOrderReview()
    }
    if (workOrderReturnForm.value.workOrderId === order.id) {
      closeWorkOrderReturn()
    }
    if (workOrderRiskForm.value.workOrderId === order.id) {
      closeWorkOrderRisk()
    }
    if (selectedWorkOrder.value?.id === order.id) {
      workOrderDetailVisible.value = false
      selectedWorkOrder.value = undefined
    }
    ElMessage.success('工单已删除')
  } finally {
    const nextDeletingIds = new Set(workOrderDeletingIds.value)
    nextDeletingIds.delete(order.id)
    workOrderDeletingIds.value = nextDeletingIds
  }
}

const getChecklistName = (id: string) =>
  checklistOptions.value.find((item) => item.id === id)?.name || id

const controlFrequencyLabel = (value?: string) =>
  value ? optionLabel(CONTROL_FREQUENCY_OPTIONS, value) : '—'

const evaluationTypeLabel = (value?: string) =>
  value ? optionLabel(EVALUATION_TYPE_OPTIONS, value) : '—'

const backToProject = () => {
  if (projectId.value) {
    router.push(`/project/detail/${projectId.value}`)
  } else {
    router.back()
  }
}

const normalizeIdentityValue = (value?: string | number | null) => String(value || '').trim()

const auditResultLabel = (result: string) => {
  return auditResultOptions.find((item) => item.value === result)?.label || '待审核'
}

const auditResultTagType = (result: string) => {
  const map: Record<string, 'info' | 'success' | 'danger' | 'warning'> = {
    pending: 'info',
    passed: 'success',
    rectification_required: 'danger',
    returned: 'warning',
  }
  return map[result] || 'info'
}

const workOrderReviewResultOf = (order: ProjectTaskWorkOrder) => {
  return workOrderReviewResults.value[order.id]?.result || order.irisReviewStatus || 'pending'
}

const omsStatusLabelMap: Record<string, string> = {
  created: '已创建',
  create: '已创建',
  new: '已创建',
  pending: '待领取',
  processing: '处理中',
  in_progress: '处理中',
  running: '处理中',
  complete: '已完成',
  completed: '已完成',
  closed: '已归档',
  cancelled: '已终止',
  canceled: '已终止',
  failed: '同步失败',
  '0': '待分配',
  '5': '待领取',
  '10': '处理中',
  '13': '转办中',
  '15': '挂起中',
  '20': '已完成',
  '25': '已终止',
  '30': '已归档',
  '40': '已退回',
}

const omsStatusColorMap: Record<string, { background: string; color: string }> = {
  待分配: { background: '#fbffe8', color: '#93c75b' },
  待领取: { background: '#e5fffb', color: '#00969b' },
  处理中: { background: '#e6f3fe', color: '#386cf9' },
  转办中: { background: '#fff8e7', color: '#d56f24' },
  挂起中: { background: '#faeffe', color: '#5c00a6' },
  已完成: { background: '#f5ffee', color: '#3ec73a' },
  已终止: { background: '#fff1f0', color: '#d21d29' },
  已归档: { background: '#AAAAAA', color: '#FFFFFF' },
  已退回: { background: '#F53F3F', color: '#FFFFFF' },
}

const workOrderRawStatus = (order: ProjectTaskWorkOrder) =>
  String(order.omsStatusName || order.omsStatus || '').trim()

const workOrderStatusLabel = (order: ProjectTaskWorkOrder) => {
  const raw = workOrderRawStatus(order)
  return omsStatusLabelMap[raw] || omsStatusLabelMap[raw.toLowerCase()] || raw || '未知'
}

const workOrderReviewableStatusLabels = ['已完成', '已归档', '已终止']
const workOrderReturnableStatusLabels = ['已完成']
const lockedReviewResults = ['passed', 'rectification_required']
const pendingNonconformityDispositionValues = new Set(['pending', '待处理', '待处置'])

const workOrderReviewLocked = (order: ProjectTaskWorkOrder) =>
  Boolean(order.reviewLocked) || lockedReviewResults.includes(workOrderReviewResultOf(order))

const workOrderReturnable = (order: ProjectTaskWorkOrder) =>
  canOperateInspectionItem.value &&
  !workOrderReviewLocked(order) &&
  workOrderReturnableStatusLabels.includes(workOrderStatusLabel(order))

const workOrderReviewable = (order: ProjectTaskWorkOrder) =>
  canOperateInspectionItem.value &&
  order.reviewable === true &&
  !workOrderReviewLocked(order) &&
  workOrderReviewableStatusLabels.includes(workOrderStatusLabel(order))

const workOrderDeletable = (order: ProjectTaskWorkOrder) =>
  canOperateInspectionItem.value && !workOrderReviewLocked(order)

const workOrderNonconformityPending = (order: ProjectTaskWorkOrder) =>
  workOrderReviewResultOf(order) === 'rectification_required' &&
  isPendingNonconformityDisposition(order.nonconformityDisposition)

const sourceWorkOrderHasRectification = (order: ProjectTaskWorkOrder) =>
  taskRectifications.value.some((item) => item.sourceWorkOrderRecordId === order.id)

const workOrderRectificationCreatable = (order: ProjectTaskWorkOrder) =>
  canOperateInspectionItem.value &&
  workOrderNonconformityPending(order)

const workOrderRiskAcceptable = (order: ProjectTaskWorkOrder) =>
  workOrderRectificationCreatable(order) && !sourceWorkOrderHasRectification(order)

const nonconformityDispositionLabel = (order: ProjectTaskWorkOrder) => {
  const map: Record<string, string> = {
    pending: '待处理',
    待处理: '待处理',
    待处置: '待处理',
    rectification_created: '已生成整改单',
    risk_accepted: '承担风险',
  }
  if (sourceWorkOrderHasRectification(order)) return '已生成整改单'
  return map[String(order.nonconformityDisposition || '')] || '待处置'
}

const isPendingNonconformityDisposition = (value?: string | null) => {
  const normalized = String(value || '').trim()
  return !normalized || pendingNonconformityDispositionValues.has(normalized)
}

const workOrderStatusStyle = (order: ProjectTaskWorkOrder) => {
  const color = omsStatusColorMap[workOrderStatusLabel(order)]
  if (!color) return {}
  return {
    backgroundColor: color.background,
    borderColor: color.background,
    color: color.color,
  }
}

const syncStatusLabel = (status?: string, error?: string) => {
  if (error) return `同步失败：${error}`
  const map: Record<string, string> = {
    synced: '已同步',
    failed: '同步失败',
    not_synced: '未同步',
  }
  return map[status || ''] || status || '—'
}

const workOrderLogRows = (order: ProjectTaskWorkOrder) => {
  const parsedLogs = parseJsonArray(order.omsLogPayload)
  return parsedLogs.map((log, index) => {
    const row = log as Record<string, unknown>
    const rawAction = String(row.action || row.actionName || row.RECORD_GDCZ || '日志')
    const attachmentsPayload = row.attachmentsPayload || row.RECORD_FJ || ''
    return {
      id: String(row.id || row.logId || `${order.id}-${index}`),
      occurredAt: normalizeDateTimeText(
        String(row.occurredAt || row.SY_CREATETIME || row.time || row.createdAt || ''),
      ),
      operator: String(
        row.operator || row.SY_CREATEUSERNAME || row.operatorName || row.userName || 'OMS',
      ),
      action: workOrderLogActionLabel(rawAction),
      content: String(row.content || row.RECORD_CZXQ || row.message || row.description || '—'),
      // OMS 的“日志”动作会额外返回 RECORD_RQ/RECORD_GS/RECORD_FJ，用于展示日志时间、处理时长和附件。
      isWorkLog: isWorkLogAction(rawAction),
      recordDate: normalizeDateText(String(row.recordDate || row.RECORD_RQ || '')),
      duration: formatDurationText(String(row.duration || row.RECORD_GS || '')),
      attachments: parseWorkOrderLogAttachments(attachmentsPayload),
    }
  })
}

const parseJsonArray = (payload?: string): unknown[] => {
  if (!payload) return []
  try {
    const parsed = JSON.parse(payload) as unknown
    if (Array.isArray(parsed)) return parsed
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { logs?: unknown[] }).logs)
    ) {
      return (parsed as { logs: unknown[] }).logs
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { data?: unknown[] }).data)
    ) {
      return (parsed as { data: unknown[] }).data
    }
    return []
  } catch {
    return []
  }
}

const workOrderLogActionLabel = (action: string) => {
  const normalized = action.trim().toLowerCase()
  const map: Record<string, string> = {
    create: '创建工单',
    created: '创建工单',
    submit: '提交',
    complete: '完成工单',
    completed: '完成工单',
    close: '关闭工单',
    comment: '工作日志',
    back: '退回工单',
    return: '退回工单',
    returned: '退回工单',
  }
  return map[normalized] || action || '日志'
}

const isWorkLogAction = (action: string) => {
  const normalized = action.trim().toLowerCase()
  return normalized === '日志' || normalized === 'comment' || normalized === 'log'
}

const formatDurationText = (value: string) => {
  const normalized = value.trim()
  if (!normalized) return ''
  return /小时|分钟|h$/i.test(normalized) ? normalized : `${normalized} 小时`
}

const parseWorkOrderLogAttachments = (payload: unknown): WorkOrderLogAttachment[] => {
  const parsed = parseJsonValue(payload)
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { data?: unknown[] }).data)
      ? (parsed as { data: unknown[] }).data
      : []

  return rows
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => {
      const name = String(
        item.originalFileName ||
          item.allFireName ||
          item.fileName ||
          item.name ||
          `附件${index + 1}`,
      )
      return {
        id: String(item.id || item.jeFileInfoId || item.fileName || `${name}-${index}`),
        name,
        url: String(item.minioUrl || item.url || ''),
      }
    })
}

const parseJsonValue = (payload: unknown): unknown => {
  if (!payload) return undefined
  if (typeof payload !== 'string') return payload
  const normalized = payload.trim()
  if (!normalized) return undefined
  try {
    return JSON.parse(normalized) as unknown
  } catch {
    return undefined
  }
}

const normalizeDateText = (value?: string | null) => {
  const normalized = String(value || '').replace('T', ' ')
  return normalized ? normalized.slice(0, 10) : ''
}

const normalizeDateTimeText = (value?: string | null) => {
  const normalized = String(value || '')
    .replace('T', ' ')
    .replace(/Z$/, '')
    .trim()
  return normalized ? normalized.split('.')[0] : ''
}

const workOrderProviderOf = (order: ProjectTaskWorkOrder): WorkOrderProvider => {
  if (order.provider) return order.provider
  return 'oms'
}

const workOrderProviderIcon = (provider: WorkOrderProvider) => {
  const map = {
    oms: Connection,
  }
  return map[provider]
}

const workOrderProviderTagType = (provider: WorkOrderProvider) => {
  const map = {
    oms: 'primary',
  }
  return map[provider] as 'primary'
}

const workOrderStatusType = (order: ProjectTaskWorkOrder) =>
  (workOrderReturnable(order) ? 'success' : 'info') as any
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.task-page {
  padding: 24px;
  background: #fff;
  border: 1px solid $iris-border-light;
  border-radius: 8px;
}

.task-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 18px;
  margin-bottom: 22px;
  border-bottom: 1px solid $iris-border-light;
}

.header-main {
  display: grid;
  gap: 10px;
}

.back-btn {
  justify-self: start;
  padding: 0;
}

.title-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: $iris-text-primary;
}

.subtitle {
  max-width: 72ch;
  margin: 6px 0 0;
  color: $iris-text-secondary;
  line-height: 1.6;
}

.task-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;
}

.task-main,
.task-side {
  min-width: 0;
}

.task-side {
  display: grid;
  gap: 16px;
}

.section-block,
.side-panel {
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.section-block + .section-block {
  margin-top: 16px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: $iris-text-primary;
  }

  &.compact {
    margin-bottom: 14px;
  }

  .heading-action {
    margin-left: auto;
  }
}

.work-order-heading-actions {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.inspection-summary {
  padding-bottom: 14px;
}

.summary-content {
  display: grid;
  gap: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.summary-row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 12px;
  align-items: start;

  label {
    font-size: 13px;
    font-weight: 600;
    color: $iris-text-muted;
  }

  p {
    margin: 0;
    color: $iris-text-primary;
    line-height: 1.55;
  }
}

.compact-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.meta-item {
  min-width: 0;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  label,
  span {
    display: block;
  }

  label {
    margin-bottom: 3px;
    font-size: 12px;
    color: $iris-text-muted;
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: $iris-text-primary;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
}

.summary-description {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 12px 0;

  label {
    font-size: 13px;
    font-weight: 600;
    color: $iris-text-muted;
  }

  p {
    margin: 0;
    color: $iris-text-secondary;
    line-height: 1.55;
  }
}

.heading-mark {
  width: 8px;
  height: 8px;
  background: $iris-primary;
  border-radius: 50%;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 24px;
}

.info-item {
  margin-bottom: 12px;

  label {
    display: block;
    margin-bottom: 5px;
    font-size: 13px;
    font-weight: 600;
    color: $iris-text-primary;
  }

  p {
    margin: 0;
    color: $iris-text-secondary;
    line-height: 1.65;
  }
}

.primary-item {
  p {
    color: $iris-text-primary;
  }
}

.description-item {
  margin-top: 14px;
}

.flow-list,
.work-order-list {
  display: grid;
  gap: 12px;
}

.flow-item,
.work-order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.work-order-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  padding: 14px 16px;
}

.flow-item {
  span {
    color: $iris-text-muted;
  }

  strong {
    color: $iris-text-primary;
  }
}

.work-order-main {
  min-width: 0;

  strong {
    color: $iris-text-primary;
  }
}

.work-order-title-block {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;

  > span {
    flex: 0 0 auto;
    max-width: 280px;
    font-size: 13px;
    color: $iris-text-secondary;
    line-height: 1.5;
    overflow-wrap: anywhere;
    text-align: right;
  }
}

.work-order-description {
  margin: 8px 0 0;
  color: $iris-text-secondary;
  line-height: 1.55;
}

.work-order-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.work-order-record-field {
  min-width: 0;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 6px;

  label,
  span {
    display: block;
  }

  label {
    margin-bottom: 2px;
    font-size: 12px;
    color: $iris-text-muted;
  }

  span {
    font-size: 13px;
    color: $iris-text-primary;
    line-height: 1.45;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  &.is-wide {
    grid-column: 1 / -1;
  }
}

.work-order-side {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
  padding-top: 10px;
}

.work-order-review-panel,
.work-order-return-panel,
.work-order-risk-panel {
  grid-column: 1 / -1;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}

.provider-badge {
  font-weight: 600;

  :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.archive-drawer-content {
  display: grid;
  gap: 12px;
}

.archive-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.archive-item {
  min-width: 0;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  label,
  span {
    display: block;
  }

  label {
    margin-bottom: 4px;
    font-size: 12px;
    color: $iris-text-muted;
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: $iris-text-primary;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
}

.archive-flow {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.archive-flow-item {
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 8px;

  strong,
  span {
    display: block;
  }

  strong {
    margin-bottom: 4px;
    color: $iris-text-primary;
  }

  span {
    color: $iris-text-secondary;
    line-height: 1.5;
  }
}

.work-order-detail {
  display: grid;
  gap: 16px;
}

.detail-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;

  strong,
  span {
    display: block;
  }

  strong {
    color: $iris-text-primary;
  }

  span {
    margin-top: 4px;
    font-size: 12px;
    color: $iris-text-muted;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.detail-item {
  min-width: 0;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  label,
  span {
    display: block;
  }

  label {
    margin-bottom: 4px;
    font-size: 12px;
    color: $iris-text-muted;
  }

  span {
    font-size: 13px;
    color: $iris-text-primary;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
}

.detail-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 0;
    color: $iris-text-primary;
  }
}

.work-order-log-list {
  display: grid;
  gap: 10px;
}

.work-order-log-item {
  padding: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  p {
    margin: 8px 0;
    color: $iris-text-primary;
    line-height: 1.6;
  }
}

.log-meta,
.log-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: $iris-text-muted;
}

.log-meta strong {
  color: $iris-text-primary;
}

.log-extra,
.log-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 8px;
  font-size: 12px;
  color: $iris-text-muted;
}

.log-attachments {
  align-items: center;

  .el-link {
    font-size: 12px;
  }
}

.work-order-panel {
  background: #f9fbff;

  &.emphasized {
    border-color: #bfdbfe;
    box-shadow: 0 10px 28px rgb(37 99 235 / 10%);
  }
}

.handle-alert {
  margin-top: 4px;
}

.provider-switch {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;

  p {
    margin: 0;
    font-size: 12px;
    color: $iris-text-secondary;
    line-height: 1.5;
  }
}

.handle-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}

.submit-btn {
  width: 100%;
}

.option-meta {
  float: right;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.font-mono {
  font-family: monospace;
}

@media (max-width: 1100px) {
  .task-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .task-page {
    padding: 16px;
  }

  .task-header,
  .header-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .summary-row,
  .summary-description {
    grid-template-columns: 1fr;
  }

  .compact-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .work-order-item,
  .work-order-summary-grid {
    grid-template-columns: 1fr;
  }

  .work-order-heading-actions,
  .work-order-side {
    justify-content: flex-start;
  }

  .work-order-title-block {
    display: grid;
  }

  .archive-summary,
  .archive-flow {
    grid-template-columns: 1fr;
  }
}
</style>
