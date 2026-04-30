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
          <section class="section-block">
            <div class="section-heading">
              <span class="heading-mark"></span>
              <h3>检查要求</h3>
            </div>
            <div class="info-item primary-item">
              <label>检查项</label>
              <p>{{ task.checkContent }}</p>
            </div>
            <div class="info-item primary-item">
              <label>判断标准</label>
              <p>{{ task.checkCriterion }}</p>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <label>检查清单</label>
                <p>{{ task.checklistName || getChecklistName(task.checklistId) }}</p>
              </div>
              <div class="info-item">
                <label>控制频率</label>
                <p>{{ task.controlFrequency || '—' }}</p>
              </div>
              <div class="info-item">
                <label>评估类</label>
                <p>{{ task.evaluationType || '—' }}</p>
              </div>
            </div>
          </section>

          <section class="section-block">
            <div class="section-heading">
              <span class="heading-mark"></span>
              <h3>检查项分配</h3>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <label>检查项名称</label>
                <p>{{ task.taskName || task.checkContent }}</p>
              </div>
              <div class="info-item">
                <label>检查项负责人</label>
                <p>{{ task.assigneeName || '待分配' }}</p>
              </div>
              <div class="info-item">
                <label>对接人</label>
                <p>{{ task.contactName || '—' }}</p>
              </div>
              <div class="info-item">
                <label>下达时间</label>
                <p>{{ task.issuedAt || '—' }}</p>
              </div>
              <div class="info-item">
                <label>完成时间</label>
                <p>{{ task.completedAt || '—' }}</p>
              </div>
            </div>
            <div class="info-item description-item">
              <label>检查项说明</label>
              <p>{{ task.taskDescription || task.checkCriterion }}</p>
            </div>
          </section>

          <section class="section-block">
            <div class="section-heading">
              <span class="heading-mark"></span>
              <h3>工单记录</h3>
            </div>
            <el-empty
              v-if="workOrders.length === 0"
              description="暂无工单"
              :image-size="80"
            />
            <div v-else class="work-order-list">
              <div v-for="order in workOrders" :key="order.id" class="work-order-item">
                <div class="work-order-main">
                  <strong>{{ order.omsWorkOrderId || order.id }}</strong>
                  <span>{{ order.handlerName || '—' }}</span>
                </div>
                <el-tag size="small" effect="dark" :type="workOrderStatusType(order.omsStatus)">
                  {{ order.omsStatusName || order.omsStatus || '未知' }}
                </el-tag>
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
                <strong>{{ task.workOrderCount || workOrders.length }}</strong>
              </div>
              <div class="flow-item">
                <span>当前结果</span>
                <strong>{{ taskStatusLabel(task.status) }}</strong>
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

            <el-form v-else label-position="top" class="handle-form">
              <el-form-item label="工单标题">
                <el-input v-model="workOrderForm.title" maxlength="80" show-word-limit />
              </el-form-item>
              <el-form-item label="工单说明">
                <el-input
                  v-model="workOrderForm.description"
                  type="textarea"
                  :rows="4"
                  maxlength="300"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item label="工单处理人">
                <el-select
                  v-model="workOrderForm.handlerIds"
                  placeholder="选择处理人"
                  style="width: 100%"
                  multiple
                  filterable
                  collapse-tags
                  collapse-tags-tooltip
                >
                  <el-option
                    v-for="member in assignableMembers"
                    :key="member.personnelId"
                    :label="member.personnelName"
                    :value="member.personnelId"
                  >
                    <span>{{ member.personnelName }}</span>
                    <span class="option-meta">{{ roleLabel(member.role) }}</span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-button
                type="primary"
                class="submit-btn"
                :loading="workOrderSubmitting"
                :disabled="workOrderForm.handlerIds.length === 0"
                @click="handleCreateWorkOrders"
              >
                生成工单
              </el-button>
            </el-form>
          </section>
        </aside>
      </div>
    </section>

    <el-empty v-else-if="!loading" description="未找到该检查项" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { checklistApi, projectApi, taskApi } from '@/api'
import { normalizeChecklistPageFromApi } from '@/features/checklists/checklist-data'
import {
  getAssignableProjectMembers,
  getProjectMembers,
  normalizeProject,
  normalizeProjectPage,
  taskStatusLabel,
  taskStatusType,
} from '@/features/projects/project-data'
import { useUserStore } from '@/stores'
import type { CheckTask, ControlChecklist, Project, ProjectTaskWorkOrder } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const task = ref<CheckTask>()
const project = ref<Project>()
const checklistOptions = ref<ControlChecklist[]>([])
const workOrders = ref<ProjectTaskWorkOrder[]>([])
const workOrderSubmitting = ref(false)
const workOrderForm = ref({
  title: '',
  description: '',
  handlerIds: [] as string[],
})

onMounted(async () => {
  await userStore.ensureUserInfoLoaded()
  await Promise.all([loadChecklistOptions(), loadTask()])
  resetWorkOrderForm()
  await loadWorkOrders()
})

const projectId = computed(() => (route.query.projectId as string | undefined) || project.value?.id || '')
const handleModeRequested = computed(() => route.query.action === 'handle')
const members = computed(() => (project.value ? getProjectMembers(project.value) : []))
const assignableMembers = computed(() => getAssignableProjectMembers(members.value))
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
    .filter((member) => workOrderForm.value.handlerIds.includes(member.personnelId))
    .map((member) => ({ handlerId: member.personnelId, handlerName: member.personnelName })),
)

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
  workOrderForm.value = {
    title: currentTask.taskName || currentTask.checkContent,
    description: currentTask.taskDescription || currentTask.checkCriterion,
    handlerIds: assignee ? [assignee.personnelId] : [],
  }
}

const handleCreateWorkOrders = async () => {
  if (!project.value || !task.value || workOrderHandlers.value.length === 0) return
  workOrderSubmitting.value = true
  try {
    await taskApi.createWorkOrders(project.value.id, task.value.id, {
      title: workOrderForm.value.title.trim() || undefined,
      description: workOrderForm.value.description.trim() || undefined,
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

const getChecklistName = (id: string) =>
  checklistOptions.value.find((item) => item.id === id)?.name || id

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
  padding: 18px;
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
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: $iris-text-primary;
  }

  &.compact {
    margin-bottom: 14px;
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

  span {
    margin-top: 2px;
    font-size: 12px;
    color: $iris-text-muted;
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
}
</style>
