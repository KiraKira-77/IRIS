<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">内控项目管理</h2>
        <span class="page-subtitle">内控检查项目的执行与监控</span>
      </div>
      <div class="right">
        <el-button
          type="primary"
          :icon="Plus"
          size="large"
          @click="router.push('/project/create')"
          class="shadow-btn"
          >项目启动</el-button
        >
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="项目名称">
          <el-input v-model="searchForm.keyword" placeholder="输入关键字" clearable />
        </el-form-item>
        <el-form-item label="来源">
          <el-select
            v-model="searchForm.source"
            placeholder="全部来源"
            clearable
            style="width: 130px"
          >
            <el-option label="计划生成" value="plan" />
            <el-option label="临时启动" value="manual" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 130px"
          >
            <el-option label="准备中" value="preparing" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="收尾中" value="closing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      :data="filteredData"
      style="width: 100%"
      stripe
      size="large"
      @row-click="handleRowClick"
      class="clickable-table"
    >
      <el-table-column prop="code" label="项目编号" width="160">
        <template #default="{ row }">
          <el-tag effect="plain" type="info" class="font-mono">{{ row.code }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="项目名称" min-width="240">
        <template #default="{ row }">
          <span style="font-weight: 600; color: #1e293b">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="来源" width="110">
        <template #default="{ row }">
          <el-tag :type="row.source === 'plan' ? 'primary' : 'warning'" effect="light" round>
            {{ row.source === 'plan' ? '计划生成' : '临时启动' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="团队" width="100" align="center">
        <template #default="{ row }">
          <el-tooltip
            :content="row.team.map((t: any) => t.personnelName).join('、')"
            placement="top"
          >
            <div class="team-avatars">
              <el-avatar
                v-for="(m, i) in row.team.slice(0, 3)"
                :key="m.id"
                size="small"
                :style="{
                  background: avatarColors[i % avatarColors.length],
                  marginLeft: i > 0 ? '-8px' : '0',
                  zIndex: 3 - i,
                  border: '2px solid #fff',
                }"
                >{{ m.personnelName.charAt(0) }}</el-avatar
              >
              <span v-if="row.team.length > 3" class="team-extra">+{{ row.team.length - 3 }}</span>
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="任务" width="80" align="center">
        <template #default="{ row }">
          <el-badge :value="row.tasks.length" :type="row.tasks.length > 0 ? 'primary' : 'info'" />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="dark" size="small">{{
            statusLabel(row.status)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="进度" width="180">
        <template #default="{ row }">
          <el-progress
            :percentage="calcProgress(row)"
            :status="calcProgress(row) === 100 ? 'success' : ''"
            :stroke-width="8"
          />
        </template>
      </el-table-column>
      <el-table-column prop="startDate" label="开始日期" width="120" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click.stop="handleRowClick(row)"
            >进入</el-button
          >
          <el-button
            link
            type="danger"
            size="small"
            v-if="row.status === 'preparing'"
            @click.stop="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mockProjects } from '@/mock'
import type { Project } from '@/types'

const router = useRouter()
const allProjects = ref<Project[]>(mockProjects)
const searchForm = reactive({ keyword: '', status: '', source: '' })

const avatarColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const filteredData = computed(() => {
  return allProjects.value.filter((p) => {
    if (
      searchForm.keyword &&
      !p.name.includes(searchForm.keyword) &&
      !p.code.includes(searchForm.keyword)
    ) {
      return false
    }
    if (searchForm.status && p.status !== searchForm.status) return false
    if (searchForm.source && p.source !== searchForm.source) return false
    return true
  })
})

const handleSearch = () => {}
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.source = ''
}

const handleRowClick = (row: Project) => {
  router.push(`/project/detail/${row.id}`)
}

const handleDelete = async (row: Project) => {
  try {
    await ElMessageBox.confirm(`确认删除项目「${row.name}」？`, '删除确认', {
      type: 'error',
      confirmButtonText: '确认删除',
    })
    const idx = allProjects.value.findIndex((p) => p.id === row.id)
    if (idx !== -1) allProjects.value.splice(idx, 1)
    ElMessage.success('已删除')
  } catch {
    // cancelled
  }
}

const calcProgress = (project: Project) => {
  if (project.tasks.length === 0) return 0
  const done = project.tasks.filter((t) => t.status === 'approved').length
  return Math.round((done / project.tasks.length) * 100)
}

const statusType = (val: string) => {
  const map: Record<string, string> = {
    preparing: 'info',
    in_progress: 'primary',
    closing: 'warning',
    completed: 'success',
    archived: 'info',
  }
  return (map[val] || 'info') as any
}
const statusLabel = (val: string) => {
  const map: Record<string, string> = {
    preparing: '准备中',
    in_progress: '进行中',
    closing: '收尾中',
    completed: '已完成',
    archived: '已归档',
  }
  return map[val] || val
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: $iris-text-primary;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }
  .page-subtitle {
    font-size: 14px;
    color: $iris-text-secondary;
  }
}

.clickable-table {
  cursor: pointer;
}

.team-avatars {
  display: flex;
  align-items: center;
}

.team-extra {
  margin-left: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}
</style>
