<template>
  <div class="page-container iris-page">
    <section class="rectification-page" v-loading="detailLoading">
      <div class="task-header">
        <div class="header-main">
          <el-button link :icon="Back" class="back-btn" @click="router.push('/rectification/list')">
            返回列表
          </el-button>
          <div>
            <div class="title-line">
              <h2 class="page-title">整改单详情</h2>
              <el-tag v-if="rectification?.code" effect="plain" class="font-mono">
                {{ rectification.code }}
              </el-tag>
            </div>
            <p class="subtitle">{{ rectification?.title || rectification?.taskName || '—' }}</p>
          </div>
        </div>
        <div class="header-actions">
          <el-tag :type="statusType(rectification?.status)" effect="dark" size="large" round>
            {{ statusLabel(rectification?.status) }}
          </el-tag>
        </div>
      </div>

      <el-empty
        v-if="!detailLoading && !rectification"
        description="未找到整改单"
        :image-size="88"
      />

      <div v-if="rectification" class="task-layout">
        <main class="task-main">
          <section class="section-block inspection-summary">
            <div class="section-heading">
              <span class="heading-mark"></span>
              <h3>基本信息</h3>
            </div>

            <div class="summary-content">
              <div class="summary-row">
                <label>任务名称</label>
                <p>{{ rectification?.taskName || rectification?.title || '—' }}</p>
              </div>
              <div class="summary-row">
                <label>整改描述</label>
                <p>{{ rectification?.description || '—' }}</p>
              </div>
              <div class="summary-row">
                <label>所属检查项</label>
                <p>{{ rectification?.checkContent || rectification?.taskDescription || '—' }}</p>
              </div>
            </div>

            <div class="compact-meta-grid">
              <div v-for="item in basicInfoRows" :key="item.label" class="meta-item">
                <label>{{ item.label }}</label>
                <span>{{ item.value }}</span>
              </div>
            </div>
          </section>

          <section class="section-block">
            <div class="section-heading">
              <span class="heading-mark"></span>
              <h3>来源 OMS 工单</h3>
            </div>

            <div class="compact-meta-grid source-meta-grid">
              <div v-for="item in sourceWorkOrderRows" :key="item.label" class="meta-item">
                <label>{{ item.label }}</label>
                <span>{{ item.value }}</span>
              </div>
            </div>
            <div class="summary-description">
              <label>来源检查项</label>
              <p>{{ rectification?.checkContent || rectification?.taskDescription || '—' }}</p>
            </div>
          </section>

          <section class="section-block rectification-oms-section">
            <div class="section-heading">
              <span class="heading-mark"></span>
              <div class="heading-content">
                <h3>整改 OMS 工单</h3>
                <p>用于跟踪整改单处理进度，详情、日志、附件按整改 OMS 工单实时查询。</p>
              </div>
              <el-button
                v-if="rectification?.rectificationOmsWorkOrderId"
                link
                type="primary"
                :icon="Refresh"
                :loading="detailLoading"
                class="heading-action"
                @click="loadDetail"
              >
                刷新
              </el-button>
            </div>

            <el-empty
              v-if="!rectification?.rectificationOmsWorkOrderId"
              description="尚未创建整改 OMS 工单"
              :image-size="88"
            />
            <template v-else>
              <div class="work-order-card">
                <div class="work-order-main">
                  <div class="work-order-title-block">
                    <div>
                      <strong>整改处理工单</strong>
                      <span class="work-order-code">
                        {{ rectification.rectificationOmsWorkOrderId }}
                      </span>
                    </div>
                    <el-tag size="small" effect="dark" :style="rectificationOmsStatusStyle">
                      {{ rectificationOmsStatusLabel }}
                    </el-tag>
                  </div>
                  <div class="work-order-summary-grid">
                    <div
                      v-for="item in rectificationOmsSummaryRows"
                      :key="item.label"
                      class="work-order-record-field"
                    >
                      <label>{{ item.label }}</label>
                      <span>{{ item.value }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <el-tabs class="oms-tabs">
                <el-tab-pane label="详情" name="detail">
                  <div v-if="rectificationOmsDetailRows.length" class="payload-grid">
                    <div
                      v-for="item in rectificationOmsDetailRows"
                      :key="item.label"
                      class="payload-item"
                    >
                      <label>{{ item.label }}</label>
                      <span>{{ item.value }}</span>
                    </div>
                  </div>
                  <el-empty v-else description="暂无整改 OMS 详情" :image-size="72" />
                </el-tab-pane>

                <el-tab-pane label="日志" name="logs">
                  <el-empty
                    v-if="rectificationOmsLogRows.length === 0"
                    description="暂无整改 OMS 日志"
                    :image-size="72"
                  />
                  <div v-else class="work-order-log-list">
                    <div
                      v-for="log in rectificationOmsLogRows"
                      :key="log.id"
                      class="work-order-log-item"
                    >
                      <div class="log-meta">
                        <strong>{{ log.action }}</strong>
                        <span>{{ log.occurredAt || '—' }}</span>
                      </div>
                      <p>{{ log.content }}</p>
                      <div v-if="log.isWorkLog" class="log-extra">
                        <span v-if="log.recordDate">日志时间：{{ log.recordDate }}</span>
                        <span v-if="log.duration">处理时长：{{ log.duration }}</span>
                      </div>
                      <div v-if="log.attachments.length > 0" class="log-attachments">
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
                </el-tab-pane>

                <el-tab-pane label="附件" name="attachments">
                  <el-empty
                    v-if="rectificationOmsAttachmentRows.length === 0"
                    description="暂无整改 OMS 附件"
                    :image-size="72"
                  />
                  <div v-else class="attachment-list">
                    <el-link
                      v-for="attachment in rectificationOmsAttachmentRows"
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
                </el-tab-pane>
              </el-tabs>
            </template>
          </section>
        </main>

        <aside class="task-side">
          <section class="side-panel">
            <div class="section-heading compact">
              <span class="heading-mark"></span>
              <h3>整改流程</h3>
            </div>
            <div class="flow-list">
              <div v-for="item in flowRows" :key="item.label" class="flow-item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </section>

          <section class="side-panel action-panel">
            <div class="section-heading compact">
              <span class="heading-mark"></span>
              <h3>办理整改单</h3>
            </div>
            <div v-if="!canOperateRectification" class="locked-tip">
              当前用户仅有查看权限，不能操作该整改单。
            </div>
            <div v-else-if="rectification?.status === 'approved'" class="locked-tip">
              整改单已审核完成，不能重复审核、退回或操作整改 OMS 工单。
            </div>
            <template v-else>
              <el-form
                v-if="rectification?.status === 'pending'"
                label-position="top"
                class="handle-form"
              >
                <el-form-item label="工单标题">
                  <el-input v-model="workOrderForm.taskName" maxlength="80" show-word-limit />
                </el-form-item>
                <el-form-item label="工单描述">
                  <el-input
                    v-model="workOrderForm.taskDescription"
                    type="textarea"
                    :rows="4"
                    maxlength="300"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item label="工单负责人">
                  <el-select
                    v-model="workOrderForm.handlerId"
                    placeholder="请选择工单负责人"
                    filterable
                    :loading="projectLoading"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="member in assignableMembers"
                      :key="member.personnelId"
                      :label="`${member.personnelName} (${member.employeeNo})`"
                      :value="member.personnelId"
                    />
                  </el-select>
                </el-form-item>
                <el-button
                  type="primary"
                  class="submit-btn"
                  :loading="actionLoading"
                  :disabled="!workOrderForm.taskName.trim() || !selectedWorkOrderHandler"
                  @click="handleCreateWorkOrder"
                >
                  创建整改 OMS 工单
                </el-button>
                <el-button
                  type="danger"
                  plain
                  class="submit-btn"
                  :loading="actionLoading"
                  @click="handleDeleteRectification"
                >
                  删除整改单
                </el-button>
              </el-form>
              <div v-else class="action-list">
                <el-button
                  v-if="rectification?.status === 'in_progress'"
                  type="warning"
                  plain
                  class="submit-btn"
                  :disabled="!rectificationOmsCompleted"
                  @click="returnDialogVisible = true"
                >
                  退回 OMS
                </el-button>
                <el-button
                  v-if="rectification?.status === 'in_progress'"
                  type="success"
                  plain
                  class="submit-btn"
                  :disabled="!rectificationOmsCompleted"
                  @click="openReviewDialog('approve')"
                >
                  审核通过
                </el-button>
                <el-button
                  v-if="rectification?.status === 'in_progress'"
                  type="danger"
                  plain
                  class="submit-btn"
                  :disabled="!rectificationOmsCompleted"
                  @click="openReviewDialog('reject')"
                >
                  审核不通过
                </el-button>
              </div>
              <p
                v-if="rectification?.status === 'in_progress' && !rectificationOmsCompleted"
                class="hint"
              >
                整改 OMS 工单完成后才能退回或审核。
              </p>
            </template>
          </section>

          <section class="side-panel">
            <div class="section-heading compact">
              <span class="heading-mark"></span>
              <h3>内控审核记录</h3>
            </div>
            <div class="flow-list audit-list">
              <div v-for="item in auditRows" :key="item.label" class="flow-item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>

    <el-dialog v-model="returnDialogVisible" title="退回整改 OMS 工单" width="520px">
      <el-input
        v-model="returnReason"
        type="textarea"
        :rows="4"
        maxlength="500"
        show-word-limit
        placeholder="请输入退回原因"
      />
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button
          type="warning"
          :loading="actionLoading"
          :disabled="!returnReason.trim()"
          @click="handleReturnWorkOrder"
        >
          确认退回
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" :title="reviewDialogTitle" width="520px">
      <el-input
        v-model="reviewComment"
        type="textarea"
        :rows="4"
        maxlength="500"
        show-word-limit
        placeholder="请输入审核意见"
      />
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleReview">
          确认审核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { Back, Refresh } from '@element-plus/icons-vue'
import { projectApi, rectificationApi } from '@/api'
import {
  getAssignableProjectMembers,
  getProjectMembers,
  normalizeProject,
} from '@/features/projects/project-data'
import { useUserStore } from '@/stores'
import type { Project, RectificationOrder, RectStatus } from '@/types'

type ReviewAction = 'approve' | 'reject'

interface WorkOrderLogAttachment {
  id: string
  name: string
  url: string
}

interface WorkOrderLogRow {
  id: string
  occurredAt: string
  operator: string
  action: string
  content: string
  isWorkLog: boolean
  recordDate: string
  duration: string
  attachments: WorkOrderLogAttachment[]
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const rectification = ref<RectificationOrder>()
const project = ref<Project>()
const detailLoading = ref(false)
const projectLoading = ref(false)
const actionLoading = ref(false)
const returnDialogVisible = ref(false)
const returnReason = ref('')
const reviewDialogVisible = ref(false)
const reviewAction = ref<ReviewAction>('approve')
const reviewComment = ref('')
const workOrderForm = ref({
  taskName: '',
  taskDescription: '',
  handlerId: '',
})

onMounted(async () => {
  await userStore.ensureUserInfoLoaded()
  void loadDetail()
})

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

const payloadFieldLabelMap: Record<string, string> = {
  id: '记录ID',
  taskId: '任务ID',
  taskNo: '工单编号',
  taskCode: '工单编号',
  taskName: '工单标题',
  taskTitle: '工单标题',
  title: '工单标题',
  name: '名称',
  description: '工单描述',
  taskDescription: '工单描述',
  content: '内容',
  message: '消息内容',
  status: '工单状态',
  statusName: '工单状态',
  omsStatus: 'OMS 状态',
  omsStatusName: 'OMS 状态',
  state: '工单状态',
  stateName: '工单状态',
  handlerId: '负责人ID',
  handlerName: '负责人',
  handlerEmployeeNo: '负责人工号',
  assigneeId: '负责人ID',
  assigneeName: '负责人',
  assigneeEmployeeNo: '负责人工号',
  checkOwnerId: '负责人ID',
  checkOwnerName: '负责人',
  checkOwnerEmployeeNo: '负责人工号',
  ownerId: '负责人ID',
  ownerName: '负责人',
  ownerEmployeeNo: '负责人工号',
  creator: '创建人',
  creatorName: '创建人',
  createdBy: '创建人',
  createUser: '创建人',
  createUserName: '创建人',
  createdAt: '创建时间',
  createTime: '创建时间',
  updateTime: '更新时间',
  updatedAt: '更新时间',
  updater: '更新人',
  updaterName: '更新人',
  updatedBy: '更新人',
  completeTime: '完成时间',
  completedAt: '完成时间',
  completedTime: '完成时间',
  issuedAt: '下达时间',
  issuedTime: '下达时间',
  issueTime: '下达时间',
  projectId: '项目ID',
  projectName: '项目名称',
  result: '处理结果',
  resultSummary: '处理结果',
  summary: '处理摘要',
  opinion: '处理意见',
  remark: '备注',
  remarks: '备注',
  phone: '联系电话',
  mobile: '联系电话',
  department: '部门',
  departmentName: '部门',
  orgName: '组织名称',
  tenantId: '租户ID',
  processInstanceId: '流程实例ID',
  formId: '表单ID',
  businessId: '业务ID',
  businessKey: '业务标识',
  url: '附件地址',
  fileUrl: '附件地址',
  attachmentUrl: '附件地址',
  attachments: '附件',
  bucketName: '存储桶',
  fileName: '文件路径',
  minioUrl: '附件地址',
  originalFileName: '原始文件名',
  uploadId: '上传ID',
  parts: '分片信息',
  big: '是否大文件',
  allFireName: '完整文件名',
  allFileName: '完整文件名',
  jeFileInfoId: '文件信息ID',
  __action__: '数据动作',
  key: '行标识',
  TASK_ID: '任务ID',
  TASK_NO: '工单编号',
  TASK_CODE: '工单编号',
  TASK_NAME: '工单标题',
  TASK_TITLE: '工单标题',
  TASK_DESCRIPTION: '工单描述',
  STATUS: '工单状态',
  STATUS_NAME: '工单状态',
  OMS_STATUS: 'OMS 状态',
  OMS_STATUS_NAME: 'OMS 状态',
  ISSUED_TIME: '下达时间',
  COMPLETED_TIME: '完成时间',
  CHECK_OWNER_NAME: '负责人',
  RESULT_SUMMARY: '处理结果',
  SY_CREATEUSER: '创建人',
  RECORD_CZXQ: '操作详情',
  RECORD_GDCZ: '操作动作',
  SY_CREATETIME: '创建时间',
  SY_CREATEUSERNAME: '操作人',
  SY_UPDATEUSER: '更新人',
  SY_UPDATEUSERNAME: '更新人',
  SY_UPDATETIME: '更新时间',
  RECORD_RQ: '日志时间',
  RECORD_GS: '处理时长',
  RECORD_FJ: '附件',
}

const loadDetail = async () => {
  const id = route.params.id as string
  detailLoading.value = true
  try {
    const detail = await rectificationApi.detail(id)
    rectification.value = detail
    resetWorkOrderForm()
    await loadProject(detail.projectId)
    resetWorkOrderForm()
  } finally {
    detailLoading.value = false
  }
}

const loadProject = async (projectId?: string) => {
  if (!projectId) {
    project.value = undefined
    return
  }
  projectLoading.value = true
  try {
    project.value = normalizeProject(await projectApi.detail(projectId))
  } finally {
    projectLoading.value = false
  }
}

const rectificationOmsStatusLabel = computed(() => {
  const current = rectification.value
  return formatOmsStatusLabel(current?.rectificationOmsStatusName, current?.rectificationOmsStatus)
})

const rectificationOmsCompleted = computed(() => {
  return rectificationOmsStatusLabel.value === '已完成'
})

const rectificationOmsStatusStyle = computed(() => {
  const color = omsStatusColorMap[rectificationOmsStatusLabel.value]
  if (!color) return {}
  return {
    backgroundColor: color.background,
    borderColor: color.background,
    color: color.color,
  }
})

const reviewDialogTitle = computed(() =>
  reviewAction.value === 'approve' ? '审核通过整改单' : '审核不通过整改单',
)

const rectificationOmsDetailRows = computed(() =>
  payloadToRows(rectification.value?.rectificationOmsDetailPayload),
)

const rectificationOmsLogRows = computed<WorkOrderLogRow[]>(() =>
  workOrderLogRows(rectification.value?.rectificationOmsLogPayload),
)

const rectificationOmsAttachmentRows = computed(() =>
  parseWorkOrderLogAttachments(rectification.value?.rectificationOmsAttachmentPayload),
)

const assignableMembers = computed(() =>
  project.value
    ? getAssignableProjectMembers(getProjectMembers(project.value)).filter(
        (member) => !!normalizeIdentityValue(member.employeeNo),
      )
    : [],
)

const selectedWorkOrderHandler = computed(() =>
  assignableMembers.value.find((member) => member.personnelId === workOrderForm.value.handlerId),
)

const currentUserIdentityValues = computed(() => {
  const user = userStore.userInfo
  return new Set([user?.id, user?.username, user?.name].map(normalizeIdentityValue).filter(Boolean))
})

const isCurrentProjectLeader = computed(() => {
  if (!project.value) return false
  return (
    (!!project.value.leaderId &&
      currentUserIdentityValues.value.has(normalizeIdentityValue(project.value.leaderId))) ||
    (!!project.value.leaderName &&
      currentUserIdentityValues.value.has(normalizeIdentityValue(project.value.leaderName))) ||
    getProjectMembers(project.value).some(
      (member) =>
        member.role === 'leader' &&
        (currentUserIdentityValues.value.has(normalizeIdentityValue(member.personnelId)) ||
          currentUserIdentityValues.value.has(normalizeIdentityValue(member.employeeNo)) ||
          currentUserIdentityValues.value.has(normalizeIdentityValue(member.personnelName))),
    )
  )
})

const isCurrentRectificationAssignee = computed(() => {
  const current = rectification.value
  if (!current) return false
  return (
    currentUserIdentityValues.value.has(normalizeIdentityValue(current.assigneeId)) ||
    currentUserIdentityValues.value.has(normalizeIdentityValue(current.assigneeName))
  )
})

const canOperateRectification = computed(
  () => isCurrentProjectLeader.value || isCurrentRectificationAssignee.value,
)

const basicInfoRows = computed(() => {
  const current = rectification.value
  return [
    { label: '对接人', value: current?.assigneeName || '—' },
    { label: '所属项目', value: current?.projectName || '—' },
    { label: '下达时间', value: normalizeDateTimeText(current?.issuedAt) || '—' },
    { label: '截止时间', value: normalizeDateTimeText(current?.deadline) || '—' },
    { label: '完成时间', value: normalizeDateTimeText(current?.completedAt) || '—' },
    { label: '当前状态', value: statusLabel(current?.status) },
  ]
})

const sourceWorkOrderRows = computed(() => {
  const current = rectification.value
  return [
    { label: '来源 OMS 工单', value: current?.sourceOmsWorkOrderId || '—' },
    { label: '来源工单记录', value: current?.sourceWorkOrderRecordId || '—' },
    { label: '所属项目', value: current?.projectName || '—' },
    { label: '来源类型', value: current?.source === 'task' ? '检查项工单' : '手工创建' },
  ]
})

const rectificationOmsSummaryRows = computed(() => {
  const current = rectification.value
  return [
    {
      label: '创建时间',
      value: normalizeDateTimeText(current?.rectificationWorkOrderCreatedAt) || '—',
    },
    {
      label: '完成时间',
      value: normalizeDateTimeText(current?.rectificationWorkOrderCompletedAt) || '—',
    },
    { label: 'OMS 状态', value: rectificationOmsStatusLabel.value },
  ]
})

const flowRows = computed(() => {
  const current = rectification.value
  return [
    { label: '整改单状态', value: statusLabel(current?.status) },
    {
      label: '整改 OMS',
      value: current?.rectificationOmsWorkOrderId ? rectificationOmsStatusLabel.value : '未创建',
    },
    { label: '审核结果', value: reviewResultLabel(current?.reviewResult) },
  ]
})

const auditRows = computed(() => {
  const current = rectification.value
  return [
    { label: '审核结果', value: reviewResultLabel(current?.reviewResult) },
    { label: '审核意见', value: current?.reviewComment || '—' },
    { label: '完成时间', value: normalizeDateTimeText(current?.completedAt) || '—' },
  ]
})

const resetWorkOrderForm = () => {
  const current = rectification.value
  if (!current) return
  const matchedHandler = assignableMembers.value.find(
    (member) =>
      normalizeIdentityValue(member.personnelId) === normalizeIdentityValue(current.assigneeId) ||
      normalizeIdentityValue(member.personnelName) === normalizeIdentityValue(current.assigneeName),
  )
  workOrderForm.value = {
    taskName: current.title || current.taskName || '',
    taskDescription: current.description || current.taskDescription || '',
    handlerId: matchedHandler?.personnelId || '',
  }
}

const handleCreateWorkOrder = async () => {
  const handler = selectedWorkOrderHandler.value
  if (!canOperateRectification.value || !rectification.value || !handler) return
  actionLoading.value = true
  try {
    rectification.value = await rectificationApi.createWorkOrder(rectification.value.id, {
      title: workOrderForm.value.taskName.trim(),
      description: workOrderForm.value.taskDescription.trim() || undefined,
      handlerId: handler.personnelId,
      handlerEmployeeNo: normalizeIdentityValue(handler.employeeNo),
      handlerName: handler.personnelName,
    })
    ElMessage.success('整改 OMS 工单已创建')
  } finally {
    actionLoading.value = false
  }
}

const handleDeleteRectification = async () => {
  const current = rectification.value
  if (!canOperateRectification.value || !current || current.status !== 'pending') return
  await ElMessageBox.confirm(
    `确认删除整改单「${current.title || current.code}」吗？`,
    '确认删除整改单',
    {
      type: 'warning',
      confirmButtonText: '确认删除',
    },
  )
  actionLoading.value = true
  try {
    await rectificationApi.delete(current.id)
    ElMessage.success('整改单已删除')
    router.push('/rectification/list')
  } finally {
    actionLoading.value = false
  }
}

const handleReturnWorkOrder = async () => {
  if (!canOperateRectification.value || !rectification.value || !returnReason.value.trim()) return
  actionLoading.value = true
  try {
    rectification.value = await rectificationApi.returnWorkOrder(rectification.value.id, {
      reason: returnReason.value.trim(),
    })
    returnReason.value = ''
    returnDialogVisible.value = false
    ElMessage.success('整改 OMS 工单已退回')
  } finally {
    actionLoading.value = false
  }
}

const openReviewDialog = (action: ReviewAction) => {
  if (!canOperateRectification.value) return
  reviewAction.value = action
  reviewComment.value = ''
  reviewDialogVisible.value = true
}

const handleReview = async () => {
  if (!canOperateRectification.value || !rectification.value) return
  actionLoading.value = true
  try {
    rectification.value = await rectificationApi.review(rectification.value.id, {
      action: reviewAction.value,
      comment: reviewComment.value.trim() || undefined,
    })
    reviewDialogVisible.value = false
    ElMessage.success('整改单审核已完成')
  } finally {
    actionLoading.value = false
  }
}

const statusType = (status?: RectStatus) => {
  const map: Record<RectStatus, 'info' | 'primary' | 'success'> = {
    pending: 'info',
    in_progress: 'primary',
    approved: 'success',
  }
  return status ? map[status] : 'info'
}

const statusLabel = (status?: RectStatus) => {
  const map: Record<RectStatus, string> = {
    pending: '待处理',
    in_progress: '进行中',
    approved: '已完成',
  }
  return status ? map[status] : '—'
}

const reviewResultLabel = (result?: string) => {
  if (result === 'approve') return '通过'
  if (result === 'reject') return '不通过'
  return '—'
}

const formatOmsStatusLabel = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const raw = String(value || '').trim()
    if (!raw) continue
    return omsStatusLabelMap[raw] || omsStatusLabelMap[raw.toLowerCase()] || raw
  }
  return '—'
}

