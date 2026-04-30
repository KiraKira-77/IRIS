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
                <label>对接人</label>
                <span>{{ task.contactName || '—' }}</span>
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

          <section class="section-block">
            <div class="section-heading">
              <span class="heading-mark"></span>
              <h3>工单记录</h3>
              <el-button
                text
                type="primary"
                size="small"
                :icon="View"
                class="heading-action"
                @click="archivePreviewVisible = true"
              >
                归档快照预览
              </el-button>
            </div>
            <el-empty
              v-if="visibleWorkOrders.length === 0"
              description="暂无工单"
              :image-size="80"
            />
            <div v-else class="work-order-list">
              <div v-for="order in visibleWorkOrders" :key="order.id" class="work-order-item">
                <div class="work-order-main">
                  <strong>{{ workOrderDisplayTitle(order) }}</strong>
                  <span class="work-order-code">{{ workOrderDisplayCode(order) }}</span>
                  <div class="work-order-record-grid">
                    <div
                      v-for="item in workOrderRecordRows(order)"
                      :key="item.label"
                      class="work-order-record-field"
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
                  <el-tag size="small" effect="dark" :type="workOrderStatusType(order.omsStatus)">
                    {{ order.omsStatusName || order.omsStatus || '未知' }}
                  </el-tag>
                  <el-tag size="small" effect="plain" :type="auditResultTagType(workOrderReviewResultOf(order))">
                    {{ auditResultLabel(workOrderReviewResultOf(order)) }}
                  </el-tag>
                  <el-button link type="primary" @click="toggleWorkOrderReview(order)">
                    {{ workOrderReviewForm.workOrderId === order.id ? '收起' : '审核' }}
                  </el-button>
                  <el-popconfirm
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
                <div v-if="workOrderReviewForm.workOrderId === order.id" class="work-order-review-panel">
                  <el-form label-position="top" class="handle-form review-form">
                    <el-form-item label="审核结果">
                      <el-radio-group v-model="workOrderReviewForm.result">
                        <el-radio-button value="passed">通过</el-radio-button>
                        <el-radio-button value="nonconforming">不符合项</el-radio-button>
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
                      :disabled="!workOrderReviewForm.result"
                      @click="handleConfirmWorkOrderReview"
                    >
                      确认工单审核
                    </el-button>
                  </el-form>
                </div>
              </div>
            </div>
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

          <section class="side-panel work-order-panel" :class="{ emphasized: handleModeRequested }">
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
                <el-segmented
                  v-model="workOrderMode"
                  :options="workOrderModeOptions"
                  block
                />
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
                <el-form-item label="对接人">
                  <el-select
                    v-model="workOrderForm.contactId"
                    placeholder="选择对接人"
                    style="width: 100%"
                    filterable
                  >
                    <el-option
                      v-for="user in contactUserOptions"
                      :key="user.id"
                      :label="systemUserLabel(user)"
                      :value="user.id"
                    >
                      <span>{{ user.username }}</span>
                      <span class="option-meta">{{ user.account }}</span>
                    </el-option>
                  </el-select>
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
                <el-form-item label="工单处理人">
                  <el-select
                    v-model="workOrderForm.handlerId"
                    placeholder="选择处理人"
                    style="width: 100%"
                    filterable
                  >
                    <el-option
                      v-for="member in assignableMembers"
                      :key="member.personnelId"
                      :label="`${member.personnelName} (${member.employeeNo})`"
                      :value="member.personnelId"
                    >
                      <span>{{ member.personnelName }}</span>
                      <span class="option-meta">{{ member.employeeNo }} · {{ roleLabel(member.role) }}</span>
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

              <div v-else-if="workOrderMode === 'local'" class="local-work-order">
                <el-form
                  v-if="!localWorkOrderCreated"
                  label-position="top"
                  class="handle-form"
                >
                  <el-form-item label="任务名称">
                    <el-input v-model="localWorkOrderForm.taskName" maxlength="80" show-word-limit />
                  </el-form-item>
                  <el-form-item label="任务描述">
                    <el-input
                      v-model="localWorkOrderForm.taskDescription"
                      type="textarea"
                      :rows="3"
                      maxlength="300"
                      show-word-limit
                    />
                  </el-form-item>
                  <el-form-item label="对接人">
                    <el-select
                      v-model="localWorkOrderForm.contactId"
                      placeholder="选择对接人"
                      style="width: 100%"
                      filterable
                    >
                      <el-option
                        v-for="user in contactUserOptions"
                        :key="user.id"
                        :label="systemUserLabel(user)"
                        :value="user.id"
                      >
                        <span>{{ user.username }}</span>
                        <span class="option-meta">{{ user.account }}</span>
                      </el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item label="下达时间">
                    <el-date-picker
                      v-model="localWorkOrderForm.issuedAt"
                      type="date"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      placeholder="选择下达时间"
                      style="width: 100%"
                    />
                  </el-form-item>
                  <el-form-item label="工单处理人">
                    <el-select
                      v-model="localWorkOrderForm.handlerId"
                      placeholder="选择处理人"
                      style="width: 100%"
                      filterable
                    >
                      <el-option
                        v-for="member in assignableMembers"
                        :key="member.personnelId"
                        :label="`${member.personnelName} (${member.employeeNo})`"
                        :value="member.personnelId"
                      >
                        <span>{{ member.personnelName }}</span>
                        <span class="option-meta">{{ member.employeeNo }} · {{ roleLabel(member.role) }}</span>
                      </el-option>
                    </el-select>
                  </el-form-item>
                  <el-button
                    type="primary"
                    class="submit-btn"
                    :disabled="!localWorkOrderForm.taskName.trim() || localWorkOrderHandlers.length === 0"
                    @click="handleCreateLocalWorkOrder"
                  >
                    创建本地工单
                  </el-button>
                </el-form>

                <div v-else class="local-work-order-created">
                  <div class="local-work-order-card">
                    <label>本地工单</label>
                    <strong>{{ localWorkOrderId }}</strong>
                    <div class="local-work-order-detail-grid">
                      <div
                        v-for="item in localWorkOrderDetailRows"
                        :key="item.label"
                        class="local-work-order-detail"
                      >
                        <label>{{ item.label }}</label>
                        <span>{{ item.value }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="local-log-section">
                    <div class="mini-heading">详情</div>
                    <div v-if="localWorkOrderLogs.length > 0" class="local-log-list">
                      <div v-for="log in localWorkOrderLogs" :key="log.id" class="local-log-item">
                        <strong>工作日志</strong>
                        <span>{{ log.content }}</span>
                        <small>{{ log.attachments.length }} 个附件</small>
                      </div>
                    </div>
                    <el-empty v-else description="暂无工作日志" :image-size="56" />

                    <el-form label-position="top" class="handle-form log-form">
                      <el-form-item label="日志内容">
                        <el-input
                          v-model="localWorkOrderLogForm.content"
                          type="textarea"
                          :rows="4"
                          maxlength="500"
                          show-word-limit
                        />
                      </el-form-item>
                      <el-form-item label="附件">
                        <el-upload
                          v-model:file-list="localWorkOrderLogForm.attachments"
                          action="#"
                          :auto-upload="false"
                          multiple
                        >
                          <el-button>选择附件</el-button>
                        </el-upload>
                      </el-form-item>
                      <el-button
                        type="primary"
                        class="submit-btn"
                        :disabled="!localWorkOrderLogForm.content.trim()"
                        @click="handleAddLocalWorkOrderLog"
                      >
                        提交工作日志
                      </el-button>
                      <el-button
                        class="submit-btn"
                        :disabled="localWorkOrderLogs.length === 0 || !!localWorkOrderCompletedAt"
                        @click="handleCompleteLocalWorkOrder"
                      >
                        完成本地工单
                      </el-button>
                    </el-form>
                  </div>
                </div>
              </div>

              <el-form v-else-if="workOrderMode === 'manual'" label-position="top" class="handle-form">
                <el-form-item label="外部工单号">
                  <el-input v-model="manualWorkOrderForm.externalWorkOrderId" maxlength="80" />
                </el-form-item>
                <el-form-item label="外部链接">
                  <el-input v-model="manualWorkOrderForm.externalUrl" maxlength="200" />
                </el-form-item>
                <el-form-item label="当前状态">
                  <el-input v-model="manualWorkOrderForm.statusName" maxlength="40" />
                </el-form-item>
                <el-form-item label="外部处理说明">
                  <el-input
                    v-model="manualWorkOrderForm.resultSummary"
                    type="textarea"
                    :rows="4"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>
                <el-button type="primary" class="submit-btn" @click="handleManualWorkOrderPreview">
                  更新归档预览
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
    </section>

    <el-empty v-else-if="!loading" description="未找到该检查项" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back, Connection, Delete as DeleteIcon, House, Link, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadUserFile } from 'element-plus'
