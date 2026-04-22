# IRIS-BACK Redis Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock auth with Redis-backed session auth, single-session-per-account overwrite login, authenticated `/me`, and logout support.

**Architecture:** Keep login/logout/me in `iris-back-auth`, move token parsing and session authentication into `iris-back-framework.security`, and use Redis as the only session store. Use real user lookup from `sys_user`, real role lookup from role bindings, and invalidate the previous session before writing a new session for the same account.

**Tech Stack:** Java 21, Spring Boot 3, Spring Security, Spring Data Redis, MyBatis-Plus, JUnit 5, MockMvc, TestRestTemplate

---

### Task 1: Add Session Model and Redis Store

**Files:**
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/security/AuthSession.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/security/AuthSessionStore.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/security/TokenService.java`
- Test: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/AuthControllerTests.java`

- [ ] **Step 1: Write failing tests for session-backed login**
- [ ] **Step 2: Run auth tests and verify failure is caused by missing Redis session behavior**
- [ ] **Step 3: Implement token generation and Redis session persistence**
- [ ] **Step 4: Re-run auth tests and verify they pass**

### Task 2: Add Real User Lookup and Single-Session Replacement

**Files:**
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/dto/AuthUserView.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/service/AuthUserQueryService.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/mapper/SysUserMapper.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-auth/src/main/java/com/iris/back/auth/service/AuthService.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/AuthControllerTests.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/VersionRuntimeSecurityTests.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/main/resources/db/migration/V2__set_bootstrap_admin_password.sql`

- [ ] **Step 1: Write failing tests for password validation and old-session invalidation**
- [ ] **Step 2: Run the targeted auth tests and verify they fail for the expected reason**
- [ ] **Step 3: Implement DB user lookup, role lookup, bcrypt password verification, and overwrite-login behavior**
- [ ] **Step 4: Re-run targeted auth tests and verify they pass**

### Task 3: Enforce Token Authentication for `/me` and `logout`

**Files:**
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/security/CurrentUserPrincipal.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/security/CurrentUserContext.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/security/TokenAuthenticationFilter.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/security/SecurityConfig.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-auth/src/main/java/com/iris/back/auth/controller/AuthController.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-auth/src/main/java/com/iris/back/auth/service/AuthService.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/AuthControllerTests.java`

- [ ] **Step 1: Write failing tests for authenticated `/me`, logout, and invalid token handling**
- [ ] **Step 2: Run those tests and verify failure is due to missing token-based auth**
- [ ] **Step 3: Implement filter-based token auth, current-user resolution, and logout**
- [ ] **Step 4: Re-run auth tests and verify they pass**

### Task 4: Add Runtime Verification and Full Regression

**Files:**
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/VersionRuntimeSecurityTests.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/AuthControllerTests.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/VersionControllerTests.java`

- [ ] **Step 1: Add runtime test coverage for anonymous `/api/version` and authenticated auth flows**
- [ ] **Step 2: Run targeted runtime tests**
- [ ] **Step 3: Run full backend regression**

Run:
`D:\workspace2\github\IRIS-ALL\IRIS-BACK\.mvn\apache-maven-3.9.9\bin\mvn.cmd test`

Expected:
- all backend tests pass
- Redis-backed login, `/me`, and logout behavior are covered
- single-session overwrite behavior is verified
