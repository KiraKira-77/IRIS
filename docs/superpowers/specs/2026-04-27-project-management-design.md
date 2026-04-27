# Project Management Design

## Goal

Build the first backend-backed project management workflow for IRIS while keeping the current frontend page structure:

- Project list
- Project start
- Project detail
- Check task detail

The module manages internal-control project execution, check task dispatch, OMS work order creation and tracking, IRIS-side work order review, rectification generation, and archive snapshots.

## Source Material

- Existing frontend routes and mock pages under `src/views/project/**`
- Existing frontend types in `src/types/index.ts`
- Existing API placeholders in `src/api/index.ts`
- `内控线上化页面.csv`, project management section
- Current checklist backend/frontend model, used as the nearby implementation pattern

## First-Version Scope

In scope:

- Backend-backed project list, create, detail, task detail, and project lifecycle actions.
- Manual projects and plan-sourced projects with `planId` and `planName` snapshots.
- Project-member based permissions.
- Check tasks generated from selected control checklist items.
- One check task to many OMS work orders. Each handler gets one independent OMS work order record.
- Mock OMS adapter. The real OMS API will be wired later behind the same adapter boundary.
- IRIS-side review of each OMS work order by the check task assignee.
- Automatic rectification record creation when a work order review requires rectification.
- Project archive snapshots for OMS work order details, logs, and attachments when available.

Out of scope:

- Real OMS HTTP integration.
- Plan control backend dependency beyond storing `planId` and `planName`.
- Maintenance domain / shared domain permissions for projects.
- Processing OMS work orders inside IRIS. OMS handles the work order processing; IRIS creates, syncs, reviews, and archives work order information.

## Model Decisions

### Do Not Copy Check Tasks For Multi-Person Dispatch

Existing mock code duplicates `CheckTask` records when one check item is dispatched to multiple people. The backend version must not use that pattern.

The required model is:

```text
Project
  -> CheckTask
      -> ProjectTaskWorkOrder
      -> ProjectTaskWorkOrder
      -> ProjectTaskWorkOrder
```

One `CheckTask` represents one checklist item inside one project. Multi-person dispatch creates multiple `ProjectTaskWorkOrder` child records, not multiple check tasks.

`CheckTask` must not store a single `workOrderId` or `workOrderStatus`.

## Core Data Model

### Project

Frontend DTO fields should continue using the existing short names where possible:

