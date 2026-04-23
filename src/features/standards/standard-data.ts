import type {
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
}

export interface StandardEditorFormValue {
  title: string
  category: string
  version: string
  description: string
  visibilityLevel: StandardVisibilityLevel
  ownerScopeId: string
  grantScopeIds: string[]
  tags: string[]
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

export interface StandardApiRecord extends Omit<Standard, 'attachments' | 'publishDate'> {
  attachments?: unknown[]
  publishDate: string | null
}

export interface StandardMutationOptions {
  tenantId: number
  status?: StandardStatus
  publishDate?: string | null
  changeLog?: string
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

export function buildStandardUpsertPayload(
  form: StandardEditorFormValue,
  options: StandardUpsertOptions,
): StandardUpsertPayload {
  return {
    tenantId: options.tenantId,
    title: form.title.trim(),
    category: (form.category || 'internal') as StandardCategory,
    version: form.version.trim() || 'V1.0',
    status: options.status,
    publishDate: options.publishDate,
    description: form.description.trim(),
    tags: normalizeStringList(form.tags),
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
    title: source.title,
    category: source.category,
    version: options.version,
    status: 'draft',
    publishDate: null,
    description: source.description || '',
    tags: [...source.tags],
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
    attachments: [],
  }
}

export function buildStandardMutationPayload(
  standard: Standard,
  options: StandardMutationOptions,
): StandardUpsertPayload {
  return {
    tenantId: options.tenantId,
    title: standard.title,
    category: standard.category,
    version: standard.version,
    status: options.status || standard.status,
    publishDate: normalizePublishDate(options.publishDate ?? standard.publishDate),
    description: standard.description || '',
    tags: [...standard.tags],
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
