# AI Chat Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first version of the global IRIS AI assistant with permission-aware, read-only system data Q&A.

**Architecture:** The backend adds an AI chat module beside the existing AI model configuration module. Chat requests resolve the current tenant's online default model, build read-only business context through service-backed tools, call an OpenAI-compatible chat endpoint, and return answer citations. The frontend adds a global floating assistant in the authenticated layout, with typed chat API methods and a right-side drawer.

**Tech Stack:** Spring Boot 3, MyBatis-Plus, JUnit 5, Mockito, Vue 3, TypeScript, Element Plus, Vite.

---

## File Structure

Backend files in `IRIS-BACK`:

- Create `iris-back-business/src/main/java/com/iris/back/business/ai/model/request/AiChatMessageRequest.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/model/request/AiChatPageContextRequest.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/model/dto/AiChatCitationDto.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/model/dto/AiChatMessageDto.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/model/dto/AiChatSessionDto.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/model/dto/AiChatToolResultDto.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/service/AiChatClient.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/service/OpenAiCompatibleChatClient.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/service/DefaultAiModelResolver.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/service/AiChatContextService.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/service/AiChatService.java`
- Create `iris-back-business/src/main/java/com/iris/back/business/ai/controller/AiChatController.java`
- Test `iris-back-app/src/test/java/com/iris/back/business/AiChatServiceTests.java`
- Test `iris-back-app/src/test/java/com/iris/back/business/AiChatControllerTests.java`

Frontend files in `IRIS-WEB`:

- Modify `src/types/index.ts`
- Modify `src/api/index.ts`
- Modify `src/layouts/AppLayout.vue`
- Create `src/components/ai/AiChatAssistant.vue`
- Test `src/components/ai/ai-chat-assistant-source.spec.ts`

## Task 1: Backend Chat Service Core

**Files:**
- Create backend DTO/request/client/service files listed above.
- Test: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/AiChatServiceTests.java`

- [ ] **Step 1: Write failing tests for default model and chat response**

Cover:

- No default model returns `model_unconfigured`.
- Offline default model returns `model_offline`.
- A valid default model calls `AiChatClient` with decrypted model config and returns an assistant message.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd IRIS-BACK; .\mvnw.cmd -Dtest=AiChatServiceTests test`

Expected: compilation failure or missing class failures for the new AI chat types.

- [ ] **Step 3: Implement minimal backend chat service**

Implement:

- `DefaultAiModelResolver.resolveDefaultModel(Long tenantId)`
- `AiChatClient.ChatCommand`
- `AiChatClient.ChatResult`
- `OpenAiCompatibleChatClient.chat(...)`
- `AiChatService.sendMessage(...)`

Use existing `AiModelConfigMapper`, current user context, and AES/GCM API-key decryption logic consistent with `AiModelConfigService`.

- [ ] **Step 4: Run focused backend test**

Run: `cd IRIS-BACK; .\mvnw.cmd -Dtest=AiChatServiceTests test`

Expected: PASS.

## Task 2: Backend Read-Only Context Tools

**Files:**
- Modify `AiChatContextService.java`
- Test: extend `AiChatServiceTests.java`

- [ ] **Step 1: Write failing tests for context collection**

Cover:

- Project-related question includes `ProjectService.list(...)` context.
- Rectification-related question includes `RectificationService.list(...)` context.
- Standard-related question includes `StandardService.list(...)` context.
- Alert/todo-related question includes `AlertService.list(...)` context.

- [ ] **Step 2: Run focused test and verify failure**

Run: `cd IRIS-BACK; .\mvnw.cmd -Dtest=AiChatServiceTests test`

Expected: tests fail because context tools are not implemented.

- [ ] **Step 3: Implement minimal keyword-routed read-only tools**

Implement a conservative `AiChatContextService.collectContext(question, pageContext)`:

