<template>
  <div class="page-container iris-page">
    <section class="checklists-hero">
      <div class="hero-copy">
        <span class="hero-kicker">资源库</span>
        <h2 class="page-title">内控清单管理</h2>
        <p class="page-subtitle">维护检查清单、检查项、控制频率与关联组织。</p>
      </div>
      <div class="hero-panel">
        <div class="hero-stat hero-stat-main">
          <span class="stat-label">清单总量</span>
          <strong>{{ checklistStats.total }}</strong>
          <span class="stat-note">当前筛选结果</span>
        </div>
        <div class="hero-stat">
          <span class="stat-label">启用中</span>
          <strong>{{ checklistStats.active }}</strong>
        </div>
        <div class="hero-stat">
          <span class="stat-label">草稿</span>
          <strong>{{ checklistStats.draft }}</strong>
        </div>
        <div class="hero-stat">
          <span class="stat-label">检查项</span>
          <strong>{{ checklistStats.items }}</strong>
        </div>
      </div>
      <div class="hero-actions">
        <el-button type="primary" :icon="Plus" size="large" @click="openDialog()"
          >新建清单</el-button
        >
        <el-button :icon="Upload" size="large">导入模版</el-button>
      </div>
    </section>

    <!-- 搜索 -->
    <div class="checklists-toolbar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="清单名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="名称、编号或描述"
            clearable
            class="keyword-input"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="全部状态"
            clearable
            class="status-select"
          >
            <el-option label="启用" value="active" />
            <el-option label="草稿" value="draft" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="searchForm.tagId" placeholder="全部标签" clearable class="tag-select">
            <el-option
              v-for="tag in CHECKLIST_TAG_OPTIONS"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格 -->
    <section class="table-shell">
      <div class="table-heading">
        <div>
          <h3>清单台账</h3>
          <p>按最新筛选结果展示，可展开维护检查项。</p>
        </div>
        <span class="table-count">当前 {{ filteredData.length }} 条</span>
      </div>
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
                <el-button
                  type="primary"
                  text
                  :icon="Plus"
                  size="small"
                  @click="openItemDialog(row)"
                  >添加检查项</el-button
                >
              </div>
              <el-table v-if="row.items?.length" :data="row.items" size="small" border>
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
                <el-table-column label="控制频率" width="120">
                  <template #default="{ row: item }">
                    {{ controlFrequencyLabel(item.controlFrequency) }}
                  </template>
                </el-table-column>
                <el-table-column label="评估类" width="120">
                  <template #default="{ row: item }">
                    <el-tag type="info" effect="light" size="small">
                      {{ evaluationTypeLabel(item.evaluationType) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="关联组织" min-width="180" show-overflow-tooltip>
                  <template #default="{ row: item }">
                    {{ organizationLabels(item.organizationIds).join('、') }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template #default="{ row: item, $index }">
                    <el-button
                      link
                      type="primary"
                      size="small"
                      @click="openItemDialog(row, item, $index)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      link
                      type="danger"
                      size="small"
                      @click="handleDeleteItem(row, $index)"
                      >删除</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="暂无检查项，点击上方按钮添加" :image-size="60" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="清单名称" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            <button class="checklist-title-button" type="button" @click="openDialog(row)">
              <span>{{ row.name }}</span>
              <small>{{ row.code }}</small>
            </button>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="检查项数" width="110" align="center">
          <template #default="{ row }">
            <el-tag effect="light" round :type="countChecklistItems(row) > 0 ? 'primary' : 'info'"
              >{{ countChecklistItems(row) }} 项</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="110" align="center">
          <template #default="{ row }">
            <el-tag effect="plain" type="info">{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="180">
          <template #default="{ row }">
            <div class="tag-list">
              <el-tag
                v-for="tag in checklistTagLabels(row)"
                :key="tag"
                size="small"
                effect="light"
                round
              >
                {{ tag }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="uploadDate" label="上传日期" width="130" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="dark" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
              <el-button link type="primary" size="small" @click="handleCopy(row)">复制</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- 新建/编辑清单抽屉 -->
    <el-drawer
      v-model="dialogVisible"
      size="720px"
      class="checklist-editor-drawer"
      destroy-on-close
    >
      <template #header>
        <div class="editor-header">
          <div>
            <span class="editor-kicker">{{ editingRow ? '维护清单' : '录入清单' }}</span>
            <h3>{{ editingRow ? '编辑清单' : '新建清单' }}</h3>
          </div>
          <el-tag v-if="editingRow" :type="statusType(editingRow.status)" effect="light" round>
            {{ statusLabel(editingRow.status) }}
          </el-tag>
        </div>
      </template>
      <el-form :model="form" label-position="top" size="large" class="checklist-editor-form">
        <section class="form-section">
          <div class="form-section-heading">
            <span>01</span>
            <div>
              <h4>基础信息</h4>
            </div>
          </div>
          <div class="form-grid">
            <el-form-item label="清单编号" required>
              <el-input v-model="form.code" placeholder="例如：CL-2026-001" />
            </el-form-item>
            <el-form-item label="版本" required>
              <el-input v-model="form.version" placeholder="如 V1.0" />
            </el-form-item>
          </div>
          <el-form-item label="清单名称" required>
            <el-input v-model="form.name" placeholder="例如：资金活动内控检查清单" />
          </el-form-item>
          <div class="form-grid">
            <el-form-item label="状态" required>
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="启用" value="active" />
                <el-option label="草稿" value="draft" />
                <el-option label="停用" value="disabled" />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="描述">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="清单用途描述"
            />
          </el-form-item>
        </section>

        <section class="form-section">
          <div class="form-section-heading">
            <span>02</span>
            <div>
              <h4>标签归类</h4>
            </div>
          </div>
          <div class="form-grid">
            <el-form-item label="主标签" required>
              <el-select v-model="form.primaryTagId" placeholder="选择主标签" style="width: 100%">
                <el-option
                  v-for="tag in CHECKLIST_TAG_OPTIONS"
                  :key="tag.value"
                  :label="tag.label"
                  :value="tag.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="辅标签">
              <el-select
                v-model="form.secondaryTagIds"
                multiple
                clearable
                collapse-tags
                collapse-tags-tooltip
                style="width: 100%"
              >
                <el-option
                  v-for="tag in CHECKLIST_TAG_OPTIONS"
                  :key="tag.value"
                  :label="tag.label"
                  :value="tag.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveChecklist">保存</el-button>
      </template>
    </el-drawer>

    <!-- 添加检查项抽屉 -->
    <el-drawer
      v-model="itemDialogVisible"
      size="640px"
      class="checklist-editor-drawer"
      destroy-on-close
    >
      <template #header>
        <div class="editor-header">
          <div>
            <span class="editor-kicker">检查项</span>
            <h3>{{ editingItemIndex === null ? '添加检查项' : '编辑检查项' }}</h3>
          </div>
        </div>
      </template>
      <el-form :model="itemForm" label-position="top" size="large" class="checklist-editor-form">
        <section class="form-section">
          <div class="form-section-heading">
            <span>01</span>
            <div>
              <h4>检查内容</h4>
            </div>
          </div>
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
        </section>

        <section class="form-section">
          <div class="form-section-heading">
            <span>02</span>
            <div>
              <h4>控制属性</h4>
            </div>
          </div>
          <div class="form-grid">
            <el-form-item label="控制频率" required>
              <el-select
                v-model="itemForm.controlFrequency"
                placeholder="选择控制频率"
                style="width: 100%"
              >
                <el-option
                  v-for="frequency in CONTROL_FREQUENCY_OPTIONS"
                  :key="frequency.value"
                  :label="frequency.label"
                  :value="frequency.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="评估类" required>
              <el-select
                v-model="itemForm.evaluationType"
                placeholder="选择评估类"
                style="width: 100%"
              >
                <el-option
                  v-for="evaluationType in EVALUATION_TYPE_OPTIONS"
                  :key="evaluationType.value"
                  :label="evaluationType.label"
                  :value="evaluationType.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <el-form-item label="关联组织" required>
            <el-select
              v-model="itemForm.organizationIds"
              multiple
              clearable
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择关联组织"
              style="width: 100%"
            >
              <el-option
                v-for="organization in CHECKLIST_ORGANIZATION_OPTIONS"
                :key="organization.value"
                :label="organization.label"
                :value="organization.value"
              />
            </el-select>
          </el-form-item>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveItem">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Plus, Refresh, Search, Upload } from '@element-plus/icons-vue'
import { mockChecklists } from '@/mock'
import type { ChecklistItem, ControlChecklist } from '@/types'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CHECKLIST_ORGANIZATION_OPTIONS,
  CHECKLIST_TAG_OPTIONS,
  CONTROL_FREQUENCY_OPTIONS,
  EVALUATION_TYPE_OPTIONS,
  countChecklistItems,
  optionLabel,
  tagLabels,
} from '@/features/checklists/checklist-data'

const searchForm = reactive({ keyword: '', status: '', tagId: '' })
const expandedKeys = ref<string[]>([])

const tableData = ref<ControlChecklist[]>(mockChecklists.map((item) => ({ ...item })))

const filteredData = computed(() => {
  return tableData.value.filter((item) => {
    if (
      searchForm.keyword &&
      !item.name.includes(searchForm.keyword) &&
      !item.code.includes(searchForm.keyword)
    )
      return false
    if (searchForm.status && item.status !== searchForm.status) return false
    if (
      searchForm.tagId &&
      item.primaryTagId !== searchForm.tagId &&
      !item.secondaryTagIds.includes(searchForm.tagId)
    )
      return false
    return true
  })
})

const checklistStats = computed(() => ({
  total: filteredData.value.length,
  active: filteredData.value.filter((item) => item.status === 'active').length,
  draft: filteredData.value.filter((item) => item.status === 'draft').length,
  items: filteredData.value.reduce((total, item) => total + countChecklistItems(item), 0),
}))

const handleSearch = () => {
  /* computed handles filtering */
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.tagId = ''
}
const handleExpandChange = (row: any, expandedRows: any[]) => {
  expandedKeys.value = expandedRows.map((r: any) => r.id)
}

// Checklist Dialog
const dialogVisible = ref(false)
const editingRow = ref<ControlChecklist | null>(null)
const form = reactive({
  code: '',
  name: '',
  description: '',
  version: 'V1.0',
  primaryTagId: '',
  secondaryTagIds: [] as string[],
  status: 'draft' as ControlChecklist['status'],
})

const openDialog = (row?: ControlChecklist) => {
  if (row) {
    editingRow.value = row
    form.code = row.code
    form.name = row.name
    form.description = row.description || ''
    form.version = row.version
    form.primaryTagId = row.primaryTagId || ''
    form.secondaryTagIds = [...row.secondaryTagIds]
    form.status = row.status
  } else {
    editingRow.value = null
    form.code = `CL-2026-${String(tableData.value.length + 1).padStart(3, '0')}`
    form.name = ''
    form.description = ''
    form.version = 'V1.0'
    form.primaryTagId = ''
    form.secondaryTagIds = []
    form.status = 'draft'
  }
  dialogVisible.value = true
}

const handleSaveChecklist = () => {
  if (!form.code.trim() || !form.name.trim() || !form.version.trim() || !form.primaryTagId) {
    ElMessage.warning('请填写清单编号、名称、版本和主标签')
    return
  }

  const now = new Date().toISOString().slice(0, 10)

  if (editingRow.value) {
    editingRow.value.code = form.code
    editingRow.value.name = form.name
    editingRow.value.description = form.description
    editingRow.value.version = form.version
    editingRow.value.primaryTagId = form.primaryTagId
    editingRow.value.secondaryTagIds = [...form.secondaryTagIds]
    editingRow.value.status = form.status
    editingRow.value.uploadDate = now
    editingRow.value.updatedAt = now
    ElMessage.success('修改已保存')
  } else {
    const newItem: ControlChecklist = {
      id: `chk-${Date.now()}`,
      code: form.code,
      name: form.name,
      description: form.description,
      version: form.version,
      primaryTagId: form.primaryTagId,
      secondaryTagIds: [...form.secondaryTagIds],
      items: [],
      status: form.status,
      uploadDate: now,
      createdAt: now,
      updatedAt: now,
    }
    tableData.value.unshift(newItem)
    ElMessage.success('清单已创建')
  }
  dialogVisible.value = false
}

// Item Dialog
const itemDialogVisible = ref(false)
const currentChecklist = ref<ControlChecklist | null>(null)
const editingItemIndex = ref<number | null>(null)
const itemForm = reactive({
  content: '',
  criterion: '',
  controlFrequency: '',
  evaluationType: '',
  organizationIds: [] as string[],
})

const openItemDialog = (row: ControlChecklist, item?: ChecklistItem, index?: number) => {
  currentChecklist.value = row
  editingItemIndex.value = typeof index === 'number' ? index : null
  itemForm.content = item?.content || ''
  itemForm.criterion = item?.criterion || ''
  itemForm.controlFrequency = item?.controlFrequency || ''
  itemForm.evaluationType = item?.evaluationType || ''
  itemForm.organizationIds = item ? [...item.organizationIds] : []
  itemDialogVisible.value = true
}

const handleSaveItem = () => {
  if (
    !itemForm.content.trim() ||
    !itemForm.criterion.trim() ||
    !itemForm.controlFrequency ||
    !itemForm.evaluationType ||
    itemForm.organizationIds.length === 0
  ) {
    ElMessage.warning('请填写必填项')
    return
  }

  const checklist = currentChecklist.value
  if (!checklist) {
    return
  }

  const items = checklist.items || []
  const nextItem: ChecklistItem = {
    id: `ci-${Date.now()}`,
    checklistId: checklist.id,
    sequence:
      editingItemIndex.value === null ? items.length + 1 : items[editingItemIndex.value]!.sequence,
    content: itemForm.content,
    criterion: itemForm.criterion,
    controlFrequency: itemForm.controlFrequency,
    evaluationType: itemForm.evaluationType,
    organizationIds: [...itemForm.organizationIds],
  }

  if (editingItemIndex.value === null) {
    items.push(nextItem)
  } else {
    items.splice(editingItemIndex.value, 1, {
      ...nextItem,
      id: items[editingItemIndex.value]!.id,
    })
  }

  checklist.items = items
  checklist.updatedAt = new Date().toISOString().slice(0, 10)
  ElMessage.success(editingItemIndex.value === null ? '检查项已添加' : '检查项已保存')
  itemDialogVisible.value = false
}

const handleCopy = (row: ControlChecklist) => {
  const now = new Date().toISOString().slice(0, 10)
  const copy: ControlChecklist = {
    ...row,
    id: `chk-${Date.now()}`,
    code: `CL-2026-${String(tableData.value.length + 1).padStart(3, '0')}`,
    name: row.name + ' (副本)',
    items: row.items.map((item) => ({
      ...item,
      id: `ci-${Date.now()}-${Math.random()}`,
    })),
    status: 'draft',
    uploadDate: now,
    createdAt: now,
    updatedAt: now,
  }
  tableData.value.unshift(copy)
  ElMessage.success('清单已复制')
}

const handleDelete = async (row: ControlChecklist) => {
  try {
    await ElMessageBox.confirm(`确认删除清单「${row.name}」吗？`, '警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    const idx = tableData.value.findIndex((item) => item.id === row.id)
    if (idx !== -1) {
      tableData.value.splice(idx, 1)
    }
    ElMessage.success('删除成功')
  } catch {
    // cancelled
  }
}

const handleDeleteItem = async (checklist: ControlChecklist, index: number) => {
  try {
    await ElMessageBox.confirm('确认删除该检查项吗？', '警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    checklist.items.splice(index, 1)
    ElMessage.success('检查项已删除')
  } catch {
    // cancelled
  }
}

const checklistTagLabels = (checklist: ControlChecklist) =>
  tagLabels(checklist.primaryTagId, checklist.secondaryTagIds)

const controlFrequencyLabel = (value: string) => optionLabel(CONTROL_FREQUENCY_OPTIONS, value)

const evaluationTypeLabel = (value: string) => optionLabel(EVALUATION_TYPE_OPTIONS, value)

const organizationLabels = (values: string[]) =>
  values.map((value) => optionLabel(CHECKLIST_ORGANIZATION_OPTIONS, value))

const statusType = (status: ControlChecklist['status']) =>
  ({ active: 'success', draft: 'info', disabled: 'warning' })[status]

const statusLabel = (status: ControlChecklist['status']) =>
  ({ active: '启用', draft: '草稿', disabled: '停用' })[status]
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.checklists-hero {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(420px, 0.9fr) auto;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 18px;
}

.hero-copy,
.hero-panel,
.checklists-toolbar,
.table-shell {
  background: oklch(99% 0.005 248);
  border: 1px solid oklch(91% 0.016 248);
  box-shadow: 0 10px 28px oklch(55% 0.035 248 / 8%);
}

.hero-copy {
  min-height: 142px;
  padding: 24px 28px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-kicker,
.editor-kicker {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: oklch(50% 0.1 250);
}

.page-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 760;
  color: oklch(24% 0.035 248);
}

.page-subtitle {
  max-width: 52ch;
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.7;
  color: oklch(48% 0.03 248);
}

.hero-panel {
  border-radius: 18px;
  padding: 16px;
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr;
  gap: 10px;
}

.hero-stat {
  min-width: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: oklch(97.5% 0.01 248);
  border: 1px solid oklch(92% 0.014 248);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.hero-stat-main {
  grid-row: span 2;
  background: oklch(95% 0.035 250);
  border-color: oklch(85% 0.06 250);
}

.stat-label,
.stat-note,
.table-count {
  font-size: 12px;
  color: oklch(50% 0.028 248);
}

.hero-stat strong {
  font-size: 25px;
  line-height: 1;
  font-weight: 760;
  color: oklch(28% 0.05 248);
}

.hero-stat-main strong {
  font-size: 38px;
  color: oklch(41% 0.14 250);
}

.hero-actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 10px;
}

.checklists-toolbar {
  margin-bottom: 18px;
  padding: 16px 18px 0;
  border-radius: 14px;

  :deep(.el-form) {
    display: flex;
    flex-wrap: wrap;
    gap: 0 10px;
  }
}

.keyword-input {
  width: 260px;
}

.status-select {
  width: 132px;
}

.tag-select {
  width: 150px;
}

.table-shell {
  border-radius: 16px;
  overflow: hidden;
}

.table-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px 14px;
  border-bottom: 1px solid oklch(92% 0.014 248);

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 720;
    color: oklch(26% 0.035 248);
  }

  p {
    margin-top: 5px;
    font-size: 13px;
    color: oklch(52% 0.028 248);
  }
}

.checklist-title-button {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  font: inherit;
  text-align: left;
  cursor: pointer;

  span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    color: oklch(35% 0.1 250);
    font-weight: 680;
    white-space: nowrap;
  }

  small {
    color: oklch(56% 0.026 248);
    font-size: 12px;
  }

  &:hover span {
    color: oklch(42% 0.15 250);
  }

  &:focus-visible {
    border-radius: 6px;
    outline: 2px solid oklch(68% 0.13 250);
    outline-offset: 3px;
  }
}

.tag-list,
.row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.row-actions {
  gap: 2px;
}

.checklist-detail {
  margin: 4px 12px 12px 54px;
  padding: 16px 18px;
  background: oklch(98.5% 0.006 248);
  border: 1px solid oklch(91% 0.014 248);
  border-radius: 12px;

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    h4 {
      font-size: 15px;
      color: oklch(26% 0.035 248);
      font-weight: 720;
    }
  }
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h3 {
    margin: 0;
    font-size: 18px;
    line-height: 1.25;
    font-weight: 760;
    color: oklch(25% 0.035 248);
  }
}

.checklist-editor-form {
  display: flex;
  flex-direction: column;
  gap: 10px;

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

.form-section {
  padding: 14px;
  border: 1px solid oklch(91% 0.014 248);
  border-radius: 12px;
  background: oklch(98.5% 0.006 248);
}

.form-section-heading {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;

  > span {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: oklch(94% 0.035 250);
    color: oklch(41% 0.13 250);
    font-size: 12px;
    font-weight: 760;
  }

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 720;
    color: oklch(26% 0.035 248);
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

:deep(.checklist-editor-drawer) {
  background: oklch(98% 0.006 248);
}

:deep(.checklist-editor-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 18px 20px 14px;
  border-bottom: 1px solid oklch(91% 0.014 248);
}

:deep(.checklist-editor-drawer .el-drawer__body) {
  padding: 14px;
  background: oklch(98% 0.006 248);
  overflow-y: auto;
}

:deep(.checklist-editor-drawer .el-drawer__footer) {
  padding: 12px 20px;
  border-top: 1px solid oklch(91% 0.014 248);
  background: oklch(99% 0.005 248);
}

:deep(.table-shell .el-table) {
  border-radius: 0;
  box-shadow: none;
}

:deep(.table-shell .el-table th.el-table__cell) {
  background: oklch(97% 0.01 248);
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

@media (max-width: 1180px) {
  .checklists-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .checklists-hero {
    gap: 12px;
  }

  .hero-copy,
  .hero-panel,
  .checklists-toolbar,
  .table-shell {
    border-radius: 12px;
  }

  .hero-copy {
    min-height: auto;
    padding: 18px;
  }

  .hero-panel,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .hero-stat-main {
    grid-row: auto;
  }

  .page-title {
    font-size: 23px;
  }

  .keyword-input,
  .status-select,
  .tag-select {
    width: 100%;
  }

  .table-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .checklist-detail {
    margin-left: 0;
  }
}
</style>
