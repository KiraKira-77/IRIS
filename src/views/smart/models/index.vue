<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">模型库</h2>
        <p class="page-subtitle">查看智能能力接入状态、模型配置与服务健康度</p>
      </div>
      <el-button type="primary" :icon="Connection" @click="handleRegister">登记模型</el-button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span>在线模型</span>
        <strong>{{ onlineCount }}</strong>
      </div>
      <div class="stat-card">
        <span>LLM 模型</span>
        <strong>{{ llmCount }}</strong>
      </div>
      <div class="stat-card">
        <span>ML 模型</span>
        <strong>{{ mlCount }}</strong>
      </div>
      <div class="stat-card">
        <span>离线告警</span>
        <strong>{{ offlineCount }}</strong>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="类型">
          <el-select v-model="filters.type" clearable placeholder="全部类型" style="width: 140px">
            <el-option label="LLM" value="llm" />
            <el-option label="ML" value="ml" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部状态"
            style="width: 140px"
          >
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务商">
          <el-input v-model="filters.provider" clearable placeholder="输入服务商关键字" />
        </el-form-item>
      </el-form>
    </div>

    <div class="model-grid">
      <div v-for="model in filteredModels" :key="model.id" class="iris-card model-card">
        <div class="model-head">
          <div>
            <div class="model-name">{{ model.name }}</div>
            <div class="model-provider">{{ model.provider }}</div>
          </div>
          <el-tag :type="model.status === 'online' ? 'success' : 'danger'" effect="dark" round>
            {{ model.status === 'online' ? '在线' : '离线' }}
          </el-tag>
        </div>

        <p class="model-description">{{ model.description }}</p>

        <div class="pill-row">
          <el-tag :type="model.type === 'llm' ? 'primary' : 'warning'" effect="light" round>
            {{ model.type === 'llm' ? '大模型' : '机器学习' }}
          </el-tag>
          <el-tag effect="plain" round>{{ model.endpoint }}</el-tag>
        </div>

        <div class="config-list">
          <div v-for="item in configEntries(model.config)" :key="item.label" class="config-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>

        <div class="model-footer">
          <div class="latency">
            <span>近 24h 推理健康度</span>
            <el-progress
              :percentage="model.status === 'online' ? 98 : 42"
              :status="model.status === 'online' ? 'success' : 'exception'"
              :stroke-width="8"
            />
          </div>
          <div class="actions">
            <el-button link type="primary" @click="handlePing(model.name)">连通性检测</el-button>
            <el-button link type="success" @click="handleCopy(model.endpoint)">复制地址</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection } from '@element-plus/icons-vue'
import { mockModels } from '@/mock/advanced'

const models = ref(mockModels.map((model) => ({ ...model, config: { ...model.config } })))
const filters = reactive({
  type: '',
  status: '',
  provider: '',
})

const filteredModels = computed(() =>
  models.value.filter((model) => {
    if (filters.type && model.type !== filters.type) return false
    if (filters.status && model.status !== filters.status) return false
    if (
      filters.provider &&
      !model.provider.toLowerCase().includes(filters.provider.trim().toLowerCase())
    ) {
      return false
    }
    return true
  }),
)

const onlineCount = computed(() => models.value.filter((model) => model.status === 'online').length)
const offlineCount = computed(() => models.value.length - onlineCount.value)
const llmCount = computed(() => models.value.filter((model) => model.type === 'llm').length)
const mlCount = computed(() => models.value.filter((model) => model.type === 'ml').length)

const configEntries = (config?: Record<string, unknown>) =>
  Object.entries(config || {}).map(([label, value]) => ({
    label,
    value: String(value),
  }))

const handleRegister = () => {
  ElMessage.info('当前先补齐模型展示与巡检能力，登记表单可在后续接入')
}

const handlePing = (modelName: string) => {
  ElMessage.success(`${modelName} 连通性检查已触发`)
}

const handleCopy = async (endpoint: string) => {
  try {
    await navigator.clipboard.writeText(endpoint)
    ElMessage.success('模型地址已复制')
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 18px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff 0%, #ecfeff 100%);
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

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.model-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.model-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.model-name {
  font-size: 18px;
  font-weight: 700;
  color: $iris-text-primary;
}

.model-provider {
  margin-top: 4px;
  color: $iris-text-secondary;
}

.model-description {
  line-height: 1.7;
  color: $iris-text-secondary;
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.config-list {
  display: grid;
  gap: 10px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: $iris-bg;

  span {
    color: $iris-text-muted;
    text-transform: capitalize;
  }

  strong {
    color: $iris-text-primary;
    text-align: right;
  }
}

.model-footer {
  margin-top: auto;
}

.latency {
  span {
    display: block;
    margin-bottom: 10px;
    color: $iris-text-secondary;
  }
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}
</style>
