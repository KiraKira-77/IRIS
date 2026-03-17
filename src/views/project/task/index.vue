<template>
  <div class="page-container iris-page">
    <div class="iris-card page-content" v-if="task">
      <!-- Header -->
      <div class="page-header">
        <div class="left">
          <el-button link :icon="Back" @click="router.back()">返回项目</el-button>
          <h2 class="page-title" style="display: inline-block; margin-left: 12px">任务详情</h2>
          <el-tag effect="plain" class="font-mono" style="margin-left: 12px">{{ task.id }}</el-tag>
        </div>
        <div class="right">
          <el-tag :type="taskStatusType(task.status)" effect="dark" size="large">{{
            taskStatusLabel(task.status)
          }}</el-tag>
        </div>
      </div>

      <el-row :gutter="24">
        <!-- 左侧：任务信息 -->
        <el-col :span="16">
          <div class="section-block">
            <h3 class="section-title">检查要求</h3>
            <div class="info-item">
              <label>检查内容:</label>
              <p>{{ task.checkContent }}</p>
            </div>
            <div class="info-item">
              <label>检查标准:</label>
              <p>{{ task.checkCriterion }}</p>
            </div>
            <div class="info-item">
              <label>检查清单:</label>
              <p>{{ getChecklistName(task.checklistId) }}</p>
            </div>
          </div>

          <el-divider />

          <!-- 负责人 & 工单 -->
          <div class="section-block">
            <h3 class="section-title">任务分配</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>负责人:</label>
                <p v-if="task.assigneeName">
                  <el-avatar
                    :size="24"
                    :style="{ background: '#3b82f6', verticalAlign: 'middle', marginRight: '6px' }"
                    >{{ task.assigneeName.charAt(0) }}</el-avatar
                  >
                  {{ task.assigneeName }}
                </p>
                <el-tag v-else size="small" type="info">待分配</el-tag>
              </div>
              <div class="info-item">
                <label>审核人:</label>
                <p>{{ task.reviewerName || '待指定' }}</p>
              </div>
            </div>

            <!-- 工单信息 -->
            <div v-if="task.workOrderId" class="work-order-card">
              <div class="wo-header">
                <el-icon><Tickets /></el-icon>
                <span class="wo-title">外部工单</span>
              </div>
              <div class="wo-body">
                <el-tag type="primary" effect="light" size="small">{{ task.workOrderId }}</el-tag>
                <el-tag :type="woStatusType(task.workOrderStatus)" effect="dark" size="small">
                  {{ woStatusLabel(task.workOrderStatus) }}
                </el-tag>
              </div>
            </div>
            <div v-else-if="task.assigneeName" class="work-order-card wo-empty">
              <span class="text-muted">未生成工单</span>
              <el-button
                type="primary"
                plain
                size="small"
                :icon="Tickets"
                @click="handleGenerateWorkOrder"
              >
                生成工单
              </el-button>
            </div>

            <!-- 同一检查项的其他任务（一对多场景） -->
            <div v-if="siblingTasks.length > 0" class="sibling-tasks">
              <h4>
                同一检查项的其他任务
                <el-tag size="small" effect="light" type="info">{{ siblingTasks.length }}</el-tag>
              </h4>
              <div class="sibling-list">
                <div
                  v-for="st in siblingTasks"
                  :key="st.id"
                  class="sibling-item"
                  @click="router.push(`/project/task/${st.id}`)"
                >
                  <el-avatar :size="20" :style="{ background: '#8b5cf6' }">
                    {{ (st.assigneeName || '?').charAt(0) }}
                  </el-avatar>
                  <span class="sibling-name">{{ st.assigneeName || '待分配' }}</span>
                  <el-tag size="small" :type="taskStatusType(st.status)" effect="dark">
                    {{ taskStatusLabel(st.status) }}
                  </el-tag>
                  <el-tag
                    v-if="st.workOrderId"
                    size="small"
                    effect="light"
                    type="primary"
                    style="margin-left: 4px"
                  >
                    {{ st.workOrderId }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- 核查表单 -->
          <div class="section-block" v-if="canEdit">
            <h3 class="section-title">任务办理</h3>
            <el-form label-position="top">
              <el-form-item label="核查结论">
                <el-input
                  v-model="conclusion"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入核查情况..."
                />
              </el-form-item>
              <el-form-item label="证明材料">
                <el-upload class="upload-demo" drag action="#" :auto-upload="false" multiple>
                  <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                  <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
                </el-upload>
              </el-form-item>
            </el-form>
          </div>

          <!-- Review -->
          <div class="section-block" v-if="canReview">
            <h3 class="section-title">审核意见</h3>
            <el-form label-position="top">
              <el-form-item label="审核评语">
                <el-input
                  v-model="reviewComment"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入审核意见..."
                />
              </el-form-item>
            </el-form>
          </div>
        </el-col>

        <!-- 右侧：时间线 + 按钮 -->
        <el-col :span="8">
          <div class="action-panel">
            <h3 class="panel-title">流程操作</h3>
            <div class="panel-content">
              <el-timeline>
                <el-timeline-item
                  v-for="log in reversedLogs"
                  :key="log.id"
                  :timestamp="log.createdAt"
                  placement="top"
                  :type="logTimelineType(log.action)"
                >
                  <div class="timeline-card">
                    <h4>{{ log.action }}</h4>
                    <p>
                      {{ log.operatorName }}
                      <template v-if="log.remark"> — {{ log.remark }}</template>
                    </p>
                  </div>
                </el-timeline-item>
              </el-timeline>

              <div class="actions-wrapper">
                <!-- 待办：可启动，或分发给多人（创建多个任务） -->
                <template v-if="task.status === 'pending'">
                  <el-button type="primary" style="width: 100%" @click="handleAction('start')">
                    启动任务
                  </el-button>
                  <el-button
                    type="success"
                    plain
                    style="width: 100%; margin-top: 12px; margin-left: 0"
                    :icon="UserFilled"
                    @click="showDispatchDialog = true"
                  >
                    分发给多人
                  </el-button>
                </template>
                <template v-if="task.status === 'in_progress'">
                  <el-button type="primary" style="width: 100%" @click="handleAction('upload')">
                    上传资料
                  </el-button>
                </template>
                <template v-if="task.status === 'uploaded'">
                  <el-button type="warning" style="width: 100%" @click="handleAction('submit')">
                    提交审核
                  </el-button>
                </template>
                <template v-if="task.status === 'submitted' || task.status === 'reviewing'">
                  <el-button
                    type="success"
                    style="width: 100%"
                    @click="handleAction('review_approve')"
                  >
                    审核通过
                  </el-button>
                  <div style="margin-top: 12px; display: flex; gap: 12px">
                    <el-button
                      type="danger"
                      plain
                      style="flex: 1"
                      @click="handleAction('review_reject')"
                      >退回修改</el-button
                    >
                    <el-button
                      type="warning"
                      plain
                      style="flex: 1"
                      @click="handleAction('review_rectify')"
                      >发起整改</el-button
                    >
                  </div>
                </template>
                <template v-if="task.status === 'rejected'">
                  <el-button type="primary" style="width: 100%" @click="handleAction('upload')">
                    重新上传
                  </el-button>
                </template>
                <template v-if="task.status === 'approved'">
                  <el-result icon="success" title="任务已完成" sub-title="该任务审核通过" />
                </template>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-empty v-else description="未找到该任务" :image-size="120" />

    <!-- ============ 分发给多人 Dialog ============ -->
    <el-dialog v-model="showDispatchDialog" title="分发给多人" width="500px" destroy-on-close>
      <el-alert
        title="为同一检查项选择多个负责人，系统将为每人创建独立任务并生成工单"
        type="info"
        effect="light"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      />
      <el-form label-width="80px">
        <el-form-item label="选择人员">
          <el-select
            v-model="dispatchPersonIds"
            multiple
            filterable
            style="width: 100%"
            placeholder="请选择负责人"
          >
            <el-option v-for="p in personnelOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核人">
          <el-select
            v-model="dispatchReviewerId"
            filterable
            style="width: 100%"
            placeholder="请选择审核人"
          >
            <el-option v-for="p in personnelOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDispatchDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleDispatchToMany"
          :disabled="dispatchPersonIds.length === 0"
        >
          创建 {{ dispatchPersonIds.length }} 个任务
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back, UploadFilled, Tickets, UserFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mockProjects, mockChecklists, mockPersonnel } from '@/mock'
import type { CheckTask, TaskAction } from '@/types'

