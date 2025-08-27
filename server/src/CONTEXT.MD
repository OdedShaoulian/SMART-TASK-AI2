# Cursor Context — SmartTask AI (In‑App Auth Edition, Azure)

> **Purpose**: Guide Cursor to generate **fully tested, production‑ready** code for SmartTask AI rebuilt **without Clerk**. All auth is first‑party and owned by us. Keep outputs concise, consistent, and shippable.

---

## 1) Project Summary

* Rebuild SmartTask AI using same stack but **in‑app authentication** (email/password). No external IdPs.
* Phase 1: MVP + secure auth + Azure deployment (SWA FE + App Service BE + Azure MySQL).
* Phase 2: Enhancements (AI assist, collaboration, notifications, files, 2FA, PWA).

**Primary Owners**: Oded&#x20;
**Repo**: monorepo with `client/` (React 19 + Vite + TS) and `server/` (Express + TS + Prisma).

---

## 2) Tech Stack & Versions

* **Frontend**: React 19, Vite, TypeScript, React Router Data APIs, Tailwind, React Hook Form, Zod, Axios, Zustand.
* **Backend**: Node LTS, Express, TypeScript, Prisma ORM, Zod, Argon2id, jsonwebtoken, Helmet, cors, express‑rate‑limit.
* **DB**: Azure Database for MySQL (Flexible Server). Prisma migrations.
* **Testing**: Jest + ts‑jest + Supertest (server), Vitest + RTL (client), Playwright (E2E).
* **Azure**: Static Web Apps (FE), App Service Linux (BE), Key Vault (secrets), App Insights (observability).

---

## 3) Repository Layout

```
smarttask-inapp/
  client/
    src/{components,features,routes,store,api,lib}
    index.html, vite.config.ts
  server/
    src/
      app.ts, server.ts
      config/ (env, cors, security)
      middleware/ (errors, auth, rate-limit)
      modules/
        auth/{auth.controller.ts,auth.routes.ts,auth.service.ts,auth.validators.ts,session.repository.ts}
        users/{...}
        tasks/{task.controller.ts,task.routes.ts,task.service.ts,task.validators.ts}
        subtasks/{...}
      utils/{logger.ts, requestId.ts}
      prisma/schema.prisma
    prisma/migrations/
  .github/workflows/{deploy-frontend.yml,deploy-backend.yml}
  README.md
```

---

## 4) Security & Auth (Authoritative Spec)

**Hard Requirements**

* **No external IdP** (no Clerk/Passport/OAuth) in Phase 1.
* **Passwords**: Argon2id hashing. Tune parameters for server; never store raw.
* **Tokens**: Access JWT (TTL 10m, HS512 or RS256), Refresh token (TTL 30d) with **rotation** and **reuse detection**.
* **Cookies**: `HttpOnly`, `Secure`, `SameSite=Strict`. Names: `st_access`, `st_refresh`. Path `/`.
* **CSRF**: double‑submit token `st_csrf` for state‑changing routes (POST/PUT/PATCH/DELETE). Verify header `x-csrf-token`.
* **Sessions**: Persist refresh token **hash** in `Session` table with userAgent, IP, `expiresAt`, `revokedAt`.
* **Rate Limits**: Login and reset endpoints.
* **Headers**: Helmet, HSTS. Strict CORS allow‑list (SWA origin only).
* **Audit**: Log signup, login, logout, refresh, revoke, role change.

**Key Endpoints (v1)**

* `POST /api/v1/auth/signup` {email, password, displayName}
* `POST /api/v1/auth/verify-email` {token}
* `POST /api/v1/auth/login` {email, password}
* `POST /api/v1/auth/refresh`
* `POST /api/v1/auth/logout`
* `POST /api/v1/auth/logout-all`
* `POST /api/v1/auth/forgot` → email
* `POST /api/v1/auth/reset` {token, newPassword}
* `GET  /api/v1/auth/me`

**Roles**: `USER`, `ADMIN` (RBAC checks in middleware).

**Prisma (excerpt)**

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  emailVerified DateTime?
  passwordHash  String
  displayName   String
  role          Role     @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  sessions      Session[]
  tasks         Task[]
}

model Session {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  refreshTokenHash String
  userAgent        String?
  ip               String?
  expiresAt        DateTime
  createdAt        DateTime @default(now())
  revokedAt        DateTime?
}

