<template>
  <div class="page-container iris-page dashboard-page">
    <section class="fusion-shell" aria-label="内控工作台">
      <header class="fusion-header">
        <div>
          <span class="fusion-kicker">全系统内控工作台</span>
          <h2>{{ greeting }}，{{ userName }}</h2>
          <p>
            今天是 {{ dashboardData.header.todayText }}。当前权限内可见待处理事项
            {{ dashboardData.header.pendingCount }} 项，检查项完成率
            {{ dashboardData.header.completionRateText }}，{{ dashboardData.healthSummary }}。
          </p>
        </div>

        <aside class="fusion-context">
          <span>当前权限范围</span>
          <strong>{{ kpiCards[0]?.value || '0' }} 个项目</strong>
          <small>{{ dashboardData.header.riskLevel }}风险，接口实时汇总</small>
        </aside>

        <el-button class="refresh-button" :icon="Refresh" :loading="loading" @click="loadDashboard">
          刷新
        </el-button>
      </header>

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
          <div class="skeleton-kpis">
            <el-skeleton-item v-for="item in 6" :key="item" variant="rect" />
          </div>
          <el-skeleton-item variant="rect" class="skeleton-main" />
        </template>
      </el-skeleton>

      <template v-else>
        <section class="fusion-kpis">
          <div v-for="card in kpiCards" :key="card.title" class="fusion-kpi">
            <span>{{ card.title }}</span>
            <strong>{{ card.value }}</strong>
            <small>{{ card.note }}</small>
          </div>
        </section>

        <section class="fusion-grid">
          <aside class="fusion-panel">
            <div class="panel-title">
              <WarningFilled />
              <h3>风险排行</h3>
            </div>
            <div class="fusion-risk-list">
              <div
                v-for="item in dashboardData.riskItems"
                :key="item.id"
                class="fusion-risk"
                :class="riskClass(item.level)"
              >
                <div>
                  <strong>{{ item.title }}</strong>
                  <small>影响范围：{{ item.scope }}</small>
                </div>
                <span class="fusion-level">{{ item.level }}</span>
              </div>
            </div>
          </aside>

          <main class="fusion-center">
            <div class="fusion-map">
              <div class="fusion-map-title">
                <strong>全域内控态势</strong>
                <span>项目、整改、档案、告警、日志联动监测</span>
              </div>

              <div class="hud-radar"></div>
              <div class="hud-radar-label">
                <div>
                  <strong>{{ dashboardData.healthScore }}</strong>
                  <span>态势指数</span>
                </div>
              </div>

              <div
                v-for="(metric, index) in dashboardData.stanceMetrics"
                :key="metric.title"
                class="stance-metric"
                :class="[metricClass(index), `is-${metric.type}`]"
              >
                <span>{{ metric.title }}</span>
                <strong>{{ metric.status }}</strong>
                <em>{{ metric.value }}</em>
                <small>{{ metric.detail }}</small>
              </div>
            </div>
          </main>

          <aside class="fusion-panel">
            <div class="panel-title">
              <BellFilled />
              <h3>实时告警</h3>
            </div>
            <div v-if="dashboardData.alertItems.length > 0" class="fusion-alert-list">
              <div
                v-for="(item, index) in dashboardData.alertItems"
                :key="item.id"
                class="fusion-alert"
                :class="alertClass(item.level)"
              >
                <span class="fusion-alert-index">{{ index + 1 }}</span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.content }}</small>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无实时告警" :image-size="76" />
          </aside>
        </section>

        <section class="fusion-bottom">
          <div class="fusion-panel todo-panel">
            <div class="panel-title">
              <Tickets />
              <h3>待办事项</h3>
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
                <el-tag :type="todo.statusType" effect="dark" size="small">
                  {{ todo.statusText }}
                </el-tag>
              </button>
            </div>
            <el-empty v-else :description="dashboardData.emptyText || '暂无待办事项'" :image-size="76" />
          </div>

          <div class="fusion-panel activity-panel">
            <div class="panel-title">
              <Clock />
              <h3>最近动态</h3>
            </div>
            <div v-if="dashboardData.activities.length > 0" class="activity-list">
              <div v-for="item in dashboardData.activities" :key="item.id" class="activity-item">
                <span class="activity-icon">
                  <component :is="activityIcon(item.type)" />
                </span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.timeText || '暂无时间' }}</small>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无最近动态" :image-size="76" />
          </div>
        </section>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  BellFilled,
  Clock,
  Collection,
  Document,
  Refresh,
  Tickets,
  WarningFilled,
} from '@element-plus/icons-vue'
import {
  alertApi,
  archiveApi,
  checklistApi,
  logApi,
  planApi,
  projectApi,
  rectificationApi,
} from '@/api'
import { normalizeChecklistPageFromApi } from '@/features/checklists/checklist-data'
import { normalizePlanPage } from '@/features/plans/plan-data'
import { normalizeProjectPage } from '@/features/projects/project-data'
import {
  buildWorkbenchDashboardData,
  type WorkbenchActivityItem,
  type WorkbenchDashboardData,
  type WorkbenchTodoItem,
} from '@/features/workbench/workbench-dashboard-data'
import { useUserStore } from '@/stores/modules/user'
import type {
  AlertEvent,
  Archive,
  ControlChecklist,
  ControlPlan,
  LogEntry,
  Project,
  RectificationOrder,
} from '@/types'