import { checklistApi, projectApi, systemUserApi, taskApi } from '@/api'
import {
  CONTROL_FREQUENCY_OPTIONS,
  EVALUATION_TYPE_OPTIONS,
  normalizeChecklistPageFromApi,
  optionLabel,
} from '@/features/checklists/checklist-data'
import {
  filterProjectMemberUsers,
  getAssignableProjectMembers,
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
  SystemUser,
  WorkOrderProvider,
} from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const task = ref<CheckTask>()
const project = ref<Project>()
const checklistOptions = ref<ControlChecklist[]>([])
const systemUsers = ref<SystemUser[]>([])
const workOrders = ref<ProjectTaskWorkOrder[]>([])
const workOrderSubmitting = ref(false)
const workOrderDeletingIds = ref(new Set<string>())
const workOrderMode = ref<WorkOrderProvider>('oms')
const localWorkOrderCreated = ref(false)
const localWorkOrderId = ref('')
const localWorkOrderCompletedAt = ref('')
const workOrderForm = ref({
  taskName: '',
  taskDescription: '',
  contactId: '',
  issuedAt: '',
  handlerId: '',
})
const localWorkOrderForm = ref({
  taskName: '',
  taskDescription: '',
  contactId: '',
  issuedAt: '',
  handlerId: '',
})
const localWorkOrderLogForm = ref({
  content: '',
  attachments: [] as UploadUserFile[],
})
const localWorkOrderLogs = ref<
  Array<{
    id: string
    content: string
    attachments: UploadUserFile[]
  }>
