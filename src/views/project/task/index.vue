<template>
  <div class="page-container iris-page">
    <section class="task-card" v-if="task" v-loading="loading">
      <div class="page-header">
        <div class="left">
          <el-button link :icon="Back" @click="backToProject">返回项目</el-button>
          <h2 class="page-title">检查项详情</h2>
          <el-tag effect="plain" class="font-mono">{{ task.id }}</el-tag>
        </div>
        <div class="right">
          <el-tag :type="taskStatusType(task.status)" effect="dark" size="large">
            {{ taskStatusLabel(task.status) }}
          </el-tag>
        </div>
      </div>

      <el-row :gutter="24">
        <el-col :span="16">
          <div class="section-block">
            <h3 class="section-title">检查要求</h3>
            <div class="info-item">
              <label>检查项</label>
              <p>{{ task.checkContent }}</p>
            </div>
            <div class="info-item">
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
          </div>

          <el-divider />

          <div class="section-block">
            <h3 class="section-title">检查项分配</h3>
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
          </div>
        </el-col>

        <el-col :span="8">
          <div class="side-panel">
            <h3 class="panel-title">检查单流程</h3>
            <div class="flow-list">
              <div class="flow-item">
                <span>检查项生成</span>
                <strong>已生成</strong>
              </div>
              <div class="flow-item">
                <span>工单数量</span>
                <strong>{{ task.workOrderCount || task.workOrders?.length || 0 }}</strong>
              </div>
              <div class="flow-item">
                <span>审核结果</span>
                <strong>{{ taskStatusLabel(task.status) }}</strong>
              </div>
            </div>

            <el-divider />

            <h3 class="panel-title">工单</h3>
            <el-empty
              v-if="workOrders.length === 0"
              description="暂无工单"
              :image-size="80"
            />
            <div v-else class="work-order-list">
              <div v-for="order in workOrders" :key="order.id" class="work-order-item">
                <div>
                  <strong>{{ order.omsWorkOrderId || order.id }}</strong>
                  <span>{{ order.handlerName || '—' }}</span>
                </div>
                <el-tag size="small" effect="dark" :type="workOrderStatusType(order.omsStatus)">
                  {{ order.omsStatusName || order.omsStatus || '未知' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </section>

    <el-empty v-else-if="!loading" description="未找到该任务" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import { checklistApi, projectApi, systemUserApi, taskApi } from '@/api'
import { normalizeChecklistPageFromApi } from '@/features/checklists/checklist-data'
import {
  normalizeProject,
  normalizeProjectPage,
  taskStatusLabel,
  taskStatusType,
} from '@/features/projects/project-data'
import type { CheckTask, ControlChecklist, Project, ProjectTaskWorkOrder, SystemUser } from '@/types'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const task = ref<CheckTask>()
const project = ref<Project>()
const checklistOptions = ref<ControlChecklist[]>([])
const personnelOptions = ref<SystemUser[]>([])
const workOrders = ref<ProjectTaskWorkOrder[]>([])

onMounted(async () => {
  await Promise.all([loadChecklistOptions(), loadPersonnelOptions(), loadTask()])
  await loadWorkOrders()
})

const projectId = computed(() => (route.query.projectId as string | undefined) || project.value?.id || '')

const loadChecklistOptions = async () => {
  const page = normalizeChecklistPageFromApi(await checklistApi.list({ page: 1, pageSize: 100 }))
  checklistOptions.value = page.list
}

const loadPersonnelOptions = async () => {
  personnelOptions.value = (await systemUserApi.list()).filter((user) => user.status === 1)
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
    task.value.workOrders ||
    ((await taskApi.listWorkOrders(projectId.value, task.value.id)) as ProjectTaskWorkOrder[])
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

.task-card {
  padding: 24px;
  background: #fff;
  border: 1px solid $iris-border-light;
  border-radius: 8px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid $iris-border-light;

  .left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: $iris-text-primary;
  }
}

.section-block {
  margin-bottom: 22px;
}

.section-title,
.panel-title {
  padding-left: 12px;
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 700;
  color: $iris-text-primary;
  border-left: 4px solid $iris-primary;
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
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 600;
    color: $iris-text-primary;
  }

  p {
    margin: 0;
    color: $iris-text-secondary;
    line-height: 1.6;
  }
}

.description-item {
  margin-top: 14px;
}

.side-panel {
  padding: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.flow-list {
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

.work-order-list {
  display: grid;
  gap: 10px;
}

.work-order-item {
  strong,
  span {
    display: block;
  }

  span {
    margin-top: 2px;
    font-size: 12px;
    color: $iris-text-muted;
  }
}

.font-mono {
  font-family: monospace;
}
</style>
