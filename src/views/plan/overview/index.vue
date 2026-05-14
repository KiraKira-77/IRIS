<template>
  <div class="page-container iris-page">
    <!-- Header -->
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">内控计划一览</h2>
        <span class="page-subtitle">全年计划甘特图与执行进度</span>
      </div>
      <div class="right">
        <el-date-picker
          v-model="selectedYear"
          type="year"
          placeholder="选择年度"
          value-format="YYYY"
          style="width: 140px"
          @change="onYearChange"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-row">
      <div class="stat-card" v-for="stat in statCards" :key="stat.label">
        <div class="stat-icon" :style="{ background: stat.bg }">
          <el-icon :size="20" :color="stat.color"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- Gantt Chart -->
    <el-card shadow="never" class="gantt-card">
      <template #header>
        <div class="card-title">
          <el-icon class="title-icon"><DataLine /></el-icon>
          <span>{{ selectedYear }}年 计划时间轴</span>
          <div class="legend">
            <span class="legend-item"><span class="dot draft"></span>草稿</span>
            <span class="legend-item"><span class="dot approved"></span>待启动</span>
            <span class="legend-item"><span class="dot in_progress"></span>进行中</span>
            <span class="legend-item"><span class="dot completed"></span>已完成</span>
            <span class="legend-item"><span class="dot archived"></span>已归档</span>
            <span class="legend-item"><span class="dot actual"></span>实际执行</span>
          </div>
        </div>
      </template>

      <div class="gantt-container" v-if="yearPlans.length">
        <!-- Month Headers -->
        <div class="gantt-header">
          <div class="gantt-label-col">计划</div>
          <div class="gantt-timeline-col">
            <div class="month-cell" v-for="m in 12" :key="m">
              <span class="month-name">{{ m }}月</span>
            </div>
          </div>
        </div>

        <!-- Today Line Marker -->
        <div class="gantt-body" ref="ganttBody">
          <!-- Plans -->
          <template v-for="plan in timelinePlans" :key="plan.id">
            <!-- Plan Row -->
            <div class="gantt-row plan-row" :class="{ 'child-plan-row': plan.parentId }">
              <div class="gantt-label-col">
                <div class="plan-label">
                  <div class="plan-title-line">
                    <span class="plan-name" @click="router.push(`/plan/detail/${plan.id}`)">
                      {{ plan.name }}
                    </span>
                    <el-button
                      v-if="!plan.parentId && childPlanCount(plan)"
                      class="child-toggle"
                      link
                      type="primary"
                      size="small"
                      @click.stop="toggleChildPlans(plan)"
                    >
                      {{ isPlanExpanded(plan) ? '收起' : `展开 ${childPlanCount(plan)}` }}
                    </el-button>
                  </div>
                  <div class="plan-meta-line">
                    <el-tag
                      :type="statusType(plan.status)"
                      effect="dark"
                      size="small"
                      class="status-tag"
                      >{{ statusLabel(plan.status) }}</el-tag
                    >
                    <el-tag v-if="!plan.parentId" size="small" type="warning" effect="dark">
                      年度
                    </el-tag>
                    <el-tag v-else size="small" effect="plain" round>子计划</el-tag>
                  </div>
                </div>
              </div>
              <div class="gantt-timeline-col">
                <div class="timeline-grid">
                  <div class="grid-cell" v-for="m in 12" :key="m"></div>
                </div>
                <!-- Plan bar -->
                <div class="timeline-track">
                  <div
                    class="gantt-bar plan-bar"
                    :class="plan.status"
                    :style="barStyle(planDateRange(plan))"
                  >
                    <span class="bar-label">{{ plan.period }}</span>
                  </div>
                  <el-tooltip
                    v-if="actualRange(plan)"
                    :content="actualTooltip(plan)"
                    placement="top"
                  >
                    <div
                      class="gantt-bar actual-bar"
                      :class="{ active: actualRange(plan)?.activeProjectCount }"
                      :style="barStyle(actualRange(plan)!)"
                    >
                      <span class="bar-label">实际</span>
                    </div>
                  </el-tooltip>
                </div>
                <!-- Today indicator -->
                <div class="today-line" :style="{ left: todayPosition }"></div>
              </div>
            </div>

          </template>
        </div>
      </div>

      <el-empty v-else description="该年度暂无计划" :image-size="100" />
    </el-card>

    <!-- Plan Summary Table -->
    <el-card shadow="never" class="summary-card">
      <template #header>
        <div class="card-title">
          <el-icon class="title-icon"><Grid /></el-icon>
          <span>计划汇总</span>
        </div>
      </template>
      <el-table :data="summaryPlans" border stripe size="default" style="width: 100%">
        <el-table-column prop="name" label="计划名称" min-width="360">
          <template #default="{ row }">
            <div class="summary-plan-name" :class="{ child: row.parentId }">
              <el-tag v-if="row.parentId" size="small" effect="plain" round>子计划</el-tag>
              <el-link type="primary" @click="router.push(`/plan/detail/${row.id}`)">{{
                row.name
              }}</el-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="属期" width="100">
          <template #default="{ row }">
            <el-tag effect="light" round size="small">{{ row.period }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检查项" width="80" align="center">
          <template #default="{ row }">{{ row.items.length }}</template>
        </el-table-column>
        <el-table-column label="时间跨度" width="200">
          <template #default="{ row }">
            {{ planDateRange(row).start }} ~ {{ planDateRange(row).end }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="dark" size="small">{{
              statusLabel(row.status)
            }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DataLine, Grid, Calendar, CircleCheck, Clock } from '@element-plus/icons-vue'
import { planApi, projectApi } from '@/api'
import {
  buildControlPlanTree,
  normalizePlanPage,
  resolvePlanActualExecutionRange,
  resolveControlPlanDateRange,
  type PlanActualExecutionRange,
} from '@/features/plans/plan-data'
import { normalizeProjectPage } from '@/features/projects/project-data'
import type { ControlPlan, Project } from '@/types'

const router = useRouter()
const selectedYear = ref('2026')
const plans = ref<ControlPlan[]>([])
const projects = ref<Project[]>([])
const expandedPlanIds = ref<string[]>([])

onMounted(() => {
  void loadData()
})

const onYearChange = () => loadData()

const loadData = async () => {
  await Promise.all([loadPlans(), loadProjects()])
}

const loadPlans = async () => {
  const page = normalizePlanPage(
    await planApi.list({
      page: 1,
      pageSize: 100,
      year: selectedYear.value,
    }),
  )
  plans.value = page.list
  expandedPlanIds.value = expandedPlanIds.value.filter((id) =>
    page.list.some((plan) => plan.id === id),
  )
}

const loadProjects = async () => {
  const page = normalizeProjectPage(
    await projectApi.list({
      page: 1,
      pageSize: 500,
    }),
  )
  projects.value = page.list
}

type PlanTreeRow = ControlPlan & { children?: ControlPlan[] }

const yearPlans = computed(() => plans.value.filter((p) => String(p.year) === selectedYear.value))

const planTree = computed(() => buildControlPlanTree(yearPlans.value))

const summaryPlans = computed(() =>
  planTree.value.flatMap((plan) => [plan, ...(plan.children || [])]),
)

const timelinePlans = computed(() =>
  planTree.value.flatMap((plan) =>
    isPlanExpanded(plan) ? [plan, ...(plan.children || [])] : [plan],
  ),
)

const todayDateString = computed(() => new Date().toISOString().slice(0, 10))

const actualRanges = computed<Record<string, PlanActualExecutionRange | null>>(() =>
  Object.fromEntries(
    yearPlans.value.map((plan) => [
      plan.id,
      resolvePlanActualExecutionRange(plan, yearPlans.value, projects.value, todayDateString.value),
    ]),
  ),
)

const actualRange = (plan: ControlPlan) => actualRanges.value[plan.id] || null

const actualTooltip = (plan: ControlPlan) => {
  const range = actualRange(plan)
  if (!range) return ''
  const activeText = range.activeProjectCount ? `，${range.activeProjectCount} 个未归档` : ''
  return `实际执行 ${range.start} ~ ${range.end}，关联 ${range.projectCount} 个已启动项目${activeText}`
}

const isPlanExpanded = (plan: PlanTreeRow) => expandedPlanIds.value.includes(plan.id)

const childPlanCount = (plan: PlanTreeRow) => plan.children?.length || 0

const toggleChildPlans = (plan: PlanTreeRow) => {
  if (isPlanExpanded(plan)) {
    expandedPlanIds.value = expandedPlanIds.value.filter((id) => id !== plan.id)
    return
  }
  expandedPlanIds.value = [...expandedPlanIds.value, plan.id]
}

// Stats
const statCards = computed(() => {
  const plans = yearPlans.value
  const totalItems = plans.reduce((sum, p) => sum + p.items.length, 0)
  const inProgress = plans.filter((p) => p.status === 'in_progress').length
  const completed = plans.filter((p) => p.status === 'completed').length
  const archived = plans.filter((p) => p.status === 'archived').length
  return [
    { label: '计划总数', value: plans.length, icon: Calendar, bg: '#eef2ff', color: '#4f46e5' },
    { label: '检查项总数', value: totalItems, icon: Grid, bg: '#f0fdf4', color: '#16a34a' },
    { label: '进行中', value: inProgress, icon: Clock, bg: '#fffbeb', color: '#d97706' },
    { label: '已完成', value: completed, icon: CircleCheck, bg: '#f0f9ff', color: '#0284c7' },
    { label: '已归档', value: archived, icon: CircleCheck, bg: '#f8fafc', color: '#64748b' },
  ]
})

// Status helpers
const statusType = (val: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    in_progress: 'success',
    completed: 'success',
    approved: 'primary',
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

// Date helpers
const yearStart = computed(() => new Date(`${selectedYear.value}-01-01`))
const yearEnd = computed(() => new Date(`${selectedYear.value}-12-31`))
const totalDays = computed(() => {
  return (yearEnd.value.getTime() - yearStart.value.getTime()) / (1000 * 60 * 60 * 24)
})

const todayPosition = computed(() => {
  const today = new Date()
  const start = yearStart.value
  const diff = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const pct = Math.max(0, Math.min(100, (diff / totalDays.value) * 100))
  return `${pct}%`
})

const planDateRange = (plan: ControlPlan) => {
  return resolveControlPlanDateRange(plan)
}

const barStyle = (range: { start: string; end: string }) => {
  if (!range.start || !range.end) return { display: 'none' }
  const start = new Date(range.start)
  const end = new Date(range.end)
  const ys = yearStart.value

  const leftDays = (start.getTime() - ys.getTime()) / (1000 * 60 * 60 * 24)
  const widthDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)

  const left = Math.max(0, (leftDays / totalDays.value) * 100)
  const width = Math.max(0.5, (widthDays / totalDays.value) * 100)

  return {
    left: `${left}%`,
    width: `${width}%`,
  }
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
    font-size: 22px;
    font-weight: 700;
    color: $iris-text-primary;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }

  .page-subtitle {
    font-size: 13px;
    color: $iris-text-secondary;
  }
}

// Stats Row
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: $iris-text-primary;
    line-height: 1;
  }

  .stat-label {
    font-size: 13px;
    color: $iris-text-muted;
    margin-top: 4px;
  }
}

