import type { Standard, StandardStatus, StandardVisibilityLevel } from '../../types/index.ts'
import {
  buildStandardDraftPayload,
  buildStandardListPage,
  buildStandardMutationPayload,
  buildStandardUpsertPayload,
  normalizeStandardFromApi,
} from './standard-data.ts'
import { describe, expect, it } from 'vitest'

function createStandard(overrides: Partial<Standard> = {}): Standard {
  return {
    id: '1001',
    standardCode: 'STD-FIN-001',
    title: 'Finance Control Baseline',
    category: 'internal',
    version: 'V1.0',
    publishDate: '2026-04-23',
    status: 'active',
    attachments: [],
    description: 'desc',
    createdAt: '2026-04-23 00:00:00',
    updatedAt: '2026-04-23 00:00:00',
    standardGroupId: 'group-1',
    versionNumber: 1,
    previousVersionId: undefined,
    visibilityLevel: 'PUBLIC',
    ownerScopeId: '9001',
    grants: [],
    changeLog: 'initial',
    ...overrides,
  }
}

describe('standard-data', () => {
  it('returns latest version per group when status filter is empty', () => {
    const standards = [
      createStandard({ id: '1001', standardGroupId: 'group-1', versionNumber: 1, version: 'V1.0' }),
      createStandard({ id: '1002', standardGroupId: 'group-1', versionNumber: 2, version: 'V2.0' }),
      createStandard({ id: '1003', standardGroupId: 'group-2', versionNumber: 1, version: 'V1.0' }),
    ]

    const page = buildStandardListPage(standards, {
      keyword: '',
      category: '',
      status: '',
      page: 1,
      pageSize: 10,
    })

    expect(page.total).toBe(2)
    expect(page.list.map((item) => item.id)).toEqual(['1002', '1003'])
  })

  it('returns matching versions when status filter is specified', () => {
    const standards = [
      createStandard({ id: '1001', standardGroupId: 'group-1', versionNumber: 1, status: 'archived' }),
      createStandard({ id: '1002', standardGroupId: 'group-1', versionNumber: 2, status: 'active' }),
    ]

    const page = buildStandardListPage(standards, {
      keyword: '',
      category: '',
      status: 'archived',
      page: 1,
      pageSize: 10,
    })

    expect(page.total).toBe(1)
    expect(page.list.map((item) => item.id)).toEqual(['1001'])
  })

  it('builds upsert payload without tags and normalizes grants', () => {
    const payload = buildStandardUpsertPayload(
      {
        standardCode: 'STD-SYS-009',
        title: 'Policy Compendium',
        category: 'system',
        version: 'V3.0',
        description: 'sync backend',
        visibilityLevel: 'SCOPED' as StandardVisibilityLevel,
        ownerScopeId: '9001',
        grantScopeIds: ['9001', '9002', '9002'],
      },
      {
        tenantId: 1001,
        status: 'draft' as StandardStatus,
        publishDate: null,
        standardGroupId: 'group-9',
        versionNumber: 3,
        previousVersionId: '9000',
        changeLog: 'upgrade draft',
      },
    )

    expect(payload).toEqual({
      tenantId: 1001,
      standardCode: 'STD-SYS-009',
      title: 'Policy Compendium',
      category: 'system',
      version: 'V3.0',
      status: 'draft',
      publishDate: null,
      description: 'sync backend',
      standardGroupId: 'group-9',
      versionNumber: 3,
      previousVersionId: '9000',
      visibilityLevel: 'SCOPED',
      ownerScopeId: '9001',
      grantScopeIds: ['9002'],
      changeLog: 'upgrade draft',
    })
  })

  it('builds draft payload without tags', () => {
    const source = createStandard({
      id: '1002',
      standardGroupId: 'group-1',
      version: 'V2.0',
      versionNumber: 2,
      visibilityLevel: 'SCOPED',
      ownerScopeId: '9001',
      grants: [{ scopeId: '9002', actions: ['view'] }],
      description: 'current',
    })

    const payload = buildStandardDraftPayload(
      source,
      {
        tenantId: 1001,
        version: 'V3.0',
        changeLog: 'add audit requirements',
      },
      [createStandard({ standardGroupId: 'group-1', versionNumber: 1 }), source],
    )

    expect(payload).toEqual({
      tenantId: 1001,
      standardCode: 'STD-FIN-001',
      title: 'Finance Control Baseline',
      category: 'internal',
      version: 'V3.0',
      status: 'draft',
      publishDate: null,
      description: 'current',
      standardGroupId: 'group-1',
      versionNumber: 3,
      previousVersionId: '1002',
      visibilityLevel: 'SCOPED',
      ownerScopeId: '9001',
      grantScopeIds: ['9002'],
      changeLog: 'add audit requirements',
    })
  })

  it('normalizes API records without tags', () => {
    const normalized = normalizeStandardFromApi({
      id: '1008',
      standardCode: 'STD-SEC-008',
      title: 'Information Security Policy',
      category: 'system',
      version: 'V1.1',
      publishDate: null,
      status: 'draft',
      attachments: ['doc-1'],
      description: '',
      createdAt: '2026-04-23T00:00:00',
      updatedAt: '2026-04-23T00:00:00',
      standardGroupId: 'group-8',
      versionNumber: 2,
      previousVersionId: '1007',
      visibilityLevel: 'PUBLIC',
      ownerScopeId: '9002',
      grants: [],
      changeLog: 'draft',
    })

    expect(normalized).toEqual({
      id: '1008',
      standardCode: 'STD-SEC-008',
      title: 'Information Security Policy',
      category: 'system',
      version: 'V1.1',
      publishDate: '-',
      status: 'draft',
      attachments: [],
      description: '',
      createdAt: '2026-04-23T00:00:00',
      updatedAt: '2026-04-23T00:00:00',
      standardGroupId: 'group-8',
      versionNumber: 2,
      previousVersionId: '1007',
      visibilityLevel: 'PUBLIC',
      ownerScopeId: '9002',
      grants: [],
      changeLog: 'draft',
    })
  })

  it('builds mutation payload without tags', () => {
    const payload = buildStandardMutationPayload(
      createStandard({
        id: '1010',
        publishDate: '-',
        status: 'draft',
        visibilityLevel: 'SCOPED',
        grants: [{ scopeId: '9003', actions: ['view'] }],
        previousVersionId: '1009',
        changeLog: 'pending release',
      }),
      {
        tenantId: 1001,
        status: 'active',
        publishDate: '2026-04-24',
      },
    )

    expect(payload).toEqual({
      tenantId: 1001,
      standardCode: 'STD-FIN-001',
      title: 'Finance Control Baseline',
      category: 'internal',
      version: 'V1.0',
      status: 'active',
      publishDate: '2026-04-24',
      description: 'desc',
      standardGroupId: 'group-1',
      versionNumber: 1,
      previousVersionId: '1009',
      visibilityLevel: 'SCOPED',
      ownerScopeId: '9001',
      grantScopeIds: ['9003'],
      changeLog: 'pending release',
    })
  })
})
