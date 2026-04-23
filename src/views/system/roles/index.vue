<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">角色菜单</h2>
        <span class="page-subtitle">按角色配置侧边栏菜单权限，控制不同用户可见模块</span>
      </div>
      <div class="right">
        <el-button type="primary" :icon="Plus" size="large" @click="openDialog()">
          新增角色
        </el-button>
      </div>
    </div>

    <el-table :data="roles" v-loading="loading" style="width: 100%" stripe size="large">
      <el-table-column prop="roleName" label="角色名称" min-width="180" />
      <el-table-column prop="roleCode" label="角色编码" width="180">
        <template #default="{ row }">
          <el-tag effect="plain" type="info">{{ row.roleCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="scopeType" label="范围" width="130" />
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="dark" round>
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="菜单权限" min-width="360">
        <template #default="{ row }">
          <el-tag
            v-for="menuCode in row.menuCodes.slice(0, 6)"
            :key="menuCode"
            size="small"
            effect="plain"
            round
            style="margin-right: 6px"
          >
            {{ menuLabelMap[menuCode] || menuCode }}
          </el-tag>
          <span v-if="row.menuCodes.length > 6" class="menu-more">
            +{{ row.menuCodes.length - 6 }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="说明" min-width="220" show-overflow-tooltip />
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
          <el-button
            v-if="!isProtectedRole(row)"
            link
            type="danger"
            size="small"
            @click="removeRole(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingRole ? '编辑角色' : '新增角色'"
      width="760px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top" size="large">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色名称" required>
              <el-input v-model="form.roleName" placeholder="例如：审计员" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色编码" required>
              <el-input
                v-model="form.roleCode"
                :disabled="Boolean(editingRole)"
                placeholder="例如：AUDITOR"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色范围" required>
              <el-select v-model="form.scopeType" style="width: 100%">
                <el-option label="PLATFORM" value="PLATFORM" />
                <el-option label="TENANT" value="TENANT" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" required>
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="说明">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="角色说明" />
        </el-form-item>

        <el-form-item label="菜单权限" required>
          <div class="menu-groups">
            <div v-for="group in APP_MENU_GROUPS" :key="group.code" class="menu-group-card">
              <div class="menu-group-header">
                <strong>{{ group.label }}</strong>
                <el-button link type="primary" size="small" @click="toggleGroupMenus(group.code)">
                  {{ isGroupChecked(group.code) ? '取消全选' : '全选' }}
                </el-button>
              </div>
              <el-checkbox-group v-model="form.menuCodes">
                <el-checkbox
                  v-for="item in group.children"
                  :key="item.code"
                  :label="item.code"
                >
                  {{ item.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { roleApi } from '@/api'
import { useUserStore } from '@/stores'
import { APP_MENU_GROUPS } from '@/features/permissions/menu-access'
import type { RoleRecord } from '@/types'

const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)
const roles = ref<RoleRecord[]>([])
const dialogVisible = ref(false)
const editingRole = ref<RoleRecord | null>(null)

const form = reactive({
  roleName: '',
  roleCode: '',
  scopeType: 'TENANT',
  status: 1,
  remark: '',
  menuCodes: [] as string[],
})

const menuLabelMap = Object.fromEntries(
  APP_MENU_GROUPS.flatMap((group) => group.children.map((item) => [item.code, item.label])),
)

onMounted(() => {
  void loadRoles()
})

const loadRoles = async () => {
  loading.value = true

  try {
    roles.value = (await roleApi.list()).sort((left, right) =>
      left.id.localeCompare(right.id, 'zh-CN', { numeric: true }),
    )
  } finally {
    loading.value = false
  }
}

const openDialog = (role?: RoleRecord) => {
  editingRole.value = role || null
  form.roleName = role?.roleName || ''
  form.roleCode = role?.roleCode || ''
  form.scopeType = role?.scopeType || 'TENANT'
  form.status = role?.status ?? 1
  form.remark = role?.remark || ''
  form.menuCodes = [...(role?.menuCodes || [])]
  dialogVisible.value = true
}

const saveRole = async () => {
  const roleCode = form.roleCode.trim().toUpperCase()

  if (!form.roleName.trim() || !roleCode) {
    ElMessage.warning('请填写角色名称和角色编码')
    return
  }

  if (form.menuCodes.length === 0) {
    ElMessage.warning('请至少选择一个菜单')
    return
  }

  saving.value = true

  try {
    const payload = {
      tenantId: editingRole.value?.tenantId || 1001,
      roleCode,
      roleName: form.roleName.trim(),
      scopeType: form.scopeType,
      status: form.status,
      remark: form.remark.trim(),
      menuCodes: [...form.menuCodes].sort(),
    }

    if (editingRole.value) {
      await roleApi.update(editingRole.value.id, payload)
      ElMessage.success('角色已更新')
    } else {
      await roleApi.create(payload)
      ElMessage.success('角色已创建')
    }

    dialogVisible.value = false
    await Promise.all([loadRoles(), userStore.fetchUserInfo()])
  } finally {
    saving.value = false
  }
}

const removeRole = async (role: RoleRecord) => {
  if (isProtectedRole(role)) {
    ElMessage.warning('超级管理员角色不允许删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `删除后将清空“${role.roleName}”的菜单配置，且不可恢复。是否继续？`,
      '删除角色',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch {
    return
  }

  await roleApi.delete(role.id)

  if (editingRole.value?.id === role.id) {
    editingRole.value = null
    dialogVisible.value = false
  }

  ElMessage.success('角色已删除')
  await Promise.all([loadRoles(), userStore.fetchUserInfo()])
}

const isProtectedRole = (role: RoleRecord) => {
  const roleCode = role.roleCode.trim().toUpperCase()
  return roleCode === 'PLATFORM_ADMIN' || roleCode === 'SUPER_ADMIN'
}

const groupMenusMap = computed(() =>
  Object.fromEntries(APP_MENU_GROUPS.map((group) => [group.code, group.children.map((item) => item.code)])),
)

const isGroupChecked = (groupCode: string) =>
  (groupMenusMap.value[groupCode] || []).every((menuCode) => form.menuCodes.includes(menuCode))

const toggleGroupMenus = (groupCode: string) => {
  const codes = groupMenusMap.value[groupCode] || []
  const nextMenuCodes = new Set(form.menuCodes)

  if (codes.every((code) => nextMenuCodes.has(code))) {
    codes.forEach((code) => nextMenuCodes.delete(code))
  } else {
    codes.forEach((code) => nextMenuCodes.add(code))
  }

  form.menuCodes = Array.from(nextMenuCodes)
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

.menu-more {
  font-size: 12px;
  color: $iris-text-muted;
}

.menu-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

.menu-group-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  background: #f8fafc;
}

.menu-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

:deep(.el-checkbox-group) {
  display: grid;
  gap: 10px;
}
</style>