// Gantt Card
.gantt-card,
.summary-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: $iris-text-primary;

    .title-icon {
      color: $iris-primary;
      font-size: 20px;
    }
  }
}

.legend {
  margin-left: auto;
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: $iris-text-secondary;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;

    &.draft {
      background: #94a3b8;
    }
    &.approved {
      background: #f59e0b;
    }
    &.in_progress {
      background: #22c55e;
    }
    &.completed {
      background: #3b82f6;
    }
    &.archived {
      background: #64748b;
    }
    &.actual {
      background: #0f766e;
    }
  }
}

// Gantt Layout
.gantt-container {
  overflow-x: auto;
}

.gantt-header {
  display: flex;
  border-bottom: 2px solid #e2e8f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 2;
}

.gantt-label-col {
  width: 350px;
  min-width: 350px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: $iris-text-secondary;
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.gantt-timeline-col {
  flex: 1;
  min-width: 720px;
  position: relative;
  display: flex;
}

.gantt-header .gantt-timeline-col {
  display: flex;
}

.month-cell {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 12px;
  font-weight: 600;
  color: $iris-text-secondary;
  border-right: 1px solid #f1f5f9;

  &:last-child {
    border-right: none;
  }
}

// Gantt Body
.gantt-row {
  display: flex;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;

  &:hover {
    background: #fafbfc;
  }

  .gantt-label-col {
    display: flex;
    align-items: center;
    font-weight: normal;
  }

  .gantt-timeline-col {
    position: relative;
    height: 44px;
  }
}

.plan-row {
  background: #f8fafc;

  .gantt-label-col {
    font-weight: 600;
  }

  .gantt-timeline-col {
    height: 64px;
  }

  &.child-plan-row {
    background: #ffffff;

    .gantt-label-col {
      padding-left: 28px;
      font-weight: 500;
    }
  }
}

.timeline-track {
  position: absolute;
  inset: 0;
}

.plan-label {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
  width: 100%;

  .plan-title-line,
  .plan-meta-line {
    display: flex;
    align-items: center;
    min-width: 0;
    width: 100%;
  }

  .plan-title-line {
    gap: 10px;
  }

  .plan-meta-line {
    gap: 7px;
    flex-wrap: wrap;
  }

  .child-toggle {
    margin-left: auto;
    flex-shrink: 0;
  }

  .plan-name {
    min-width: 0;
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: $iris-text-primary;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      color: $iris-primary;
    }
  }

}

