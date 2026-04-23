import assert from 'node:assert/strict'
import type { Standard, StandardStatus, StandardVisibilityLevel } from '../../types/index.ts'
import {
  buildStandardDraftPayload,
  buildStandardListPage,
  buildStandardMutationPayload,
  buildStandardUpsertPayload,
  normalizeStandardFromApi,
} from './standard-data.ts'

function createStandard(overrides: Partial<Standard> = {}): Standard {
  return {
    id: '1001',
    title: '财务内控基本规范',
    category: 'internal',
    version: 'V1.0',
    publishDate: '2026-04-23',
    status: 'active',
    attachments: [],
    tags: ['内控'],
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

{
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

  assert.equal(page.total, 2)
  assert.deepEqual(
    page.list.map((item) => item.id),
    ['1002', '1003'],
  )
}

{
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

  assert.equal(page.total, 1)
  assert.deepEqual(
    page.list.map((item) => item.id),
    ['1001'],
  )
}

{
  const payload = buildStandardUpsertPayload(
    {
      title: '制度汇编',
      category: 'system',
      version: 'V3.0',
      description: '同步后端',
      visibilityLevel: 'SCOPED' as StandardVisibilityLevel,
      ownerScopeId: '9001',
      grantScopeIds: ['9001', '9002', '9002'],
      tags: ['制度', '制度', '  合规  '],
    },
    {
      tenantId: 1001,
      status: 'draft' as StandardStatus,
      publishDate: null,
      standardGroupId: 'group-9',
      versionNumber: 3,
      previousVersionId: '9000',
      changeLog: '升级草稿',
    },
  )

  assert.deepEqual(payload, {
    tenantId: 1001,
    title: '制度汇编',
    category: 'system',
    version: 'V3.0',
    status: 'draft',
    publishDate: null,
    description: '同步后端',
    tags: ['制度', '合规'],
    standardGroupId: 'group-9',
    versionNumber: 3,
    previousVersionId: '9000',
    visibilityLevel: 'SCOPED',
    ownerScopeId: '9001',
    grantScopeIds: ['9002'],
    changeLog: '升级草稿',
  })
}

{
  const source = createStandard({
    id: '1002',
    standardGroupId: 'group-1',
    version: 'V2.0',
    versionNumber: 2,
    visibilityLevel: 'SCOPED',
    ownerScopeId: '9001',
    grants: [{ scopeId: '9002', actions: ['view'] }],
    tags: ['内控', '财务'],
    description: 'current',
  })

  const payload = buildStandardDraftPayload(
    source,
    {
      tenantId: 1001,
      version: 'V3.0',
      changeLog: '新增审计要求',
    },
    [createStandard({ standardGroupId: 'group-1', versionNumber: 1 }), source],
  )

  assert.deepEqual(payload, {
    tenantId: 1001,
    title: '财务内控基本规范',
    category: 'internal',
    version: 'V3.0',
    status: 'draft',
    publishDate: null,
    description: 'current',
    tags: ['内控', '财务'],
    standardGroupId: 'group-1',
    versionNumber: 3,
    previousVersionId: '1002',
    visibilityLevel: 'SCOPED',
    ownerScopeId: '9001',
    grantScopeIds: ['9002'],
    changeLog: '新增审计要求',
  })
}

{
  const normalized = normalizeStandardFromApi({
    id: '1008',
    title: '信息安全制度',
    category: 'system',
    version: 'V1.1',
    publishDate: null,
    status: 'draft',
    attachments: ['doc-1'],
    tags: ['安全'],
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

  assert.deepEqual(normalized, {
    id: '1008',
    title: '信息安全制度',
    category: 'system',
    version: 'V1.1',
    publishDate: '-',
    status: 'draft',
    attachments: [],
    tags: ['安全'],
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
}

{
  const payload = buildStandardMutationPayload(
    createStandard({
      id: '1010',
      publishDate: '-',
      status: 'draft',
      visibilityLevel: 'SCOPED',
      grants: [{ scopeId: '9003', actions: ['view'] }],
      previousVersionId: '1009',
      changeLog: '待发布',
    }),
    {
      tenantId: 1001,
      status: 'active',
      publishDate: '2026-04-24',
    },
  )

  assert.deepEqual(payload, {
    tenantId: 1001,
    title: '财务内控基本规范',
    category: 'internal',
    version: 'V1.0',
    status: 'active',
    publishDate: '2026-04-24',
    description: 'desc',
    tags: ['内控'],
    standardGroupId: 'group-1',
    versionNumber: 1,
    previousVersionId: '1009',
    visibilityLevel: 'SCOPED',
    ownerScopeId: '9001',
    grantScopeIds: ['9003'],
    changeLog: '待发布',
  })
}
