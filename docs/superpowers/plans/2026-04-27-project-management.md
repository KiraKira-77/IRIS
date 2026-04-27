# Project Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backend-backed project management with project lifecycle, check tasks, one-to-many OMS work orders, IRIS-side work order review, automatic rectification generation, and archive snapshots.

**Architecture:** Mirror the existing checklist backend module with a new `project` business package and focused entities for projects, project members, check tasks, task work orders, and operation logs. Use an `OmsClient` adapter with `MockOmsClient` for first version, so real OMS integration can replace only the adapter later. Update the existing Vue project pages in place, preserving current routes and layout while replacing mock mutations with API calls.

**Tech Stack:** Spring Boot 3, MyBatis Plus, JUnit 5, Mockito, Vue 3, Vite, Element Plus, TypeScript, Vitest/source-level page assertions.

---

## Guardrails

- Do not submit or refactor the unrelated plan-control working tree changes.
- Before each implementation task, run `git -C IRIS-BACK status --short` and `git -C IRIS-WEB status --short`.
- Do not use broad `git add` on shared files that already contain unrelated changes, especially `IRIS-BACK/db/init.sql`, `IRIS-WEB/src/api/index.ts`, and `IRIS-WEB/src/types/index.ts`.
- For shared files, inspect `git diff -- <file>` and use `git add -p` to stage only project-management hunks.
- Keep implementation commits scoped by task.
- Do not copy `CheckTask` rows for multi-person dispatch. Multi-person dispatch must create `ProjectTaskWorkOrder` child rows.
- Use `localWorkOrderId` for IRIS work order API mutations, not `omsWorkOrderId`.
- Preserve existing project route paths:
  - `/project/list`
  - `/project/create`
  - `/project/detail/:id`
  - `/project/task/:id`

## File Structure

### Backend Files

- Create `IRIS-BACK/iris-back-app/src/main/resources/db/migration/V9__add_projects.sql`
  - Project, member, check task, task work order, operation log, and minimal rectification linkage tables.
- Modify `IRIS-BACK/db/init.sql`
  - Add matching project tables for non-Flyway local initialization.
- Create `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/controller/ProjectController.java`
  - Project list/detail/create/update/delete/start/complete/archive and nested task/work-order routes.
- Create `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/service/ProjectService.java`
  - Project lifecycle, task generation, membership rules, status aggregation, archive orchestration.
- Create `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/service/OmsClient.java`
  - Adapter interface.
- Create `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/service/MockOmsClient.java`
  - Mock OMS create/query/log/attachment behavior and OMS status mapping.
- Create `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/mapper/*.java`
  - MyBatis Plus mappers for project tables.
- Create `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/entity/*.java`
  - Entity classes extending `BaseEntity`.
- Create `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/dto/*.java`
  - `ProjectDto`, `ProjectMemberDto`, `ProjectTaskDto`, `ProjectTaskWorkOrderDto`, create/refresh/review result DTOs.
  - Include allowed action flags on project/task DTOs so the frontend can render buttons without guessing permissions.
- Create `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/request/*.java`
  - List/create/update/assign/work-order/review request records.
- Create `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/ProjectServiceTests.java`
  - Service-level rules and status aggregation tests.
- Create `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/ProjectControllerTests.java`
  - API surface tests.

### Frontend Files

- Modify `IRIS-WEB/src/types/index.ts`
  - Replace old project/task statuses, add work order types and payloads.
- Modify `IRIS-WEB/src/api/index.ts`
  - Replace project `close` API with `start`/`complete`/`archive`, nested task/work-order APIs.
- Create `IRIS-WEB/src/features/projects/project-data.ts`
  - Normalizers, status labels, progress calculation, OMS status labels.
- Create `IRIS-WEB/src/features/projects/project-data.spec.ts`
  - Status/progress/work-order normalization assertions.
- Modify `IRIS-WEB/src/views/project/list/index.vue`
  - Backend-backed list/search/pagination/status labels.
- Modify `IRIS-WEB/src/views/project/create/index.vue`
  - Backend create payload, `planId`/`planName`, checklist/team selection, no mock push.
- Modify `IRIS-WEB/src/views/project/detail/index.vue`
  - Backend detail, task list, project lifecycle actions, batch assign assignee, no audit/reviewer UI.
