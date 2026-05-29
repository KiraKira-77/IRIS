<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">规则库管理</h2>
        <p class="page-subtitle">统一管理异常识别规则、调度策略和最近执行结果</p>
      </div>
      <el-button type="primary" :icon="Refresh" :loading="loading" @click="loadRules">刷新规则</el-button>
    </div>

    <div class="overview-grid">
      <div class="overview-card">
        <span>启用规则</span>
        <strong>{{ activeCount }}</strong>
      </div>
      <div class="overview-card">
        <span>定时规则</span>
        <strong>{{ scheduledCount }}</strong>
      </div>
      <div class="overview-card">
        <span>今日成功率</span>
        <strong>{{ successRate }}%</strong>
      </div>
      <div class="overview-card">
        <span>最近失败</span>
        <strong>{{ failureCount }}</strong>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键字">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="规则名 / 分类 / 表达式"
            @keyup.enter="loadRules"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部状态"
            style="width: 140px"
            @change="loadRules"
          >
            <el-option label="启用" value="active" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发方式">
          <el-select
            v-model="filters.triggerType"
            clearable
            placeholder="全部方式"
            style="width: 140px"
            @change="loadRules"
          >
            <el-option label="定时" value="scheduled" />
            <el-option label="手工" value="manual" />
            <el-option label="事件" value="event" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" @click="loadRules">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="iris-card">
      <el-table v-loading="loading" :data="rules" size="large" row-key="id">
        <el-table-column label="规则信息" min-width="260">
          <template #default="{ row }">
            <div class="rule-meta">
              <div class="rule-name">{{ row.name }}</div>
              <div class="rule-desc">{{ row.description }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column label="表达式" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="rule-expression">{{ row.expression }}</code>
          </template>
        </el-table-column>
        <el-table-column label="触发方式" width="130">
          <template #default="{ row }">
            <el-tag :type="triggerType(row.triggerType)" effect="light" round>
              {{ triggerLabel(row.triggerType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近执行" width="180">
          <template #default="{ row }">
            <div>{{ row.lastRunAt || '未执行' }}</div>
            <span class="muted-text">{{ latestExecutionText(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 'active'"
              inline-prompt
              active-text="开"
              inactive-text="关"
              disabled
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openExecutionDrawer(row.id)">执行日志</el-button>
            <el-button link type="success" :loading="runningRuleId === row.id" @click="runRule(row.id)">
              立即运行
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="drawerVisible" title="规则执行日志" size="520px">
      <template v-if="selectedRule">
        <div class="drawer-header">
          <h3>{{ selectedRule.name }}</h3>
          <el-tag :type="statusTagType(selectedRule.status)" effect="dark">
            {{ selectedRule.status === 'active' ? '启用中' : '已停用' }}
          </el-tag>
        </div>
        <p class="drawer-desc">{{ selectedRule.description }}</p>

        <div class="execution-list">
          <div
            v-for="log in selectedRule.executionLogs"
            :key="log.id"
            class="execution-item"
            :class="log.status"
          >
            <div class="execution-top">
              <strong>{{ log.executedAt }}</strong>
              <el-tag :type="log.status === 'success' ? 'success' : 'danger'" size="small">
                {{ log.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </div>
            <p>{{ log.result || '无返回详情' }}</p>
            <span class="muted-text">耗时 {{ log.duration || 0 }}s</span>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { ruleApi } from '@/api'
import type { Rule } from '@/types'

type RulePage = {
  records?: Rule[]
  list?: Rule[]
  total?: number
  pageNo?: number
  page?: number
  pageSize?: number
}

const rules = ref<Rule[]>([])
const loading = ref(false)
const runningRuleId = ref('')

const filters = reactive({
  keyword: '',
  status: '',
  triggerType: '',
})

const drawerVisible = ref(false)
const selectedRuleId = ref('')

const selectedRule = computed(() =>
  rules.value.find((rule) => rule.id === selectedRuleId.value) || rules.value[0],
)

const activeCount = computed(() => rules.value.filter((rule) => rule.status === 'active').length)
const scheduledCount = computed(
  () => rules.value.filter((rule) => rule.triggerType === 'scheduled').length,
)
const allExecutions = computed(() => rules.value.flatMap((rule) => rule.executionLogs))
const successExecutions = computed(
  () => allExecutions.value.filter((log) => log.status === 'success').length,
)
const failureCount = computed(() => allExecutions.value.length - successExecutions.value)
const successRate = computed(() => {
  if (allExecutions.value.length === 0) return 0
  return Math.round((successExecutions.value / allExecutions.value.length) * 100)
})

onMounted(() => {
  loadRules()
})

const loadRules = async () => {
  loading.value = true
  try {
    const page = (await ruleApi.list({
      page: 1,
      pageSize: 50,
      keyword: filters.keyword.trim() || undefined,
      status: filters.status || undefined,
      triggerType: filters.triggerType || undefined,
    })) as RulePage
    rules.value = page.records || page.list || []
    if (selectedRuleId.value && !rules.value.some((rule) => rule.id === selectedRuleId.value)) {
      selectedRuleId.value = ''
    }
  } finally {
    loading.value = false
  }
}

const openExecutionDrawer = (ruleId: string) => {
  selectedRuleId.value = ruleId
  drawerVisible.value = true
}

const runRule = async (ruleId: string) => {
  runningRuleId.value = ruleId
  try {
    const updatedRule = await ruleApi.execute(ruleId)
    rules.value = rules.value.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule))
    selectedRuleId.value = updatedRule.id
    ElMessage.success(`${updatedRule.name} 已完成实时计算`)
  } finally {
    runningRuleId.value = ''
  }
}

const triggerLabel = (type: string) => {
  const map: Record<string, string> = {
    scheduled: '定时触发',
    manual: '手工触发',
    event: '事件触发',
  }
  return map[type] || type
}

const triggerType = (type: string) => {
  const map: Record<string, string> = {
    scheduled: 'primary',
    manual: 'success',
    event: 'warning',
  }
  return map[type] || 'info'
}

const latestExecutionText = (rule: Rule) => {
  const latest = rule.executionLogs[0]
  if (!latest) return '暂无执行记录'
  return `${latest.status === 'success' ? '最近成功' : '最近失败'} · ${latest.duration || 0}s`
}

const statusTagType = (status: string) => (status === 'active' ? 'success' : 'info')
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

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  padding: 18px 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fff 0%, #eff6ff 100%);
  box-shadow: $iris-shadow-card;

  span {
    display: block;
    color: $iris-text-secondary;
    margin-bottom: 8px;
  }

  strong {
    font-size: 28px;
    color: $iris-text-primary;
  }
}

.rule-meta {
  .rule-name {
    font-weight: 600;
    color: $iris-text-primary;
  }

  .rule-desc {
    margin-top: 6px;
    color: $iris-text-secondary;
    line-height: 1.6;
  }
}

.rule-expression {
  display: block;
  padding: 10px 12px;
  border-radius: 10px;
  background: #0f172a;
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.6;
}

.muted-text {
  color: $iris-text-muted;
  font-size: 12px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.drawer-desc {
  color: $iris-text-secondary;
  line-height: 1.7;
  margin-bottom: 20px;
}

.execution-list {
  display: grid;
  gap: 12px;
}

.execution-item {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid $iris-border;
  background: #fff;

  &.success {
    border-color: rgba(16, 185, 129, 0.18);
    background: rgba(16, 185, 129, 0.04);
  }

  &.failure {
    border-color: rgba(239, 68, 68, 0.16);
    background: rgba(239, 68, 68, 0.04);
  }

  p {
    margin: 10px 0 8px;
    line-height: 1.7;
    color: $iris-text-primary;
  }
}

.execution-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
