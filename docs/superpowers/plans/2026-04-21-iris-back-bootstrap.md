# IRIS-BACK Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the initial `IRIS-BACK` backend scaffold as a platform-first multi-tenant Spring Boot backend that can start locally against MySQL and Redis.

**Architecture:** Create a multi-module Maven project with a single Spring Boot app module and supporting common/framework/auth/system/business modules. Keep the first pass focused on shared infrastructure, auth/system skeletons, and Flyway-managed platform tables rather than implementing business workflows.

**Tech Stack:** Java 21, Spring Boot 3, Maven, Spring Security, MyBatis-Plus, Flyway, MySQL 8, Redis, springdoc-openapi, JUnit 5

---

### Task 1: Create Maven Parent Project and Module Structure

**Files:**
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/pom.xml`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/README.md`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/.gitignore`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/pom.xml`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-common/pom.xml`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/pom.xml`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-system/pom.xml`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-auth/pom.xml`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-business/pom.xml`

- [ ] **Step 1: Write the failing verification command**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml test`
Expected: FAIL because the parent project does not exist yet.

- [ ] **Step 2: Create the parent POM and child module POMs**

Define:
- packaging `pom` in the root project
- module list for all six child modules
- Java 21, Spring Boot BOM, dependency management, plugin management
- per-module artifact ids and dependencies

- [ ] **Step 3: Add repository-level support files**

Create `.gitignore` for `target/`, IDE files, logs, and local overrides.  
Create `README.md` with project overview and module list.

- [ ] **Step 4: Run Maven verification**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml test`
Expected: PASS or no-test success with all modules resolved.

### Task 2: Add Spring Boot App Module and Local Configuration

**Files:**
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/main/java/com/iris/back/IrisBackApplication.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/main/resources/application.yml`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/main/resources/application-local.yml`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/IrisBackApplicationTests.java`

- [ ] **Step 1: Write the failing context-load test**

Create `IrisBackApplicationTests` with a `contextLoads()` test using `@SpringBootTest`.

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml -pl iris-back-app test`
Expected: FAIL because the application class and config do not exist yet.

- [ ] **Step 3: Add the startup class and minimal configuration**

Implement:
- `@SpringBootApplication`
- app name, server port, profile group/defaults
- datasource, redis, flyway, and openapi placeholders
- `iris.deployment-mode=platform`

- [ ] **Step 4: Run the app-module tests**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml -pl iris-back-app test`
Expected: PASS with the Spring context loading.

### Task 3: Add Common and Framework Infrastructure

**Files:**
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-common/src/main/java/com/iris/back/common/model/ApiResponse.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-common/src/main/java/com/iris/back/common/model/PageResponse.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-common/src/main/java/com/iris/back/common/model/BaseEntity.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-common/src/main/java/com/iris/back/common/exception/BusinessException.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/web/GlobalExceptionHandler.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/tenant/TenantContext.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/config/MybatisPlusConfig.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/config/OpenApiConfig.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/config/RedisConfig.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/FrameworkSmokeTests.java`

- [ ] **Step 1: Write the failing smoke test**

Add a Spring Boot test that autowires the global exception handler or one framework bean.

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml -pl iris-back-app test`
Expected: FAIL because framework classes and beans do not exist yet.

- [ ] **Step 3: Implement the shared infrastructure**

Add:
- standard API response models
- base entity with tenant-aware system fields
- business exception type
- controller advice for error responses
- `TenantContext` holder
- MyBatis-Plus interceptor skeleton
- Redis template bean
- OpenAPI metadata bean

- [ ] **Step 4: Run app tests again**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml -pl iris-back-app test`
Expected: PASS.

### Task 4: Add Security and Auth Skeleton

**Files:**
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-auth/src/main/java/com/iris/back/auth/controller/AuthController.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-auth/src/main/java/com/iris/back/auth/model/LoginRequest.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-auth/src/main/java/com/iris/back/auth/model/LoginResponse.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-auth/src/main/java/com/iris/back/auth/service/AuthService.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/security/SecurityConfig.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-framework/src/main/java/com/iris/back/framework/security/TokenService.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/AuthControllerTests.java`

- [ ] **Step 1: Write the failing auth test**

Create a web MVC test or Spring Boot test for `POST /api/v1/auth/login` that expects a successful JSON envelope.

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml -pl iris-back-app test`
Expected: FAIL because auth classes and security config do not exist.

- [ ] **Step 3: Implement minimal auth baseline**

Add:
- stateless security configuration
- permit login and docs endpoints
- stubbed token generation
- login request/response DTOs
- auth service returning a placeholder token and default tenant/user context
- controller endpoints for login and current user

- [ ] **Step 4: Run auth-related tests**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml -pl iris-back-app test`
Expected: PASS.

### Task 5: Add System Module Skeleton and Flyway Baseline

**Files:**
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/entity/SysTenantEntity.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/entity/SysUserEntity.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/entity/SysRoleEntity.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/entity/SysOrgEntity.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-system/src/main/java/com/iris/back/system/model/entity/SysPermissionEntity.java`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/main/resources/db/migration/V1__init_platform_schema.sql`
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-app/src/test/java/com/iris/back/FlywayLocationTests.java`

- [ ] **Step 1: Write the failing migration-location test**

Add a test that checks the migration resource path is resolvable from the application classpath.

- [ ] **Step 2: Run test to verify it fails**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml -pl iris-back-app test`
Expected: FAIL because the migration file and entity classes do not exist.

- [ ] **Step 3: Add the first platform schema baseline**

Implement:
- system entity classes for tenant/user/role/org/permission
- Flyway SQL for `sys_tenant`, `sys_user`, `sys_role`, `sys_user_role`, `sys_org`, `sys_permission`, `sys_role_permission`, `sys_login_log`, and `sys_operation_log`
- indexes and unique constraints that include `tenant_id` where needed

- [ ] **Step 4: Run app tests**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml -pl iris-back-app test`
Expected: PASS.

### Task 6: Add Business Module Placeholder and Startup Documentation

**Files:**
- Create: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/iris-back-business/src/main/java/com/iris/back/business/package-info.java`
- Modify: `D:/workspace2/github/IRIS-ALL/IRIS-BACK/README.md`

- [ ] **Step 1: Write the failing packaging verification**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml package`
Expected: FAIL if module packages or dependencies are incomplete.

- [ ] **Step 2: Add business module package markers and finish README**

Document:
- module responsibilities
- prerequisites: Java 21, Maven, MySQL 8, Redis
- local database creation
- active profile and startup command

- [ ] **Step 3: Run the full project verification**

Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml test`
Run: `mvn -q -f D:\workspace2\github\IRIS-ALL\IRIS-BACK\pom.xml package -DskipTests`
Expected: PASS for both commands.

- [ ] **Step 4: Review the generated tree**

Run: `Get-ChildItem -Recurse D:\workspace2\github\IRIS-ALL\IRIS-BACK`
Expected: Multi-module backend scaffold exists with code, config, and migration files in the expected locations.
