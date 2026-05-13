import {
  buildChecklistAccessState,
  filterVisibleChecklists,
  type ChecklistAccessContext,
} from './checklist-access.ts'
import type { ControlChecklist } from '../../types/index.ts'
import { describe, expect, it } from 'vitest'

function createChecklist(overrides: Partial<ControlChecklist> = {}): ControlChecklist {
  return {
    id: 'checklist-001',
    code: 'CL-2026-001',
    name: 'Finance Control Checklist',
    description: 'desc',
    version: 'V1.0',
    ownerScopeId: 'scope.finance',
    grants: [],
    items: [],
    status: 'active',
    uploadDate: '2026-04-27',
    createdAt: '2026-04-27 09:00:00',
    updatedAt: '2026-04-27 09:00:00',
    ...overrides,
  }
}

describe('checklist-access', () => {
  it('filters checklists to owner or shared scopes visible to current user', () => {
    const ownerVisible = createChecklist({ id: 'owner-visible' })
    const sharedVisible = createChecklist({
      id: 'shared-visible',
      ownerScopeId: 'scope.hr',
      grants: [{ scopeId: 'scope.finance', actions: ['view'] }],
    })
    const hidden = createChecklist({
      id: 'hidden',
      ownerScopeId: 'scope.it',
      grants: [{ scopeId: 'scope.legal', actions: ['view'] }],
    })

    expect(
      filterVisibleChecklists(
        [ownerVisible, sharedVisible, hidden],
        createContext('scope.finance', ['view']),
      ).map((item) => item.id),
    ).toEqual(['owner-visible', 'shared-visible'])
  })

  it('builds edit and delete access only from owner-scope permissions', () => {
    const checklist = createChecklist()

    expect(buildChecklistAccessState(checklist, createContext('scope.finance', ['edit']))).toEqual({
      canView: true,
      canCreate: false,
      canEdit: true,
      canDelete: false,
      canManage: false,
    })

    expect(
      buildChecklistAccessState(checklist, createContext('scope.finance', ['delete'])).canDelete,
    ).toBe(true)
  })

  it('keeps shared-scope access read-only', () => {
    const checklist = createChecklist({
      ownerScopeId: 'scope.hr',
      grants: [{ scopeId: 'scope.finance', actions: ['view'] }],
    })

    expect(buildChecklistAccessState(checklist, createContext('scope.finance', ['view']))).toEqual({
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canManage: false,
    })
  })

  it('allows create when user has create permission in the owner scope', () => {
    const checklist = createChecklist()

    expect(
      buildChecklistAccessState(checklist, createContext('scope.finance', ['create'])).canCreate,
    ).toBe(true)
    expect(
      buildChecklistAccessState(checklist, createContext('scope.finance', ['view'])).canCreate,
    ).toBe(false)
  })

  it('gives super admin full checklist access', () => {
    expect(
      buildChecklistAccessState(createChecklist({ ownerScopeId: 'scope.hr' }), {
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
})

function createContext(
  scopeId: string,
  actions: ChecklistAccessContext['scopePermissions'][number]['actions'],
): ChecklistAccessContext {
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
