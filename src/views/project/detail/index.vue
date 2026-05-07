<template>
  <div class="page-container iris-page">
    <section class="project-header-card" v-loading="loading">
      <div class="header-top">
        <div class="title-section">
          <el-button link :icon="Back" @click="router.push('/project/list')" class="back-btn">
            返回列表
          </el-button>
          <div class="title-content">
            <h2 class="project-title">{{ project?.name || '项目详情' }}</h2>
            <div class="meta" v-if="project">
              <span class="code">{{ project.code }}</span>
              <el-tag :type="projectStatusType(project.status)" effect="dark" size="small" round>
                {{ projectStatusLabel(project.status) }}
              </el-tag>
              <el-tag
                :type="project.source === 'plan' ? 'primary' : 'warning'"
                effect="light"
                size="small"
                round
              >
                {{ projectSourceLabel(project.source) }}
              </el-tag>
            </div>
          </div>
        </div>
        <div class="actions" v-if="project">
          <el-button
            v-if="project.status !== 'archived' && canEditProject"
            type="primary"
            plain
            @click="router.push(`/project/create?id=${project.id}`)"
          >
            编辑
          </el-button>
          <el-button
            v-if="canManageProject && project.status === 'not_started'"
            type="success"
            @click="handleStartProject"
          >
            启动项目
          </el-button>
          <el-button
            v-if="canManageProject && project.status === 'in_progress' && allTasksDone"
            type="primary"
            @click="handleCompleteProject"
          >
            完成项目
          </el-button>
        </div>
      </div>

      <div class="header-stats" v-if="project">
        <div class="stat-item">
          <label>项目负责人</label>
          <div class="value">{{ project.leaderName || leaderName }}</div>
        </div>
        <div class="stat-item">
          <label>项目时间</label>
          <div class="value">{{ projectTimeText(project) }}</div>
        </div>
        <div class="stat-item">
          <label>项目成员</label>
          <div class="value">{{ members.length }} 人</div>
        </div>
        <div class="stat-item flex-grow">
          <label>完成进度</label>
          <div class="value progress-value">
            <el-progress
              :percentage="projectProgress(project)"
              :stroke-width="10"
              :status="projectProgress(project) === 100 ? 'success' : ''"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="table-shell" v-if="project">
      <el-tabs v-model="activeTab" class="premium-tabs">
        <el-tab-pane label="项目概览" name="overview">
          <div class="overview-section">
            <div class="desc-block" v-if="project.description">
              <h4>项目描述</h4>
              <p>{{ project.description }}</p>
            </div>
            <div class="stats-grid">
              <div class="stat-card" v-for="s in taskStats" :key="s.label">
                <div class="stat-num" :style="{ color: s.color }">{{ s.value }}</div>
                <div class="stat-lbl">{{ s.label }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="检查项" name="tasks">
          <div class="task-toolbar">
            <el-radio-group v-model="taskFilter">
              <el-radio-button value="">全部 ({{ project.tasks.length }})</el-radio-button>
              <el-radio-button value="pending">待办</el-radio-button>
              <el-radio-button value="in_progress">进行中</el-radio-button>
              <el-radio-button value="passed">通过</el-radio-button>
              <el-radio-button value="nonconforming">不符合项</el-radio-button>
            </el-radio-group>
          </div>
          <el-table
            :data="filteredTasks"
            row-key="id"
            style="width: 100%"
            size="large"
          >
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="checkContent" label="检查项" min-width="260" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="strong-text">{{ row.checkContent }}</span>
              </template>
            </el-table-column>
            <el-table-column label="判断标准" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="text-muted">{{ row.checkCriterion }}</span>
              </template>
            </el-table-column>
            <el-table-column label="负责人" min-width="180">
              <template #default="{ row }">
                <el-select
                  v-if="canAssignInspectionItems"
                  :model-value="row.assigneeId || ''"
                  class="assignee-select"
                  size="small"
                  placeholder="分配负责人"
                  :loading="assigningTaskId === row.id"
                  @change="(assigneeId: string) => handleAssignTask(row, assigneeId)"
                >
                  <el-option
                    v-for="member in assignableMembers"
                    :key="member.personnelId"
                    :label="member.personnelName"
                    :value="member.personnelId"
                  />
                </el-select>
                <span v-else-if="row.assigneeName">{{ row.assigneeName }}</span>
                <el-tag v-else size="small" type="info" effect="light">待分配</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="对接人" width="130">
              <template #default="{ row }">
                {{ row.contactName || '—' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="taskStatusType(row.status)" size="small" effect="dark" round>
                  {{ taskStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="openInspectionItemDetail(row)"
                >
                  查看
                </el-button>
                <el-tooltip
                  v-if="canSeeInspectionItemHandleAction(row)"
                  :content="inspectionItemHandleTip(row)"
                  :disabled="canHandleInspectionItem(row)"
                  placement="top"
                >
                  <span class="inline-action-wrap">
                    <el-button
                      link
                      type="primary"
                      size="small"
                      :disabled="!canHandleInspectionItem(row)"
                      @click="openInspectionItemDetail(row, 'handle')"
                    >
                      办理
                    </el-button>
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="项目成员" name="members">
          <div class="team-grid">
            <div v-for="(m, i) in members" :key="m.id || m.personnelId" class="team-card">
              <el-avatar :size="44" :style="{ background: avatarColors[i % avatarColors.length] }">
                {{ m.personnelName.charAt(0) }}
              </el-avatar>
              <div class="team-info">
                <div class="team-name">{{ m.personnelName }}</div>
                <div class="team-meta">{{ m.employeeNo || '—' }} · {{ m.department || '—' }}</div>
                <el-tag size="small" :type="roleType(m.role)" effect="light" round>
                  {{ roleLabel(m.role) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-empty v-else-if="!loading" description="未找到该项目" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { projectApi } from '@/api'
import {
  getAssignableProjectMembers,
  getProjectMembers,
  normalizeProject,
  projectProgress,
  projectSourceLabel,
  projectStatusLabel,
  projectStatusType,
  projectTimeText,
  taskStatusLabel,
  taskStatusType,
} from '@/features/projects/project-data'
import { useUserStore } from '@/stores'
import type { CheckTask, Project } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const project = ref<Project>()
const activeTab = ref('tasks')
const taskFilter = ref('')
const assigningTaskId = ref('')
const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

onMounted(async () => {
  await userStore.ensureUserInfoLoaded()
  loadProject()
})

const loadProject = async () => {
  loading.value = true
  try {
    project.value = normalizeProject(await projectApi.detail(route.params.id as string))
  } finally {
    loading.value = false
  }
}

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
const canEditProject = computed(() => {
  return !!project.value && project.value.status !== 'archived' && canManageProject.value
})
const canAssignInspectionItems = computed(() => {
  return (
    !!project.value &&
    canManageProject.value &&
    ['not_started', 'in_progress'].includes(project.value.status) &&
    assignableMembers.value.length > 0
  )
})

const leaderName = computed(() => {
  const leader = members.value.find((member) => member.role === 'leader')
  return leader?.personnelName || '—'
})

const allTasksDone = computed(() => {
  const tasks = project.value?.tasks || []
  return (
    tasks.length > 0 &&
    tasks.every((task) => ['passed', 'nonconforming', 'approved'].includes(task.status))
  )
})
const finishedTaskStatuses = ['passed', 'nonconforming', 'approved']

const filteredTasks = computed(() => {
  if (!project.value) return []
  if (!taskFilter.value) return project.value.tasks
  return project.value.tasks.filter((task) => task.status === taskFilter.value)
})

const taskStats = computed(() => {
  const tasks = project.value?.tasks || []
  const count = (statuses: string[]) => tasks.filter((task) => statuses.includes(task.status)).length
  return [
    { label: '总检查项', value: tasks.length, color: '#4f46e5' },
    { label: '待办', value: count(['pending']), color: '#94a3b8' },
    { label: '进行中', value: count(['in_progress', 'dispatched']), color: '#0ea5e9' },
    { label: '通过', value: count(['passed', 'approved']), color: '#10b981' },
    { label: '不符合项', value: count(['nonconforming']), color: '#ef4444' },
  ]
})

const handleStartProject = async () => {
  if (!project.value) return
  try {
    await ElMessageBox.confirm('确认启动此项目？启动后任务可开始执行。', '启动项目', {
      type: 'info',
      confirmButtonText: '确认启动',
    })
    project.value = normalizeProject(await projectApi.start(project.value.id))
    ElMessage.success('项目已启动')
  } catch {
    // cancelled or request failed
  }
}

const handleCompleteProject = async () => {
  if (!project.value) return
  try {
    await ElMessageBox.confirm('所有任务已处理，确认完成项目？', '完成项目', {
      type: 'success',
      confirmButtonText: '确认完成',
    })
    project.value = normalizeProject(await projectApi.complete(project.value.id))
    ElMessage.success('项目已完成')
  } catch {
    // cancelled or request failed
  }
}

const handleAssignTask = async (task: CheckTask, assigneeId: string) => {
  if (!canAssignInspectionItems.value || !project.value || !assigneeId) return
  const assignee = assignableMembers.value.find((member) => member.personnelId === assigneeId)
  if (!assignee) return
  assigningTaskId.value = task.id
  try {
    project.value = normalizeProject(
      await projectApi.assignTasks(project.value.id, {
        taskIds: [task.id],
        assigneeId: assignee.personnelId,
        assigneeName: assignee.personnelName,
        contactId: task.contactId,
        contactName: task.contactName,
      }),
    )
    ElMessage.success('检查项负责人已更新')
  } catch {
    await loadProject()
  } finally {
    assigningTaskId.value = ''
  }
}

const normalizeIdentityValue = (value?: string | number | null) => String(value || '').trim()

const hasInspectionItemAssignee = (task: CheckTask) => {
  return !!normalizeIdentityValue(task.assigneeId || task.assigneeName)
}

const isCurrentInspectionItemAssignee = (task: CheckTask) => {
  const member = currentProjectMember.value
  return (
    currentUserIdentityValues.value.has(normalizeIdentityValue(task.assigneeId)) ||
    currentUserIdentityValues.value.has(normalizeIdentityValue(task.assigneeName)) ||
    (!!member &&
      (normalizeIdentityValue(member.personnelId) === normalizeIdentityValue(task.assigneeId) ||
        normalizeIdentityValue(member.personnelName) === normalizeIdentityValue(task.assigneeName)))
  )
}

const canHandleInspectionItem = (task: CheckTask) => {
  return (
    !!project.value &&
    project.value.status === 'in_progress' &&
    hasInspectionItemAssignee(task) &&
    !finishedTaskStatuses.includes(task.status) &&
    (canManageProject.value || isCurrentInspectionItemAssignee(task))
  )
}

const canSeeInspectionItemHandleAction = (task: CheckTask) => {
  return hasInspectionItemAssignee(task) && (canManageProject.value || isCurrentInspectionItemAssignee(task))
}

const inspectionItemHandleTip = (task: CheckTask) => {
  if (!project.value) return ''
  if (project.value.status === 'not_started') return '项目启动后才能办理'
  if (project.value.status === 'completed') return '项目已完成，不能办理'
  if (project.value.status === 'archived') return '项目已归档，不能办理'
  if (finishedTaskStatuses.includes(task.status)) return '检查项已完成，不能重复办理'
  return '当前状态不能办理'
}

const openInspectionItemDetail = (task: CheckTask, action?: 'handle') => {
  if (!project.value) return
  router.push({
    path: `/project/task/${task.id}`,
    query: {
      projectId: project.value.id,
      ...(action ? { action } : {}),
    },
  })
}

const roleType = (role: string) => {
  const map: Record<string, string> = {
    leader: 'danger',
    auditor: 'warning',
    observer: 'info',
    reviewer: 'info',
    member: 'info',
  }
  return (map[role] || 'info') as any
}

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
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.project-header-card,
.table-shell {
  padding: 24px;
  margin-bottom: 20px;
  background: #fff;
  border: 1px solid $iris-border-light;
  border-radius: 8px;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-btn {
  align-self: flex-start;
  padding: 0;
}

.project-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  color: $iris-text-primary;
}

.meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.code {
  padding: 2px 8px;
  font-family: monospace;
  color: $iris-text-secondary;
  background: #f1f5f9;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 10px;
}

.header-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
}

.stat-item {
  label {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
    color: $iris-text-muted;
  }

  .value {
    font-size: 16px;
    font-weight: 600;
    color: $iris-text-primary;
  }
}

.progress-value {
  max-width: 220px;
}

.overview-section {
  .desc-block {
    margin-bottom: 22px;

    h4 {
      margin: 0 0 8px;
      font-size: 15px;
      color: $iris-text-primary;
    }

    p {
      margin: 0;
      color: $iris-text-secondary;
      line-height: 1.7;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 18px 16px;
  text-align: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  .stat-num {
    margin-bottom: 4px;
    font-size: 28px;
    font-weight: 700;
  }

  .stat-lbl {
    font-size: 13px;
    color: $iris-text-muted;
  }
}

.task-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.assignee-select {
  width: 160px;
  max-width: 100%;
}

.inline-action-wrap {
  display: inline-flex;
}

.strong-text {
  font-weight: 600;
  color: $iris-text-primary;
}

.text-muted {
  color: var(--el-text-color-secondary);
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.team-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.team-name {
  margin-bottom: 4px;
  font-weight: 600;
  color: $iris-text-primary;
}

.team-meta {
  margin-bottom: 6px;
  font-size: 12px;
  color: $iris-text-muted;
}

@media (max-width: 960px) {
  .header-top,
  .meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
