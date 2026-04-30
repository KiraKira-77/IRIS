<template>
  <div class="page-container iris-page dashboard-page">
    <section class="dashboard-hero">
      <div class="hero-copy">
        <span class="hero-kicker">内控工作台</span>
        <h2 class="page-title">{{ greeting }}，{{ userName }}</h2>
        <p class="page-subtitle">
          今天是 {{ dashboardData.header.todayText }}。待处理事项
          {{ dashboardData.header.pendingCount }} 项，检查项完成率
          {{ dashboardData.header.completionRateText }}。
        </p>
      </div>

      <div class="hero-summary">
        <div class="summary-item">
          <span>待处理事项</span>
          <strong>{{ dashboardData.header.pendingCount }}</strong>
        </div>
        <div class="summary-item">
          <span>检查项完成率</span>
          <strong>{{ dashboardData.header.completionRateText }}</strong>
        </div>
        <div class="summary-item">
          <span>风险指数</span>
          <strong>{{ dashboardData.header.riskLevel }}</strong>
        </div>
      </div>

      <div class="hero-actions">
        <el-button :icon="Refresh" :loading="loading" @click="loadDashboard">刷新</el-button>
      </div>
    </section>

    <el-alert
      v-if="loadError"
      class="dashboard-alert"
      type="warning"
      :title="loadError"
      show-icon
      :closable="false"
    />

    <el-skeleton v-if="loading && !loaded" class="dashboard-skeleton" animated>
      <template #template>
        <div class="skeleton-grid">
          <el-skeleton-item v-for="item in 4" :key="item" variant="rect" />
        </div>
        <el-skeleton-item variant="rect" class="skeleton-main" />
      </template>
    </el-skeleton>

    <template v-else>
      <el-empty v-if="dashboardData.emptyText" :description="dashboardData.emptyText" />

      <section class="metric-grid">
        <div v-for="card in dashboardData.cards" :key="card.title" class="metric-card" :class="card.type">
          <div class="metric-icon">
            <component :is="cardIconMap[card.type]" />
          </div>
          <div class="metric-body">
            <span>{{ card.title }}</span>
            <strong>{{ card.value }}</strong>
            <small>{{ card.note }}</small>
          </div>
        </div>
      </section>

      <section class="dashboard-grid">
        <div class="panel trend-panel">
          <div class="panel-header">
            <div>
              <h3>项目更新趋势</h3>
              <p>近 7 日项目更新数量</p>
            </div>
          </div>
          <div v-if="hasTrendData" ref="trendChartRef" class="chart-container"></div>
          <el-empty v-else description="暂无趋势数据" :image-size="72" />
        </div>

        <div class="panel distribution-panel">
          <div class="panel-header">
            <div>
              <h3>项目状态分布</h3>
              <p>按当前项目状态汇总</p>
            </div>
          </div>
          <div v-if="hasDistributionData" ref="distributionChartRef" class="chart-container compact"></div>
          <el-empty v-else description="暂无分布数据" :image-size="72" />
        </div>

        <div class="panel todo-panel">
          <div class="panel-header">
            <div>
              <h3>待办检查项</h3>
              <p>优先展示需要复核、整改或办理的检查项</p>
            </div>
            <el-button link type="primary" @click="router.push('/project/list')">查看项目</el-button>
          </div>

          <div v-if="dashboardData.todoList.length > 0" class="todo-list">
            <button
              v-for="todo in dashboardData.todoList"
              :key="todo.id"
              class="todo-item"
              type="button"
              @click="openTodo(todo)"
            >
              <span class="priority-dot" :class="todo.priority"></span>
              <span class="todo-main">
                <strong>{{ todo.title }}</strong>
                <small>{{ todo.projectName }} · {{ todo.assigneeName }} · {{ todo.dateText }}</small>
              </span>
              <el-tag :type="todo.statusType" effect="light" size="small">
                {{ todo.statusText }}
              </el-tag>
            </button>
          </div>
          <el-empty v-else description="暂无待办检查项" :image-size="72" />
        </div>

        <div class="panel activity-panel">
          <div class="panel-header">
            <div>
              <h3>最近动态</h3>
              <p>按项目和计划更新时间排序</p>
            </div>
          </div>

          <div v-if="dashboardData.activities.length > 0" class="activity-list">
            <div v-for="item in dashboardData.activities" :key="item.id" class="activity-item">
              <div class="activity-icon">
                <CircleCheck v-if="item.type === 'project'" />
                <WarnTriangleFilled v-else-if="item.type === 'rectification'" />
                <Document v-else />
              </div>
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.timeText }}</small>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无动态" :image-size="72" />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  CircleCheck,
  Document,
  Finished,
  Monitor,
  Refresh,
  WarnTriangleFilled,
} from '@element-plus/icons-vue'
import { checklistApi, planApi, projectApi } from '@/api'
import { normalizeChecklistPageFromApi } from '@/features/checklists/checklist-data'
import { normalizePlanPage } from '@/features/plans/plan-data'
import { normalizeProjectPage } from '@/features/projects/project-data'
import {
  buildWorkbenchDashboardData,
  type WorkbenchDashboardData,
  type WorkbenchTodoItem,
} from '@/features/workbench/workbench-dashboard-data'
import { mockRectifications } from '@/mock'
import { useUserStore } from '@/stores/modules/user'
import type { ControlChecklist, ControlPlan, Project } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const userName = computed(() => userStore.userName || '管理员')
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早安'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const loading = ref(false)
const loaded = ref(false)
const loadError = ref('')
const trendChartRef = ref<HTMLDivElement>()
const distributionChartRef = ref<HTMLDivElement>()
let trendChart: echarts.ECharts | null = null
let distributionChart: echarts.ECharts | null = null