type PageLike<T> = {
  records?: T[]
  list?: T[]
}

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
const dashboardData = ref<WorkbenchDashboardData>(
  buildWorkbenchDashboardData({ projects: [], plans: [], checklists: [] }),
)
const kpiCards = computed(() => dashboardData.value.cards.slice(0, 6))

onMounted(() => {
  loadDashboard()
})

async function loadDashboard() {
  loading.value = true
  loadError.value = ''

  const [
    projectResult,
    planResult,
    checklistResult,
    rectificationResult,
    archiveResult,
    alertResult,
    logResult,
  ] = await Promise.allSettled([
    projectApi.list({ page: 1, pageSize: 100 }),
    planApi.list({ page: 1, pageSize: 100 }),
    checklistApi.list({ page: 1, pageSize: 100 }),
    rectificationApi.list({ page: 1, pageSize: 100 }),
    archiveApi.list({ page: 1, pageSize: 100 }),
    alertApi.list({ page: 1, pageSize: 20 }),
    logApi.list({ page: 1, pageSize: 20 }),
  ])

  const results = [
    projectResult,
    planResult,
    checklistResult,
    rectificationResult,
    archiveResult,
    alertResult,
    logResult,
  ]
  const failedCount = results.filter((result) => result.status === 'rejected').length
  if (failedCount > 0) {
    loadError.value =
      failedCount === results.length ? '工作台数据加载失败' : '部分工作台数据加载失败，已展示可读取数据'
  }

  dashboardData.value = buildWorkbenchDashboardData({
    projects: readProjects(projectResult),
    plans: readPlans(planResult),
    checklists: readChecklists(checklistResult),
    rectifications: readPageList<RectificationOrder>(rectificationResult),
    archives: readPageList<Archive>(archiveResult),
    alerts: readPageList<AlertEvent>(alertResult),
    logs: readPageList<LogEntry>(logResult),
    now: new Date(),
  })

  loaded.value = true
  loading.value = false
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

function readPageList<T>(result: PromiseSettledResult<unknown>): T[] {
  if (result.status !== 'fulfilled') return []
  const page = result.value as PageLike<T>
  if (Array.isArray(page.records)) return page.records
  return Array.isArray(page.list) ? page.list : []
}

function riskClass(level: string): string {
  if (level === '高') return 'is-high'
  if (level === '中') return 'is-medium'
  return 'is-low'
}

function alertClass(level: AlertEvent['level']): string {
  return `is-${level}`
}

function metricClass(index: number): string {
  return ['one', 'two', 'three', 'four'][index] || 'one'
}

function activityIcon(type: WorkbenchActivityItem['type']) {
  if (type === 'rectification') return WarningFilled
  if (type === 'log') return Clock
  if (type === 'plan') return Collection
  return Document
}

function openTodo(todo: WorkbenchTodoItem) {
  router.push({
    path: todo.targetPath,
    query: todo.targetQuery,
  })
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: calc(100vh - 84px);
  padding: 18px;
  color: oklch(97% 0.014 220);
  background:
    linear-gradient(90deg, oklch(78% 0.15 205 / 5%) 1px, transparent 1px),
    linear-gradient(0deg, oklch(78% 0.15 205 / 5%) 1px, transparent 1px),
    radial-gradient(circle at 24% 14%, oklch(66% 0.2 205 / 16%), transparent 31%),
    radial-gradient(circle at 78% 18%, oklch(63% 0.18 260 / 12%), transparent 28%),
    linear-gradient(135deg, oklch(7% 0.03 230), oklch(11% 0.042 245) 52%, oklch(6.5% 0.026 225));
  background-size:
    54px 54px,
    54px 54px,
    auto,
    auto,
    auto;
}

.fusion-shell {
  position: relative;
  isolation: isolate;
  display: grid;
  gap: 14px;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(180deg, transparent 0 48%, oklch(78% 0.16 205 / 7%) 49%, transparent 50%),
      repeating-linear-gradient(
        180deg,
        oklch(100% 0 0 / 0%) 0 13px,
        oklch(78% 0.13 205 / 3%) 14px,
        oklch(100% 0 0 / 0%) 16px
      );
    opacity: 0.42;
    pointer-events: none;
  }
}