const route = useRoute()
const router = useRouter()

const task = ref<CheckTask>()
const projectId = ref('')
const conclusion = ref('')
const reviewComment = ref('')

// Dispatch dialog
const showDispatchDialog = ref(false)
const dispatchPersonIds = ref<string[]>([])
const dispatchReviewerId = ref('')
const personnelOptions = computed(() => mockPersonnel)

onMounted(() => {
  loadTask()
})

const loadTask = () => {
  const taskId = route.params.id as string
  for (const proj of mockProjects) {
    const found = proj.tasks.find((t) => t.id === taskId)
    if (found) {
      task.value = found
      projectId.value = proj.id
      break
    }
  }
}

// 同一检查项的其他任务（排除自己）
const siblingTasks = computed(() => {
  if (!task.value) return []
  const proj = mockProjects.find((p) => p.id === projectId.value)
  if (!proj) return []
  return proj.tasks.filter(
    (t) => t.checklistItemId === task.value!.checklistItemId && t.id !== task.value!.id,
  )
})

// ========== Computed ==========
const reversedLogs = computed(() => [...(task.value?.logs || [])].reverse())
const canEdit = computed(
  () => task.value && ['in_progress', 'uploaded', 'rejected'].includes(task.value.status),
)
const canReview = computed(
  () => task.value && ['submitted', 'reviewing'].includes(task.value.status),
)
const getChecklistName = (id: string) => mockChecklists.find((c) => c.id === id)?.name || id

