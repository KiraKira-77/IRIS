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
          @click="$router.push('/project/create')"
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
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="准备中" value="preparing" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      :data="tableData"
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
      <el-table-column prop="name" label="项目名称" min-width="260">
        <template #default="{ row }">
          <span style="font-weight: 600; color: #1e293b">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="startDate" label="开始日期" width="140" />
      <el-table-column prop="source" label="来源" width="120">
        <template #default="{ row }">
          <el-tag :type="row.source === 'plan' ? 'primary' : 'warning'" effect="light" round>
            {{ row.source === 'plan' ? '计划生成' : '临时启动' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="dark" size="small">{{
            statusLabel(row.status)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="进度" width="200">
        <template #default="{ row }">
          <el-progress
            :percentage="row.status === 'completed' ? 100 : 45"
            :status="row.status === 'completed' ? 'success' : ''"
            :stroke-width="8"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click.stop="handleRowClick(row)"
            >进入</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { mockProjects } from '@/mock'
import type { Project } from '@/types'

const router = useRouter()
const searchForm = reactive({ keyword: '', status: '' })
const tableData = ref(mockProjects)

const handleRowClick = (row: Project) => {
  router.push(`/project/detail/${row.id}`)
}

const statusType = (val: string) => {
  const map: any = {
    preparing: 'info',
    in_progress: 'primary',
    closing: 'warning',
    completed: 'success',
    archived: 'info',
  }
  return map[val] || 'info'
}
const statusLabel = (val: string) => {
  const map: any = {
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
</style>