>([])
const workOrderReviewForm = ref({
  workOrderId: '',
  result: '',
  opinion: '',
})
const workOrderReviewResults = ref<Record<string, { result: string; opinion: string }>>({})
const archivePreviewVisible = ref(false)
const manualWorkOrderForm = ref({
  externalWorkOrderId: '',
  externalUrl: '',
  statusName: '',
  resultSummary: '',
})
const auditResultOptions = [
  { label: '待审核', value: 'pending' },
  { label: '通过', value: 'passed' },
  { label: '不符合项', value: 'nonconforming' },
]

onMounted(async () => {
  await userStore.ensureUserInfoLoaded()
  await Promise.all([loadChecklistOptions(), loadSystemUsers(), loadTask()])
  resetWorkOrderForm()
  await loadWorkOrders()
})

const projectId = computed(() => (route.query.projectId as string | undefined) || project.value?.id || '')
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
const assignableMembers = computed(() =>
  getAssignableProjectMembers(members.value).filter((member) => !!normalizeIdentityValue(member.employeeNo)),
)
const contactUserOptions = computed(() => filterProjectMemberUsers(systemUsers.value))
const selectedWorkOrderContact = computed(() =>
  contactUserOptions.value.find((user) => String(user.id) === String(workOrderForm.value.contactId)),
)
const selectedLocalWorkOrderContact = computed(() =>
  contactUserOptions.value.find((user) => String(user.id) === String(localWorkOrderForm.value.contactId)),
)
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
    (!!project.value?.leaderId && currentUserIdentityValues.value.has(String(project.value.leaderId))) ||
    (!!project.value?.leaderName && currentUserIdentityValues.value.has(project.value.leaderName)) ||
    currentProjectMember.value?.role === 'leader'
  )
})
const finishedTaskStatuses = ['passed', 'nonconforming', 'approved']
const hasInspectionItemAssignee = computed(() => {
  return !!normalizeIdentityValue(task.value?.assigneeId || task.value?.assigneeName)
})
const isCurrentInspectionItemAssignee = computed(() => {
  const member = currentProjectMember.value
  return (
    currentUserIdentityValues.value.has(normalizeIdentityValue(task.value?.assigneeId)) ||
    currentUserIdentityValues.value.has(normalizeIdentityValue(task.value?.assigneeName)) ||
    (!!member &&
      (normalizeIdentityValue(member.personnelId) === normalizeIdentityValue(task.value?.assigneeId) ||
        normalizeIdentityValue(member.personnelName) === normalizeIdentityValue(task.value?.assigneeName)))
  )
})
const canHandleInspectionItem = computed(() => {
  return (
    !!project.value &&
    !!task.value &&
    project.value.status === 'in_progress' &&
    hasInspectionItemAssignee.value &&
    !finishedTaskStatuses.includes(task.value.status) &&
    (canManageProject.value || isCurrentInspectionItemAssignee.value)
  )
})
const inspectionItemHandleTip = computed(() => {
  if (!project.value || !task.value) return '检查项数据加载后才能办理'
  if (!hasInspectionItemAssignee.value) return '请先分配检查项负责人'
  if (project.value.status === 'not_started') return '项目启动后才能办理'
  if (project.value.status === 'completed') return '项目已完成，不能办理'
  if (project.value.status === 'archived') return '项目已归档，不能办理'
  if (finishedTaskStatuses.includes(task.value.status)) return '检查项已完成，不能重复办理'
  if (!canManageProject.value && !isCurrentInspectionItemAssignee.value) return '只有项目负责人或检查项负责人可以办理'
  return '当前状态不能办理'
})
const workOrderHandlers = computed(() =>
  assignableMembers.value
    .filter((member) => member.personnelId === workOrderForm.value.handlerId)
    .map((member) => ({
      handlerId: member.personnelId,
      handlerEmployeeNo: normalizeIdentityValue(member.employeeNo),
      handlerName: member.personnelName,
    })),
)
const localWorkOrderHandlers = computed(() =>
  assignableMembers.value
    .filter((member) => member.personnelId === localWorkOrderForm.value.handlerId)
    .map((member) => ({
      handlerId: member.personnelId,
      handlerEmployeeNo: normalizeIdentityValue(member.employeeNo),
      handlerName: member.personnelName,
    })),
)
const firstLocalWorkOrderHandler = computed(() => localWorkOrderHandlers.value[0])
const localWorkOrderDetailRows = computed(() => [
  { label: '任务名称', value: localWorkOrderForm.value.taskName || '—' },
  { label: '任务描述', value: localWorkOrderForm.value.taskDescription || '—' },
  { label: '对接人', value: selectedLocalWorkOrderContact.value ? systemUserLabel(selectedLocalWorkOrderContact.value) : '—' },
  { label: '下达时间', value: localWorkOrderForm.value.issuedAt || '—' },
  { label: '完成时间', value: localWorkOrderCompletedAt.value || '待完成' },
  { label: '审核结果', value: auditResultLabel(workOrderReviewResults.value[localWorkOrderId.value]?.result || 'pending') },
])
const visibleWorkOrders = computed<ProjectTaskWorkOrder[]>(() => {
  if (!localWorkOrderCreated.value) return workOrders.value
  return [
    ...workOrders.value,
    {
      id: localWorkOrderId.value,
      projectId: project.value?.id || '',
      taskId: task.value?.id || '',
      provider: 'local',
      externalWorkOrderId: localWorkOrderId.value,
      taskName: localWorkOrderForm.value.taskName,
      taskDescription: localWorkOrderForm.value.taskDescription,
      contactId: selectedLocalWorkOrderContact.value?.id,
      contactName: selectedLocalWorkOrderContact.value?.username,
      contactEmployeeNo: selectedLocalWorkOrderContact.value?.account,
      handlerId: firstLocalWorkOrderHandler.value?.handlerId,
      handlerEmployeeNo: firstLocalWorkOrderHandler.value?.handlerEmployeeNo,
      handlerName: firstLocalWorkOrderHandler.value?.handlerName,
      issuedAt: localWorkOrderForm.value.issuedAt,
      completedAt: localWorkOrderCompletedAt.value,
      omsStatus: localWorkOrderCompletedAt.value ? '20' : '10',
      omsStatusName: localWorkOrderCompletedAt.value ? '已完成' : '处理中',
      irisReviewStatus: workOrderReviewResults.value[localWorkOrderId.value]?.result || 'pending',
      irisReviewOpinion: workOrderReviewResults.value[localWorkOrderId.value]?.opinion,
    },
  ]
})
const workOrderDisplayCode = (order: ProjectTaskWorkOrder) =>
  order.omsWorkOrderId || order.externalWorkOrderId || order.id