// ========== Dispatch to Many ==========
const handleDispatchToMany = () => {
  if (!task.value) return
  const proj = mockProjects.find((p) => p.id === projectId.value)
  if (!proj) return

  const reviewer = mockPersonnel.find((p) => p.id === dispatchReviewerId.value)

  dispatchPersonIds.value.forEach((personId, i) => {
    const person = mockPersonnel.find((p) => p.id === personId)
    if (!person) return

    const newTaskId = `t-${Date.now()}-${i}`
    const woId = `WO-${Date.now()}-${i}`

    const newTask: CheckTask = {
      id: newTaskId,
      projectId: proj.id,
      checklistId: task.value!.checklistId,
      checklistItemId: task.value!.checklistItemId,
      checkContent: task.value!.checkContent,
      checkCriterion: task.value!.checkCriterion,
      assigneeId: person.id,
      assigneeName: person.name,
      reviewerId: reviewer?.id,
      reviewerName: reviewer?.name,
      workOrderId: woId,
      workOrderStatus: '0',
      status: 'in_progress',
      attachments: [],
      logs: [
        {
          id: `log-${Date.now()}-c-${i}`,
          action: '创建任务',
          operator: 'admin',
          operatorName: '当前用户',
          remark: `从任务 ${task.value!.id} 分发`,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        },
        {
          id: `log-${Date.now()}-w-${i}`,
          action: '生成工单',
          operator: 'admin',
          operatorName: '系统',
          remark: `为 ${person.name} 生成工单 ${woId}`,
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        },
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }

    proj.tasks.push(newTask)
  })

  // Update original task as dispatched
  task.value.status = 'dispatched'
  task.value.logs.push({
    id: `log-${Date.now()}-dispatch`,
    action: '分发任务',
    operator: 'admin',
    operatorName: '当前用户',
    remark: `分发给 ${dispatchPersonIds.value.length} 人，每人创建独立任务和工单`,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
  })

  ElMessage.success(`已为 ${dispatchPersonIds.value.length} 人创建独立任务并生成工单`)
  showDispatchDialog.value = false
  dispatchPersonIds.value = []
}

// ========== Generate Work Order ==========
const handleGenerateWorkOrder = () => {
  if (!task.value) return
  const woId = `WO-${Date.now()}`
  task.value.workOrderId = woId
  task.value.workOrderStatus = '0'
  task.value.logs.push({
    id: `log-${Date.now()}-wo`,
    action: '生成工单',
    operator: 'admin',
    operatorName: '系统',
    remark: `生成工单 ${woId}`,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
  })
  ElMessage.success(`已生成工单 ${woId}`)
}

// ========== Task Actions ==========
const actionMap: Record<TaskAction, { nextStatus: string; logAction: string; confirm: string }> = {
  start: { nextStatus: 'in_progress', logAction: '启动任务', confirm: '确认启动此任务？' },
  dispatch: { nextStatus: 'dispatched', logAction: '分发任务', confirm: '确认分发此任务？' },
  upload: { nextStatus: 'uploaded', logAction: '上传材料', confirm: '确认上传并保存？' },
  submit: { nextStatus: 'submitted', logAction: '提交审核', confirm: '确认提交审核？' },
  review_approve: { nextStatus: 'approved', logAction: '审核通过', confirm: '确认审核通过？' },
  review_reject: { nextStatus: 'rejected', logAction: '退回修改', confirm: '确认退回？' },
  review_rectify: { nextStatus: 'rectifying', logAction: '发起整改', confirm: '确认发起整改单？' },
}

const handleAction = async (action: TaskAction) => {
  const config = actionMap[action]
  if (!config || !task.value) return
  try {
    await ElMessageBox.confirm(config.confirm, config.logAction, { confirmButtonText: '确认' })
    task.value.status = config.nextStatus as any
    task.value.updatedAt = new Date().toISOString().split('T')[0]
    task.value.logs.push({
      id: `log-${Date.now()}`,
      action: config.logAction,
      operator: 'admin',
      operatorName: '当前用户',
      remark:
        action === 'review_approve' || action === 'review_reject'
          ? reviewComment.value
          : conclusion.value || undefined,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    })
    ElMessage.success(`${config.logAction}成功`)
    if (action === 'review_approve' || action === 'review_reject') reviewComment.value = ''
  } catch {
    // cancelled
  }
}

// ========== Status Helpers ==========
const taskStatusType = (val: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    in_progress: '',
    dispatched: '',
    uploaded: 'warning',
    submitted: 'warning',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger',
    rectifying: 'danger',
  }
  return (map[val] || 'info') as any
}
const taskStatusLabel = (val: string) => {
  const map: Record<string, string> = {
    pending: '待办',
    in_progress: '进行中',
    dispatched: '已分发',
    uploaded: '已上传',
    submitted: '已提交',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已退回',
    rectifying: '整改中',
  }
  return map[val] || val
}
const logTimelineType = (action: string) => {
  if (action.includes('通过')) return 'success'
  if (action.includes('退回') || action.includes('整改')) return 'danger'
  if (action.includes('提交') || action.includes('上传') || action.includes('工单'))
    return 'warning'
  return 'primary'
}
const woStatusType = (val?: string) => {
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
  return (map[val || ''] || 'info') as any
}
const woStatusLabel = (val?: string) => {
  const map: Record<string, string> = {
    '0': '待分配',
    '5': '待领取',
    '10': '处理中',
    '13': '转办中',
    '15': '挂起中',
    '20': '已完成',
    '25': '已关闭',
    '30': '已归档',
    '40': '已退回',
  }
  return map[val || ''] || val || ''
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid $iris-border-light;
  padding-bottom: 16px;
  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: $iris-text-primary;
    vertical-align: middle;
  }
}

