<template>
  <div class="page-container iris-page">
    <div class="iris-card page-content">
      <div class="page-header">
        <div class="left">
          <h2 class="page-title">规则库管理</h2>
        </div>
        <div class="right">
          <el-button type="primary" :icon="Plus">新建规则</el-button>
        </div>
      </div>

      <el-empty description="规则引擎配置功能开发中..." :image-size="200" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
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
  }
}
</style>
