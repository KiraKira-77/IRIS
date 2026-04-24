<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">资源域配置</h2>
        <span class="page-subtitle">维护资源域、域成员和创建/编辑/删除/查询权限</span>
      </div>
      <div class="right">
        <el-button type="primary" :icon="Plus" size="large" @click="openScopeDialog()">
          新增资源域
        </el-button>
      </div>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="域名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索域名称/编码"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="filteredScopes" v-loading="loading" style="width: 100%" stripe size="large">
      <el-table-column prop="scopeName" label="资源域名称" min-width="220" />
      <el-table-column prop="scopeCode" label="编码" width="180">
        <template #default="{ row }">
          <el-tag effect="plain" type="info">{{ row.scopeCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="scopeType" label="类型" width="130">
        <template #default="{ row }">
          <el-tag :type="row.scopeType === 'RESOURCE' ? 'primary' : 'warning'" effect="light">
            {{ getResourceScopeTypeLabel(row.scopeType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="dark" round>
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="成员数" width="120" align="center">
        <template #default="{ row }">
          {{ memberCountMap[row.id] || 0 }}
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="说明" min-width="260" show-overflow-tooltip />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openMemberDialog(row)">
            成员权限
          </el-button>
          <el-button link type="primary" size="small" @click="openScopeDialog(row)">编辑</el-button>
          <el-button
            link
            :type="row.status === 1 ? 'warning' : 'success'"
            size="small"
            @click="toggleScopeStatus(row)"
          >
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
          <el-button link type="danger" size="small" @click="removeScope(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="scopeDialogVisible"
      :title="editingScope ? '编辑资源域' : '新增资源域'"
      width="560px"
      destroy-on-close
    >
      <el-form :model="scopeForm" label-position="top" size="large">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资源域名称" required>
              <el-input v-model="scopeForm.scopeName" placeholder="例如：财务内控域" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="域编码">
              <el-input
                v-model="scopeForm.scopeCode"
                :disabled="true"
                :placeholder="editingScope ? '' : '系统自动生成，例如：RS0001'"
              />
              <div class="scope-type-hint">
                {{ editingScope ? '资源域编码创建后自动生成并固定，不支持手动修改。' : '保存后由系统自动生成资源域编码。' }}
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型" required>
              <el-select v-model="scopeForm.scopeType" style="width: 100%">
                <el-option label="维护域" value="RESOURCE" />
                <el-option label="共享域" value="STANDARD" />
              </el-select>
              <div class="scope-type-hint">
                {{ getResourceScopeTypeHint(scopeForm.scopeType) }}
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" required>
              <el-radio-group v-model="scopeForm.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="说明">
          <el-input
            v-model="scopeForm.remark"
            type="textarea"
            :rows="3"
            placeholder="说明这个资源域管理哪类数据"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scopeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingScope" @click="saveScope">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="memberDialogVisible"
      :title="memberScope ? `${memberScope.scopeName} - 成员权限` : '成员权限'"
      width="920px"
      destroy-on-close
    >
      <div class="member-toolbar">
        <el-select
          v-model="selectedUserId"
          filterable
          placeholder="选择系统用户"
          style="width: 320px"
        >
          <el-option
            v-for="user in selectableUsers"
            :key="user.id"
            :label="`${user.username} (${user.account})`"
            :value="user.id"
          />
        </el-select>
        <el-button type="primary" plain @click="appendMember">添加成员</el-button>
        <span class="member-hint">勾选管理时，默认包含查看/创建/编辑/删除。</span>
      </div>

      <el-table :data="memberRows" v-loading="memberLoading" style="width: 100%" size="large">
        <el-table-column label="成员" min-width="210">
          <template #default="{ row }">
            <div class="member-user">
              <strong>{{ row.username }}</strong>
              <span>{{ row.account }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="权限" min-width="360">
          <template #default="{ row }">
            <el-checkbox-group v-model="row.actions" @change="syncMemberActions(row)">
              <el-checkbox label="view">查询</el-checkbox>
              <el-checkbox label="create">创建</el-checkbox>
              <el-checkbox label="edit">编辑</el-checkbox>
              <el-checkbox label="delete">删除</el-checkbox>
              <el-checkbox label="manage">管理</el-checkbox>
            </el-checkbox-group>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="220">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="成员说明" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="removeMember($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="member-permission-guide">
        <div class="member-permission-guide__title">权限说明</div>
        <div class="member-permission-guide__list">
          <div class="member-permission-guide__item">
            <span class="member-permission-guide__label">查询</span>
            <span class="member-permission-guide__text">可查看该资源域下的数据列表、详情和基础信息。</span>
          </div>
          <div class="member-permission-guide__item">
            <span class="member-permission-guide__label">创建</span>
            <span class="member-permission-guide__text">可在该资源域下新增数据。</span>
          </div>
          <div class="member-permission-guide__item">
            <span class="member-permission-guide__label">编辑</span>
            <span class="member-permission-guide__text">可修改该资源域下已有数据。</span>
          </div>
          <div class="member-permission-guide__item">
            <span class="member-permission-guide__label">删除</span>
            <span class="member-permission-guide__text">可删除该资源域下允许删除的数据。</span>
          </div>
          <div class="member-permission-guide__item">
            <span class="member-permission-guide__label">管理</span>
            <span class="member-permission-guide__text">包含查询、创建、编辑、删除全部权限。</span>
          </div>
        </div>
        <div class="member-permission-guide__note">
          补充说明：勾选管理时默认包含查询、创建、编辑、删除；具体业务中的可操作范围，还会受数据状态和业务规则限制。
        </div>
      </div>

      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingMembers" @click="saveMembers">保存权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resourceScopeApi, systemUserApi } from '@/api'
import type {
  ResourceScope,
  ScopeAction,
  SystemUser,
} from '@/types'
import {
  createResourceScopeMemberPayload,
  getResourceScopeTypeHint,
  getResourceScopeTypeLabel,
  mapResourceScopeMemberToActions,
} from '@/features/permissions/resource-scope-adapter'

interface EditableScopeMember {
  userId: string
  username: string
  account: string
  remark?: string
  actions: ScopeAction[]
}

const loading = ref(false)
const memberLoading = ref(false)
const savingScope = ref(false)
const savingMembers = ref(false)

const scopes = ref<ResourceScope[]>([])
const systemUsers = ref<SystemUser[]>([])
const memberCountMap = reactive<Record<string, number>>({})

const searchForm = reactive({
  keyword: '',
  status: undefined as number | undefined,
})

const scopeDialogVisible = ref(false)
const editingScope = ref<ResourceScope | null>(null)
const scopeForm = reactive({
  scopeName: '',
  scopeCode: '',
  scopeType: 'RESOURCE',
  status: 1,
  remark: '',
})

const memberDialogVisible = ref(false)
const memberScope = ref<ResourceScope | null>(null)
const memberRows = ref<EditableScopeMember[]>([])
const selectedUserId = ref<string | null>(null)

const filteredScopes = computed(() =>
  scopes.value.filter((scope) => {
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.trim().toLowerCase()
      const matched =
        scope.scopeName.toLowerCase().includes(keyword) ||
        scope.scopeCode.toLowerCase().includes(keyword)

      if (!matched) {
        return false
      }
    }

    if (typeof searchForm.status === 'number' && scope.status !== searchForm.status) {
      return false
    }

    return true
  }),
)

const selectableUsers = computed(() =>
  systemUsers.value.filter(
    (user) =>
      user.status === 1 && !memberRows.value.some((member) => member.userId === user.id),
  ),
)

onMounted(() => {
  void initializePage()
})

const initializePage = async () => {
  loading.value = true

  try {
    await Promise.all([loadScopes(), loadUsers()])
  } finally {
    loading.value = false
  }
}

const loadScopes = async () => {
  const scopeList = await resourceScopeApi.list()
  scopes.value = scopeList.sort(compareEntityIds)

  const memberCounts = await Promise.all(
    scopes.value.map(async (scope) => {
      const members = await resourceScopeApi.listMembers(scope.id)
      return [scope.id, members.length] as const
    }),
  )

  for (const [scopeId, count] of memberCounts) {
    memberCountMap[scopeId] = count
  }
}

const loadUsers = async () => {
  systemUsers.value = await systemUserApi.list()
}

const openScopeDialog = (scope?: ResourceScope) => {
  editingScope.value = scope || null
  scopeForm.scopeName = scope?.scopeName || ''
  scopeForm.scopeCode = scope?.scopeCode || ''
  scopeForm.scopeType = scope?.scopeType || 'RESOURCE'
  scopeForm.status = scope?.status ?? 1
  scopeForm.remark = scope?.remark || ''
  scopeDialogVisible.value = true
}

const saveScope = async () => {
  if (!scopeForm.scopeName.trim()) {
    ElMessage.warning('请填写资源域名称')
    return
  }

  savingScope.value = true

  try {
    const payload = {
      tenantId: editingScope.value?.tenantId || 1001,
      scopeCode: editingScope.value ? normalizeScopeCode(scopeForm.scopeCode) : '',
      scopeName: scopeForm.scopeName.trim(),
      scopeType: scopeForm.scopeType,
      status: scopeForm.status,
      remark: scopeForm.remark.trim(),
    }

    if (editingScope.value) {
      await resourceScopeApi.update(editingScope.value.id, payload)
      ElMessage.success('资源域已更新')
    } else {
      await resourceScopeApi.create(payload)
      ElMessage.success('资源域已创建')
    }

    scopeDialogVisible.value = false
    await loadScopes()
  } finally {
    savingScope.value = false
  }
}

const toggleScopeStatus = async (scope: ResourceScope) => {
  await resourceScopeApi.update(scope.id, {
    tenantId: scope.tenantId,
    scopeCode: scope.scopeCode,
    scopeName: scope.scopeName,
    scopeType: scope.scopeType,
    status: scope.status === 1 ? 0 : 1,
    remark: scope.remark,
  })

  ElMessage.success(scope.status === 1 ? '资源域已停用' : '资源域已启用')
  await loadScopes()
}

const openMemberDialog = async (scope: ResourceScope) => {
  memberScope.value = scope
  memberDialogVisible.value = true
  selectedUserId.value = null
  memberLoading.value = true

  try {
    const members = await resourceScopeApi.listMembers(scope.id)
    memberRows.value = members.map((member) => ({
      userId: member.userId,
      username: member.username,
      account: member.account,
      remark: member.remark,
      actions: mapResourceScopeMemberToActions(member),
    }))
  } finally {
    memberLoading.value = false
  }
}

const appendMember = () => {
  const user = selectableUsers.value.find((item) => item.id === selectedUserId.value)

  if (!user) {
    ElMessage.warning('请选择一个可添加的系统用户')
    return
  }

  memberRows.value.push({
    userId: user.id,
    username: user.username,
    account: user.account,
    remark: '',
    actions: ['view'],
  })
  selectedUserId.value = null
}

const removeMember = (index: number) => {
  memberRows.value.splice(index, 1)
}

const syncMemberActions = (row: EditableScopeMember) => {
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

const saveMembers = async () => {
  if (!memberScope.value) {
    return
  }

  savingMembers.value = true

  try {
    await resourceScopeApi.replaceMembers(memberScope.value.id, {
      members: memberRows.value.map((member) =>
        createResourceScopeMemberPayload({
          userId: member.userId,
          actions: member.actions,
          remark: member.remark?.trim(),
        }),
      ),
    })

    memberDialogVisible.value = false
    memberCountMap[memberScope.value.id] = memberRows.value.length
    ElMessage.success('成员权限已保存')
  } finally {
    savingMembers.value = false
  }
}

const removeScope = async (scope: ResourceScope) => {
  try {
    await ElMessageBox.confirm(
      `删除后将清空“${scope.scopeName}”及其成员权限，且不可恢复。是否继续？`,
      '删除资源域',
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

  await resourceScopeApi.delete(scope.id)

  if (editingScope.value?.id === scope.id) {
    editingScope.value = null
    scopeDialogVisible.value = false
  }

  if (memberScope.value?.id === scope.id) {
    memberScope.value = null
    memberRows.value = []
    memberDialogVisible.value = false
  }

  delete memberCountMap[scope.id]
  ElMessage.success('资源域已删除')
  await loadScopes()
}

function normalizeScopeCode(scopeCode: string) {
  return scopeCode.trim().replace(/\s+/g, '_').toUpperCase()
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

.member-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.member-hint {
  font-size: 13px;
  color: $iris-text-muted;
}

.scope-type-hint {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: $iris-text-muted;
}

.member-user {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: $iris-text-primary;
  }

  span {
    font-size: 12px;
    color: $iris-text-muted;
  }
}

.member-permission-guide {
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba($iris-primary, 0.06);
  border: 1px solid rgba($iris-primary, 0.12);
}

.member-permission-guide__title {
  font-size: 14px;
  font-weight: 600;
  color: $iris-text-primary;
}

.member-permission-guide__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px 18px;
  margin-top: 12px;
}

.member-permission-guide__item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.6;
  color: $iris-text-secondary;
}

.member-permission-guide__label {
  flex: 0 0 auto;
  font-weight: 600;
  color: $iris-text-primary;
}

.member-permission-guide__text {
  flex: 1;
}

.member-permission-guide__note {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: $iris-text-muted;
}
</style>
