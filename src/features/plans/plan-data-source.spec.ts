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
    expect(planOverviewSource).toContain('systemUserApi')
    expect(projectTaskSource).toContain('systemUserApi')
    expect(rectificationCreateSource).toContain('systemUserApi')
    expect(projectCreateSource).not.toContain('mockPersonnel')
    expect(planCreateSource).not.toContain('mockPersonnel')
    expect(planDetailSource).not.toContain('mockPersonnel')
    expect(planOverviewSource).not.toContain('mockPersonnel')
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

  it('shows the delete action in the plan list without status gating', () => {
    const deleteButtonEnd = planListSource.indexOf('>删除</el-button')
    const deleteButtonSource = planListSource.slice(deleteButtonEnd - 220, deleteButtonEnd)

    expect(deleteButtonEnd).toBeGreaterThan(0)
    expect(deleteButtonSource).toContain('handleDelete(row)')
    expect(deleteButtonSource).not.toContain("row.status === 'draft'")
  })

  it('uses plan period dates when inheriting parent plan items for a sub-plan', () => {
    expect(planCreateSource).toContain('resolvePlanPeriodDateRange')
    expect(planCreateSource).toContain('applySubPlanPeriodDateRange')
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

  it('keeps plan list as a collapsed parent-child tree and allows draft or approved edits', () => {
    expect(planListSource).toContain('buildControlPlanTree')
    expect(planListSource).toContain('canEditControlPlan(row)')
    expect(planListSource).not.toContain('default-expand-all')
    expect(planListSource).toContain('expandedPlanIds')
    expect(planListSource).toContain('toggleChildPlans')
    expect(planDetailSource).toContain('canEditControlPlan')
  })
})
