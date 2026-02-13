<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">内控计划管理</h2>
        <span class="page-subtitle">制定和跟踪内控检查计划</span>
      </div>
      <div class="right">
        <el-button
          type="primary"
          :icon="Plus"
          size="large"
          @click="$router.push('/plan/create')"
          class="shadow-btn"
          >新建计划</el-button
        >
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="计划名称">
          <el-input v-model="searchForm.keyword" placeholder="输入关键字" clearable />
        </el-form-item>
        <el-form-item label="年度">
          <el-date-picker
            v-model="searchForm.year"
            type="year"
            placeholder="选择年度"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="编制中" value="draft" />
            <el-option label="审批中" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" style="width: 100%" size="large" stripe>
      <el-table-column prop="code" label="计划编号" width="160">
        <template #default="{ row }">
          <el-tag effect="plain" type="info" class="font-mono">{{ row.code }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="计划名称" min-width="240">
        <template #default="{ row }">
          <span style="font-weight: 600; color: #1e293b">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="period" label="属期" width="120">
        <template #default="{ row }">
          <el-tag effect="light" round>{{ row.year }}-{{ row.period }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="cycle" label="频次" width="100">
        <template #default="{ row }">
          {{ row.cycle === 'monthly' ? '月度' : row.cycle === 'quarterly' ? '季度' : '年度' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="dark" size="small">{{
            statusLabel(row.status)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="160" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="router.push(`/plan/detail/${row.id}`)"
            >详情</el-button
          >
          <el-button
            link
            type="primary"
            size="small"
            v-if="row.status === 'draft'"
            @click="router.push(`/plan/create?id=${row.id}`)"
            >编辑</el-button
          >
          <el-button link type="primary" size="small" v-if="row.status === 'draft'"
            >提交审批</el-button
          >
          <el-button link type="success" size="small" v-if="row.status === 'approved'"
            >生成项目</el-button
          >
          <el-button link type="danger" size="small" v-if="row.status === 'draft'">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search } from '@element-plus/icons-vue'
import { mockPlans } from '@/mock'

const router = useRouter()

const searchForm = reactive({ keyword: '', year: '', status: '' })
const tableData = ref(mockPlans)

const statusType = (val: string) => {
  const map: any = {
    draft: 'info',
    pending: 'warning',
    approved: 'primary',
    in_progress: 'success',
    completed: 'info',
  }
  return map[val] || 'info'
}
const statusLabel = (val: string) => {
  const map: any = {
    draft: '编制中',
    pending: '审批中',
    approved: '待启动',
    in_progress: '进行中',
    completed: '已完成',
  }
  return map[val] || val
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: $iris-text-primary;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }
}
</style>
