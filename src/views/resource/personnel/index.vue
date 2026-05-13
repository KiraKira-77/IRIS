<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">人员管理</h2>
        <span class="page-subtitle">维护系统用户、角色和资源域权限</span>
      </div>
      <div class="right">
        <el-button type="primary" :icon="Plus" size="large" @click="openDialog()">
          新增人员
        </el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="关键字">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索姓名 / 账号 / 邮箱"
            clearable
            @keyup.enter="handleSearch"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.roleId" clearable placeholder="全部角色" style="width: 200px">
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="filteredUsers" v-loading="loading" style="width: 100%" stripe size="large">
      <el-table-column label="人员" min-width="240" fixed>
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="36" :style="{ background: avatarColor(row.username) }">
              {{ row.username.charAt(0) }}
            </el-avatar>
            <div class="info">
              <span class="name">{{ row.username }}</span>
              <span class="meta">{{ row.account }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="220" show-overflow-tooltip />
      <el-table-column prop="mobile" label="手机号" width="160" />
      <el-table-column label="角色" min-width="260">
        <template #default="{ row }">
          <el-tag
            v-for="role in resolveUserRoles(row)"
            :key="role.key"
            effect="plain"
            size="small"
            round
            style="margin-right: 6px"
          >
            {{ role.label }}
          </el-tag>
          <span v-if="resolveUserRoles(row).length === 0" class="empty-text">未分配</span>
        </template>
      </el-table-column>
      <el-table-column label="资源域权限" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <span
            :class="[
              'resource-scope-summary',
              { 'resource-scope-summary--empty': getUserScopeMemberships(row).length === 0 },
            ]"
          >
            {{ resolveUserScopeSummary(row) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="dark" round>
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip />
      <el-table-column label="操作" width="360" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="openResourceScopeDialog(row)">
            资源域权限
          </el-button>
          <el-button link type="danger" size="small" @click="resetPassword(row)">重置密码</el-button>
          <el-button
            link
            :type="row.status === 1 ? 'warning' : 'success'"
            size="small"
            @click="toggleStatus(row)"
          >
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button
            v-if="!isProtectedUser(row)"
            link
            type="danger"
            size="small"
            @click="removeUser(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingUser ? '编辑人员' : '新增人员'"
      width="680px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top" size="large">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号" required>
              <el-input
                v-model="form.account"
                :disabled="Boolean(editingUser)"
                placeholder="例如：zhangsan"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="form.username" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="form.mobile" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" required>
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" required>
              <el-select
                v-model="form.roleIds"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择角色"
                style="width: 100%"
              >
                <el-option
                  v-for="role in activeRoles"
                  :key="role.id"
                  :label="role.roleName"
                  :value="role.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="resourceScopeDialogVisible"
      :title="resourceScopeDialogUser ? `${resourceScopeDialogUser.username} - 资源域权限` : '资源域权限'"
      width="920px"
      destroy-on-close
    >
      <el-table
        :data="resourceScopeRows"
        v-loading="resourceScopeLoading"
        style="width: 100%"
        size="large"
      >
        <el-table-column label="资源域" min-width="220">
          <template #default="{ row }">
            <div class="scope-cell">
              <strong>{{ row.scopeName }}</strong>
              <span>{{ row.scopeCode }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权限" min-width="360">
          <template #default="{ row }">
            <el-checkbox-group v-model="row.actions" @change="syncResourceScopeActions(row)">
              <el-checkbox label="view">查询</el-checkbox>
              <el-checkbox label="create">创建</el-checkbox>
              <el-checkbox label="edit">编辑</el-checkbox>
              <el-checkbox label="delete">删除</el-checkbox>
              <el-checkbox label="manage">管理</el-checkbox>
            </el-checkbox-group>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="200">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="权限说明" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="resourceScopeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingResourceScopes" @click="saveResourceScopePermissions">
          保存权限
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resourceScopeApi, roleApi, systemUserApi } from '@/api'
import { useUserStore } from '@/stores'
import type {
  ResourceScope,
  ResourceScopeMember,
  RoleRecord,
  ScopeAction,
  SystemUser,
  SystemUserUpsertPayload,
} from '@/types'
import {
  createUserResourceScopeMembershipPayload,
  formatUserResourceScopeSummary,
  mapResourceScopeMemberToActions,
} from '@/features/permissions/resource-scope-adapter'

interface EditableUserScopeMembership {
  scopeId: string
  scopeCode: string
  scopeName: string
  status: number
  actions: ScopeAction[]
  remark?: string
}

const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)
const resourceScopeLoading = ref(false)
const savingResourceScopes = ref(false)
const dialogVisible = ref(false)
const resourceScopeDialogVisible = ref(false)
const editingUser = ref<SystemUser | null>(null)
const resourceScopeDialogUser = ref<SystemUser | null>(null)
const users = ref<SystemUser[]>([])
const roles = ref<RoleRecord[]>([])
const resourceScopes = ref<ResourceScope[]>([])
const resourceScopeRows = ref<EditableUserScopeMembership[]>([])
const userScopeMembershipMap = reactive<Record<string, ResourceScopeMember[]>>({})

const searchForm = reactive({
  keyword: '',
  roleId: undefined as string | undefined,
  status: undefined as number | undefined,
})

const form = reactive({
  account: '',
  username: '',
  email: '',
  mobile: '',
  status: 1,
  remark: '',
  roleIds: [] as string[],
})

const currentTenantId = computed(() => userStore.userInfo?.tenantId || 1001)
const activeRoles = computed(() => roles.value.filter((role) => role.status === 1))
const roleMap = computed(() => new Map(roles.value.map((role) => [role.id, role])))

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.trim().toLowerCase()
      const matched = [user.username, user.account, user.email || ''].some((value) =>
        value.toLowerCase().includes(keyword),
      )
      if (!matched) {
        return false
      }
    }

    if (typeof searchForm.roleId === 'string' && !user.roleIds.includes(searchForm.roleId)) {
      return false
    }

    if (typeof searchForm.status === 'number' && user.status !== searchForm.status) {
      return false
    }

    return true
  }),
)

