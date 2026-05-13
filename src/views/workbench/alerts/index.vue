<template>
  <div class="page-container iris-page">
    <div v-loading="loading" class="iris-card page-content">
      <div class="page-header">
        <div class="left">
          <h2 class="page-title">告警中心</h2>
          <span class="page-subtitle">系统运行状态与异常事件监控</span>
        </div>
      </div>

      <!-- 搜索 -->
      <div class="search-bar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="级别">
            <el-select v-model="searchForm.level" placeholder="全部" clearable style="width: 140px">
              <el-option label="严重" value="critical" />
              <el-option label="警告" value="warning" />
              <el-option label="信息" value="info" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" :loading="loading" @click="loadAlerts">
              查询
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-timeline style="padding: 20px">
        <el-timeline-item
          v-for="(alert, index) in tableData"
          :key="alert.id || index"
          :type="levelType(alert.level)"
          :timestamp="alert.timestamp"
          placement="top"
        >
          <div class="alert-card">
            <div class="alert-header">
              <span class="alert-title">{{ alert.title }}</span>
              <el-tag :type="levelType(alert.level)" size="small" effect="dark">{{
                levelLabel(alert.level)
              }}</el-tag>
            </div>
            <div class="alert-content">{{ alert.content }}</div>
            <div class="alert-source">来源: {{ alert.source }}</div>
            <div class="alert-footer" v-if="!alert.acknowledged">
              <el-button type="primary" link size="small" @click="handleAcknowledge(alert)">
                标记已读
              </el-button>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { alertApi } from '@/api'
import type { AlertEvent } from '@/types'

type BackendAlertPage = {
  records?: AlertEvent[]
  list?: AlertEvent[]
  total?: number
  pageNo?: number
  page?: number
  pageSize?: number
}

const searchForm = reactive({ level: '' })
const loading = ref(false)
const tableData = ref<AlertEvent[]>([])

const loadAlerts = async () => {
  loading.value = true
  try {
    const page = (await alertApi.list({
      page: 1,
      pageSize: 100,
      level: searchForm.level || undefined,
    })) as BackendAlertPage
    tableData.value = page.records || page.list || []
  } finally {
    loading.value = false
  }
}

const handleAcknowledge = async (alert: AlertEvent) => {
  await alertApi.acknowledge(alert.id)
  alert.acknowledged = true
  ElMessage.success('已标记为已读')
}

const levelType = (val: string) => {
  const map: Record<string, string> = { critical: 'danger', warning: 'warning', info: 'primary' }
  return map[val] || 'info'
}
const levelLabel = (val: string) => {
  const map: Record<string, string> = { critical: '严重', warning: '警告', info: '信息' }
  return map[val] || val
}

onMounted(loadAlerts)
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: $iris-text-primary;
    margin-bottom: 4px;
  }
}

.search-bar {
  background: $iris-bg;
  padding: 16px 16px 0;
  border-radius: $iris-border-radius;
  margin-bottom: 20px;
}

.alert-card {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid $iris-border-light;
  .alert-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .alert-title {
    font-weight: 600;
    color: $iris-text-primary;
  }
  .alert-content {
    color: $iris-text-secondary;
    margin-bottom: 8px;
    font-size: 13px;
  }
  .alert-source {
    color: $iris-text-muted;
    font-size: 12px;
  }
  .alert-footer {
    margin-top: 12px;
    border-top: 1px solid #eee;
    padding-top: 8px;
    text-align: right;
  }
}
</style>
