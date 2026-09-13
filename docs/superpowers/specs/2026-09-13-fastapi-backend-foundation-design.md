# FastAPI Backend Foundation + Auth + FAQ Pilot — Design Spec

Date: 2026-09-13
Status: Approved for planning

## Context

TwistFit's frontend (Next.js 16, App Router) currently has all "backend"
logic embedded in the same process: Next.js Route Handlers under
`frontend/app/api/*` call into per-domain modules in `frontend/lib/*.ts`,
which read/write a single `better-sqlite3` file at
`frontend/data/twistfit.db`. Auth is a custom HMAC-SHA256-signed httpOnly
cookie. This covers 12 domains today: auth, blog, quiz-questions,
quiz-attempts, faq, model-catalog, capsule-wardrobe, team, forum, contact,
admin-stats, plus the admin UI gating (`AdminGate`).

A separate `backend/` folder exists with a FastAPI skeleton
(`from fastapi import FastAPI; app = FastAPI()`) created at project
scaffold time and never built out.

This spec formalizes the decision to build out that FastAPI skeleton into
a real, separately-deployed backend service, replacing the Next.js-embedded
backend one domain at a time. Because the full migration spans 12 domains,
this spec covers **only the first phase**: the FastAPI project foundation,
the `auth` domain (a hard dependency for every other domain), and a full
migration of one simple domain (`faq`) as a working pilot that establishes
the pattern. The remaining 10 domains are out of scope here and will each
get their own follow-up plan once this pattern is validated in production
use.

## Goals

- Stand up a FastAPI service, deployed separately from Next.js, backed by
  PostgreSQL.
- Fully migrate authentication (register/login/logout/refresh/me) and
  authorization (`user`/`admin` roles) to the new service.
- Fully migrate the `faq` domain (public read, admin-gated write) as a
  pilot, including deleting its old Next.js implementation once verified.
- Establish a repeatable per-domain pattern (folder layout, testing
  approach, migration steps) that later phases copy for the remaining 10
  domains.

## Non-goals

- Migrating blog, quiz, model-catalog, capsule-wardrobe, team, forum,
  contact, quiz-attempts, or admin-stats. Each becomes its own follow-up
  plan reusing this phase's pattern.
- Preserving existing SQLite data. The current data is seed/dev-only (no
  real end users beyond two seeded demo accounts); Postgres starts from a
  fresh schema with reseeded data. No ETL script.
- Auditing every Next.js page for server-side data-fetching patterns that
  will need to change (see "Server Component cookie forwarding" below) —
  that audit happens during planning/implementation for each domain, not
  in this spec.
- Rate limiting, email verification, password reset flows, OAuth/social
  login — none of these exist today and none are being added now.

## Architecture

Two separately deployed services on the same parent domain:

- `twistfit.vn` — Next.js app (unchanged deployment model).
- `api.twistfit.vn` — new FastAPI service, its own Postgres database.

The frontend calls the API **directly** from the browser
(`fetch('https://api.twistfit.vn/...')`), not through a Next.js proxy.
This is a deliberate trade-off: it requires touching every existing
`fetch('/api/...')` call site as each domain migrates, in exchange for a
truly separated architecture (FastAPI can be scaled/deployed independently,
and any future non-Next.js client — e.g. a mobile app — can call the same
API). CORS and cross-subdomain cookies are configured accordingly (see
Auth).

## FastAPI project structure

```
backend/
  app/
    main.py            # app factory: creates FastAPI(), configures CORS, mounts routers
    core/
      config.py        # Pydantic Settings, reads .env (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, ...)
      security.py       # password hashing (passlib/bcrypt), JWT encode/decode helpers
    db/
      session.py        # SQLAlchemy engine + SessionLocal + get_db dependency
    domains/
      auth/
        models.py       # User, RefreshToken (SQLAlchemy models)
        schemas.py       # Pydantic request/response schemas
        router.py        # /auth/register, /auth/login, /auth/logout, /auth/refresh, /auth/me
        service.py        # business logic (create_user, authenticate, issue_tokens, rotate_refresh_token, ...)
      faq/
        models.py / schemas.py / router.py / service.py
    deps.py             # get_current_user, require_admin (FastAPI Depends, used by every protected router)
  alembic/
    env.py
    versions/
  tests/
    conftest.py          # spins up a Postgres test database/schema, applies Alembic migrations, yields a session
    domains/
      auth/test_router.py, test_service.py
      faq/test_router.py, test_service.py
  requirements.txt
  .env.example
  docker-compose.yml     # services: api (uvicorn), db (postgres) — used for local dev and as the deploy unit
```

Each domain is self-contained (models/schemas/router/service/tests) —
mirroring the existing `frontend/lib/*.ts` one-module-per-domain
convention, ported to Python. Later domains (blog, quiz, forum, ...) each
add one more `domains/<name>/` folder following this same shape; no
shared-layer refactor is expected to be needed.

