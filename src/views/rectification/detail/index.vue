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
      <el-timeline v-if="rectification?.logs.length">
        <el-timeline-item
          v-for="log in [...rectification.logs].reverse()"
          :key="log.id"
          :timestamp="log.createdAt"
          placement="top"
        >
          <div class="log-card">
            <strong>{{ log.action }}</strong>
            <p>{{ log.operatorName }}</p>
            <p v-if="log.remark" class="log-remark">{{ log.remark }}</p>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="办理过程暂无记录" :image-size="120" />

      <div class="actions" style="margin-top: 24px; text-align: right">
        <el-button
          type="primary"
          size="large"
          class="shadow-btn"
          @click="dialogVisible = true"
          :disabled="rectification?.status === 'approved'"
        >
          提交整改反馈
        </el-button>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="提交整改反馈" width="560px">
      <el-input
        v-model="feedback"
        type="textarea"
        :rows="5"
        maxlength="300"
        show-word-limit
        placeholder="请输入整改措施、落实情况和附件说明"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFeedback">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import { rectificationApi } from '@/api'
import type { RectificationOrder } from '@/types'

const route = useRoute()
const rectification = ref<RectificationOrder>()
const dialogVisible = ref(false)
const feedback = ref('')

onMounted(async () => {
  const id = route.params.id as string
  rectification.value = await rectificationApi.detail(id)
})

const submitFeedback = async () => {
  if (!rectification.value) return
  if (!feedback.value.trim()) {
    ElMessage.warning('请输入整改反馈内容')
    return
  }

  rectification.value = await rectificationApi.submit(rectification.value.id)
  feedback.value = ''
  dialogVisible.value = false
  ElMessage.success('整改反馈已提交')
}

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

.log-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid $iris-border-light;

  p {
    margin-top: 6px;
    color: $iris-text-secondary;
  }
}

.log-remark {
  line-height: 1.7;
}
</style>
