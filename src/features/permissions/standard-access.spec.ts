import {
  buildStandardAccessState,
  filterVisibleStandards,
  type StandardAccessContext,
} from './standard-access.ts'
import type { Standard } from '../../types/index.ts'
import { describe, expect, it } from 'vitest'

function createStandard(overrides: Partial<Standard> = {}): Standard {
  return {
    id: 'std-001',
    standardCode: 'STD-FIN-001',
    title: 'Finance Control Standard',
    category: 'internal',
    version: 'V1.0',
    publishDate: '2026-04-22',
    status: 'active',
    attachments: [],
    description: 'desc',
    createdAt: '2026-04-22',
    updatedAt: '2026-04-22',
    standardGroupId: 'std-001',
    versionNumber: 1,
    visibilityLevel: 'PUBLIC',
    ownerScopeId: 'scope.finance',
    grants: [],
    ...overrides,
  }
}

describe('standard-access', () => {
  it('keeps public standards visible', () => {
    const standards = [createStandard()]

    expect(
      filterVisibleStandards(standards, {
        isSuperAdmin: false,
        scopePermissions: [],
      }),
    ).toEqual(standards)
  })

  it('builds edit access for owner-scope members', () => {
    const standard = createStandard()

    expect(
      buildStandardAccessState(standard, {
        isSuperAdmin: false,
        scopePermissions: [
          {
            scopeId: 'scope.finance',
            actions: ['view', 'edit'],
          },
        ],
      }),
    ).toEqual({
      canView: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
      canManage: false,
    })

    expect(
      buildStandardAccessState(standard, {
        isSuperAdmin: false,
        scopePermissions: [],
      }),
    ).toEqual({
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManage: false,
    })
  })

  it('builds view access for shared-scope members', () => {
    const standard = createStandard({
      visibilityLevel: 'SCOPED',
      grants: [
        {
          scopeId: 'scope.it',
          actions: ['view'],
        },
      ],
    })

    expect(
      buildStandardAccessState(standard, {
        isSuperAdmin: false,
        scopePermissions: [
          {
            scopeId: 'scope.it',
            actions: ['view'],
          },
        ],
      }),
    ).toEqual({
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManage: false,
    })
  })

  it('gives super admin full access', () => {
    expect(
      buildStandardAccessState(createStandard({ visibilityLevel: 'SCOPED' }), {
        isSuperAdmin: true,
        scopePermissions: [],
      }),
    ).toEqual({
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canManage: true,
    })
  })

  it('only enables create when scope has create permission', () => {
    const standard = createStandard({ visibilityLevel: 'SCOPED' })

    expect(
      buildStandardAccessState(standard, createContext('scope.finance', ['create'])).canCreate,
    ).toBe(true)
    expect(
      buildStandardAccessState(standard, createContext('scope.finance', ['view'])).canCreate,
    ).toBe(false)
  })
})

function createContext(
  scopeId: string,
  actions: StandardAccessContext['scopePermissions'][number]['actions'],
): StandardAccessContext {
  return {
    isSuperAdmin: false,
    scopePermissions: [
      {
        scopeId,
        actions,
      },
    ],
  }
}