Tests run against a real Postgres instance (via the `db` service in
docker-compose), not SQLite-in-memory, to avoid dialect drift now that
Postgres-specific behavior (e.g. constraints, types) is in play.

## Auth design

**`users` table** (Postgres): `id`, `name`, `email` (unique), `password_hash`
(passlib bcrypt), `role` (`user` | `admin`), `is_active`, `created_at`.
Seed two demo accounts (`user@twistfit.vn`, `admin@twistfit.vn`) with fresh
bcrypt hashes — the existing Node scrypt hashes are not carried over.

**Access token**: JWT, 15-minute TTL, payload `{sub: user_id, role, exp}`,
signed with `JWT_SECRET` from `.env`. Stored in cookie `access_token`
(httpOnly, Secure).

**Refresh token**: opaque random string, 7-day TTL, **not** a JWT. Only its
hash is stored, in a `refresh_tokens` table (`user_id`, `token_hash`,
`expires_at`, `revoked_at`). Stored in cookie `refresh_token` (httpOnly,
Secure). `POST /auth/refresh` looks up the hash, checks
`revoked_at IS NULL AND expires_at > now()` and that the owning user is
`is_active`, then **rotates**: revokes the current row and issues a new
refresh token + a new access token. This gives centralized revocation
(logout revokes the current refresh token; an admin locking a user can
revoke all of that user's refresh tokens) without a session lookup on
every request.

**Cookie domain**: both cookies use `Domain=.twistfit.vn`, making them
available to both `twistfit.vn` and `api.twistfit.vn` (same registrable
domain). Because this is same-site, `SameSite=Lax` is sufficient —
`SameSite=None` is not needed.

**CORS**: FastAPI allows origin `https://twistfit.vn` (plus
`http://localhost:3000` in dev) with `allow_credentials=True`.

**Dependencies**: `get_current_user` decodes/validates the access token
from the cookie (401 on missing/invalid/expired); `require_admin` builds
on it and checks `role == 'admin'` (403 otherwise). These replace the
current `getAdminSessionFromCookieHeader` helper for every migrated route.

**Accepted trade-off**: locking a user (`is_active = false`) only takes
effect once their current access token expires (≤15 minutes), since
access-token validation is stateless (no DB hit). This is acceptable at
this project's scale; the refresh endpoint always re-checks `is_active`,
so the lock is fully effective within one refresh cycle at most.

## Legacy session cookie bridge (transition period)

The 10 domains explicitly out of scope for this phase (blog, forum, contact,
team, model-catalog, capsule-wardrobe, quiz-questions, quiz-attempts,
admin-stats) each call `getAdminSessionFromCookieHeader` from
`frontend/lib/auth/session.ts` directly to authorize their admin write
routes, keyed on the `twistfit_session` HMAC cookie that only the old
`POST /api/auth/login` route issues. If FastAPI's login fully replaces that
route and only sets the new `access_token`/`refresh_token` cookies, every
one of those 10 still-Next.js-hosted domains loses admin write access the
moment this phase ships, even though this phase never touches their code.

To avoid that, FastAPI's `/auth/login` **also** sets the legacy
`twistfit_session` cookie (same HMAC-SHA256 scheme, same
`AUTH_COOKIE_SECRET` value, ported to Python) alongside the new JWT
cookies, and `/auth/logout` clears all three cookies. This is a deliberate,
temporary bridge: it lets every not-yet-migrated domain keep working
unchanged throughout the multi-phase migration, at the cost of carrying one
legacy code path in FastAPI until the last of the 10 remaining domains is
migrated, at which point the bridge is deleted in that final phase's plan.
`AUTH_COOKIE_SECRET` must therefore be set to the same value in both
`frontend/.env` (already read by the old signing code, still present there
until all 10 domains migrate) and `backend/.env`.

## Legacy user record mirroring (transition period)

Beyond the cookie, `frontend/lib/auth/users.ts`'s SQLite `users` table is a
shared dependency deeper than auth itself: `app/api/forum/posts/route.ts`,
`app/api/forum/posts/[id]/route.ts`, `app/api/forum/posts/mine/route.ts`,
`app/api/forum/posts/[id]/report/route.ts`, and `app/api/quiz-attempts/route.ts`
all call `getUserByEmail(db, session.email)` directly against that table to
resolve the acting user's id/name for attributing posts and quiz attempts.
None of those domains are in scope for this phase, so their code is not
touched — but if new registrations only land in Postgres, any user who
registers after this phase ships would resolve to `null` in that lookup,
breaking forum posting and quiz-attempt tracking for every new user.

Resolution: `frontend/lib/auth/users.ts` and
`app/api/auth/register/route.ts` are **not deleted**. After a successful
`POST {API_BASE_URL}/auth/register` against FastAPI, the frontend also
fire-and-forget calls the existing (unmodified) `POST /api/auth/register`
Next.js route — the same `void fetch(...).catch(() => {})` idiom already
used for quiz-attempt tracking (`components/personal-color/QuizFlow.tsx`)
— to mirror the new user into the local SQLite `users` table under the
same email. The two seeded demo accounts already exist in both stores by
construction (each side seeds them independently), so this only matters
for registrations after cutover. This mirror write is deleted in whichever
future phase finally migrates forum and quiz-attempts off SQLite. Only the
old `app/api/auth/login/*` and `app/api/auth/logout/*` routes are deleted
in this phase, since nothing calls them once `AuthProvider` talks to
FastAPI directly.

## Frontend integration

- New env var `NEXT_PUBLIC_API_BASE_URL=https://api.twistfit.vn`.
- New helper `frontend/lib/apiClient.ts` wrapping `fetch` with
  `credentials: 'include'` and the base URL, so call sites don't repeat
  that boilerplate. Existing `fetch('/api/...')` call sites are updated to
  use it as each domain migrates (this phase: auth + faq call sites only).
- **Server Component cookie forwarding**: any Server Component that
  currently reads data by calling into `lib/*.ts` directly (in-process, no
  HTTP) must switch to an HTTP call to FastAPI. Server-side `fetch` does
  not automatically attach the browser's cookies, so these call sites must
  read the incoming request's cookies via `next/headers`'s `cookies()` and
  manually set a `Cookie` header on the outgoing request. Identifying which
  pages need this is left to the implementation plan for each domain (auth
  and faq for this phase), not enumerated here.
- Old Route Handlers (`app/api/auth/*`, `app/api/faq/*`) are deleted once
  the frontend is verified working end-to-end against FastAPI.

## Deployment

- `backend/docker-compose.yml`: `api` service (uvicorn running the FastAPI
  app) + `db` service (Postgres) + a named volume for Postgres data.
- A reverse proxy (Nginx/Caddy — whichever the existing hosting setup
  uses) routes `api.twistfit.vn` → the `api` container and `twistfit.vn` →
  the existing Next.js deployment. Exact proxy config is an infrastructure
  detail resolved at implementation time, not fixed by this spec.
- `.env.example` added in both `frontend/` (`NEXT_PUBLIC_API_BASE_URL`) and
  `backend/` (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`).

## Testing strategy

- Backend: pytest, one `test_router.py` (HTTP-level, via `TestClient`) and
  one `test_service.py` (business-logic-level) per domain, matching the
  existing repo's strict per-module TDD convention. `conftest.py` provides
  a Postgres-backed test database with Alembic migrations applied before
  the test session runs.
- Frontend: existing Vitest suites for auth/faq call sites are updated to
  mock the new `apiClient` instead of relying on the in-process route
  handler; this follows the existing per-file test convention already used
  throughout `frontend/`.

## Rollout / cutover

1. Build FastAPI foundation (project skeleton, Postgres, Alembic, Docker,
   CORS) with a health-check endpoint — no domain logic yet.
2. Build the `auth` domain fully (register/login/logout/refresh/me),
   with tests, deployed to `api.twistfit.vn` (staging or prod, per
   infra availability).
3. Update Next.js auth call sites (`/login`, `/register`, `AdminGate`,
   any header/session read) to call FastAPI directly; verify manually
   (login, logout, admin gate, token refresh, locked-user behavior).
4. Delete only the old `app/api/auth/login/*` and `app/api/auth/logout/*`
   Route Handlers once step 3 is verified — nothing calls them anymore.
   **`frontend/lib/auth/session.ts`, `frontend/lib/auth/users.ts`, and
   `app/api/auth/register/*` are not deleted**: the 10 not-yet-migrated
   domains still import `getAdminSessionFromCookieHeader`/
   `getSessionFromCookieHeader` from `session.ts` to authorize their own
   admin routes against the legacy `twistfit_session` cookie, and forum/
   quiz-attempts still call `getUserByEmail` against the SQLite `users`
   table (see "Legacy session cookie bridge" and "Legacy user record
   mirroring" above). They get deleted only in the future phase that
   migrates the last of those domains.
5. Build the `faq` domain fully (public list, admin CRUD), with tests.
6. Update the public FAQ page and `admin/faq/*` pages to call FastAPI
   directly; verify manually.
7. Delete `app/api/faq/*` and `frontend/lib/faq.ts` once step 6 is
   verified.
8. Document the established pattern (folder shape, auth dependency usage,
   test setup) so each of the remaining 10 domains can follow it as its
   own future plan.

## Error handling

- FastAPI returns standard HTTP status codes with a consistent JSON error
  body `{"detail": "..."}"` (FastAPI's default), matching what
  `apiClient` expects to parse.
- Validation errors (Pydantic) surface as 422 with field-level detail,
  same as FastAPI's default behavior — no custom error envelope is
  introduced.
- Auth failures: 401 for missing/invalid/expired access token, 403 for
  insufficient role, matching current Next.js behavior (which returns
  401/403 today).
