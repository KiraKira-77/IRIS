# Standard Real Backend Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real end-to-end permission sample for IRIS where role menus, resource-scope configuration, and standard management all run against the backend and the standards page reflects real data-permission behavior.

**Architecture:** Keep menu permissions in `iris-back-system`, keep resource-scope configuration in `iris-back-system`, and add a minimal standard-management business module in `iris-back-business`. Then replace the frontend standard-management mock state with real API reads and writes while preserving the existing pure permission helpers as the page-facing policy layer.

**Tech Stack:** Spring Boot 3, MyBatis-Plus, JUnit 5, Vue 3, Pinia, TypeScript, Element Plus

---

### Task 1: Stabilize role-menu and resource-scope backend behavior

**Files:**
- Modify: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/system/RoleServiceTests.java`
- Modify: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/system/ResourceScopeServiceTests.java`
- Modify: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/system/SystemControllerTests.java`
- Modify: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/service/RoleService.java`
- Modify: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/service/ResourceScopeService.java`
- Modify: `IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/service/AuthUserQueryService.java`
- Modify: `IRIS-BACK/iris-back-auth/src/main/java/com/iris/back/auth/service/AuthService.java`
- Modify: `IRIS-BACK/db/seed.sql`

- [ ] **Step 1: Write the failing tests**

Cover:
- `RoleService.create` returns saved `menuCodes`
- controller role create response includes menu codes
- resource-scope member replace test uses correct matcher/captor setup
- current-user/menu-resolution path has enough seeded role-menu data for later frontend use

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run: `cd IRIS-BACK; .\mvnw.cmd -pl iris-back-app -am "-Dtest=RoleServiceTests,ResourceScopeServiceTests,SystemControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test`

Expected:
- `SystemControllerTests.createRoleReturnsCreatedPayload` fails on missing `menuCodes`
- `ResourceScopeServiceTests.replaceMembersRewritesScopeMembersWithPermissionFlags` fails due to matcher misuse or equivalent red-state failure

- [ ] **Step 3: Write the minimal implementation**

Implement:
- role create/update path returns persisted role menus instead of an empty list
- test-safe role-menu lookup behavior in `RoleService`
- resource-scope member replace test/setup aligned with the actual mapper signature
- auth/current-user query path still exposes real roles for menu resolution
- seed data remains consistent with `resource.scopes`, `resource.standards`, and `system.roles`

- [ ] **Step 4: Run the targeted backend tests to verify they pass**

Run: `cd IRIS-BACK; .\mvnw.cmd -pl iris-back-app -am "-Dtest=RoleServiceTests,ResourceScopeServiceTests,SystemControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test`

Expected: PASS

### Task 2: Add backend persistence for real standards

**Files:**
- Modify: `IRIS-BACK/db/init.sql`
- Modify: `IRIS-BACK/db/seed.sql`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/standard/model/entity/BizStandardEntity.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/standard/mapper/BizStandardMapper.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/standard/model/dto/StandardDto.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/standard/model/request/StandardUpsertRequest.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/standard/model/request/StandardListQuery.java`

- [ ] **Step 1: Write the failing backend tests**

Add tests that reference:
- the new standard entity and mapper
- seeded standard rows with `visibilityLevel`, `ownerScopeId`, and `sharedScopeIds`
- list/detail DTO fields matching the frontend `Standard` shape

- [ ] **Step 2: Run the targeted standard tests to verify they fail**

Run: `cd IRIS-BACK; .\mvnw.cmd -pl iris-back-app -am "-Dtest=StandardServiceTests,StandardControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test`

Expected: FAIL because the standard persistence layer does not exist yet

- [ ] **Step 3: Write the minimal persistence implementation**

Add:
- `biz_standard` table with minimal version and permission fields
- seed standards owned by finance, IT, and compliance scopes
- simple `shared_scope_ids` string storage for this iteration
- DTO/request classes aligned with the current frontend standard page

- [ ] **Step 4: Run the targeted standard tests to verify they pass**

Run: `cd IRIS-BACK; .\mvnw.cmd -pl iris-back-app -am "-Dtest=StandardServiceTests,StandardControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test`

Expected: standard persistence tests move past missing-class failures and pass

### Task 3: Implement backend standard service and APIs

**Files:**
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/standard/service/StandardService.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/standard/controller/StandardController.java`
- Modify: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/package-info.java`
- Modify: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/system/SystemControllerTests.java`
- Create: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/StandardServiceTests.java`
- Create: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/StandardControllerTests.java`

- [ ] **Step 1: Write the failing tests**

Cover:
- list returns seeded standards with permission fields
- detail returns one standard by id
- create persists `visibilityLevel`, `ownerScopeId`, and `sharedScopeIds`
- update rewrites the same fields
- delete removes a standard record from list/detail responses

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run: `cd IRIS-BACK; .\mvnw.cmd -pl iris-back-app -am "-Dtest=StandardServiceTests,StandardControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test`

Expected: FAIL because service and controller behavior does not exist yet

- [ ] **Step 3: Write the minimal implementation**

