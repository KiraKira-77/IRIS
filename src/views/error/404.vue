<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <p class="error-message">抱歉，您访问的页面不存在</p>
      <el-button type="primary" size="large" @click="$router.push('/')"> 返回首页 </el-button>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.not-found-content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 800;
  color: #dcdfe6;
  line-height: 1;
  margin-bottom: 16px;
}

.error-message {
  font-size: 18px;
  color: #909399;
  margin-bottom: 32px;
}
</style>
