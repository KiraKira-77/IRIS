import type { Standard } from '@/types'

interface VersionHistoryDetailFormatters {
  categoryLabel: (value: Standard['category']) => string
  statusLabel: (value: Standard['status']) => string
  scopeLabel: (scopeId: string) => string
}

interface VersionChangeFormatters {
  categoryLabel: (value: Standard['category']) => string
  visibilityLabel: (value: Standard['visibilityLevel']) => string
  scopeLabel: (scopeId: string) => string
}

export interface StandardVersionChange {
  field: string
  label: string
  oldVal: string
  newVal: string
}

export interface VersionHistoryDetailItem {
  label: string
  value: string
}

export interface VersionHistoryDetailSection {
  title: string
  items: VersionHistoryDetailItem[]
}

export function buildVersionHistoryDetailSections(
  standard: Standard,
  formatters: VersionHistoryDetailFormatters,
): VersionHistoryDetailSection[] {
  const sharedScopes =
    standard.grants.length > 0
      ? standard.grants.map((grant) => formatters.scopeLabel(grant.scopeId)).join('、')
      : '无'

  return [
    {
      title: '版本信息',
      items: [
        { label: '标准编号', value: standard.standardCode },
        { label: '标准名称', value: standard.title },
        { label: '分类', value: formatters.categoryLabel(standard.category) },
        { label: '版本', value: standard.version },
        { label: '状态', value: formatters.statusLabel(standard.status) },
        { label: '发布日期', value: standard.publishDate || '-' },
        { label: '操作人', value: standard.operatorName || '未知' },
      ],
    },
    {
      title: '权限信息',
      items: [
        { label: '可见范围', value: standard.visibilityLevel === 'PUBLIC' ? '全员可见' : '域内可见' },
        { label: '维护域', value: formatters.scopeLabel(standard.ownerScopeId) },
        { label: '共享范围', value: sharedScopes },
      ],
    },
    {
      title: '内容说明',
      items: [
        { label: '描述', value: standard.description || '暂无描述' },
        { label: '修订说明', value: standard.changeLog || '无' },
        { label: '创建时间', value: standard.createdAt || '-' },
        { label: '更新时间', value: standard.updatedAt || '-' },
      ],
    },
  ]
}

export function buildStandardVersionChanges(
  current: Standard,
  previous: Standard | undefined,
  formatters: VersionChangeFormatters,
): StandardVersionChange[] {
  if (!previous) return []

  const sharedScopeText = (standard: Standard) =>
    standard.grants.length > 0
      ? standard.grants.map((grant) => formatters.scopeLabel(grant.scopeId)).join('、')
      : '无'

  const fields: Array<{
    field: string
    label: string
    oldVal: string
    newVal: string
  }> = [
    {
      field: 'standardCode',
      label: '标准编号',
      oldVal: previous.standardCode,
      newVal: current.standardCode,
    },
    { field: 'title', label: '标准名称', oldVal: previous.title, newVal: current.title },
    {
      field: 'category',
      label: '分类',
      oldVal: formatters.categoryLabel(previous.category),
      newVal: formatters.categoryLabel(current.category),
    },
    {
      field: 'description',
      label: '描述',
      oldVal: previous.description || '',
      newVal: current.description || '',
    },
    {
      field: 'visibilityLevel',
      label: '可见范围',
      oldVal: formatters.visibilityLabel(previous.visibilityLevel),
      newVal: formatters.visibilityLabel(current.visibilityLevel),
    },
    {
      field: 'ownerScopeId',
      label: '维护域',
      oldVal: formatters.scopeLabel(previous.ownerScopeId),
      newVal: formatters.scopeLabel(current.ownerScopeId),
    },
    {
      field: 'grants',
      label: '共享范围',
      oldVal: sharedScopeText(previous),
      newVal: sharedScopeText(current),
    },
  ]

  return fields.filter((item) => item.oldVal !== item.newVal)
}
