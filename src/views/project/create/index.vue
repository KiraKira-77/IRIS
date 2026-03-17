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
                    <el-option label="临时启动" value="manual" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8" v-if="form.source === 'plan'">
                <el-form-item label="关联计划" prop="planId">
                  <el-select
                    v-model="form.planId"
                    placeholder="选择关联的计划"
                    style="width: 100%"
                    @change="onPlanChange"
                  >
                    <el-option
                      v-for="p in availablePlans"
                      :key="p.id"
                      :label="p.name"
                      :value="p.id"
                    />
                  </el-select>
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
                >已选 {{ form.checklistIds.length }} 个清单，{{ generatedTaskCount }} 条任务</el-tag
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
                    :label="`${p.name} - ${p.department}`"
                    :value="p.id"
                  />
                </el-select>
              </el-col>
              <el-col :span="8">
                <el-select v-model="m.role" style="width: 100%" placeholder="角色">
                  <el-option label="项目负责人" value="leader" />
                  <el-option label="审核人" value="auditor" />
                  <el-option label="评审人" value="reviewer" />
                  <el-option label="检查员" value="member" />
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
              @click="teamMembers.push({ personnelId: '', personnelName: '', role: 'member' })"
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
        启动项目
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
import { mockPlans, mockChecklists, mockPersonnel, mockProjects } from '@/mock'
import type { ControlPlan } from '@/types'

const router = useRouter()
const route = useRoute()

const currentStep = ref(0)
const basicFormRef = ref<FormInstance>()

const linkedPlan = ref<ControlPlan | null>(null)
const pageTitle = computed(() => (linkedPlan.value ? '从计划创建项目' : '项目启动'))

// ==================
// Form Data
// ==================
const form = ref({
  name: '',
  source: 'manual' as 'plan' | 'manual',
  planId: '',
  startDate: '',
  description: '',
  checklistIds: [] as string[],
})

const teamMembers = ref<{ personnelId: string; personnelName: string; role: string }[]>([])

const basicRules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  source: [{ required: true, message: '请选择项目来源', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
}

// ==================
// Options
// ==================
const availablePlans = computed(() =>
  mockPlans.filter((p) => ['approved', 'in_progress'].includes(p.status)),
)

const checklistOptions = computed(() => mockChecklists.filter((cl) => cl.status === 'active'))

const personnelOptions = computed(() => mockPersonnel)

const generatedTaskCount = computed(() => {
  return form.value.checklistIds.reduce((sum, clId) => {
    const cl = mockChecklists.find((c) => c.id === clId)
    return sum + (cl?.items.length || 0)
  }, 0)
})

// ==================
// Events
// ==================
const onPlanChange = (planId: string) => {
  const plan = mockPlans.find((p) => p.id === planId)
  if (plan) {
    linkedPlan.value = plan
    form.value.name = `${plan.name} - 执行项目`
    // Auto-select checklists from plan items
    const clIds = new Set<string>()
    plan.items.forEach((item) => {
      item.checklistIds.forEach((id) => clIds.add(id))
    })
    form.value.checklistIds = Array.from(clIds)
  }
}

const onPersonnelChange = (idx: number, personnelId: string) => {
  const p = mockPersonnel.find((pp) => pp.id === personnelId)
  if (p) {
    teamMembers.value[idx].personnelName = p.name
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
onMounted(() => {
  const planId = route.query.planId as string
  if (planId) {
    form.value.source = 'plan'
    form.value.planId = planId
    onPlanChange(planId)
    form.value.startDate = new Date().toISOString().split('T')[0]
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
const handleSubmit = () => {
  if (form.value.checklistIds.length === 0) {
    ElMessage.warning('请至少选择一个检查清单')
    return
  }
  if (teamMembers.value.length === 0) {
    ElMessage.warning('请至少添加一名团队成员')
    return
  }

  const newId = `proj-${Date.now()}`
  const tasks = form.value.checklistIds.flatMap((clId) => {
    const cl = mockChecklists.find((c) => c.id === clId)
    if (!cl) return []
    return cl.items.map((item, i) => ({
      id: `t-${Date.now()}-${clId}-${i}`,
      projectId: newId,
      checklistId: clId,
      checklistItemId: item.id,
      checkContent: item.content,
      checkCriterion: item.criterion || '',
      status: 'pending' as const,
      attachments: [],
      logs: [
        {
          id: `log-${Date.now()}-${i}`,
          action: '创建任务',
          operator: 'admin',
          operatorName: '系统',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        },
      ],
      createdAt: form.value.startDate,
      updatedAt: form.value.startDate,
    }))
  })

  const team = teamMembers.value
    .filter((m) => m.personnelId)
    .map((m, i) => ({
      id: `tm-${Date.now()}-${i}`,
      personnelId: m.personnelId,
      personnelName: m.personnelName,
      role: m.role as any,
    }))

  mockProjects.push({
    id: newId,
    code: `PRJ-2026-${String(mockProjects.length + 1).padStart(3, '0')}`,
    name: form.value.name,
    source: form.value.source,
    planId: form.value.source === 'plan' ? form.value.planId : undefined,
    status: 'preparing',
    description: form.value.description || undefined,
    startDate: form.value.startDate,
    team,
    checklistIds: [...form.value.checklistIds],
    tasks,
    createdBy: 'admin',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
  })

  ElMessage.success('项目已创建')
  router.push('/project/list')
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