- Modify `IRIS-WEB/src/views/project/task/index.vue`
  - Work order list, generate OMS work orders, refresh, IRIS review, remove old upload/submit/audit flow.
- Create `IRIS-WEB/src/views/project/project-pages.spec.ts`
  - Source-level assertions for statuses, absent reviewer/auditor controls, and work-order list model.

---

### Task 1: Backend Schema And Contracts

**Files:**
- Create: `IRIS-BACK/iris-back-app/src/main/resources/db/migration/V9__add_projects.sql`
- Modify: `IRIS-BACK/db/init.sql`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/entity/BizProjectEntity.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/entity/BizProjectMemberEntity.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/entity/BizProjectTaskEntity.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/entity/BizProjectTaskWorkOrderEntity.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/mapper/BizProjectMapper.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/mapper/BizProjectMemberMapper.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/mapper/BizProjectTaskMapper.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/mapper/BizProjectTaskWorkOrderMapper.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/dto/ProjectDto.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/dto/ProjectTaskDto.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/dto/ProjectTaskWorkOrderDto.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/request/ProjectListQuery.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/request/ProjectUpsertRequest.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/request/ProjectTaskAssignRequest.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/request/ProjectWorkOrderCreateRequest.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/request/ProjectWorkOrderReviewRequest.java`

- [ ] Confirm migration version and write `V9__add_projects.sql`

Run:

```powershell
git -C IRIS-BACK status --short
Get-ChildItem IRIS-BACK/iris-back-app/src/main/resources/db/migration -Filter 'V*.sql' | Sort-Object Name | Select-Object Name
```

Expected: `V8__add_control_plans.sql` already exists, so project management uses `V9__add_projects.sql`.

Include these tables:

```sql
CREATE TABLE IF NOT EXISTS biz_project (
  id BIGINT NOT NULL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  project_code VARCHAR(64) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  source VARCHAR(32) NOT NULL,
  plan_id BIGINT NULL,
  plan_name VARCHAR(255) NULL,
  description TEXT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  status VARCHAR(32) NOT NULL,
  tag_ids VARCHAR(500) NULL,
  tag_names VARCHAR(1000) NULL,
  leader_id BIGINT NULL,
  leader_name VARCHAR(100) NULL,
  checklist_ids VARCHAR(1000) NULL,
  archive_status VARCHAR(32) NOT NULL DEFAULT 'none',
  archive_started_at DATETIME NULL,
  archive_completed_at DATETIME NULL,
  archive_error TEXT NULL,
  remark VARCHAR(500) NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  version BIGINT NOT NULL DEFAULT 0,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_biz_project_code (tenant_id, project_code),
  KEY idx_biz_project_status (tenant_id, status),
  KEY idx_biz_project_leader (tenant_id, leader_id)
);

CREATE TABLE IF NOT EXISTS biz_project_member (
  id BIGINT NOT NULL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  project_id BIGINT NOT NULL,
  personnel_id BIGINT NOT NULL,
  personnel_name VARCHAR(100) NOT NULL,
  employee_no VARCHAR(64) NULL,
  department VARCHAR(100) NULL,
  role VARCHAR(32) NOT NULL,
  remark VARCHAR(500) NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  version BIGINT NOT NULL DEFAULT 0,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_biz_project_member_person (tenant_id, project_id, personnel_id, role),
  KEY idx_biz_project_member_project (tenant_id, project_id),
  KEY idx_biz_project_member_person (tenant_id, personnel_id)
);

CREATE TABLE IF NOT EXISTS biz_project_task (
  id BIGINT NOT NULL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  project_id BIGINT NOT NULL,
  checklist_id BIGINT NOT NULL,
  checklist_name VARCHAR(255) NULL,
  checklist_item_id BIGINT NOT NULL,
  check_content TEXT NOT NULL,
  check_criterion TEXT NOT NULL,
  control_frequency VARCHAR(64) NULL,
  evaluation_type VARCHAR(64) NULL,
  task_name VARCHAR(255) NULL,
  task_description TEXT NULL,
  assignee_id BIGINT NULL,
  assignee_name VARCHAR(100) NULL,
  contact_id BIGINT NULL,
  contact_name VARCHAR(100) NULL,
  status VARCHAR(32) NOT NULL,
  issued_at DATETIME NULL,
  completed_at DATETIME NULL,
  remark VARCHAR(500) NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  version BIGINT NOT NULL DEFAULT 0,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_biz_project_task_item (tenant_id, project_id, checklist_item_id),
  KEY idx_biz_project_task_project (tenant_id, project_id),
  KEY idx_biz_project_task_assignee (tenant_id, assignee_id),
  KEY idx_biz_project_task_status (tenant_id, status)
);

