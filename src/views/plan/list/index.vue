<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">内控计划管理</h2>
        <span class="page-subtitle">制定和跟踪年度/月度内控检查计划</span>
      </div>
      <div class="right">
        <el-button
          type="primary"
          :icon="Plus"
          size="large"
          @click="router.push('/plan/create')"
          class="shadow-btn"
          >新建年度计划</el-button
        >
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="计划名称">
          <el-input v-model="searchForm.keyword" placeholder="输入关键字" clearable />
        </el-form-item>
        <el-form-item label="年度">
          <el-date-picker
            v-model="searchForm.year"
            type="year"
            placeholder="选择年度"
            value-format="YYYY"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="编制中" value="draft" />
            <el-option label="审批中" value="pending" />
            <el-option label="待启动" value="approved" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 树形表格 -->
    <el-table
      :data="treeData"
      style="width: 100%"
      size="large"
      stripe
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      default-expand-all
    >
      <el-table-column prop="code" label="计划编号" width="180">
        <template #default="{ row }">
          <el-tag effect="plain" :type="row.parentId ? '' : 'info'" class="font-mono">{{
            row.code
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="计划名称" min-width="280">
        <template #default="{ row }">
          <div class="plan-name-cell">
            <el-tag
              v-if="!row.parentId"
              size="small"
              type="warning"
              effect="dark"
              style="margin-right: 8px"
              >年度</el-tag
            >
            <el-tag v-else size="small" effect="plain" style="margin-right: 8px">{{
              row.period
            }}</el-tag>
            <el-link
              type="primary"
              :underline="false"
              @click="router.push(`/plan/detail/${row.id}`)"
            >
              <span style="font-weight: 600">{{ row.name }}</span>
            </el-link>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="检查项" width="80" align="center">
        <template #default="{ row }">
          <el-badge :value="row.items.length" type="primary" />
        </template>
      </el-table-column>
      <el-table-column label="子计划" width="80" align="center">
        <template #default="{ row }">
          <el-badge
            v-if="!row.parentId"
            :value="row.children?.length || 0"
            :type="(row.children?.length || 0) > 0 ? 'success' : 'info'"
          />
          <span v-else class="text-muted">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="dark" size="small">{{
            statusLabel(row.status)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="120" />
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            size="small"
            @click="router.push(`/plan/detail/${row.id}`)"
          >
            详情
          </el-button>
          <!-- 主计划：新建子计划 -->
          <el-button
            link
            type="success"
            size="small"
            v-if="!row.parentId && row.status !== 'draft'"
            @click="router.push(`/plan/create?parentId=${row.id}`)"
            >新建子计划</el-button
          >
          <el-button
            link
            type="primary"
            size="small"
            v-if="row.status === 'draft'"
            @click="router.push(`/plan/create?id=${row.id}`)"
            >编辑</el-button
          >
          <el-button
            link
            type="warning"
            size="small"
            v-if="row.status === 'draft'"
            @click="handleSubmitApproval(row)"
            >提交审批</el-button
          >
          <el-button
            link
            type="danger"
            size="small"
            v-if="row.status === 'draft'"
            @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { mockPlans } from '@/mock'
import type { ControlPlan } from '@/types'

const router = useRouter()

// ========== 数据 ==========
const allPlans = ref<ControlPlan[]>(mockPlans)
const searchForm = reactive({ keyword: '', year: '', status: '' })

// ========== 构建树形结构 ==========
const treeData = computed(() => {
  // Get root plans (no parentId)
  const roots = allPlans.value.filter((p) => !p.parentId)
  // Build tree: attach children to roots
  return roots
    .map((root) => {
      const children = allPlans.value.filter((p) => p.parentId === root.id)
      return { ...root, children }
    })
    .filter((root) => {
      // Apply search filters
      const matchSelf = matchesFilter(root)
      const matchChildren = root.children.some((c) => matchesFilter(c))
      if (!searchForm.keyword && !searchForm.year && !searchForm.status) return true
      return matchSelf || matchChildren
    })
    .map((root) => {
      // If filtering, also filter children
      if (searchForm.keyword || searchForm.status) {
        return {
          ...root,
          children: root.children.filter((c) => matchesFilter(c) || matchesFilter(root)),
        }
      }
      return root
    })
})

const matchesFilter = (plan: ControlPlan) => {
  if (
    searchForm.keyword &&
    !plan.name.includes(searchForm.keyword) &&
    !plan.code.includes(searchForm.keyword)
  ) {
    return false
  }
  if (searchForm.year && String(plan.year) !== searchForm.year) {
    return false
  }
  if (searchForm.status && plan.status !== searchForm.status) {
    return false
  }
  return true
}

const handleSearch = () => {
  // filteredData is computed, auto-updates
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.year = ''
  searchForm.status = ''
}

// ========== 提交审批 ==========
const handleSubmitApproval = async (row: ControlPlan) => {
  try {
    await ElMessageBox.confirm(`确认提交「${row.name}」进行审批？提交后将无法编辑。`, '提交审批', {
      type: 'warning',
      confirmButtonText: '确认提交',
      cancelButtonText: '取消',
    })
    const plan = allPlans.value.find((p) => p.id === row.id)
    if (plan) {
      plan.status = 'pending'
      ;(plan as any).updatedAt = new Date().toISOString().split('T')[0]
    }
    ElMessage.success('已提交审批')
  } catch {
    // cancelled
  }
}

// ========== 删除 ==========
const handleDelete = async (row: ControlPlan) => {
  const isParent = !row.parentId
  const childCount = allPlans.value.filter((p) => p.parentId === row.id).length
  const msg =
    isParent && childCount > 0
      ? `确认删除计划「${row.name}」及其 ${childCount} 个子计划？此操作不可恢复。`
      : `确认删除计划「${row.name}」？此操作不可恢复。`
  try {
    await ElMessageBox.confirm(msg, '删除确认', {
      type: 'error',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    if (isParent) {
      // Delete children first
      const childIds = allPlans.value.filter((p) => p.parentId === row.id).map((p) => p.id)
      for (const cid of childIds) {
        const ci = allPlans.value.findIndex((p) => p.id === cid)
        if (ci !== -1) allPlans.value.splice(ci, 1)
      }
    }
    const index = allPlans.value.findIndex((p) => p.id === row.id)
    if (index !== -1) {
      allPlans.value.splice(index, 1)
    }
    ElMessage.success('已删除')
  } catch {
    // cancelled
  }
}

// ========== 工具函数 ==========
const statusType = (val: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    pending: 'warning',
    approved: 'primary',
    in_progress: 'success',
    completed: '',
  }
  return (map[val] || 'info') as any
}

const statusLabel = (val: string) => {
  const map: Record<string, string> = {
    draft: '编制中',
    pending: '审批中',
    approved: '待启动',
    in_progress: '进行中',
    completed: '已完成',
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

.plan-name-cell {
  display: flex;
  align-items: center;
}

.text-muted {
  color: var(--el-text-color-placeholder);
}
</style>
