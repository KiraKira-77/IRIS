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

  it('paginates expanded checklist items per checklist', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const detailStart = source.indexOf('<div class="checklist-detail">')
    const detailEnd = source.indexOf('<el-table-column prop="name"', detailStart)
    const detailTemplate = source.slice(detailStart, detailEnd)

    expect(detailTemplate).toContain('paginatedChecklistItems(row)')
    expect(detailTemplate).toContain('getChecklistItemSequence(row, index)')
    expect(detailTemplate).toContain('class="item-pagination"')
    expect(detailTemplate).toContain(':total="row.items?.length || 0"')
    expect(detailTemplate).toContain('layout="total, prev, pager, next"')
    expect(source).toContain('const checklistItemPageSize = 10')
    expect(source).toContain('const checklistItemPageMap = reactive<Record<string, number>>({})')
    expect(source).toContain('const paginatedChecklistItems = (row: ControlChecklist)')
    expect(source).toContain('const handleChecklistItemPageChange = (row: ControlChecklist, page: number)')
    const paginationStyleStart = source.indexOf('.item-pagination {')
    const paginationStyleEnd = source.indexOf('}', paginationStyleStart)
    const paginationStyle = source.slice(paginationStyleStart, paginationStyleEnd)
    expect(paginationStyle).toContain('justify-content: flex-start')
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

  it('adds a permission-gated batch import entry to checklist items', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const detailStart = source.indexOf('<div class="checklist-detail">')
    const detailEnd = source.indexOf('<el-table-column prop="name"', detailStart)
    const detailTemplate = source.slice(detailStart, detailEnd)
    const footerStart = detailTemplate.indexOf('<div class="detail-footer">')
    const footerTemplate = detailTemplate.slice(footerStart)

    expect(footerTemplate).toContain('@click="openImportDialog(row)"')
    expect(footerTemplate).toContain('@click="downloadImportTemplate"')
    expect(footerTemplate).toContain('批量导入')
    expect(footerTemplate).toContain('下载模板')
    expect(footerTemplate).toContain('v-if="getRowAccessState(row).canEdit"')
  })

  it('renders the checklist item import drawer with mode, upload, preview, and confirm handling', () => {
    const source = readFileSync(sourcePath, 'utf8')

    expect(source).toContain('v-model="importDialogVisible"')
    expect(source).toContain('批量导入检查项')
    expect(source).toContain('v-model="importMode"')
    expect(source).toContain('追加导入')
    expect(source).toContain('覆盖现有检查项')
    expect(source).toContain('accept=".xlsx"')
    expect(source).not.toContain('accept=".xlsx,.xls"')
    expect(source).toContain(':on-change="handleImportFileChange"')
    expect(source).toContain(':data="importPreviewRows"')
    expect(source).toContain('label="Excel行"')
    expect(source).not.toContain('label="行号"')
    expect(source).toContain('@click="confirmImportItems"')
  })

  it('shows mapped frequency, evaluation type, and organizations in the import preview', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const drawerStart = source.indexOf('v-model="importDialogVisible"')
    const drawerEnd = source.indexOf('</el-drawer>', drawerStart)
    const drawerTemplate = source.slice(drawerStart, drawerEnd)

    expect(drawerTemplate).toContain('label="控制频率"')
    expect(drawerTemplate).toContain('controlFrequencyLabel(row.item?.controlFrequency)')
    expect(drawerTemplate).toContain("row.raw['控制频率']")
    expect(drawerTemplate).toContain('label="评估类"')
    expect(drawerTemplate).toContain('evaluationTypeLabel(row.item?.evaluationType)')
    expect(drawerTemplate).toContain("row.raw['评估类']")
    expect(drawerTemplate).toContain('label="关联组织"')
    expect(drawerTemplate).toContain('organizationLabels(row.item?.organizationIds || [])')
    expect(drawerTemplate).toContain("row.raw['关联组织']")
    expect(drawerTemplate).toContain('保存为系统编码')
  })

  it('wires checklist item import helpers and permission checks', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const openImportStart = source.indexOf('const openImportDialog = (row: ControlChecklist)')
    const openImportEnd = source.indexOf('const handleImportFileChange', openImportStart)
    const confirmStart = source.indexOf('const confirmImportItems = async')
    const confirmEnd = source.indexOf('const handleCopy', confirmStart)

    expect(source).toContain("from '@/features/checklists/checklist-import'")
    expect(source.slice(openImportStart, openImportEnd)).toContain('!getRowAccessState(row).canEdit')
    expect(source.slice(confirmStart, confirmEnd)).toContain('mergeChecklistImportItems')
    expect(source.slice(confirmStart, confirmEnd)).toContain('findDuplicateChecklistImportItems')
    expect(source.slice(confirmStart, confirmEnd)).toContain('导入内容存在重复检查项')
    expect(source.slice(confirmStart, confirmEnd)).toContain('checklistApi.update')
    expect(source.slice(confirmStart, confirmEnd)).toContain('toChecklistPayload(checklist, items)')
  })

  it('shows an error message when checklist item import save fails', () => {
    const source = readFileSync(sourcePath, 'utf8')
    const confirmStart = source.indexOf('const confirmImportItems = async')
    const confirmEnd = source.indexOf('const downloadImportTemplate', confirmStart)
    const confirmSource = source.slice(confirmStart, confirmEnd)

    expect(confirmSource).toContain('catch (error)')
    expect(confirmSource).toContain('ElMessage.error')
    expect(confirmSource).toContain('批量导入失败')
  })
  it('generates checklist codes from existing codes instead of current counts', () => {
    const source = readFileSync(sourcePath, 'utf8')

    expect(source).toContain('const getNextChecklistCode = () => {')
    expect(source).toContain('checklist.code')
    expect(source).toContain('form.code = getNextChecklistCode()')
    expect(source).toContain('code: getNextChecklistCode()')
    expect(source).not.toContain('tableData.value.length + 1')
    expect(source).not.toContain('pagination.total + 1')
  })
})