CREATE TABLE IF NOT EXISTS biz_project_task_work_order (
  id BIGINT NOT NULL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  project_id BIGINT NOT NULL,
  task_id BIGINT NOT NULL,
  oms_work_order_id VARCHAR(100) NULL,
  idempotency_key VARCHAR(160) NOT NULL,
  handler_id BIGINT NOT NULL,
  handler_name VARCHAR(100) NOT NULL,
  work_order_title VARCHAR(255) NULL,
  work_order_description TEXT NULL,
  issued_at DATETIME NULL,
  completed_at DATETIME NULL,
  oms_status VARCHAR(32) NULL,
  oms_status_name VARCHAR(100) NULL,
  oms_result_summary TEXT NULL,
  oms_detail_payload TEXT NULL,
  oms_log_payload TEXT NULL,
  oms_attachment_payload TEXT NULL,
  sync_status VARCHAR(32) NOT NULL DEFAULT 'not_synced',
  last_synced_at DATETIME NULL,
  sync_error TEXT NULL,
  request_payload TEXT NULL,
  response_payload TEXT NULL,
  iris_review_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  iris_review_opinion TEXT NULL,
  iris_reviewed_at DATETIME NULL,
  iris_reviewed_by BIGINT NULL,
  rectification_id BIGINT NULL,
  review_locked TINYINT NOT NULL DEFAULT 0,
  archive_batch_id VARCHAR(64) NULL,
  detail_snapshot_json TEXT NULL,
  log_snapshot_json TEXT NULL,
  attachment_snapshot_json TEXT NULL,
  snapshot_version VARCHAR(32) NULL,
  snapshotted_at DATETIME NULL,
  remark VARCHAR(500) NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  version BIGINT NOT NULL DEFAULT 0,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_biz_project_wo_idempotency (tenant_id, idempotency_key),
  UNIQUE KEY uk_biz_project_wo_handler (tenant_id, task_id, handler_id),
  KEY idx_biz_project_wo_task (tenant_id, task_id),
  KEY idx_biz_project_wo_project (tenant_id, project_id),
  KEY idx_biz_project_wo_oms (tenant_id, oms_work_order_id),
  KEY idx_biz_project_wo_review (tenant_id, iris_review_status)
);

CREATE TABLE IF NOT EXISTS biz_project_rectification (
  id BIGINT NOT NULL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  rectification_code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  task_name VARCHAR(255) NULL,
  task_description TEXT NULL,
  project_id BIGINT NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  task_id BIGINT NOT NULL,
  checklist_item_id BIGINT NOT NULL,
  check_content TEXT NULL,
  source_work_order_record_id BIGINT NOT NULL,
  oms_work_order_id VARCHAR(100) NULL,
  assignee_id BIGINT NULL,
  assignee_name VARCHAR(100) NULL,
  contact_id BIGINT NULL,
  contact_name VARCHAR(100) NULL,
  issued_at DATETIME NULL,
  deadline DATETIME NULL,
  status VARCHAR(32) NOT NULL,
  remark VARCHAR(500) NULL,
  deleted TINYINT NOT NULL DEFAULT 0,
  version BIGINT NOT NULL DEFAULT 0,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_biz_project_rect_code (tenant_id, rectification_code),
  UNIQUE KEY uk_biz_project_rect_source (tenant_id, source_work_order_record_id),
  KEY idx_biz_project_rect_project (tenant_id, project_id),
  KEY idx_biz_project_rect_status (tenant_id, status)
);

