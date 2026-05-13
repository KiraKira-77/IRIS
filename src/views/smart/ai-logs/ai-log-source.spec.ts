import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../../..')

const readSource = (path: string) => readFileSync(join(root, path), 'utf8')

describe('AI chat trace log page source', () => {
  it('exposes a smart AI logs route and menu entry', () => {
    const routerSource = readSource('router/index.ts')
    const menuSource = readSource('features/permissions/menu-access.ts')

    expect(routerSource).toContain("path: 'smart/ai-logs'")
    expect(routerSource).toContain("name: 'AiLogs'")
    expect(routerSource).toContain("import('@/views/smart/ai-logs/index.vue')")
    expect(menuSource).toContain("code: 'smart.aiLogs'")
    expect(menuSource).toContain("path: '/smart/ai-logs'")
  })

  it('exposes typed AI trace APIs and data contracts', () => {
    const apiSource = readSource('api/index.ts')
    const typeSource = readSource('types/index.ts')

    expect(apiSource).toContain('aiChatTraceApi')
    expect(apiSource).toContain("request.get<PageResult<AiChatTraceListItem>>('/v1/ai/chat/traces'")
    expect(apiSource).toContain("request.get<AiChatTraceDetail>(`/v1/ai/chat/traces/${traceId}`")
    expect(typeSource).toContain('export interface AiChatTraceListItem')
    expect(typeSource).toContain('export interface AiChatTraceDetail')
    expect(typeSource).toContain('export interface AiChatTraceEvent')
  })

  it('renders a trace list and detail drawer with raw event details', () => {
    const pagePath = join(root, 'views/smart/ai-logs/index.vue')

    expect(existsSync(pagePath)).toBe(true)

    const pageSource = readFileSync(pagePath, 'utf8')

    expect(pageSource).toContain('aiChatTraceApi.list')
    expect(pageSource).toContain('aiChatTraceApi.detail')
    expect(pageSource).toContain('el-table')
    expect(pageSource).toContain('el-drawer')
    expect(pageSource).toContain('detailJson')
    expect(pageSource).toContain('toolNamesJson')
    expect(pageSource).toContain('citationsJson')
  })
})
