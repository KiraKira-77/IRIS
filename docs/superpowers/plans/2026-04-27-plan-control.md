# Plan Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable backend-backed plan control workflow for listing, creating, editing, submitting, approving, and deleting control plans.

**Architecture:** Mirror the existing checklist module in `IRIS-BACK` with plan entities, DTOs, request records, mappers, service, controller, and Flyway migration. Update `IRIS-WEB` plan screens to use the existing `planApi` instead of direct mock data, preserving mock behavior as fallback where needed.

**Tech Stack:** Spring Boot 3, MyBatis Plus, JUnit 5, Vue 3, Vite, Element Plus, TypeScript.

---

### Task 1: Backend Plan API

**Files:**
- Create: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/PlanControllerTests.java`
- Create: `IRIS-BACK/iris-back-app/src/test/java/com/iris/back/business/PlanServiceTests.java`
- Create: `IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/plan/**`
- Create: `IRIS-BACK/iris-back-app/src/main/resources/db/migration/V8__add_control_plans.sql`
- Modify: `IRIS-BACK/db/init.sql`

- [ ] Write failing controller and service tests for list/create/update/delete/submit/approve.
- [ ] Run targeted backend tests and confirm they fail because plan classes/endpoints do not exist.
- [ ] Implement minimal plan domain classes and schema.
- [ ] Run targeted backend tests and confirm they pass.

### Task 2: Frontend API Integration

**Files:**
- Modify: `IRIS-WEB/src/types/index.ts`
- Modify: `IRIS-WEB/src/api/index.ts`
- Modify: `IRIS-WEB/src/views/plan/list/index.vue`
- Modify: `IRIS-WEB/src/views/plan/create/index.vue`
- Modify: `IRIS-WEB/src/views/plan/detail/index.vue`
- Modify: `IRIS-WEB/src/views/plan/overview/index.vue`
- Test: existing `npm run type-check`, `npm run build`

- [ ] Add payload types for plan upsert.
- [ ] Replace direct plan mock mutations with `planApi`.
- [ ] Keep active checklist/personnel mocks for selector labels until their backend data contracts are already available in these screens.
- [ ] Run frontend type-check and build.

### Task 3: Verification

- [ ] Run `cd IRIS-BACK; .\mvnw.cmd -pl iris-back-app test`.
- [ ] Run `cd IRIS-WEB; npm run type-check`.
- [ ] Run `cd IRIS-WEB; npm run build`.
- [ ] Summarize changed files, remaining risks, and any tests that could not be run.
