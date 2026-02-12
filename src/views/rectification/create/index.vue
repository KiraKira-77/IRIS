<template>
  <div class="page-container iris-page">
    <div class="iris-card page-content">
      <div class="page-header">
        <div class="left">
          <el-button link :icon="Back" @click="$router.push('/rectification/list')"
            >返回列表中</el-button
          >
          <h2 class="page-title" style="display: inline-block; margin-left: 12px">新建整改任务</h2>
        </div>
      </div>

      <el-empty description="整改单表单开发中..." :image-size="200" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Back } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  margin-bottom: 32px;
  border-bottom: 1px solid $iris-border-light;
  padding-bottom: 16px;
  .page-title {
    font-size: 18px;
    font-weight: 600;
    color: $iris-text-primary;
    vertical-align: middle;
  }
}
</style>