- Project keywords: project, 项目, 检查项, task.
- Rectification keywords: rectification, 整改, 工单.
- Plan keywords: plan, 计划.
- Standard keywords: standard, 标准, 制度, 文档.
- Alert keywords: alert, 预警, 待办, overdue, 逾期.

Each tool calls existing service list methods with page `1`, pageSize `10`, and maps results to compact summaries plus citations.

- [ ] **Step 4: Run focused backend test**

Run: `cd IRIS-BACK; .\mvnw.cmd -Dtest=AiChatServiceTests test`

Expected: PASS.

## Task 3: Backend Controller

**Files:**
- Create `AiChatController.java`
- Test: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/AiChatControllerTests.java`

- [ ] **Step 1: Write failing controller tests**

Cover:

- `POST /api/v1/ai/chat/sessions` returns a session DTO.
- `POST /api/v1/ai/chat/messages` delegates to `AiChatService`.

- [ ] **Step 2: Run controller test and verify failure**

Run: `cd IRIS-BACK; .\mvnw.cmd -Dtest=AiChatControllerTests test`

Expected: FAIL due missing controller.

- [ ] **Step 3: Implement controller**

Use `ApiResponse.success(...)` and existing controller style.

- [ ] **Step 4: Run focused controller test**

Run: `cd IRIS-BACK; .\mvnw.cmd -Dtest=AiChatControllerTests test`

Expected: PASS.

## Task 4: Frontend API And Floating Assistant

**Files:**
- Modify `IRIS-WEB/src/types/index.ts`
- Modify `IRIS-WEB/src/api/index.ts`
- Modify `IRIS-WEB/src/layouts/AppLayout.vue`
- Create `IRIS-WEB/src/components/ai/AiChatAssistant.vue`
- Test: `IRIS-WEB/src/components/ai/ai-chat-assistant-source.spec.ts`

- [ ] **Step 1: Write failing frontend source test**

Assert:

- `AppLayout.vue` renders `AiChatAssistant`.
- `api/index.ts` exposes `aiChatApi`.
- `AiChatAssistant.vue` sends page context with `routePath`.
- The component renders citations.

- [ ] **Step 2: Run frontend test and verify failure**

Run: `cd IRIS-WEB; npm run test:unit -- src/components/ai/ai-chat-assistant-source.spec.ts`

Expected: FAIL due missing files/API.

- [ ] **Step 3: Implement frontend types and API**

Add types:

- `AiChatCitation`
- `AiChatMessage`
- `AiChatSession`
- `AiChatPageContext`
- `AiChatMessagePayload`

Add `aiChatApi.createSession()` and `aiChatApi.sendMessage(payload)`.

- [ ] **Step 4: Implement `AiChatAssistant.vue`**

Use Element Plus drawer, button, input, citations, loading and error states. Use icons from Element Plus. Keep layout dense and app-like, not marketing-like.

- [ ] **Step 5: Mount component in `AppLayout.vue`**

Place `<AiChatAssistant />` as a sibling under `<el-main>` so it is globally available in authenticated pages.

- [ ] **Step 6: Run frontend source test**

Run: `cd IRIS-WEB; npm run test:unit -- src/components/ai/ai-chat-assistant-source.spec.ts`

Expected: PASS.

## Task 5: Verification

**Files:** all changed files.

- [ ] **Step 1: Run backend focused tests**

Run: `cd IRIS-BACK; .\mvnw.cmd -Dtest=AiChatServiceTests,AiChatControllerTests test`

Expected: PASS.

- [ ] **Step 2: Run frontend focused test**

Run: `cd IRIS-WEB; npm run test:unit -- src/components/ai/ai-chat-assistant-source.spec.ts`

Expected: PASS.

- [ ] **Step 3: Run frontend type-check**

Run: `cd IRIS-WEB; npm run type-check`

Expected: PASS.

- [ ] **Step 4: Report remaining full-suite risk**

If full backend/frontend builds are too slow or blocked by pre-existing dirty work, report the focused verification evidence and the exact commands not run.
