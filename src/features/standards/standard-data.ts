import type {
  Attachment,
  Standard,
  StandardCategory,
  StandardStatus,
  StandardUpsertPayload,
  StandardVisibilityLevel,
} from '../../types/index.ts'

export interface StandardListQuery {
  keyword: string
  category: string
  status: string
  page: number
  pageSize: number
}

export interface StandardListPage {
  list: Standard[]
  total: number
  page?: number
  pageSize?: number
}

export interface StandardSearchFormValue {
  keyword: string
  category: string
  status: string
}

export interface StandardPaginationState {
  page: number
  pageSize: number
  total: number
}

export interface StandardSearchInteraction {
  form: StandardSearchFormValue
  pagination: StandardPaginationState
  shouldReload: boolean
}

export type StandardSearchAction = 'submit' | 'filter' | 'reset' | 'paginate' | 'resize'

export interface StandardEditorFormValue {
  standardCode: string
  title: string
  category: string
  version: string
  description: string
  visibilityLevel: StandardVisibilityLevel
  ownerScopeId: string
  grantScopeIds: string[]
}

export interface StandardUpsertOptions {
  tenantId: number
  status: StandardStatus
  publishDate: string | null
  standardGroupId?: string
  versionNumber?: number
  previousVersionId?: string
  changeLog?: string
}

export interface StandardDraftOptions {
  tenantId: number
  version: string
  changeLog: string
}

export interface StandardApiRecord extends Omit<Standard, 'attachments' | 'publishDate' | 'versionCount'> {
  attachments?: unknown[]
  publishDate: string | null
  versionCount?: number
}

export interface StandardApiPageRecord {
  records?: StandardApiRecord[]
  list?: StandardApiRecord[]
  total?: number
  pageNo?: number
  page?: number
  pageSize?: number
}

export interface StandardMutationOptions {
  tenantId: number
  status?: StandardStatus
  publishDate?: string | null
  changeLog?: string
}

export interface StandardSubmitState {
  status: StandardStatus
  publishDate: string | null
}

export function buildStandardListPage(
  standards: Standard[],
  query: StandardListQuery,
): StandardListPage {
  const filtered = standards.filter((item) => {
    if (query.keyword && !item.title.includes(query.keyword)) return false
    if (query.category && item.category !== query.category) return false
    if (query.status && item.status !== query.status) return false
    return true
  })

  const result = query.status ? filtered : pickLatestVersions(filtered)
  const start = (query.page - 1) * query.pageSize

  return {
    list: result.slice(start, start + query.pageSize),
    total: result.length,
  }
}

export function buildStandardSearchInteraction(
  action: StandardSearchAction,
  form: StandardSearchFormValue,
  pagination: StandardPaginationState,
  overrides: { page?: number; pageSize?: number } = {},
): StandardSearchInteraction {
  if (action === 'reset') {
    return {
      form: { keyword: '', category: '', status: '' },
      pagination: {
        page: 1,
        pageSize: pagination.pageSize,
        total: pagination.total,
      },
      shouldReload: true,
    }
  }

  if (action === 'submit' || action === 'filter') {
    return {
      form: { ...form },
      pagination: {
        page: 1,
        pageSize: pagination.pageSize,
        total: pagination.total,
      },
      shouldReload: true,
    }
  }

  if (action === 'resize') {
    return {
      form: { ...form },
      pagination: {
        page: 1,
        pageSize: overrides.pageSize ?? pagination.pageSize,
        total: pagination.total,
      },
      shouldReload: false,
    }
  }

  return {
    form: { ...form },
    pagination: {
      page: overrides.page ?? pagination.page,
      pageSize: overrides.pageSize ?? pagination.pageSize,
      total: pagination.total,
    },
    shouldReload: false,
  }
}

export function buildStandardSubmitState(
  status: StandardStatus,
  standard: Pick<Standard, 'publishDate'> | null,
  today: string,
): StandardSubmitState {
  if (status === 'active') {
    return {
      status,
      publishDate: normalizePublishDate(standard?.publishDate) || today,
    }
  }

  if (status === 'archived') {
    return {
      status,
      publishDate: normalizePublishDate(standard?.publishDate),
    }
  }

  return {
    status,
    publishDate: null,
  }
}

export function formatStandardUploadDate(createdAt: string | null | undefined, publishDate: string): string {
  const createdDate = normalizeDateText(createdAt)
  if (createdDate) {
    return createdDate
  }

  return normalizeDateText(publishDate) || '-'
}

export function buildStandardUpsertPayload(
  form: StandardEditorFormValue,
  options: StandardUpsertOptions,
): StandardUpsertPayload {
  return {
    tenantId: options.tenantId,
    standardCode: form.standardCode.trim(),
    title: form.title.trim(),
    category: (form.category || 'internal') as StandardCategory,
    version: form.version.trim() || 'V1.0',
    status: options.status,
    publishDate: options.publishDate,
    description: form.description.trim(),
    standardGroupId: options.standardGroupId,
    versionNumber: options.versionNumber,
    previousVersionId: options.previousVersionId,
    visibilityLevel: form.visibilityLevel,
    ownerScopeId: form.ownerScopeId,
    grantScopeIds:
      form.visibilityLevel === 'PUBLIC'
        ? []
        : normalizeStringList(form.grantScopeIds).filter((scopeId) => scopeId !== form.ownerScopeId),
    changeLog: options.changeLog,
  }
}