onMounted(() => {
  void loadData()
})

async function handleSearch() {
  await loadData()
}

function handleReset() {
  searchForm.keyword = ''
  searchForm.roleId = undefined
  searchForm.status = undefined
  void handleSearch()
}

async function loadData() {
  loading.value = true

  try {
    const [userList, roleList, scopeList] = await Promise.all([
      systemUserApi.list(),
      roleApi.list(),
      resourceScopeApi.list(),
    ])
    users.value = [...userList].sort(compareEntityIds)
    roles.value = [...roleList].sort(compareEntityIds)
    resourceScopes.value = [...scopeList].sort(compareEntityIds)
    await loadUserScopeMemberships(users.value)
  } finally {
    loading.value = false
  }
}

async function loadUserScopeMemberships(userList: SystemUser[]) {
  for (const userId of Object.keys(userScopeMembershipMap)) {
    delete userScopeMembershipMap[userId]
  }

  const memberships = await Promise.all(
    userList.map(async (user) => [
      user.id,
      await systemUserApi.listResourceScopeMemberships(user.id),
    ] as const),
  )

  for (const [userId, userMemberships] of memberships) {
    userScopeMembershipMap[userId] = userMemberships
  }
}

function openDialog(user?: SystemUser) {
  editingUser.value = user || null
  form.account = user?.account || ''
  form.username = user?.username || ''
  form.email = user?.email || ''
  form.mobile = user?.mobile || ''
  form.status = user?.status ?? 1
  form.remark = user?.remark || ''
  form.roleIds = [...(user?.roleIds || [])]
  dialogVisible.value = true
}

