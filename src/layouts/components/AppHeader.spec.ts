import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const headerSource = readFileSync(
  resolve(process.cwd(), 'src/layouts/components/AppHeader.vue'),
  'utf-8',
)

describe('app header shortcuts', () => {
  it('turns document center into the archive management shortcut', () => {
    expect(headerSource).toContain('@click="openDocumentCenter"')
    expect(headerSource).toContain("router.push('/resource/archives')")
  })

  it('turns message notification into the alert center shortcut with real unread count', () => {
    expect(headerSource).toContain('@click="openMessageCenter"')
    expect(headerSource).toContain("router.push('/workbench/alerts')")
    expect(headerSource).toContain('alertApi.list')
    expect(headerSource).toContain('unreadAlertCount')
    expect(headerSource).toContain(':hidden="unreadAlertCount === 0"')
    expect(headerSource).not.toContain('<el-badge is-dot class="notice-badge">')
  })
})
