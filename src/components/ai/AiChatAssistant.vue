<template>
  <el-button
    class="ai-chat-float"
    circle
    type="primary"
    :icon="ChatDotRound"
    aria-label="打开 AI 助手"
    @click="openAssistant"
  />

  <el-drawer
    v-model="drawerVisible"
    custom-class="ai-chat-drawer"
    direction="rtl"
    size="420px"
    :with-header="false"
  >
    <section class="assistant-shell">
      <header class="assistant-header">
        <div>
          <p class="assistant-eyebrow">IRIS AI</p>
          <h2>全系统数据问答</h2>
        </div>
        <el-button circle text :icon="Close" aria-label="关闭 AI 助手" @click="drawerVisible = false" />
      </header>

      <main ref="messageListRef" class="assistant-messages">
        <div class="assistant-notice">
          仅基于你当前权限可访问的数据回答，暂不执行新增、修改或删除操作。
        </div>

        <article
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="`message-${message.role}`"
        >
          <div class="message-role">{{ message.role === 'user' ? '你' : 'AI 助手' }}</div>
          <div v-if="message.role === 'assistant'" class="message-content message-content-rich">
            <template v-for="(block, blockIndex) in parseAssistantContent(message.content)" :key="blockIndex">
              <h3 v-if="block.type === 'heading'" class="answer-heading">
                <template
                  v-for="(segment, segmentIndex) in parseInlineText(block.text)"
                  :key="segmentIndex"
                >
                  <code v-if="segment.type === 'code'">{{ segment.text }}</code>
                  <strong v-else-if="segment.type === 'strong'">{{ segment.text }}</strong>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </h3>

              <p v-else-if="block.type === 'paragraph'" class="answer-paragraph">
                <template
                  v-for="(segment, segmentIndex) in parseInlineText(block.text)"
                  :key="segmentIndex"
                >
                  <code v-if="segment.type === 'code'">{{ segment.text }}</code>
                  <strong v-else-if="segment.type === 'strong'">{{ segment.text }}</strong>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </p>

              <ul v-else-if="block.type === 'list'" class="answer-list">
                <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
                  <template
                    v-for="(segment, segmentIndex) in parseInlineText(item)"
                    :key="segmentIndex"
                  >
                    <code v-if="segment.type === 'code'">{{ segment.text }}</code>
                    <strong v-else-if="segment.type === 'strong'">{{ segment.text }}</strong>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </li>
              </ul>

              <div v-else-if="block.type === 'table'" class="answer-table-wrap">
                <table class="answer-table">
                  <thead>
                    <tr>
                      <th v-for="(header, headerIndex) in block.headers" :key="headerIndex">
                        <template
                          v-for="(segment, segmentIndex) in parseInlineText(header)"
                          :key="segmentIndex"
                        >
                          <code v-if="segment.type === 'code'">{{ segment.text }}</code>
                          <strong v-else-if="segment.type === 'strong'">{{ segment.text }}</strong>
                          <span v-else>{{ segment.text }}</span>
                        </template>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
                      <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                        <template
                          v-for="(segment, segmentIndex) in parseInlineText(cell)"
                          :key="segmentIndex"
                        >
                          <code v-if="segment.type === 'code'">{{ segment.text }}</code>
                          <strong v-else-if="segment.type === 'strong'">{{ segment.text }}</strong>
                          <span v-else>{{ segment.text }}</span>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
          <div v-else class="message-content">{{ message.content }}</div>

          <el-collapse
            v-if="message.role === 'assistant' && hasEvidence(message)"
            class="message-evidence"
          >
            <el-collapse-item name="evidence">
              <template #title>
                <span class="evidence-title">查看回答链路</span>
                <span class="evidence-count">
                  {{ evidenceSummary(message) }}
                </span>
              </template>

              <div class="evidence-section" v-if="message.toolResults?.length">
                <span class="evidence-label">工具</span>
                <div class="tag-stack">
                  <el-tag
                    v-for="tool in message.toolResults"
                    :key="tool.toolName"
                    size="small"
                    effect="plain"
                  >
                    {{ tool.toolName }}
                  </el-tag>
                </div>
              </div>

              <div class="evidence-section" v-if="message.citations?.length">
                <span class="evidence-label">依据</span>
                <div class="citation-list">
                  <div
                    v-for="citation in message.citations"
                    :key="`${citation.type}-${citation.id}`"
                    class="citation"
                  >
                    <span class="citation-title">{{ citation.title }}</span>
                    <span v-if="citation.path" class="citation-path">{{ citation.path }}</span>
                  </div>
                </div>
              </div>

              <div class="evidence-section" v-if="message.traceId">
                <span class="evidence-label">Trace</span>
                <code class="trace-code">{{ message.traceId }}</code>
              </div>
            </el-collapse-item>
          </el-collapse>
          <div
            v-else-if="message.traceId && message.role === 'assistant'"
            class="message-trace"
            >
            Trace {{ message.traceId }}
          </div>
        </article>

        <div v-if="loading" class="message message-assistant">
          <div class="message-role">AI 助手</div>
          <div class="message-content">正在查询可访问数据并生成回复...</div>
        </div>
      </main>

      <footer class="assistant-compose">
        <el-input
          v-model="draft"
          type="textarea"
          resize="none"
          :rows="3"
          maxlength="500"
          show-word-limit
          placeholder="询问项目、计划、整改、标准或待办数据"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <div class="compose-actions">
          <span class="route-context">{{ route.path }}</span>
          <el-button type="primary" :loading="loading" :disabled="!canSend" @click="sendMessage">
            发送
          </el-button>
        </div>
      </footer>
    </section>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChatDotRound, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { aiChatApi } from '@/api'
