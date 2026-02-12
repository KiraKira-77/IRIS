<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div class="left">
        <h2 class="page-title">标准管理</h2>
        <span class="page-subtitle">内控标准文档的统一维护与发布</span>
      </div>
      <div class="right">
        <el-button type="primary" :icon="Plus" size="large" @click="openDialog()"
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
      <el-table-column prop="id" label="标准编号" width="140">
        <template #default="{ row }">
          <el-tag effect="plain" type="info" class="font-mono">{{ row.id.toUpperCase() }}</el-tag>
        </template>
      </el-table-column>
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
      <el-table-column prop="tags" label="标签" width="180">
        <template #default="{ row }">
          <el-tag
            v-for="tag in row.tags"
            :key="tag"
            size="small"
            effect="plain"
            round
            style="margin-right: 4px"
            >{{ tag }}</el-tag
          >
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
          <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
          <el-button
            link
            type="success"
            size="small"
            @click="openUpgradeDialog(row)"
            v-if="row.status === 'active'"
            >升版</el-button
          >
          <el-button
            link
            type="danger"
            size="small"
            @click="handleDelete(row)"
            v-if="row.status !== 'active'"
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
        <el-form-item label="标签">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车"
            style="width: 100%"
          >
            <el-option label="内控" value="内控" />
            <el-option label="合规" value="合规" />
            <el-option label="IT审计" value="IT审计" />
            <el-option label="信息安全" value="信息安全" />
            <el-option label="财务" value="财务" />
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
            detailRow.id.toUpperCase()
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
          <el-descriptions-item label="发布日期">{{ detailRow.publishDate }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{
            detailRow.description || '暂无描述'
          }}</el-descriptions-item>
          <el-descriptions-item label="修订说明" v-if="detailRow.changeLog">
            {{ detailRow.changeLog }}
          </el-descriptions-item>
          <el-descriptions-item label="标签">
            <el-tag
              v-for="tag in detailRow.tags"
              :key="tag"
              size="small"
              effect="plain"
              round
              style="margin-right: 4px"
              >{{ tag }}</el-tag
            >
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
                      <el-descriptions-item label="标签">
                        <el-tag
                          v-for="tag in v.tags"
                          :key="tag"
                          size="small"
                          effect="plain"
                          round
                          style="margin-right: 4px"
                          >{{ tag }}</el-tag
                        >
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
          <el-button type="primary" @click="handleEditFromDrawer">编辑</el-button>
          <el-button
            type="success"
            v-if="detailRow.status === 'active'"
            @click="openUpgradeDialog(detailRow)"
          >
            <el-icon style="margin-right: 4px"><TopRight /></el-icon>
            升版
          </el-button>
          <el-button
            type="success"
            v-if="detailRow.status === 'draft'"
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
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Plus,
  Search,
  Refresh,
  Clock,
  TopRight,
  ArrowDown,
  EditPen,
  Switch,
  Remove,
  CirclePlus,
  RefreshLeft,
} from '@element-plus/icons-vue'
import { mockStandards } from '@/mock'
import type { Standard } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const searchForm = reactive({ keyword: '', category: '', status: '' })
// Initialize with mock data but keep it reactive for local CRUD
const allStandards = ref<Standard[]>(JSON.parse(JSON.stringify(mockStandards)))
const tableData = ref<Standard[]>([])
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

// Dialog state
const dialogVisible = ref(false)
const editingRow = ref<Standard | null>(null)
const form = reactive({
  title: '',
  category: '',
  version: 'V1.0',
  description: '',
  tags: [] as string[],
})

// Upgrade dialog state
const upgradeDialogVisible = ref(false)
const upgradeSourceRow = ref<Standard | null>(null)
const upgradeForm = reactive({
  newVersion: '',
  changeLog: '',
})

// Drawer state
const drawerVisible = ref(false)
const detailRow = ref<Standard | null>(null)

// 版本展开状态
const expandedVersions = reactive<Record<string, boolean>>({})

const toggleVersionExpand = (id: string) => {
  expandedVersions[id] = !expandedVersions[id]
}

// 版本差异对比
const getVersionChanges = (current: Standard, previous?: Standard) => {
  if (!previous) return []
  const changes: { field: string; label: string; oldVal: string; newVal: string }[] = []
  const fieldMap: { field: keyof Standard; label: string; format?: (v: any) => string }[] = [
    { field: 'description', label: '描述' },
    { field: 'category', label: '分类', format: categoryLabel },
    { field: 'tags', label: '标签', format: (v: string[]) => v.join(', ') },
    { field: 'title', label: '标准名称' },
  ]
  for (const { field, label, format } of fieldMap) {
    const oldRaw = previous[field]
    const newRaw = current[field]
    const oldStr = format ? format(oldRaw) : String(oldRaw ?? '')
    const newStr = format ? format(newRaw) : String(newRaw ?? '')
    if (oldStr !== newStr) {
      changes.push({ field, label, oldVal: oldStr, newVal: newStr })
    }
  }
  return changes
}

