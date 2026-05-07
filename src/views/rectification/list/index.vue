<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">整改管理</h2>
        <span class="page-subtitle">按项目、检查项和整改 OMS 工单跟踪整改闭环</span>
      </div>
      <el-button type="primary" :icon="Plus" @click="router.push('/rectification/create')">
        新建整改单
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.keyword" placeholder="任务名称/整改单标题" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable class="status-select">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="approved" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadRectifications">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      class="clickable-table"
      style="width: 100%"
      stripe
      @row-click="handleRowClick"
    >
      <el-table-column label="任务名称" min-width="260">
        <template #default="{ row }">
          <div class="task-cell">
            <strong>{{ row.taskName || row.title }}</strong>
            <span>{{ row.code }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="assigneeName" label="对接人" width="140" />
      <el-table-column prop="projectName" label="所属项目" min-width="180" />
      <el-table-column label="下达时间" width="170">
        <template #default="{ row }">{{ row.issuedAt || '—' }}</template>
      </el-table-column>
      <el-table-column label="完成时间" width="170">
        <template #default="{ row }">{{ row.completedAt || '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="light">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="详情" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click.stop="handleRowClick(row)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { rectificationApi } from '@/api'
import type { PageResult, RectificationOrder, RectStatus } from '@/types'

const router = useRouter()
const searchForm = reactive({ keyword: '', status: '' })
const tableData = ref<RectificationOrder[]>([])
const loading = ref(false)

type BackendPage<T> = PageResult<T> & {
  records?: T[]
  pageNo?: number
}

const pageRecords = <T,>(page: BackendPage<T>) => page.records || page.list || []

onMounted(() => {
  void loadRectifications()
})

const loadRectifications = async () => {
  loading.value = true
  try {
    const page = (await rectificationApi.list({
      page: 1,
      pageSize: 100,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
    })) as BackendPage<RectificationOrder>
    tableData.value = pageRecords(page)
  } finally {
    loading.value = false
  }
}

const handleRowClick = (row: RectificationOrder) => {
  router.push(`/rectification/detail/${row.id}`)
}

const statusType = (status: RectStatus) => {
  const map: Record<RectStatus, 'info' | 'primary' | 'success'> = {
    pending: 'info',
    in_progress: 'primary',
    approved: 'success',
  }
  return map[status]
}

const statusLabel = (status: RectStatus) => {
  const map: Record<RectStatus, string> = {
    pending: '待处理',
    in_progress: '进行中',
    approved: '已完成',
  }
  return map[status]
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
    margin-bottom: 4px;
    color: $iris-text-primary;
    font-size: 24px;
    font-weight: 700;
  }
}

.status-select {
  width: 140px;
}

.clickable-table {
  cursor: pointer;
}

.task-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: $iris-text-primary;
    font-weight: 600;
  }

  span {
    color: $iris-text-secondary;
    font-size: 12px;
  }
}
</style>