.fusion-header,
.fusion-kpi,
.fusion-panel,
.fusion-map {
  border: 1px solid oklch(80% 0.15 205 / 26%);
  border-radius: 8px;
  background: linear-gradient(135deg, oklch(100% 0 0 / 10%), oklch(100% 0 0 / 4%));
  box-shadow:
    inset 0 1px 0 oklch(100% 0 0 / 15%),
    inset 0 -1px 0 oklch(78% 0.14 205 / 7%),
    0 18px 46px oklch(0% 0 0 / 26%),
    0 0 28px oklch(68% 0.18 205 / 8%);
  backdrop-filter: blur(16px);
}

.fusion-header {
  min-height: 126px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 206px auto;
  gap: 18px;
  align-items: center;
  padding: 20px 22px;

  h2 {
    margin: 12px 0 8px;
    color: oklch(99% 0.006 220);
    font-size: 32px;
    line-height: 1.1;
    font-weight: 780;
    letter-spacing: 0;
  }

  p {
    max-width: 84ch;
    margin: 0;
    color: oklch(88% 0.026 220);
    line-height: 1.64;
  }
}

.fusion-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: oklch(82% 0.14 205);
  font-size: 12px;
  font-weight: 840;

  &::before {
    content: '';
    width: 28px;
    height: 3px;
    border-radius: 999px;
    background: currentColor;
    box-shadow: 0 0 14px currentColor;
  }
}

.fusion-context {
  width: 184px;
  justify-self: end;
  border: 1px solid oklch(80% 0.15 205 / 28%);
  border-radius: 8px;
  padding: 16px;
  background: oklch(7.5% 0.026 230 / 68%);
  text-align: center;
  box-shadow: inset 0 1px 0 oklch(100% 0 0 / 12%);

  span {
    color: oklch(88% 0.03 220);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: oklch(99% 0.006 220);
    font-size: 22px;
    line-height: 1;
    text-shadow: 0 0 22px oklch(72% 0.15 205 / 28%);
  }

  small {
    display: block;
    margin-top: 8px;
    color: oklch(86% 0.028 220);
    font-size: 12px;
    line-height: 1.45;
  }
}

.refresh-button {
  justify-self: end;
  border-color: oklch(80% 0.15 205 / 38%);
  background: oklch(13% 0.04 235 / 84%);
  color: oklch(94% 0.03 220);
}

.dashboard-alert {
  border-radius: 8px;
}

.dashboard-skeleton {
  :deep(.el-skeleton__item) {
    border-radius: 8px;
    background: oklch(25% 0.035 235 / 50%);
  }
}

.skeleton-kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;

  :deep(.el-skeleton__item) {
    height: 106px;
  }
}

.skeleton-main {
  height: 540px;
}

.fusion-kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.fusion-kpi {
  min-width: 0;
  min-height: 106px;
  padding: 14px;

  span,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: oklch(88% 0.028 220);
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 10px;
    color: oklch(99% 0.006 220);
    font-size: 28px;
    line-height: 1;
  }

  small {
    margin-top: 8px;
    color: oklch(84% 0.11 205);
  }
}

.fusion-grid {
  display: grid;
  grid-template-columns: 330px minmax(0, 1fr) 360px;
  gap: 14px;
}

.fusion-panel {
  min-width: 0;
  padding: 16px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: oklch(84% 0.13 205);

  :deep(svg) {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
    display: block;
  }

  h3 {
    margin: 0;
    color: oklch(99% 0.006 220);
    font-size: 15px;
    font-weight: 720;
  }
}

.fusion-risk-list,
.fusion-alert-list,
.todo-list,
.activity-list {
  display: grid;
  gap: 11px;
}

