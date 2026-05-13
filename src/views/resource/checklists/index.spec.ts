import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), 'index.vue')

describe('checklists page actions', () => {
  it('filters the maintenance domain by owner scope only', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const loadStart = source.indexOf('const loadChecklists = async')
    const loadEnd = source.indexOf('const handleSearch', loadStart)
    const loadSource = source.slice(loadStart, loadEnd)

    expect(source).not.toContain('const filteredData = computed')
    expect(loadSource).toContain('scopeId: searchForm.scopeId || undefined')
  })

  it('matches standard management by rendering loaded table data without automatic keyword filtering', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const statsStart = source.indexOf('const checklistStats = computed')
    const statsEnd = source.indexOf('onMounted', statsStart)
    const statsSource = source.slice(statsStart, statsEnd)

    expect(source).toContain(':data="tableData"')
    expect(source).toContain('当前页 {{ tableData.length }} 条')
    expect(statsSource).toContain('tableData.value')
    expect(source).not.toContain(':data="filteredData"')
    expect(source).not.toContain('当前 {{ filteredData.length }} 条')
  })

  it('keeps pagination styling aligned with standard management', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const shellStyleStart = source.indexOf('.hero-copy,')
    const shellStyleEnd = source.indexOf('.hero-copy {', shellStyleStart)
    const shellStyle = source.slice(shellStyleStart, shellStyleEnd)
    const paginationStyleStart = source.indexOf('.pagination-wrapper {', shellStyleEnd)
    const paginationStyleEnd = source.indexOf('}', paginationStyleStart)
    const paginationStyle = source.slice(paginationStyleStart, paginationStyleEnd)
    const mobileStyleStart = source.indexOf('@media (max-width: 720px)')
    const mobileStyle = source.slice(mobileStyleStart)

    expect(shellStyle).toContain('.pagination-wrapper')
    expect(paginationStyle).toContain('margin-top: 16px')
    expect(paginationStyle).toContain('justify-content: flex-end')
    expect(paginationStyle).toContain('padding: 14px 18px')
    expect(paginationStyle).toContain('border-radius: 14px')
    expect(mobileStyle).toContain('.pagination-wrapper')
  })

  it('places the add-check-item entry below the expanded item list', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const detailStart = source.indexOf('<div class="checklist-detail">')
    const detailEnd = source.indexOf('<el-table-column prop="name"', detailStart)
    const itemTableIndex = source.indexOf('class="item-table"', detailStart)
    const emptyIndex = source.indexOf('<el-empty v-else', detailStart)
    const footerIndex = source.indexOf('<div class="detail-footer">', detailStart)
    const footerTemplate = source.slice(footerIndex, detailEnd)
    const footerStyleStart = source.indexOf('.detail-footer {')
    const footerStyleEnd = source.indexOf('}', footerStyleStart)
    const footerStyle = source.slice(footerStyleStart, footerStyleEnd)

    expect(footerIndex).toBeGreaterThan(itemTableIndex)
    expect(footerIndex).toBeGreaterThan(emptyIndex)
    expect(footerIndex).toBeLessThan(detailEnd)
    expect(footerTemplate).toContain('@click="openItemDialog(row)"')
    expect(footerTemplate).toContain('添加检查项')
    expect(footerStyle).toContain('justify-content: flex-start')
  })

  it('uses a compact single-line table for checklist items', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const detailStart = source.indexOf('<div class="checklist-detail">')
    const detailEnd = source.indexOf('<el-table-column prop="name"', detailStart)
    const detailTemplate = source.slice(detailStart, detailEnd)
    const gridStyleStart = source.indexOf('.item-table-header,')
    const gridStyleEnd = source.indexOf('}', gridStyleStart)
    const gridStyle = source.slice(gridStyleStart, gridStyleEnd)

    expect(detailTemplate).not.toContain('<el-table v-if="row.items?.length"')
    expect(detailTemplate).toContain('class="item-table"')
    expect(detailTemplate).toContain('class="item-table-header"')
    expect(detailTemplate).toContain('class="item-table-row"')
    expect(detailTemplate).not.toContain('class="item-field item-field-wide"')
    expect(gridStyle).toContain('grid-template-columns')
  })

  it('places checklist item actions as the first visible column', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const detailStart = source.indexOf('<div class="checklist-detail">')
    const detailEnd = source.indexOf('<el-table-column prop="name"', detailStart)
    const detailTemplate = source.slice(detailStart, detailEnd)
    const headerStart = detailTemplate.indexOf('<div class="item-table-header">')
    const headerEnd = detailTemplate.indexOf('</div>', headerStart)
    const headerTemplate = detailTemplate.slice(headerStart, headerEnd)
    const rowStart = detailTemplate.indexOf('class="item-table-row"')
    const rowTemplate = detailTemplate.slice(rowStart)
    const gridStyleStart = source.indexOf('.item-table-header,')
    const gridStyleEnd = source.indexOf('}', gridStyleStart)
    const gridStyle = source.slice(gridStyleStart, gridStyleEnd)

    expect(headerTemplate.indexOf('item-heading-actions')).toBeLessThan(
      headerTemplate.indexOf('item-heading-sequence'),
    )
    expect(rowTemplate.indexOf('<div class="item-actions">')).toBeLessThan(
      rowTemplate.indexOf('<span class="item-cell item-sequence">'),
    )
    expect(gridStyle).toContain('grid-template-columns:\n      104px 52px')
  })

  it('uses column-specific alignment for checklist item headers and cells', () => {
    const source = readFileSync(sourcePath, 'utf8')

    expect(source).toContain('class="item-heading item-heading-actions"')
    expect(source).toContain('class="item-heading item-heading-sequence"')
    expect(source).toContain('class="item-cell item-frequency"')
    expect(source).toContain('class="item-cell item-evaluation"')
    expect(source).toContain('.item-heading-sequence,')
    expect(source).toContain('.item-frequency,')
    expect(source).toContain(':deep(.el-button.is-link:first-child)')
    expect(source).toContain('padding-left: 0')
  })

  it('uses the current user access context for checklist permissions', () => {
    const source = readFileSync(sourcePath, 'utf8')

    expect(source).toContain("import { useUserStore } from '@/stores/modules/user'")
    expect(source).toContain("from '@/features/permissions/checklist-access'")
    expect(source).toContain('const currentAccessContext = computed')
    expect(source).toContain('const getRowAccessState = (row: ControlChecklist)')
  })

  it('gates checklist action buttons and handlers by row permissions', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const openDialogStart = source.indexOf('const openDialog = (row?: ControlChecklist)')
    const openDialogEnd = source.indexOf('const handleSaveChecklist', openDialogStart)
    const saveStart = source.indexOf('const handleSaveChecklist = async')
    const saveEnd = source.indexOf('// Item Dialog', saveStart)
    const deleteStart = source.indexOf('const handleDelete = async')
    const deleteEnd = source.indexOf('const handleDeleteItem = async', deleteStart)

    expect(source).toContain('v-if="canCreateChecklist"')
    expect(source).toContain('v-if="getRowAccessState(row).canEdit"')
    expect(source).toContain('v-if="getRowAccessState(row).canDelete"')
    expect(source).toContain('v-if="getRowAccessState(row).canCreate"')
    expect(openDialogEnd).toBeGreaterThan(openDialogStart)
    expect(source.slice(openDialogStart, openDialogEnd)).toContain('!getRowAccessState(row).canEdit')
    expect(source.slice(openDialogStart, openDialogEnd)).toContain('!canCreateChecklist.value')
    expect(source.slice(saveStart, saveEnd)).toContain('canCreateInScope(form.ownerScopeId)')
    expect(source.slice(deleteStart, deleteEnd)).toContain('!getRowAccessState(row).canDelete')
  })
})
