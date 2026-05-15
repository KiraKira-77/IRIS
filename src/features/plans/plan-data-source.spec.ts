import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const projectCreateSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../views/project/create/index.vue'),
  'utf8',
)
const planCreateSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../views/plan/create/index.vue'),
  'utf8',
)
const planDetailSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../views/plan/detail/index.vue'),
  'utf8',
)
const planListSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../views/plan/list/index.vue'),
  'utf8',
)
const planOverviewSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../views/plan/overview/index.vue'),
  'utf8',
)
const typeSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../types/index.ts'),
  'utf8',
)
const projectTaskSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../views/project/task/index.vue'),
  'utf8',
)
const rectificationCreateSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../views/rectification/create/index.vue'),
  'utf8',
)

describe('plan related pages data sources', () => {
  it('loads checklist options from the checklist API instead of mock data', () => {
    expect(projectCreateSource).toContain('checklistApi')
    expect(planCreateSource).toContain('checklistApi')
    expect(planDetailSource).toContain('checklistApi')
    expect(projectTaskSource).toContain('checklistApi')
    expect(projectCreateSource).not.toContain('mockChecklists')
    expect(planCreateSource).not.toContain('mockChecklists')
    expect(planDetailSource).not.toContain('mockChecklists')
    expect(projectTaskSource).not.toContain('mockChecklists')
  })

  it('loads assignee options from system users instead of mock personnel', () => {
    expect(projectCreateSource).toContain('systemUserApi')
    expect(planCreateSource).toContain('systemUserApi')
    expect(planDetailSource).toContain('systemUserApi')
    expect(projectTaskSource).toContain('assignableMembers')
    expect(rectificationCreateSource).toContain('systemUserApi')
    expect(projectCreateSource).not.toContain('mockPersonnel')
    expect(planCreateSource).not.toContain('mockPersonnel')
    expect(planDetailSource).not.toContain('mockPersonnel')
    expect(projectTaskSource).not.toContain('mockPersonnel')
    expect(rectificationCreateSource).not.toContain('mockPersonnel')
  })

  it('filters plan-scoped assignees through maintenance and shared scope members', () => {
    expect(planCreateSource).toContain('filterPlanAssigneeUsers')
    expect(planCreateSource).toContain('resourceScopeApi.listMembers')
    expect(projectCreateSource).not.toContain('filterPlanAssigneeUsers')
    expect(projectCreateSource).not.toContain('resourceScopeApi.listMembers')
  })

  it('does not show a fixed draft status in the plan create header', () => {
    const headerStart = planCreateSource.indexOf('<div class="create-header">')
    const stepsStart = planCreateSource.indexOf('<!-- Steps -->', headerStart)
    const headerSource = planCreateSource.slice(headerStart, stepsStart)

    expect(headerSource).not.toContain('draft-tag')
    expect(headerSource).not.toContain('草稿')
  })

  it('does not expose plan approval controls while approval is disabled', () => {
    expect(planCreateSource).not.toContain("status: 'pending'")
    expect(planCreateSource).not.toContain('提交审批')
    expect(planListSource).not.toContain('handleSubmitApproval')
    expect(planListSource).not.toContain('提交审批')
  })

  it('allows editing plans to save changes from any step without reverting approved plans to draft', () => {
    const actionsStart = planCreateSource.indexOf('<div class="bottom-actions">')
    const actionsEnd = planCreateSource.indexOf('</div>\n  </div>\n</template>', actionsStart)
    const actionsSource = planCreateSource.slice(actionsStart, actionsEnd)
    const editSaveStart = planCreateSource.indexOf('const handleSaveEdit = async')
    const editSaveEnd = planCreateSource.indexOf('const handleSubmit = async', editSaveStart)
    const editSaveSource = planCreateSource.slice(editSaveStart, editSaveEnd)

    expect(actionsSource).toContain('v-if="isEdit"')
    expect(actionsSource).toContain('handleSaveEdit')
    expect(actionsSource).toContain('保存修改')
    expect(actionsSource).toContain('v-if="canSaveDraft"')
    expect(editSaveSource).toContain('currentPlanStatus.value')
    expect(editSaveSource).not.toContain("status: 'draft'")
  })

  it('uses the current plan lifecycle states without pending or cancelled', () => {
    expect(typeSource).toContain("| 'archived'")
    expect(typeSource).not.toContain("| 'cancelled'")
    expect(planListSource).toContain('value="archived"')
    expect(planListSource).not.toContain('value="pending"')
    expect(planDetailSource).toContain('archived: ')
    expect(planOverviewSource).toContain('archived: ')
  })

  it('keeps the plan list aligned with the standards management page structure', () => {
    expect(planListSource).toContain('plan-hero')
    expect(planListSource).toContain('plan-toolbar')
    expect(planListSource).toContain('table-shell')
    expect(planListSource).toContain('row-actions')
  })

  it('hides the delete action for plans that are linked to projects', () => {
    const deleteButtonEnd = planListSource.indexOf('>删除</el-button')
    const deleteButtonSource = planListSource.slice(deleteButtonEnd - 220, deleteButtonEnd)

    expect(deleteButtonEnd).toBeGreaterThan(0)
    expect(deleteButtonSource).toContain('handleDelete(row)')
    expect(deleteButtonSource).toContain('canDeleteRow(row)')
    expect(deleteButtonSource).not.toContain("row.status === 'draft'")
  })

  it('uses plan period dates when inheriting parent plan items for a sub-plan', () => {
    expect(planCreateSource).toContain('resolvePlanPeriodDateRange')
    expect(planCreateSource).toContain('applySubPlanPeriodDateRange')
  })

  it('shows plan detail status beside the title instead of beside edit actions', () => {
    const headerLeftStart = planDetailSource.indexOf('<div class="header-left">')
    const headerRightStart = planDetailSource.indexOf('<div class="header-right">')
    const headerEnd = planDetailSource.indexOf('</div>\n    </div>', headerRightStart)
    const headerLeftSource = planDetailSource.slice(headerLeftStart, headerRightStart)
    const headerRightSource = planDetailSource.slice(headerRightStart, headerEnd)

    expect(headerLeftSource).toContain('statusType(plan')
    expect(headerLeftSource).toContain('statusLabel(plan')
    expect(headerRightSource).toContain('编辑')
    expect(headerRightSource).not.toContain('statusType(plan')
    expect(headerRightSource).not.toContain('statusLabel(plan')
  })

  it('allows plan creation to proceed without inspection scope items', () => {
    expect(planCreateSource).toContain('暂未添加检查范围，可直接进入预览后提交')
    expect(planCreateSource).not.toContain('请至少添加一条检查范围')
  })

  it('sorts child plans by plan period in list and detail pages', () => {
    expect(planListSource).toContain('buildControlPlanTree')
    expect(planDetailSource).toContain('sortControlPlansByPeriod')
  })

  it('uses plan period dates and parent-child ordering in the plan timeline page', () => {
    expect(planOverviewSource).toContain('resolveControlPlanDateRange')
    expect(planOverviewSource).toContain('buildControlPlanTree')
    expect(planOverviewSource).not.toContain('const starts = plan.items.map')
  })

  it('does not show plan codes in the plan overview summary table', () => {
    const summaryStart = planOverviewSource.indexOf('<!-- Plan Summary Table -->')
    const summaryEnd = planOverviewSource.indexOf('</el-table>', summaryStart)
    const summarySource = planOverviewSource.slice(summaryStart, summaryEnd)

    expect(summaryStart).toBeGreaterThan(0)
    expect(summarySource).not.toContain('label="计划编号"')
    expect(summarySource).not.toContain('prop="code"')
    expect(summarySource).not.toContain('row.code')
  })

  it('keeps plan names on their own line in the plan overview timeline', () => {
    expect(planOverviewSource).toContain('plan-title-line')
    expect(planOverviewSource).toContain('plan-meta-line')
  })

  it('shows only plan and child-plan rows in the plan overview timeline', () => {
    expect(planOverviewSource).toContain('<div class="gantt-label-col">计划</div>')
    expect(planOverviewSource).not.toContain('计划 / 检查项')
    expect(planOverviewSource).not.toContain('v-for="item in plan.items"')
    expect(planOverviewSource).not.toContain('item-row')
    expect(planOverviewSource).not.toContain('item.targetScope')
    expect(planOverviewSource).not.toContain('planPrimaryScope')
    expect(planOverviewSource).not.toContain('planPrimaryAssigneeName')
  })

  it('loads projects to show actual execution ranges in the plan overview timeline', () => {
    expect(planOverviewSource).toContain('projectApi.list')
    expect(planOverviewSource).toContain('resolvePlanActualExecutionRange')
    expect(planOverviewSource).toContain('timeline-track')
    expect(planOverviewSource).toContain('actual-bar')
    expect(planOverviewSource).toContain('实际执行')
    expect(planOverviewSource).not.toContain('top: 36%')
    expect(planOverviewSource).not.toContain('top: 67%')
  })

  it('keeps plan list as a collapsed parent-child tree and gates actions through plan access', () => {
    expect(planListSource).toContain('buildControlPlanTree')
    expect(planListSource).toContain('buildPlanAccessState')
    expect(planListSource).toContain('useUserStore')
    expect(planListSource).toContain('canCreatePlan')
    expect(planListSource).toContain('canCreateChildPlan(row)')
    expect(planListSource).toContain('canEditRow(row)')
    expect(planListSource).toContain('canSubmitRow(row)')
    expect(planListSource).toContain('canDeleteRow(row)')
    expect(planListSource).not.toContain('default-expand-all')
    expect(planListSource).toContain('expandedPlanIds')
    expect(planListSource).toContain('toggleChildPlans')
    expect(planDetailSource).toContain('buildPlanAccessState')
    expect(planDetailSource).toContain('canEditCurrentPlan')
    expect(planDetailSource).toContain('canCreateChildForCurrentPlan')
  })

  it('shows a generate project action for eligible ungenerated plans in the plan list', () => {
    expect(planListSource).toContain('canGenerateProject(row)')
    expect(planListSource).toContain('handleGenerateProject(row)')
    expect(planListSource).toContain("plan.status === 'approved' || plan.status === 'in_progress'")
    expect(planListSource).toContain('!plan.generatedProjectId')
    expect(planListSource).toContain('!plan.children?.length')
    expect(planListSource).toContain('`/project/create?planId=${row.id}`')
    expect(projectCreateSource).toContain('route.query.planId')
  })

  it('shows whether a plan has already generated a project in the plan list', () => {
    expect(typeSource).toContain('generatedProjectId?: string')
    expect(typeSource).toContain('generatedProjectName?: string')
    expect(planListSource).toContain('label="项目生成"')
    expect(planListSource).toContain('generatedProjectId')
    expect(planListSource).toContain('generatedProjectName')
    expect(planListSource).toContain('/project/detail/')
    expect(planListSource).toContain('未生成')
  })

  it('keeps generated project information compact in the plan list', () => {
    const projectColumnStart = planListSource.indexOf('label="项目生成"')
    const projectColumnEnd = planListSource.indexOf('<el-table-column prop="updatedAt"', projectColumnStart)
    const projectColumnSource = planListSource.slice(projectColumnStart, projectColumnEnd)

    expect(projectColumnSource).toContain('width="110"')
    expect(projectColumnSource).toContain('el-tooltip')
    expect(projectColumnSource).toContain('generatedProjectTooltip(row)')
    expect(projectColumnSource).toContain('openGeneratedProject(row)')
    expect(projectColumnSource).not.toContain('generated-project-link')
  })

  it('limits plan owner scope selection to scopes the user can edit or manage', () => {
    expect(planCreateSource).toContain('filterEditablePlanOwnerScopes')
    expect(planCreateSource).toContain('editableOwnerScopeOptions')
    expect(planCreateSource).toContain('ensureUserInfoLoaded')
    expect(planCreateSource).toContain('useUserStore')
  })
})
