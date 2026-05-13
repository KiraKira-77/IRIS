import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const standardsPageSource = readFileSync(join(here, '../../views/resource/standards/index.vue'), 'utf8')
const apiSource = readFileSync(join(here, '../../api/index.ts'), 'utf8')
const typeSource = readFileSync(join(here, '../../types/index.ts'), 'utf8')

describe('standard lifecycle source', () => {
  it('keeps archived out of the main status filter and exposes disabled instead', () => {
    expect(typeSource).toContain("'disabled'")
    expect(standardsPageSource).toContain('value="disabled"')
    expect(standardsPageSource).not.toContain('value="archived"')
  })

  it('uses dedicated lifecycle endpoints for disable and enable actions', () => {
    expect(apiSource).toContain('disable:')
    expect(apiSource).toContain('/disable')
    expect(apiSource).toContain('enable:')
    expect(apiSource).toContain('/enable')
    expect(standardsPageSource).toContain('standardApi.disable')
    expect(standardsPageSource).toContain('standardApi.enable')
  })

  it('publishes draft standards through the publish endpoint instead of update-only activation', () => {
    expect(standardsPageSource).toContain('standardApi.publish(savedStandard.id)')
  })
})