export function buildStandardDraftPayload(
  source: Standard,
  options: StandardDraftOptions,
  standards: Standard[],
): StandardUpsertPayload {
  return {
    tenantId: options.tenantId,
    standardCode: source.standardCode,
    title: source.title,
    category: source.category,
    version: options.version,
    status: 'draft',
    publishDate: null,
    description: source.description || '',
    standardGroupId: source.standardGroupId,
    versionNumber: getNextVersionNumber(standards, source.standardGroupId),
    previousVersionId: source.id,
    visibilityLevel: source.visibilityLevel,
    ownerScopeId: source.ownerScopeId,
    grantScopeIds: source.grants.map((grant) => grant.scopeId),
    changeLog: options.changeLog,
  }
}

export function normalizeStandardFromApi(standard: StandardApiRecord): Standard {
  return {
    ...standard,
    publishDate: standard.publishDate || '-',
    attachments: normalizeAttachments(standard.attachments),
    versionCount: Number(standard.versionCount || 1),
  }
}

export function normalizeStandardPageFromApi(page: StandardApiPageRecord): Required<StandardListPage> {
  const records = Array.isArray(page.records) ? page.records : page.list || []

  return {
    list: records.map(normalizeStandardFromApi),
    total: Number(page.total || 0),
    page: Number(page.pageNo || page.page || 1),
    pageSize: Number(page.pageSize || 10),
  }
}

export function validateStandardEditorForm(
  form: StandardEditorFormValue,
  standards: Standard[],
  editingRow: Standard | null,
): string[] {
  const errors: string[] = []
  const standardCode = form.standardCode.trim()
  const title = form.title.trim()
  const version = form.version.trim()

  if (!standardCode) {
    errors.push('请输入标准编号')
  }
  if (!title) {
    errors.push('请输入标准名称')
  }
  if (!form.category.trim()) {
    errors.push('请选择分类')
  }
  if (!version) {
    errors.push('请输入版本号')
  }
  if (!form.visibilityLevel) {
    errors.push('请选择可见范围')
  }
  if (!form.ownerScopeId.trim()) {
    errors.push('请选择维护域')
  }

  const duplicatedCode = standards.some(
    (standard) =>
      standard.id !== editingRow?.id &&
      standard.standardCode.trim().toUpperCase() === standardCode.toUpperCase() &&
      standard.standardGroupId !== editingRow?.standardGroupId,
  )
  if (standardCode && duplicatedCode) {
    errors.push('标准编号已存在')
  }

  const groupId = editingRow?.standardGroupId
  const duplicatedVersion = Boolean(
    groupId &&
      standards.some(
        (standard) =>
          standard.id !== editingRow?.id &&
          standard.standardGroupId === groupId &&
          standard.version.trim().toUpperCase() === version.toUpperCase(),
      ),
  )
  if (version && duplicatedVersion) {
    errors.push('当前标准组已存在相同版本号')
  }

  return errors
}

export function buildStandardMutationPayload(
  standard: Standard,
  options: StandardMutationOptions,
): StandardUpsertPayload {
  return {
    tenantId: options.tenantId,
    standardCode: standard.standardCode,
    title: standard.title,
    category: standard.category,
    version: standard.version,
    status: options.status || standard.status,
    publishDate: normalizePublishDate(options.publishDate ?? standard.publishDate),
    description: standard.description || '',
    standardGroupId: standard.standardGroupId,
    versionNumber: standard.versionNumber,
    previousVersionId: standard.previousVersionId,
    visibilityLevel: standard.visibilityLevel,
    ownerScopeId: standard.ownerScopeId,
    grantScopeIds: standard.grants.map((grant) => grant.scopeId),
    changeLog: options.changeLog ?? standard.changeLog,
  }
}

function pickLatestVersions(standards: Standard[]): Standard[] {
  const latestMap = new Map<string, Standard>()

  for (const standard of standards) {
    const existing = latestMap.get(standard.standardGroupId)
    if (!existing || standard.versionNumber > existing.versionNumber) {
      latestMap.set(standard.standardGroupId, standard)
    }
  }

  return Array.from(latestMap.values())
}

function getNextVersionNumber(standards: Standard[], standardGroupId: string): number {
  const versionNumbers = standards
    .filter((item) => item.standardGroupId === standardGroupId)
    .map((item) => item.versionNumber)

  return Math.max(0, ...versionNumbers) + 1
}

function normalizeStringList(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
}

function normalizePublishDate(value: string | null | undefined): string | null {
  return !value || value === '-' ? null : value
}

function normalizeDateText(value: string | null | undefined): string | null {
  if (!value || value === '-') {
    return null
  }

  return value.length >= 10 ? value.slice(0, 10) : value
}

function normalizeAttachments(value: unknown[] | undefined): Attachment[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Record<string, unknown>

      return {
        id: String(record.id || ''),
        name: String(record.name || ''),
        url: String(record.url || ''),
        size: Number(record.size || 0),
        type: String(record.type || ''),
        uploadedBy: String(record.uploadedBy || ''),
        uploadedAt: String(record.uploadedAt || ''),
      } satisfies Attachment
    })
    .filter((item): item is Attachment => Boolean(item?.id && item.name))
}