CREATE TABLE IF NOT EXISTS biz_project_operation_log (
  id BIGINT NOT NULL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  project_id BIGINT NOT NULL,
  task_id BIGINT NULL,
  work_order_id BIGINT NULL,
  action VARCHAR(64) NOT NULL,
  operator_id BIGINT NULL,
  operator_name VARCHAR(100) NULL,
  remark TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_biz_project_log_project (tenant_id, project_id),
  KEY idx_biz_project_log_task (tenant_id, task_id),
  KEY idx_biz_project_log_work_order (tenant_id, work_order_id)
);
```

Use `tenant_id`, `deleted`, `version`, audit columns, and indexes by parent IDs.

- [ ] Write mapper/schema smoke test before implementation

Add a service test that will fail until entities/mappers exist:

```java
@Test
void workOrderModelSeparatesLocalAndOmsIdsAndUsesIdempotencyKey() {
  BizProjectTaskWorkOrderEntity workOrder = new BizProjectTaskWorkOrderEntity();
  workOrder.setId(1001L);
  workOrder.setOmsWorkOrderId("OMS-20260427-0001");
  workOrder.setIdempotencyKey("task-1:handler-1");

  assertThat(workOrder.getId()).isEqualTo(1001L);
  assertThat(workOrder.getOmsWorkOrderId()).isEqualTo("OMS-20260427-0001");
  assertThat(workOrder.getIdempotencyKey()).isEqualTo("task-1:handler-1");
}
```

- [ ] Add the same DDL block to `IRIS-BACK/db/init.sql`

Append project DDL near other business tables.

- [ ] Add entity classes

Each entity extends `BaseEntity`. Use fields that mirror snake_case columns in camelCase. Use `@TableName`.

- [ ] Add mapper interfaces

Each mapper extends `BaseMapper<Entity>`.

- [ ] Add request and DTO records

Use Java records for DTO/request classes, following the checklist package pattern.

- [ ] Run backend compile to catch mapping/type errors

Run:

```powershell
cd IRIS-BACK
.\mvnw.cmd -pl iris-back-business -am -DskipTests compile
```

Expected: compile succeeds.

- [ ] Commit

```powershell
git -C IRIS-BACK add iris-back-app/src/main/resources/db/migration/V9__add_projects.sql iris-back-business/src/main/java/com/iris/back/business/project
git -C IRIS-BACK add -p db/init.sql
git -C IRIS-BACK commit -m "feat(project): add project schema and contracts"
```

---

### Task 2: Backend Project Create, List, Detail, Lifecycle

**Files:**
- Create: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/ProjectServiceTests.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/service/ProjectService.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/controller/ProjectController.java`
- Modify: project DTO/request/entity/mapper files from Task 1

- [ ] Write failing service test for project creation

Test name:

```java
@Test
void createGeneratesTasksFromSelectedChecklistItems()
```

Arrange:

- Current user tenant `1001`, user `2001`.
- One active checklist with two items.
- `ProjectUpsertRequest` with `checklistIds = ["8801"]`, leader, team, tags.

Assert:

- `biz_project` insert has status `not_started`.
- two `biz_project_task` inserts happen.
- each task has one checklist item and no work order field.
- returned DTO has `taskCount = 2`, `progress = 0`.

- [ ] Run the test and confirm it fails because service does not exist or behavior is missing

```powershell
cd IRIS-BACK
.\mvnw.cmd -pl iris-back-app -am "-Dtest=ProjectServiceTests#createGeneratesTasksFromSelectedChecklistItems" test
```

Expected: fail.

- [ ] Implement minimal `ProjectService.create`

Use `IdentifierGenerator` for IDs. Load checklist items from `BizChecklistMapper` and `BizChecklistItemMapper`. Generate one `BizProjectTaskEntity` per selected checklist item.

- [ ] Add list/detail service tests

Test names:

```java
listReturnsOnlyProjectsWhereCurrentUserIsMember()
detailRejectsNonProjectMember()
```

Assert list filters by membership, keyword/status/tag/date, and calculates progress from tasks.

- [ ] Implement list/detail access rules

Load project membership first. If current user is not a member, throw `BusinessException("PROJECT_FORBIDDEN", ...)`.

- [ ] Add lifecycle tests

Test names:

```java
createRequiresProjectCreatePermission()
leaderStartsNotStartedProject()
leaderCompletesProjectWhenEveryTaskIsHandled()
deleteOnlyAllowsNotStartedProject()
nonLeaderCannotStartCompleteArchiveDeleteOrAssignTasks()
memberCanViewButCannotMutateProject()
```

Assert:

- `not_started -> in_progress`
- create requires the existing `project.create` menu/system permission.
- complete allowed only if every task is `passed` or `nonconforming`
- delete rejects non-`not_started`.
- project members can view detail but cannot start, complete, archive, delete, or assign tasks unless they are the leader.

