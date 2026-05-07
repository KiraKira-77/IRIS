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
          <el-descriptions-item label="审核结果">
            {{ reviewResultLabel(rectification?.reviewResult) }}
          </el-descriptions-item>
          <el-descriptions-item label="审核意见">
            {{ rectification?.reviewComment || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="detail-section">
        <div class="section-title">工单信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="来源 OMS 工单">
            {{ rectification?.sourceOmsWorkOrderId || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="来源工单记录">
            {{ rectification?.sourceWorkOrderRecordId || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="整改 OMS 工单">
            {{ rectification?.rectificationOmsWorkOrderId || '未创建' }}
          </el-descriptions-item>
          <el-descriptions-item label="整改 OMS 状态">
            {{ rectificationOmsStatusLabel }}
          </el-descriptions-item>
          <el-descriptions-item label="整改工单创建时间">
            {{ rectification?.rectificationWorkOrderCreatedAt || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="整改工单完成时间">
            {{ rectification?.rectificationWorkOrderCompletedAt || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="detail-section">
        <div class="section-title">办理记录</div>
        <el-timeline v-if="logRows.length">
          <el-timeline-item
            v-for="log in logRows"
            :key="log.key"
            :timestamp="log.time"
            placement="top"
          >
            <div class="log-row">
              <strong>{{ log.action }}</strong>
              <span>{{ log.operator }}</span>
              <p>{{ log.content }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无办理记录" :image-size="96" />
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
import { Back } from '@element-plus/icons-vue'
import { rectificationApi } from '@/api'
import type { RectificationOrder, RectStatus } from '@/types'

type ReviewAction = 'approve' | 'reject'

const route = useRoute()
const router = useRouter()
const rectification = ref<RectificationOrder>()
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
  rectification.value = await rectificationApi.detail(id)
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

const logRows = computed(() =>
  (rectification.value?.logs || []).map((log, index) => {
    const raw = log as unknown as Record<string, string>
    return {
      key: raw.id || `${index}`,
      time: raw.createdAt || raw.occurredAt || raw.recordDate || '',
      action: raw.action || '日志',
      operator: raw.operatorName || raw.operator || '—',
      content: raw.remark || raw.content || '—',
    }
  }),
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

.log-row {
  padding: 12px 14px;
  border: 1px solid $iris-border-light;
  border-radius: 8px;
  background: $iris-bg;

  span {
    margin-left: 10px;
    color: $iris-text-secondary;
    font-size: 13px;
  }

  p {
    margin-top: 8px;
    color: $iris-text-primary;
    line-height: 1.6;
  }
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
</style>
