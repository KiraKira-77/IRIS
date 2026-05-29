<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">工具库</h2>
        <p class="page-subtitle">查看 AI 对话当前可调用的业务数据工具</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadTools">刷新</el-button>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span>可用工具</span>
        <strong>{{ availableCount }}</strong>
      </div>
      <div class="summary-card">
        <span>业务域</span>
        <strong>{{ toolTypes.length }}</strong>
      </div>
      <div class="summary-card">
        <span>调用入口</span>
        <strong>{{ endpoints.length }}</strong>
      </div>
      <div class="summary-card">
        <span>停用中</span>
        <strong>{{ unavailableCount }}</strong>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部状态"
            style="width: 140px"
            @change="loadTools"
          >
            <el-option label="可用" value="available" />
            <el-option label="不可用" value="unavailable" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务域">
          <el-select
            v-model="filters.type"
            clearable
            placeholder="全部业务域"
            style="width: 160px"
            @change="loadTools"
          >
            <el-option v-for="type in toolTypes" :key="type" :label="toolTypeLabel(type)" :value="type" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="输入工具名或能力关键字"
            @keyup.enter="loadTools"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadTools">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="tool-grid" v-loading="loading">
      <div v-for="tool in tools" :key="tool.id" class="iris-card tool-card">
        <div class="tool-head">
          <div>
            <div class="tool-name">{{ tool.name }}</div>
            <div class="tool-type">{{ toolTypeLabel(tool.type) }}</div>
          </div>
          <el-tag :type="tool.status === 'available' ? 'success' : 'danger'" effect="dark" round>
            {{ tool.status === 'available' ? '可用' : '不可用' }}
          </el-tag>
        </div>

        <p class="tool-description">{{ tool.description }}</p>

        <div class="endpoint-box">{{ tool.endpoint }}</div>

        <div class="meta-grid">
          <div class="meta-item">
            <span>接入位置</span>
            <strong>{{ String(tool.config?.owner || 'AI Chat') }}</strong>
          </div>
          <div class="meta-item">
            <span>调用方式</span>
            <strong>{{ invocationModeLabel(tool.config?.invocationMode) }}</strong>
          </div>
          <div class="meta-item">
            <span>匹配词组</span>
            <strong>{{ keywordGroupCount(tool) }}</strong>
          </div>
          <div class="meta-item">
            <span>工具标识</span>
            <strong>{{ tool.id }}</strong>
          </div>
        </div>

        <div class="tool-actions">
          <el-button type="primary" plain @click="handleCopy(tool.name)">复制工具名</el-button>
          <el-button @click="handleCopy(tool.endpoint)">复制入口</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="!loading && tools.length === 0" description="暂无工具" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { toolApi } from '@/api'
import type { Tool } from '@/types'

type BackendPage<T> = {
  records?: T[]
  list?: T[]
  total?: number
}

const tools = ref<Tool[]>([])
const loading = ref(false)
const filters = reactive({
  status: '',
  type: '',
  keyword: '',
})

const availableCount = computed(() => tools.value.filter((tool) => tool.status === 'available').length)
const unavailableCount = computed(() => tools.value.length - availableCount.value)
const toolTypes = computed(() => Array.from(new Set(tools.value.map((tool) => tool.type).filter(Boolean))))
const endpoints = computed(() =>
  Array.from(new Set(tools.value.map((tool) => tool.endpoint).filter(Boolean))),
)

const loadTools = async () => {
  loading.value = true
  try {
    const page = (await toolApi.list({
      page: 1,
      pageSize: 100,
      status: filters.status || undefined,
      type: filters.type || undefined,
      keyword: filters.keyword || undefined,
    })) as BackendPage<Tool>
    tools.value = page.records || page.list || []
  } finally {
    loading.value = false
  }
}

const toolTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    project: '项目数据',
    model: '模型配置',
    rectification: '整改工单',
    plan: '计划数据',
    standard: '标准文档',
    workbench: '工作台',
    rule: '规则库',
    checklist: '检查清单',
    external_api_log: '接口日志',
    business: '业务数据',
  }
  return map[type] || type
}

const invocationModeLabel = (mode: unknown) =>
  mode === 'ai_chat_context' ? 'AI 对话上下文' : String(mode || '系统调用')

const keywordGroupCount = (tool: Tool) => {
  const groups = tool.config?.keywordGroups
  return Array.isArray(groups) ? `${groups.length} 组` : '未配置'
}

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('当前环境不支持自动复制')
  }
}

onMounted(loadTools)
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
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

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  min-height: 220px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tool-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.tool-name {
  font-size: 18px;
  font-weight: 700;
  color: $iris-text-primary;
}

.tool-type {
  margin-top: 4px;
  color: $iris-text-secondary;
}

.tool-description {
  line-height: 1.7;
  color: $iris-text-secondary;
}

.endpoint-box {
  padding: 12px 14px;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  font-family: monospace;
  word-break: break-all;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  padding: 14px;
  border-radius: 8px;
  background: $iris-bg;

  span {
    display: block;
    margin-bottom: 6px;
    color: $iris-text-muted;
  }

  strong {
    overflow-wrap: anywhere;
    color: $iris-text-primary;
  }
}

.tool-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