- [ ] Implement lifecycle service methods

Add `start`, `complete`, `delete`, `update`.

- [ ] Add controller tests for API routes

Use the existing controller test style. Cover:

- `GET /api/v1/projects`
- `GET /api/v1/projects/{id}`
- `POST /api/v1/projects`
- `POST /api/v1/projects/{id}/start`
- `POST /api/v1/projects/{id}/complete`

- [ ] Implement controller routes

Base mapping:

```java
@RequestMapping("/api/v1/projects")
```

- [ ] Run targeted backend tests

```powershell
cd IRIS-BACK
.\mvnw.cmd -pl iris-back-app -am "-Dtest=ProjectServiceTests,ProjectControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Expected: pass.

- [ ] Commit

```powershell
git -C IRIS-BACK add iris-back-app/src/test/java/com/iris/back/business/ProjectServiceTests.java iris-back-app/src/test/java/com/iris/back/business/ProjectControllerTests.java iris-back-business/src/main/java/com/iris/back/business/project
git -C IRIS-BACK commit -m "feat(project): implement project lifecycle api"
```

---

### Task 3: Backend OMS Work Orders And Status Aggregation

**Files:**
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/service/OmsClient.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/service/MockOmsClient.java`
- Modify: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/service/ProjectService.java`
- Modify: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/controller/ProjectController.java`
- Modify: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/ProjectServiceTests.java`
- Modify: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/ProjectControllerTests.java`

- [ ] Write failing idempotent dispatch test

Test name:

```java
createWorkOrdersCreatesOneChildRowPerHandlerWithoutDuplicatingTasks()
```

Assert:

- one `BizProjectTaskEntity` remains one task.
- two handlers create two `BizProjectTaskWorkOrderEntity` rows.
- `idempotencyKey` is `taskId + ":" + handlerId`.

- [ ] Run test and confirm fail

```powershell
cd IRIS-BACK
.\mvnw.cmd -pl iris-back-app -am "-Dtest=ProjectServiceTests#createWorkOrdersCreatesOneChildRowPerHandlerWithoutDuplicatingTasks" test
```

- [ ] Implement `OmsClient`

Interface:

```java
public interface OmsClient {
  List<OmsCreateResult> createWorkOrders(ProjectTaskDto task, List<OmsCreateCommand> commands);
  OmsWorkOrderSnapshot getWorkOrder(String omsWorkOrderId);
  List<OmsWorkOrderLogSnapshot> getWorkOrderLogs(String omsWorkOrderId);
  List<OmsAttachmentSnapshot> getWorkOrderAttachments(String omsWorkOrderId);
}
```

- [ ] Implement `MockOmsClient`

Use deterministic IDs:

```java
"OMS-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + sequence
```

Map OMS statuses from the spec:

- `0`, `5`, `10`, `13`, `15`: processing, not reviewable
- `20`, `25`, `30`: completed, reviewable
- `40`, unknown: exception, not reviewable

- [ ] Implement work order creation service

Rules:

- Check task assignee can create work orders.
- Create or update one local row per handler/idempotency key.
- Failed OMS create rows are still saved with `syncStatus = failed`.
- Retrying reuses the failed row.
- Parent task status becomes `in_progress`.

- [ ] Add refresh test

Test name:

```java
refreshWorkOrderStoresOmsSnapshotAndSyncStatus()
```

- [ ] Implement refresh service and controller

`POST /api/v1/projects/{projectId}/tasks/{taskId}/work-orders/{localWorkOrderId}/refresh`

- [ ] Add controller tests for work-order list/create/refresh

Routes:

- `GET /api/v1/projects/{projectId}/tasks/{taskId}/work-orders`
- `POST /api/v1/projects/{projectId}/tasks/{taskId}/work-orders`
- `POST /api/v1/projects/{projectId}/tasks/{taskId}/work-orders/{localWorkOrderId}/refresh`

- [ ] Run targeted backend tests