const payloadToRows = (payload?: string) => {
  const parsed = parseJsonValue(payload)
  const source =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? ((parsed as { data?: unknown }).data ?? parsed)
      : parsed
  if (!source || typeof source !== 'object' || Array.isArray(source)) return []
  return Object.entries(source as Record<string, unknown>)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .slice(0, 16)
    .map(([label, value], index) => ({
      label: payloadFieldLabel(label, index),
      value: formatPayloadValue(value, label),
    }))
}

const payloadUnknownFieldLabel = (field: string) => {
  const normalized = String(field || '').trim()
  return normalized ? `OMS原始字段：${normalized}` : 'OMS原始字段'
}

const payloadFieldLabel = (field: string, index: number) => {
  void index
  const normalized = String(field || '').trim()
  return (
    payloadFieldLabelMap[normalized] ||
    payloadFieldLabelMap[normalized.toLowerCase()] ||
    payloadUnknownFieldLabel(normalized)
  )
}

const workOrderLogRows = (payload?: string) => {
  const parsedLogs = parseJsonArray(payload)
  return parsedLogs.map((log, index) => {
    const row = log as Record<string, unknown>
    const rawAction = String(row.action || row.actionName || row.RECORD_GDCZ || '日志')
    const attachmentsPayload = row.attachmentsPayload || row.RECORD_FJ || ''
    return {
      id: String(row.id || row.logId || `rectification-oms-log-${index}`),
      occurredAt: normalizeDateTimeText(
        String(row.occurredAt || row.SY_CREATETIME || row.time || row.createdAt || ''),
      ),
      operator: String(
        row.operator || row.SY_CREATEUSERNAME || row.operatorName || row.userName || 'OMS',
      ),
      action: workOrderLogActionLabel(rawAction),
      content: String(row.content || row.RECORD_CZXQ || row.message || row.description || '—'),
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
        id: String(
          item.id || item.jeFileInfoId || item.attachmentId || item.fileName || `${name}-${index}`,
        ),
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

const formatPayloadValue = (value: unknown, field?: string) => {
  if (field && ['status', 'statusName', 'omsStatus', 'omsStatusName'].includes(field)) {
    return formatOmsStatusLabel(String(value || ''))
  }
  if (Array.isArray(value)) return value.length ? formatPayloadArray(value) : '—'
  if (value && typeof value === 'object')
    return formatPayloadObject(value as Record<string, unknown>)
  return String(value)
}

const formatPayloadArray = (value: unknown[]): string => {
  return value
    .map((item, index) => {
      if (item && typeof item === 'object') {
        return `第${index + 1}项（${formatPayloadObject(item as Record<string, unknown>)}）`
      }
      return String(item)
    })
    .join('；')
}

const formatPayloadObject = (value: Record<string, unknown>): string => {
  return Object.entries(value)
    .filter(
      ([, itemValue]) =>
        itemValue !== null && itemValue !== undefined && String(itemValue).trim() !== '',
    )
    .map(([itemKey, itemValue], index) => {
      const label = payloadFieldLabel(itemKey, index)
      const text: string =
        itemValue && typeof itemValue === 'object'
          ? Array.isArray(itemValue)
            ? formatPayloadArray(itemValue)
            : formatPayloadObject(itemValue as Record<string, unknown>)
          : String(itemValue)
      return `${label}：${text}`
    })
    .join('；')
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
  return normalized ? (normalized.split('.')[0] ?? '') : ''
}

const normalizeIdentityValue = (value?: string | number | null) => String(value || '').trim()
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.rectification-page {
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
  min-width: 0;
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
  color: $iris-text-primary;
  font-size: 22px;
  font-weight: 700;
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
    color: $iris-text-primary;
    font-size: 16px;
    font-weight: 700;
  }

  &.compact {
    margin-bottom: 14px;
  }

  .heading-action {
    margin-left: auto;
  }
}

.heading-mark {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  background: $iris-primary;
  border-radius: 50%;
}

.heading-content {
  min-width: 0;

  p {
    margin: 4px 0 0;
    color: $iris-text-secondary;
    font-size: 13px;
    line-height: 1.5;
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
    color: $iris-text-muted;
    font-size: 13px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: $iris-text-primary;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
}

.compact-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.source-meta-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
    color: $iris-text-muted;
    font-size: 12px;
  }

  span {
    color: $iris-text-primary;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
}

.summary-description {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 12px 0;

  label {
    color: $iris-text-muted;
    font-size: 13px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: $iris-text-secondary;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
}

.work-order-card {
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
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
}

.work-order-code {
  display: block;
  margin-top: 2px;
  color: $iris-text-muted;
  font-size: 12px;
  overflow-wrap: anywhere;
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
    color: $iris-text-muted;
    font-size: 12px;
  }

  span {
    color: $iris-text-primary;
    font-size: 13px;
    line-height: 1.45;
    overflow-wrap: anywhere;
    white-space: normal;
  }
}

.oms-tabs {
  margin-top: 16px;
}

.payload-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.payload-item {
  min-width: 0;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  label {
    display: block;
    margin-bottom: 4px;
    color: $iris-text-secondary;
    font-size: 12px;
  }

  span {
    display: block;
    overflow-wrap: anywhere;
    color: $iris-text-primary;
    line-height: 1.6;
  }
}

.work-order-log-list {
  display: grid;
  gap: 12px;
}

.work-order-log-item {
  padding: 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  p {
    margin: 8px 0 0;
    color: $iris-text-primary;
    line-height: 1.6;
  }
}

.log-meta,
.log-extra,
.log-footer,
.log-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: $iris-text-secondary;
  font-size: 13px;
}

.log-meta {
  justify-content: space-between;

  strong {
    color: $iris-text-primary;
  }
}

.log-extra,
.log-footer,
.log-attachments {
  margin-top: 8px;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.flow-list,
.action-list {
  display: grid;
  gap: 12px;
}

.flow-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  span {
    color: $iris-text-muted;
  }

  strong {
    min-width: 0;
    color: $iris-text-primary;
    text-align: right;
    overflow-wrap: anywhere;
  }
}

.audit-list {
  .flow-item {
    align-items: flex-start;
  }
}

.action-panel {
  background: #f9fbff;
}

.handle-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}

.submit-btn {
  width: 100%;
  margin-left: 0 !important;
}

.locked-tip,
.hint {
  margin: 0;
  color: $iris-text-secondary;
  line-height: 1.6;
}

.hint {
  margin-top: 10px;
  font-size: 13px;
}

.font-mono {
  font-family: monospace;
}

@media (max-width: 1100px) {
  .task-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .rectification-page {
    padding: 16px;
  }

  .task-header,
  .header-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .section-heading {
    align-items: flex-start;

    .heading-action {
      margin-left: 0;
    }
  }

  .summary-row,
  .summary-description {
    grid-template-columns: 1fr;
  }

  .compact-meta-grid,
  .source-meta-grid {
    grid-template-columns: 1fr;
  }

  .work-order-title-block {
    display: grid;
  }

  .payload-grid {
    grid-template-columns: 1fr;
  }
}
</style>