const workOrderDisplayTitle = (order: ProjectTaskWorkOrder) =>
  order.taskName ||
  (workOrderProviderOf(order) === 'manual' ? '外部工单登记' : '') ||
  task.value?.taskName ||
  task.value?.checkContent ||
  workOrderDisplayCode(order)
const personText = (name?: string, employeeNo?: string) => {
  if (name && employeeNo) return `${name} (${employeeNo})`
  return name || employeeNo || '—'
}
const workOrderRecordRows = (order: ProjectTaskWorkOrder) => [
  { label: '任务描述', value: order.taskDescription || task.value?.taskDescription || '—' },
  { label: '对接人', value: personText(order.contactName, order.contactEmployeeNo) },
  { label: '处理人', value: personText(order.handlerName, order.handlerEmployeeNo) },
  { label: '下达时间', value: normalizeDateText(order.issuedAt) || '—' },
  { label: '完成时间', value: normalizeDateTimeText(order.completedAt) || '待完成' },
]
const inspectionAuditResultText = computed(() => {
  const orders = visibleWorkOrders.value
  if (orders.length === 0) return '待生成工单'
  const results = orders.map((order) => workOrderReviewResultOf(order))
  if (results.includes('nonconforming')) return '不符合项'
  if (results.length > 0 && results.every((result) => result === 'passed')) return '通过'
  return '待审核'
})
const archiveSnapshotPreview = computed(() => {
  const providerLabel = workOrderProviderLabel(workOrderMode.value)
  const orderCountText =
    workOrderMode.value === 'oms' ? `${workOrders.value.length} 个 OMS 工单` : previewOrderCountText.value
  return [
    { label: '来源系统', value: providerLabel },
    { label: '检查项', value: task.value?.taskName || task.value?.checkContent || '—' },
    { label: '处理人', value: snapshotHandlerText.value },
    { label: '工单数量', value: orderCountText },
    { label: '检查项结论', value: snapshotResultText.value },
    { label: '附件来源', value: snapshotAttachmentText.value },
  ]
})
const archiveSnapshotLogPreview = computed(() => {
  if (workOrderMode.value === 'oms') {
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
  }
  if (workOrderMode.value === 'local') {
    return [
      {
        title: '创建本地工单',
        description: 'IRIS 生成本地工单并确定处理人。',
      },
      {
        title: '填写工作日志',
        description: '处理人在本地工单内提交日志和附件。',
      },
      {
        title: '工单审核',
        description: '检查项负责人逐个审核工单，检查项结果由工单审核结果汇总。',
      },
      {
        title: '生成统一快照',
        description: '归档读取同一套快照结构。',
      },
    ]
  }
  return [
    {
      title: '登记外部信息',
      description: '录入工单号、链接、状态和外部处理说明。',
    },
    {
      title: '生成统一快照',
      description: '归档时与本地、OMS 工单保持同一口径。',
    },
  ]
})
const previewOrderCountText = computed(() => {
  if (workOrderMode.value === 'local') return localWorkOrderCreated.value ? '1 个本地工单' : '待创建'
  return manualWorkOrderForm.value.externalWorkOrderId.trim() ? '1 个外部工单' : '待登记'
})
const snapshotHandlerText = computed(() => {
  if (workOrderMode.value === 'oms') {
    return workOrderHandlers.value.map((handler) => handler.handlerName).join('、') || '待选择'
  }
  if (workOrderMode.value === 'local') {
    return localWorkOrderHandlers.value.map((handler) => handler.handlerName).join('、') || '待选择'
  }
  return task.value?.assigneeName || currentProjectMember.value?.personnelName || '待确认'
})
const snapshotResultText = computed(() => {
  return inspectionAuditResultText.value
})
const snapshotAttachmentText = computed(() => {
  if (workOrderMode.value === 'oms') return 'OMS 日志附件'
  if (workOrderMode.value === 'local') {
    return `${localWorkOrderLogs.value.reduce((sum, log) => sum + log.attachments.length, 0)} 个本地附件`
  }
  return manualWorkOrderForm.value.externalUrl.trim() ? '外部链接' : '待登记'
})