```powershell
cd IRIS-BACK
.\mvnw.cmd -pl iris-back-app -am "-Dtest=ProjectServiceTests,ProjectControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Expected: pass.

- [ ] Commit

```powershell
git -C IRIS-BACK add iris-back-business/src/main/java/com/iris/back/business/project iris-back-app/src/test/java/com/iris/back/business/ProjectServiceTests.java iris-back-app/src/test/java/com/iris/back/business/ProjectControllerTests.java
git -C IRIS-BACK commit -m "feat(project): add mock oms work orders"
```

---

### Task 4: Backend IRIS Review, Rectification Generation, Archive Snapshots

**Files:**
- Modify: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/service/ProjectService.java`
- Modify: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/controller/ProjectController.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/project/model/entity/BizProjectRectificationEntity.java`
- Modify: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/ProjectServiceTests.java`
- Modify: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/ProjectControllerTests.java`

- [ ] Write failing review pass test

Test name:

```java
reviewWorkOrderAsPassedRecalculatesTaskAsPassedWhenAllOrdersPassed()
```

- [ ] Write failing review rectification test

Test name:

```java
reviewWorkOrderAsRectificationRequiredCreatesOneRectificationAndLocksReview()
```

Assert:

- work order `irisReviewStatus = rectification_required`
- `reviewLocked = true`
- parent task status becomes `nonconforming`
- exactly one generated rectification record/link exists
- repeated review does not duplicate rectification

- [ ] Implement review service

Rules:

- Only check task assignee can review.
- OMS status must be reviewable.
- `rectification_required` locks review.
- locked review cannot become `passed`.
- parent task status recalculates after review.

- [ ] Implement automatic rectification generation

Use the project module's own `biz_project_rectification` table from Task 1 for first version. This avoids depending on a rectification backend that is not yet implemented while still giving archive checks a concrete source of truth.

Minimum:

- generated code
- title/description from task/work order
- project/task/work-order linkage
- status `pending` or `in_progress`
- archive closure checks treat `approved` as closed

- [ ] Add archive failure test

Test name:

```java
archiveFailsWhenAnyOmsSnapshotFails()
```

- [ ] Add archive success test

Test name:

```java
archiveStoresSnapshotsOnlyAfterGeneratedRectificationsAreApproved()
```

- [ ] Implement archive service

Rules:

- project must be `completed`
- all generated rectifications must be `approved`
- set `archiveStatus = running`
- pull detail/log/attachment snapshots for every work order
- if any snapshot fails: `archiveStatus = failed`, project remains `completed`
- if all succeed: project `archived`, `archiveStatus = archived`

- [ ] Add controller tests for review and archive

Routes:

- `POST /api/v1/projects/{projectId}/tasks/{taskId}/work-orders/{localWorkOrderId}/review`
- `POST /api/v1/projects/{id}/archive`

- [ ] Run targeted backend tests

```powershell
cd IRIS-BACK
.\mvnw.cmd -pl iris-back-app -am "-Dtest=ProjectServiceTests,ProjectControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Expected: pass.

- [ ] Commit

```powershell
git -C IRIS-BACK add iris-back-business/src/main/java/com/iris/back/business/project iris-back-app/src/test/java/com/iris/back/business/ProjectServiceTests.java iris-back-app/src/test/java/com/iris/back/business/ProjectControllerTests.java
git -C IRIS-BACK commit -m "feat(project): review oms work orders and archive"
```

---

### Task 5: Frontend Types, API, And Helpers

**Files:**
- Modify: `IRIS-WEB/src/types/index.ts`
- Modify: `IRIS-WEB/src/api/index.ts`
- Create: `IRIS-WEB/src/features/projects/project-data.ts`
- Create: `IRIS-WEB/src/features/projects/project-data.spec.ts`

- [ ] Write failing helper tests

Test cases:

```ts
it('labels project and task statuses')
it('calculates project progress from passed and nonconforming tasks')
it('treats nonconforming as red danger state')
it('normalizes work order payloads with local and oms ids')
```

Run:

```powershell
cd IRIS-WEB
npm run test:unit -- src/features/projects/project-data.spec.ts
```

Expected: fail because helper does not exist.

- [ ] Update TypeScript types

Replace:

```ts
export type ProjectStatus = 'preparing' | 'in_progress' | 'closing' | 'completed' | 'archived'
```

with:

```ts
export type ProjectStatus = 'not_started' | 'in_progress' | 'completed' | 'archived'
```

Replace old task status with:

```ts
export type TaskStatus = 'pending' | 'in_progress' | 'passed' | 'nonconforming'
```

Add:

