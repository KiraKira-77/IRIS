# Project Management Design

## Goal

Build the first backend-backed project management workflow for IRIS while keeping the current frontend page structure:

- Project list
- Project start
- Project detail
- Check task detail

The module manages internal-control project execution, task dispatch, OMS work order tracking, IRIS-side review, rectification generation, and archive snapshots.

## Source Material

- Existing frontend routes and mock pages under `src/views/project/**`
- Existing frontend types in `src/types/index.ts`
- `内控线上化页面.csv`, project management section
- Current checklist backend/frontend model, used as the nearby implementation pattern

## Out Of Scope For First Version

- Real OMS integration. Use a mock OMS adapter now; replace it after the real API contract is provided.
- Plan control backend dependency. Projects can store `planId` and `planName`, but plan data is not required to be fully implemented.
- Maintenance domain / shared domain permissions. Project visibility and actions are controlled by project membership.
- IRIS-side work order handling. Work order processing happens in OMS.

## Core Concepts

### Project

A project groups check tasks generated from selected control checklist items.

Required fields:

- `id`
- `projectCode`
- `projectName`
- `source`: `plan` or `manual`
- `planId`
- `planName`
- `description`
- `startDate`
- `endDate`
- `status`
- `tags`
- `leaderId`
- `leaderName`
- `team`
- `checklistIds`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`

Project status values:

- `not_started`: 未开始
- `in_progress`: 进行中
- `completed`: 已完成
- `archived`: 已归档

`planName` is stored as a display snapshot. `planId` remains the durable future link to plan control.

### Project Member

Project management does not use maintenance/shared domains. Permissions are derived from project membership.

Required fields:

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

### Check Task

A check task is generated from a checklist item. It is the project-side inspection object.

Required fields:

- `id`
- `projectId`
- `checklistId`
- `checklistName`
- `checklistItemId`
- `checkContent`
- `checkCriterion`
- `controlFrequency`
- `evaluationType`
- `assigneeId`
- `assigneeName`
- `contactId`
- `contactName`
- `status`
- `createdAt`
- `updatedAt`

Check task status values:

- `pending`: 待办
- `in_progress`: 进行中
- `passed`: 已通过
- `nonconforming`: 不符合项

Status aggregation:

- No generated OMS work orders: `pending`
- Any linked OMS work order is unreviewed or still being processed: `in_progress`
- All linked OMS work orders are reviewed as passed: `passed`
- Any linked OMS work order is reviewed as requiring rectification: `nonconforming`

`nonconforming` must be shown in red.

### OMS Work Order

One check task can be dispatched to multiple people. Each person receives an independent OMS work order.

Required fields:

- `id`
- `projectId`
- `taskId`
- `omsWorkOrderId`
- `handlerId`
- `handlerName`
- `omsStatus`
- `omsStatusName`
- `omsResultSummary`
- `irisReviewStatus`
- `irisReviewOpinion`
- `irisReviewedAt`
- `irisReviewedBy`
- `archiveDetailSnapshot`
- `archiveLogSnapshot`
- `createdAt`
- `updatedAt`

IRIS review status values:

- `pending`: 待评审
- `passed`: 通过
- `rectification_required`: 需要整改

OMS processing happens outside IRIS. IRIS pulls OMS state by `omsWorkOrderId` and performs the final review for each OMS work order.

### Rectification Record

When a work order is reviewed as requiring rectification, IRIS automatically creates a rectification record.

Minimum linkage:

- `projectId`
- `projectName`
- `taskId`
- `checklistItemId`
- `omsWorkOrderId`
- `title`
- `description`
- `contactId`
- `contactName`
- `issuedAt`
- `status`

The detailed rectification workflow can remain in the rectification module.

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
- Generate check tasks from selected checklist items.
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
- Archive completed project

### Check Task Detail

Responsibilities:

- Show check content, criterion, control frequency, evaluation type
- Show assigned task owner and contact person
- Dispatch OMS work orders to one or more handlers
- Show linked OMS work orders and their latest OMS status
- Refresh/pull OMS work order information
- Review each OMS work order in IRIS
- Show task-level aggregation status

Dispatch flow:

1. The check task owner selects one or more handlers.
2. IRIS calls the OMS adapter to create one work order per handler.
3. IRIS stores returned `omsWorkOrderId` values.
4. Check task status becomes `in_progress`.

Review flow:

1. IRIS pulls latest OMS work order detail.
2. The check task owner reviews that individual OMS work order.
3. Review result is either passed or rectification required.
4. If rectification is required, IRIS creates a rectification record.
5. The check task status is recalculated from all linked work order review statuses.

### Project Archive

When archiving a completed project:

1. Iterate all linked OMS work orders.
2. Pull latest work order detail by `omsWorkOrderId`.
3. Pull OMS work order logs.
4. Store detail snapshot and log snapshot locally.
5. Mark project as `archived`.

Archive must not depend on future OMS availability for historical review, because snapshots are stored in IRIS.

## OMS Adapter

Use an adapter boundary so the mock implementation can be replaced later.

Backend interface:

- `createWorkOrders(task, handlers)`
- `getWorkOrder(omsWorkOrderId)`
- `getWorkOrderLogs(omsWorkOrderId)`

First version implementation:

- `MockOmsClient`
- Generate deterministic-looking OMS IDs such as `OMS-YYYYMMDD-0001`
- Return mock status, result summary, and logs
- Keep the service contract close to the expected real OMS integration

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
- `POST /v1/projects/{projectId}/tasks/{taskId}/work-orders`
- `POST /v1/projects/{projectId}/tasks/{taskId}/work-orders/{workOrderId}/refresh`
- `POST /v1/projects/{projectId}/tasks/{taskId}/work-orders/{workOrderId}/review`

## Frontend Requirements

Keep the current page structure and update behavior only where needed:

- Replace direct `mockProjects` mutation with API calls.
- Keep the existing project route paths.
- Keep project list/detail/start/task screens.
- Update labels and statuses:
  - Project: 未开始、进行中、已完成、已归档
  - Task: 待办、进行中、已通过、不符合项
- Remove audit/reviewer UI from project management.
- Add OMS work order list and review controls to task detail.
- Use red styling for 不符合项.

## Validation

Backend:

- Service tests for project create, start, assign task owner, create mock OMS work orders, review work order, create rectification, archive snapshots.
- Controller tests for the same API surface.

Frontend:

- Type check and build.
- Focused tests or source-level assertions for status labels, absence of reviewer/auditor controls, and OMS work order review actions.

## Open Follow-Up

The real OMS API contract is pending. Once provided, add the real adapter implementation and integration tests around the adapter boundary.