const loadChecklistOptions = async () => {
  const page = normalizeChecklistPageFromApi(await checklistApi.list({ page: 1, pageSize: 100 }))
  checklistOptions.value = page.list
}

const loadSystemUsers = async () => {
  systemUsers.value = await systemUserApi.list()
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
    const matched = page.list.find((item) => item.tasks.some((candidate) => candidate.id === taskId))
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
  workOrders.value =
    task.value.workOrders && task.value.workOrders.length > 0
      ? task.value.workOrders
      : ((await taskApi.listWorkOrders(projectId.value, task.value.id)) as ProjectTaskWorkOrder[])
}

const resetWorkOrderForm = () => {
  const currentTask = task.value
  if (!currentTask) return
  const assignee = assignableMembers.value.find(
    (member) =>
      normalizeIdentityValue(member.personnelId) === normalizeIdentityValue(currentTask.assigneeId) ||
      normalizeIdentityValue(member.personnelName) === normalizeIdentityValue(currentTask.assigneeName),
  )
  const contact = contactUserOptions.value.find(
    (user) =>
      normalizeIdentityValue(user.id) === normalizeIdentityValue(currentTask.contactId) ||
      normalizeIdentityValue(user.username) === normalizeIdentityValue(currentTask.contactName),
  )
  workOrderForm.value = {
    taskName: currentTask.taskName || currentTask.checkContent,
    taskDescription: currentTask.taskDescription || currentTask.checkCriterion,
    contactId: contact?.id || '',
    issuedAt: normalizeDateText(currentTask.issuedAt),
    handlerId: assignee?.personnelId || '',
  }
  localWorkOrderForm.value = {
    taskName: currentTask.taskName || currentTask.checkContent,
    taskDescription: currentTask.taskDescription || currentTask.checkCriterion,
    contactId: contact?.id || '',
    issuedAt: normalizeDateText(currentTask.issuedAt),
    handlerId: assignee?.personnelId || '',
  }
  localWorkOrderCompletedAt.value = ''
}

