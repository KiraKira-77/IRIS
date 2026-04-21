<template>
  <div class="page-container iris-page">
    <div class="page-header">
      <div>
        <el-button link :icon="Back" @click="router.push('/rectification/list')">返回列表</el-button>
        <h2 class="page-title">创建整改单</h2>
        <p class="page-subtitle">支持从项目任务一键发起，也支持手工录入整改事项</p>
      </div>
      <div class="header-actions">
        <el-button @click="resetForm">重置</el-button>
        <el-button type="primary" @click="handleSubmit">提交整改单</el-button>
      </div>
    </div>

    <el-row :gutter="24">
      <el-col :span="16">
        <div class="iris-card">
          <div class="card-title">
            <el-icon><EditPen /></el-icon>
            <span>整改信息</span>
          </div>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            size="large"
            class="rect-form"
          >
            <el-form-item label="整改来源" prop="source">
              <el-radio-group v-model="form.source">
                <el-radio-button value="task">项目任务触发</el-radio-button>
                <el-radio-button value="manual">手工创建</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-row :gutter="16" v-if="form.source === 'task'">
              <el-col :span="12">
                <el-form-item label="所属项目" prop="projectId">
                  <el-select
                    v-model="form.projectId"
                    placeholder="选择项目"
                    filterable
                    style="width: 100%"
                    @change="handleProjectChange"
                  >
                    <el-option
                      v-for="project in projectOptions"
                      :key="project.id"
                      :label="`${project.code} · ${project.name}`"
                      :value="project.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="关联任务" prop="taskId">
                  <el-select
                    v-model="form.taskId"
                    placeholder="选择触发整改的任务"
                    filterable
                    style="width: 100%"
                    :disabled="!form.projectId"
                    @change="handleTaskChange"
                  >
                    <el-option
                      v-for="task in taskOptions"
                      :key="task.id"
                      :label="task.checkContent"
                      :value="task.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="整改标题" prop="title">
              <el-input
                v-model="form.title"
                maxlength="80"
                show-word-limit
                placeholder="例如：关于核心系统权限超配的整改"
              />
            </el-form-item>

            <el-form-item label="问题描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="5"
                maxlength="400"
                show-word-limit
                placeholder="描述缺陷现象、影响范围和整改要求"
              />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="整改责任人" prop="assigneeId">
                  <el-select v-model="form.assigneeId" filterable placeholder="选择责任人">
                    <el-option
                      v-for="person in personnelOptions"
                      :key="person.id"
                      :label="`${person.name} · ${person.department}`"
                      :value="person.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="审核人" prop="reviewerId">
                  <el-select v-model="form.reviewerId" filterable placeholder="选择审核人">
                    <el-option
                      v-for="person in reviewerOptions"
                      :key="person.id"
                      :label="`${person.name} · ${person.department}`"
                      :value="person.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="整改期限" prop="deadline">
                  <el-date-picker
                    v-model="form.deadline"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="选择期限"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-if="selectedTask" class="iris-card task-brief">
          <div class="card-title">
            <el-icon><Document /></el-icon>
            <span>任务背景</span>
          </div>
          <div class="brief-grid">
            <div class="brief-item">
              <label>检查内容</label>
              <p>{{ selectedTask.checkContent }}</p>
            </div>
            <div class="brief-item">
              <label>检查标准</label>
              <p>{{ selectedTask.checkCriterion }}</p>
            </div>
            <div class="brief-item">
              <label>任务状态</label>
              <el-tag :type="taskStatusType(selectedTask.status)" effect="dark" size="small">
                {{ taskStatusLabel(selectedTask.status) }}
              </el-tag>
            </div>
            <div class="brief-item">
              <label>当前办理人</label>
              <p>{{ selectedTask.assigneeName || '待分配' }}</p>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="iris-card side-card">
          <div class="card-title">
            <el-icon><DataAnalysis /></el-icon>
            <span>发起建议</span>
          </div>
          <div class="metric-list">
            <div class="metric-item">
              <span>在途整改单</span>
              <strong>{{ activeRectificationCount }}</strong>
            </div>
            <div class="metric-item">
              <span>项目待处理任务</span>
              <strong>{{ selectedProjectPendingCount }}</strong>
            </div>
            <div class="metric-item">
              <span>默认截止建议</span>
              <strong>{{ suggestedDeadline }}</strong>
            </div>
          </div>
          <el-alert
            title="来源于任务时，系统会自动带出关联项目和问题上下文，减少重复录入。"
            type="info"
            :closable="false"
            show-icon
          />
        </div>

        <div class="iris-card side-card">
          <div class="card-title">
            <el-icon><WarningFilled /></el-icon>
            <span>提交后将产生</span>
          </div>
          <ul class="result-list">
            <li>生成唯一整改单号并进入“整改中”状态</li>
            <li>记录创建日志，后续可在详情页继续反馈处理过程</li>
            <li>若关联项目任务，可用于后续项目联动回写</li>
          </ul>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Back, DataAnalysis, Document, EditPen, WarningFilled } from '@element-plus/icons-vue'
import { mockPersonnel, mockProjects, mockRectifications } from '@/mock'
import type { CheckTask, RectificationOrder } from '@/types'

const router = useRouter()
const formRef = ref<FormInstance>()

const today = () => new Date().toISOString().slice(0, 10)
const nowText = () => new Date().toISOString().slice(0, 16).replace('T', ' ')
const plusDays = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const defaultForm = () => ({
  source: 'task' as 'task' | 'manual',
  projectId: '',
  taskId: '',
  title: '',
  description: '',
  assigneeId: '',
  reviewerId: '',
  deadline: plusDays(7),
})