.summary-plan-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  &.child {
    padding-left: 18px;
  }
}

// Timeline grid overlay
.timeline-grid {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;

  .grid-cell {
    flex: 1;
    border-right: 1px solid #f1f5f9;

    &:last-child {
      border-right: none;
    }
  }
}

// Gantt Bars
.gantt-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 6px;
  z-index: 1;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
    z-index: 3;
  }
}

.plan-bar {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.42;

  &.draft {
    background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  }
  &.in_progress {
    background: linear-gradient(135deg, #4ade80, #22c55e);
  }
  &.completed {
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
  }
  &.approved {
    background: linear-gradient(135deg, #fcd34d, #f59e0b);
  }
  &.archived {
    background: linear-gradient(135deg, #94a3b8, #64748b);
  }

  .bar-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(15, 23, 42, 0.72);
    text-shadow: none;
  }
}

.actual-bar {
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 118, 110, 0.75);
  border: 1px solid rgba(13, 148, 136, 0.25);
  z-index: 2;

  &.active {
    background: rgba(5, 150, 105, 0.8);
  }

  .bar-label {
    font-size: 10px;
    font-weight: 700;
    color: #ffffff;
  }
}

// Today line
.today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ef4444;
  z-index: 2;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: -1px;
    left: -3px;
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
  }
}

</style>