const handleCreateWorkOrders = async () => {
  if (!project.value || !task.value || workOrderHandlers.value.length === 0) return
  workOrderSubmitting.value = true
  try {
    await taskApi.createWorkOrders(project.value.id, task.value.id, {
      title: workOrderForm.value.taskName.trim() || undefined,
      description: workOrderForm.value.taskDescription.trim() || undefined,
      taskName: workOrderForm.value.taskName.trim() || undefined,
      taskDescription: workOrderForm.value.taskDescription.trim() || undefined,
      contactId: selectedWorkOrderContact.value?.id,
      contactName: selectedWorkOrderContact.value?.username,
      contactEmployeeNo: selectedWorkOrderContact.value?.account,
      issuedAt: workOrderForm.value.issuedAt || undefined,
      handlers: workOrderHandlers.value,
    })
    ElMessage.success('工单已生成')
    await loadTask()
    resetWorkOrderForm()
    await loadWorkOrders()
  } finally {
    workOrderSubmitting.value = false
  }
}

const handleCreateLocalWorkOrder = () => {
  if (localWorkOrderHandlers.value.length === 0) return
  localWorkOrderCreated.value = true
  localWorkOrderId.value = `LOCAL-${task.value?.id || 'TASK'}`
  ElMessage.success('本地工单已创建，继续填写工作日志')
}