- `id`
- `code`
- `name`
- `source`: `plan` or `manual`
- `planId`
- `planName`
- `description`
- `startDate`
- `endDate`
- `status`
- `tagIds`
- `tagNames`
- `leaderId`
- `leaderName`
- `team`
- `checklistIds`
- `taskCount`
- `nonconformingCount`
- `progress`
- `archiveStatus`
- `archiveStartedAt`
- `archiveCompletedAt`
- `archiveError`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`

Database fields may use explicit names such as `project_code` and `project_name`, but API DTOs should use `code` and `name` to align with the current frontend.

`planName` is a display snapshot. `planId` remains the durable future link to plan control.

Project status values:

- `not_started`: 未开始
- `in_progress`: 进行中
- `completed`: 已完成
- `archived`: 已归档

Migration from old frontend statuses:

- `preparing` becomes `not_started`
- `closing` is removed
- `completed` remains `completed`
- `archived` remains `archived`

### Project Member

Project management does not use maintenance/shared domains. Visibility and actions are derived from project membership.

Fields:

- `id`
- `projectId`
- `personnelId`
- `personnelName`
- `employeeNo`
- `department`
- `role`

Roles:

- `leader`: 项目负责人
- `member`: 项目成员
- `contact`: 对接人

There is no auditor or reviewer role in project management.

Operation permissions:

- Project creation permission comes from the existing menu/system permission `project.create`.
- Project list returns projects where the current user is a project leader or member. A future global management role can broaden this, but it is not part of the first version.
- Project leader can start, complete, archive, delete not-started projects, maintain team members, and batch assign check task assignees.
- Project leader can edit project basic information while status is `not_started`; after start, only team assignment and task assignment can change.
- Check task assignee can create OMS work orders, refresh OMS work orders, and review OMS work orders for their assigned check tasks.
- OMS work order handler is only the external OMS handler. Being a handler does not automatically grant IRIS review permission.
- Project members can view project detail.
- Non-project members cannot view project detail unless later granted by a separate global role rule.

### Check Task

A check task is generated from one checklist item.

Fields:

- `id`
- `projectId`
- `checklistId`
- `checklistName`
- `checklistItemId`
- `checkContent`
- `checkCriterion`
- `controlFrequency`
- `evaluationType`
- `taskName`
- `taskDescription`
- `assigneeId`
- `assigneeName`
- `contactId`
- `contactName`
- `status`
- `issuedAt`
- `completedAt`
- `createdAt`
- `updatedAt`

Check task status values:

- `pending`: 待办
- `in_progress`: 进行中
- `passed`: 已通过
- `nonconforming`: 不符合项

Status aggregation from child work orders:

- No generated OMS work orders: `pending`
- Any linked OMS work order is processing, sync failed, or pending IRIS review: `in_progress`
- All linked OMS work orders are reviewed as `passed`: `passed`
- Any linked OMS work order is reviewed as `rectification_required`: `nonconforming`

`nonconforming` must be shown in red.

Migration from old frontend task statuses:

- `pending` remains `pending`
- `in_progress`, `dispatched`, `uploaded`, `submitted`, and `reviewing` become `in_progress`
- `approved` becomes `passed`
- `rejected` and `rectifying` become `nonconforming`

Old audit, submit, upload, reject, and reviewer UI flows are removed from project management. OMS processing replaces those IRIS-side task handling flows.

### Project Task Work Order

Each selected handler receives one independent OMS work order record.

Fields:

- `id`: local work order record id
- `projectId`
- `taskId`
- `omsWorkOrderId`: external OMS id
- `idempotencyKey`: `taskId + handlerId`
- `handlerId`
- `handlerName`
- `workOrderTitle`
- `workOrderDescription`
- `issuedAt`
- `completedAt`
- `omsStatus`
- `omsStatusName`
- `omsResultSummary`
- `omsDetailPayload`
- `omsLogPayload`
- `omsAttachmentPayload`
- `syncStatus`: `not_synced`, `synced`, `failed`
- `lastSyncedAt`
- `syncError`
- `requestPayload`
- `responsePayload`
- `irisReviewStatus`
- `irisReviewOpinion`
- `irisReviewedAt`
- `irisReviewedBy`
- `rectificationId`
- `reviewLocked`
- `archiveBatchId`
- `detailSnapshotJson`
- `logSnapshotJson`
- `attachmentSnapshotJson`
- `snapshotVersion`
- `snapshottedAt`
- `createdAt`
- `updatedAt`

IRIS review status values:

- `pending`: 待评审
- `passed`: 通过
- `rectification_required`: 需要整改

Local `id` and external `omsWorkOrderId` must stay separate. All IRIS API routes that mutate work order records use the local `id`.

Only OMS completed/closed status classes can be reviewed in IRIS.

Initial OMS status mapping:

| OMS status | OMS label | IRIS sync class | IRIS review allowed |
| --- | --- | --- | --- |
| `0` | 待分配 | processing | no |
| `5` | 待领取 | processing | no |
| `10` | 处理中 | processing | no |
| `13` | 转办中 | processing | no |
| `15` | 挂起中 | processing | no |
| `20` | 已完成 | completed | yes |
| `25` | 已关闭 | completed | yes |
| `30` | 已归档 | completed | yes |
| `40` | 已退回 | exception | no |
| unknown | 未知状态 | exception | no |

The mock OMS adapter must use this table. The real adapter can extend it after the official OMS contract is available.

### Rectification Record

When a work order is reviewed as requiring rectification, IRIS automatically creates a rectification record.

Minimum fields for generated records:

- `id`
- `code`
- `title`
- `description`
- `taskName`
- `taskDescription`
- `projectId`
- `projectName`
- `taskId`
- `checklistItemId`
- `checkContent`
- `sourceWorkOrderRecordId`
- `omsWorkOrderId`
- `assigneeId`
- `assigneeName`
- `contactId`
- `contactName`
- `issuedAt`
- `deadline`
- `status`

Creation must be idempotent. Re-reviewing the same work order as requiring rectification must update or reuse the existing rectification record rather than creating duplicates.

Review mutation rule:

- A work order review can change while `irisReviewStatus` is `pending` or `passed`.
- Once a work order is reviewed as `rectification_required` and a rectification record is created, the review becomes locked.
- A locked review cannot be changed back to `passed` in the first version.
- If a correction is needed, it must be handled by the rectification workflow instead of changing the original work order review.

Rectification closure rule:

- In the current rectification model, `approved` is treated as closed.
- Project archive requires every generated rectification record for the project to have `status = approved`.
- If the rectification module later adds an explicit `closed` status, archive eligibility should migrate to `approved` or `closed` according to that module's final state machine.

The detailed rectification workflow remains in the rectification module.

### Archive Snapshot

Archive data is stored locally so historical project archives do not depend on future OMS availability.

Archive fields on project:

- `archiveStatus`: `none`, `running`, `failed`, `archived`
- `archiveStartedAt`
- `archiveCompletedAt`
- `archiveError`

Archive fields on work order:

- `archiveBatchId`
- `detailSnapshotJson`
- `logSnapshotJson`
- `attachmentSnapshotJson`
- `snapshotVersion`
- `snapshottedAt`

Any work order snapshot failure prevents marking the project as `archived`.

## User Workflows

### Project List

Search conditions from the CSV:

- Project name
- Project time
- Status
- Tags

Displayed columns:

- Project name
- Project source
- Project time
- Tags
- Check task count
- Progress
- Nonconforming count
- Status

Progress calculation:

```text
handled tasks = passed + nonconforming
progress = handled tasks / total tasks
```

### Project Start

Supported sources:

- Manual project
- Plan generated project, storing `planId` and `planName` only for now

Inputs:

- Project name
- Source
- Plan ID and plan name when source is plan
- Start date
- Description
- Tags
- Selected control checklists
- Project team
- Project leader

On create:

- Save project as `not_started`.
- Generate one check task per selected checklist item.
- Do not generate OMS work orders yet.

### Project Detail

Sections follow the current frontend structure:

- Project overview
- Check task list
- Team

Project leader actions:

- Start project: `not_started` to `in_progress`
- Batch assign check task assignee
- Open check task detail
- Complete project when all check tasks are `passed` or `nonconforming`
- Archive completed project only when all generated rectification records for that project are closed

If product policy later allows archiving with open rectification records, archive snapshots must explicitly mark those issues as not closed. First version should require all generated rectification records to be closed before archive.

### Check Task Detail

Responsibilities:

- Show check content, criterion, control frequency, evaluation type
- Show assigned task owner and contact person
- Dispatch OMS work orders to one or more handlers
- Show linked OMS work orders and their latest OMS status
- Refresh/pull OMS work order information
- Review each OMS work order in IRIS
- Show task-level aggregation status
- Show check form flow from local operation logs plus OMS logs
- Show IRIS review opinion per work order

Dispatch flow:

1. The check task assignee selects one or more handlers.
2. IRIS calls the OMS adapter to create one work order per handler.
3. IRIS uses `idempotencyKey = taskId + handlerId` to avoid duplicate OMS work orders on repeated clicks.
4. IRIS stores returned `omsWorkOrderId` values on local `ProjectTaskWorkOrder` rows.
5. Check task status becomes `in_progress`.

Review flow:

1. IRIS pulls the latest OMS work order detail.
2. IRIS allows review only if the mapped OMS status is completed/closed.
3. The check task assignee reviews that individual OMS work order.
4. Review result is either `passed` or `rectification_required`.
5. If rectification is required, IRIS creates or reuses the linked rectification record.
6. The check task status is recalculated from all linked work order review statuses.

### Project Archive

When archiving a completed project:

1. Confirm all generated rectification records for the project are closed.
2. Set project archive status to `running`.
3. Iterate all linked OMS work orders.
4. Pull latest work order detail by `omsWorkOrderId`.
5. Pull OMS work order logs.
6. Pull OMS attachment metadata or material references when available.
7. Store detail, log, and attachment snapshots locally with a snapshot version.
8. If any work order snapshot fails, set archive status to `failed` and keep project status as `completed`.
9. If all snapshots succeed, mark project status as `archived` and archive status as `archived`.

## OMS Adapter

Use an adapter boundary so the mock implementation can be replaced later.

Backend interface:

- `createWorkOrders(task, handlers, idempotencyKeys)`
- `getWorkOrder(omsWorkOrderId)`
- `getWorkOrderLogs(omsWorkOrderId)`
- `getWorkOrderAttachments(omsWorkOrderId)`

First version implementation:

- `MockOmsClient`
- Generate deterministic-looking OMS IDs such as `OMS-YYYYMMDD-0001`
- Return mock status, result summary, detail payload, logs, and attachment metadata
- Simulate completed and processing OMS statuses
- Preserve request and response payloads for later real OMS troubleshooting

OMS adapter requirements:

- Creation must be idempotent per `taskId + handlerId`.
- Partial create success must persist both successful and failed local rows.
- Failed handler rows must keep the same `idempotencyKey`, `handlerId`, `requestPayload`, and `syncError`.
- Retrying a failed handler must reuse the same `taskId + handlerId` idempotency key and update the failed row, not create another local row.
- Sync failures must store `syncStatus = failed` and `syncError`.
- The service layer must map OMS statuses to IRIS review eligibility.

Future implementation:

- `RealOmsClient`
- Replace mock calls with real OMS HTTP API calls
- Preserve project service and controller contracts

## Backend API Shape

Project endpoints:

- `GET /v1/projects`
- `GET /v1/projects/{id}`
- `POST /v1/projects`
- `PUT /v1/projects/{id}`
- `DELETE /v1/projects/{id}` for not-started projects only
- `POST /v1/projects/{id}/start`
- `POST /v1/projects/{id}/complete`
- `POST /v1/projects/{id}/archive`

Task endpoints:

- `GET /v1/projects/{projectId}/tasks`
- `GET /v1/projects/{projectId}/tasks/{taskId}`
- `POST /v1/projects/{projectId}/tasks/assign`

Work order endpoints:

- `GET /v1/projects/{projectId}/tasks/{taskId}/work-orders`
- `POST /v1/projects/{projectId}/tasks/{taskId}/work-orders`
- `POST /v1/projects/{projectId}/tasks/{taskId}/work-orders/{localWorkOrderId}/refresh`
- `POST /v1/projects/{projectId}/tasks/{taskId}/work-orders/{localWorkOrderId}/review`

`localWorkOrderId` is the IRIS database row id. It is not the OMS work order id.

The old frontend `taskApi.detail('/v1/tasks/{id}')` can be kept as a compatibility wrapper only if it delegates to the nested project route. New implementation should prefer nested routes because task identity is project-scoped in the UI.

Work order create request:

- `handlers`: array of `{ handlerId, handlerName, workOrderTitle, workOrderDescription }`

Work order create response:

- `created`: successfully created or reused local work order records
- `failed`: failed local work order records with `handlerId`, `idempotencyKey`, and `syncError`

Work order refresh response:

- refreshed local work order record
- latest OMS status fields
- `syncStatus`
- `syncError`

Work order review request:

- `reviewStatus`: `passed` or `rectification_required`
- `reviewOpinion`

Work order review response:

- reviewed local work order record
- recalculated parent check task status
- created or reused `rectificationId` when review requires rectification

## Frontend Requirements

Keep the current page structure and update behavior only where needed:

- Replace direct `mockProjects` mutation with API calls.
- Keep the existing project route paths.
- Keep project list/detail/start/task screens.
- Update labels and statuses:
  - Project: 未开始、进行中、已完成、已归档
  - Task: 待办、进行中、已通过、不符合项
- Remove audit/reviewer UI from project management.
- Remove old task submit, upload, reject, approve, and review workflow buttons.
- Add OMS work order list and IRIS review controls to task detail.
- Use red styling for 不符合项.
- Show project tags from `tagNames`; search by `tagId`.
- Show OMS work order title, description, handler, issued time, completed time, OMS status, IRIS review status, and review opinion.

## Validation

Backend tests:

- Project create generates check tasks from selected checklist items.
- Project start changes `not_started` to `in_progress`.
- Project leader can batch assign check task assignees.
- Non-project members cannot view project detail.
- Non-task-assignees cannot generate or review OMS work orders.
- Multi-handler dispatch creates child work order rows and does not duplicate check tasks.
- Repeated dispatch with the same `taskId + handlerId` is idempotent.
- Work order refresh stores OMS detail, logs, status, and sync metadata.
- A work order reviewed as passed does not create rectification.
- A work order reviewed as requiring rectification creates exactly one rectification record.
- Repeating rectification review is idempotent.
- Any rectification-required work order makes the parent check task `nonconforming`.
- All passed work orders make the parent check task `passed`.
- Project archive fails if any OMS snapshot fails.
- Project archive succeeds only after all generated rectification records are closed and all snapshots are stored.

Frontend validation:

- Type check and build.
- Source-level or unit assertions for project status labels.
- Source-level or unit assertions for task status labels and red nonconforming styling.
- Source-level or unit assertions that reviewer/auditor controls are absent.
- Source-level or unit assertions that task detail uses a work order list, not single `workOrderId`.

## Open Follow-Up

The real OMS API contract is pending. Once provided, add the real adapter implementation and integration tests around the adapter boundary.
