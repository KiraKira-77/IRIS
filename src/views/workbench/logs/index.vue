<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">日志中心</h2>
        <p class="page-subtitle">统一查看业务系统和基础平台的运行日志与异常详情</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stats-card">
        <span>日志总量</span>
        <strong>{{ total }}</strong>
      </div>
      <div class="stats-card">
        <span>错误日志</span>
        <strong>{{ errorCount }}</strong>
      </div>
      <div class="stats-card">
        <span>告警级别</span>
        <strong>{{ warnCount }}</strong>
      </div>
      <div class="stats-card">
        <span>来源系统</span>
        <strong>{{ sources.length }}</strong>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键字">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="消息内容 / 详情"
            @keyup.enter="loadLogs"
          />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filters.source" clearable placeholder="全部来源" style="width: 160px">
            <el-option v-for="source in sources" :key="source" :label="source" :value="source" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="filters.level" clearable placeholder="全部级别" style="width: 140px">
            <el-option label="错误" value="error" />
            <el-option label="告警" value="warn" />
            <el-option label="信息" value="info" />
            <el-option label="调试" value="debug" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadLogs">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="iris-card">
      <el-table v-loading="loading" :data="filteredLogs" size="large" @row-click="openDetail">
        <el-table-column label="级别" width="110">
          <template #default="{ row }">
            <el-tag :type="levelType(row.level)" effect="dark" round>
              {{ levelLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源系统" width="160" />
        <el-table-column prop="operatorName" label="操作人" width="140" show-overflow-tooltip />
        <el-table-column prop="message" label="日志消息" min-width="300" show-overflow-tooltip />
        <el-table-column label="详情" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.detail || `${row.source} 返回了状态检查结果，建议结合上下文进一步排查。` }}
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="openDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerVisible" title="日志详情" size="500px">
      <template v-if="selectedLog">
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
          <div class="detail-content">
            {{
              selectedLog.detail ||
              `${selectedLog.source} 侧返回标准化日志内容，建议联动告警中心或对应工单进一步跟踪。`
            }}
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { logApi } from '@/api'
import type { LogEntry } from '@/types'

type BackendLogPage = {
  records?: LogEntry[]
  list?: LogEntry[]
  total?: number
  pageNo?: number
  page?: number
  pageSize?: number
}

const filters = reactive({
  keyword: '',
  source: '',
  level: '',
})

const loading = ref(false)
const total = ref(0)
const logs = ref<LogEntry[]>([])
const drawerVisible = ref(false)
const selectedLog = ref<LogEntry>()

const sources = computed(() => Array.from(new Set(logs.value.map((log) => log.source))))
const filteredLogs = computed(() =>
  logs.value.filter((log) => {
    const keywordTarget = `${log.message} ${log.detail || ''} ${log.operatorName || ''}`
    if (
      filters.keyword &&
      !keywordTarget.toLowerCase().includes(filters.keyword.trim().toLowerCase())
    ) {
      return false
    }
    if (filters.source && log.source !== filters.source) return false
    if (filters.level && log.level !== filters.level) return false
    return true
  }),
)

const loadLogs = async () => {
  loading.value = true
  try {
    const page = (await logApi.list({
      page: 1,
      pageSize: 100,
      keyword: filters.keyword || undefined,
      source: filters.source || undefined,
      level: filters.level || undefined,
    })) as BackendLogPage
    logs.value = (page.records || page.list || []).map((log) => ({
      ...log,
      operatorName: log.operatorName || '未知',
      detail: log.detail || `${log.source} 返回了标准化日志内容。`,
    }))
    total.value = page.total || logs.value.length
  } finally {
    loading.value = false
  }
}

const errorCount = computed(() => filteredLogs.value.filter((log) => log.level === 'error').length)
const warnCount = computed(() => filteredLogs.value.filter((log) => log.level === 'warn').length)

const openDetail = (log: LogEntry) => {
  selectedLog.value = log
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
  border-radius: 16px;
  background: linear-gradient(135deg, #fff 0%, #f1f5f9 100%);
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

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: $iris-text-secondary;

  strong {
    font-weight: 600;
    color: $iris-text-primary;
  }
}

.detail-content {
  padding: 16px;
  border-radius: 12px;
  background: $iris-bg;
  line-height: 1.8;
  color: $iris-text-secondary;
}
</style>
