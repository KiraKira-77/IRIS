<template>
  <div class="page-container iris-page">
    <div class="iris-card page-content">
      <div class="page-header">
        <div class="left">
          <el-button link :icon="Back" @click="$router.push('/plan/list')">返回列表</el-button>
          <h2 class="page-title" style="display: inline-block; margin-left: 12px">新建内控计划</h2>
        </div>
      </div>

      <div class="form-container">
        <el-form :model="form" label-width="100px" style="max-width: 800px">
          <el-form-item label="计划名称">
            <el-input v-model="form.name" placeholder="例如：2026年半年度信息系统内控检查" />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="所属年度">
                <el-date-picker
                  v-model="form.year"
                  type="year"
                  placeholder="选择年度"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计划频次">
                <el-select v-model="form.cycle" placeholder="选择频次" style="width: 100%">
                  <el-option label="年度" value="yearly" />
                  <el-option label="半年度" value="half-yearly" />
                  <el-option label="季度" value="quarterly" />
                  <el-option label="月度" value="monthly" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="计划说明">
            <el-input v-model="form.description" type="textarea" :rows="4" />
          </el-form-item>

          <el-divider content-position="left">计划检查项</el-divider>

          <div class="plan-items">
            <el-empty description="暂未添加检查项，请从右侧库中选择添加" :image-size="100" />
            <div class="actions" style="text-align: center; margin-top: 16px">
              <el-button type="primary" plain :icon="Plus">添加检查范围</el-button>
            </div>
          </div>

          <el-form-item style="margin-top: 40px">
            <el-button type="primary" @click="handleSubmit">保存草稿</el-button>
            <el-button @click="$router.back()">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { Back, Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const form = reactive({
  name: '',
  year: '',
  cycle: '',
  description: '',
})

const handleSubmit = () => {
  ElMessage.success('保存成功')
  router.push('/plan/list')
}
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