.fusion-risk {
  min-height: 68px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid oklch(80% 0.15 205 / 18%);
  border-radius: 8px;
  padding: 12px;
  background: oklch(7.5% 0.026 230 / 72%);
  box-shadow: inset 0 1px 0 oklch(100% 0 0 / 8%);

  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  strong {
    color: oklch(98% 0.008 220);
    white-space: nowrap;
  }

  small {
    margin-top: 5px;
    color: oklch(87% 0.026 220);
    line-height: 1.45;
  }
}

.fusion-level {
  min-width: 42px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: oklch(99% 0.006 220);
  background: oklch(58% 0.2 25);
  font-size: 12px;
  font-weight: 840;
  box-shadow: 0 0 18px oklch(58% 0.2 25 / 28%);
}

.fusion-risk.is-medium .fusion-level,
.fusion-risk.is-low .fusion-level {
  background: oklch(78% 0.14 205);
  color: oklch(8% 0.028 230);
  box-shadow: 0 0 18px oklch(78% 0.14 205 / 28%);
}

.fusion-center {
  min-width: 0;
}

.fusion-map {
  position: relative;
  min-height: 420px;
  overflow: hidden;
  background:
    radial-gradient(circle at center, oklch(72% 0.15 205 / 16%), transparent 34%),
    linear-gradient(135deg, oklch(100% 0 0 / 9%), oklch(100% 0 0 / 4%));

  &::before {
    content: '';
    position: absolute;
    inset: 22px;
    border-radius: 8px;
    background:
      linear-gradient(90deg, oklch(80% 0.15 205 / 7%) 1px, transparent 1px),
      linear-gradient(0deg, oklch(80% 0.15 205 / 7%) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(circle at center, black, transparent 72%);
  }
}

.fusion-map-title {
  position: absolute;
  left: 18px;
  top: 16px;
  z-index: 3;

  strong,
  span {
    display: block;
  }

  strong {
    color: oklch(99% 0.006 220);
  }

  span {
    margin-top: 5px;
    color: oklch(88% 0.026 220);
    font-size: 12px;
  }
}

.hud-radar {
  position: absolute;
  left: 50%;
  top: 54%;
  width: clamp(220px, 58%, 330px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid oklch(78% 0.15 205 / 24%);
  background:
    radial-gradient(
      circle,
      transparent 0 32%,
      oklch(78% 0.15 205 / 9%) 33% 34%,
      transparent 35% 53%,
      oklch(78% 0.15 205 / 9%) 54% 55%,
      transparent 56%
    ),
    conic-gradient(from 0deg, oklch(78% 0.17 205 / 0%), oklch(78% 0.17 205 / 30%), oklch(78% 0.17 205 / 0%) 22%);
  animation: radar-spin 8s linear infinite;
}

@keyframes radar-spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.hud-radar-label {
  position: absolute;
  left: 50%;
  top: 54%;
  z-index: 3;
  width: 160px;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border: 1px solid oklch(78% 0.15 205 / 34%);
  border-radius: 50%;
  display: grid;
  place-items: center;
  text-align: center;
  background: oklch(8% 0.028 235 / 94%);
  box-shadow: 0 0 48px oklch(68% 0.2 205 / 24%);

  strong {
    display: block;
    color: oklch(98% 0.012 220);
    font-size: 38px;
    line-height: 1;
  }

  span {
    display: block;
    margin-top: 8px;
    color: oklch(90% 0.03 220);
    font-size: 12px;
  }
}

.stance-metric {
  position: absolute;
  z-index: 4;
  min-width: 142px;
  max-width: 158px;
  border: 1px solid oklch(80% 0.15 205 / 26%);
  border-radius: 8px;
  padding: 11px 12px;
  background: oklch(7.5% 0.026 230 / 84%);
  box-shadow:
    inset 0 1px 0 oklch(100% 0 0 / 10%),
    0 0 22px oklch(68% 0.18 205 / 10%);

  strong,
  span,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: oklch(84% 0.13 205);
    font-size: 12px;
  }

  strong {
    margin-top: 5px;
    color: oklch(98% 0.008 220);
    font-size: 15px;
  }

  em {
    position: absolute;
    right: 12px;
    top: 11px;
    color: oklch(99% 0.006 220);
    font-size: 20px;
    font-style: normal;
    font-weight: 820;
    line-height: 1;
  }

  small {
    margin-top: 5px;
    color: oklch(88% 0.026 220);
    font-size: 12px;
  }

  &.one {
    left: 3%;
    top: 18%;
  }

  &.two {
    right: 3%;
    top: 18%;
  }

  &.three {
    left: 3%;
    bottom: 5%;
  }

  &.four {
    right: 3%;
    bottom: 5%;
  }
}

.stance-metric.is-danger {
  border-color: oklch(62% 0.2 24 / 36%);
  box-shadow:
    inset 0 1px 0 oklch(100% 0 0 / 10%),
    0 0 24px oklch(62% 0.2 24 / 14%);

  span,
  em {
    color: oklch(76% 0.18 24);
  }
}

.stance-metric.is-warning {
  border-color: oklch(76% 0.15 78 / 36%);

  span,
  em {
    color: oklch(84% 0.14 78);
  }
}

.stance-metric.is-success {
  border-color: oklch(70% 0.13 155 / 32%);

  span,
  em {
    color: oklch(78% 0.13 155);
  }
}

.fusion-alert {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 12px 0;
  border-bottom: 1px solid oklch(78% 0.14 205 / 12%);

  &:last-child {
    border-bottom: 0;
  }

  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  strong {
    color: oklch(98% 0.008 220);
    white-space: nowrap;
  }

  small {
    margin-top: 5px;
    color: oklch(88% 0.026 220);
    line-height: 1.45;
  }
}

.fusion-alert-index {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: oklch(78% 0.14 205);
  color: oklch(8% 0.028 230);
  font-size: 12px;
  font-weight: 860;
  box-shadow: 0 0 20px oklch(78% 0.14 205 / 26%);
}

.fusion-alert.is-critical .fusion-alert-index {
  background: oklch(62% 0.2 24);
  color: oklch(98% 0.006 220);
  box-shadow: 0 0 20px oklch(62% 0.2 24 / 26%);
}

.fusion-bottom {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
  gap: 14px;
}

.todo-item {
  width: 100%;
  min-height: 60px;
  border: 1px solid oklch(80% 0.15 205 / 18%);
  border-radius: 8px;
  background: oklch(7.5% 0.026 230 / 72%);
  padding: 12px;
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: oklch(82% 0.14 205 / 56%);
    outline: none;
  }
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: oklch(70% 0.14 80);

  &.high {
    background: oklch(62% 0.2 24);
  }

  &.low {
    background: oklch(66% 0.14 155);
  }
}

