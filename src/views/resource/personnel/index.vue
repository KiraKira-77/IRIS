<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">人员管理</h2>
        <span class="page-subtitle">内控团队成员与角色权限配置</span>
      </div>
      <div class="right">
        <el-button type="primary" :icon="Plus" size="large" @click="openDialog()"
          >添加成员</el-button
        >
      </div>
    </div>

    <!-- 搜索 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="姓名">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索姓名"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select
            v-model="searchForm.department"
            placeholder="全部部门"
            clearable
            style="width: 160px"
          >
            <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 110px">
            <el-option label="在职" value="active" />
            <el-option label="离职" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <el-table :data="filteredData" style="width: 100%" size="large">
      <el-table-column label="成员" width="200" fixed>
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="36" :style="{ background: avatarColor(row.name) }">{{
              row.name.charAt(0)
            }}</el-avatar>
            <div class="info">
              <span class="name">{{ row.name }}</span>
              <span class="dept">{{ row.department }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="position" label="职位" width="160" />
      <el-table-column prop="phone" label="联系电话" width="140" />
      <el-table-column prop="email" label="邮箱" width="200" show-overflow-tooltip />
      <el-table-column label="角色" min-width="200">
        <template #default="{ row }">
          <el-tag
            v-for="role in row.roles"
            :key="role"
            effect="plain"
            size="small"
            round
            style="margin-right: 6px"
          >
            {{ roleLabel(role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="技能" min-width="200">
        <template #default="{ row }">
          <el-tag
            v-for="skill in row.skills"
            :key="skill"
            type="info"
            size="small"
            effect="light"
            round
            style="margin-right: 6px"
          >
            {{ skill }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'active' ? 'success' : 'danger'"
            size="small"
            effect="dark"
            round
          >
            {{ row.status === 'active' ? '在职' : '离职' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingRow ? '编辑成员' : '添加成员'"
      width="600px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top" size="large">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.name" placeholder="输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" required>
              <el-select v-model="form.department" placeholder="选择部门" style="width: 100%">
                <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职位">
              <el-input v-model="form.position" placeholder="输入职位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.phone" placeholder="输入电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-checkbox-group v-model="form.roles">
            <el-checkbox label="auditor">主审人员</el-checkbox>
            <el-checkbox label="reviewer">复核人</el-checkbox>
            <el-checkbox label="leader">项目组长</el-checkbox>
            <el-checkbox label="member">组员</el-checkbox>
            <el-checkbox label="expert">业务专家</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="技能标签">
          <el-select
            v-model="form.skills"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入技能后回车"
            style="width: 100%"
          >
            <el-option label="资金管理" value="资金管理" />
            <el-option label="IT审计" value="IT审计" />
            <el-option label="工程审计" value="工程审计" />
            <el-option label="网络安全" value="网络安全" />
            <el-option label="合同管理" value="合同管理" />
            <el-option label="风险评估" value="风险评估" />
            <el-option label="数据分析" value="数据分析" />
            <el-option label="流程优化" value="流程优化" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { mockPersonnel } from '@/mock'
import type { Personnel } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchForm = reactive({ keyword: '', department: '', status: '' })
const tableData = ref([...mockPersonnel])
const departments = ['财务部', '审计部', 'IT部', '法务部', '采购部', '人力资源部', '风控部']

const filteredData = computed(() => {
  return tableData.value.filter((item) => {
    if (searchForm.keyword && !item.name.includes(searchForm.keyword)) return false
    if (searchForm.department && item.department !== searchForm.department) return false
    if (searchForm.status && item.status !== searchForm.status) return false
    return true
  })
})

// Dialog
const dialogVisible = ref(false)
const editingRow = ref<Personnel | null>(null)
const form = reactive({
  name: '',
  department: '',
  position: '',
  phone: '',
  email: '',
  roles: [] as string[],
  skills: [] as string[],
})

const openDialog = (row?: Personnel) => {
  if (row) {
    editingRow.value = row
    form.name = row.name
    form.department = row.department
    form.position = row.position
    form.phone = row.phone || ''
    form.email = row.email || ''
    form.roles = [...row.roles]
    form.skills = [...row.skills]
  } else {
    editingRow.value = null
    form.name = ''
    form.department = ''
    form.position = ''
    form.phone = ''
    form.email = ''
    form.roles = []
    form.skills = []
  }
  dialogVisible.value = true
}

const handleSave = () => {
  if (!form.name || !form.department) {
    ElMessage.warning('请填写必填信息')
    return
  }
  if (editingRow.value) {
    Object.assign(editingRow.value, {
      name: form.name,
      department: form.department,
      position: form.position,
      phone: form.phone,
      email: form.email,
      roles: [...form.roles],
      skills: [...form.skills],
    })
    ElMessage.success('修改已保存')
  } else {
    tableData.value.unshift({
      id: `p-${Date.now()}`,
      name: form.name,
      department: form.department,
      position: form.position,
      phone: form.phone,
      email: form.email,
      roles: [...form.roles] as any,
      skills: [...form.skills],
      status: 'active',
    })
    ElMessage.success('成员已添加')
  }
  dialogVisible.value = false
}

const handleDelete = (row: Personnel) => {
  ElMessageBox.confirm(`确认移除「${row.name}」吗？`, '警告', { type: 'warning' }).then(() => {
    tableData.value = tableData.value.filter((item) => item.id !== row.id)
    ElMessage.success('已移除')
  })
}

const roleLabel = (val: string) =>
  (
    ({
      auditor: '主审人员',
      reviewer: '复核人',
      leader: '项目组长',
      member: '组员',
      expert: '业务专家',
    }) as any
  )[val] || val

const avatarColor = (name: string) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899']
  return colors[name.charCodeAt(0) % colors.length]
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
  .page-subtitle {
    font-size: 14px;
    color: $iris-text-secondary;
  }
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  .info {
    display: flex;
    flex-direction: column;
    .name {
      font-weight: 600;
      font-size: 14px;
      color: $iris-text-primary;
    }
    .dept {
      font-size: 12px;
      color: $iris-text-muted;
    }
  }
}
</style>