const dashboardData = ref<WorkbenchDashboardData>(
  buildWorkbenchDashboardData({ projects: [], plans: [], checklists: [] }),
)

const cardIconMap = {
  danger: WarnTriangleFilled,
  warning: WarnTriangleFilled,
  primary: Monitor,
  info: Document,
  success: Finished,
}

const hasTrendData = computed(() =>
  dashboardData.value.projectTrend.series.some((series) => series.data.some((value) => value > 0)),
)
const hasDistributionData = computed(() => dashboardData.value.distribution.length > 0)

onMounted(() => {
  loadDashboard()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  trendChart?.dispose()
  distributionChart?.dispose()
})

async function loadDashboard() {
  loading.value = true
  loadError.value = ''

  const [projectResult, planResult, checklistResult] = await Promise.allSettled([
    projectApi.list({ page: 1, pageSize: 100 }),
    planApi.list({ page: 1, pageSize: 100 }),
    checklistApi.list({ page: 1, pageSize: 100 }),
  ])

  const projects = readProjects(projectResult)
  const plans = readPlans(planResult)
  const checklists = readChecklists(checklistResult)
  const failedCount = [projectResult, planResult, checklistResult].filter(
    (result) => result.status === 'rejected',
  ).length

  if (failedCount > 0) {
    loadError.value = failedCount === 3 ? '工作台数据加载失败' : '部分工作台数据加载失败'
  }

  dashboardData.value = buildWorkbenchDashboardData({
    projects,
    plans,
    checklists,
    rectifications: mockRectifications,
    now: new Date(),
  })

  loaded.value = true
  loading.value = false
  await nextTick()
  renderCharts()
}

function readProjects(result: PromiseSettledResult<unknown>): Project[] {
  if (result.status !== 'fulfilled') return []
  return normalizeProjectPage(result.value as Parameters<typeof normalizeProjectPage>[0]).list
}

function readPlans(result: PromiseSettledResult<unknown>): ControlPlan[] {
  if (result.status !== 'fulfilled') return []
  return normalizePlanPage(result.value as Parameters<typeof normalizePlanPage>[0]).list
}

function readChecklists(result: PromiseSettledResult<unknown>): ControlChecklist[] {
  if (result.status !== 'fulfilled') return []
  return normalizeChecklistPageFromApi(result.value as Parameters<typeof normalizeChecklistPageFromApi>[0]).list
}

function renderCharts() {
  renderTrendChart()
  renderDistributionChart()
}

function renderTrendChart() {
  if (!trendChartRef.value || !hasTrendData.value) {
    trendChart?.dispose()
    trendChart = null
    return
  }

  trendChart ||= echarts.init(trendChartRef.value)
  trendChart.setOption({
    grid: { left: 36, right: 18, top: 18, bottom: 28 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: dashboardData.value.projectTrend.labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#667085' },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { type: 'dashed', color: '#e4e7ec' } },
      axisLabel: { color: '#667085' },
    },
    series: dashboardData.value.projectTrend.series.map((series) => ({
      ...series,
      type: 'line',
      smooth: true,
      symbolSize: 7,
      lineStyle: { width: 3, color: '#2563eb' },
      itemStyle: { color: '#2563eb' },
      areaStyle: { color: 'rgba(37, 99, 235, 0.08)' },
    })),
  })
}

function renderDistributionChart() {
  if (!distributionChartRef.value || !hasDistributionData.value) {
    distributionChart?.dispose()
    distributionChart = null
    return
  }

  distributionChart ||= echarts.init(distributionChartRef.value)
  distributionChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, icon: 'circle', itemGap: 14, textStyle: { color: '#475467' } },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '43%'],
        label: { show: false },
        itemStyle: {
          borderRadius: 6,
          borderColor: '#f8fafc',
          borderWidth: 2,
        },
        data: dashboardData.value.distribution.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color },
        })),
      },
    ],
  })
}

function resizeCharts() {
  trendChart?.resize()
  distributionChart?.resize()
}

