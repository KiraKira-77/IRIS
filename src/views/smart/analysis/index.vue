<template>
  <div class="page-container iris-page">
    <div class="iris-card page-content">
      <div class="page-header">
        <h2 class="page-title">统计分析</h2>
        <el-date-picker type="year" placeholder="2026" style="width: 120px" />
      </div>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-box">
            <h3>内控缺陷分布</h3>
            <el-empty description="饼图占位" />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-box">
            <h3>整改完成率趋势</h3>
            <el-empty description="折线图占位" />
          </div>
        </el-col>
      </el-row>
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
  }
}
.chart-box {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  height: 400px;
  h3 {
    margin-bottom: 20px;
    text-align: center;
  }
}
</style>
