import assert from 'node:assert/strict'
import {
  buildStandardAccessState,
  filterVisibleStandards,
  type StandardAccessContext,
} from './standard-access.ts'
import type { Standard } from '../../types/index.ts'

function createStandard(overrides: Partial<Standard> = {}): Standard {
  return {
    id: 'std-001',
    title: '企业内部控制基本规范',
    category: 'internal',
    version: 'V1.0',
    publishDate: '2026-04-22',
    status: 'active',
    attachments: [],
    tags: ['内控'],
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

{
  const standards = [createStandard()]

  assert.deepEqual(
    filterVisibleStandards(standards, {
      isSuperAdmin: false,
      scopePermissions: [],
    }),
    standards,
  )
}

{
  const standard = createStandard()

  assert.deepEqual(
    buildStandardAccessState(standard, {
      isSuperAdmin: false,
      scopePermissions: [
        {
          scopeId: 'scope.finance',
          actions: ['view', 'edit'],
        },
      ],
    }),
    {
      canView: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
      canManage: false,
    },
  )

  assert.deepEqual(
    buildStandardAccessState(standard, {
      isSuperAdmin: false,
      scopePermissions: [],
    }),
    {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManage: false,
    },
  )
}

{
  const standard = createStandard({
    visibilityLevel: 'SCOPED',
    grants: [
      {
        scopeId: 'scope.it',
        actions: ['view'],
      },
    ],
  })

  assert.deepEqual(
    buildStandardAccessState(standard, {
      isSuperAdmin: false,
      scopePermissions: [
        {
          scopeId: 'scope.it',
          actions: ['view'],
        },
      ],
    }),
    {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManage: false,
    },
  )
}

{
  assert.deepEqual(
    buildStandardAccessState(createStandard({ visibilityLevel: 'SCOPED' }), {
      isSuperAdmin: true,
      scopePermissions: [],
    }),
    {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canManage: true,
    },
  )
}

{
  const standard = createStandard({ visibilityLevel: 'SCOPED' })
  const canCreateState = buildStandardAccessState(standard, createContext('scope.finance', ['create']))
  const cannotCreateState = buildStandardAccessState(standard, createContext('scope.finance', ['view']))

  assert.equal(canCreateState.canCreate, true)
  assert.equal(cannotCreateState.canCreate, false)
}

function createContext(scopeId: string, actions: StandardAccessContext['scopePermissions'][number]['actions']): StandardAccessContext {
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
