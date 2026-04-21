<template>
  <div class="page-container iris-page">
    <!-- 头部信息 -->
    <div class="project-header-card">
      <div class="header-top">
        <div class="title-section">
          <el-button link :icon="Back" @click="router.push('/project/list')" class="back-btn"
            >返回列表</el-button
          >
          <div class="title-content">
            <h2 class="project-title">{{ project?.name }}</h2>
            <div class="meta">
              <span class="code">{{ project?.code }}</span>
              <el-tag :type="statusType(project?.status)" effect="dark" size="small" round>
                {{ statusLabel(project?.status) }}
              </el-tag>
              <el-tag
                :type="project?.source === 'plan' ? 'primary' : 'warning'"
                effect="light"
                size="small"
                round
              >
                {{ project?.source === 'plan' ? '计划生成' : '临时启动' }}
              </el-tag>
            </div>
          </div>
        </div>
        <div class="actions">
          <el-button
            type="success"
            v-if="project?.status === 'preparing'"
            @click="handleStartProject"
            class="shadow-btn"
            >启动项目</el-button
          >
          <el-button
            type="warning"
            v-if="project?.status === 'in_progress' && allTasksDone"
            @click="handleCloseProject"
            class="shadow-btn"
            >项目收尾</el-button
          >
        </div>
      </div>

      <div class="header-stats">
        <div class="stat-item">
          <label>项目负责人</label>
          <div class="value">{{ leaderName }}</div>
        </div>
        <div class="stat-item">
          <label>起止日期</label>
          <div class="value">{{ project?.startDate }} ~ {{ project?.endDate || '进行中' }}</div>
        </div>
        <div class="stat-item">
          <label>团队人数</label>
          <div class="value">{{ project?.team.length || 0 }} 人</div>
        </div>
        <div class="stat-item flex-grow">
          <label>完成进度</label>
          <div class="value" style="width: 200px">
            <el-progress
              :percentage="progressPercent"
              :stroke-width="10"
              :status="progressPercent === 100 ? 'success' : ''"
            />
          </div>
        </div>
      </div>
    </div>

    <!--主要内容 Tabs -->
    <div class="iris-card project-tabs-card" v-if="project">
      <el-tabs v-model="activeTab" class="premium-tabs">
        <!-- 概览 -->
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

        <!-- 核查任务 -->
        <el-tab-pane label="核查任务" name="tasks">
          <div class="task-toolbar">
            <div class="toolbar-left">
              <el-radio-group v-model="taskFilter" size="default">
                <el-radio-button value="">全部 ({{ project.tasks.length }})</el-radio-button>
                <el-radio-button value="pending">待办</el-radio-button>
                <el-radio-button value="in_progress">进行中</el-radio-button>
                <el-radio-button value="submitted">已提交</el-radio-button>
                <el-radio-button value="reviewing">审核中</el-radio-button>
                <el-radio-button value="approved">已通过</el-radio-button>
              </el-radio-group>
            </div>
            <el-button type="success" plain v-if="hasPendingTasks" @click="handleBatchDispatch">
              批量分发
            </el-button>
          </div>
          <el-table :data="filteredTasks" style="width: 100%" size="large">
            <el-table-column type="index" label="#" width="50" />
            <el-table-column
              prop="checkContent"
              label="检查内容"
              min-width="280"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span style="font-weight: 500">{{ row.checkContent }}</span>
              </template>
            </el-table-column>
            <el-table-column label="检查标准" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="text-muted">{{ row.checkCriterion }}</span>
              </template>
            </el-table-column>
            <el-table-column label="负责人" width="120">
              <template #default="{ row }">
                <template v-if="row.assigneeName">
                  <el-avatar
                    size="small"
                    :style="{ background: '#3b82f6', verticalAlign: 'middle', marginRight: '4px' }"
                    >{{ row.assigneeName.charAt(0) }}</el-avatar
                  >
                  {{ row.assigneeName }}
                </template>
                <el-tag v-else size="small" type="info" effect="light">待分配</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="工单" width="120">
              <template #default="{ row }">
                <template v-if="row.workOrderId">
                  <el-tag size="small" :type="woStatusType(row.workOrderStatus)" effect="dark">
                    {{ woStatusLabel(row.workOrderStatus) }}
                  </el-tag>
                </template>
                <span v-else class="text-muted">—</span>
              </template>
            </el-table-column>
            <el-table-column prop="reviewerName" label="审核人" width="100">
              <template #default="{ row }">
                {{ row.reviewerName || '—' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="taskStatusType(row.status)" size="small" effect="dark" round>{{
                  taskStatusLabel(row.status)
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="router.push(`/project/task/${row.id}`)"
                  >办理</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 团队 -->
        <el-tab-pane label="项目团队" name="team">
          <div class="team-grid">
            <div v-for="(m, i) in project.team" :key="m.id" class="team-card">
              <el-avatar :size="48" :style="{ background: avatarColors[i % avatarColors.length] }">
                {{ m.personnelName.charAt(0) }}
              </el-avatar>
              <div class="team-info">
                <div class="team-name">{{ m.personnelName }}</div>
                <el-tag size="small" :type="roleType(m.role)" effect="light" round>{{
                  roleLabel(m.role)
                }}</el-tag>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-empty v-else description="未找到该项目" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mockProjects } from '@/mock'
import type { Project } from '@/types'

const route = useRoute()
const router = useRouter()
const project = ref<Project>()
const activeTab = ref('tasks')
const taskFilter = ref('')

const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

onMounted(() => {
  const id = route.params.id as string
  project.value = mockProjects.find((p) => p.id === id)
})

// ========== Computed ==========
const leaderName = computed(() => {
  const leader = project.value?.team.find((m) => m.role === 'leader')
  return leader?.personnelName || '—'
})

const progressPercent = computed(() => {
  if (!project.value || project.value.tasks.length === 0) return 0
  const done = project.value.tasks.filter((t) => t.status === 'approved').length
  return Math.round((done / project.value.tasks.length) * 100)
})

const allTasksDone = computed(() => {
  return (
    project.value &&
    project.value.tasks.length > 0 &&
    project.value.tasks.every((t) => t.status === 'approved')
  )
})

const hasPendingTasks = computed(() => {
  return project.value?.tasks.some((t) => t.status === 'pending')
})

const filteredTasks = computed(() => {
  if (!project.value) return []
  if (!taskFilter.value) return project.value.tasks
  return project.value.tasks.filter((t) => t.status === taskFilter.value)
})

const taskStats = computed(() => {
  if (!project.value) return []
  const tasks = project.value.tasks
  const count = (statuses: string[]) => tasks.filter((t) => statuses.includes(t.status)).length
  return [
    { label: '总任务', value: tasks.length, color: '#4f46e5' },
    { label: '待办', value: count(['pending']), color: '#94a3b8' },
    { label: '进行中', value: count(['in_progress', 'dispatched']), color: '#0ea5e9' },
    { label: '已提交', value: count(['submitted', 'uploaded', 'reviewing']), color: '#f59e0b' },
    { label: '已通过', value: count(['approved']), color: '#10b981' },
    { label: '需整改', value: count(['rejected', 'rectifying']), color: '#ef4444' },
  ]
})

// ========== Actions ==========
const handleStartProject = async () => {
  try {
    await ElMessageBox.confirm('确认启动此项目？启动后任务可以开始分发和执行。', '启动项目', {
      type: 'info',
      confirmButtonText: '确认启动',
    })
    if (project.value) {
      project.value.status = 'in_progress'
      ;(project.value as any).updatedAt = new Date().toISOString().split('T')[0]
    }
    ElMessage.success('项目已启动')
  } catch {
    // cancelled
  }
}

const handleCloseProject = async () => {
  try {
    await ElMessageBox.confirm('所有任务已完成，确认项目收尾？', '项目收尾', {
      type: 'success',
      confirmButtonText: '确认收尾',
    })
    if (project.value) {
      project.value.status = 'completed'
      ;(project.value as any).updatedAt = new Date().toISOString().split('T')[0]
      ;(project.value as any).endDate = new Date().toISOString().split('T')[0]
    }
    ElMessage.success('项目已完成')
  } catch {
    // cancelled
  }
}

const handleBatchDispatch = () => {
  ElMessage.info('批量分发功能开发中')
}

// ========== Status Helpers ==========
const statusType = (val?: string) => {
  const map: Record<string, string> = {
    preparing: 'info',
    in_progress: 'primary',
    closing: 'warning',
    completed: 'success',
    archived: 'info',
  }
  return (map[val || ''] || 'info') as any
}
const statusLabel = (val?: string) => {
  const map: Record<string, string> = {
    preparing: '准备中',
    in_progress: '进行中',
    closing: '收尾中',
    completed: '已完成',
    archived: '已归档',
  }
  return map[val || ''] || val || ''
}

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

const roleType = (role: string) => {
  const map: Record<string, string> = {
    leader: 'danger',
    auditor: 'warning',
    reviewer: 'primary',
    member: 'info',
  }
  return (map[role] || 'info') as any
}
const roleLabel = (role: string) => {
  const map: Record<string, string> = {
    leader: '负责人',
    auditor: '审核人',
    reviewer: '评审人',
    member: '检查员',
  }
  return map[role] || role
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.project-header-card {
  background: white;
  border-radius: 16px;
  padding: 24px 32px;
  box-shadow: $iris-shadow-card;
  margin-bottom: 24px;

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    .title-section {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .back-btn {
        padding: 0;
        justify-content: flex-start;
        margin-bottom: 4px;
        color: $iris-text-muted;
      }

      .title-content {
        .project-title {
          font-size: 28px;
          font-weight: 700;
          color: $iris-text-primary;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .meta {
          display: flex;
          align-items: center;
          gap: 12px;
          .code {
            font-family: monospace;
            color: $iris-text-secondary;
            background: #f1f5f9;
            padding: 2px 8px;
            border-radius: 4px;
          }
        }
      }
    }
  }

  .header-stats {
    display: flex;
    gap: 48px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
    .stat-item {
      label {
        font-size: 13px;
        color: $iris-text-muted;
        margin-bottom: 4px;
        display: block;
      }
      .value {
        font-size: 16px;
        font-weight: 600;
        color: $iris-text-primary;
      }
    }
  }
}

.project-tabs-card {
  min-height: 500px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: $iris-shadow-card;

  .task-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
}

// Overview
.overview-section {
  .desc-block {
    margin-bottom: 24px;
    h4 {
      font-size: 15px;
      font-weight: 600;
      color: $iris-text-primary;
      margin-bottom: 8px;
    }
    p {
      color: $iris-text-secondary;
      line-height: 1.6;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;

  .stat-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 20px 16px;
    text-align: center;

    .stat-num {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .stat-lbl {
      font-size: 13px;
      color: $iris-text-muted;
    }
  }
}

// Team
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;

  .team-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;

    .team-info {
      .team-name {
        font-weight: 600;
        font-size: 15px;
        color: $iris-text-primary;
        margin-bottom: 4px;
      }
    }
  }
}

.assignee-list {
  display: flex;
  align-items: center;
  gap: 4px;
  .assignee-names {
    margin-left: 4px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}

.text-muted {
  color: var(--el-text-color-secondary);
}
</style>
