# Admin/Stats Migration — Design Spec

Date: 2026-09-14
Status: Approved for planning

## Context

This is Phase 6 — the final phase — of the multi-phase migration off the
Next.js-embedded SQLite backend onto the standalone FastAPI service,
completing Phase 1 (foundation + auth + FAQ), Phase 2 (team,
model-catalog, capsule-wardrobe), Phase 3 (blog, quiz-questions), Phase 4
(contact, quiz-attempts), and Phase 5 (forum). `admin/stats` is the one
remaining Next.js domain, and it is unlike every domain migrated so far:
it owns no table of its own. It is a read-only aggregation across tables
owned by five other domains (`blog`, `forum`, `auth`, `quiz_attempts`,
`contact`) — specifically, it is the reason those domains each kept a
minimal "legacy shim" (`initSchema` + one `create*` function) in their
frontend `lib/*.ts` files after their own migrations, so the shared
SQLite database (`data/twistfit.db`) wouldn't go stale or missing out
from under `lib/stats.ts`'s raw `SELECT COUNT(*)` queries.

Once this phase moves `admin/stats` onto Postgres, nothing in the
running application reads `data/twistfit.db` anymore. That makes this
phase larger than a typical single-domain migration: it also retires the
entire legacy SQLite bridge accumulated across every prior phase — the
four shims, the legacy `twistfit_session` cookie (confirmed during
Phase 5's exploration to have exactly one remaining reader,
`/api/admin/stats`), and the legacy user-record mirroring in
`RegisterForm.tsx` (whose only purpose was keeping the legacy SQLite
`users` table populated for this same stats count).

## Goals

- Fully migrate `admin/stats` to FastAPI: a single admin-gated endpoint
  aggregating counts across `blog_posts`, `forum_posts`, `users`,
  `quiz_attempts`, and `contact_messages` in Postgres.
- Delete the legacy SQLite bridge in its entirety: `lib/getDb.ts`,
  `lib/stats.ts`, `lib/quizAttempts.ts`, `lib/auth/session.ts`,
  `app/api/admin/stats/**`, `app/api/auth/register/**`.
- Trim `lib/db.ts`, `lib/contact.ts`, `lib/forum.ts`, and
  `lib/auth/users.ts` down to only the shared TypeScript
  types/constants still consumed by their respective (already migrated)
  domains' components — removing every remaining SQLite function.
- Remove the legacy user-record mirroring call from `RegisterForm.tsx`.
- Retire the legacy `twistfit_session` cookie bridge on the backend:
  `app/core/security.py`'s `create_legacy_session_cookie_value` and
  related constants, its use in `app/domains/auth/router.py`, the now-fully-unused
  `auth_cookie_secret` setting in `app/core/config.py`, and the
  "Legacy bridge" section of `backend/README.md`.

## Non-goals

- Migrating any historical `data/twistfit.db` rows into Postgres —
  consistent with every prior phase, this is dev-only data with no
  production traffic to preserve, and the SQLite file itself is simply
  abandoned (not deleted from disk — it is gitignored runtime data, not
  a source file).
- Changing anything about `auth`, `blog`, `forum`, `quiz_attempts`, or
  `contact`'s own FastAPI implementations — this phase only reads their
  existing models.
- Removing the `AUTH_COOKIE_SECRET` environment variable from any
  deployed environment (e.g., Azure App Service) — that is outside this
  repo's scope; the setting becomes a harmless unread value once the
  code stops referencing it.

## Data model

