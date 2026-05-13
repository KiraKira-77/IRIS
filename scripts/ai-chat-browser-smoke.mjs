import { chromium } from '@playwright/test'

const baseUrl = process.env.IRIS_WEB_BASE_URL || 'http://localhost:3000'
const account = process.env.IRIS_E2E_ACCOUNT || 'admin'
const password = process.env.IRIS_E2E_PASSWORD || 'admin123'
const headed = process.env.IRIS_E2E_HEADED === '1'

const cases = [
  {
    route: '/smart/models',
    question: '模型库里面现在有哪几个模型',
    expectedIntent: 'list_ai_models',
    expectedTool: 'ModelConfigQueryTool',
  },
  {
    route: '/project/list',
    question: '我负责的项目有哪些',
    expectedIntent: 'list_visible_projects',
    expectedTool: 'ProjectQueryTool',
    forbiddenAnswerParts: ['无法识别你的姓名', '请告诉我你的姓名'],
  },
  {
    route: '/resource/archives',
    question: '已归档的项目的档案信息帮我总结一下',
    expectedIntent: 'summarize_project_archives',
    expectedTool: 'ProjectArchiveQueryTool',
  },
]

const browser = await chromium.launch({ headless: !headed })
const context = await browser.newContext()
const page = await context.newPage()

try {
  await login(page)

  const results = []
  for (const item of cases) {
    results.push(await runCase(page, item))
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : error)
  process.exitCode = 1
} finally {
  await browser.close()
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  if (!page.url().includes('/login')) return

  const inputs = page.locator('.login-form input')
  await inputs.nth(0).fill(account)
  await inputs.nth(1).fill(password)

  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }),
    page.locator('.login-btn').click(),
  ])
}

async function runCase(page, item) {
  await page.goto(`${baseUrl}${item.route}`, { waitUntil: 'networkidle' })
  await page.locator('.ai-chat-float').click()
  const drawer = page.locator('.el-drawer.open, .el-drawer[aria-modal="true"]').last()
  await drawer.locator('textarea').fill(item.question)

  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/v1/ai/chat/messages') && response.request().method() === 'POST',
    { timeout: 60000 },
  )
  await drawer.locator('.compose-actions button').click()

  const response = await responsePromise
  const responseBody = await response.json()
  const message = responseBody?.data || responseBody
  if (!response.ok() || !message?.traceId) {
    throw new Error(`AI chat response failed for "${item.question}": ${JSON.stringify(responseBody)}`)
  }

  await page.locator('.message-assistant .message-trace', { hasText: message.traceId }).waitFor({
    timeout: 15000,
  })

  const trace = await fetchTrace(page, message.traceId)
  const planEvent = findEvent(trace, 'agent', 'plan')
  const collectEvent = findEvent(trace, 'tool_context', 'collect_context')
  const validationEvent = findEvent(trace, 'agent', 'validate_tool_results')

  const planDetail = parseJson(planEvent?.detailJson)
  const collectDetail = parseJson(collectEvent?.detailJson)
  const validationDetail = parseJson(validationEvent?.detailJson)
  const toolNames = parseJson(trace.toolNamesJson, [])

  assertEqual(planDetail?.intent, item.expectedIntent, `${item.question} intent`)
  assertIncludes(toolNames, item.expectedTool, `${item.question} trace tools`)
  assertIncludes(JSON.stringify(planDetail), item.expectedTool, `${item.question} plan tool`)
  assertIncludes(JSON.stringify(collectDetail), item.expectedTool, `${item.question} collected tool`)
  for (const forbidden of item.forbiddenAnswerParts || []) {
    if (String(message.content || '').includes(forbidden)) {
      throw new Error(`${item.question} answer should not include "${forbidden}": ${message.content}`)
    }
  }

  return {
    route: item.route,
    question: item.question,
    traceId: message.traceId,
    status: trace.status,
    answer: String(message.content || '').slice(0, 300),
    intent: planDetail?.intent,
    tools: toolNames,
    validationStatus: validationEvent?.status,
    validation: validationDetail,
  }
}

async function fetchTrace(page, traceId) {
  return page.evaluate(async (id) => {
    const token = window.localStorage.getItem('iris_token')
    const response = await fetch(`/api/v1/ai/chat/traces/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const body = await response.json()
    if (!response.ok || body.success === false) {
      throw new Error(`Trace request failed: ${JSON.stringify(body)}`)
    }
    return body.data
  }, traceId)
}

function findEvent(trace, type, name) {
  return (trace.events || []).find((event) => event.eventType === type && event.eventName === name)
}

function parseJson(raw, fallback = null) {
  if (!raw) return fallback
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`)
  }
}

function assertIncludes(value, expected, label) {
  const values = Array.isArray(value) ? value : [String(value)]
  if (!values.some((item) => String(item).includes(expected))) {
    throw new Error(`${label}: expected to include ${expected}, got ${JSON.stringify(value)}`)
  }
}