enum Role { USER ADMIN }
```

---

## 5) Frontend Rules

* Keep access token **in memory** (Zustand). Never persist in localStorage.
* Use Axios interceptors: attach access token; on 401 → call `/auth/refresh`; if server indicates **reuse/compromise** → hard logout and clear state.
* Forms must use React Hook Form + Zod; accessibility first; optimistic UI for tasks.
* ProtectedRoute & role guards using loaders and redirect on unauthorized.

---

## 6) Coding Standards

* TypeScript strict mode everywhere.
* ESLint + Prettier. No `any` unless justified in a code comment.
* All code must have **English comments** explaining intent and security decisions.
* Folder‑by‑feature; thin controllers, fat services; Zod validation per route.
* Errors: consistent error shape `{ error: string, code?: string, details?: unknown }`.

---

## 7) Testing Requirements (must be generated with code)

* **Server**: Jest + Supertest covering happy paths and edge cases for all auth endpoints, tasks CRUD, RBAC.
* **Client**: Vitest + React Testing Library for auth pages, hooks, store.
* **E2E**: Playwright scenario — signup → verify → login → create task → add subtask → logout → login (refresh) → admin action → 403 for non‑admin.
* **Coverage goal**: ≥80% on core auth and task logic.

---

## 8) CI/CD & Azure

* **Frontend** → Azure Static Web Apps (build `/client`, output `dist`). Env: `VITE_API_URL`.
* **Backend** → Azure App Service Linux. Steps: `npm ci`, build, `prisma generate`, `prisma migrate deploy`.
* **Secrets** from **Key Vault** via App Settings references.
* **Smoke tests** post‑deploy: `/healthz`, `/api/v1/auth/me` (unauth 401 expected), then authenticated ping.

**Backend ENV**

```
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_ACCESS_TTL=10m
JWT_REFRESH_SECRET=
JWT_REFRESH_TTL=30d
SMTP_HOST=  SMTP_PORT=  SMTP_USER=  SMTP_PASS=  SMTP_FROM=
APP_BASE_URL=  WEB_BASE_URL=
APP_INSIGHTS_CONNECTION_STRING=
```

**Frontend ENV**

```
VITE_API_URL=
```

---

## 9) What NOT to Do

* Do **not** introduce Clerk/Passport/OAuth or store tokens in localStorage.
* Do **not** return raw refresh tokens in JSON; use cookies.
* Do **not** skip tests or ship placeholders.
* Do **not** expose secrets in client code or logs.

---

## 10) Definition of Done

* Feature includes code, tests, types, docs, and passes CI.
* API contracts validated with Zod; errors are typed and handled.
* Security checks in place (Helmet, CORS, rate limit, CSRF, authz).
* Azure deploys green; migrations applied; smoke tests pass.

---

## 11) Task Templates (prompts Cursor should follow)

### 11.1 Backend Auth Module

"""
Implement production‑ready in‑app auth for Express + Prisma as per Sections 4 and 7.

* Endpoints: signup, verify‑email, login, refresh (rotation + reuse detection), logout, logout‑all, forgot, reset, me.
* Security: Argon2id; JWT access 10m (HS512 or RS256); refresh 30d in HttpOnly+Secure cookie; SameSite=Strict; double‑submit CSRF; rate limit.
* Zod validation; audit logging; Helmet; strict CORS.
* Provide Jest + Supertest tests for success and failure paths.
* Return only **fully tested**, production‑ready code with comments.
  """

### 11.2 Frontend Auth + Guards

"""
Build React auth pages and hooks with Zustand and Axios interceptors, per Sections 5 and 7. Implement ProtectedRoute and role gating. Add RTL + Vitest tests and one Playwright E2E covering the full happy path. Return only **fully tested**, production‑ready code.
"""

### 11.3 CI/CD YAML

"""
Create GitHub Actions for FE→SWA and BE→App Service with caching, prisma migrate deploy, Key Vault references, and smoke tests. Provide environment matrix for staging/prod. Return only **fully tested** YAML.
"""

---

## 12) Clarifications Cursor May Ask (Prefer Once)

* Confirm DB engine (default: MySQL Flexible Server) and connection string.
* Confirm JWT algorithm (default: HS512 for Phase 1; RS256 optional).
* SMTP provider details for email flows.
* Exact CORS origins (SWA hostname + local dev origins).

---

## 13) Acceptance Checks per PR

* ✅ Unit + integration + E2E tests pass and meet coverage.
* ✅ Lint/format pass.
* ✅ DB migrations reviewed.
* ✅ Secrets pulled from Key Vault; no plaintext in code.
* ✅ Azure deploy preview or staging slot validated.

---

*This context is authoritative. Prefer security and testability over shortcuts. If trade‑offs are needed, propose them explicitly in comments within the PR.*
