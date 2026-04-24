import { describe, expect, it } from 'vitest'
import type { Standard } from '@/types'
import { buildVersionHistoryDetailSections } from '@/features/standards/standard-version-history'

function createStandard(overrides: Partial<Standard> = {}): Standard {
  return {
    id: 'std-1',
    standardCode: 'STD-FIN-001',
    title: 'Finance Control Baseline',
    category: 'internal',
    version: 'V1.0',
    publishDate: '2026-04-24',
    status: 'active',
    attachments: [],
    description: 'desc',
    createdAt: '2026-04-24T10:00:00',
    updatedAt: '2026-04-24T10:00:00',
    standardGroupId: 'group-1',
    versionNumber: 1,
    previousVersionId: undefined,
    visibilityLevel: 'PUBLIC',
    ownerScopeId: '9001',
    grants: [],
    operatorName: 'Alice',
    changeLog: '',
    ...overrides,
  }
}

describe('standard-version-history', () => {
  it('builds grouped detail sections for a historical version card', () => {
    const historical = createStandard({
      id: 'std-1',
      version: 'V1.0',
      versionNumber: 1,
      status: 'archived',
      visibilityLevel: 'SCOPED',
      ownerScopeId: '9009',
      grants: [{ scopeId: '9010', actions: ['view'] }],
      attachments: [
        {
          id: 'file-1',
          name: 'policy.pdf',
          url: '/files/policy.pdf',
          size: 1024,
          type: 'pdf',
          uploadedBy: 'Alice',
          uploadedAt: '2026-04-24 10:00:00',
        },
      ],
      description: '历史版本描述',
      changeLog: '补充审计要求',
    })

    expect(
      buildVersionHistoryDetailSections(historical, {
        categoryLabel: () => '内控制度',
        statusLabel: () => '已归档',
        scopeLabel: (scopeId) => `范围-${scopeId}`,
      }),
    ).toEqual([
      {
        title: '版本信息',
        items: [
          { label: '标准编号', value: 'STD-FIN-001' },
          { label: '标准名称', value: 'Finance Control Baseline' },
          { label: '分类', value: '内控制度' },
          { label: '版本', value: 'V1.0' },
          { label: '状态', value: '已归档' },
          { label: '发布日期', value: '2026-04-24' },
          { label: '操作人', value: 'Alice' },
        ],
      },
      {
        title: '权限信息',
        items: [
          { label: '可见范围', value: '域内可见' },
          { label: '维护域', value: '范围-9009' },
          { label: '共享范围', value: '范围-9010' },
        ],
      },
      {
        title: '内容说明',
        items: [
          { label: '描述', value: '历史版本描述' },
          { label: '修订说明', value: '补充审计要求' },
          { label: '创建时间', value: '2026-04-24T10:00:00' },
          { label: '更新时间', value: '2026-04-24T10:00:00' },
        ],
      },
    ])
  })
})