// 获取某组当前生效的版本 ID
const getCurrentActiveId = (groupId: string): string | null => {
  const active = allStandards.value.find(
    (s) => s.standardGroupId === groupId && s.status === 'active',
  )
  return active?.id ?? null
}

// 获取同组标准的版本数量（用于表格 badge）
const getVersionCount = (row: Standard) => {
  return allStandards.value.filter((s) => s.standardGroupId === row.standardGroupId).length
}

// 获取版本历史（按 versionNumber 排序）
const versionHistory = computed(() => {
  if (!detailRow.value) return []
  return allStandards.value
    .filter((s) => s.standardGroupId === detailRow.value!.standardGroupId)
    .sort((a, b) => b.versionNumber - a.versionNumber)
})

onMounted(() => {
  handleSearch()
})

const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    // 先过滤，再每组只取最新版本（versionNumber 最大的）
    const filtered = allStandards.value.filter((item) => {
      if (searchForm.keyword && !item.title.includes(searchForm.keyword)) return false
      if (searchForm.category && item.category !== searchForm.category) return false
      if (searchForm.status && item.status !== searchForm.status) return false
      return true
    })

    // 按 standardGroupId 分组，每组取 versionNumber 最大的
    const latestMap = new Map<string, Standard>()
    for (const item of filtered) {
      const existing = latestMap.get(item.standardGroupId)
      if (!existing || item.versionNumber > existing.versionNumber) {
        latestMap.set(item.standardGroupId, item)
      }
    }
    // 如果有状态过滤 (如 archived)，则显示所有匹配项而不只是最新版
    let result: Standard[]
    if (searchForm.status) {
      result = filtered
    } else {
      result = Array.from(latestMap.values())
    }

    pagination.total = result.length
    const start = (pagination.page - 1) * pagination.pageSize
    tableData.value = result.slice(start, start + pagination.pageSize)
    loading.value = false
  }, 200)
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  searchForm.status = ''
  pagination.page = 1
  handleSearch()
}

const openDialog = (row?: Standard) => {
  if (row) {
    editingRow.value = row
    form.title = row.title
    form.category = row.category
    form.version = row.version
    form.description = row.description || ''
    form.tags = [...row.tags]
  } else {
    editingRow.value = null
    form.title = ''
    form.category = ''
    form.version = 'V1.0'
    form.description = ''
    form.tags = []
  }
  dialogVisible.value = true
}

const openDetail = (row: Standard) => {
  detailRow.value = row
  drawerVisible.value = true
}

const openUpgradeDialog = (row: Standard) => {
  upgradeSourceRow.value = row
  upgradeForm.newVersion = ''
  upgradeForm.changeLog = ''
  upgradeDialogVisible.value = true
  // 如果从抽屉打开，先关闭抽屉
  drawerVisible.value = false
}

const handleSave = () => {
  if (!form.title) {
    ElMessage.warning('请输入标准名称')
    return
  }

  const currentRow = editingRow.value as any
  if (currentRow) {
    // Update existing
    const id = currentRow.id
    const index = allStandards.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      const updatedItem: any = {
        ...allStandards.value[index],
        title: form.title,
        category: (form.category || 'internal') as any,
        version: form.version,
        description: form.description,
        tags: [...form.tags],
        updatedAt: new Date().toISOString().slice(0, 10),
      }
      allStandards.value[index] = updatedItem
      ElMessage.success('修改已保存')
    }
  } else {
    // Create new
    const groupId = `std-${String(Date.now()).slice(-6)}`
    const newStandard: any = {
      id: groupId,
      title: form.title,
      category: (form.category || 'internal') as any,
      version: form.version || 'V1.0',
      publishDate: '-',
      status: 'draft',
      attachments: [],
      tags: [...form.tags],
      description: form.description,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      standardGroupId: groupId,
      versionNumber: 1,
      changeLog: '初始创建',
    }
    allStandards.value.unshift(newStandard)
    ElMessage.success('已保存为草稿')
  }

  dialogVisible.value = false
  handleSearch()
}

const handlePublish = () => {
  if (!form.title) {
    ElMessage.warning('请输入标准名称')
    return
  }

  const groupId = `std-${String(Date.now()).slice(-6)}`
  const newStandard: any = {
    id: groupId,
    title: form.title,
    category: (form.category || 'internal') as any,
    version: form.version || 'V1.0',
    publishDate: new Date().toISOString().slice(0, 10),
    status: 'active',
    attachments: [],
    tags: [...form.tags],
    description: form.description,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
    standardGroupId: groupId,
    versionNumber: 1,
    changeLog: '初始发布',
  }
  allStandards.value.unshift(newStandard)
  ElMessage.success('标准已发布')
  dialogVisible.value = false
  handleSearch()
}

