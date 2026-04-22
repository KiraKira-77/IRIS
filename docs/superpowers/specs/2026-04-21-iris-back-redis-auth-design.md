# IRIS-BACK Redis Session Auth Design

**Date:** 2026-04-21  
**Status:** Draft approved for planning  
**Scope:** Replace the current mock token flow in `IRIS-BACK` with Redis-backed session authentication and single-session-per-account enforcement.

## Goal

Build a usable backend authentication baseline for the IRIS platform:
- login returns a real session token backed by Redis
- `/api/v1/auth/me` resolves the current user from Redis session state
- the same account can only keep one active session
- a new login invalidates the old session immediately

## Current State

`IRIS-BACK` currently exposes:
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

The implementation is still a stub:
- login accepts any non-blank account/password
- token is a generated mock string
- token is not persisted or validated
- `/me` returns a fixed default user

This is enough for mock integration but not enough for real authentication or session control.

## Recommended Approach

Use Redis session storage instead of JWT.

Reasons:
- the project already depends on Redis
- session invalidation is required
- single-account single-session is easier with Redis
- online session control, logout, and forced kick-out become straightforward

JWT is not recommended for this stage because invalidating previous sessions and reacting to permission changes would add avoidable complexity.

## Session Model

### Redis Keys

- `iris:auth:token:{token}`: serialized session payload
- `iris:auth:user:{tenantId}:{account}`: current active token for one account

### Session Payload

- `token`
- `userId`
- `tenantId`
- `account`
- `username`
- `roles`
- `loginTime`
- `expireAt`

### TTL

- session TTL: 12 hours
- account index TTL: same as session TTL

## Authentication Flow

### Login

1. Validate account/password.
2. Resolve user from backend user data source.
3. Verify password hash.
4. Read `iris:auth:user:{tenantId}:{account}`.
5. If an old token exists, delete `iris:auth:token:{oldToken}`.
6. Generate a new random access token.
7. Write the session payload to Redis.
8. Write the account-to-token index to Redis.
9. Return token and basic user profile.

Behavior rule:
- a new login always succeeds
- the previous session for the same account is invalidated immediately

### Request Authentication

1. Read `Authorization: Bearer <token>`.
2. Load session from Redis.
3. If missing or expired, return `401`.
4. Bind current user context for controller/service use.

### Current User

`GET /api/v1/auth/me` reads the current authenticated session and returns session-backed user info instead of fixed stub data.

### Logout

1. Read current token.
2. Delete `iris:auth:token:{token}`.
3. Delete the matching account index if it still points to that token.

## Code Boundaries

- `iris-back-auth`: controller, auth service, login/logout/me contract
- `iris-back-framework.security`: token extraction, auth filter, user context
- `iris-back-framework`: Redis session store service
- `iris-back-system`: user lookup and password validation support

## API and Error Rules

- `POST /api/v1/auth/login`: `200` on success, `400/401` on invalid credentials
- `GET /api/v1/auth/me`: `200` with authenticated session, `401` without valid token
- `POST /api/v1/auth/logout`: `200` even if session already gone
- invalidated old token must stop working immediately

## Testing Requirements

Add automated coverage for:
- login creates Redis session
- second login for same account invalidates the first token
- `/me` reads the current user from Redis session
- logout removes session
- invalid token returns `401`
- anonymous login stays allowed

## Non-Goals

Not included in this change:
- refresh token system
- multi-device sessions
- remember-me behavior
- admin session management UI
