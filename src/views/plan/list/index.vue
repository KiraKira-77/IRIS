<template>
  <div class="page-container iris-page">
    <section class="plan-hero">
      <div class="hero-copy">
        <span class="hero-kicker">计划管控</span>
        <h2 class="page-title">内控计划管理</h2>
        <p class="page-subtitle">维护年度、月度内控检查计划，跟踪检查范围、子计划和执行状态。</p>
      </div>
      <div class="hero-panel">
        <div class="hero-stat hero-stat-main">
          <span class="stat-label">计划总量</span>
          <strong>{{ planStats.total }}</strong>
          <span class="stat-note">当前筛选结果</span>
        </div>
        <div class="hero-stat">
          <span class="stat-label">待启动</span>
          <strong>{{ planStats.approved }}</strong>
        </div>
        <div class="hero-stat">
          <span class="stat-label">进行中</span>
          <strong>{{ planStats.inProgress }}</strong>
        </div>
        <div class="hero-stat">
          <span class="stat-label">已完成</span>
          <strong>{{ planStats.completed }}</strong>
        </div>
        <div class="hero-stat">
          <span class="stat-label">已归档</span>
          <strong>{{ planStats.archived }}</strong>
        </div>
      </div>
      <div class="hero-actions">
        <el-button type="primary" :icon="Plus" size="large" @click="router.push('/plan/create')">
          新建年度计划
        </el-button>
      </div>
    </section>

    <div class="plan-toolbar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="计划名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="名称、编号或描述"
            clearable
            class="keyword-input"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="年度">
          <el-date-picker
            v-model="searchForm.year"
            type="year"
            placeholder="全部年度"
            value-format="YYYY"
            class="year-picker"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            class="status-select"
            @change="handleSearch"
          >
            <el-option label="草稿" value="draft" />
            <el-option label="待启动" value="approved" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <section class="table-shell">
      <div class="table-heading">
        <div>
          <h3>计划台账</h3>
          <p>按主计划和子计划展开，直接查看计划范围、检查项数量与当前状态。</p>
        </div>
        <span class="table-count">当前 {{ treeData.length }} 个主计划</span>
      </div>

      <el-table
        :data="treeData"
        style="width: 100%"
        size="large"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
      >
        <el-table-column prop="name" label="计划名称" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            <button
              class="plan-title-button"
              type="button"
              @click="router.push(`/plan/detail/${row.id}`)"
            >
              <span>{{ row.name }}</span>
              <small>{{ row.code }}</small>
            </button>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag v-if="!row.parentId" size="small" type="warning" effect="light" round>
              年度
            </el-tag>
            <el-tag v-else size="small" effect="plain" round>{{ row.period }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检查项" width="90" align="center">
          <template #default="{ row }">{{ row.items.length }}</template>
        </el-table-column>
        <el-table-column label="子计划" width="90" align="center">
          <template #default="{ row }">
            <span v-if="!row.parentId">{{ row.children?.length || 0 }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="year" label="年度" width="100" />
        <el-table-column prop="period" label="属期" width="120" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="dark" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="140" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" size="small" @click="router.push(`/plan/detail/${row.id}`)">
                查看
              </el-button>
              <el-button
                v-if="!row.parentId && row.status !== 'draft'"
                link
                type="success"
                size="small"
                @click="router.push(`/plan/create?parentId=${row.id}`)"
                >新建子计划</el-button
              >
              <el-button
                v-if="row.status === 'draft'"
                link
                type="primary"
                size="small"
                @click="router.push(`/plan/create?id=${row.id}`)"
                >编辑</el-button
              >
              <el-button
                v-if="row.status === 'draft'"
                link
                type="warning"
                size="small"
                @click="handleActivatePlan(row)"
                >提交计划</el-button
              >
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDelete(row)"
                >删除</el-button
              >
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { planApi } from '@/api'
import { normalizePlanPage } from '@/features/plans/plan-data'
import type { ControlPlan } from '@/types'

const router = useRouter()

const allPlans = ref<ControlPlan[]>([])
const searchForm = reactive({ keyword: '', year: '', status: '' })

onMounted(() => {
  loadPlans()
})

const loadPlans = async () => {
  const page = normalizePlanPage(
    await planApi.list({
      page: 1,
      pageSize: 100,
      keyword: searchForm.keyword || undefined,
      year: searchForm.year || undefined,
      status: searchForm.status || undefined,
    }),
  )
  allPlans.value = page.list
}

const treeData = computed(() => {
  const roots = allPlans.value.filter((p) => !p.parentId)
  return roots
    .map((root) => {
      const children = allPlans.value.filter((p) => p.parentId === root.id)
      return { ...root, children }
    })
    .filter((root) => {
      const matchSelf = matchesFilter(root)
      const matchChildren = root.children.some((c) => matchesFilter(c))
      if (!searchForm.keyword && !searchForm.year && !searchForm.status) return true
      return matchSelf || matchChildren
    })
    .map((root) => {
      if (searchForm.keyword || searchForm.status) {
        return {
          ...root,
          children: root.children.filter((c) => matchesFilter(c) || matchesFilter(root)),
        }
      }
      return root
    })
})

const visiblePlans = computed(() =>
  treeData.value.flatMap((plan) => [plan, ...(plan.children || [])]),
)

const planStats = computed(() => {
  const rows = visiblePlans.value
  return {
    total: rows.length,
    approved: rows.filter((plan) => plan.status === 'approved').length,
    inProgress: rows.filter((plan) => plan.status === 'in_progress').length,
    completed: rows.filter((plan) => plan.status === 'completed').length,
    archived: rows.filter((plan) => plan.status === 'archived').length,
  }
})

const matchesFilter = (plan: ControlPlan) => {
  if (
    searchForm.keyword &&
    !plan.name.includes(searchForm.keyword) &&
    !plan.code.includes(searchForm.keyword) &&
    !(plan.description || '').includes(searchForm.keyword)
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

const handleSearch = () => loadPlans()

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.year = ''
  searchForm.status = ''
  loadPlans()
}

const handleActivatePlan = async (row: ControlPlan) => {
  try {
    await ElMessageBox.confirm(`确认提交「${row.name}」？提交后计划将进入待启动状态。`, '提交计划', {
      type: 'warning',
      confirmButtonText: '确认提交',
      cancelButtonText: '取消',
    })
    const updated = await planApi.submit(row.id)
    replacePlan(updated)
    ElMessage.success('计划已进入待启动')
  } catch {
    // dismissed
  }
}

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
    await planApi.delete(row.id)
    await loadPlans()
    ElMessage.success('已删除')
  } catch {
    // dismissed
  }
}

const replacePlan = (plan: ControlPlan) => {
  const index = allPlans.value.findIndex((item) => item.id === plan.id)
  if (index === -1) {
    allPlans.value.unshift(plan)
    return
  }
  allPlans.value.splice(index, 1, plan)
}

const statusType = (val: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    approved: 'primary',
    in_progress: 'success',
    completed: 'success',
    archived: 'info',
  }
  return (map[val] || 'info') as any
}