const handlePublishFromDrawer = () => {
  const current = detailRow.value as any
  if (!current) return

  const index = allStandards.value.findIndex((item) => item.id === current.id)
  if (index !== -1) {
    const item = allStandards.value[index]
    if (item) {
      // 发布新版时，归档同组旧版
      allStandards.value.forEach((s) => {
        if (
          s.standardGroupId === item.standardGroupId &&
          s.id !== item.id &&
          s.status === 'active'
        ) {
          s.status = 'archived'
        }
      })
      item.status = 'active'
      item.publishDate = new Date().toISOString().slice(0, 10)
      detailRow.value = { ...item } as any
      ElMessage.success('标准已发布，旧版已自动归档')
    }
  }
  handleSearch()
}

const handleUpgrade = () => {
  if (!upgradeForm.newVersion) {
    ElMessage.warning('请输入新版本号')
    return
  }
  if (!upgradeForm.changeLog) {
    ElMessage.warning('请填写修订说明')
    return
  }
  const source = upgradeSourceRow.value
  if (!source) return

  // 获取该组最大 versionNumber
  const maxVN = Math.max(
    ...allStandards.value
      .filter((s) => s.standardGroupId === source.standardGroupId)
      .map((s) => s.versionNumber),
  )
  const newVN = maxVN + 1
  const newId = `${source.standardGroupId}-v${newVN}`

  const newDraft: any = {
    id: newId,
    title: source.title,
    category: source.category,
    version: upgradeForm.newVersion,
    publishDate: '-',
    status: 'draft',
    attachments: [],
    tags: [...source.tags],
    description: source.description,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
    standardGroupId: source.standardGroupId,
    versionNumber: newVN,
    previousVersionId: source.id,
    changeLog: upgradeForm.changeLog,
  }

  allStandards.value.unshift(newDraft)
  upgradeDialogVisible.value = false
  ElMessage.success(`已创建 ${upgradeForm.newVersion} 版本草稿`)
  handleSearch()

  // 打开编辑窗口让用户修改内容
  setTimeout(() => {
    openDialog(newDraft)
  }, 300)
}

// 回退弹窗
const openRollbackDialog = (targetVersion: Standard) => {
  ElMessageBox.prompt(
    `将基于「${targetVersion.version}」的内容创建新版本草稿，请输入回退原因：`,
    `回退到 ${targetVersion.version}`,
    {
      confirmButtonText: '确认回退',
      cancelButtonText: '取消',
      type: 'warning',
      inputType: 'textarea',
      inputPlaceholder: '请输入回退原因',
      inputValidator: (val: string) => {
        if (!val || !val.trim()) return '回退原因不能为空'
        return true
      },
    },
  ).then((result) => {
    const reason = typeof result === 'string' ? result : (result as any).value
    handleRollback(targetVersion, reason)
  })
}

const handleRollback = (targetVersion: Standard, reason: string) => {
  // 获取该组最大 versionNumber
  const maxVN = Math.max(
    ...allStandards.value
      .filter((s) => s.standardGroupId === targetVersion.standardGroupId)
      .map((s) => s.versionNumber),
  )
  const newVN = maxVN + 1
  const newId = `${targetVersion.standardGroupId}-v${newVN}`

  const rollbackDraft: any = {
    id: newId,
    title: targetVersion.title,
    category: targetVersion.category,
    version: `${targetVersion.version}(回退)`,
    publishDate: '-',
    status: 'draft',
    attachments: [],
    tags: [...targetVersion.tags],
    description: targetVersion.description,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
    standardGroupId: targetVersion.standardGroupId,
    versionNumber: newVN,
    previousVersionId: targetVersion.id,
    changeLog: `[回退] 回退至 ${targetVersion.version}：${reason}`,
  }

  allStandards.value.unshift(rollbackDraft)
  ElMessage.success(`已创建回退草稿，可编辑后发布`)
  handleSearch()

  // 更新详情抽屉到新版本
  detailRow.value = rollbackDraft
}

const handleDelete = (row: Standard) => {
  ElMessageBox.confirm(`确认删除标准「${row.title}」(${row.version}) 吗？`, '警告', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(() => {
    allStandards.value = allStandards.value.filter((item) => item.id !== row.id)
    ElMessage.success('删除成功')
    handleSearch()
  })
}

const handleEditFromDrawer = () => {
  if (detailRow.value) {
    openDialog(detailRow.value)
    drawerVisible.value = false
  }
}

// Helpers
const categoryType = (val: string) =>
  (({ law: 'danger', industry: 'warning', internal: 'primary', system: 'info' }) as any)[val] ||
  'info'
const categoryLabel = (val: string) =>
  (({ law: '法律法规', industry: '行业规范', internal: '内部制度', system: '系统制度' }) as any)[
    val
  ] || val
const statusType = (val: string) =>
  (({ active: 'success', draft: 'info', archived: 'warning' }) as any)[val] || 'info'
const statusLabel = (val: string) =>
  (({ active: '生效中', draft: '草稿', archived: '已归档' }) as any)[val] || val
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
