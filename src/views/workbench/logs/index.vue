<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">日志中心</h2>
        <p class="page-subtitle">统一查看业务操作和外部接口调用记录</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stats-card">
        <span>日志总量</span>
        <strong>{{ total }}</strong>
      </div>
      <div class="stats-card">
        <span>{{ activeTab === 'external' ? '失败调用' : '错误日志' }}</span>
        <strong>{{ errorCount }}</strong>
      </div>
      <div class="stats-card">
        <span>{{ activeTab === 'external' ? '平均耗时' : '告警级别' }}</span>
        <strong>{{ activeTab === 'external' ? averageDurationText : warnCount }}</strong>
      </div>
      <div class="stats-card">
        <span>{{ activeTab === 'external' ? '外部系统' : '来源系统' }}</span>
        <strong>{{ sources.length }}</strong>
      </div>
    </div>

    <div class="iris-card log-panel">
      <el-tabs v-model="activeTab" class="log-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="业务操作日志" name="business" />
        <el-tab-pane label="外部接口日志" name="external" />
      </el-tabs>

      <div class="search-bar">
        <el-form :inline="true" :model="filters">
          <el-form-item label="关键字">
            <el-input
              v-model="filters.keyword"
              clearable
              :placeholder="activeTab === 'external' ? '接口 / 请求 / 响应 / 异常' : '消息内容 / 详情'"
              @keyup.enter="loadCurrentLogs"
            />
          </el-form-item>

          <template v-if="activeTab === 'business'">
            <el-form-item label="来源">
              <el-select
                v-model="filters.source"
                clearable
                placeholder="全部来源"
                style="width: 160px"
              >
                <el-option v-for="source in sources" :key="source" :label="source" :value="source" />
              </el-select>
            </el-form-item>
            <el-form-item label="级别">
              <el-select
                v-model="filters.level"
                clearable
                placeholder="全部级别"
                style="width: 140px"
              >
                <el-option label="错误" value="error" />
                <el-option label="告警" value="warn" />
                <el-option label="信息" value="info" />
                <el-option label="调试" value="debug" />
              </el-select>
            </el-form-item>
          </template>

          <template v-else>
            <el-form-item label="系统">
              <el-select
                v-model="filters.externalSystem"
                clearable
                placeholder="全部系统"
                style="width: 160px"
              >
                <el-option label="OMS" value="OMS" />
              </el-select>
            </el-form-item>
            <el-form-item label="结果">
              <el-select
                v-model="filters.success"
                clearable
                placeholder="全部结果"
                style="width: 140px"
              >
                <el-option label="成功" value="true" />
                <el-option label="失败" value="false" />
              </el-select>
            </el-form-item>
          </template>

          <el-form-item>
            <el-button type="primary" :loading="loading" @click="loadCurrentLogs">查询</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        v-if="activeTab === 'business'"
        v-loading="loading"
        :data="filteredLogs"
        size="large"
        @row-click="openBusinessDetail"
      >
        <el-table-column label="级别" width="110">
          <template #default="{ row }">
            <el-tag :type="levelType(row.level)" effect="dark" round>
              {{ levelLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源系统" width="160" />
        <el-table-column prop="operatorName" label="操作人" width="140" show-overflow-tooltip />
        <el-table-column prop="message" label="日志消息" min-width="280" show-overflow-tooltip />
        <el-table-column prop="detail" label="详情" min-width="260" show-overflow-tooltip />
        <el-table-column prop="timestamp" label="时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openBusinessDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-table
        v-else
        v-loading="loading"
        :data="externalLogs"
        size="large"
        @row-click="openExternalDetail"
      >
        <el-table-column label="结果" width="100">
          <template #default="{ row }">
            <el-tag :type="externalResultType(row.result)" effect="dark" round>
              {{ externalResultLabel(row.result) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="externalSystem" label="系统" width="120" />
        <el-table-column prop="action" label="动作" width="190" show-overflow-tooltip />
        <el-table-column prop="endpoint" label="接口" min-width="300" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">{{ row.httpStatus || '-' }}</template>
        </el-table-column>
        <el-table-column label="耗时" width="120">
          <template #default="{ row }">{{ durationText(row.durationMs) }}</template>
        </el-table-column>
        <el-table-column prop="externalBizId" label="外部单号" width="150" show-overflow-tooltip />
        <el-table-column prop="timestamp" label="时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openExternalDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="560px">
      <template v-if="selectedLog && drawerMode === 'business'">
        <div class="detail-card">
          <div class="detail-head">
            <el-tag :type="levelType(selectedLog.level)" effect="dark">
              {{ levelLabel(selectedLog.level) }}
            </el-tag>
            <span>{{ selectedLog.timestamp }}</span>
          </div>
          <h3>{{ selectedLog.source }}</h3>
          <div class="detail-meta">
            <span>操作人</span>
            <strong>{{ selectedLog.operatorName || '未知' }}</strong>
          </div>
          <p class="detail-message">{{ selectedLog.message }}</p>
          <div class="detail-content">{{ selectedLog.detail || '暂无详情' }}</div>
        </div>
      </template>

      <template v-if="selectedExternalLog && drawerMode === 'external'">
        <div class="detail-card">
          <div class="detail-head">
            <el-tag :type="externalResultType(selectedExternalLog.result)" effect="dark">
              {{ externalResultLabel(selectedExternalLog.result) }}
            </el-tag>
            <span>{{ selectedExternalLog.timestamp }}</span>
          </div>
          <h3>{{ selectedExternalLog.externalSystem }} · {{ selectedExternalLog.action }}</h3>
          <div class="detail-grid">
            <div>
              <span>接口</span>
              <strong>{{ selectedExternalLog.httpMethod }} {{ selectedExternalLog.endpoint }}</strong>
            </div>
            <div>
              <span>状态 / 耗时</span>
              <strong>
                {{ selectedExternalLog.httpStatus || '-' }} /
                {{ durationText(selectedExternalLog.durationMs) }}
              </strong>
            </div>
            <div>
              <span>项目 / 检查项 / 工单</span>
              <strong>{{ relationText(selectedExternalLog) }}</strong>
            </div>
            <div>
              <span>外部单号</span>
              <strong>{{ selectedExternalLog.externalBizId || '-' }}</strong>
            </div>
            <div>
              <span>操作人</span>
              <strong>{{ selectedExternalLog.operatorName || '系统' }}</strong>
            </div>
            <div v-if="selectedExternalLog.errorMessage">
              <span>异常</span>
              <strong>{{ selectedExternalLog.errorMessage }}</strong>
            </div>
          </div>

          <el-tabs class="payload-tabs">
            <el-tab-pane label="请求">
              <pre>{{ formatPayload(selectedExternalLog.requestBody) }}</pre>
            </el-tab-pane>
            <el-tab-pane label="响应">
              <pre>{{ formatPayload(selectedExternalLog.responseBody) }}</pre>
            </el-tab-pane>
          </el-tabs>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { externalApiLogApi, logApi } from '@/api'
import type { ExternalApiLog, LogEntry } from '@/types'

type LogTab = 'business' | 'external'
type BackendPage<T> = {
  records?: T[]
  list?: T[]
  total?: number
  pageNo?: number
  page?: number
  pageSize?: number
}

const activeTab = ref<LogTab>('business')
const filters = reactive({
  keyword: '',
  source: '',
  level: '',
  externalSystem: '',
  success: '',
})

const loading = ref(false)
const total = ref(0)
const logs = ref<LogEntry[]>([])
const externalLogs = ref<ExternalApiLog[]>([])
const drawerVisible = ref(false)
const drawerMode = ref<LogTab>('business')
const selectedLog = ref<LogEntry>()
const selectedExternalLog = ref<ExternalApiLog>()

const filteredLogs = computed(() => logs.value)
const sources = computed(() => {
  const values =
    activeTab.value === 'external'
      ? externalLogs.value.map((log) => log.externalSystem)
      : logs.value.map((log) => log.source)
  return Array.from(new Set(values.filter(Boolean)))
})
const errorCount = computed(() =>
  activeTab.value === 'external'
    ? externalLogs.value.filter((log) => log.result !== 'success').length
    : logs.value.filter((log) => log.level === 'error').length,
)
const warnCount = computed(() => logs.value.filter((log) => log.level === 'warn').length)
const averageDurationText = computed(() => {
  const durations = externalLogs.value
    .map((log) => log.durationMs)
    .filter((duration): duration is number => typeof duration === 'number')
  if (!durations.length) return '-'
  return durationText(Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length))
})
const drawerTitle = computed(() =>
  drawerMode.value === 'external' ? '外部接口详情' : '日志详情',
)

const loadCurrentLogs = () => {
  if (activeTab.value === 'external') return loadExternalLogs()
  return loadLogs()
}

const loadLogs = async () => {
  loading.value = true
  try {
    const page = (await logApi.list({
      page: 1,
      pageSize: 100,
      keyword: filters.keyword || undefined,
      source: filters.source || undefined,
      level: filters.level || undefined,
    })) as BackendPage<LogEntry>
    logs.value = normalizePageRecords(page).map((log) => ({
      ...log,
      operatorName: log.operatorName || '未知',
      detail: log.detail || `${log.source} 返回了标准化日志内容。`,
    }))
    total.value = page.total || logs.value.length
  } finally {
    loading.value = false
  }
}

const loadExternalLogs = async () => {
  loading.value = true
  try {
    const page = (await externalApiLogApi.list({
      page: 1,
      pageSize: 100,
      keyword: filters.keyword || undefined,
      externalSystem: filters.externalSystem || undefined,
      success: filters.success === '' ? undefined : filters.success === 'true',
    })) as BackendPage<ExternalApiLog>
    externalLogs.value = normalizePageRecords(page)
    total.value = page.total || externalLogs.value.length
  } finally {
    loading.value = false
  }
}

const normalizePageRecords = <T,>(page: BackendPage<T>) => page.records || page.list || []

const handleTabChange = () => {
  total.value = 0
  drawerVisible.value = false
  loadCurrentLogs()
}

const openBusinessDetail = (log: LogEntry) => {
  selectedLog.value = log
  selectedExternalLog.value = undefined
  drawerMode.value = 'business'
  drawerVisible.value = true
}

const openExternalDetail = (log: ExternalApiLog) => {
  selectedExternalLog.value = log
  selectedLog.value = undefined
  drawerMode.value = 'external'
  drawerVisible.value = true
}

const levelType = (level: string) => {
  const map: Record<string, string> = {
    error: 'danger',
    warn: 'warning',
    info: 'primary',
    debug: 'info',
  }
  return map[level] || 'info'
}

const levelLabel = (level: string) => {
  const map: Record<string, string> = {
    error: '错误',
    warn: '告警',
    info: '信息',
    debug: '调试',
  }
  return map[level] || level
}

const externalResultType = (result: string) => (result === 'success' ? 'success' : 'danger')
const externalResultLabel = (result: string) => (result === 'success' ? '成功' : '失败')
const durationText = (duration?: number) =>
  typeof duration === 'number' ? `${duration} ms` : '-'

const relationText = (log: ExternalApiLog) =>
  [log.projectId, log.taskId, log.workOrderId].filter(Boolean).join(' / ') || '-'

const formatPayload = (payload?: string) => {
  if (!payload) return '暂无内容'
  try {
    return JSON.stringify(JSON.parse(payload), null, 2)
  } catch {
    return payload
  }
}

onMounted(loadLogs)
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  margin-bottom: 24px;

  .page-title {
    font-size: 26px;
    font-weight: 700;
    color: $iris-text-primary;
  }

  .page-subtitle {
    margin-top: 8px;
    color: $iris-text-secondary;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stats-card {
  padding: 18px 20px;
  border-radius: 8px;
  background: #fff;
  box-shadow: $iris-shadow-card;

  span {
    display: block;
    margin-bottom: 8px;
    color: $iris-text-secondary;
  }

  strong {
    font-size: 28px;
    color: $iris-text-primary;
  }
}

.log-panel {
  padding-top: 10px;
}

.log-tabs {
  margin-bottom: 8px;
}

.detail-card {
  padding: 8px 4px;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: $iris-text-muted;
}

.detail-message {
  margin: 16px 0;
  font-size: 16px;
  color: $iris-text-primary;
}

.detail-meta,
.detail-grid div {
  display: flex;
  gap: 8px;
  color: $iris-text-secondary;

  strong {
    min-width: 0;
    overflow-wrap: anywhere;
    font-weight: 600;
    color: $iris-text-primary;
  }
}

.detail-grid {
  display: grid;
  gap: 12px;
  margin: 16px 0;
}

.detail-content,
pre {
  padding: 16px;
  border-radius: 8px;
  background: $iris-bg;
  line-height: 1.8;
  color: $iris-text-secondary;
}

pre {
  max-height: 420px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
