# Resource Scope Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first configurable resource-scope management flow so IRIS can manage resource domains, assign scope-member action permissions, and reuse real scope definitions in standard management.

**Architecture:** Add a small `sys_resource_scope` and `sys_resource_scope_member` subsystem in `iris-back-system` following the existing controller/service/mapper/entity pattern. Expose CRUD plus member replace/list APIs, seed a few example scopes and users, then add a Vue management page and wire the standard-management page to fetch real scope metadata instead of relying on hard-coded scope labels.

**Tech Stack:** Spring Boot 3, MyBatis-Plus, JUnit 5, Vue 3, Pinia, TypeScript

---

### Task 1: Add backend persistence for resource scopes

**Files:**
- Modify: `IRIS-BACK/db/init.sql`
- Modify: `IRIS-BACK/db/seed.sql`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/entity/SysResourceScopeEntity.java`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/entity/SysResourceScopeMemberEntity.java`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/mapper/SysResourceScopeMapper.java`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/mapper/SysResourceScopeMemberMapper.java`

- [ ] **Step 1: Write the failing test**

Add controller/service tests that reference the new mappers and endpoints before the classes exist.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd IRIS-BACK && .\mvnw.cmd -Dtest=ResourceScopeServiceTests,SystemControllerTests test`
Expected: FAIL because resource-scope classes and endpoints do not exist yet

- [ ] **Step 3: Write minimal implementation**

Add:
- `sys_resource_scope`
- `sys_resource_scope_member`
- seed scopes for finance, IT, and compliance
- seed a few example users and memberships

- [ ] **Step 4: Run test to verify it passes**

Run: `cd IRIS-BACK && .\mvnw.cmd -Dtest=ResourceScopeServiceTests,SystemControllerTests test`
Expected: scope-related tests move past missing-class failures

### Task 2: Implement backend service and APIs

**Files:**
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/dto/ResourceScopeDto.java`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/dto/ResourceScopeMemberDto.java`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/request/ResourceScopeUpsertRequest.java`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/request/ResourceScopeMemberUpsertRequest.java`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/request/ResourceScopeMemberReplaceRequest.java`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/service/ResourceScopeService.java`
- Create: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/controller/ResourceScopeController.java`
- Modify: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/system/SystemControllerTests.java`
- Create: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/system/ResourceScopeServiceTests.java`

- [ ] **Step 1: Write the failing test**

Cover:
- create scope returns created payload
- list scopes returns seed scopes
- replace members stores a full permission payload
- list members returns member action flags

- [ ] **Step 2: Run test to verify it fails**

Run: `cd IRIS-BACK && .\mvnw.cmd -Dtest=ResourceScopeServiceTests,SystemControllerTests test`
Expected: FAIL because service/controller behavior is not implemented

- [ ] **Step 3: Write minimal implementation**

Implement:
- scope CRUD
- member list
- full member replace API
- mapper query for member details with user basic info

- [ ] **Step 4: Run test to verify it passes**

Run: `cd IRIS-BACK && .\mvnw.cmd -Dtest=ResourceScopeServiceTests,SystemControllerTests test`
Expected: PASS

### Task 3: Add frontend API/types for resource scopes

**Files:**
- Modify: `IRIS-WEB/src/types/index.ts`
- Modify: `IRIS-WEB/src/api/index.ts`
- Create: `IRIS-WEB/src/api/resource-scope.ts`
- Create: `IRIS-WEB/src/features/permissions/resource-scope-adapter.ts`
- Test: `IRIS-WEB/src/features/permissions/resource-scope-adapter.spec.ts`

- [ ] **Step 1: Write the failing test**

Add assertions for:
- backend DTO to frontend scope option mapping
- member permission flags to action arrays

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types src/features/permissions/resource-scope-adapter.spec.ts`
Expected: FAIL because the adapter module does not exist

- [ ] **Step 3: Write minimal implementation**

Add:
- frontend DTOs for resource scopes and members
- API helpers for list/create/update/member replace
- pure adapter helpers for standard page reuse

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types src/features/permissions/resource-scope-adapter.spec.ts`
Expected: PASS

### Task 4: Build the resource scope management page

**Files:**
- Create: `IRIS-WEB/src/views/resource/scopes/index.vue`
- Modify: `IRIS-WEB/src/router/index.ts`
- Modify: `IRIS-WEB/src/layouts/components/AppSidebar.vue`
- Modify: `IRIS-WEB/src/views/resource/standards/index.vue`

- [ ] **Step 1: Write the failing test**

Add or extend pure adapter/permission assertions for:
- scope option labels from API payload
- member-permission toggles becoming action arrays
- standards page consuming fetched scope labels instead of hard-coded-only labels

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types src/features/permissions/resource-scope-adapter.spec.ts`
Expected: FAIL because the page-facing data-shape helpers are incomplete

- [ ] **Step 3: Write minimal implementation**

Implement:
- `/resource/scopes` page
- create/edit scope dialog
- member-permission configuration dialog
- route/sidebar entry
- standard page scope-option loading from API with fallback to current local defaults

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types src/features/permissions/resource-scope-adapter.spec.ts`
Expected: PASS

### Task 5: Run verification commands

**Files:**
- No code changes expected

- [ ] **Step 1: Run backend targeted tests**

Run: `cd IRIS-BACK && .\mvnw.cmd -Dtest=ResourceScopeServiceTests,SystemControllerTests test`
Expected: PASS

- [ ] **Step 2: Run frontend permission assertions**

Run: `cd IRIS-WEB && node --experimental-strip-types src/features/permissions/standard-access.spec.ts && node --experimental-strip-types src/features/permissions/user-access.spec.ts && node --experimental-strip-types src/features/permissions/resource-scope-adapter.spec.ts`
Expected: PASS

- [ ] **Step 3: Run frontend type checking**

Run: `cd IRIS-WEB && npm.cmd run type-check`
Expected: PASS

- [ ] **Step 4: Run frontend lint commands separately**

Run: `cd IRIS-WEB && npm.cmd run lint:oxlint && npm.cmd run lint:eslint`
Expected: PASS
