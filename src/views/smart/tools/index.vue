<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">工具库</h2>
        <p class="page-subtitle">聚合整改、合规分析和权限比对的智能辅助工具</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleCreate">接入工具</el-button>
    </div>

    <div class="summary-grid">
      <div class="summary-card">
        <span>可用工具</span>
        <strong>{{ availableCount }}</strong>
      </div>
      <div class="summary-card">
        <span>月调用量</span>
        <strong>{{ monthlyCalls }}</strong>
      </div>
      <div class="summary-card">
        <span>平均耗时</span>
        <strong>{{ averageDuration }}</strong>
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
          >
            <el-option label="可用" value="available" />
            <el-option label="不可用" value="unavailable" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="filters.type" clearable placeholder="分析 / 合规 / 报告" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="filters.keyword" clearable placeholder="输入工具名关键字" />
        </el-form-item>
      </el-form>
    </div>

    <div class="tool-grid">
      <div v-for="tool in filteredTools" :key="tool.id" class="iris-card tool-card">
        <div class="tool-head">
          <div>
            <div class="tool-name">{{ tool.name }}</div>
            <div class="tool-type">{{ tool.type }}</div>
          </div>
          <el-tag :type="tool.status === 'available' ? 'success' : 'danger'" effect="dark" round>
            {{ tool.status === 'available' ? '可用' : '不可用' }}
          </el-tag>
        </div>

        <p class="tool-description">{{ tool.description }}</p>

        <div class="endpoint-box">{{ tool.endpoint }}</div>

        <div class="meta-grid">
          <div class="meta-item">
            <span>负责人</span>
            <strong>{{ String(tool.config?.owner || '未配置') }}</strong>
          </div>
          <div class="meta-item">
            <span>平均耗时</span>
            <strong>{{ String(tool.config?.avgDuration || '--') }}</strong>
          </div>
          <div class="meta-item">
            <span>月调用量</span>
            <strong>{{ String(tool.config?.monthlyCalls || 0) }}</strong>
          </div>
          <div class="meta-item">
            <span>接入方式</span>
            <strong>{{ tool.status === 'available' ? '已上线' : '待巡检' }}</strong>
          </div>
        </div>

        <div class="tool-actions">
          <el-button type="primary" plain @click="handleInvoke(tool.name)">模拟调用</el-button>
          <el-button @click="handleCopy(tool.endpoint)">复制接口</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { mockTools } from '@/mock/advanced'

const tools = ref(mockTools.map((tool) => ({ ...tool, config: { ...tool.config } })))
const filters = reactive({
  status: '',
  type: '',
  keyword: '',
})

const filteredTools = computed(() =>
  tools.value.filter((tool) => {
    if (filters.status && tool.status !== filters.status) return false
    if (filters.type && !tool.type.toLowerCase().includes(filters.type.trim().toLowerCase())) {
      return false
    }
    if (filters.keyword && !tool.name.toLowerCase().includes(filters.keyword.trim().toLowerCase())) {
      return false
    }
    return true
  }),
)

const availableCount = computed(() => tools.value.filter((tool) => tool.status === 'available').length)
const unavailableCount = computed(() => tools.value.length - availableCount.value)
const monthlyCalls = computed(() =>
  tools.value.reduce((sum, tool) => sum + Number(tool.config?.monthlyCalls || 0), 0),
)
const averageDuration = computed(() => {
  const durations = tools.value
    .map((tool) => Number(String(tool.config?.avgDuration || '0').replace('s', '')))
    .filter((value) => !Number.isNaN(value) && value > 0)
  if (durations.length === 0) return '--'
  return `${Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)}s`
})

const handleCreate = () => {
  ElMessage.info('当前先补齐工具运行概览，接入配置表单可后续补充')
}

const handleInvoke = (toolName: string) => {
  ElMessage.success(`${toolName} 已发起一次模拟调用`)
}

const handleCopy = async (endpoint: string) => {
  try {
    await navigator.clipboard.writeText(endpoint)
    ElMessage.success('接口地址已复制')
  } catch {
    ElMessage.warning('当前环境不支持自动复制')
  }
}
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
  border-radius: 16px;
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
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
  text-transform: capitalize;
}

.tool-description {
  line-height: 1.7;
  color: $iris-text-secondary;
}

.endpoint-box {
  padding: 12px 14px;
  border-radius: 12px;
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
  border-radius: 12px;
  background: $iris-bg;

  span {
    display: block;
    margin-bottom: 6px;
    color: $iris-text-muted;
  }

  strong {
    color: $iris-text-primary;
  }
}

.tool-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}
</style>
