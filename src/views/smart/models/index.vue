<template>
  <div class="page-container iris-page model-library">
    <div class="page-header">
      <div>
        <h2 class="page-title">模型库</h2>
        <p class="page-subtitle">配置可调用的大语言模型，供后续内控分析、工单总结和整改建议使用</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增模型</el-button>
    </div>

    <div class="summary-strip">
      <div>
        <span>模型总数</span>
        <strong>{{ total }}</strong>
      </div>
      <div>
        <span>在线模型</span>
        <strong>{{ onlineCount }}</strong>
      </div>
      <div>
        <span>默认模型</span>
        <strong>{{ defaultModelName }}</strong>
      </div>
      <div>
        <span>密钥未配置</span>
        <strong>{{ missingKeyCount }}</strong>
      </div>
    </div>

    <div class="toolbar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键字">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索模型名称、服务商或接口地址"
            style="width: 260px"
            @keyup.enter="loadModels"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item label="协议">
          <el-select
            v-model="filters.providerType"
            clearable
            placeholder="全部协议"
            style="width: 180px"
          >
            <el-option label="OpenAI Compatible" value="openai_compatible" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" @click="loadModels">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-shell">
      <el-table v-loading="loading" :data="models" row-key="id" stripe>
        <el-table-column label="模型配置" min-width="260">
          <template #default="{ row }">
            <div class="model-title">
              <span>{{ row.name }}</span>
              <el-tag v-if="row.defaultModel" size="small" type="warning">默认模型</el-tag>
            </div>
            <div class="model-meta">{{ providerLabel(row.providerType) }} / {{ row.provider }}</div>
          </template>
        </el-table-column>
        <el-table-column label="接口地址" prop="baseUrl" min-width="280" show-overflow-tooltip />
        <el-table-column label="模型名称" prop="modelName" min-width="160" show-overflow-tooltip />
        <el-table-column label="密钥状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.apiKeyConfigured ? 'success' : 'danger'" effect="light">
              {{ row.apiKeyConfigured ? '已配置' : '未配置' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'info'">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="调用参数" min-width="190">
          <template #default="{ row }">
            <div class="param-line">超时 {{ row.timeoutSeconds }} 秒</div>
            <div class="param-line">温度 {{ row.temperature }}，最大 Token {{ row.maxTokens }}</div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" prop="updatedAt" min-width="160" />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" :icon="Connection" @click="handleTest(row)">
                连通性测试
              </el-button>
              <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 50]"
          @current-change="loadModels"
          @size-change="loadModels"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
      <el-form label-width="112px" :model="form">
        <el-form-item label="配置名称" required>
          <el-input v-model="form.name" placeholder="例如：整改建议生成模型" />
        </el-form-item>
        <el-form-item label="协议类型" required>
          <el-select v-model="form.providerType" disabled style="width: 100%">
            <el-option label="OpenAI Compatible" value="openai_compatible" />
          </el-select>
        </el-form-item>
        <el-form-item label="接口地址" required>
          <el-input v-model="form.baseUrl" placeholder="例如：https://api.example.com/v1" />
        </el-form-item>
        <el-form-item label="模型名称" required>
          <el-input v-model="form.modelName" placeholder="例如：deepseek-chat / qwen-plus" />
        </el-form-item>
        <el-form-item label="API Key" :required="!editingModelId">
          <el-input
            v-model="form.apiKey"
            type="password"
            show-password
            placeholder="新增时必填，编辑时留空表示不更新密钥"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-radio-group v-model="form.status">
            <el-radio-button label="online">在线</el-radio-button>
            <el-radio-button label="offline">离线</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="默认模型">
          <el-switch v-model="form.defaultModel" active-text="设为默认" />
        </el-form-item>
        <el-form-item label="超时时间">
          <el-input-number v-model="form.timeoutSeconds" :min="1" :max="120" />
          <span class="form-hint">秒</span>
        </el-form-item>
        <el-form-item label="温度">
          <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="最大 Token">
          <el-input-number v-model="form.maxTokens" :min="1" :max="128000" />
        </el-form-item>
        <el-form-item label="用途说明">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="说明该模型用于哪些 AI 场景"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'
import { modelApi } from '@/api'
import type { AIModel, AIModelProviderType, AIModelStatus, AIModelUpsertPayload } from '@/types'

type ModelPage = {
  records?: AIModel[]
  list?: AIModel[]
  total?: number
  pageNo?: number
  page?: number
  pageSize?: number
}

const models = ref<AIModel[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingModelId = ref('')
const total = ref(0)

const filters = reactive({
  keyword: '',
  providerType: '' as '' | AIModelProviderType,
  status: '' as '' | AIModelStatus,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const emptyForm = (): AIModelUpsertPayload => ({
  name: '',
  providerType: 'openai_compatible',
  baseUrl: '',
  modelName: '',
  apiKey: '',
  status: 'online',
  defaultModel: false,
  timeoutSeconds: 30,
  temperature: 0.2,
  maxTokens: 3000,
  remark: '',
})

const form = reactive<AIModelUpsertPayload>(emptyForm())

const dialogTitle = computed(() => (editingModelId.value ? '编辑模型配置' : '新增模型配置'))
const onlineCount = computed(() => models.value.filter((model) => model.status === 'online').length)
const missingKeyCount = computed(
  () => models.value.filter((model) => !model.apiKeyConfigured).length,
)
const defaultModelName = computed(
  () => models.value.find((model) => model.defaultModel)?.name || '未设置',
)

watch(
  () => [filters.status, filters.providerType],
  () => {
    pagination.page = 1
    loadModels()
  },
)

onMounted(() => {
  loadModels()
})

const loadModels = async () => {
  loading.value = true
  try {
    const page = (await modelApi.list({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword.trim() || undefined,
      providerType: filters.providerType || undefined,
      status: filters.status || undefined,
    })) as ModelPage
    models.value = page.records || page.list || []
    total.value = page.total || models.value.length
    pagination.page = page.pageNo || page.page || pagination.page
    pagination.pageSize = page.pageSize || pagination.pageSize
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  editingModelId.value = ''
  Object.assign(form, emptyForm())
  dialogVisible.value = true
}

const openEditDialog = (model: AIModel) => {
  editingModelId.value = model.id
  Object.assign(form, {
    name: model.name,
    providerType: model.providerType,
    baseUrl: model.baseUrl,
    modelName: model.modelName,
    apiKey: '',
    status: model.status,
    defaultModel: model.defaultModel,
    timeoutSeconds: model.timeoutSeconds,
    temperature: model.temperature,
    maxTokens: model.maxTokens,
    remark: model.remark || '',
  })
  dialogVisible.value = true
}

const handleSave = async () => {
  const payload = normalizePayload()
  if (!payload) return

  saving.value = true
  try {
    if (editingModelId.value) {
      await modelApi.update(editingModelId.value, payload)
      ElMessage.success('模型配置已更新')
    } else {
      await modelApi.create(payload)
      ElMessage.success('模型配置已创建')
    }
    dialogVisible.value = false
    loadModels()
  } finally {
    saving.value = false
  }
}

const handleDelete = async (model: AIModel) => {
  await ElMessageBox.confirm(`确认删除模型配置“${model.name}”吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })
  await modelApi.delete(model.id)
  ElMessage.success('模型配置已删除')
  loadModels()
}

const handleTest = async (model: AIModel) => {
  const result = await modelApi.test(model.id)
  if (result.success) {
    ElMessage.success(`连通性测试通过，耗时 ${result.latencyMs ?? 0}ms`)
    return
  }
  ElMessage.error(result.message || '连通性测试失败')
}

const normalizePayload = (): AIModelUpsertPayload | null => {
  const payload: AIModelUpsertPayload = {
    name: form.name.trim(),
    providerType: form.providerType,
    baseUrl: form.baseUrl.trim(),
    modelName: form.modelName.trim(),
    apiKey: form.apiKey?.trim() || undefined,
    status: form.status,
    defaultModel: form.defaultModel,
    timeoutSeconds: Number(form.timeoutSeconds || 30),
    temperature: Number(form.temperature ?? 0.2),
    maxTokens: Number(form.maxTokens || 3000),
    remark: form.remark?.trim() || undefined,
  }

  if (!payload.name || !payload.baseUrl || !payload.modelName) {
    ElMessage.warning('请填写配置名称、接口地址和模型名称')
    return null
  }
  if (!editingModelId.value && !payload.apiKey) {
    ElMessage.warning('新增模型时需要填写 API Key')
    return null
  }
  return payload
}

const providerLabel = (providerType: AIModelProviderType) =>
  providerType === 'openai_compatible' ? 'OpenAI Compatible' : providerType

const statusLabel = (status: AIModelStatus) => (status === 'online' ? '在线' : '离线')
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.model-library {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 26px;
    font-weight: 700;
    color: $iris-text-primary;
  }

  .page-subtitle {
    margin-top: 8px;
    color: $iris-text-secondary;
  }
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin-bottom: 18px;
  border: 1px solid oklch(91% 0.012 235);
  border-radius: 8px;
  background: oklch(91% 0.012 235);

  div {
    padding: 16px 18px;
    background: oklch(98% 0.004 235);
  }

  span {
    display: block;
    margin-bottom: 8px;
    color: $iris-text-secondary;
    font-size: 13px;
  }

  strong {
    display: block;
    overflow: hidden;
    color: $iris-text-primary;
    font-size: 22px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.toolbar {
  margin-bottom: 14px;
  padding: 16px 18px 0;
  border: 1px solid oklch(91% 0.012 235);
  border-radius: 8px;
  background: oklch(98% 0.004 235);
}

.table-shell {
  border: 1px solid oklch(91% 0.012 235);
  border-radius: 8px;
  background: oklch(98% 0.004 235);
}

.model-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: $iris-text-primary;
}

.model-meta,
.param-line {
  margin-top: 4px;
  color: $iris-text-secondary;
  font-size: 13px;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 14px 16px;
}

.form-hint {
  margin-left: 8px;
  color: $iris-text-secondary;
}

@media (max-width: 900px) {
  .model-library .page-header {
    flex-direction: column;
  }

  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
