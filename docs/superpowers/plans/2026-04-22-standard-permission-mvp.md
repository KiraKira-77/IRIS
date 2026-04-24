# Standard Permission MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first working permission MVP for standard management where standards can be public-readable for all users but editable only by their owner scope.

**Architecture:** Keep menu permissions unchanged for now and implement the data-permission MVP entirely in `IRIS-WEB`. Introduce a small, pure permission engine for standards, enrich mock standard data with visibility and scope ownership, map current-user roles into a local access context, and make the standards page consume computed action permissions instead of assuming full CRUD.

**Tech Stack:** Vue 3, Pinia, TypeScript, Vitest

---

### Task 1: Define Standard Permission Domain Model

**Files:**
- Modify: `IRIS-WEB/src/types/index.ts`
- Create: `IRIS-WEB/src/features/permissions/standard-access.ts`
- Test: `IRIS-WEB/src/features/permissions/standard-access.spec.ts`

- [ ] **Step 1: Write the failing test**

Add tests covering:
- public standards are visible without scope membership
- public standards are editable only by owner-scope editors
- shared scopes can view but cannot edit by default
- super admin can bypass all checks

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/permissions/standard-access.spec.ts`
Expected: FAIL because the permission module does not exist yet

- [ ] **Step 3: Write minimal implementation**

Add:
- standard visibility fields and scope-action types in `src/types/index.ts`
- a pure permission helper in `src/features/permissions/standard-access.ts`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- src/features/permissions/standard-access.spec.ts`
Expected: PASS

### Task 2: Map Current User Into a Local Access Context

**Files:**
- Modify: `IRIS-WEB/src/types/index.ts`
- Modify: `IRIS-WEB/src/stores/modules/user.ts`
- Test: `IRIS-WEB/src/stores/modules/user-permission.spec.ts`

- [ ] **Step 1: Write the failing test**

Add tests covering:
- platform admin maps to super-admin access
- non-platform roles receive a deterministic local standard scope context
- permission context is exposed from the user store

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/stores/modules/user-permission.spec.ts`
Expected: FAIL because the mapping/context API does not exist yet

- [ ] **Step 3: Write minimal implementation**

Expose:
- a permission/access context on `UserInfo`
- a helper in the user store to build that context from current roles

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- src/stores/modules/user-permission.spec.ts`
Expected: PASS

### Task 3: Enrich Standard Mock Data With Permission Fields

**Files:**
- Modify: `IRIS-WEB/src/mock/index.ts`
- Test: `IRIS-WEB/src/features/permissions/standard-access.spec.ts`

- [ ] **Step 1: Write the failing test**

Extend tests to assert mock-standard-shaped records with:
- `visibilityLevel`
- `ownerScopeId`
- optional shared scopes

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/permissions/standard-access.spec.ts`
Expected: FAIL because existing mock records lack permission fields

- [ ] **Step 3: Write minimal implementation**

Annotate mock standards so the page can demonstrate:
- public readable standards
- scoped-only standards
- owner scope responsibility
- shared-scope visibility

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- src/features/permissions/standard-access.spec.ts`
Expected: PASS

### Task 4: Apply Permission Engine To Standards Page

**Files:**
- Modify: `IRIS-WEB/src/views/resource/standards/index.vue`
- Modify: `IRIS-WEB/src/stores/modules/user.ts`
- Test: `IRIS-WEB/src/features/permissions/standard-access.spec.ts`

- [ ] **Step 1: Write the failing test**

Add or extend permission tests so page-facing helpers can verify:
- list filtering returns only visible standards
- edit/delete/publish actions are hidden or disabled when not allowed
- create requires an editable owner scope

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/permissions/standard-access.spec.ts`
Expected: FAIL because page-facing permission helpers are not implemented

- [ ] **Step 3: Write minimal implementation**

Update the standards page to:
- filter records by visibility
- compute per-row actions from the permission helper
- hide or disable edit/delete/publish/new buttons when forbidden
- show scope/visibility badges so the behavior is understandable in UI

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- src/features/permissions/standard-access.spec.ts`
Expected: PASS

### Task 5: Run Full Frontend Verification

**Files:**
- No code changes expected

- [ ] **Step 1: Run targeted unit tests**

Run: `npm run test:unit -- src/features/permissions/standard-access.spec.ts src/stores/modules/user-permission.spec.ts`
Expected: PASS

- [ ] **Step 2: Run type checking**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: PASS