import type { AiChatMessage, AiChatSession } from '@/types'
import { parseAssistantContent, parseInlineText } from './assistant-content'

const route = useRoute()

const drawerVisible = ref(false)
const loading = ref(false)
const draft = ref('')
const session = ref<AiChatSession | null>(null)
const messages = ref<AiChatMessage[]>([])
const messageListRef = ref<HTMLElement | null>(null)

const canSend = computed(() => draft.value.trim().length > 0 && !loading.value)

function openAssistant() {
  drawerVisible.value = true
}

async function ensureSession() {
  if (session.value) return session.value

  session.value = await aiChatApi.createSession()
  return session.value
}

async function sendMessage() {
  const content = draft.value.trim()
  if (!content || loading.value) return

  const localMessage = buildLocalUserMessage(content)
  messages.value.push(localMessage)
  draft.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    const currentSession = await ensureSession()
    const assistantMessage = await aiChatApi.sendMessage({
      sessionId: currentSession.id,
      message: content,
      pageContext: {
        routePath: route.path,
      },
    })

    messages.value.push(assistantMessage)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 助手暂时不可用'
    ElMessage.error(message)
    messages.value.push(buildAssistantStatusMessage(message))
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}

function buildLocalUserMessage(content: string): AiChatMessage {
  return {
    id: `local-${Date.now()}`,
    traceId: undefined,
    sessionId: session.value?.id ?? '',
    role: 'user',
    content,
    status: 'ok',
    citations: [],
    toolResults: [],
    createdAt: new Date().toISOString(),
  }
}

function buildAssistantStatusMessage(content: string): AiChatMessage {
  return {
    id: `error-${Date.now()}`,
    traceId: undefined,
    sessionId: session.value?.id ?? '',
    role: 'assistant',
    content,
    status: 'error',
    citations: [],
    toolResults: [],
    createdAt: new Date().toISOString(),
  }
}

async function scrollToBottom() {
  await nextTick()
  const messageList = messageListRef.value
  if (!messageList) return
  messageList.scrollTop = messageList.scrollHeight
}

function hasEvidence(message: AiChatMessage) {
  return Boolean(message.traceId || message.citations?.length || message.toolResults?.length)
}

function evidenceSummary(message: AiChatMessage) {
  const parts = []
  if (message.toolResults?.length) parts.push(`${message.toolResults.length} 个工具`)
  if (message.citations?.length) parts.push(`${message.citations.length} 条依据`)
  if (message.latencyMs) parts.push(`${message.latencyMs}ms`)
  return parts.join(' · ') || 'Trace'
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.ai-chat-float {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1200;
  width: 48px;
  height: 48px;
  box-shadow: $iris-shadow-md;
}

.assistant-shell {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  min-height: 0;
  background: $iris-bg-card;
}

.assistant-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid $iris-border-light;

  h2 {
    margin: 2px 0 0;
    color: $iris-text-heading;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0;
  }
}

