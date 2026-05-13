export type AssistantInlineSegment = {
  type: 'text' | 'strong' | 'code'
  text: string
}

export type AssistantContentBlock =
  | {
      type: 'paragraph'
      text: string
    }
  | {
      type: 'heading'
      level: 2 | 3
      text: string
    }
  | {
      type: 'list'
      items: string[]
    }
  | {
      type: 'table'
      headers: string[]
      rows: string[][]
    }

export function parseAssistantContent(content: string): AssistantContentBlock[] {
  const lines = content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())

  const blocks: AssistantContentBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index] || ''
    if (!line) {
      index += 1
      continue
    }

    if (isTableStart(lines, index)) {
      const table = parseTable(lines, index)
      blocks.push(table.block)
      index = table.nextIndex
      continue
    }

    if (isListLine(line)) {
      const items: string[] = []
      const marker = listMarkerType(line)
      while (index < lines.length) {
        const currentLine = lines[index] || ''
        if (!isListLine(currentLine) || listMarkerType(currentLine) !== marker) break
        items.push(stripListMarker(currentLine))
        index += 1
      }
      blocks.push({ type: 'list', items })
      continue
    }

    const heading = parseHeading(line)
    if (heading) {
      blocks.push(heading)
      index += 1
      continue
    }

    const paragraphs: string[] = []
    while (
      index < lines.length &&
      lines[index] &&
      !isTableStart(lines, index) &&
      !isListLine(lines[index] || '') &&
      !parseHeading(lines[index] || '')
    ) {
      paragraphs.push(lines[index] || '')
      index += 1
    }
    blocks.push({ type: 'paragraph', text: paragraphs.join('\n') })
  }

  return blocks
}

export function parseInlineText(text: string): AssistantInlineSegment[] {
  const segments: AssistantInlineSegment[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, match.index) })
    }

    const token = match[0]
    if (token.startsWith('**')) {
      segments.push({ type: 'strong', text: token.slice(2, -2) })
    } else {
      segments.push({ type: 'code', text: token.slice(1, -1) })
    }
    cursor = match.index + token.length
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', text: text.slice(cursor) })
  }
  return segments
}

function isTableStart(lines: string[], index: number) {
  return isTableRow(lines[index] || '') && isTableSeparator(lines[index + 1] || '')
}

function parseTable(lines: string[], index: number) {
  const headers = splitTableRow(lines[index] || '')
  index += 2

  const rows: string[][] = []
  while (index < lines.length && isTableRow(lines[index] || '')) {
    rows.push(splitTableRow(lines[index] || ''))
    index += 1
  }

  return {
    block: {
      type: 'table' as const,
      headers,
      rows,
    },
    nextIndex: index,
  }
}

function isTableRow(line: string) {
  return line.startsWith('|') && line.endsWith('|') && line.includes('|')
}

function isTableSeparator(line: string) {
  return /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|$/.test(line)
}

function splitTableRow(line: string) {
  return line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())
}

function isListLine(line: string) {
  return /^([-*]\s+|\d+\.\s+)/.test(line)
}

function listMarkerType(line: string) {
  return /^\d+\.\s+/.test(line) ? 'ordered' : 'unordered'
}

function stripListMarker(line: string) {
  return line.replace(/^([-*]\s+|\d+\.\s+)/, '').trim()
}

function parseHeading(line: string): AssistantContentBlock | null {
  const match = /^(#{2,3})\s+(.+)$/.exec(line)
  if (!match) return null
  return {
    type: 'heading',
    level: (match[1] || '').length as 2 | 3,
    text: (match[2] || '').trim(),
  }
}
