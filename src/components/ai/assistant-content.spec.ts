import { describe, expect, it } from 'vitest'
import { parseAssistantContent, parseInlineText } from './assistant-content'

describe('assistant content parser', () => {
  it('parses markdown tables into structured rows', () => {
    const blocks = parseAssistantContent(`
模型库当前有 2 个模型：

| 名称 | 模型 | 状态 | 默认 |
| --- | --- | --- | --- |
| codex | codex/gpt-5.5 | 在线 | 是 |
| 千文 | qwen-plus | 在线 | 否 |
`)

    expect(blocks).toEqual([
      { type: 'paragraph', text: '模型库当前有 2 个模型：' },
      {
        type: 'table',
        headers: ['名称', '模型', '状态', '默认'],
        rows: [
          ['codex', 'codex/gpt-5.5', '在线', '是'],
          ['千文', 'qwen-plus', '在线', '否'],
        ],
      },
    ])
  })

  it('parses bullet and numbered lists without treating them as paragraphs', () => {
    const blocks = parseAssistantContent(`
已归档项目档案信息如下：

- 检查项：2 个
- OMS 工单：4 个
1. 测试报告.docx
2. 工作流功能讲解.docx
`)

    expect(blocks).toEqual([
      { type: 'paragraph', text: '已归档项目档案信息如下：' },
      { type: 'list', items: ['检查项：2 个', 'OMS 工单：4 个'] },
      { type: 'list', items: ['测试报告.docx', '工作流功能讲解.docx'] },
    ])
  })

  it('keeps inline markdown as typed text segments instead of raw html', () => {
    expect(parseInlineText('默认模型是 **codex**，模型名 `codex/gpt-5.5`。')).toEqual([
      { type: 'text', text: '默认模型是 ' },
      { type: 'strong', text: 'codex' },
      { type: 'text', text: '，模型名 ' },
      { type: 'code', text: 'codex/gpt-5.5' },
      { type: 'text', text: '。' },
    ])
  })
})
