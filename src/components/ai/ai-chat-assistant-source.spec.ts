import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../..')

const readSource = (path: string) => readFileSync(join(root, path), 'utf8')

describe('AI chat assistant source', () => {
  it('mounts the assistant in the authenticated app layout', () => {
    const layoutSource = readSource('layouts/AppLayout.vue')

    expect(layoutSource).toContain('AiChatAssistant')
    expect(layoutSource).toContain('<AiChatAssistant />')
  })

  it('exposes typed AI chat API methods', () => {
    const apiSource = readSource('api/index.ts')
    const typeSource = readSource('types/index.ts')

    expect(apiSource).toContain('aiChatApi')
    expect(apiSource).toContain("request.post<AiChatSession>('/v1/ai/chat/sessions'")
    expect(apiSource).toContain("request.post<AiChatMessage>('/v1/ai/chat/messages'")
    expect(apiSource).toContain('timeout: 120000')
    expect(typeSource).toContain('export interface AiChatMessagePayload')
  })

  it('sends page context with the current route path', () => {
    const assistantPath = join(root, 'components/ai/AiChatAssistant.vue')

    expect(existsSync(assistantPath)).toBe(true)

    const assistantSource = readFileSync(assistantPath, 'utf8')

    expect(assistantSource).toContain('useRoute')
    expect(assistantSource).toContain('routePath: route.path')
    expect(assistantSource).toContain('aiChatApi.sendMessage')
  })

  it('renders answer citations returned by the backend', () => {
    const assistantSource = readSource('components/ai/AiChatAssistant.vue')

    expect(assistantSource).toContain('message.citations')
    expect(assistantSource).toContain('citation.title')
    expect(assistantSource).toContain('citation.path')
  })
})