const handleAddLocalWorkOrderLog = () => {
  const content = localWorkOrderLogForm.value.content.trim()
  if (!content) return
  localWorkOrderLogs.value.push({
    id: `LOCAL-LOG-${Date.now()}`,
    content,
    attachments: [...localWorkOrderLogForm.value.attachments],
  })
  localWorkOrderLogForm.value = {
    content: '',
    attachments: [],
  }
  ElMessage.success('工作日志已加入归档预览')
}

const handleCompleteLocalWorkOrder = () => {
  if (localWorkOrderLogs.value.length === 0 || localWorkOrderCompletedAt.value) return
  localWorkOrderCompletedAt.value = currentDateTimeText()
  ElMessage.success('本地工单已完成')
}

const closeWorkOrderReview = () => {
  workOrderReviewForm.value = {
    workOrderId: '',
    result: '',
    opinion: '',
  }
}

const openWorkOrderReview = (order: ProjectTaskWorkOrder) => {
  const savedReview = workOrderReviewResults.value[order.id]
  workOrderReviewForm.value = {
    workOrderId: order.id,
    result: savedReview?.result || order.irisReviewStatus || '',
    opinion: savedReview?.opinion || order.irisReviewOpinion || '',
  }
}

const toggleWorkOrderReview = (order: ProjectTaskWorkOrder) => {
  if (workOrderReviewForm.value.workOrderId === order.id) {
    closeWorkOrderReview()
    return
  }
  openWorkOrderReview(order)
}

const handleConfirmWorkOrderReview = () => {
  if (!workOrderReviewForm.value.workOrderId || !workOrderReviewForm.value.result) return
  workOrderReviewResults.value[workOrderReviewForm.value.workOrderId] = {
    result: workOrderReviewForm.value.result,
    opinion: workOrderReviewForm.value.opinion.trim(),
  }
  ElMessage.success('工单审核结果已确认')
}

const handleDeleteWorkOrder = async (order: ProjectTaskWorkOrder) => {
  if (!task.value || !projectId.value) return
  if (order.id === localWorkOrderId.value) {
    localWorkOrderCreated.value = false
    localWorkOrderId.value = ''
    localWorkOrderCompletedAt.value = ''
    localWorkOrderLogs.value = []
    delete workOrderReviewResults.value[order.id]
    closeWorkOrderReview()
    ElMessage.success('工单已删除')
    return
  }
  workOrderDeletingIds.value = new Set([...workOrderDeletingIds.value, order.id])
  try {
    await taskApi.deleteWorkOrder(projectId.value, task.value.id, order.id)
    workOrders.value = workOrders.value.filter((item) => item.id !== order.id)
    delete workOrderReviewResults.value[order.id]
    if (workOrderReviewForm.value.workOrderId === order.id) {
      closeWorkOrderReview()
    }
    ElMessage.success('工单已删除')
  } finally {
    const nextDeletingIds = new Set(workOrderDeletingIds.value)
    nextDeletingIds.delete(order.id)
    workOrderDeletingIds.value = nextDeletingIds
  }
}

const handleManualWorkOrderPreview = () => {
  ElMessage.info('已更新手工登记归档预览，接口接入后保存外部工单信息')
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

const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    leader: '项目负责人',
    auditor: '项目审计人员',
    observer: '观察员',
    reviewer: '观察员',
    member: '观察员',
  }
  return map[role] || role
}

const auditResultLabel = (result: string) => {
  return auditResultOptions.find((item) => item.value === result)?.label || '待审核'
}

const auditResultTagType = (result: string) => {
  const map: Record<string, 'info' | 'success' | 'danger'> = {
    pending: 'info',
    passed: 'success',
    nonconforming: 'danger',
  }
  return map[result] || 'info'
}

