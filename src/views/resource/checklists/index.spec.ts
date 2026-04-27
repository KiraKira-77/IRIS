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
})
