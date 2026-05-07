<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <el-button link :icon="Back" @click="router.push('/rectification/list')">返回列表</el-button>
      <div class="title-row">
        <h2 class="page-title">{{ rectification?.title || '整改详情' }}</h2>
        <el-tag :type="statusType(rectification?.status)" effect="light" size="large">
          {{ statusLabel(rectification?.status) }}
        </el-tag>
      </div>
      <div class="header-meta">
        <span>{{ rectification?.code }}</span>
        <span v-if="rectification?.rectificationOmsWorkOrderId">
          整改 OMS: {{ rectification.rectificationOmsWorkOrderId }}
        </span>
      </div>
    </div>

    <div class="detail-grid">
      <section class="detail-section">
        <div class="section-title">基本信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称" :span="2">
            {{ rectification?.taskName || rectification?.title || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ rectification?.description || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="对接人">
            {{ rectification?.assigneeName || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属项目">
            {{ rectification?.projectName || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属检查项" :span="2">
            {{ rectification?.checkContent || rectification?.taskDescription || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="下达时间">
            {{ rectification?.issuedAt || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ rectification?.completedAt || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="detail-section">
        <div class="section-title">来源 OMS 工单</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="来源 OMS 工单">
            {{ rectification?.sourceOmsWorkOrderId || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="来源工单记录">
            {{ rectification?.sourceWorkOrderRecordId || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="来源检查项" :span="2">
            {{ rectification?.checkContent || rectification?.taskDescription || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="detail-section rectification-oms-section">
        <div class="section-heading">
          <div>
            <div class="section-title">整改 OMS 工单</div>
            <p class="section-subtitle">用于跟踪整改单处理进度，详情和日志按整改 OMS 工单号实时查询。</p>
          </div>
          <el-button
            v-if="rectification?.rectificationOmsWorkOrderId"
            link
            type="primary"
            :icon="Refresh"
            :loading="detailLoading"
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
          <el-descriptions :column="2" border>
            <el-descriptions-item label="整改 OMS 工单">
              {{ rectification.rectificationOmsWorkOrderId }}
            </el-descriptions-item>
            <el-descriptions-item label="整改 OMS 状态">
              {{ rectificationOmsStatusLabel }}
            </el-descriptions-item>
            <el-descriptions-item label="整改工单创建时间">
              {{ rectification.rectificationWorkOrderCreatedAt || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="整改工单完成时间">
              {{ rectification.rectificationWorkOrderCompletedAt || '—' }}
            </el-descriptions-item>
          </el-descriptions>

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

      <section class="detail-section">
        <div class="section-title">内控审核记录</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="审核结果">
            {{ reviewResultLabel(rectification?.reviewResult) }}
          </el-descriptions-item>
          <el-descriptions-item label="审核意见">
            {{ rectification?.reviewComment || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间" :span="2">
            {{ rectification?.completedAt || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="detail-section action-section">
        <div class="section-title">操作</div>
        <div v-if="rectification?.status === 'approved'" class="locked-tip">
          整改单已审核完成，后续不能重复审核、退回或操作整改 OMS 工单。
        </div>
        <div v-else class="action-row">
          <el-button
            v-if="rectification?.status === 'pending'"
            type="primary"
            :loading="actionLoading"
            @click="handleCreateWorkOrder"
          >
            创建整改 OMS 工单
          </el-button>
          <el-button
            v-if="rectification?.status === 'in_progress'"
            type="warning"
            plain
            :disabled="!rectificationOmsCompleted"
            @click="returnDialogVisible = true"
          >
            退回 OMS
          </el-button>
          <el-button
            v-if="rectification?.status === 'in_progress'"
            type="success"
            plain
            :disabled="!rectificationOmsCompleted"
            @click="openReviewDialog('approve')"
          >
            审核通过
          </el-button>
          <el-button
            v-if="rectification?.status === 'in_progress'"
            type="danger"
            plain
            :disabled="!rectificationOmsCompleted"
            @click="openReviewDialog('reject')"
          >
            审核不通过
          </el-button>
        </div>
        <p v-if="rectification?.status === 'in_progress' && !rectificationOmsCompleted" class="hint">
          整改 OMS 工单完成后才能退回或审核。
        </p>
      </section>
    </div>

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
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { Back, Refresh } from '@element-plus/icons-vue'
import { rectificationApi } from '@/api'
import type { RectificationOrder, RectStatus } from '@/types'

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
const rectification = ref<RectificationOrder>()
const detailLoading = ref(false)
const actionLoading = ref(false)
const returnDialogVisible = ref(false)
const returnReason = ref('')
const reviewDialogVisible = ref(false)
const reviewAction = ref<ReviewAction>('approve')
const reviewComment = ref('')

onMounted(() => {
  void loadDetail()
})

const loadDetail = async () => {
  const id = route.params.id as string
  detailLoading.value = true
  try {
    rectification.value = await rectificationApi.detail(id)
  } finally {
    detailLoading.value = false
  }
}

const rectificationOmsStatusLabel = computed(() => {
  const current = rectification.value
  return current?.rectificationOmsStatusName || current?.rectificationOmsStatus || '—'
})

const rectificationOmsCompleted = computed(() => {
  const current = rectification.value
  const values = [current?.rectificationOmsStatusName, current?.rectificationOmsStatus]
    .filter(Boolean)
    .map((item) => String(item).trim().toLowerCase())
  return values.some((item) => ['已完成', '20', 'complete', 'completed'].includes(item))
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

const handleCreateWorkOrder = async () => {
  if (!rectification.value) return
  actionLoading.value = true
  try {
    rectification.value = await rectificationApi.createWorkOrder(rectification.value.id)
    ElMessage.success('整改 OMS 工单已创建')
  } finally {
    actionLoading.value = false
  }
}

const handleReturnWorkOrder = async () => {
  if (!rectification.value || !returnReason.value.trim()) return
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
  reviewAction.value = action
  reviewComment.value = ''
  reviewDialogVisible.value = true
}

const handleReview = async () => {
  if (!rectification.value) return
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
    .map(([label, value]) => ({
      label,
      value: formatPayloadValue(value),
    }))
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
        id: String(item.id || item.jeFileInfoId || item.attachmentId || item.fileName || `${name}-${index}`),
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

const formatPayloadValue = (value: unknown) => {
  if (Array.isArray(value)) return value.length ? JSON.stringify(value) : '—'
  if (value && typeof value === 'object') return JSON.stringify(value)
  return String(value)
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
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  margin-bottom: 20px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;

  .page-title {
    margin: 0;
    color: $iris-text-primary;
    font-size: 24px;
    font-weight: 700;
  }
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
  color: $iris-text-secondary;
  font-size: 13px;
}

.detail-grid {
  display: grid;
  gap: 18px;
}

.detail-section {
  padding: 18px;
  border: 1px solid $iris-border-light;
  border-radius: 8px;
  background: $iris-bg-card;
}

.section-title {
  margin-bottom: 14px;
  color: $iris-text-primary;
  font-size: 16px;
  font-weight: 700;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;

  .section-title {
    margin-bottom: 4px;
  }
}

.section-subtitle {
  margin: 0;
  color: $iris-text-secondary;
  font-size: 13px;
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
  padding: 12px 14px;
  border: 1px solid $iris-border-light;
  border-radius: 8px;
  background: $iris-bg;

  label {
    display: block;
    margin-bottom: 6px;
    color: $iris-text-secondary;
    font-size: 13px;
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
  padding: 12px 14px;
  border: 1px solid $iris-border-light;
  border-radius: 8px;
  background: $iris-bg;

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

.action-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.locked-tip,
.hint {
  margin: 0;
  color: $iris-text-secondary;
}

@media (max-width: 768px) {
  .section-heading {
    flex-direction: column;
  }

  .payload-grid {
    grid-template-columns: 1fr;
  }
}
</style>