.todo-main,
.activity-item > div:last-child {
  min-width: 0;
  display: grid;
  gap: 5px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: oklch(98% 0.008 220);
    font-size: 14px;
  }

  small {
    color: oklch(88% 0.026 220);
    font-size: 12px;
  }
}

.activity-item {
  min-height: 56px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.activity-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: oklch(78% 0.14 205 / 16%);
  color: oklch(88% 0.13 205);

  :deep(svg) {
    width: 16px;
    height: 16px;
    display: block;
  }
}

:deep(.el-empty__description p) {
  color: oklch(88% 0.026 220);
}

@media (max-width: 1360px) {
  .fusion-kpis,
  .skeleton-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .fusion-grid {
    grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.2fr);
  }

  .fusion-grid > .fusion-panel:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1080px) {
  .fusion-header,
  .fusion-grid,
  .fusion-bottom {
    grid-template-columns: minmax(0, 1fr);
  }

  .fusion-context,
  .refresh-button {
    justify-self: start;
  }
}

@media (max-width: 760px) {
  .dashboard-page {
    padding: 12px;
  }

  .fusion-header {
    padding: 16px;

    h2 {
      font-size: 24px;
    }
  }

  .fusion-kpis,
  .skeleton-kpis {
    grid-template-columns: minmax(0, 1fr);
  }

  .stance-metric {
    position: relative;
    left: auto;
    right: auto;
    top: auto;
    bottom: auto;
    width: calc(50% - 8px);
    margin: 8px;
  }

  .stance-metric.one,
  .stance-metric.two,
  .stance-metric.three,
  .stance-metric.four {
    left: auto;
    right: auto;
    top: auto;
    bottom: auto;
  }

  .fusion-map {
    min-height: 520px;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-end;
    padding-top: 290px;
  }

  .todo-item {
    grid-template-columns: 10px minmax(0, 1fr);

    :deep(.el-tag) {
      grid-column: 2;
      justify-self: start;
    }
  }
}
</style>