- `ProjectTaskWorkOrder`
- `ProjectAction`
- `ProjectTaskAction`
- `ProjectUpsertPayload`
- `ProjectTaskAssignPayload`
- `ProjectWorkOrderCreatePayload`
- `ProjectWorkOrderCreateResult`
- `ProjectWorkOrderReviewPayload`

- [ ] Update API clients

Project:

- `start(id)`
- `complete(id)`
- `archive(id)`

Task/work order:

- `taskApi.detail(projectId, taskId)`
- `taskApi.assign(projectId, taskIds, assigneeId)`
- `taskApi.workOrders(projectId, taskId)`
- `taskApi.createWorkOrders(projectId, taskId, payload)`
- `taskApi.refreshWorkOrder(projectId, taskId, localWorkOrderId)`
- `taskApi.reviewWorkOrder(projectId, taskId, localWorkOrderId, payload)`

- [ ] Implement helpers

Create status label/type maps and progress function.

- [ ] Run helper tests

```powershell
cd IRIS-WEB
npm run test:unit -- src/features/projects/project-data.spec.ts
```

Expected: pass.

- [ ] Run frontend type check

```powershell
cd IRIS-WEB
npm run type-check
```

Expected: pass. Do not commit Task 5 if global type-check is broken. If project pages still reference old statuses, make the minimal project-page status reference updates in this task or defer status narrowing until Task 6 can be completed in the same verified commit.

- [ ] Commit

```powershell
git -C IRIS-WEB add src/features/projects/project-data.ts src/features/projects/project-data.spec.ts
git -C IRIS-WEB add -p src/types/index.ts
git -C IRIS-WEB add -p src/api/index.ts
git -C IRIS-WEB commit -m "feat(project): add frontend project api types"
```

---

### Task 6: Frontend Project List And Create

**Files:**
- Modify: `IRIS-WEB/src/views/project/list/index.vue`
- Modify: `IRIS-WEB/src/views/project/create/index.vue`
- Create: `IRIS-WEB/src/views/project/project-pages.spec.ts`

- [ ] Write failing page source assertions

Assertions:

- list page uses `projectApi.list`
- list page does not use `mockProjects`
- list page labels `not_started` as `未开始`
- create page uses `projectApi.create`
- create page does not push into `mockProjects`

Run:

```powershell
cd IRIS-WEB
npm run test:unit -- src/views/project/project-pages.spec.ts
```

Expected: fail.

- [ ] Update project list page

Keep layout. Replace local mock filtering with API-backed load:

- `tableData`
- `loading`
- `pagination`
- `handleSearch`
- `handleReset`
- search params: keyword, status, tagId, startDate/endDate if date range is used

- [ ] Update list columns

Show:

- code/name
- source
- time
- tagNames
- taskCount
- progress
- nonconformingCount
- status

- [ ] Update project create page

Keep step layout. Replace mock project creation with `projectApi.create`.

Payload includes:

- name
- source
- planId
- planName
- startDate
- description
- tagIds/tagNames
- checklistIds
- team
- leaderId/leaderName

Do not generate OMS work orders on create.

- [ ] Keep selectors pragmatic

Until personnel/checklist selector APIs are stable in these screens, existing mock personnel/checklist options can remain as selector source. Persist selected IDs/names through the project API.

- [ ] Run project page assertions

```powershell
cd IRIS-WEB
npm run test:unit -- src/views/project/project-pages.spec.ts
```

Expected: pass.

- [ ] Run type check

```powershell
cd IRIS-WEB
npm run type-check
```

Expected: pass. Do not commit Task 6 with known type-check failures. If detail/task pages fail because of shared type changes, apply the minimal compatible edits in Task 6 before committing or combine Tasks 6 and 7 into one verified commit.

- [ ] Commit

```powershell
git -C IRIS-WEB add src/views/project/project-pages.spec.ts
git -C IRIS-WEB add -p src/views/project/list/index.vue
git -C IRIS-WEB add -p src/views/project/create/index.vue
git -C IRIS-WEB commit -m "feat(project): connect list and create pages"
```

---

### Task 7: Frontend Project Detail And Task OMS Review

**Files:**
- Modify: `IRIS-WEB/src/views/project/detail/index.vue`
- Modify: `IRIS-WEB/src/views/project/task/index.vue`
- Modify: `IRIS-WEB/src/views/project/project-pages.spec.ts`

- [ ] Extend source assertions

