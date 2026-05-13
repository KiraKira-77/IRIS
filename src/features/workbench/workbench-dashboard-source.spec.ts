import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const dashboardSource = readFileSync(
  resolve(process.cwd(), 'src/views/workbench/dashboard/index.vue'),
  'utf-8',
)

describe('workbench dashboard source', () => {
  it('loads workbench data from real APIs instead of mock fixtures', () => {
    expect(dashboardSource).toContain('projectApi.list')
    expect(dashboardSource).toContain('planApi.list')
    expect(dashboardSource).toContain('checklistApi.list')
    expect(dashboardSource).toContain('rectificationApi.list')
    expect(dashboardSource).toContain('archiveApi.list')
    expect(dashboardSource).toContain('alertApi.list')
    expect(dashboardSource).toContain('logApi.list')
    expect(dashboardSource).not.toContain('mockRectifications')
  })

  it('renders the selected neon HUD scanner cockpit instead of the old chart page', () => {
    expect(dashboardSource).toContain('class="fusion-map"')
    expect(dashboardSource).toContain('class="hud-radar"')
    expect(dashboardSource).toContain('class="hud-radar-label"')
    expect(dashboardSource).toContain('dashboardData.healthScore')
    expect(dashboardSource.match(/dashboardData\.healthScore/g)).toHaveLength(1)
    expect(dashboardSource).toContain('dashboardData.riskItems')
    expect(dashboardSource).toContain('dashboardData.alertItems')
    expect(dashboardSource).toContain('dashboardData.stanceMetrics')
    expect(dashboardSource).toContain('class="stance-metric"')
    expect(dashboardSource).toContain('class="fusion-context"')
    expect(dashboardSource).not.toContain('综合态势指数')
    expect(dashboardSource).not.toContain('dashboardData.stanceNodes')
    expect(dashboardSource).not.toContain('echarts')
  })

  it('keeps dashboard panel icons and scanner metrics bounded in the layout', () => {
    expect(dashboardSource).toContain(':deep(svg)')
    expect(dashboardSource).toContain('width: clamp(220px, 58%, 330px)')
    expect(dashboardSource).toContain('max-width: 158px')
  })

  it('keeps bottom content focused on actionable todos and recent activities', () => {
    expect(dashboardSource).toContain('class="fusion-panel todo-panel"')
    expect(dashboardSource).toContain('class="fusion-panel activity-panel"')
    expect(dashboardSource).toContain('dashboardData.alertItems')
    expect(dashboardSource).not.toContain('class="fusion-commands"')
    expect(dashboardSource).not.toContain('dashboardData.commandItems')
    expect(dashboardSource).not.toContain('function openCommand')
  })
})