.section-block {
  margin-bottom: 24px;
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: $iris-text-primary;
    margin-bottom: 16px;
    border-left: 4px solid $iris-primary;
    padding-left: 12px;
  }
  .info-item {
    margin-bottom: 12px;
    label {
      font-weight: 500;
      color: $iris-text-primary;
      margin-right: 8px;
    }
    p {
      display: inline;
      color: $iris-text-secondary;
    }
  }
  .info-grid {
    display: flex;
    gap: 32px;
  }
}

.work-order-card {
  margin-top: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #eff6ff, #f0fdf4);
  border-radius: 10px;
  border: 1px solid #dbeafe;

  .wo-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    .wo-title {
      font-weight: 600;
      font-size: 14px;
      color: $iris-text-primary;
    }
  }
  .wo-body {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &.wo-empty {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border-color: #e2e8f0;
  }
}

.sibling-tasks {
  margin-top: 20px;
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: $iris-text-primary;
    margin-bottom: 12px;
  }
  .sibling-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sibling-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.2s;
    &:hover {
      background: #eff6ff;
      border-color: #93c5fd;
    }
    .sibling-name {
      font-size: 13px;
      font-weight: 500;
      color: $iris-text-primary;
      flex: 1;
    }
  }
}

.action-panel {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid $iris-border-light;

  .panel-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    color: $iris-text-primary;
  }

  .timeline-card {
    background: #fff;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid $iris-border-light;
    h4 {
      font-size: 14px;
      margin-bottom: 4px;
      color: $iris-text-primary;
    }
    p {
      font-size: 12px;
      color: $iris-text-muted;
      margin: 0;
    }
  }

  .actions-wrapper {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid $iris-border-light;
  }
}

.text-muted {
  color: var(--el-text-color-secondary);
}
</style>
