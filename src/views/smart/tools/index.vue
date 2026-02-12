<template>
  <div class="page-container iris-page">
    <div class="iris-card page-content">
      <div class="page-header">
        <h2 class="page-title">工具库</h2>
      </div>
      <el-empty description="内控辅助工具集开发中..." :image-size="200" />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  margin-bottom: 24px;
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: $iris-text-primary;
  }
}
</style>
