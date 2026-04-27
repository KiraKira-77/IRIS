import type { Standard, StandardVisibilityLevel } from '../../types/index.ts'
import * as standardData from './standard-data.ts'
import {
  buildStandardSubmitState,
  buildStandardDraftPayload,
  buildStandardListPage,
  buildStandardMutationPayload,
  buildStandardSearchInteraction,
  buildStandardUpsertPayload,
  formatStandardUploadDate,
  normalizeStandardPageFromApi,
  normalizeStandardFromApi,
  validateStandardEditorForm,
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
    versionCount: 1,
    previousVersionId: undefined,
    visibilityLevel: 'PUBLIC',
    ownerScopeId: '9001',
    grants: [],
    changeLog: 'initial',
    operatorName: 'Platform Administrator',
    ...overrides,
  }
}

describe('standard-data', () => {
  it('submits search by resetting to first page and forcing reload even without filters', () => {
    const buildSearchInteraction = (standardData as Record<string, unknown>)
      .buildStandardSearchInteraction as
      | ((
          action: string,
          form: { keyword: string; category: string; status: string },
          pagination: { page: number; pageSize: number; total: number },
          overrides?: { page?: number; pageSize?: number },
        ) => unknown)
      | undefined

    expect(buildSearchInteraction).toBeTypeOf('function')
    expect(
      buildSearchInteraction?.(
        'submit',
        { keyword: '', category: '', status: '' },
        { page: 3, pageSize: 20, total: 56 },
      ),
    ).toEqual({
      form: { keyword: '', category: '', status: '' },
      pagination: { page: 1, pageSize: 20, total: 56 },
      shouldReload: true,
    })
  })

  it('resets search conditions and forces a full refresh', () => {
    const buildSearchInteraction = (standardData as Record<string, unknown>)
      .buildStandardSearchInteraction as
      | ((
          action: string,
          form: { keyword: string; category: string; status: string },
          pagination: { page: number; pageSize: number; total: number },
          overrides?: { page?: number; pageSize?: number },
        ) => unknown)
      | undefined

    expect(buildSearchInteraction).toBeTypeOf('function')
    expect(
      buildSearchInteraction?.(
        'reset',
        { keyword: '制度', category: 'internal', status: 'draft' },
        { page: 4, pageSize: 10, total: 28 },
      ),
    ).toEqual({
      form: { keyword: '', category: '', status: '' },
      pagination: { page: 1, pageSize: 10, total: 28 },
      shouldReload: true,
    })
  })

  it('applies dropdown filter changes by resetting to first page and reloading', () => {
    const interaction = buildStandardSearchInteraction(
      'filter' as never,
      { keyword: 'finance', category: 'internal', status: 'active' },
      { page: 4, pageSize: 20, total: 56 },
    )

    expect(interaction).toEqual({
      form: { keyword: 'finance', category: 'internal', status: 'active' },
      pagination: { page: 1, pageSize: 20, total: 56 },
      shouldReload: true,
    })
  })

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

  it('builds submit state for a new active standard', () => {
    expect(buildStandardSubmitState('active', null, '2026-04-24')).toEqual({
      status: 'active',
      publishDate: '2026-04-24',
    })
  })

  it('keeps existing publish date when archiving an active standard', () => {
    expect(
      buildStandardSubmitState(
        'archived',
        createStandard({
          status: 'active',
          publishDate: '2026-04-20',
        }),
        '2026-04-24',
      ),
    ).toEqual({
      status: 'archived',
      publishDate: '2026-04-20',
    })
  })

  it('formats upload date from created time when timestamp exists', () => {
    expect(formatStandardUploadDate('2026-04-24T09:15:00', '-')).toBe('2026-04-24')
  })

  it('falls back to publish date when created time is missing', () => {
    expect(formatStandardUploadDate('', '2026-04-23')).toBe('2026-04-23')
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
        status: 'draft',
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
      versionCount: 3,
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
      versionCount: 3,
      previousVersionId: '1007',
      visibilityLevel: 'PUBLIC',
      ownerScopeId: '9002',
      grants: [],
      changeLog: 'draft',
    })
  })

  it('normalizes backend page records into frontend page shape', () => {
    const page = normalizeStandardPageFromApi({
      records: [
        {
          id: '1008',
          standardCode: 'STD-SEC-008',
          title: 'Information Security Policy',
          category: 'system',
          version: 'V1.1',
          publishDate: null,
          status: 'draft',
          attachments: [],
          description: '',
          createdAt: '2026-04-23T00:00:00',
          updatedAt: '2026-04-23T00:00:00',
          standardGroupId: 'group-8',
          versionNumber: 2,
          versionCount: 3,
          previousVersionId: '1007',
          visibilityLevel: 'PUBLIC',
          ownerScopeId: '9002',
          grants: [],
          changeLog: 'draft',
        },
      ],
      total: 16,
      pageNo: 2,
      pageSize: 10,
    })

    expect(page.total).toBe(16)
    expect(page.page).toBe(2)
    expect(page.pageSize).toBe(10)
    expect(page.list[0]?.publishDate).toBe('-')
    expect(page.list[0]?.versionCount).toBe(3)
  })

  it('validates required fields and duplicate version labels before submit', () => {
    const current = createStandard({
      id: '1002',
      standardGroupId: 'group-1',
      standardCode: 'STD-FIN-001',
      version: 'V2.0',
    })

    expect(
      validateStandardEditorForm(
        {
          standardCode: 'STD-FIN-001',
          title: 'Updated',
          category: '',
          version: 'V1.0',
          description: '',
          visibilityLevel: 'PUBLIC',
          ownerScopeId: '9001',
          grantScopeIds: [],
        },
        [createStandard({ id: '1001', standardGroupId: 'group-1', version: 'V1.0' }), current],
        current,
      ),
    ).toEqual(['请选择分类', '当前标准组已存在相同版本号'])
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
