<template>
  <div class="page-container iris-page">
    <div class="create-header">
      <div class="header-left">
        <el-button link :icon="Back" @click="router.push('/plan/list')">返回列表</el-button>
        <h2 class="page-title">计划详情</h2>
      </div>
      <div class="header-right">
        <el-tag :type="statusType(plan?.status)" effect="dark" size="large">{{
          statusLabel(plan?.status)
        }}</el-tag>
      </div>
    </div>

    <template v-if="plan">
      <!-- Basic Info -->
      <el-card shadow="never" class="detail-card">
        <template #header>
          <div class="card-title">
            <el-icon class="title-icon"><Document /></el-icon>
            <span>基本信息</span>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="计划编号">
            <el-tag effect="plain" type="info" class="font-mono">{{ plan.code }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="计划名称" :span="2">{{ plan.name }}</el-descriptions-item>
          <el-descriptions-item label="所属年度">{{ plan.year }}</el-descriptions-item>
          <el-descriptions-item label="属期">{{ plan.period }}</el-descriptions-item>
          <el-descriptions-item label="频次">{{ cycleLabel }}</el-descriptions-item>
          <el-descriptions-item label="计划说明" :span="3">
            {{ plan.description || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ plan.createdBy }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ plan.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ plan.updatedAt }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- Plan Items -->
      <el-card shadow="never" class="detail-card" style="margin-top: 24px">
        <template #header>
          <div class="card-title">
            <el-icon class="title-icon"><List /></el-icon>
            <span>检查范围</span>
            <el-tag effect="light" round size="small" class="count-tag"
              >{{ plan.items.length }} 项</el-tag
            >
          </div>
        </template>

        <el-table :data="plan.items" border stripe size="default" style="width: 100%">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="targetScope" label="检查范围" min-width="200" />
          <el-table-column label="关联清单" min-width="220">
            <template #default="{ row }">
              <el-tag
                v-for="clId in row.checklistIds"
                :key="clId"
                size="small"
                effect="plain"
                style="margin: 2px 4px 2px 0"
                >{{ getChecklistName(clId) }}</el-tag
              >
            </template>
          </el-table-column>
          <el-table-column label="计划时间" width="220">
            <template #default="{ row }">
              {{ row.plannedStartDate }} ~ {{ row.plannedEndDate }}
            </template>
          </el-table-column>
          <el-table-column label="负责人" width="140">
            <template #default="{ row }">
              {{ row.assignee ? getPersonnelName(row.assignee) : '—' }}
            </template>
          </el-table-column>
          <el-table-column label="备注" width="200">
            <template #default="{ row }">
              {{ row.remark || '—' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <el-empty v-else description="未找到该计划" :image-size="120" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back, Document, List } from '@element-plus/icons-vue'
import { mockPlans, mockChecklists, mockPersonnel } from '@/mock'

const route = useRoute()
const router = useRouter()

const plan = computed(() => mockPlans.find((p) => p.id === route.params.id))

const cycleLabel = computed(() => {
  const map: Record<string, string> = {
    yearly: '年度',
    'half-yearly': '半年度',
    quarterly: '季度',
    monthly: '月度',
  }
  return map[plan.value?.cycle || ''] || ''
})

const statusType = (val?: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    pending: 'warning',
    approved: 'primary',
    in_progress: 'success',
    completed: 'info',
  }
  return (map[val || ''] || 'info') as any
}

const statusLabel = (val?: string) => {
  const map: Record<string, string> = {
    draft: '编制中',
    pending: '审批中',
    approved: '待启动',
    in_progress: '进行中',
    completed: '已完成',
  }
  return map[val || ''] || val || ''
}

const getChecklistName = (id: string) => mockChecklists.find((c) => c.id === id)?.name || id

const getPersonnelName = (id: string) => mockPersonnel.find((p) => p.id === id)?.name || id
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: $iris-text-primary;
    margin: 0;
  }
}

.detail-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: $iris-text-primary;

    .title-icon {
      color: $iris-primary;
      font-size: 20px;
    }

    .count-tag {
      margin-left: auto;
    }
  }
}
</style>
