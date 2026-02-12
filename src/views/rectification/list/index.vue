<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">整改管理</h2>
        <span class="page-subtitle">内控缺陷整改的全流程跟踪</span>
      </div>
      <div class="right">
        <el-button
          type="primary"
          :icon="Plus"
          size="large"
          @click="$router.push('/rectification/create')"
          class="shadow-btn"
          >新建整改单</el-button
        >
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="整改单号">
          <el-input v-model="searchForm.keyword" placeholder="输入单号或标题" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="待整改" value="pending" />
            <el-option label="整改中" value="in_progress" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已完成" value="approved" />
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
      <el-table-column prop="code" label="整改单号" width="160">
        <template #default="{ row }">
          <el-tag effect="plain" type="info" class="font-mono">{{ row.code }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="整改标题" min-width="260">
        <template #default="{ row }">
          <span style="font-weight: 600; color: #1e293b">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="来源" width="100">
        <template #default="{ row }">
          <el-tag :type="row.source === 'task' ? 'warning' : 'info'" effect="light" round>
            {{ row.source === 'task' ? '检查发现' : '自查发现' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="assigneeName" label="负责人" width="120">
        <template #default="{ row }">
          <div style="display: flex; align-items: center">
            <el-avatar
              size="small"
              style="margin-right: 8px; background: #e2e8f0; color: #64748b"
              >{{ row.assigneeName.charAt(0) }}</el-avatar
            >
            {{ row.assigneeName }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="deadline" label="截止日期" width="140">
        <template #default="{ row }">
          <span :class="{ 'text-danger': isOverdue(row.deadline) }">{{ row.deadline }}</span>
          <el-tag
            v-if="isOverdue(row.deadline)"
            type="danger"
            size="small"
            effect="dark"
            style="margin-left: 4px; border-radius: 4px"
            >逾期</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="dark" size="small">{{
            statusLabel(row.status)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click.stop="handleRowClick(row)"
            >查看</el-button
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
import { mockRectifications } from '@/mock'
import type { RectificationOrder } from '@/types'

const router = useRouter()
const searchForm = reactive({ keyword: '', status: '' })
const tableData = ref(mockRectifications)

const handleRowClick = (row: RectificationOrder) => {
  router.push(`/rectification/detail/${row.id}`)
}

const isOverdue = (date: string) => new Date(date) < new Date()

const statusType = (val: string) => {
  const map: any = {
    pending: 'danger',
    in_progress: 'primary',
    submitted: 'warning',
    approved: 'success',
  }
  return map[val] || 'info'
}
const statusLabel = (val: string) => {
  const map: any = {
    pending: '待整改',
    in_progress: '整改中',
    submitted: '已提交',
    approved: '已完成',
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
}

.clickable-table {
  cursor: pointer;
}
.text-danger {
  color: $iris-danger;
  font-weight: 600;
}
</style>
