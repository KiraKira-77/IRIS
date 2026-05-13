<template>
  <div class="page-container iris-page ai-log-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">AI 问答日志</h2>
        <p class="page-subtitle">查看每次提问的页面上下文、工具调用链路、模型响应和原始追踪数据</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadTraces">刷新</el-button>
    </div>

    <div class="summary-strip">
      <div>
        <span>日志总数</span>
        <strong>{{ total }}</strong>
      </div>
      <div>
        <span>成功回答</span>
        <strong>{{ okCount }}</strong>
      </div>
      <div>
        <span>异常或未配置</span>
        <strong>{{ abnormalCount }}</strong>
      </div>
      <div>
        <span>平均耗时</span>
        <strong>{{ averageLatency }}ms</strong>
      </div>
    </div>

    <div class="toolbar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键字">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索问题、Trace ID、页面、模型或用户"
            style="width: 300px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 160px">
            <el-option label="成功" value="ok" />
            <el-option label="进行中" value="started" />
            <el-option label="模型未配置" value="model_unconfigured" />
            <el-option label="模型离线" value="model_offline" />
            <el-option label="配置异常" value="model_config_invalid" />
            <el-option label="失败" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-shell">
      <el-table v-loading="loading" :data="traces" row-key="traceId" stripe>
        <el-table-column label="提问时间" prop="createdAt" min-width="160" />
        <el-table-column label="用户" min-width="110">
          <template #default="{ row }">
            {{ row.username || row.userId || '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="页面上下文" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.routePath || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="问题" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="question-text">{{ row.question }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="126">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="模型" prop="modelName" min-width="150" show-overflow-tooltip />
        <el-table-column label="工具" min-width="190">
          <template #default="{ row }">
            <div v-if="toolNames(row.toolNamesJson).length" class="tag-stack">
              <el-tag v-for="tool in toolNames(row.toolNamesJson)" :key="tool" size="small">
                {{ tool }}
              </el-tag>
            </div>
            <span v-else class="muted">未调用</span>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="100">
          <template #default="{ row }">
            {{ row.latencyMs ?? '-' }}ms
          </template>
        </el-table-column>
        <el-table-column label="Trace ID" min-width="220" show-overflow-tooltip prop="traceId" />
        <el-table-column label="操作" width="92" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 50]"
          @current-change="loadTraces"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <el-drawer v-model="detailVisible" title="AI 问答链路详情" size="760px" destroy-on-close>
      <el-skeleton v-if="detailLoading" :rows="8" animated />
      <div v-else-if="selectedTrace" class="trace-detail">
        <section class="detail-section">
          <div class="section-title">问答内容</div>
          <dl class="detail-grid">
            <div>
              <dt>Trace ID</dt>
              <dd class="mono">{{ selectedTrace.traceId }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>
                <el-tag :type="statusTagType(selectedTrace.status)" effect="light">
                  {{ statusLabel(selectedTrace.status) }}
                </el-tag>
              </dd>
            </div>
            <div>
              <dt>用户</dt>
              <dd>{{ selectedTrace.username || selectedTrace.userId || '-' }}</dd>
            </div>
            <div>
              <dt>耗时</dt>
              <dd>{{ selectedTrace.latencyMs ?? '-' }}ms</dd>
            </div>
          </dl>
          <div class="qa-block">
            <span>问题</span>
            <p>{{ selectedTrace.question }}</p>
          </div>
          <div class="qa-block">
            <span>回答</span>
            <p>{{ selectedTrace.answer || '暂无回答内容' }}</p>
          </div>
          <el-alert
            v-if="selectedTrace.errorMessage"
            type="error"
            :closable="false"
            :title="selectedTrace.errorMessage"
            show-icon
          />
        </section>

        <section class="detail-section">
          <div class="section-title">上下文与模型</div>
          <dl class="detail-grid">
            <div>
              <dt>页面</dt>
              <dd>{{ selectedTrace.routePath || '-' }}</dd>
            </div>
            <div>
              <dt>对象</dt>
              <dd>{{ entityText(selectedTrace) }}</dd>
            </div>
            <div>
              <dt>供应商</dt>
              <dd>{{ selectedTrace.providerType || '-' }}</dd>
            </div>
            <div>
              <dt>模型</dt>
              <dd>{{ selectedTrace.modelName || '-' }}</dd>
            </div>
          </dl>
          <div class="detail-row">
            <span>工具</span>
            <div v-if="toolNames(selectedTrace.toolNamesJson).length" class="tag-stack">
              <el-tag v-for="tool in toolNames(selectedTrace.toolNamesJson)" :key="tool" size="small">
                {{ tool }}
              </el-tag>
            </div>
            <em v-else>未调用工具</em>
          </div>
          <div class="detail-row">
            <span>引用</span>
            <ul v-if="citations.length" class="citation-list">
              <li v-for="(citation, index) in citations" :key="`${citationLabel(citation)}-${index}`">
                {{ citationLabel(citation) }}
              </li>
            </ul>
            <em v-else>无引用数据</em>
          </div>
        </section>

        <section class="detail-section">
          <div class="section-title">链路事件</div>
          <el-timeline>
            <el-timeline-item
              v-for="event in selectedTrace.events"
              :key="`${event.sequenceNo}-${event.eventName}`"
              :timestamp="event.createdAt"
              placement="top"
            >
              <div class="event-header">
                <strong>{{ event.sequenceNo }}. {{ event.eventType }}/{{ event.eventName }}</strong>
                <span>{{ statusLabel(event.status) }} · {{ event.elapsedMs ?? '-' }}ms</span>
              </div>
              <el-collapse>
                <el-collapse-item title="原始 detailJson" :name="String(event.sequenceNo)">
                  <pre>{{ prettyJson(event.detailJson) }}</pre>
                </el-collapse-item>
              </el-collapse>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="!selectedTrace.events.length" description="暂无链路事件" />
        </section>

        <section class="detail-section">
          <div class="section-title">原始 JSON</div>
          <el-collapse>
            <el-collapse-item title="toolNamesJson" name="tools">
              <pre>{{ prettyJson(selectedTrace.toolNamesJson) }}</pre>
            </el-collapse-item>
            <el-collapse-item title="citationsJson" name="citations">
              <pre>{{ prettyJson(selectedTrace.citationsJson) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Refresh, Search, View } from '@element-plus/icons-vue'
import { aiChatTraceApi } from '@/api'
import type { AiChatTraceDetail, AiChatTraceListItem, PageResult } from '@/types'

type TracePage = PageResult<AiChatTraceListItem> & {
  records?: AiChatTraceListItem[]
  pageNo?: number
}

type CitationView = {
  type?: string
  id?: string
  title?: string
  source?: string
  path?: string
}

const traces = ref<AiChatTraceListItem[]>([])
const selectedTrace = ref<AiChatTraceDetail | null>(null)
const loading = ref(false)
const detailLoading = ref(false)
const detailVisible = ref(false)
const total = ref(0)

const filters = reactive({
  keyword: '',
  status: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const okCount = computed(() => traces.value.filter((trace) => trace.status === 'ok').length)
const abnormalCount = computed(
  () => traces.value.filter((trace) => !['ok', 'started'].includes(trace.status)).length,
)
const averageLatency = computed(() => {
  const values = traces.value
    .map((trace) => trace.latencyMs)
    .filter((value): value is number => typeof value === 'number')
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
})
const citations = computed(() =>
  parseJson<CitationView[]>(selectedTrace.value?.citationsJson, []).filter(Boolean),
)

watch(
  () => filters.status,
  () => {
    pagination.page = 1
    loadTraces()
  },
)

onMounted(() => {
  loadTraces()
})

const loadTraces = async () => {
  loading.value = true
  try {
    const page = (await aiChatTraceApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword.trim() || undefined,
      status: filters.status || undefined,
    })) as TracePage
    traces.value = page.records || page.list || []
    total.value = page.total || traces.value.length
    pagination.page = page.pageNo || page.page || pagination.page
    pagination.pageSize = page.pageSize || pagination.pageSize
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadTraces()
}

const handleSizeChange = () => {
  pagination.page = 1
  loadTraces()
}

const openDetail = async (row: AiChatTraceListItem) => {
  detailVisible.value = true
  detailLoading.value = true
  selectedTrace.value = null
  try {
    selectedTrace.value = await aiChatTraceApi.detail(row.traceId)
  } finally {
    detailLoading.value = false
  }
}

const toolNames = (raw?: string) => parseJson<string[]>(raw, [])

const parseJson = <T,>(raw: string | undefined, fallback: T): T => {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const prettyJson = (raw?: string) => {
  if (!raw) return '-'
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

const statusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    ok: '成功',
    started: '进行中',
    error: '失败',
    model_unconfigured: '模型未配置',
    model_offline: '模型离线',
    model_config_invalid: '配置异常',
  }
  return status ? labels[status] || status : '-'
}

const statusTagType = (status?: string): 'success' | 'warning' | 'info' | 'danger' => {
  if (status === 'ok') return 'success'
  if (status === 'started') return 'info'
  if (status?.startsWith('model_')) return 'warning'
  return 'danger'
}

const entityText = (trace: AiChatTraceDetail) => {
  if (!trace.entityType && !trace.entityId) return '-'
  return [trace.entityType, trace.entityId].filter(Boolean).join(' / ')
}

const citationLabel = (citation: CitationView) =>
  [citation.type || citation.source, citation.title || citation.id, citation.path]
    .filter(Boolean)
    .join(' / ')
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.ai-log-page {
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  .page-title {
    color: $iris-text-primary;
    font-size: 26px;
    font-weight: 700;
  }

  .page-subtitle {
    margin-top: 8px;
    color: $iris-text-secondary;
  }
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid oklch(91% 0.012 235);
  border-radius: 8px;
  background: oklch(91% 0.012 235);

  div {
    padding: 16px 18px;
    background: oklch(98% 0.004 235);
  }

  span {
    display: block;
    margin-bottom: 8px;
    color: $iris-text-secondary;
    font-size: 13px;
  }

  strong {
    display: block;
    overflow: hidden;
    color: $iris-text-primary;
    font-size: 22px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.toolbar {
  margin-bottom: 14px;
  padding: 16px 18px 0;
  border: 1px solid oklch(91% 0.012 235);
  border-radius: 8px;
  background: oklch(98% 0.004 235);
}

.table-shell {
  border: 1px solid oklch(91% 0.012 235);
  border-radius: 8px;
  background: oklch(98% 0.004 235);
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 14px 16px;
}

.question-text {
  color: $iris-text-primary;
  font-weight: 600;
}

.tag-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.muted,
.detail-row em {
  color: $iris-text-secondary;
  font-style: normal;
}

.trace-detail {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-section {
  padding-bottom: 18px;
  border-bottom: 1px solid oklch(91% 0.012 235);
}

.section-title {
  margin-bottom: 12px;
  color: $iris-text-primary;
  font-size: 15px;
  font-weight: 700;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
  margin: 0 0 14px;

  div {
    min-width: 0;
  }

  dt {
    margin-bottom: 4px;
    color: $iris-text-secondary;
    font-size: 12px;
  }

  dd {
    overflow-wrap: anywhere;
    margin: 0;
    color: $iris-text-primary;
  }
}

.qa-block {
  margin-top: 12px;

  span {
    display: block;
    margin-bottom: 6px;
    color: $iris-text-secondary;
    font-size: 12px;
  }

  p {
    margin: 0;
    padding: 10px 12px;
    border: 1px solid oklch(91% 0.012 235);
    border-radius: 8px;
    background: oklch(98% 0.004 235);
    color: $iris-text-primary;
    line-height: 1.65;
    white-space: pre-wrap;
  }
}

.detail-row {
  display: grid;
  grid-template-columns: 68px 1fr;
  gap: 12px;
  align-items: flex-start;
  margin-top: 12px;

  > span {
    color: $iris-text-secondary;
    font-size: 12px;
  }
}

.citation-list {
  margin: 0;
  padding-left: 18px;
  color: $iris-text-primary;

  li + li {
    margin-top: 6px;
  }
}

.event-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  strong {
    color: $iris-text-primary;
  }

  span {
    color: $iris-text-secondary;
    font-size: 12px;
  }
}

.mono,
pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

pre {
  overflow: auto;
  max-height: 360px;
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: oklch(97% 0.006 235);
  color: oklch(31% 0.018 235);
  font-size: 12px;
  line-height: 1.55;
}

@media (max-width: 900px) {
  .ai-log-page .page-header {
    flex-direction: column;
  }

  .summary-strip,
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .summary-strip,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-row {
    grid-template-columns: 1fr;
  }
}
</style>
