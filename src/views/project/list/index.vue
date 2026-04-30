<template>
  <div class="page-container iris-page">
    <section class="project-hero">
      <div class="hero-copy">
        <span class="hero-kicker">项目管理</span>
        <h2 class="page-title">内控项目管理</h2>
        <p class="page-subtitle">查看项目来源、项目时间、检查项数和执行进度。</p>
      </div>
      <div class="hero-panel">
        <div class="hero-stat hero-stat-main">
          <span class="stat-label">项目总量</span>
          <strong>{{ projectStats.total }}</strong>
          <span class="stat-note">当前筛选结果</span>
        </div>
        <div class="hero-stat">
          <span class="stat-label">待启动</span>
          <strong>{{ projectStats.notStarted }}</strong>
        </div>
        <div class="hero-stat">
          <span class="stat-label">进行中</span>
          <strong>{{ projectStats.inProgress }}</strong>
        </div>
        <div class="hero-stat">
          <span class="stat-label">已完成</span>
          <strong>{{ projectStats.completed }}</strong>
        </div>
      </div>
      <div class="hero-actions">
        <el-button type="primary" :icon="Plus" size="large" @click="router.push('/project/create')">
          项目启动
        </el-button>
      </div>
    </section>

    <div class="project-toolbar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="项目名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="名称、编号或描述"
            clearable
            class="keyword-input"
            @keyup.enter="handleSearchSubmit"
          />
        </el-form-item>
        <el-form-item label="项目时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="date-range"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            class="status-select"
            @change="handleFilterChange"
          >
            <el-option label="待启动" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearchSubmit">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <section class="table-shell">
      <div class="table-heading">
        <div>
          <h3>项目台账</h3>
          <p>按项目成员可见范围展示，可进入详情查看检查项执行情况。</p>
        </div>
        <span class="table-count">当前页 {{ tableData.length }} 条</span>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        style="width: 100%"
        size="large"
        @row-click="handleRowClick"
      >
        <el-table-column prop="name" label="项目名称" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <button class="project-title-button" type="button" @click.stop="handleRowClick(row)">
              <span>{{ row.name }}</span>
              <small>{{ row.code }}</small>
            </button>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="项目来源" width="120">
          <template #default="{ row }">
            <el-tag :type="row.source === 'plan' ? 'primary' : 'warning'" effect="light" round>
              {{ projectSourceLabel(row.source) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="项目时间" width="220">
          <template #default="{ row }">
            {{ projectTimeText(row) }}
          </template>
        </el-table-column>
        <el-table-column label="检查项数" width="100" align="center">
          <template #default="{ row }">
            {{ projectChecklistCount(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="projectStatusType(row.status)" effect="dark" size="small">
              {{ projectStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="190">
          <template #default="{ row }">
            <el-progress
              :percentage="projectProgress(row)"
              :status="projectProgress(row) === 100 ? 'success' : ''"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" size="small" @click.stop="handleRowClick(row)">
                查看
              </el-button>
              <el-button
                v-if="row.status === 'not_started'"
                link
                type="danger"
                size="small"
                @click.stop="handleDelete(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { projectApi } from '@/api'
import {
  normalizeProjectPage,
  projectChecklistCount,
  projectProgress,
  projectSourceLabel,
  projectStatusLabel,
  projectStatusType,
  projectTimeText,
} from '@/features/projects/project-data'
import type { Project } from '@/types'

const router = useRouter()
const loading = ref(false)
const tableData = ref<Project[]>([])
const searchForm = reactive({
  keyword: '',
  status: '',
  dateRange: [] as string[],
})
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const projectStats = computed(() => ({
  total: pagination.total,
  notStarted: tableData.value.filter((item) => item.status === 'not_started').length,
  inProgress: tableData.value.filter((item) => item.status === 'in_progress').length,
  completed: tableData.value.filter((item) => item.status === 'completed').length,
}))

onMounted(() => {
  loadProjects()
})

const loadProjects = async () => {
  loading.value = true
  try {
    const page = normalizeProjectPage(
      await projectApi.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchForm.keyword || undefined,
        status: searchForm.status || undefined,
        startDate: searchForm.dateRange?.[0] || undefined,
        endDate: searchForm.dateRange?.[1] || undefined,
      }),
    )
    tableData.value = page.list
    pagination.total = page.total
  } finally {
    loading.value = false
  }
}

const handleSearchSubmit = () => {
  pagination.page = 1
  loadProjects()
}

const handleFilterChange = () => {
  handleSearchSubmit()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.dateRange = []
  handleSearchSubmit()
}

const handlePageSizeChange = () => {
  pagination.page = 1
  loadProjects()
}

const handlePageChange = () => {
  loadProjects()
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
    await projectApi.delete(row.id)
    ElMessage.success('已删除')
    loadProjects()
  } catch {
    // cancelled or request failed
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.project-hero {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(420px, 0.9fr) auto;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 18px;
}

.hero-copy,
.hero-panel,
.project-toolbar,
.table-shell,
.pagination-wrapper {
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

.project-toolbar {
  margin-bottom: 18px;
  padding: 16px 18px 0;
  border-radius: 14px;

  :deep(.el-form) {
    display: flex;
    flex-wrap: wrap;
    gap: 0 10px;
  }
}

.table-shell {
  border-radius: 16px;
  overflow: hidden;
}

.keyword-input {
  width: 260px;
}

.date-range {
  width: 280px;
}

.status-select {
  width: 132px;
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
    color: oklch(52% 0.028 248);
  }
}

.project-title-button {
  width: 100%;
  border: 0;
  background: transparent;
  font: inherit;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 0;
  text-align: left;
  cursor: pointer;

  span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    color: oklch(35% 0.1 250);
    font-weight: 680;
    white-space: nowrap;
  }

  small {
    font-size: 12px;
    color: oklch(56% 0.026 248);
  }

  &:hover span {
    color: oklch(42% 0.15 250);
  }

  &:focus-visible {
    border-radius: 6px;
    outline: 2px solid oklch(68% 0.13 250);
    outline-offset: 3px;
  }
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  padding: 14px 18px;
  border-radius: 14px;
}

:deep(.table-shell .el-table) {
  border-radius: 0;
  box-shadow: none;
}

:deep(.table-shell .el-table th.el-table__cell) {
  background: oklch(97% 0.01 248);
}

@media (max-width: 1180px) {
  .project-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .project-hero {
    gap: 12px;
  }

  .hero-copy,
  .hero-panel,
  .project-toolbar,
  .table-shell,
  .pagination-wrapper {
    border-radius: 12px;
  }

  .hero-copy {
    min-height: auto;
    padding: 18px;
  }

  .hero-panel {
    grid-template-columns: 1fr;
  }

  .hero-stat-main {
    grid-row: auto;
  }

  .page-title {
    font-size: 23px;
  }

  .keyword-input,
  .date-range,
  .status-select {
    width: 100%;
  }

  .table-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
