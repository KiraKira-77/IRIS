<template>
  <div class="page-container iris-page">
    <!-- 头部信息 -->
    <div class="project-header-card">
      <div class="header-top">
        <div class="title-section">
          <el-button link :icon="Back" @click="$router.push('/project/list')" class="back-btn"
            >返回列表</el-button
          >
          <div class="title-content">
            <h2 class="project-title">{{ project?.name }}</h2>
            <div class="meta">
              <span class="code">{{ project?.code }}</span>
              <el-tag :type="statusType(project?.status)" effect="dark" size="small" round>
                {{ statusLabel(project?.status) }}
              </el-tag>
            </div>
          </div>
        </div>
        <div class="actions">
          <el-button type="primary" plain class="shadow-btn">项目日报</el-button>
          <el-button type="success" v-if="project?.status === 'in_progress'" class="shadow-btn"
            >项目收尾</el-button
          >
        </div>
      </div>

      <div class="header-stats">
        <div class="stat-item">
          <label>项目经理</label>
          <div class="value">张三</div>
        </div>
        <div class="stat-item">
          <label>开始日期</label>
          <div class="value">{{ project?.startDate }}</div>
        </div>
        <div class="stat-item flex-grow">
          <label>计划进度</label>
          <div class="value" style="width: 200px">
            <el-progress :percentage="45" :stroke-width="10" />
          </div>
        </div>
      </div>
    </div>

    <!--主要内容 Tabs -->
    <div class="iris-card project-tabs-card">
      <el-tabs v-model="activeTab" class="premium-tabs">
        <el-tab-pane label="项目概览" name="overview">
          <el-empty description="概览图表开发中" />
        </el-tab-pane>
        <el-tab-pane label="核查任务" name="tasks">
          <!-- 任务列表 -->
          <div class="task-toolbar">
            <el-button type="primary" :icon="Plus">添加任务</el-button>
            <el-button type="success" plain>批量分发</el-button>
          </div>
          <el-table :data="tasks" style="width: 100%" size="large">
            <el-table-column prop="id" label="任务编号" width="120" />
            <el-table-column
              prop="checkContent"
              label="检查内容"
              min-width="300"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                <span style="font-weight: 500">{{ row.checkContent }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="assigneeName" label="负责人" width="120">
              <template #default="{ row }">
                <el-avatar
                  size="small"
                  style="background: #3b82f6; vertical-align: middle; margin-right: 4px"
                  >{{ row.assigneeName.charAt(0) }}</el-avatar
                >
                {{ row.assigneeName }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="140">
              <template #default="{ row }">
                <el-tag :type="taskStatusType(row.status)" size="small" effect="light" round>{{
                  taskStatusLabel(row.status)
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  size="small"
                  @click="$router.push(`/project/task/${row.id}`)"
                  >办理</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="项目团队" name="team">
          <el-empty description="团队管理开发中" />
        </el-tab-pane>
        <el-tab-pane label="项目文档" name="docs">
          <el-empty description="文档管理开发中" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Back, Plus } from '@element-plus/icons-vue'
import { mockProjects } from '@/mock'
import type { Project } from '@/types'

const route = useRoute()
const project = ref<Project>()
const activeTab = ref('tasks')

// 模拟任务数据
const tasks = ref([
  {
    id: 'T-001',
    checkContent: '检查用户权限申请流程是否规范，是否有审批记录',
    assigneeName: '王五',
    status: 'pending',
  },
  {
    id: 'T-002',
    checkContent: '核对核心系统管理员账号操作日志',
    assigneeName: '李四',
    status: 'submitted',
  },
  {
    id: 'T-003',
    checkContent: '验证数据备份策略的有效性及恢复测试记录',
    assigneeName: '赵六',
    status: 'approved',
  },
])

onMounted(() => {
  const id = route.params.id as string
  project.value = mockProjects.find((p) => p.id === id) || mockProjects[0]
})

const statusType = (val: string | undefined) => {
  const map: any = {
    preparing: 'info',
    in_progress: 'primary',
    closing: 'warning',
    completed: 'success',
  }
  return map[val || ''] || 'info'
}
const statusLabel = (val: string | undefined) => {
  const map: any = {
    preparing: '准备中',
    in_progress: '进行中',
    closing: '收尾中',
    completed: '已完成',
  }
  return map[val || ''] || val
}
const taskStatusType = (val: string) => {
  const map: any = {
    pending: 'info',
    in_progress: 'primary',
    submitted: 'warning',
    approved: 'success',
    rectifying: 'danger',
  }
  return map[val] || 'info'
}
const taskStatusLabel = (val: string) => {
  const map: any = {
    pending: '待启动',
    in_progress: '进行中',
    submitted: '已提交',
    approved: '已通过',
    rectifying: '需整改',
  }
  return map[val] || val
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
    margin-bottom: 20px;
  }
}
</style>
