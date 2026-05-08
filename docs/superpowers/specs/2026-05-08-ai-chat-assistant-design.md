# AI Chat Assistant Design

## Goal

Add a global AI chat assistant to IRIS so users can ask natural-language questions about system data they are allowed to access. The first version is a read-only assistant: it can summarize, explain, list, and link visible data, but it must not create, update, submit, approve, or delete business records.

The agreed roadmap is:

1. Phase 1: permission-aware read-only system data Q&A.
2. Phase 2: permission-aware RAG for standard documents, project archives, and rectification materials.
3. Phase 3: action-capable assistant, planned later with confirmation and audit controls.

## Product Scope

### In Scope For Phase 1

- A global floating AI entry point in the lower-right corner of the web app.
- A right-side chat drawer with multi-turn conversation.
- Chat session creation and message sending APIs.
- Default model resolution from the current tenant's online default model.
- Read-only tool calls for visible system data.
- Permission filtering based on the current logged-in user.
- Answer citations that link back to source business objects.
- AI chat audit logs.
- Clear errors for missing model configuration, permission denial, data query failure, and model timeout.

### Out Of Scope For Phase 1

- Write operations such as creating rectifications, submitting approvals, deleting records, or updating assignments.
- Vector database / RAG indexing.
- Streaming responses.
- Cross-tenant queries.
- Voice input.
- File upload into the chat.
- Manual model selection by end users.

## Frontend Design

Add a global AI floating button to the authenticated app layout. The entry stays collapsed by default and does not block business pages. Clicking it opens a right-side drawer rather than a centered modal so users can continue seeing the current business page while asking questions.

The drawer contains:

- Header: "IRIS AI Assistant" and a short note that answers are based on current permissions.
- Message list: user messages, assistant responses, loading state, error state.
- Citations: compact links under assistant answers, such as project, rectification, plan, or standard document references.
- Input: multiline text input with send button.
- Optional context indicator: current page context when available, such as project detail or rectification detail.

The frontend may send weak page context to the backend:

```json
{
  "routePath": "/project/detail/123",
  "entityType": "project",
  "entityId": "123"
}
```

This context is only a hint. The backend must re-check whether the user can access the entity before using it.

## Backend Architecture

Add a focused AI chat area under the existing AI business module. Model configuration remains separate from chat orchestration.

Recommended backend components:

- `AiChatController`: exposes session and message endpoints.
- `AiChatService`: orchestrates sessions, permission context, tool calls, model invocation, and audit records.
- `DefaultModelResolver`: finds exactly one online default model for the current tenant.
- `OpenAiCompatibleChatClient`: sends chat completion requests to `{baseUrl}/chat/completions`.
- `AiPermissionContext`: captures current user, tenant, roles, menu access, resource scopes, and business identity values.
- `AiToolRegistry`: registers available read-only tools.
- `AiReadableTool`: common interface for tool metadata and execution.
- `AiChatAuditService`: records question, answer summary, tools, citations, model, latency, and errors.

Suggested endpoints:

```http
POST /api/v1/ai/chat/sessions
POST /api/v1/ai/chat/messages
GET  /api/v1/ai/chat/sessions/{sessionId}/messages
```

The first implementation can return normal JSON responses. Streaming can be added later through SSE without changing the core tool design.

## Read-Only Tools

The model must not query the database directly. It can only receive data returned by backend-controlled tools. Every tool must enforce permissions internally and use bounded result sizes.

First tool set:

- `ProjectQueryTool`: visible projects, project detail, inspection tasks, project members.
- `RectificationQueryTool`: visible rectifications, status, assignee, overdue state, OMS work order summary.
- `PlanQueryTool`: visible plans, progress, related projects, checklist links.
- `StandardQueryTool`: visible standard document metadata, category, version, status, and summary when available.
- `WorkbenchQueryTool`: current user's todos, alerts, recent projects, and dashboard summaries.

Tool result rules:

- Return only fields needed for answering.
- Use field allowlists per tool.
- Limit max rows, for example 20 by default and 50 hard maximum.
- Include source object identifiers for citations.
- If results are too broad, ask the user to narrow time, module, status, or project.