const statusLabel = (val: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    approved: '待启动',
    in_progress: '进行中',
    completed: '已完成',
    archived: '已归档',
  }
  return map[val] || val
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.plan-hero {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(420px, 0.9fr) auto;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 18px;
}

.hero-copy,
.hero-panel,
.plan-toolbar,
.table-shell {
  background: oklch(99% 0.005 248);
  border: 1px solid oklch(91% 0.016 248);
  box-shadow: 0 10px 28px oklch(55% 0.035 248 / 8%);
}

.hero-copy {
  min-height: 142px;
  padding: 24px 28px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-kicker {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: oklch(50% 0.1 250);
}

.page-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 760;
  color: oklch(24% 0.035 248);
}

.page-subtitle {
  max-width: 52ch;
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: oklch(48% 0.03 248);
}

.hero-panel {
  border-radius: 18px;
  padding: 16px;
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr;
  gap: 10px;
}

.hero-stat {
  min-width: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: oklch(97.5% 0.01 248);
  border: 1px solid oklch(92% 0.014 248);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.hero-stat-main {
  grid-row: span 2;
  background: oklch(95% 0.035 250);
  border-color: oklch(85% 0.06 250);
}

.stat-label,
.stat-note,
.table-count {
  font-size: 12px;
  color: oklch(50% 0.028 248);
}

.hero-stat strong {
  font-size: 25px;
  line-height: 1;
  font-weight: 760;
  color: oklch(28% 0.05 248);
}

.hero-stat-main strong {
  font-size: 38px;
  color: oklch(41% 0.14 250);
}

.hero-actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.plan-toolbar {
  margin-bottom: 18px;
  padding: 16px 18px 0;
  border-radius: 14px;

  :deep(.el-form) {
    display: flex;
    flex-wrap: wrap;
    gap: 0 10px;
  }
}

.keyword-input {
  width: 260px;
}

.year-picker {
  width: 140px;
}

.status-select {
  width: 132px;
}

.table-shell {
  border-radius: 16px;
  overflow: hidden;
}

.table-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px 14px;
  border-bottom: 1px solid oklch(92% 0.014 248);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 720;
    color: oklch(26% 0.035 248);
  }

  p {
    margin-top: 5px;
    font-size: 13px;
    color: oklch(48% 0.03 248);
  }
}

.plan-title-button {
  max-width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
  display: inline-flex;
  flex-direction: column;
  gap: 3px;

  span {
    font-size: 14px;
    font-weight: 650;
    color: oklch(30% 0.045 248);
  }

  small {
    font-size: 12px;
    color: oklch(52% 0.025 248);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  &:hover span {
    color: oklch(47% 0.14 250);
  }
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.text-muted {
  color: var(--el-text-color-placeholder);
}

:deep(.table-shell .el-table) {
  --el-table-header-bg-color: oklch(97% 0.008 248);
  --el-table-row-hover-bg-color: oklch(96.5% 0.018 248);
}

:deep(.table-shell .el-table th.el-table__cell) {
  font-weight: 680;
  color: oklch(38% 0.035 248);
}

@media (max-width: 1180px) {
  .plan-hero {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .hero-copy,
  .hero-panel,
  .plan-toolbar,
  .table-shell {
    border-radius: 12px;
  }

  .hero-panel {
    grid-template-columns: 1fr 1fr;
  }

  .hero-stat-main {
    grid-column: span 2;
  }

  .table-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .keyword-input,
  .year-picker,
  .status-select {
    width: 100%;
  }
}
</style>
