import { describe, expect, it } from 'vitest'
import { getRoleScopeTypeLabel, normalizeRoleScopeType, ROLE_SCOPE_TYPE } from './role-scope.ts'

describe('role scope', () => {
  it('normalizes legacy and current scope types to current values', () => {
    expect(normalizeRoleScopeType('PLATFORM')).toBe(ROLE_SCOPE_TYPE.global)
    expect(normalizeRoleScopeType('TENANT')).toBe(ROLE_SCOPE_TYPE.business)
    expect(normalizeRoleScopeType('GLOBAL')).toBe(ROLE_SCOPE_TYPE.global)
    expect(normalizeRoleScopeType('BUSINESS')).toBe(ROLE_SCOPE_TYPE.business)
  })

  it('maps scope types to chinese labels', () => {
    expect(getRoleScopeTypeLabel('PLATFORM')).toBe('全局级')
    expect(getRoleScopeTypeLabel('GLOBAL')).toBe('全局级')
    expect(getRoleScopeTypeLabel('TENANT')).toBe('业务级')
    expect(getRoleScopeTypeLabel('BUSINESS')).toBe('业务级')
    expect(getRoleScopeTypeLabel('UNKNOWN')).toBe('UNKNOWN')
  })
})