.assistant-eyebrow {
  margin: 0;
  color: $iris-primary;
  font-size: 12px;
  font-weight: 700;
}

.assistant-messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px 20px;
  overflow-y: auto;
  background: $iris-bg;
}

.assistant-notice {
  padding: 10px 12px;
  border: 1px solid $iris-border;
  border-radius: $iris-border-radius-sm;
  color: $iris-text-secondary;
  background: $iris-bg-card;
  font-size: 13px;
  line-height: 1.5;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 88%;
}

.message-user {
  align-self: flex-end;

  .message-content {
    color: #f8fafc;
    background: $iris-primary-dark;
  }

  .message-role {
    text-align: right;
  }
}

.message-assistant {
  align-self: flex-start;
}

.message-role {
  color: $iris-text-muted;
  font-size: 12px;
}

.message-content {
  padding: 10px 12px;
  border: 1px solid $iris-border;
  border-radius: $iris-border-radius-sm;
  color: $iris-text-primary;
  background: $iris-bg-card;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-content-rich {
  display: grid;
  gap: 10px;
  white-space: normal;

  code {
    padding: 1px 5px;
    border-radius: 4px;
    color: oklch(34% 0.045 250);
    background: oklch(96% 0.012 250);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
  }
}

.answer-heading {
  margin: 0;
  color: $iris-text-heading;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
}

.answer-paragraph {
  margin: 0;
  line-height: 1.65;
  white-space: pre-line;
}

.answer-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  line-height: 1.6;
}

.answer-table-wrap {
  overflow-x: auto;
  max-width: 100%;
  border: 1px solid $iris-border-light;
  border-radius: $iris-border-radius-sm;
}

.answer-table {
  width: 100%;
  min-width: 280px;
  border-collapse: collapse;
  background: oklch(99% 0.004 245);
  font-size: 12px;

  th,
  td {
    padding: 8px 10px;
    border-bottom: 1px solid $iris-border-light;
    text-align: left;
    vertical-align: top;
    word-break: break-word;
  }

  th {
    color: $iris-text-secondary;
    background: oklch(97% 0.007 245);
    font-weight: 700;
    white-space: nowrap;
  }

  tr:last-child td {
    border-bottom: 0;
  }
}

.message-trace {
  color: $iris-text-muted;
  font-size: 11px;
  word-break: break-all;
}

.message-evidence {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid $iris-border-light;
  border-radius: $iris-border-radius-sm;
  background: oklch(99% 0.004 245);

  :deep(.el-collapse-item__header) {
    height: auto;
    min-height: 34px;
    padding: 0 10px;
    border-bottom: 0;
    background: transparent;
    line-height: 1.4;
  }

  :deep(.el-collapse-item__wrap) {
    border-bottom: 0;
    background: transparent;
  }

  :deep(.el-collapse-item__content) {
    display: grid;
    gap: 10px;
    padding: 0 10px 10px;
  }
}

.evidence-title {
  color: $iris-text-secondary;
  font-size: 12px;
  font-weight: 600;
}

.evidence-count {
  margin-left: 8px;
  color: $iris-text-muted;
  font-size: 12px;
}

.evidence-section {
  display: grid;
  gap: 6px;
}

.evidence-label {
  color: $iris-text-muted;
  font-size: 11px;
}

.tag-stack,
.citation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.citation {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: $iris-border-radius-sm;
  background: rgba(59, 130, 246, 0.08);
}

.citation-title {
  color: $iris-text-primary;
  font-size: 12px;
  font-weight: 600;
}

.citation-path {
  color: $iris-text-muted;
  font-size: 12px;
  word-break: break-all;
}

.trace-code {
  overflow-wrap: anywhere;
  color: $iris-text-secondary;
  font-size: 11px;
}

.assistant-compose {
  display: grid;
  gap: 10px;
  padding: 14px 20px 18px;
  border-top: 1px solid $iris-border-light;
  background: $iris-bg-card;
}

.compose-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.route-context {
  min-width: 0;
  overflow: hidden;
  color: $iris-text-muted;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.ai-chat-drawer .el-drawer__body) {
  padding: 0;
}

@media (max-width: 640px) {
  .ai-chat-float {
    right: 16px;
    bottom: 16px;
  }

  :global(.ai-chat-drawer) {
    width: min(100vw, 420px) !important;
  }
}
</style>