const workOrderReviewResultOf = (order: ProjectTaskWorkOrder) => {
  return workOrderReviewResults.value[order.id]?.result || order.irisReviewStatus || 'pending'
}

const normalizeDateText = (value?: string | null) => {
  const normalized = String(value || '').replace('T', ' ')
  return normalized ? normalized.slice(0, 10) : ''
}

const normalizeDateTimeText = (value?: string | null) => {
  const normalized = String(value || '').replace('T', ' ').replace(/Z$/, '').trim()
  return normalized ? normalized.split('.')[0] : ''
}

const currentDateTimeText = () => {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const systemUserLabel = (user: SystemUser) => `${user.username} (${user.account})`

const workOrderProviderOf = (order: ProjectTaskWorkOrder): WorkOrderProvider => {
  if (order.provider) return order.provider
  if (order.omsWorkOrderId) return 'oms'
  if (order.externalWorkOrderId) return 'manual'
  return 'local'
}

const workOrderProviderIcon = (provider: WorkOrderProvider) => {
  const map = {
    oms: Connection,
    local: House,
    manual: Link,
  }
  return map[provider]
}

const workOrderProviderTagType = (provider: WorkOrderProvider) => {
  const map = {
    oms: 'primary',
    local: 'success',
    manual: 'warning',
  }
  return map[provider] as 'primary' | 'success' | 'warning'
}

const workOrderStatusType = (status?: string) => {
  const map: Record<string, string> = {
    '0': 'info',
    '5': 'info',
    '10': 'primary',
    '13': 'warning',
    '15': 'warning',
    '20': 'success',
    '25': 'info',
    '30': 'success',
    '40': 'danger',
  }
  return (map[status || ''] || 'info') as any
}
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
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    color: $iris-text-primary;
    text-overflow: ellipsis;
    white-space: nowrap;
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
  gap: 10px;
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
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
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

  strong,
  span {
    display: block;
  }

  strong {
    color: $iris-text-primary;
  }

  .work-order-code {
    margin-top: 2px;
    font-size: 12px;
    color: $iris-text-muted;
  }
}

.work-order-record-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.work-order-record-field {
  min-width: 0;

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
    overflow: hidden;
    font-size: 13px;
    color: $iris-text-primary;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.work-order-side {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.work-order-review-panel {
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
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    color: $iris-text-primary;
    text-overflow: ellipsis;
    white-space: nowrap;
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

.local-work-order,
.local-work-order-created,
.local-log-section,
.inspection-conclusion-section {
  display: grid;
  gap: 14px;
}

.inspection-conclusion-section {
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #e2e8f0;
}

.local-work-order-card {
  display: grid;
  gap: 4px;
  padding: 12px;
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 8px;

  label {
    font-size: 12px;
    color: $iris-text-muted;
  }

  strong {
    font-family: monospace;
    color: $iris-text-primary;
  }

  span {
    color: $iris-text-secondary;
    line-height: 1.5;
  }
}

.local-work-order-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.local-work-order-detail {
  min-width: 0;
  padding: 8px 10px;
  background: #f8fafc;
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
    overflow: hidden;
    color: $iris-text-primary;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.mini-heading {
  font-size: 13px;
  font-weight: 700;
  color: $iris-text-primary;
}

.local-log-list {
  display: grid;
  gap: 8px;
}

.local-log-item {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  strong {
    color: $iris-text-primary;
  }

  span {
    color: $iris-text-secondary;
    line-height: 1.5;
  }

  small {
    color: $iris-text-muted;
  }
}

.log-form {
  padding-top: 4px;
  border-top: 1px solid #e2e8f0;
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

  .local-work-order-detail-grid {
    grid-template-columns: 1fr;
  }

  .work-order-item,
  .work-order-record-grid {
    grid-template-columns: 1fr;
  }

  .work-order-side {
    justify-content: flex-start;
  }

  .archive-summary,
  .archive-flow {
    grid-template-columns: 1fr;
  }
}
</style>
