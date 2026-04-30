<template>
  <div class="page-container iris-page">
    <!-- Header -->
    <div class="create-header">
      <div class="header-left">
        <el-button link :icon="Back" @click="router.push('/project/list')">返回列表</el-button>
        <h2 class="page-title">{{ pageTitle }}</h2>
        <el-tag
          v-if="linkedPlan"
          effect="light"
          type="primary"
          size="large"
          style="margin-left: 12px"
        >
          关联计划：{{ linkedPlan.name }}
        </el-tag>
      </div>
    </div>

    <!-- Steps -->
    <div class="steps-wrapper">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="基本信息" description="项目名称与配置" :icon="Document" />
        <el-step title="清单与团队" description="选择清单/配置团队" :icon="UserFilled" />
      </el-steps>
    </div>

    <div class="step-content">
      <!-- STEP 1: Basic Info -->
      <div v-show="currentStep === 0" class="step-panel">
        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-title">
              <el-icon class="title-icon"><Document /></el-icon>
              <span>基本信息</span>
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
            <el-form-item label="项目名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="例如：2026年度资金安全专项检查"
                maxlength="80"
                show-word-limit
              />
            </el-form-item>

            <el-row :gutter="24">
              <el-col :span="8">
                <el-form-item label="项目来源" prop="source">
                  <el-select v-model="form.source" placeholder="选择来源" style="width: 100%">
                    <el-option label="计划生成" value="plan" />
                    <el-option label="手动创建" value="manual" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8" v-if="form.source === 'plan'">
                <el-form-item label="关联计划" prop="planId">
                  <el-tree-select
                    v-model="form.planId"
                    :data="planTreeOptions"
                    :props="{ label: 'label', value: 'value', children: 'children', disabled: 'disabled' }"
                    :check-strictly="true"
                    placeholder="选择关联的计划"
                    style="width: 100%"
                    filterable
                    default-expand-all
                    @change="onPlanChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="开始日期" prop="startDate">
                  <el-date-picker
                    v-model="form.startDate"
                    type="date"
                    placeholder="选择开始日期"
                    style="width: 100%"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="结束日期">
                  <el-date-picker
                    v-model="form.endDate"
                    type="date"
                    placeholder="选择结束日期"
                    style="width: 100%"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="项目描述">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                placeholder="简要描述项目的目标和检查重点"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- STEP 2: Checklists & Team -->
      <div v-show="currentStep === 1" class="step-panel">
        <!-- Checklists -->
        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-title">
              <el-icon class="title-icon"><List /></el-icon>
              <span>检查清单</span>
              <el-tag effect="light" round size="small" class="count-tag"
                >已选 {{ form.checklistIds.length }} 个清单，{{ generatedTaskCount }} 个检查项</el-tag
              >
            </div>
          </template>

          <el-checkbox-group v-model="form.checklistIds" class="checklist-grid">
            <div
              v-for="cl in checklistOptions"
              :key="cl.id"
              class="checklist-card"
              :class="{ active: form.checklistIds.includes(cl.id) }"
            >
              <el-checkbox :value="cl.id" :label="cl.id" style="display: none" />
              <div class="cl-content" @click="toggleChecklist(cl.id)">
                <div class="cl-header">
                  <span class="cl-name">{{ cl.name }}</span>
                  <el-tag size="small" effect="light" type="success"
                    >{{ cl.items.length }} 项</el-tag
                  >
                </div>
                <div class="cl-items">
                  <div v-for="item in cl.items.slice(0, 3)" :key="item.id" class="cl-item-row">
                    <el-icon><CircleCheck /></el-icon>
                    <span>{{ item.content }}</span>
                  </div>
                  <div v-if="cl.items.length > 3" class="cl-more">
                    ... 还有 {{ cl.items.length - 3 }} 项
                  </div>
                </div>
              </div>
            </div>
          </el-checkbox-group>
        </el-card>

        <!-- Team -->
        <el-card shadow="never" class="form-card" style="margin-top: 24px">
          <template #header>
            <div class="card-title">
              <el-icon class="title-icon"><UserFilled /></el-icon>
              <span>项目团队</span>
              <el-tag effect="light" round size="small" class="count-tag"
                >{{ teamMembers.length }} 人</el-tag
              >
            </div>
          </template>

          <div class="team-form">
            <el-row :gutter="16" v-for="(m, idx) in teamMembers" :key="idx" class="team-row">
              <el-col :span="10">
                <el-select
                  v-model="m.personnelId"
                  placeholder="选择人员"
                  style="width: 100%"
                  filterable
                  @change="(val: string) => onPersonnelChange(idx, val)"
                >
                  <el-option
                    v-for="p in personnelOptions"
                    :key="p.id"
                    :label="`${p.username} - ${p.account}`"
                    :value="p.id"
                  />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-select v-model="m.role" style="width: 100%" placeholder="角色">
                  <el-option label="项目负责人" value="leader" />
                  <el-option label="项目审计人员" value="auditor" />
                  <el-option label="观察员" value="observer" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-button type="danger" plain :icon="Delete" @click="teamMembers.splice(idx, 1)">
                  移除
                </el-button>
              </el-col>
            </el-row>

            <el-button
              type="primary"
              plain
              :icon="Plus"
              @click="teamMembers.push({ personnelId: '', personnelName: '', role: 'observer' })"
              style="margin-top: 12px"
            >
              添加成员
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer-actions">
      <el-button v-if="currentStep > 0" :icon="ArrowLeft" @click="currentStep--">上一步</el-button>
      <div style="flex: 1"></div>
      <el-button v-if="currentStep < 1" type="primary" @click="nextStep">
        下一步
        <el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
      <el-button v-if="currentStep === 1" type="primary" @click="handleSubmit" :icon="Promotion">
        {{ isEditMode ? '保存项目' : '新建项目' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Back,
  Document,
  UserFilled,
  List,
  CircleCheck,
  Plus,
  Delete,
  ArrowLeft,
  ArrowRight,
  Promotion,
} from '@element-plus/icons-vue'
import { checklistApi, planApi, projectApi, systemUserApi } from '@/api'
import { normalizeChecklistPageFromApi } from '@/features/checklists/checklist-data'
import { buildControlPlanTree, normalizePlanPage } from '@/features/plans/plan-data'
import {
  buildProjectUpsertPayload,
  filterProjectMemberUsers,
  getProjectMembers,
  normalizeProject,
} from '@/features/projects/project-data'
import type { ControlChecklist, ControlPlan, Project, SystemUser, TeamMember } from '@/types'

const router = useRouter()
const route = useRoute()

const currentStep = ref(0)
const basicFormRef = ref<FormInstance>()

const linkedPlan = ref<ControlPlan | null>(null)
const editingProject = ref<Project | null>(null)
const projectId = computed(() => route.query.id as string | undefined)
const isEditMode = computed(() => !!projectId.value)
const pageTitle = computed(() => {
  if (isEditMode.value) return '编辑项目'
  return linkedPlan.value ? '从计划创建项目' : '新建项目'
})
const today = () => new Date().toISOString().slice(0, 10)

// ==================
// Form Data
// ==================
const form = ref({
  name: '',
  source: 'manual' as 'plan' | 'manual',
  planId: '',
  startDate: '',
  endDate: '',
  description: '',
  checklistIds: [] as string[],
})

const teamMembers = ref<Array<Omit<TeamMember, 'id' | 'avatar'>>>([])

const basicRules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  source: [{ required: true, message: '请选择项目来源', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
}

// ==================
// Options
// ==================
const availablePlans = ref<ControlPlan[]>([])
const checklistOptions = ref<ControlChecklist[]>([])
const users = ref<SystemUser[]>([])
type PlanTreeOption = {
  label: string
  value: string
  disabled?: boolean
  children?: PlanTreeOption[]
}

const personnelOptions = computed(() => {
  return filterProjectMemberUsers(users.value)
})

const canAssociatePlan = (plan: ControlPlan) => ['approved', 'in_progress'].includes(plan.status)

const planTreeOptions = computed<PlanTreeOption[]>(() =>
  buildControlPlanTree(availablePlans.value)
    .map((plan) => buildPlanTreeOption(plan))
    .filter((option): option is PlanTreeOption => Boolean(option)),
)

const buildPlanTreeOption = (plan: ControlPlan): PlanTreeOption | null => {
  const children = (plan.children || [])
    .map((child) => buildPlanTreeOption(child))
    .filter((option): option is PlanTreeOption => Boolean(option))
  const selectable = canAssociatePlan(plan)

  if (!selectable && children.length === 0) return null

  return {
    label: plan.parentId ? plan.name : `${plan.name}（主计划）`,
    value: plan.id,
    disabled: !selectable || children.length > 0,
    children: children.length ? children : undefined,
  }
}

const generatedTaskCount = computed(() => {
  return form.value.checklistIds.reduce((sum, clId) => {
    const cl = checklistOptions.value.find((c) => c.id === clId)
    return sum + (cl?.items.length || 0)
  }, 0)
})

// ==================
// Events
// ==================
const loadAvailablePlans = async () => {
  const page = normalizePlanPage(await planApi.list({ page: 1, pageSize: 100 }))
  availablePlans.value = page.list
}

const loadChecklistOptions = async () => {
  const page = normalizeChecklistPageFromApi(
    await checklistApi.list({ page: 1, pageSize: 100, status: 'active' }),
  )
  checklistOptions.value = page.list.filter((cl) => cl.status === 'active')
}

const loadPersonnelOptions = async () => {
  users.value = await systemUserApi.list()
}

const pruneUnavailableTeamMembers = () => {
  const allowedUserIds = new Set(personnelOptions.value.map((user) => user.id))
  teamMembers.value = teamMembers.value.filter(
    (member) => !member.personnelId || allowedUserIds.has(member.personnelId),
  )
}

const onPlanChange = async (planId: string) => {
  const plan = availablePlans.value.find((p) => p.id === planId) || (await planApi.detail(planId))
  if (plan) {
    linkedPlan.value = plan
    pruneUnavailableTeamMembers()
    if (!isEditMode.value) {
      form.value.name = `${plan.name} - 执行项目`
    }
    // Auto-select checklists from plan items
    const clIds = new Set<string>()
    plan.items.forEach((item) => {
      item.checklistIds.forEach((id) => clIds.add(id))
    })
    form.value.checklistIds = Array.from(clIds)
  }
}

const loadProjectForEdit = async (id: string) => {
  const project = normalizeProject(await projectApi.detail(id))
  editingProject.value = project
  form.value = {
    name: project.name,
    source: project.source,
    planId: project.planId || '',
    startDate: project.startDate,
    endDate: project.endDate || '',
    description: project.description || '',
    checklistIds: project.checklistIds || [],
  }
  teamMembers.value = getProjectMembers(project).map((member) => ({
    personnelId: member.personnelId,
    personnelName: member.personnelName,
    employeeNo: member.employeeNo,
    department: member.department,
    role: member.role === 'leader' || member.role === 'auditor' ? member.role : 'observer',
  }))
  if (project.planId) {
    linkedPlan.value = availablePlans.value.find((plan) => plan.id === project.planId) || null
  }
  pruneUnavailableTeamMembers()
}

const onPersonnelChange = (idx: number, personnelId: string) => {
  const p = personnelOptions.value.find((pp) => pp.id === personnelId)
  const member = teamMembers.value[idx]
  if (p && member) {
    member.personnelName = p.username
    member.employeeNo = p.account
    member.department = ''
  }
}

const toggleChecklist = (id: string) => {
  const idx = form.value.checklistIds.indexOf(id)
  if (idx >= 0) {
    form.value.checklistIds.splice(idx, 1)
  } else {
    form.value.checklistIds.push(id)
  }
}

// ==================
// Init from planId query
// ==================
onMounted(async () => {
  await Promise.all([loadAvailablePlans(), loadChecklistOptions(), loadPersonnelOptions()])
  if (projectId.value) {
    await loadProjectForEdit(projectId.value)
    return
  }
  const planId = route.query.planId as string
  if (planId) {
    form.value.source = 'plan'
    form.value.planId = planId
    await onPlanChange(planId)
    form.value.startDate = today()
  }
})

// ==================
// Navigation
// ==================
const nextStep = async () => {
  if (currentStep.value === 0) {
    if (!basicFormRef.value) return
    const valid = await basicFormRef.value.validate().catch(() => false)
    if (!valid) return
  }
  currentStep.value++
}

// ==================
// Submit
// ==================
const handleSubmit = async () => {
  if (form.value.checklistIds.length === 0) {
    ElMessage.warning('请至少选择一个检查清单')
    return
  }
  const validMembers = teamMembers.value.filter((member) => member.personnelId)
  if (validMembers.length === 0) {
    ElMessage.warning('请至少添加一名项目成员')
    return
  }
  if (!validMembers.some((member) => member.role === 'leader')) {
    ElMessage.warning('请设置一名项目负责人')
    return
  }

  const plan = linkedPlan.value || availablePlans.value.find((item) => item.id === form.value.planId)
  try {
    const payload = buildProjectUpsertPayload({
      name: form.value.name,
      source: form.value.source,
      planId: form.value.planId,
      planName: plan?.name || editingProject.value?.planName,
      description: form.value.description,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      checklistIds: form.value.checklistIds,
      members: validMembers,
    })
    const saved = isEditMode.value
      ? await projectApi.update(projectId.value!, payload)
      : await projectApi.create(payload)

    ElMessage.success(isEditMode.value ? '项目已保存' : '项目已创建')
    router.push(`/project/detail/${saved.id}`)
  } catch {
    // request interceptor shows the error
  }
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
  }
}

.steps-wrapper {
  max-width: 600px;
  margin: 0 auto 32px;
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
}

.checklist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  width: 100%;
}

.checklist-card {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $iris-primary;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.08);
  }

  &.active {
    border-color: $iris-primary;
    background: #eef2ff;
  }

  .cl-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .cl-name {
      font-weight: 600;
      font-size: 15px;
      color: $iris-text-primary;
    }
  }

  .cl-items {
    .cl-item-row {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 13px;
      color: $iris-text-secondary;
      margin-bottom: 4px;
      line-height: 1.5;

      .el-icon {
        color: #10b981;
        margin-top: 3px;
        flex-shrink: 0;
      }
    }

    .cl-more {
      font-size: 12px;
      color: $iris-text-muted;
      margin-top: 4px;
    }
  }
}

.team-row {
  margin-bottom: 12px;
  align-items: center;
}

.footer-actions {
  display: flex;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}
</style>