None. `admin_stats` is the first domain in this migration with no
`models.py` and no Alembic migration — it owns no table, only a
service that queries other domains' existing models
(`app.domains.blog.models.BlogPost`, `app.domains.forum.models.ForumPost`,
`app.domains.auth.models.User`, `app.domains.quiz_attempts.models.QuizAttempt`,
`app.domains.contact.models.ContactMessage`). This mirrors the kind of
cross-domain reach already used in test helpers throughout this
migration (e.g., promoting a user to admin by querying `auth`'s `User`
model directly from another domain's test file) — just applied in
production code for the first time, because aggregation is inherently
cross-cutting.

## API surface

```
GET /admin/stats — admin-gated, returns the aggregate below
```

Response shape (matching `lib/stats.ts`'s `AdminStats` type exactly):

```json
{
  "blogPosts": { "total": 0, "new30d": 0 },
  "forumPosts": { "total": 0, "new30d": 0 },
  "users": { "total": 0, "new30d": 0 },
  "quizAttempts": { "total": 0, "new30d": 0 },
  "contactMessages": { "total": 0, "unread": 0 }
}
```

Two nested Pydantic schemas cover the two shapes here: `CountStats`
(`total`, `new_30d`) for the four total/new-in-30-days pairs, and
`ContactStats` (`total`, `unread`) for the one total/unread pair.
"New in 30 days" is computed the same way `lib/stats.ts` computed it:
rows with `created_at >= now - 30 days`.

`CountStats.new_30d` needs an explicit `Field(alias="new30d")` —
verified directly against the installed Pydantic version that the
model's `to_camel` alias generator turns `new_30d` into `new30D`
(capital `D`, since `to_camel` capitalizes the first letter after each
underscore, digits included), not `new30d`. Left to the generator, this
would silently break the JSON contract with the frontend's `new30d`
field. The explicit alias overrides the generator for this one field
only; every other field on every schema in this phase keeps relying on
the generator as normal.

## Frontend integration

`components/admin/AdminStatsOverview.tsx` switches its
`fetch('/api/admin/stats')` call to `apiFetch('/admin/stats')`. The
`AdminStats` type — previously imported from `lib/stats.ts` — moves
inline into this component, since it now has exactly one consumer and a
shared lib file is no longer justified once `lib/stats.ts` itself is
deleted.

### Full legacy-retirement scope

Once `admin/stats` stops needing SQLite, nothing reads
`data/twistfit.db` anymore. This phase retires the entire bridge:

**Deleted entirely** (no surviving consumer of any kind):
- `lib/getDb.ts` — its only callers were `lib/stats.ts` and the four
  domain shims' `initSchema`/`create*` calls, all removed by this phase.
- `lib/stats.ts` and `lib/stats.test.ts`.
- `lib/quizAttempts.ts` — unlike the other three shims, no frontend
  component ever needed a shared `QuizAttempt` type after Phase 4's
  cutover, so this file has zero remaining reason to exist.
- `lib/auth/session.ts` and `lib/auth/session.test.ts` — confirmed
  during Phase 5's exploration that `/api/admin/stats/route.ts` was its
  last reader.
- `app/api/admin/stats/route.ts` and its test.
- `app/api/auth/register/route.ts`, `validate.ts`, and both tests — the
  mirror target; nothing calls it once `RegisterForm.tsx` stops mirroring.

**Trimmed to shared types only** (SQLite code removed; the TypeScript
types/constants stay because blog/contact/forum's own already-migrated
components still import them to type `apiFetch` responses):
- `lib/db.ts`: keeps `Season`, `SEASONS`, `BlogCategory`,
  `BLOG_CATEGORIES`, `BlogPost`, `QuizOption`, `QuizQuestion`; drops
  `BlogPostInput`, `BlogPostRow`, `rowToBlogPost`, `initSchema`,
  `getBlogPostById`, `createBlogPost`, and the `better-sqlite3` import.
- `lib/contact.ts`: keeps `ContactSubject`, `ContactMessage`,
  `ContactMessageInput`; drops `ContactMessageRow`, `rowToContactMessage`,
  `initSchema`, `getContactMessageById`, `createContactMessage`, and the
  `better-sqlite3` import.
- `lib/forum.ts`: keeps `ForumCategory`, `FORUM_CATEGORIES`,
  `ForumPostStatus`, `ForumPost`, `ForumPostInput`, `ForumReportStatus`,
  `ForumReport`; drops `ForumPostRow`, `rowToForumPost`, `initSchema`,
  `getForumPostById`, `createForumPost`, and the `better-sqlite3` import.

**Trimmed to one type**:
- `lib/auth/users.ts`: keeps only `export type Role = 'user' | 'admin'`
  (still used by `components/auth/AuthProvider.tsx` to type the
  client-side auth state — a JWT-era concept, unrelated to the SQLite
  table this file used to back). Drops `User`, `CreateUserInput`,
  `UserRow`, `rowToUser`, `initSchema`, `getUserByEmail`, `getUserById`,
  `isEmailTaken`, `createUser`, `verifyUserCredentials`, `seedIfEmpty`,
  and the `better-sqlite3`/password-hashing imports. `lib/auth/users.test.ts`
  is deleted (it exercises exactly the removed functions).

**Component change**: `components/auth/RegisterForm.tsx` removes the
fire-and-forget `fetch('/api/auth/register', ...)` call and its comment
block — nothing needs the legacy `users` table populated anymore.

## Backend: retiring the legacy cookie

`app/core/security.py` drops `LEGACY_SESSION_TTL_SECONDS`,
`LEGACY_SESSION_COOKIE_NAME`, `create_legacy_session_cookie_value`, and
the `_b64url_encode` helper (used only by that function) — along with
the imports that become unused once they're gone (`hmac`, `json`,
`from base64 import urlsafe_b64encode`).

`app/domains/auth/router.py`'s `_set_auth_cookies` stops setting the
`twistfit_session` cookie; `_clear_auth_cookies` stops clearing it
(its `for name in (...)` tuple drops to just `("access_token",
"refresh_token")`).

`app/core/config.py` drops the `auth_cookie_secret` setting — its only
reader was the function just removed.

`backend/README.md`'s "Legacy bridge" section is deleted outright: its
own stated removal condition ("once forum, quiz-attempts, and every
other still-Next.js domain has its own migration phase") is satisfied
as of this phase.

Two existing backend tests are trimmed to match: `test_security.py`
drops `test_legacy_session_cookie_value_matches_node_hmac_scheme` (and
the now-unused `create_legacy_session_cookie_value` import), and
`test_router.py` drops the `assert "twistfit_session" in
response.cookies` line from `test_login_sets_cookies_and_returns_account`.

## Testing

Backend: `pytest` against the real Postgres test database via the
existing fixtures. `test_service.py` builds fixture rows across all five
cross-domain models (a blog post, a forum post, an extra user beyond the
one making the requests, a quiz attempt, a contact message) and asserts
the aggregated counts, including the 30-day window boundary (a row
backdated past 30 days is excluded from `new30d` but still counted in
`total`) and the unread-vs-total distinction for contact messages. No
`test_models.py` — there is no model to test. `test_router.py` covers
`401` (no auth), `403` (non-admin), and `200` with the full shape.

Frontend: `AdminStatsOverview.test.tsx`'s `fetch` assertion is updated to
`apiFetch`. `RegisterForm.test.tsx`'s success-path test currently
branches its mock on `url === '/api/auth/register'` to serve the
mirror call a different response shape than the real `/auth/register`
call — once the mirror call is removed, this collapses to a flat
`mockResolvedValue`, matching every other success-path test in that
file.

## Error handling

Unchanged from every prior phase's contract: `401` for missing
authentication, `403` for an authenticated non-admin, `200` with the
stats payload otherwise. No new error shapes are introduced by this
phase.
