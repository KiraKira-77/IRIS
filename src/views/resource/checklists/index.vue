<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">内控清单管理</h2>
        <span class="page-subtitle">管理标准化的检查清单与检查项</span>
      </div>
      <div class="right">
        <el-button type="primary" :icon="Plus" size="large" @click="openDialog()"
          >新建清单</el-button
        >
        <el-button :icon="Upload" size="large">导入模版</el-button>
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="清单名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="输入名称或编号"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <el-table
      :data="filteredData"
      style="width: 100%"
      size="large"
      row-key="id"
      :expand-row-keys="expandedKeys"
      @expand-change="handleExpandChange"
    >
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="checklist-detail">
            <div class="detail-header">
              <h4>检查项列表 ({{ row.items?.length || 0 }})</h4>
              <el-button type="primary" text :icon="Plus" size="small" @click="openItemDialog(row)"
                >添加检查项</el-button
              >
            </div>
            <el-table
              v-if="row.items?.length"
              :data="row.items"
              size="small"
              border
              style="width: 100%"
            >
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="content" label="检查内容" min-width="250">
                <template #default="{ row: item }">
                  <span style="font-weight: 500">{{ item.content }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="criterion"
                label="判断标准"
                min-width="250"
                show-overflow-tooltip
              />
              <el-table-column prop="method" label="检查方法" width="140" />
              <el-table-column prop="riskLevel" label="风险等级" width="100" align="center">
                <template #default="{ row: item }">
                  <el-tag :type="riskType(item.riskLevel)" size="small" effect="dark">{{
                    riskLabel(item.riskLevel)
                  }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default>
                  <el-button link type="primary" size="small">编辑</el-button>
                  <el-button link type="danger" size="small">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无检查项，点击上方按钮添加" :image-size="60" />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="清单编号" width="170">
        <template #default="{ row }">
          <el-tag effect="plain" type="info" class="font-mono">{{ row.code }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="清单名称" min-width="240">
        <template #default="{ row }">
          <span style="font-weight: 600; color: #1e293b">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="检查项数" width="110" align="center">
        <template #default="{ row }">
          <el-tag effect="light" round :type="row.items?.length > 0 ? 'primary' : 'info'"
            >{{ row.items?.length || 0 }} 项</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="140" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row._active"
            inline-prompt
            active-text="启用"
            inactive-text="停用"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="handleCopy(row)">复制</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑清单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingRow ? '编辑清单' : '新建清单'"
      width="560px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top" size="large">
        <el-form-item label="清单名称" required>
          <el-input v-model="form.name" placeholder="例如：资金活动内控检查清单" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="清单用途描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveChecklist">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加检查项弹窗 -->
    <el-dialog v-model="itemDialogVisible" title="添加检查项" width="640px" destroy-on-close>
      <el-form :model="itemForm" label-position="top" size="large">
        <el-form-item label="检查内容" required>
          <el-input
            v-model="itemForm.content"
            type="textarea"
            :rows="2"
            placeholder="详细描述检查内容"
          />
        </el-form-item>
        <el-form-item label="判断标准" required>
          <el-input
            v-model="itemForm.criterion"
            type="textarea"
            :rows="2"
            placeholder="合规的判断依据"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检查方法">
              <el-input v-model="itemForm.method" placeholder="如：查阅文件、系统检查" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险等级" required>
              <el-select
                v-model="itemForm.riskLevel"
                placeholder="选择风险等级"
                style="width: 100%"
              >
                <el-option label="高风险" value="high" />
                <el-option label="中风险" value="medium" />
                <el-option label="低风险" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Plus, Search, Upload } from '@element-plus/icons-vue'
import { mockChecklists } from '@/mock'
import type { ControlChecklist } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({ keyword: '', status: '' })
const expandedKeys = ref<string[]>([])

const tableData = ref(
  mockChecklists.map((item) => ({ ...item, _active: item.status === 'active' })),
)

const filteredData = computed(() => {
  return tableData.value.filter((item) => {
    if (
      searchForm.keyword &&
      !item.name.includes(searchForm.keyword) &&
      !item.code.includes(searchForm.keyword)
    )
      return false
    if (searchForm.status && item.status !== searchForm.status) return false
    return true
  })
})

const handleSearch = () => {
  /* computed handles filtering */
}
const handleExpandChange = (row: any, expandedRows: any[]) => {
  expandedKeys.value = expandedRows.map((r: any) => r.id)
}

// Checklist Dialog
const dialogVisible = ref(false)
const editingRow = ref<ControlChecklist | null>(null)
const form = reactive({ name: '', description: '' })

const openDialog = (row?: any) => {
  if (row) {
    editingRow.value = row
    form.name = row.name
    form.description = row.description || ''
  } else {
    editingRow.value = null
    form.name = ''
    form.description = ''
  }
  dialogVisible.value = true
}

const handleSaveChecklist = () => {
  if (!form.name) {
    ElMessage.warning('请输入清单名称')
    return
  }
  if (editingRow.value) {
    editingRow.value.name = form.name
    editingRow.value.description = form.description
    ElMessage.success('修改已保存')
  } else {
    const newItem = {
      id: `chk-${Date.now()}`,
      code: `CL-2026-${String(tableData.value.length + 1).padStart(3, '0')}`,
      name: form.name,
      description: form.description,
      items: [],
      status: 'draft' as const,
      _active: false,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    tableData.value.unshift(newItem)
    ElMessage.success('清单已创建')
  }
  dialogVisible.value = false
}

// Item Dialog
const itemDialogVisible = ref(false)
const currentChecklist = ref<any>(null)
const itemForm = reactive({ content: '', criterion: '', method: '', riskLevel: 'medium' })

const openItemDialog = (row: any) => {
  currentChecklist.value = row
  itemForm.content = ''
  itemForm.criterion = ''
  itemForm.method = ''
  itemForm.riskLevel = 'medium'
  itemDialogVisible.value = true
}

const handleSaveItem = () => {
  if (!itemForm.content || !itemForm.criterion) {
    ElMessage.warning('请填写必填项')
    return
  }
  const items = currentChecklist.value.items || []
  items.push({
    id: `ci-${Date.now()}`,
    checklistId: currentChecklist.value.id,
    sequence: items.length + 1,
    content: itemForm.content,
    criterion: itemForm.criterion,
    method: itemForm.method,
    riskLevel: itemForm.riskLevel,
  })
  currentChecklist.value.items = items
  ElMessage.success('检查项已添加')
  itemDialogVisible.value = false
}

const handleStatusChange = (row: any) => {
  row.status = row._active ? 'active' : 'disabled'
  ElMessage.success(`状态已更新为: ${row._active ? '启用' : '停用'}`)
}

const handleCopy = (row: any) => {
  const copy = {
    ...row,
    id: `chk-${Date.now()}`,
    code: `CL-2026-${String(tableData.value.length + 1).padStart(3, '0')}`,
    name: row.name + ' (副本)',
    items:
      row.items?.map((item: any) => ({ ...item, id: `ci-${Date.now()}-${Math.random()}` })) || [],
    _active: false,
    status: 'draft',
  }
  tableData.value.unshift(copy)
  ElMessage.success('清单已复制')
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除清单「${row.name}」吗？`, '警告', { type: 'warning' }).then(() => {
    tableData.value = tableData.value.filter((item) => item.id !== row.id)
    ElMessage.success('删除成功')
  })
}

const riskType = (val: string) =>
  (({ high: 'danger', medium: 'warning', low: 'success' }) as any)[val] || 'info'
const riskLabel = (val: string) =>
  (({ high: '高风险', medium: '中风险', low: '低风险' }) as any)[val] || val
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
  .page-subtitle {
    font-size: 14px;
    color: $iris-text-secondary;
  }
}

.checklist-detail {
  padding: 20px 24px;
  background: #f8fafc;
  border-radius: 8px;

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    h4 {
      font-size: 15px;
      color: $iris-text-secondary;
      font-weight: 600;
    }
  }
}
</style>