const form = reactive(defaultForm())

const rules: FormRules = {
  source: [{ required: true, message: '请选择整改来源', trigger: 'change' }],
  title: [{ required: true, message: '请输入整改标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
  assigneeId: [{ required: true, message: '请选择整改责任人', trigger: 'change' }],
  reviewerId: [{ required: true, message: '请选择审核人', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择整改期限', trigger: 'change' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  taskId: [{ required: true, message: '请选择关联任务', trigger: 'change' }],
}

const projectOptions = computed(() => mockProjects.filter((project) => project.tasks.length > 0))
const personnelOptions = computed(() => mockPersonnel.filter((person) => person.status === 'active'))
const reviewerOptions = computed(() =>
  personnelOptions.value.filter((person) =>
    person.roles.some((role) => ['leader', 'reviewer', 'auditor'].includes(role)),
  ),
)

const selectedProject = computed(() => mockProjects.find((project) => project.id === form.projectId))
const taskOptions = computed(() => {
  if (!selectedProject.value) return []
  return selectedProject.value.tasks.filter((task) =>
    ['submitted', 'reviewing', 'rejected', 'rectifying', 'uploaded', 'approved'].includes(
      task.status,
    ),
  )
})
const selectedTask = computed<CheckTask | undefined>(() =>
  taskOptions.value.find((task) => task.id === form.taskId),
)

const activeRectificationCount = computed(
  () => mockRectifications.filter((item) => item.status !== 'approved').length,
)
const selectedProjectPendingCount = computed(() => {
  if (!selectedProject.value) return 0
  return selectedProject.value.tasks.filter((task) => task.status !== 'approved').length
})
const suggestedDeadline = computed(() => (form.source === 'task' ? plusDays(5) : plusDays(7)))

const resetForm = () => {
  Object.assign(form, defaultForm())
  formRef.value?.clearValidate()
}

const handleProjectChange = () => {
  form.taskId = ''
  if (selectedProject.value && form.source === 'manual' && !form.title) {
    form.title = `${selectedProject.value.name} 整改事项`
  }
}

const handleTaskChange = () => {
  if (!selectedTask.value) return
  form.title = `关于${selectedTask.value.checkContent}的整改`
  form.description = `${selectedTask.value.checkContent}。整改标准：${selectedTask.value.checkCriterion}。请补充整改措施并提交证明材料。`
  form.assigneeId = selectedTask.value.assigneeId || ''
  form.reviewerId = selectedTask.value.reviewerId || ''
  form.deadline = plusDays(5)
}

const getPerson = (id: string) => mockPersonnel.find((person) => person.id === id)

const handleSubmit = async () => {
  if (form.source === 'task' && (!form.projectId || !form.taskId)) {
    ElMessage.warning('请先选择项目和关联任务')
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const assignee = getPerson(form.assigneeId)
  const reviewer = getPerson(form.reviewerId)

  if (!assignee || !reviewer) {
    ElMessage.error('整改责任人或审核人不存在')
    return
  }

  const nextIndex = mockRectifications.length + 1
  const code = `REC-2026-${String(nextIndex).padStart(3, '0')}`
  const project = selectedProject.value

  const newRectification: RectificationOrder = {
    id: `rect-${Date.now()}`,
    code,
    source: form.source,
    taskId: form.source === 'task' ? form.taskId : undefined,
    projectId: project?.id,
    projectName: project?.name,
    title: form.title,
    description: form.description,
    assigneeId: assignee.id,
    assigneeName: assignee.name,
    reviewerId: reviewer.id,
    reviewerName: reviewer.name,
    status: 'in_progress',
    deadline: form.deadline,
    attachments: [],
    logs: [
      {
        id: `log-${Date.now()}-create`,
        action: '创建整改单',
        operator: 'admin',
        operatorName: '当前用户',
        remark: form.source === 'task' ? `关联任务 ${form.taskId}` : '手工创建',
        createdAt: nowText(),
      },
    ],
    createdAt: today(),
    updatedAt: today(),
  }

  mockRectifications.unshift(newRectification)
  ElMessage.success(`整改单 ${code} 已创建`)
  router.push('/rectification/list')
}

const taskStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    in_progress: 'primary',
    dispatched: 'primary',
    uploaded: 'warning',
    submitted: 'warning',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger',
    rectifying: 'danger',
  }
  return map[status] || 'info'
}

const taskStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待办',
    in_progress: '进行中',
    dispatched: '已分发',
    uploaded: '已上传',
    submitted: '已提交',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已退回',
    rectifying: '整改中',
  }
  return map[status] || status
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .page-title {
    margin-top: 8px;
    font-size: 26px;
    font-weight: 700;
    color: $iris-text-primary;
  }

  .page-subtitle {
    margin-top: 8px;
    color: $iris-text-secondary;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
  color: $iris-text-primary;
}

.rect-form {
  :deep(.el-select) {
    width: 100%;
  }
}

.task-brief {
  margin-top: 24px;
}

.brief-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.brief-item {
  padding: 16px;
  border-radius: 12px;
  background: $iris-bg;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    color: $iris-text-muted;
  }

  p {
    line-height: 1.6;
    color: $iris-text-primary;
  }
}

.side-card + .side-card {
  margin-top: 24px;
}

.metric-list {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.1);

  span {
    color: $iris-text-secondary;
  }

  strong {
    font-size: 18px;
    color: $iris-text-primary;
  }
}

.result-list {
  padding-left: 18px;
  line-height: 1.8;
  color: $iris-text-secondary;
}
</style>