Implement:
- `/api/v1/standards` list/detail/create/update/delete endpoints
- request validation for `ownerScopeId`
- `shared_scope_ids` normalization and filtering
- service-level not-found errors for missing standards
- mapper/service conversion to frontend-friendly DTO fields

- [ ] **Step 4: Run the targeted backend tests to verify they pass**

Run: `cd IRIS-BACK; .\mvnw.cmd -pl iris-back-app -am "-Dtest=StandardServiceTests,StandardControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test`

Expected: PASS

### Task 4: Make menu resolution and frontend API contracts fully backend-driven

**Files:**
- Modify: `IRIS-WEB/src/types/index.ts`
- Modify: `IRIS-WEB/src/api/index.ts`
- Modify: `IRIS-WEB/src/api/resource-scope.ts`
- Modify: `IRIS-WEB/src/stores/modules/user.ts`
- Modify: `IRIS-WEB/src/features/permissions/menu-access.ts`
- Modify: `IRIS-WEB/src/features/permissions/menu-access.spec.ts`
- Modify: `IRIS-WEB/src/features/permissions/resource-scope-adapter.ts`
- Modify: `IRIS-WEB/src/features/permissions/resource-scope-adapter.spec.ts`
- Create: `IRIS-WEB/src/api/standard.ts`

- [ ] **Step 1: Write the failing frontend tests**

Add assertions for:
- menu-code resolution preferring backend role menus over local fallback
- standard API response mapping for real `visibilityLevel`, `ownerScopeId`, and shared scopes
- resource-scope adapters producing page-facing options from real DTOs

- [ ] **Step 2: Run the targeted frontend tests to verify they fail**

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/menu-access.spec.ts`

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/resource-scope-adapter.spec.ts`

Expected: FAIL because the current contracts still assume local fallback and mock-shaped standard data

- [ ] **Step 3: Write the minimal frontend contract implementation**

Implement:
- `Standard` types aligned with backend DTOs
- a dedicated `standardApi` module or equivalent real-data wrapper
- user-store menu resolution that treats backend role-menu payloads as primary source
- adapters that map backend scope and standard permission fields to page-facing models

- [ ] **Step 4: Run the targeted frontend tests to verify they pass**

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/menu-access.spec.ts`

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/resource-scope-adapter.spec.ts`

Expected: PASS

### Task 5: Replace the standards page mock workflow with real backend CRUD

**Files:**
- Modify: `IRIS-WEB/src/views/resource/standards/index.vue`
- Modify: `IRIS-WEB/src/mock/index.ts`
- Modify: `IRIS-WEB/src/features/permissions/standard-access.ts`
- Modify: `IRIS-WEB/src/features/permissions/standard-access.spec.ts`
- Modify: `IRIS-WEB/src/router/index.ts`
- Modify: `IRIS-WEB/src/layouts/components/AppSidebar.vue`

- [ ] **Step 1: Write the failing tests**

Add or extend tests so they prove:
- standards page permission helpers work with real standard records
- public standards remain visible without scope membership
- scoped standards require owner/shared scope membership
- create/edit/delete behavior depends on owner-scope actions, not mock local state

- [ ] **Step 2: Run the targeted frontend tests to verify they fail**

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/standard-access.spec.ts`

Expected: FAIL because the page still uses local arrays, `setTimeout`, and mock-only CRUD behavior

- [ ] **Step 3: Write the minimal page implementation**

Implement:
- standards list loading from real backend data
- create/edit/delete actions through `standardApi`
- form initialization from real scope options only
- refresh-after-save/delete instead of in-memory mutation as source of truth
- graceful loading and error states when standards or scopes fail to load
- continued use of pure permission helpers to compute visible rows and actions

- [ ] **Step 4: Run the targeted frontend tests to verify they pass**

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/standard-access.spec.ts`

Expected: PASS

### Task 6: Run full verification for the real-data permission sample

**Files:**
- No code changes expected

- [ ] **Step 1: Run backend targeted tests**

Run: `cd IRIS-BACK; .\mvnw.cmd -pl iris-back-app -am "-Dtest=RoleServiceTests,ResourceScopeServiceTests,SystemControllerTests,StandardServiceTests,StandardControllerTests" "-Dsurefire.failIfNoSpecifiedTests=false" test`

Expected: PASS

- [ ] **Step 2: Run frontend permission and contract assertions**

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/menu-access.spec.ts`

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/resource-scope-adapter.spec.ts`

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/standard-access.spec.ts`

Run: `cd IRIS-WEB; node --experimental-strip-types src/features/permissions/user-access.spec.ts`

Expected: PASS

- [ ] **Step 3: Run frontend type checking**

Run: `cd IRIS-WEB; npm.cmd run type-check`

Expected: PASS

- [ ] **Step 4: Run frontend lint**

Run: `cd IRIS-WEB; npm.cmd run lint`

Expected: PASS

- [ ] **Step 5: Run frontend production build**

Run: `cd IRIS-WEB; npm.cmd run build`

Expected: PASS
