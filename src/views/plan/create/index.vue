<template>
  <div class="page-container iris-page">
    <!-- Header -->
    <div class="create-header">
      <div class="header-left">
        <el-button link :icon="Back" @click="router.push('/plan/list')">返回列表</el-button>
        <h2 class="page-title">{{ pageTitle }}</h2>
        <el-tag
          v-if="parentPlan"
          effect="light"
          type="warning"
          size="large"
          style="margin-left: 12px"
        >
          所属主计划：{{ parentPlan.name }}
        </el-tag>
      </div>
    </div>

    <!-- Steps -->
    <div class="steps-wrapper">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="基本信息" description="计划名称与属期" :icon="Document" />
        <el-step title="检查范围" description="配置检查项与人员" :icon="List" />
        <el-step title="预览确认" description="确认并提交" :icon="CircleCheck" />
      </el-steps>
    </div>

    <!-- Step Content -->
    <div class="step-content">
      <!-- STEP 1: Basic Info -->
      <div v-show="currentStep === 0" class="step-panel">
        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-title">
              <el-icon class="title-icon"><Document /></el-icon>
              <span>计划基本信息</span>
            </div>
          </template>
          <el-form
            ref="basicFormRef"
            :model="form"
            :rules="basicRules"
            label-width="100px"
            label-position="top"
            size="large"
          >
            <el-form-item label="计划名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="例如：2026年第一季度信息系统内控检查计划"
                maxlength="80"
                show-word-limit
              />
            </el-form-item>

            <el-row :gutter="24">
              <el-col :span="8">
                <el-form-item label="所属年度" prop="year">
                  <el-date-picker
                    v-model="form.year"
                    type="year"
                    placeholder="选择年度"
                    style="width: 100%"
                    value-format="YYYY"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="计划频次" prop="cycle">
                  <el-select
                    v-model="form.cycle"
                    placeholder="选择频次"
                    style="width: 100%"
                    @change="onCycleChange"
                  >
                    <el-option label="年度" value="yearly" />
                    <el-option label="半年度" value="half-yearly" />
                    <el-option label="季度" value="quarterly" />
                    <el-option label="月度" value="monthly" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="属期" prop="period">
                  <el-select v-model="form.period" placeholder="选择属期" style="width: 100%">
                    <el-option
                      v-for="p in periodOptions"
                      :key="p.value"
                      :label="p.label"
                      :value="p.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="维护域" prop="ownerScopeId">
                  <el-select v-model="form.ownerScopeId" placeholder="选择维护域" style="width: 100%">
                    <el-option
                      v-for="scope in activeResourceScopes"
                      :key="scope.id"
                      :label="scope.scopeName"
                      :value="scope.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="共享域">
                  <el-select
                    v-model="form.grantScopeIds"
                    multiple
                    placeholder="选择可查看该计划的共享域"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="scope in activeResourceScopes"
                      :key="scope.id"
                      :label="scope.scopeName"
                      :value="scope.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="计划说明" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="简要描述本次计划的背景、目标和重点检查领域"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- STEP 2: Plan Items -->
      <div v-show="currentStep === 1" class="step-panel">
        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-title">
              <el-icon class="title-icon"><List /></el-icon>
              <span>检查范围配置</span>
              <el-tag effect="light" round size="small" class="count-tag">
                已添加 {{ planItems.length }} 项
              </el-tag>
            </div>
          </template>

          <!-- Existing items -->
          <div v-if="planItems.length" class="plan-items-list">
            <div v-for="(item, index) in planItems" :key="index" class="plan-item-card">
              <div class="item-header">
                <span class="item-index"># {{ index + 1 }}</span>
                <span class="item-scope">{{ item.targetScope }}</span>
                <el-button type="danger" link :icon="Delete" @click="removePlanItem(index)"
                  >删除</el-button
                >
              </div>
              <div class="item-body">
                <div class="item-detail">
                  <label>关联检查清单</label>
                  <div class="checklist-tags">
                    <el-tag
                      v-for="clId in item.checklistIds"
                      :key="clId"
                      effect="plain"
                      size="small"
                      >{{ getChecklistName(clId) }}</el-tag
                    >
                  </div>
                </div>
                <div class="item-meta">
                  <span class="meta">
                    <el-icon><Calendar /></el-icon>
                    {{ item.plannedStartDate }} ~ {{ item.plannedEndDate }}
                  </span>
                  <span class="meta" v-if="item.assignee">
                    <el-icon><User /></el-icon>
                    {{ getPersonnelName(item.assignee) }}
                  </span>
                </div>
                <div class="item-remark" v-if="item.remark">
                  <span class="remark-text">{{ item.remark }}</span>
                </div>
              </div>
            </div>
          </div>

          <el-empty v-else description="暂未添加检查范围，请点击下方按钮添加" :image-size="80" />

          <!-- Add item form -->
          <el-divider />
          <div class="add-item-section">
            <h4 class="section-title">
              <el-icon><CirclePlus /></el-icon>
              添加检查范围
            </h4>
            <el-form
              ref="itemFormRef"
              :model="newItem"
              :rules="itemRules"
              label-width="100px"
              label-position="top"
              size="default"
            >
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="检查范围 / 对象" prop="targetScope">
                    <el-input
                      v-model="newItem.targetScope"
                      placeholder="例如：财务部-资金支付流程"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="负责人" prop="assignee">
                    <el-select
                      v-model="newItem.assignee"
                      placeholder="选择负责人"
                      style="width: 100%"
                      clearable
                    >
                      <el-option
                        v-for="p in personnelOptions"
                        :key="p.id"
                        :label="`${p.username} (${p.account})`"
                        :value="p.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="关联检查清单" prop="checklistIds">
                <el-select
                  v-model="newItem.checklistIds"
                  multiple
                  placeholder="选择关联的检查清单（可多选）"
                  style="width: 100%"
                >
                  <el-option
                    v-for="cl in checklistOptions"
                    :key="cl.id"
                    :label="cl.name"
                    :value="cl.id"
                  >
                    <span style="float: left">{{ cl.name }}</span>
                    <span style="float: right; margin-left: 16px; font-size: 12px; color: #909399">
                      {{ cl.items.length }} 项
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="计划时间范围" prop="dateRange">
                    <el-date-picker
                      v-model="newItem.dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      style="width: 100%"
                      value-format="YYYY-MM-DD"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="备注">
                    <el-input v-model="newItem.remark" placeholder="可选备注" />
                  </el-form-item>
                </el-col>
              </el-row>

              <div class="add-btn-row">
                <el-button type="primary" :icon="Plus" @click="addPlanItem"> 确认添加 </el-button>
              </div>
            </el-form>
          </div>
        </el-card>
      </div>

      <!-- STEP 3: Review -->
      <div v-show="currentStep === 2" class="step-panel">
        <el-card shadow="never" class="form-card review-card">
          <template #header>
            <div class="card-title">
              <el-icon class="title-icon"><CircleCheck /></el-icon>
              <span>预览确认</span>
            </div>
          </template>

          <div class="review-section">
            <h4 class="review-label">基本信息</h4>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="计划名称" :span="3">{{
                form.name
              }}</el-descriptions-item>
              <el-descriptions-item label="所属年度">{{ form.year }}</el-descriptions-item>
              <el-descriptions-item label="计划频次">{{ cycleLabel }}</el-descriptions-item>
              <el-descriptions-item label="属期">{{ form.period }}</el-descriptions-item>
              <el-descriptions-item label="维护域">{{ getScopeName(form.ownerScopeId) }}</el-descriptions-item>
              <el-descriptions-item label="共享域" :span="2">
                {{ form.grantScopeIds.map(getScopeName).join('、') || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="计划说明" :span="3">
                {{ form.description || '—' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="review-section">
            <h4 class="review-label">检查范围 ({{ planItems.length }})</h4>
            <el-table :data="planItems" border stripe size="default" style="width: 100%">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column prop="targetScope" label="检查范围" min-width="180" />
              <el-table-column label="关联清单" min-width="200">
                <template #default="{ row }">
                  <el-tag
                    v-for="clId in row.checklistIds"
                    :key="clId"
                    size="small"
                    effect="plain"
                    style="margin: 2px 4px 2px 0"
                    >{{ getChecklistName(clId) }}</el-tag
                  >
                </template>
              </el-table-column>
              <el-table-column label="计划时间" width="220">
                <template #default="{ row }">
                  {{ row.plannedStartDate }} ~ {{ row.plannedEndDate }}
                </template>
              </el-table-column>
              <el-table-column label="负责人" width="140">
                <template #default="{ row }">
                  {{ row.assignee ? getPersonnelName(row.assignee) : '—' }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="bottom-actions">
      <el-button v-if="currentStep > 0" @click="currentStep--" :icon="ArrowLeft" size="large">
        上一步
      </el-button>
      <div class="spacer"></div>
      <el-button v-if="currentStep < 2" type="primary" size="large" @click="nextStep">
        下一步
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
      <el-button v-if="isEdit" type="primary" size="large" @click="handleSaveEdit">
        <el-icon><EditPen /></el-icon>
        保存修改
      </el-button>
      <template v-if="currentStep === 2">
        <el-button v-if="canSaveDraft" size="large" @click="handleSaveDraft">
          <el-icon><EditPen /></el-icon>
          保存草稿
        </el-button>
        <el-button v-if="canSubmitPlan" type="primary" size="large" @click="handleSubmit">
          <el-icon><Promotion /></el-icon>
          提交计划
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Back,
  EditPen,
  Document,
  List,
  CircleCheck,
  Plus,
  Delete,
  Calendar,
  User,
  CirclePlus,
  ArrowLeft,
  ArrowRight,
  Promotion,
} from '@element-plus/icons-vue'
import { checklistApi, planApi, resourceScopeApi, systemUserApi } from '@/api'
import { normalizeChecklistPageFromApi } from '@/features/checklists/checklist-data'
import {
  filterPlanAssigneeUsers,
  resolvePlanAssigneeScopeIds,
} from '@/features/plans/plan-assignee-options'
import {
  PLAN_SUBMIT_STATUS,
  createPlanUpsertPayload,
  resolvePlanPeriodDateRange,
} from '@/features/plans/plan-data'
import type {
  ControlChecklist,
  ControlPlan,
  PlanCycle,
  PlanItem,
  PlanStatus,
  ResourceScope,
  ResourceScopeMember,
  SystemUser,
} from '@/types'

const router = useRouter()
const route = useRoute()

// ==================
// Edit Mode & Sub-plan Mode
// ==================
const isEdit = ref(false)
const editId = ref('')
const currentPlanStatus = ref<PlanStatus>('draft')
const isSubPlan = ref(false)
const parentPlanId = ref('')
const parentPlan = ref<ControlPlan | null>(null)
const resourceScopes = ref<ResourceScope[]>([])
const checklists = ref<ControlChecklist[]>([])
const users = ref<SystemUser[]>([])
const assigneeScopeMembers = ref<ResourceScopeMember[]>([])
const activeResourceScopes = computed(() => resourceScopes.value.filter((scope) => scope.status === 1))

const pageTitle = computed(() => {
  if (isEdit.value) return '编辑计划'
  if (isSubPlan.value) return '新建子计划'
  return '新建年度计划'
})

onMounted(async () => {
  await Promise.all([loadResourceScopes(), loadChecklists(), loadUsers()])
  // Edit mode
  const id = route.query.id as string
  if (id) {
    const plan = await planApi.detail(id)
    if (plan) {
      isEdit.value = true
      editId.value = id
      currentPlanStatus.value = plan.status
      if (plan.parentId) {
        isSubPlan.value = true
        parentPlanId.value = plan.parentId
        parentPlan.value = await planApi.detail(plan.parentId)
      }
      form.name = plan.name
      form.year = String(plan.year)
      form.cycle = plan.cycle
      form.period = plan.period
      form.description = plan.description || ''
      form.ownerScopeId = plan.ownerScopeId
      form.grantScopeIds = plan.grants?.map((grant) => grant.scopeId) || []
      planItems.value = plan.items.map((item) => ({
        sequence: item.sequence,
        targetScope: item.targetScope,
        checklistIds: [...item.checklistIds],
        plannedStartDate: item.plannedStartDate || '',
        plannedEndDate: item.plannedEndDate || '',
        assignee: item.assignee,
        remark: item.remark,
      }))
    }
    await loadAssigneeScopeMembers()
    return
  }

  // Sub-plan creation mode
  const pid = route.query.parentId as string
  if (pid) {
    const parent = await planApi.detail(pid)
    if (parent) {
      isSubPlan.value = true
      parentPlanId.value = pid
      parentPlan.value = parent
      form.year = String(parent.year)
      form.cycle = 'monthly'
      form.period = getDefaultPeriodByCycle(form.cycle)
      form.ownerScopeId = parent.ownerScopeId
      form.grantScopeIds = parent.grants?.map((grant) => grant.scopeId) || []
      // Inherit parent's checklist items as default
      const [plannedStartDate, plannedEndDate] = resolvePlanPeriodDateRange(
        Number(form.year),
        form.cycle as PlanCycle,
        form.period,
      )
      planItems.value = parent.items.map((item, i) => ({
        sequence: i + 1,
        targetScope: item.targetScope,
        checklistIds: [...item.checklistIds],
        plannedStartDate,
        plannedEndDate,
        assignee: item.assignee,
        remark: item.remark,
      }))
      applySubPlanPeriodDateRange()
    }
  }
  await loadAssigneeScopeMembers()
})

// ==================
// Step management
// ==================
const currentStep = ref(0)
const basicFormRef = ref<FormInstance>()
const itemFormRef = ref<FormInstance>()

const canSaveDraft = computed(() => !isEdit.value || currentPlanStatus.value === 'draft')
const canSubmitPlan = computed(() => !isEdit.value || currentPlanStatus.value === 'draft')

// ==================
// Step 1: Basic Info
// ==================
const form = reactive({
  name: '',
  year: '',
  cycle: '',
  period: '',
  description: '',
  ownerScopeId: '',
  grantScopeIds: [] as string[],
})

const basicRules: FormRules = {
  name: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  year: [{ required: true, message: '请选择年度', trigger: 'change' }],
  cycle: [{ required: true, message: '请选择频次', trigger: 'change' }],
  period: [{ required: true, message: '请选择属期', trigger: 'change' }],
  ownerScopeId: [{ required: true, message: '请选择维护域', trigger: 'change' }],
}

const periodOptions = computed(() => {
  switch (form.cycle) {
    case 'yearly':
      return [{ label: '全年', value: '全年' }]
    case 'half-yearly':
      return [
        { label: '上半年 (H1)', value: 'H1' },
        { label: '下半年 (H2)', value: 'H2' },
      ]
    case 'quarterly':
      return [
        { label: '第一季度 (Q1)', value: 'Q1' },
        { label: '第二季度 (Q2)', value: 'Q2' },
        { label: '第三季度 (Q3)', value: 'Q3' },
        { label: '第四季度 (Q4)', value: 'Q4' },
      ]
    case 'monthly':
      return Array.from({ length: 12 }, (_, i) => ({
        label: `${i + 1}月`,
        value: `M${i + 1}`,
      }))
    default:
      return []
  }
})

const cycleLabel = computed(() => {
  const map: Record<string, string> = {
    yearly: '年度',
    'half-yearly': '半年度',
    quarterly: '季度',
    monthly: '月度',
  }
  return map[form.cycle] || ''
})

const getDefaultPeriodByCycle = (cycle: string) => {
  const defaults: Record<PlanCycle, string> = {
    yearly: '全年',
    'half-yearly': 'H1',
    quarterly: 'Q1',
    monthly: 'M1',
  }
  return defaults[cycle as PlanCycle] || ''
}

const onCycleChange = () => {
  form.period = isSubPlan.value ? getDefaultPeriodByCycle(form.cycle) : ''
}

// ==================
// Step 2: Plan Items
// ==================
const planItems = ref<Omit<PlanItem, 'id' | 'planId'>[]>([])

const newItem = reactive({
  targetScope: '',
  checklistIds: [] as string[],
  dateRange: null as [string, string] | null,
  assignee: '',
  remark: '',
})

const itemRules: FormRules = {
  targetScope: [{ required: true, message: '请输入检查范围', trigger: 'blur' }],
  checklistIds: [{ required: true, message: '请选择检查清单', trigger: 'change', type: 'array' }],
  dateRange: [{ required: true, message: '请选择时间范围', trigger: 'change' }],
}

const checklistOptions = computed(() => checklists.value.filter((c) => c.status === 'active'))

const assigneeScopeIds = computed(() =>
  resolvePlanAssigneeScopeIds(form.ownerScopeId, form.grantScopeIds),
)

const personnelOptions = computed(() =>
  filterPlanAssigneeUsers(users.value, assigneeScopeMembers.value),
)

const getChecklistName = (id: string) => {
  return checklists.value.find((c) => c.id === id)?.name || id
}

const getPersonnelName = (id: string) => {
  return users.value.find((p) => p.id === id)?.username || id
}

const loadChecklists = async () => {
  const page = normalizeChecklistPageFromApi(
    await checklistApi.list({ page: 1, pageSize: 100, status: 'active' }),
  )
  checklists.value = page.list
}

const loadUsers = async () => {
  users.value = await systemUserApi.list()
}

const loadAssigneeScopeMembers = async (scopeIds = assigneeScopeIds.value) => {
  if (scopeIds.length === 0) {
    assigneeScopeMembers.value = []
    return
  }

  assigneeScopeMembers.value = (await Promise.all(scopeIds.map((id) => resourceScopeApi.listMembers(id)))).flat()
  if (newItem.assignee && !personnelOptions.value.some((person) => person.id === newItem.assignee)) {
    newItem.assignee = ''
  }
}

const loadResourceScopes = async () => {
  resourceScopes.value = await resourceScopeApi.list()
  const firstScope = activeResourceScopes.value[0]
  if (!form.ownerScopeId && firstScope) {
    form.ownerScopeId = firstScope.id
  }
}

const getScopeName = (id: string) => {
  return resourceScopes.value.find((scope) => scope.id === id)?.scopeName || id
}

watch(assigneeScopeIds, (scopeIds) => {
  void loadAssigneeScopeMembers(scopeIds)
})

const applySubPlanPeriodDateRange = () => {
  if (!isSubPlan.value || isEdit.value || planItems.value.length === 0) return
  if (!form.year || !form.cycle || !form.period) return

  const [plannedStartDate, plannedEndDate] = resolvePlanPeriodDateRange(
    Number(form.year),
    form.cycle as PlanCycle,
    form.period,
  )

  planItems.value = planItems.value.map((item) => ({
    ...item,
    plannedStartDate,
    plannedEndDate,
  }))
}

watch(
  () => [form.year, form.cycle, form.period],
  () => {
    applySubPlanPeriodDateRange()
  },
)

const addPlanItem = async () => {
  if (!itemFormRef.value) return
  const valid = await itemFormRef.value.validate().catch(() => false)
  if (!valid) return

  planItems.value.push({
    sequence: planItems.value.length + 1,
    targetScope: newItem.targetScope,
    checklistIds: [...newItem.checklistIds],
    plannedStartDate: newItem.dateRange![0],
    plannedEndDate: newItem.dateRange![1],
    assignee: newItem.assignee || undefined,
    remark: newItem.remark || undefined,
  })

  // Reset
  newItem.targetScope = ''
  newItem.checklistIds = []
  newItem.dateRange = null
  newItem.assignee = ''
  newItem.remark = ''
  itemFormRef.value.resetFields()
  ElMessage.success('检查范围已添加')
}

const removePlanItem = (index: number) => {
  planItems.value.splice(index, 1)
  // Re-sequence
  planItems.value.forEach((item, i) => {
    item.sequence = i + 1
  })
}

// ==================
// Navigation
// ==================
const nextStep = async () => {
  if (currentStep.value === 0) {
    if (!basicFormRef.value) return
    const valid = await basicFormRef.value.validate().catch(() => false)
    if (!valid) return
  }
  if (currentStep.value === 1 && planItems.value.length === 0) {
    ElMessage.warning('请至少添加一条检查范围')
    return
  }
  currentStep.value++
}

// ==================
// Submit
// ==================
const buildPlanData = () => ({
  name: form.name,
  year: Number(form.year),
  cycle: form.cycle as PlanCycle,
  period: form.period,
  description: form.description,
  ownerScopeId: form.ownerScopeId,
  grantScopeIds: form.grantScopeIds,
  parentId: isSubPlan.value ? parentPlanId.value : undefined,
  items: planItems.value.map((item, i) => ({
    ...item,
    sequence: i + 1,
  })),
})

const validateBasicInfo = async () => {
  if (!basicFormRef.value) return false
  return await basicFormRef.value.validate().catch(() => false)
}

const handleSaveDraft = async () => {
  if (!canSaveDraft.value) return
  const valid = await validateBasicInfo()
  if (!valid) return

  const payload = createPlanUpsertPayload({ ...buildPlanData(), status: 'draft' })
  if (isEdit.value) {
    await planApi.update(editId.value, payload)
    ElMessage.success('计划已更新')
  } else {
    await planApi.create(payload)
    ElMessage.success('计划已保存为草稿')
  }
  router.push('/plan/list')
}

const handleSaveEdit = async () => {
  const valid = await validateBasicInfo()
  if (!valid) return

  const payload = createPlanUpsertPayload({ ...buildPlanData(), status: currentPlanStatus.value })
  await planApi.update(editId.value, payload)
  ElMessage.success('计划修改已保存')
  router.push('/plan/list')
}

const handleSubmit = async () => {
  const valid = await validateBasicInfo()
  if (!valid) return

  const payload = createPlanUpsertPayload({ ...buildPlanData(), status: PLAN_SUBMIT_STATUS })
  if (isEdit.value) {
    await planApi.update(editId.value, payload)
    ElMessage.success('计划已更新并进入待启动')
  } else {
    await planApi.create(payload)
    ElMessage.success('计划已提交并进入待启动')
  }
  router.push('/plan/list')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: $iris-text-primary;
    margin: 0;
    letter-spacing: -0.3px;
  }
}

.steps-wrapper {
  background: white;
  border-radius: 12px;
  padding: 24px 48px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.step-content {
  min-height: 400px;
}

.form-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: $iris-text-primary;

    .title-icon {
      color: $iris-primary;
      font-size: 20px;
    }

    .count-tag {
      margin-left: auto;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: $iris-text-secondary;
  }
}

// Step 2: Plan Items List
.plan-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
}

.plan-item-card {
  background: #f8fafc;
  border: 1px solid $iris-border-light;
  border-radius: 10px;
  padding: 16px 20px;
  transition: all 0.2s;

  &:hover {
    border-color: $iris-primary;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
  }

  .item-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .item-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      background: $iris-primary;
      color: white;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .item-scope {
      font-size: 15px;
      font-weight: 600;
      color: $iris-text-primary;
      flex: 1;
    }
  }

  .item-body {
    padding-left: 40px;

    .item-detail {
      margin-bottom: 8px;

      label {
        font-size: 12px;
        color: $iris-text-muted;
        display: block;
        margin-bottom: 6px;
      }

      .checklist-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
    }

    .item-meta {
      display: flex;
      gap: 24px;
      font-size: 13px;
      color: $iris-text-secondary;

      .meta {
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon {
          font-size: 14px;
        }
      }
    }

    .item-remark {
      margin-top: 6px;
      font-size: 12px;
      color: $iris-text-muted;
      font-style: italic;
    }
  }
}

.add-item-section {
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: $iris-text-primary;
    margin-bottom: 20px;

    .el-icon {
      color: $iris-primary;
    }
  }

  .add-btn-row {
    text-align: right;
  }
}

// Step 3: Review
.review-card {
  .review-section {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }

    .review-label {
      font-size: 15px;
      font-weight: 600;
      color: $iris-text-primary;
      margin-bottom: 16px;
      padding-left: 12px;
      border-left: 3px solid $iris-primary;
    }
  }
}

// Bottom Actions
.bottom-actions {
  display: flex;
  align-items: center;
  margin-top: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  .spacer {
    flex: 1;
  }
}
</style>
