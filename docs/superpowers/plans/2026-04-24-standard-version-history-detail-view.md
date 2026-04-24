# Standard Version History Detail View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit "查看详情" action in standard version history that switches the drawer's main detail area to the selected historical version without triggering rollback or mutation flows.

**Architecture:** Keep the change frontend-only and scoped to the standard management page. Extract a tiny pure helper for selecting the viewed version and deriving button state so the behavior can be covered with Vitest in the existing node test environment, then wire that helper into the version history timeline UI.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vitest

---

### Task 1: Add Version History Detail Switching

**Files:**
- Create: `src/features/standards/standard-version-history.ts`
- Create: `src/features/standards/standard-version-history.spec.ts`
- Modify: `src/views/resource/standards/index.vue`

- [ ] **Step 1: Write the failing test**

Add a Vitest spec that expects:
- selecting a version id returns that historical version as the viewed detail record
- the current viewed version disables the action and changes the label to `当前查看中`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/standards/standard-version-history.spec.ts`
Expected: FAIL because the helper module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create a small helper module that:
- resolves the selected version from the version history array
- derives the action label/disabled state from the current `detailRow`

Then update the standard version history timeline to:
- render an explicit button for each version
- switch `detailRow` to the selected version on click
- keep the current viewed version disabled

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- src/features/standards/standard-version-history.spec.ts`
Expected: PASS

- [ ] **Step 5: Run full verification**

Run:
- `npm run type-check`
- `npm run lint`
- `npm run build`

Expected: all commands exit successfully.
