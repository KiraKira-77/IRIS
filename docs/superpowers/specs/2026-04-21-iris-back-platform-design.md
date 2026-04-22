# IRIS-BACK Platform-First Backend Design

**Date:** 2026-04-21  
**Status:** Draft for review

## Goal
Create a new backend project at `D:\workspace2\github\IRIS-ALL\IRIS-BACK` for the IRIS platform using Java and Spring Boot, with a platform-first multi-tenant architecture that can later support dedicated single-tenant deployments without branching the codebase.

## Context
The existing frontend lives in `IRIS-WEB` and is organized by domains such as `plan`, `project`, `rectification`, `resource`, and `dashboard`. It currently proxies `/api` through Vite and uses local token storage with `iris_token`. The backend should become the single API entry for platform management and business modules.

## Recommended Architecture
Use a **modular monolith** packaged as a **multi-module Maven project**.

Why this approach:
- Faster to start than microservices
- Easier to keep business rules consistent in early phases
- Supports clean domain boundaries and future extraction
- Fits platform-first multi-tenant deployment well

Deployment mode:
- Default mode: `platform`
- Reserved future mode: `dedicated`

Both modes keep `tenant_id` in the data model. In `dedicated` mode, the system still runs with a single active tenant and feature flags can disable platform-level management capabilities.

## Tech Stack
- Java 21
- Spring Boot 3.x
- Maven
- Spring Web
- Spring Security
- Spring Validation
- MyBatis-Plus
- Flyway
- MySQL 8
- Redis
- springdoc-openapi
- Lombok

Rationale:
- Spring Boot 3 and Java 21 provide a stable enterprise baseline.
- MyBatis-Plus is preferred over JPA because the system will have many admin lists, filtered queries, and workflow-oriented joins.
- Flyway keeps schema evolution explicit and repeatable.
- Redis covers token/session support, cache, and later idempotency use cases.

## Project Structure
Create a new root project:

```text
IRIS-BACK/
  pom.xml
  README.md
  iris-back-app/
  iris-back-common/
  iris-back-framework/
  iris-back-system/
  iris-back-auth/
  iris-back-business/
```

Module responsibilities:

- `iris-back-app`
  - Spring Boot startup class
  - environment bootstrap
  - top-level configuration import

- `iris-back-common`
  - common DTOs
  - response wrapper
  - exceptions
  - base entity models
  - shared constants and enums

- `iris-back-framework`
  - security configuration
  - tenant context
  - web interceptors/filters
  - MyBatis-Plus setup
  - Redis configuration
  - OpenAPI configuration

- `iris-back-system`
  - tenant management
  - user, role, permission, org management
  - login and operation logs

- `iris-back-auth`
  - login
  - logout
  - current user
  - token parsing and validation

- `iris-back-business`
  - reserved business domains
  - initial package shells for `resource`, `plan`, `project`, `rectification`, `dashboard`

This remains one deployable application while preserving module boundaries in code.

## Package Layout
Base package:

```text
com.iris.back
```

Suggested internal package pattern:

```text
com.iris.back.<module>.<layer>
```

Example:

```text
com.iris.back.system.controller
com.iris.back.system.service
com.iris.back.system.mapper
com.iris.back.system.model
```

For the first version, a pragmatic layered structure is preferred over introducing heavy DDD patterns too early.

## Multi-Tenant Model
The system must support:
- platform operator manages multiple tenants
- each tenant has its own internal organization tree
- later support for dedicated deployment without changing business code

Initial tenant strategy:
- **shared database, shared tables**
- isolate data with `tenant_id`

Rules:
- all business tables include `tenant_id`
- all business queries must default to tenant filtering
- all unique constraints must include `tenant_id` where relevant
- platform administrator and tenant administrator are different roles
- cross-tenant access is forbidden except explicit platform management APIs

Tenant context should be resolved from the authenticated token and made available throughout request handling.

## System Fields Baseline
Use base field groups instead of putting every field on every table.

### Base fields
- `id`
- `tenant_id`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`
- `deleted`
- `version`
- `remark`

### Business fields for main documents
- `biz_no`
- `status`
- `org_id`
- `dept_id`
- `ext_json`

Guidelines:
- master/business document tables use base fields plus selected business fields
- relation tables usually only need base fields
- dictionary/config tables can use a smaller subset if appropriate
- avoid introducing `tenant_id`-less business tables unless they are truly global platform metadata

## Initial Database Scope
The first database baseline should include platform and identity tables:

- `sys_tenant`
- `sys_user`
- `sys_role`
- `sys_user_role`
- `sys_org`
- `sys_permission`
- `sys_role_permission`
- `sys_login_log`
- `sys_operation_log`

First-phase notes:
- use `bigint` primary keys
- use `utf8mb4`
- standardize `created_at` and `updated_at` as `datetime`
- use logical delete via `deleted`
- add optimistic lock column `version` on core tables

Business domain tables are not required in the first migration unless needed for immediate frontend integration.

## Security Baseline
Do not integrate JE yet.

Phase-one auth design:
- backend owns `/api/v1/auth/*`
- login returns backend-issued token
- token carries `user_id`, `tenant_id`, and role-related claims or lookup keys
- current-user endpoint returns user profile, tenant context, roles, and permissions

The frontend can keep the same local token usage pattern, but should eventually call only IRIS-BACK APIs.

## Configuration Baseline
Provide:
- `application.yml`
- `application-local.yml`

Key config areas:
- server port
- datasource
- redis
- flyway
- logging
- deployment mode
- token settings
- swagger/openapi enablement

Add a mode switch such as:

```yaml
iris:
  deployment-mode: platform
```

## Delivery Scope for Initial Scaffold
The first implementation pass should generate:
- Maven multi-module project
- startup module and parent POM
- basic config files
- unified response and exception handling
- tenant context scaffolding
- Spring Security baseline
- MyBatis-Plus and Flyway setup
- initial migration scripts for platform tables
- README with startup steps

The first scaffold does **not** need:
- workflow engine
- external integration with JE
- complex data-permission engine
- full business module implementation

## Implementation Order
1. Create the Maven parent project and module POMs
2. Add the app startup module and shared config
3. Add common/framework support classes
4. Configure datasource, Redis, MyBatis-Plus, Flyway
5. Create the initial Flyway migration for platform tables
6. Add auth and system module skeletons
7. Add README and local startup instructions

## Risks and Controls
- Risk: multi-tenant filtering is missed in ad hoc queries  
  Control: centralize tenant context and query helpers/interceptors early.

- Risk: platform and tenant roles are mixed  
  Control: model them separately in schema and service logic from day one.

- Risk: trying to overbuild phase one  
  Control: keep phase one to foundation, auth baseline, and platform tables.

## Recommendation
Proceed with a **platform-first modular monolith** in a new `IRIS-BACK` directory using the selected Java stack, shared-table multi-tenancy, and a strong system-field baseline. This gives a clean starting point for immediate backend development without locking the project into early microservice complexity.