async function saveUser() {
  if (!form.account.trim() || !form.username.trim()) {
    ElMessage.warning('请填写账号和姓名')
    return
  }

  if (form.roleIds.length === 0) {
    ElMessage.warning('请至少分配一个角色')
    return
  }

  saving.value = true

  try {
    const payload: SystemUserUpsertPayload = {
      tenantId: editingUser.value?.tenantId || currentTenantId.value,
      orgId: editingUser.value?.orgId ?? null,
      account: form.account.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      status: form.status,
      remark: form.remark.trim(),
      roleIds: [...form.roleIds],
    }

    if (editingUser.value) {
      await systemUserApi.update(editingUser.value.id, payload)
      ElMessage.success('人员已更新')
    } else {
      await systemUserApi.create(payload)
      ElMessage.success('人员已创建')
    }

    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function openResourceScopeDialog(user: SystemUser) {
  resourceScopeDialogUser.value = user
  resourceScopeDialogVisible.value = true
  resourceScopeLoading.value = true

  try {
    const memberships = await systemUserApi.listResourceScopeMemberships(user.id)
    userScopeMembershipMap[user.id] = memberships
    const membershipMap = new Map(memberships.map((membership) => [membership.scopeId, membership]))
    resourceScopeRows.value = resourceScopes.value.map((scope) => {
      const membership = membershipMap.get(scope.id)
      return {
        scopeId: scope.id,
        scopeCode: scope.scopeCode,
        scopeName: scope.scopeName,
        status: scope.status,
        actions: membership ? mapResourceScopeMemberToActions(membership) : [],
        remark: membership?.remark || '',
      }
    })
  } finally {
    resourceScopeLoading.value = false
  }
}

function syncResourceScopeActions(row: EditableUserScopeMembership) {
  const actions = new Set(row.actions)

  if (actions.has('manage')) {
    row.actions = ['view', 'create', 'edit', 'delete', 'manage']
    return
  }

  if (actions.has('create') || actions.has('edit') || actions.has('delete')) {
    actions.add('view')
  }

  row.actions = Array.from(actions)
}

async function saveResourceScopePermissions() {
  if (!resourceScopeDialogUser.value) {
    return
  }

  savingResourceScopes.value = true

  try {
    await systemUserApi.replaceResourceScopeMemberships(resourceScopeDialogUser.value.id, {
      memberships: resourceScopeRows.value
        .filter((row) => row.actions.length > 0)
        .map((row) =>
          createUserResourceScopeMembershipPayload({
            scopeId: row.scopeId,
            actions: row.actions,
            remark: row.remark?.trim(),
          }),
        ),
    })
    userScopeMembershipMap[resourceScopeDialogUser.value.id] =
      await systemUserApi.listResourceScopeMemberships(resourceScopeDialogUser.value.id)
    resourceScopeDialogVisible.value = false
    ElMessage.success('资源域权限已保存')
  } finally {
    savingResourceScopes.value = false
  }
}

async function toggleStatus(user: SystemUser) {
  loading.value = true

  try {
    await systemUserApi.update(user.id, {
      tenantId: user.tenantId,
      orgId: user.orgId ?? null,
      account: user.account,
      username: user.username,
      email: user.email || '',
      mobile: user.mobile || '',
      status: user.status === 1 ? 0 : 1,
      remark: user.remark || '',
      roleIds: [...user.roleIds],
    })
    await loadData()
    ElMessage.success(user.status === 1 ? '人员已停用' : '人员已启用')
  } finally {
    loading.value = false
  }
}

async function resetPassword(user: SystemUser) {
  await ElMessageBox.confirm(
    `确认将账号「${user.account}」的密码重置为默认密码 jolywood 吗？`,
    '重置密码',
    {
      type: 'warning',
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
    },
  )

  loading.value = true

  try {
    await systemUserApi.resetPassword(user.id)
    ElMessage.success(`密码已重置为默认密码 jolywood`)
  } finally {
    loading.value = false
  }
}

async function removeUser(user: SystemUser) {
  if (isProtectedUser(user)) {
    ElMessage.warning('初始管理员账号不允许删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `删除后将清空账号“${user.account}”及其角色分配，且不可恢复。是否继续？`,
      '删除人员',
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

  loading.value = true

  try {
    await systemUserApi.delete(user.id)

    if (editingUser.value?.id === user.id) {
      editingUser.value = null
      dialogVisible.value = false
    }

    await loadData()
    ElMessage.success('人员已删除')
  } finally {
    loading.value = false
  }
}

function isProtectedUser(user: SystemUser) {
  return user.account.trim().toLowerCase() === 'admin'
}

function resolveUserRoles(user: SystemUser) {
  const fromIds = user.roleIds
    .map((roleId) => roleMap.value.get(roleId))
    .filter((role): role is RoleRecord => Boolean(role))
    .map((role) => ({ key: `id-${role.id}`, label: role.roleName }))

  if (fromIds.length > 0) {
    return fromIds
  }

  return (user.roleCodes || []).map((roleCode) => ({ key: `code-${roleCode}`, label: roleCode }))
}

function getUserScopeMemberships(user: SystemUser) {
  return userScopeMembershipMap[user.id] || []
}

function resolveUserScopeSummary(user: SystemUser) {
  return formatUserResourceScopeSummary(getUserScopeMemberships(user), resourceScopes.value)
}

function avatarColor(seed: string) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6']
  return colors[seed.charCodeAt(0) % colors.length]
}

function compareEntityIds(left: { id: string }, right: { id: string }) {
  return left.id.localeCompare(right.id, 'zh-CN', { numeric: true })
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
  }

  .name {
    font-weight: 600;
    color: $iris-text-primary;
  }

  .meta {
    font-size: 12px;
    color: $iris-text-muted;
  }
}

.empty-text {
  color: $iris-text-muted;
}

.resource-scope-summary {
  color: $iris-text-primary;
}

.resource-scope-summary--empty {
  color: $iris-text-muted;
}

.scope-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: $iris-text-primary;
    font-weight: 600;
  }

  span {
    color: $iris-text-muted;
    font-size: 12px;
  }
}
</style>
