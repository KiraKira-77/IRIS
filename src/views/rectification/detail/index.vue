<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <el-button link :icon="Back" @click="$router.push('/rectification/list')"
          >返回列表</el-button
        >
        <div class="title-with-tag" style="margin-top: 8px">
          <h2 class="page-title">整改详情: {{ rectification?.code }}</h2>
          <el-tag :type="statusType(rectification?.status)" effect="dark" size="large" round>
            {{ statusLabel(rectification?.status) }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="iris-card info-card">
      <el-descriptions :column="3" border size="large">
        <el-descriptions-item label="标题" :span="3">
          <span style="font-weight: 600; font-size: 16px">{{ rectification?.title }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="3">{{
          rectification?.description
        }}</el-descriptions-item>
        <el-descriptions-item label="负责人">
          <div style="display: flex; align-items: center; gap: 8px">
            <el-avatar size="small" style="background: #3b82f6">{{
              rectification?.assigneeName?.charAt(0)
            }}</el-avatar>
            {{ rectification?.assigneeName }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="审核人">{{
          rectification?.reviewerName
        }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">
          <span style="color: #ef4444; font-weight: 600">{{ rectification?.deadline }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="iris-card action-card" style="margin-top: 24px">
      <h3 class="card-title">办理情况</h3>
      <el-empty description="办理过程暂无记录" :image-size="120" />

      <div class="actions" style="margin-top: 24px; text-align: right">
        <el-button type="primary" size="large" class="shadow-btn">提交整改反馈</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import { mockRectifications } from '@/mock'
import type { RectificationOrder } from '@/types'

const route = useRoute()
const rectification = ref<RectificationOrder>()

onMounted(() => {
  const id = route.params.id as string
  rectification.value = mockRectifications.find((r) => r.id === id) || mockRectifications[0]
})

const statusType = (val: string | undefined) => {
  const map: any = {
    pending: 'danger',
    in_progress: 'primary',
    submitted: 'warning',
    approved: 'success',
  }
  return map[val || ''] || 'info'
}
const statusLabel = (val: string | undefined) => {
  const map: any = {
    pending: '待整改',
    in_progress: '整改中',
    submitted: '已提交',
    approved: '已完成',
  }
  return map[val || ''] || val
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  margin-bottom: 24px;
  .title-with-tag {
    display: flex;
    align-items: center;
    gap: 16px;
    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: $iris-text-primary;
      margin: 0;
      letter-spacing: -0.5px;
    }
  }
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-left: 12px;
  border-left: 4px solid $iris-primary;
}
</style>