Assertions:

- detail page uses `projectApi.detail`, `projectApi.start`, `projectApi.complete`, `projectApi.archive`
- detail page contains batch assignment UI/action
- task page uses `taskApi.workOrders`
- task page uses `createWorkOrders`, `refreshWorkOrder`, `reviewWorkOrder`
- task page does not contain old submit/upload/audit/reviewer flow text.
- task page does not use single `workOrderId` as the task model.

- [ ] Update project detail page

Keep tabs and structure. Replace mock detail with `projectApi.detail`.

Actions:

- start project
- complete project
- archive project
- batch assign selected tasks to assignee

Remove:

- auditor/reviewer concepts
- old close wording if inconsistent with `completed`

- [ ] Update task detail page

Keep two-column detail layout. Replace old handling workflow with:

- task information
- work order list
- create OMS work orders dialog
- refresh work order
- review work order as `passed` or `rectification_required`
- show review opinion
- show OMS logs/snapshots where returned

- [ ] Enforce UI state rules

- Only show generate/refresh/review buttons when the task DTO exposes the corresponding allowed action or permission flag.
- Disable review until OMS status is reviewable.
- Show `不符合项` with danger/red styling.

Backend still enforces leader/task-assignee permissions for every mutation; frontend controls are only a UI affordance.

- [ ] Run page assertions

```powershell
cd IRIS-WEB
npm run test:unit -- src/views/project/project-pages.spec.ts
```

Expected: pass.

- [ ] Run frontend type-check

```powershell
cd IRIS-WEB
npm run type-check
```

Expected: pass.

- [ ] Commit

```powershell
git -C IRIS-WEB add -p src/views/project/detail/index.vue
git -C IRIS-WEB add -p src/views/project/task/index.vue
git -C IRIS-WEB add -p src/views/project/project-pages.spec.ts
git -C IRIS-WEB commit -m "feat(project): add oms task review ui"
```

---

### Task 8: Full Verification And Integration Polish

**Files:**
- Modify only files needed to fix verification failures from Tasks 1-7.

- [ ] Run backend targeted tests

```powershell
cd IRIS-BACK
.\mvnw.cmd -pl iris-back-app -am "-Dtest=ProjectServiceTests,ProjectControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test
```

Expected: pass.

- [ ] Run backend app tests if time allows

```powershell
cd IRIS-BACK
.\mvnw.cmd -pl iris-back-app test
```

Expected: pass. If unrelated plan-control worktree changes cause failure, capture exact failure and do not modify unrelated files.

- [ ] Run frontend unit/source tests

```powershell
cd IRIS-WEB
npm run test:unit -- src/features/projects/project-data.spec.ts src/views/project/project-pages.spec.ts
```

Expected: pass.

- [ ] Run frontend type check

```powershell
cd IRIS-WEB
npm run type-check
```

Expected: pass.

- [ ] Run frontend lint

```powershell
cd IRIS-WEB
npm run lint
```

Expected: pass with 0 errors.

- [ ] Run frontend build

```powershell
cd IRIS-WEB
npm run build
```

Expected: pass. Vite chunk warnings are acceptable if build exits 0.

- [ ] Review git status for both repos

```powershell
git -C IRIS-BACK status --short
git -C IRIS-WEB status --short
```

Confirm only intended project-management files are staged/committed. Do not stage unrelated plan-control files.

- [ ] Final commit if verification-only fixes were needed

```powershell
git -C IRIS-BACK add <new project-management backend files only>
git -C IRIS-BACK add -p <shared backend files only if needed>
git -C IRIS-BACK commit -m "fix(project): stabilize project management api"
git -C IRIS-WEB add <new project-management frontend files only>
git -C IRIS-WEB add -p <shared frontend files only if needed>
git -C IRIS-WEB commit -m "fix(project): stabilize project management ui"
```

Only run these commits if there are actual verification fixes.

---

## Execution Notes

- The backend should be implemented first because frontend API behavior depends on DTO shape.
- The first useful vertical slice is: create project from checklists, list/detail project, and see generated check tasks.
- OMS mock can be implemented after the basic project/task slice is stable.
- Frontend should not reintroduce automatic local filtering behavior where a standard-management-like API query should be used.
- Keep page layout consistent with current project pages unless a small layout adjustment is needed to fit the OMS work order list.
