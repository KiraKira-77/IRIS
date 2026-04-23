<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">标准管理</h2>
        <span class="page-subtitle">内控标准文档的统一维护与发布</span>
      </div>
      <div class="right">
        <el-button
          type="primary"
          :icon="Plus"
          size="large"
          :disabled="!canCreateStandard"
          @click="openDialog()"
          >新建标准</el-button
        >
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="标准名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入关键字"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="searchForm.category"
            placeholder="全部分类"
            clearable
            style="width: 160px"
          >
            <el-option label="法律法规" value="law" />
            <el-option label="行业规范" value="industry" />
            <el-option label="内部制度" value="internal" />
            <el-option label="系统制度" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            style="width: 130px"
          >
            <el-option label="生效中" value="active" />
            <el-option label="草稿" value="draft" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading" style="width: 100%" stripe size="large">
      <el-table-column prop="title" label="标准名称" min-width="280" show-overflow-tooltip>
        <template #default="{ row }">
          <el-link
            type="primary"
            @click="openDetail(row)"
            :underline="false"
            style="font-weight: 500"
            >{{ row.title }}</el-link
          >
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="130">
        <template #default="{ row }">
          <el-tag :type="categoryType(row.category)" effect="light" round>{{
            categoryLabel(row.category)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本" width="140" align="center">
        <template #default="{ row }">
          <div class="version-cell">
            <span class="version-label">{{ row.version }}</span>
            <el-tag
              v-if="getVersionCount(row) > 1"
              size="small"
              effect="plain"
              round
              type="info"
              class="version-count"
              >共{{ getVersionCount(row) }}版</el-tag
            >
          </div>
        </template>
      </el-table-column>
      <el-table-column label="可见范围" width="140">
        <template #default="{ row }">
          <el-tag :type="row.visibilityLevel === 'PUBLIC' ? 'success' : 'warning'" effect="light" round>
            {{ row.visibilityLevel === 'PUBLIC' ? '全员可见' : '域内可见' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="维护域" width="150">
        <template #default="{ row }">
          <el-tag type="info" effect="plain" round>{{ scopeLabel(row.ownerScopeId) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="publishDate" label="发布日期" width="130" sortable />
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" effect="dark" size="small">{{
            statusLabel(row.status)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
          <el-button
            v-if="getRowAccessState(row).canEdit"
            link
            type="primary"
            size="small"
            @click="openDialog(row)"
            >编辑</el-button
          >
          <el-button
            v-if="getRowAccessState(row).canEdit && row.status === 'active'"
            link
            type="success"
            size="small"
            @click="openUpgradeDialog(row)"
            >升版</el-button
          >
          <el-button
            v-if="getRowAccessState(row).canDelete && row.status !== 'active'"
            link
            type="danger"
            size="small"
            @click="handleDelete(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSearch"
        @current-change="handleSearch"
      />
    </div>

    <!-- 新建/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingRow ? '编辑标准' : '新建标准'"
      width="640px"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px" label-position="top" size="large">
        <el-form-item label="标准编号" required>
          <el-input v-model="form.standardCode" placeholder="请输入标准编号" />
        </el-form-item>
        <el-form-item label="标准名称" required>
          <el-input v-model="form.title" placeholder="请输入标准名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" required>
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
                <el-option label="法律法规" value="law" />
                <el-option label="行业规范" value="industry" />
                <el-option label="内部制度" value="internal" />
                <el-option label="系统制度" value="system" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版本号">
              <el-input v-model="form.version" placeholder="如 V1.0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标准描述"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="可见范围" required>
              <el-select v-model="form.visibilityLevel" style="width: 100%">
                <el-option label="全员可见" value="PUBLIC" />
                <el-option label="域内可见" value="SCOPED" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维护域" required>
              <el-select v-model="form.ownerScopeId" style="width: 100%">
                <el-option
                  v-for="scope in editableScopeOptions"
                  :key="scope.id"
                  :label="formatResourceScopeOptionLabel(scope)"
                  :value="scope.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="form.visibilityLevel === 'SCOPED'" label="共享可见范围">
          <el-select
            v-model="form.grantScopeIds"
            multiple
            clearable
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%"
          >
            <el-option
              v-for="scope in grantScopeOptions"
              :key="scope.id"
              :label="formatResourceScopeOptionLabel(scope)"
              :value="scope.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" :limit="5" accept=".pdf,.doc,.docx,.xls,.xlsx">
            <el-button type="primary" plain>上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Word、Excel 格式，单个文件不超过 20MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">{{
          editingRow ? '保存修改' : '保存为草稿'
        }}</el-button>
        <el-button type="success" @click="handlePublish" v-if="!editingRow">发布</el-button>
      </template>
    </el-dialog>

    <!-- 升版弹窗 -->
    <el-dialog v-model="upgradeDialogVisible" title="升版标准" width="520px" destroy-on-close>
      <div v-if="upgradeSourceRow" class="upgrade-info">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="标准编号">{{
            upgradeSourceRow.standardCode
          }}</el-descriptions-item>
          <el-descriptions-item label="标准名称">{{ upgradeSourceRow.title }}</el-descriptions-item>
          <el-descriptions-item label="当前版本">
            <el-tag type="info" size="small">{{ upgradeSourceRow.version }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form
        :model="upgradeForm"
        label-width="100px"
        label-position="top"
        size="large"
        style="margin-top: 20px"
      >
        <el-form-item label="新版本号" required>
          <el-input
            v-model="upgradeForm.newVersion"
            placeholder="请输入新版本号，如 V2.0、2026版、Rev.3 等"
          />
        </el-form-item>
        <el-form-item label="修订说明" required>
          <el-input
            v-model="upgradeForm.changeLog"
            type="textarea"
            :rows="3"
            placeholder="请描述本次修订的主要变更内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="upgradeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpgrade">
          <el-icon style="margin-right: 4px"><TopRight /></el-icon>
          创建新版本草稿
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="标准详情" size="560px" destroy-on-close>
      <div v-if="detailRow" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标准编号">{{
            detailRow.standardCode
          }}</el-descriptions-item>
          <el-descriptions-item label="标准名称"
            ><strong>{{ detailRow.title }}</strong></el-descriptions-item
          >
          <el-descriptions-item label="分类">
            <el-tag :type="categoryType(detailRow.category)" effect="light" round>{{
              categoryLabel(detailRow.category)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="版本">
            <el-tag type="info" effect="dark" size="small">{{ detailRow.version }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(detailRow.status)" effect="dark" size="small">{{
              statusLabel(detailRow.status)
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="可见范围">
            <el-tag
              :type="detailRow.visibilityLevel === 'PUBLIC' ? 'success' : 'warning'"
              effect="light"
              round
            >
              {{ detailRow.visibilityLevel === 'PUBLIC' ? '全员可见' : '域内可见' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="维护域">
            {{ scopeLabel(detailRow.ownerScopeId) }}
          </el-descriptions-item>
          <el-descriptions-item label="共享可见范围">
            <template v-if="detailRow.grants.length > 0">
              <el-tag
                v-for="grant in detailRow.grants"
                :key="grant.scopeId"
                size="small"
                effect="plain"
                round
                style="margin-right: 4px"
              >
                {{ scopeLabel(grant.scopeId) }}
              </el-tag>
            </template>
            <span v-else>无</span>
          </el-descriptions-item>
          <el-descriptions-item label="我的权限">
            <el-tag
              :type="detailAccessState?.canEdit ? 'success' : 'info'"
              effect="light"
              round
            >
              {{ detailAccessState?.canEdit ? '可编辑' : '只读' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布日期">{{ detailRow.publishDate }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{
            detailRow.description || '暂无描述'
          }}</el-descriptions-item>
          <el-descriptions-item label="修订说明" v-if="detailRow.changeLog">
            {{ detailRow.changeLog }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 版本历史时间线 -->
        <div v-if="versionHistory.length > 0" class="version-history">
          <h4 class="section-title">
            <el-icon><Clock /></el-icon>
            版本历史
            <span class="version-count-label">（共 {{ versionHistory.length }} 个版本）</span>
          </h4>
          <el-timeline>
            <el-timeline-item
              v-for="(v, idx) in versionHistory"
              :key="v.id"
              :timestamp="v.publishDate"
              :type="
                v.id === detailRow.id ? 'primary' : v.status === 'archived' ? 'info' : 'success'
              "
              :hollow="v.id !== detailRow.id"
              placement="top"
            >
              <div
                class="timeline-card"
                :class="{
                  'is-current': v.id === detailRow.id,
                  'is-expanded': expandedVersions[v.id],
                }"
              >
                <div class="timeline-header" @click="toggleVersionExpand(v.id)">
                  <div class="header-left">
                    <el-tag
                      :type="v.id === detailRow.id ? 'primary' : 'info'"
                      size="small"
                      effect="dark"
                      >{{ v.version }}</el-tag
                    >
                    <el-tag :type="statusType(v.status)" size="small" effect="light">{{
                      statusLabel(v.status)
                    }}</el-tag>
                    <span v-if="v.id === detailRow.id" class="current-badge">← 当前</span>
                  </div>
                  <el-icon class="expand-icon" :class="{ 'is-rotated': expandedVersions[v.id] }">
                    <ArrowDown />
                  </el-icon>
                </div>
                <p v-if="v.changeLog" class="timeline-changelog">
                  <el-icon style="margin-right: 4px; vertical-align: -2px"><EditPen /></el-icon>
                  {{ v.changeLog }}
                </p>

                <!-- 展开的完整内容 -->
                <el-collapse-transition>
                  <div v-show="expandedVersions[v.id]" class="version-detail">
                    <el-descriptions :column="1" border size="small" class="version-desc">
                      <el-descriptions-item label="分类">
                        <el-tag
                          :type="categoryType(v.category)"
                          size="small"
                          effect="light"
                          round
                          >{{ categoryLabel(v.category) }}</el-tag
                        >
                      </el-descriptions-item>
                      <el-descriptions-item label="描述">
                        {{ v.description || '暂无描述' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="创建时间">{{
                        v.createdAt
                      }}</el-descriptions-item>
                      <el-descriptions-item label="更新时间">{{
                        v.updatedAt
                      }}</el-descriptions-item>
                    </el-descriptions>

                    <!-- 与上一版本的变更对比 -->
                    <div v-if="idx < versionHistory.length - 1" class="version-diff">
                      <div class="diff-title">
                        <el-icon><Switch /></el-icon>
                        与前版 {{ versionHistory[idx + 1]?.version }} 的变更
                      </div>
                      <div class="diff-items">
                        <template
                          v-for="change in getVersionChanges(v, versionHistory[idx + 1])"
                          :key="change.field"
                        >
                          <div class="diff-row">
                            <span class="diff-field">{{ change.label }}</span>
                            <div class="diff-values">
                              <span class="diff-old">
                                <el-icon><Remove /></el-icon>
                                {{ change.oldVal || '(空)' }}
                              </span>
                              <span class="diff-new">
                                <el-icon><CirclePlus /></el-icon>
                                {{ change.newVal || '(空)' }}
                              </span>
                            </div>
                          </div>
                        </template>
                        <div
                          v-if="getVersionChanges(v, versionHistory[idx + 1]).length === 0"
                          class="diff-empty"
                        >
                          内容无变化（仅版本号升级）
                        </div>
                      </div>
                    </div>
                    <div v-else class="version-diff">
                      <div class="diff-empty" style="padding: 8px 0">
                        <el-tag type="info" size="small" effect="plain">初始版本</el-tag>
                      </div>
                    </div>

                    <!-- 回退按钮：只在当前查看的不是这个版本且该版本是已归档的时候显示 -->
                    <div
                      v-if="
                        v.status === 'archived' && v.id !== getCurrentActiveId(v.standardGroupId)
                      "
                      class="rollback-action"
                    >
                      <el-button
                        type="warning"
                        size="small"
                        plain
                        @click.stop="openRollbackDialog(v)"
                      >
                        <el-icon style="margin-right: 4px"><RefreshLeft /></el-icon>
                        回退到此版本
                      </el-button>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="drawer-actions">
          <el-button v-if="detailAccessState?.canEdit" type="primary" @click="handleEditFromDrawer"
            >编辑</el-button
          >
          <el-button
            type="success"
            v-if="detailAccessState?.canEdit && detailRow.status === 'active'"
            @click="openUpgradeDialog(detailRow)"
          >
            <el-icon style="margin-right: 4px"><TopRight /></el-icon>
            升版
          </el-button>
          <el-button
            type="success"
            v-if="detailAccessState?.canEdit && detailRow.status === 'draft'"
            @click="handlePublishFromDrawer"
            >发布</el-button
          >
          <el-button type="warning" v-if="detailRow.status === 'active'">归档</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  ArrowDown,
  CirclePlus,
  Clock,
  EditPen,
  Plus,
  Refresh,
  RefreshLeft,
  Remove,
  Search,
  Switch,
  TopRight,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resourceScopeApi, standardApi } from '@/api'
import {
  buildStandardDraftPayload,
  buildStandardListPage,
  buildStandardMutationPayload,
  buildStandardUpsertPayload,
  normalizeStandardFromApi,
} from '@/features/standards/standard-data'
import { buildStandardAccessState } from '@/features/permissions/standard-access'
import { DEFAULT_RESOURCE_SCOPE_OPTIONS } from '@/features/permissions/user-access'
import {
  filterGrantScopeOptions,
  filterOwnerScopeOptions,
  formatResourceScopeOptionLabel,
  mapResourceScopesToOptions,
  mergeResourceScopeOptions,
} from '@/features/permissions/resource-scope-adapter'
import { useUserStore } from '@/stores'
import type { ResourceScopeOption, Standard, UserAccessContext } from '@/types'

const loading = ref(false)
const searchForm = reactive({ keyword: '', category: '', status: '' })
const allStandards = ref<Standard[]>([])
const tableData = ref<Standard[]>([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const userStore = useUserStore()
const scopeOptions = ref<ResourceScopeOption[]>([...DEFAULT_RESOURCE_SCOPE_OPTIONS])
const currentTenantId = computed(() => userStore.userInfo?.tenantId || 1001)

const emptyAccessContext: UserAccessContext = {
  isSuperAdmin: false,
  scopePermissions: [],
}

const currentAccessContext = computed(() => userStore.accessContext || emptyAccessContext)
const visibleStandards = computed(() => allStandards.value)
const editableScopeOptions = computed(() => {
  const ownerScopes = filterOwnerScopeOptions(scopeOptions.value)

  if (currentAccessContext.value.isSuperAdmin) {
    return ownerScopes
  }

  return ownerScopes.filter(
    (scope) => hasScopeAction(scope.id, 'create') || hasScopeAction(scope.id, 'manage'),
  )
})
const canCreateStandard = computed(
  () => currentAccessContext.value.isSuperAdmin || editableScopeOptions.value.length > 0,
)

const dialogVisible = ref(false)
const editingRow = ref<Standard | null>(null)
const form = reactive({
  standardCode: '',
  title: '',
  category: '',
  version: 'V1.0',
  description: '',
  visibilityLevel: 'PUBLIC' as Standard['visibilityLevel'],
  ownerScopeId: '',
  grantScopeIds: [] as string[],
})
const grantScopeOptions = computed(() => filterGrantScopeOptions(scopeOptions.value, form.ownerScopeId))

const upgradeDialogVisible = ref(false)
const upgradeSourceRow = ref<Standard | null>(null)
const upgradeForm = reactive({
  newVersion: '',
  changeLog: '',
})

const drawerVisible = ref(false)
const detailRow = ref<Standard | null>(null)
const detailAccessState = computed(() =>
  detailRow.value ? buildStandardAccessState(detailRow.value, currentAccessContext.value) : null,
)

const expandedVersions = reactive<Record<string, boolean>>({})

const toggleVersionExpand = (id: string) => {
  expandedVersions[id] = !expandedVersions[id]
}

const getVersionChanges = (current: Standard, previous?: Standard) => {
  if (!previous) return []
  const changes: { field: string; label: string; oldVal: string; newVal: string }[] = []
  const fieldMap: { field: keyof Standard; label: string; format?: (value: any) => string }[] = [
    { field: 'description', label: '\u63cf\u8ff0' },
    { field: 'category', label: '\u5206\u7c7b', format: categoryLabel },
    { field: 'title', label: '\u6807\u51c6\u540d\u79f0' },
  ]

  for (const { field, label, format } of fieldMap) {
    const oldValue = previous[field]
    const newValue = current[field]
    const oldText = format ? format(oldValue) : String(oldValue ?? '')
    const newText = format ? format(newValue) : String(newValue ?? '')

    if (oldText !== newText) {
      changes.push({ field, label, oldVal: oldText, newVal: newText })
    }
  }

  return changes
}

const getCurrentActiveId = (groupId: string): string | null => {
  const active = allStandards.value.find(
    (item) => item.standardGroupId === groupId && item.status === 'active',
  )
  return active?.id ?? null
}

const getVersionCount = (row: Standard) =>
  allStandards.value.filter((item) => item.standardGroupId === row.standardGroupId).length

const versionHistory = computed(() => {
  if (!detailRow.value) return []

  return [...allStandards.value]
    .filter((item) => item.standardGroupId === detailRow.value?.standardGroupId)
    .sort((left, right) => right.versionNumber - left.versionNumber)
})

onMounted(() => {
  void Promise.all([loadScopeOptions(), loadStandards()])
})

watch(visibleStandards, () => {
  handleSearch()
})

const loadScopeOptions = async () => {
  try {
    const scopes = await resourceScopeApi.list()
    const mappedOptions = mapResourceScopesToOptions(scopes)

    scopeOptions.value =
      mappedOptions.length > 0
        ? mergeResourceScopeOptions(mappedOptions, DEFAULT_RESOURCE_SCOPE_OPTIONS)
        : [...DEFAULT_RESOURCE_SCOPE_OPTIONS]
  } catch {
    scopeOptions.value = [...DEFAULT_RESOURCE_SCOPE_OPTIONS]
  }
}

const loadStandards = async () => {
  loading.value = true

  try {
    allStandards.value = (await standardApi.list()).map(normalizeStandardFromApi)
    syncSelectedRows()
    handleSearch()
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  const preview = buildStandardListPage(visibleStandards.value, {
    keyword: searchForm.keyword,
    category: searchForm.category,
    status: searchForm.status,
    page: 1,
    pageSize: pagination.pageSize,
  })
  const maxPage = Math.max(1, Math.ceil(preview.total / pagination.pageSize))

  if (pagination.page > maxPage) {
    pagination.page = maxPage
  }

  const page = buildStandardListPage(visibleStandards.value, {
    keyword: searchForm.keyword,
    category: searchForm.category,
    status: searchForm.status,
    page: pagination.page,
    pageSize: pagination.pageSize,
  })

  pagination.total = page.total
  tableData.value = page.list
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  searchForm.status = ''
  pagination.page = 1
  handleSearch()
}

const openDialog = (row?: Standard) => {
  if (row && !getRowAccessState(row).canEdit) {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u5bf9\u4f60\u662f\u53ea\u8bfb\u7684')
    return
  }
  if (!row && !canCreateStandard.value) {
    ElMessage.warning('\u5f53\u524d\u8d26\u53f7\u6ca1\u6709\u53ef\u521b\u5efa\u6807\u51c6\u7684\u7ef4\u62a4\u57df')
    return
  }

  if (row) {
    editingRow.value = row
    form.standardCode = row.standardCode
    form.title = row.title
    form.category = row.category
    form.version = row.version
    form.description = row.description || ''
    form.visibilityLevel = row.visibilityLevel
    form.ownerScopeId = row.ownerScopeId
    form.grantScopeIds = row.grants.map((grant) => grant.scopeId)
  } else {
    editingRow.value = null
    form.standardCode = ''
    form.title = ''
    form.category = ''
    form.version = 'V1.0'
    form.description = ''
    form.visibilityLevel = 'PUBLIC'
    form.ownerScopeId = editableScopeOptions.value[0]?.id || ''
    form.grantScopeIds = []
  }

  dialogVisible.value = true
}

const openDetail = (row: Standard) => {
  detailRow.value = row
  drawerVisible.value = true
}

const openUpgradeDialog = (row: Standard) => {
  if (!getRowAccessState(row).canEdit) {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u4e0d\u5141\u8bb8\u5347\u7248')
    return
  }

  upgradeSourceRow.value = row
  upgradeForm.newVersion = ''
  upgradeForm.changeLog = ''
  upgradeDialogVisible.value = true
  drawerVisible.value = false
}

const handleSave = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const currentRow = editingRow.value

    if (currentRow) {
      await standardApi.update(
        currentRow.id,
        buildStandardUpsertPayload(form, {
          tenantId: currentTenantId.value,
          status: currentRow.status,
          publishDate: normalizePublishDate(currentRow.publishDate),
          standardGroupId: currentRow.standardGroupId,
          versionNumber: currentRow.versionNumber,
          previousVersionId: currentRow.previousVersionId,
          changeLog: currentRow.changeLog,
        }),
      )
      ElMessage.success('\u4fee\u6539\u5df2\u4fdd\u5b58')
    } else {
      await standardApi.create(
        buildStandardUpsertPayload(form, {
          tenantId: currentTenantId.value,
          status: 'draft',
          publishDate: null,
          changeLog: '\u521d\u59cb\u521b\u5efa',
        }),
      )
      ElMessage.success('\u5df2\u4fdd\u5b58\u4e3a\u8349\u7a3f')
    }

    dialogVisible.value = false
    await loadStandards()
  } finally {
    loading.value = false
  }
}

const handlePublish = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    await standardApi.create(
      buildStandardUpsertPayload(form, {
        tenantId: currentTenantId.value,
        status: 'active',
        publishDate: today(),
        changeLog: '\u521d\u59cb\u53d1\u5e03',
      }),
    )

    dialogVisible.value = false
    await loadStandards()
    ElMessage.success('\u6807\u51c6\u5df2\u53d1\u5e03')
  } finally {
    loading.value = false
  }
}

const handlePublishFromDrawer = async () => {
  const current = detailRow.value
  if (!current) return
  if (!detailAccessState.value?.canEdit) {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u4e0d\u5141\u8bb8\u53d1\u5e03')
    return
  }

  loading.value = true

  try {
    const activeVersion = allStandards.value.find(
      (item) =>
        item.standardGroupId === current.standardGroupId &&
        item.id !== current.id &&
        item.status === 'active',
    )

    if (activeVersion) {
      await standardApi.update(
        activeVersion.id,
        buildStandardMutationPayload(activeVersion, {
          tenantId: currentTenantId.value,
          status: 'archived',
        }),
      )
    }

    await standardApi.update(
      current.id,
      buildStandardMutationPayload(current, {
        tenantId: currentTenantId.value,
        status: 'active',
        publishDate: today(),
      }),
    )

    await loadStandards()
    updateDetailRow(current.id)
    ElMessage.success(activeVersion ? '\u6807\u51c6\u5df2\u53d1\u5e03\uff0c\u65e7\u7248\u5df2\u81ea\u52a8\u5f52\u6863' : '\u6807\u51c6\u5df2\u53d1\u5e03')
  } finally {
    loading.value = false
  }
}

const handleUpgrade = async () => {
  if (!upgradeForm.newVersion.trim()) {
    ElMessage.warning('\u8bf7\u8f93\u5165\u65b0\u7248\u672c\u53f7')
    return
  }
  if (!upgradeForm.changeLog.trim()) {
    ElMessage.warning('\u8bf7\u586b\u5199\u4fee\u8ba2\u8bf4\u660e')
    return
  }

  const source = upgradeSourceRow.value
  if (!source) return

  loading.value = true

  try {
    const payload = buildStandardDraftPayload(
      source,
      {
        tenantId: currentTenantId.value,
        version: upgradeForm.newVersion.trim(),
        changeLog: upgradeForm.changeLog.trim(),
      },
      allStandards.value,
    )

    await standardApi.create(payload)
    upgradeDialogVisible.value = false
    await loadStandards()

    const createdDraft = allStandards.value.find(
      (item) =>
        item.standardGroupId === payload.standardGroupId &&
        item.versionNumber === payload.versionNumber,
    )

    ElMessage.success(`\u5df2\u521b\u5efa ${upgradeForm.newVersion} \u7248\u672c\u8349\u7a3f`)

    if (createdDraft) {
      openDialog(createdDraft)
    }
  } finally {
    loading.value = false
  }
}

const openRollbackDialog = (targetVersion: Standard) => {
  ElMessageBox.prompt(
    `\u5c06\u57fa\u4e8e\u300c${targetVersion.version}\u300d\u7684\u5185\u5bb9\u521b\u5efa\u65b0\u7248\u672c\u8349\u7a3f\uff0c\u8bf7\u8f93\u5165\u56de\u9000\u539f\u56e0\uff1a`,
    `\u56de\u9000\u5230 ${targetVersion.version}`,
    {
      confirmButtonText: '\u786e\u8ba4\u56de\u9000',
      cancelButtonText: '\u53d6\u6d88',
      type: 'warning',
      inputType: 'textarea',
      inputPlaceholder: '\u8bf7\u8f93\u5165\u56de\u9000\u539f\u56e0',
      inputValidator: (value: string) => {
        if (!value || !value.trim()) return '\u56de\u9000\u539f\u56e0\u4e0d\u80fd\u4e3a\u7a7a'
        return true
      },
    },
  ).then((result) => {
    const reason = typeof result === 'string' ? result : (result as { value: string }).value
    void handleRollback(targetVersion, reason)
  })
}

const handleRollback = async (targetVersion: Standard, reason: string) => {
  loading.value = true

  try {
    const payload = buildStandardDraftPayload(
      targetVersion,
      {
        tenantId: currentTenantId.value,
        version: targetVersion.version,
        changeLog: `[\u56de\u9000] \u56de\u9000\u81f3 ${targetVersion.version}\uff1a${reason}`,
      },
      allStandards.value,
    )

    await standardApi.create(payload)
    await loadStandards()

    const rollbackDraft = allStandards.value.find(
      (item) =>
        item.standardGroupId === payload.standardGroupId &&
        item.versionNumber === payload.versionNumber,
    )

    if (rollbackDraft) {
      detailRow.value = rollbackDraft
    }

    ElMessage.success('\u5df2\u521b\u5efa\u56de\u9000\u8349\u7a3f\uff0c\u53ef\u7f16\u8f91\u540e\u53d1\u5e03')
  } finally {
    loading.value = false
  }
}

const handleDelete = (row: Standard) => {
  if (!getRowAccessState(row).canDelete) {
    ElMessage.warning('\u5f53\u524d\u6807\u51c6\u4e0d\u5141\u8bb8\u5220\u9664')
    return
  }

  ElMessageBox.confirm(`\u786e\u8ba4\u5220\u9664\u6807\u51c6\u300c${row.title}\u300d(${row.version}) \u5417\uff1f`, '\u8b66\u544a', {
    type: 'warning',
    confirmButtonText: '\u786e\u5b9a',
    cancelButtonText: '\u53d6\u6d88',
  }).then(async () => {
    loading.value = true

    try {
      await standardApi.delete(row.id)
      await loadStandards()

      if (detailRow.value?.id === row.id) {
        detailRow.value = null
        drawerVisible.value = false
      }

      ElMessage.success('\u5220\u9664\u6210\u529f')
    } finally {
      loading.value = false
    }
  })
}

const handleEditFromDrawer = () => {
  if (detailRow.value && detailAccessState.value?.canEdit) {
    openDialog(detailRow.value)
    drawerVisible.value = false
  }
}

const getRowAccessState = (row: Standard) =>
  buildStandardAccessState(row, currentAccessContext.value)

const scopeLabel = (scopeId: string) =>
  scopeOptions.value.find((scope) => scope.id === scopeId)?.label || scopeId

const hasScopeAction = (scopeId: string, action: 'create' | 'manage') => {
  const scopePermission = currentAccessContext.value.scopePermissions.find(
    (permission) => permission.scopeId === scopeId,
  )

  return (
    currentAccessContext.value.isSuperAdmin ||
    Boolean(
      scopePermission?.actions.includes(action) || scopePermission?.actions.includes('manage'),
    )
  )
}

const validateForm = () => {
  if (!form.standardCode.trim()) {
    ElMessage.warning('\u8bf7\u8f93\u5165\u6807\u51c6\u7f16\u53f7')
    return false
  }
  if (!form.title.trim()) {
    ElMessage.warning('\u8bf7\u8f93\u5165\u6807\u51c6\u540d\u79f0')
    return false
  }
  if (!form.ownerScopeId.trim()) {
    ElMessage.warning('\u8bf7\u9009\u62e9\u7ef4\u62a4\u57df')
    return false
  }

  return true
}

const categoryType = (value: string) =>
  (({ law: 'danger', industry: 'warning', internal: 'primary', system: 'info' }) as any)[value] ||
  'info'
const categoryLabel = (value: string) =>
  (({ law: '\u6cd5\u5f8b\u6cd5\u89c4', industry: '\u884c\u4e1a\u89c4\u8303', internal: '\u5185\u90e8\u5236\u5ea6', system: '\u7cfb\u7edf\u5236\u5ea6' }) as any)[
    value
  ] || value
const statusType = (value: string) =>
  (({ active: 'success', draft: 'info', archived: 'warning' }) as any)[value] || 'info'
const statusLabel = (value: string) =>
  (({ active: '\u751f\u6548\u4e2d', draft: '\u8349\u7a3f', archived: '\u5df2\u5f52\u6863' }) as any)[value] || value

function syncSelectedRows() {
  if (detailRow.value) {
    updateDetailRow(detailRow.value.id)
  }

  if (editingRow.value) {
    editingRow.value =
      allStandards.value.find((item) => item.id === editingRow.value?.id) || editingRow.value
  }

  if (upgradeSourceRow.value) {
    upgradeSourceRow.value =
      allStandards.value.find((item) => item.id === upgradeSourceRow.value?.id) ||
      upgradeSourceRow.value
  }
}

function updateDetailRow(id: string) {
  detailRow.value = allStandards.value.find((item) => item.id === id) || null
  if (!detailRow.value) {
    drawerVisible.value = false
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalizePublishDate(value: string) {
  return value === '-' ? null : value
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

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: $iris-shadow-sm;
}

// 版本列样式
.version-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  .version-label {
    color: #64748b;
    font-weight: 500;
  }
  .version-count {
    font-size: 11px;
  }
}

// 升版弹窗
.upgrade-info {
  :deep(.el-descriptions__label) {
    width: 100px;
    white-space: nowrap;
  }
}

.version-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 12px;
  .type-label {
    font-weight: 600;
    font-size: 14px;
  }
  .type-preview {
    font-size: 12px;
    color: #94a3b8;
  }
}

// 详情抽屉
.detail-content {
  :deep(.el-descriptions__label) {
    width: 120px;
    white-space: nowrap;
  }

  .version-history {
    margin-top: 28px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
      color: $iris-text-primary;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;

      .version-count-label {
        font-size: 13px;
        font-weight: 400;
        color: #94a3b8;
      }
    }

    .timeline-card {
      padding: 10px 14px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
      cursor: pointer;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
      }

      &.is-current {
        background: #eff6ff;
        border-color: #bfdbfe;
      }

      &.is-expanded {
        background: #fff;
        border-color: #93c5fd;
      }

      .timeline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
      }

      .expand-icon {
        transition: transform 0.3s;
        color: #94a3b8;
        font-size: 14px;

        &.is-rotated {
          transform: rotate(180deg);
        }
      }

      .current-badge {
        font-size: 12px;
        color: #3b82f6;
        font-weight: 600;
      }

      .timeline-changelog {
        margin: 8px 0 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.5;
      }

      // 展开区域
      .version-detail {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed #e2e8f0;

        .version-desc {
          :deep(.el-descriptions__label) {
            width: 80px;
            white-space: nowrap;
          }
        }
      }

      // 变更对比
      .version-diff {
        margin-top: 12px;

        .diff-title {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .diff-items {
          background: #f1f5f9;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
        }

        .diff-row {
          padding: 6px 0;

          & + .diff-row {
            border-top: 1px solid #e2e8f0;
          }

          .diff-field {
            font-weight: 600;
            color: #334155;
            display: block;
            margin-bottom: 4px;
          }

          .diff-values {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .diff-old {
            color: #dc2626;
            background: #fef2f2;
            padding: 2px 8px;
            border-radius: 4px;
            display: flex;
            align-items: flex-start;
            gap: 4px;
            line-height: 1.6;
            word-break: break-all;
          }

          .diff-new {
            color: #16a34a;
            background: #f0fdf4;
            padding: 2px 8px;
            border-radius: 4px;
            display: flex;
            align-items: flex-start;
            gap: 4px;
            line-height: 1.6;
            word-break: break-all;
          }
        }

        .diff-empty {
          color: #94a3b8;
          font-size: 13px;
          font-style: italic;
        }
      }
    }
  }

  .drawer-actions {
    margin-top: 24px;
    display: flex;
    gap: 12px;
  }
}

:deep(.el-button.is-link) {
  padding: 4px 8px;
  height: auto;
  margin-left: 0;
  margin-right: 8px;

  &:last-child {
    margin-right: 0;
  }
}
</style>
