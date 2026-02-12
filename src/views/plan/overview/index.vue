<template>
  <div class="page-container iris-page">
    <div class="iris-card page-content">
      <div class="page-header">
        <div class="left">
          <h2 class="page-title">内控计划一览</h2>
          <span class="page-subtitle">全年计划甘特图与执行进度</span>
        </div>
      </div>

      <el-empty description="甘特图组件开发中..." :image-size="200" />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

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
  .page-subtitle {
    font-size: 13px;
    color: $iris-text-secondary;
  }
}
</style>