## Permission Rules

Use strict visibility for Phase 1: AI can only cite and summarize records the user could open in the normal UI.

Permission checks happen in this order:

1. Tenant boundary: all queries are constrained to the current `tenantId`.
2. Menu access: users without a module menu cannot query that module's detail data through AI.
3. Resource scope: standards, checklists, plans, and similar data respect resource scope membership.
4. Business membership: projects, project tasks, and rectifications respect leader, member, assignee, observer, and related identities.
5. Administrator exception: platform administrators may query tenant-wide business data, still within the tenant boundary and with audit logging.

Permission-denied responses must not reveal hidden record titles, numbers, personnel names, or existence. Use a neutral response such as:

> Current account does not have permission to access data in that range.

The assistant must not reuse another user's conversation context or data.

## Model Selection And Invocation

The backend resolves the model from `biz_ai_model_config`:

- `tenant_id` equals the current tenant.
- `default_model = 1`.
- `status = 'online'`.
- exactly one matching model exists.

Failure handling:

- No default model: ask an administrator to configure a default model in the model library.
- Default model offline: ask an administrator to enable or update the default model.
- Multiple default models: report a configuration error and ask an administrator to reset the default model.

The chat client uses the existing encrypted API key storage. API keys are never returned to the frontend or written to audit logs.

Prompt context contains:

- System instruction: IRIS internal-control assistant, answer only from provided tool results.
- Recent conversation summary or bounded recent messages.
- User question.
- Tool result summaries and citation metadata.

The prompt must distinguish system facts from AI suggestions. Counts, statuses, names, and lists must come from tool results.

## Error Handling

User-visible errors should be specific enough to act on but not leak hidden data.

- Model timeout: "The AI model response timed out. Please retry or narrow the question."
- Model API failure: "AI model call failed. Please ask an administrator to check model configuration."
- Tool failure: name the failed module, for example rectification data query failed.
- Permission denial: use the neutral permission response.
- No data found: "No related data was found under your current permissions."
- Too much data: ask the user to narrow the query by time range, status, module, or project.

The main business page must remain usable if the AI drawer fails.

## Audit Logging

Record an audit entry for every chat message handled by the backend.

Minimum fields:

- tenant ID
- user ID
- session ID
- message ID
- user question
- answer summary
- model ID
- tool names called
- cited business object type and ID
- permission denial reason, when applicable
- success or failure
- latency
- created time

Do not log decrypted API keys. Consider truncating long prompts and model responses.

## Phase 2 RAG Direction

Phase 2 adds permission-aware retrieval for document-heavy questions.

Index candidates:

- standard documents
- project archive snapshots
- rectification materials
- checklist content
- policy and procedure documents

Each indexed chunk needs permission labels such as:

- tenant ID
- menu code
- resource scope ID
- project ID
- business object type and ID
- visibility status

Retrieval must filter by permission labels before sending chunks to the model. Answers should include citations to source documents or business records.

## Acceptance Criteria

- A normal user asking "What rectifications am I responsible for?" only sees rectifications they can access.
- A project member asking for a project summary only receives data from visible projects.
- A user without rectification access gets a permission response and no hidden rectification identifiers.
- A platform administrator can query tenant-wide business data and the query is audited.
- Missing default model configuration produces a clear setup message.
- Model timeout or failure does not block the main app.
- Assistant answers include clickable citations for projects, rectifications, plans, and standard documents when source records are used.
- Backend tests cover default model resolution, permission filtering, tool execution, audit logging, and error branches.
- Frontend validation passes `npm run type-check`, `npm run lint`, and `npm run build`.

## Open Implementation Notes

- Prefer sharing existing service-layer permission logic. If current services mix controller-specific logic with data access, introduce small read-only query services rather than duplicating filters in tools.
- Keep the first version non-streaming unless response latency makes the UX unacceptable.
- Add SSE streaming later behind the same chat service boundary.
- Do not add write tools until a separate design covers confirmation, preview, permission checks, and audit review.
