# IRIS Missing Page Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all currently missing or unfinished IRIS business pages so the main navigation and planned detail flows are usable end to end.

**Architecture:** Reuse the existing Vue 3 + Element Plus page patterns, keep data local to mock state, and prefer lightweight interactive business pages over introducing backend dependencies. Add only the routes, mock data, and local interactions needed to make each page function coherently with the current list/detail flow.

**Tech Stack:** Vue 3 SFCs, TypeScript, Vue Router, Element Plus, ECharts, local mock data

---

### Task 1: Add missing route and data scaffolding

**Files:**
- Create: `src/mock/advanced.ts`
- Modify: `src/router/index.ts`
- Modify: `src/layouts/components/AppSidebar.vue`

- [ ] Add mock exports for rules, models, tools, and roles
- [ ] Add routes for resource details, roles, and project close
- [ ] Add sidebar entry for roles if needed by the new route structure

### Task 2: Complete currently mounted unfinished pages

**Files:**
- Modify: `src/views/rectification/create/index.vue`
- Modify: `src/views/smart/analysis/index.vue`
- Modify: `src/views/smart/rules/index.vue`
- Modify: `src/views/smart/models/index.vue`
- Modify: `src/views/smart/tools/index.vue`

- [ ] Replace placeholder content with usable business UIs
- [ ] Keep interactions local and update mock/local state only
- [ ] Preserve existing visual language

### Task 3: Build planned but missing resource detail pages

**Files:**
- Create: `src/views/resource/standards/detail/index.vue`
- Create: `src/views/resource/checklists/detail/index.vue`
- Create: `src/views/resource/archives/detail/index.vue`
- Create: `src/views/resource/roles/index.vue`
- Modify: `src/views/resource/standards/index.vue`
- Modify: `src/views/resource/checklists/index.vue`
- Modify: `src/views/resource/archives/index.vue`

- [ ] Add detail pages for standards, checklists, and archives
- [ ] Add a roles management page
- [ ] Wire existing list pages into the new detail routes

### Task 4: Build project close flow

**Files:**
- Create: `src/views/project/close/index.vue`
- Modify: `src/views/project/detail/index.vue`

- [ ] Add a project close page with summary, archive readiness, and closing actions
- [ ] Change project detail close action to navigate into the close flow

### Task 5: Verify repository health

**Files:**
- Modify: any touched files as needed

- [ ] Run `npm.cmd run type-check`
- [ ] Run `npm.cmd run lint`
- [ ] Run `npm.cmd run build`
- [ ] Fix any verification failures before reporting completion
