import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const archivesSourcePath = join(dirname(fileURLToPath(import.meta.url)), 'index.vue')
const archiveDetailSourcePath = join(dirname(fileURLToPath(import.meta.url)), 'detail', 'index.vue')
const routerSourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'router',
  'index.ts',
)

describe('archives detail navigation', () => {
  it('opens archived projects in a full detail route instead of a drawer', () => {
    const source = readFileSync(archivesSourcePath, 'utf8')
    const routerSource = readFileSync(routerSourcePath, 'utf8')

    expect(source).toContain('@click="openArchiveDetail(archive)"')
    expect(source).toContain('router.push(`/resource/archives/detail/${archive.id}`)')
    expect(source).not.toContain('<el-drawer')
    expect(routerSource).toContain("path: 'resource/archives/detail/:id'")
    expect(routerSource).toContain("name: 'ArchiveDetail'")
    expect(routerSource).toContain("component: () => import('@/views/resource/archives/detail/index.vue')")
  })

  it('renders archive detail from the frozen snapshot with project, members, work orders, rectifications, and documents', () => {
    const source = readFileSync(archiveDetailSourcePath, 'utf8')

    expect(source).toContain('const archiveSnapshot = computed<ProjectArchiveSnapshot>')
    expect(source).toContain('archiveSnapshot.value.project')
    expect(source).toContain('snapshotProject')
    expect(source).toContain('snapshotMembers')
    expect(source).toContain('snapshotTasks')
    expect(source).toContain('snapshotWorkOrders')
    expect(source).toContain('snapshotRectifications')
    expect(source).toContain('归档附件')
    expect(source).toContain('项目概览')
    expect(source).toContain('项目成员')
    expect(source).not.toContain('projectApi.detail')
  })

  it('opens a read-only archived task detail from the project-style inspection item table', () => {
    const source = readFileSync(archiveDetailSourcePath, 'utf8')

    expect(source).toContain('@click="openTaskDetail(row)"')
    expect(source).toContain('v-model="taskDetailVisible"')
    expect(source).toContain('selectedTask')
    expect(source).toContain('taskWorkOrders(selectedTask)')
    expect(source).toContain('taskRectifications(selectedTask)')
    expect(source).toContain('@click="openWorkOrderDetail(order)"')
    expect(source).toContain('详情/日志')
    expect(source).toContain('v-model="workOrderDetailVisible"')
    expect(source).toContain('selectedWorkOrder')
    expect(source).toContain('selectedWorkOrderLogRows')
    expect(source).toContain('work-order-log-list')
    expect(source).toContain('omsLogPayload')
    expect(source).not.toContain('v-for="log in workOrderLogRows(order)"')
    expect(source).not.toContain('<el-tab-pane label="OMS 工单"')
    expect(source).not.toContain('刷新 OMS 日志')
    expect(source).not.toContain('workOrderReviewable')
    expect(source).not.toContain('handleCreateWorkOrders')
  })

  it('uses polished work-order cards and a timeline for archived OMS logs', () => {
    const source = readFileSync(archiveDetailSourcePath, 'utf8')

    expect(source).toContain('class="work-order-card"')
    expect(source).toContain('class="work-order-card-toolbar"')
    expect(source).toContain('class="work-order-card-summary"')
    expect(source).toContain('class="work-order-card-note"')
    expect(source).toContain('<el-timeline class="work-order-timeline">')
    expect(source).toContain('<el-timeline-item')
    expect(source).toContain(':timestamp="log.occurredAt || undefined"')
    expect(source).not.toContain('<div v-else class="work-order-log-list">')
  })
})
