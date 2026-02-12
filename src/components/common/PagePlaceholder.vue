<template>
  <div class="page-placeholder iris-page">
    <div class="iris-card">
      <div class="placeholder-icon">
        <el-icon :size="64" color="#dcdfe6"><component :is="icon" /></el-icon>
      </div>
      <h2 class="placeholder-title">{{ title }}</h2>
      <p class="placeholder-desc">{{ description }}</p>
      <el-tag type="info" effect="plain">开发中</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  description: string
  icon: Component
}>()
</script>

<style lang="scss" scoped>
.page-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;

  .iris-card {
    text-align: center;
    padding: 60px 80px;
  }
}

.placeholder-icon {
  margin-bottom: 20px;
}

.placeholder-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.placeholder-desc {
  font-size: 14px;
  color: #909399;
  margin-bottom: 20px;
}
</style>
