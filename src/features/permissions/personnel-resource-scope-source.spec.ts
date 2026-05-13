import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const personnelPageSource = readFileSync(join(here, '../../views/resource/personnel/index.vue'), 'utf8')
const apiSource = readFileSync(join(here, '../../api/resource-scope.ts'), 'utf8')
const typeSource = readFileSync(join(here, '../../types/index.ts'), 'utf8')

describe('personnel resource scope source', () => {
  it('exposes user resource scope membership APIs from system user API', () => {
    expect(typeSource).toContain('UserResourceScopeMembershipReplacePayload')
    expect(apiSource).toContain('listResourceScopeMemberships')
    expect(apiSource).toContain('/resource-scope-memberships')
    expect(apiSource).toContain('replaceResourceScopeMemberships')
  })

  it('shows and edits resource scope permissions from personnel management', () => {
    expect(personnelPageSource).toContain('资源域权限')
    expect(personnelPageSource).toContain('openResourceScopeDialog')
    expect(personnelPageSource).toContain('systemUserApi.listResourceScopeMemberships')
    expect(personnelPageSource).toContain('systemUserApi.replaceResourceScopeMemberships')
  })
})