function openTodo(todo: WorkbenchTodoItem) {
  router.push({
    path: todo.targetPath,
    query: todo.targetQuery,
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.dashboard-page {
  padding-bottom: 32px;
}

.dashboard-hero {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(360px, 0.85fr) auto;
  gap: 16px;
  align-items: stretch;
  margin-bottom: 18px;
}

.hero-copy,
.hero-summary,
.panel,
.metric-card {
  background: oklch(99% 0.005 248);
  border: 1px solid oklch(91% 0.016 248);
  box-shadow: 0 10px 28px oklch(55% 0.035 248 / 8%);
}

.hero-copy {
  min-height: 132px;
  padding: 22px 26px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-kicker {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 720;
  color: oklch(46% 0.12 250);
}

.page-title {
  margin: 0;
  font-size: 27px;
  line-height: 1.2;
  font-weight: 760;
  color: oklch(24% 0.035 248);
}

.page-subtitle {
  max-width: 70ch;
  margin-top: 10px;
  color: oklch(48% 0.03 248);
  font-size: 14px;
  line-height: 1.7;
}

.hero-summary {
  border-radius: 8px;
  padding: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-content: center;
  gap: 14px;
}

.summary-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  span {
    font-size: 12px;
    color: oklch(48% 0.028 248);
  }

  strong {
    color: oklch(26% 0.05 248);
    font-size: 28px;
    line-height: 1;
    font-weight: 760;
  }
}

.hero-actions {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
}

.dashboard-alert {
  margin-bottom: 16px;
}

.dashboard-skeleton {
  padding: 4px 0 24px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;

  :deep(.el-skeleton__item) {
    height: 104px;
    border-radius: 8px;
  }
}

.skeleton-main {
  height: 360px;
  border-radius: 8px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.metric-card {
  min-width: 0;
  border-radius: 8px;
  padding: 18px;
  display: flex;
  gap: 14px;
  align-items: center;
  transition:
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px oklch(55% 0.035 248 / 11%);
  }
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex: 0 0 auto;
}

.metric-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  span,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    font-size: 13px;
    color: oklch(47% 0.028 248);
  }

  strong {
    font-size: 28px;
    line-height: 1;
    font-weight: 760;
    color: oklch(25% 0.04 248);
  }

  small {
    font-size: 12px;
    color: oklch(56% 0.026 248);
  }
}

.metric-card.primary .metric-icon {
  background: oklch(94% 0.035 250);
  color: oklch(46% 0.16 250);
}

.metric-card.success .metric-icon {
  background: oklch(94% 0.04 155);
  color: oklch(46% 0.13 155);
}

.metric-card.danger .metric-icon {
  background: oklch(95% 0.035 25);
  color: oklch(55% 0.18 25);
}

.metric-card.warning .metric-icon {
  background: oklch(95% 0.04 75);
  color: oklch(56% 0.15 70);
}

.metric-card.info .metric-icon {
  background: oklch(95% 0.018 248);
  color: oklch(45% 0.045 248);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.8fr);
  gap: 18px;
  align-items: start;
}

.panel {
  min-width: 0;
  border-radius: 8px;
  padding: 20px;
}

.todo-panel {
  grid-column: 1;
}

.activity-panel {
  grid-column: 2;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    color: oklch(25% 0.035 248);
    font-size: 16px;
    font-weight: 720;
  }

  p {
    margin-top: 5px;
    color: oklch(54% 0.026 248);
    font-size: 12px;
    line-height: 1.5;
  }
}

.chart-container {
  width: 100%;
  height: 300px;
}

.chart-container.compact {
  height: 264px;
}

.todo-list,
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.todo-item {
  width: 100%;
  min-height: 58px;
  border: 1px solid oklch(92% 0.014 248);
  border-radius: 8px;
  background: oklch(98.5% 0.006 248);
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms cubic-bezier(0.16, 1, 0.3, 1),
    background 160ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    border-color: oklch(78% 0.08 250);
    background: oklch(97% 0.014 250);
  }

  &:focus-visible {
    outline: 2px solid oklch(68% 0.13 250);
    outline-offset: 2px;
  }
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: oklch(65% 0.13 85);

  &.high {
    background: oklch(56% 0.18 25);
  }

  &.low {
    background: oklch(58% 0.13 155);
  }
}

.todo-main,
.activity-item > div:last-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: oklch(28% 0.035 248);
    font-size: 14px;
    font-weight: 680;
  }

  small {
    color: oklch(54% 0.026 248);
    font-size: 12px;
  }
}

.activity-item {
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid oklch(93% 0.012 248);

  &:last-child {
    border-bottom: 0;
  }
}

.activity-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: oklch(95% 0.02 248);
  color: oklch(44% 0.12 250);
  flex: 0 0 auto;
}

@media (max-width: 1180px) {
  .dashboard-hero,
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .todo-panel,
  .activity-panel {
    grid-column: auto;
  }
}

@media (max-width: 880px) {
  .metric-grid,
  .skeleton-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .hero-copy,
  .hero-summary,
  .panel,
  .metric-card {
    padding: 16px;
  }

  .metric-grid,
  .skeleton-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-title {
    font-size: 23px;
  }

  .todo-item {
    grid-template-columns: 10px minmax(0, 1fr);

    :deep(.el-tag) {
      grid-column: 2;
      justify-self: flex-start;
    }
  }
}
</style>
