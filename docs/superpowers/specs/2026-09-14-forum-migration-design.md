# Forum Migration — Design Spec

Date: 2026-09-14
Status: Approved for planning

## Context

This is Phase 5 of the multi-phase migration off the Next.js-embedded
SQLite backend onto the standalone FastAPI service, continuing Phase 1
(foundation + auth + FAQ), Phase 2 (team, model-catalog,
capsule-wardrobe), Phase 3 (blog, quiz-questions), and Phase 4 (contact,
quiz-attempts). `forum` is the most complex remaining domain: it has
ownership-based authorization (not just admin-vs-everyone), a status
state machine enforced server-side, a "silent 404" visibility rule that
hides the existence of non-published posts from strangers, and a reports
sub-resource joined to posts for its list view.

A scoping check during exploration found that `app/api/admin/stats/route.ts`
(not yet migrated — Phase 6) also uses the legacy `getAdminSessionFromCookieHeader`
cookie check, independent of forum. So although forum is the last
Next.js domain using the legacy `twistfit_session` cookie for its own
authorization, that cookie bridge cannot be retired in this phase — it
stays until Phase 6 migrates admin/stats. Likewise, `getUserByEmail` in
`lib/auth/users.ts` loses its only production caller (forum) once this
phase ships, but `lib/auth/users.ts` itself is left untouched: it is
shared auth infrastructure outside forum's ownership, it still backs the
registration mirror and `lib/stats.ts`'s user count, and it has its own
independent test coverage.

The remaining domain after this phase stays on the already-agreed
ordering: Phase 6 (admin/stats — at which point every legacy bridge
accumulated so far, including the one this phase adds, is finally
removed).

## Goals

- Fully migrate `forum` to FastAPI: public reads (published posts only),
  login-gated create/update/delete with ownership checks, admin-gated
  moderation (status transitions) and a reports sub-resource.
- Preserve the status state machine (`pending → published|rejected`,
  `published → hidden`, `rejected`/`hidden` terminal) exactly, enforced
  server-side regardless of caller role.
- Preserve the "silent 404" visibility rule: a non-published post is
  invisible (404, never 403) to anyone but its owner or an admin, and
  the same rule gates who may report a post.
- Preserve that editing a post always resets its status to `pending`,
  even when editing a currently-`published` post.
- Cut all 6 forum-facing frontend components/pages over to `apiFetch`
  without changing their Client Component architecture.

## Non-goals

- Migrating admin/stats — its own future phase (Phase 6).
- Retiring the legacy `twistfit_session` cookie bridge or the legacy
  user-record mirroring on registration — `/api/admin/stats` still
  depends on the cookie, and `lib/stats.ts`'s user count still depends
  on the mirror, until Phase 6.
- Any change to `lib/auth/users.ts` — shared infrastructure outside this
  domain's scope, even though `getUserByEmail` loses its last production
  caller here.
- Converting forum's Client Components to Server Components — out of
  scope for a backend migration; the existing `useEffect`/`fetch`
  architecture is preserved, only the fetch target changes.
- Migrating any existing forum posts/reports from SQLite to Postgres —
  consistent with every prior phase, this is dev-only data.

## Data model

One domain, `app/domains/forum/`, holding both tables (analogous to how
`quiz` holds both `quiz_questions` and `quiz_options` — reports only
make sense joined to their post). No seed data (real user-generated
content only) — no `seed.py`, no `test_seed.py`.

**`forum_posts`**: `id`, `title` (String 255), `body` (Text), `category`
(String 50, one of `general`/`outfit-showcase`/`styling-help`/
`personal-color`/`sustainable-swap`, validated in Pydantic — same
treatment as every other category-like field), `status` (String 20, one
of `pending`/`published`/`rejected`/`hidden`, default `pending`),
`author_id` (FK → `users.id`), `created_at`, `updated_at`.

**`forum_reports`**: `id`, `post_id` (FK → `forum_posts.id`,
`ON DELETE CASCADE`), `reporter_id` (FK → `users.id`), `reason` (Text),
`status` (String 20, one of `open`/`resolved`, default `open`),
`created_at`. A `ForumReport.post` relationship (`relationship(...)`, no
cascade needed on this side) lets the service layer read `post.title`/
`post.status` for the moderation report list, matching the existing
SQL `JOIN` in `lib/forum.ts`.

## API surface

All under prefix `/forum`:

```
GET    /forum/posts                 — public, list published posts, optional ?category= filter
POST   /forum/posts                 — login required; status starts at 'pending', author = current user
GET    /forum/posts/mine            — login required; all of the current user's posts, any status (registered before /{post_id} — same route-ordering precaution as blog's slug route in Phase 3)
GET    /forum/posts/{post_id}       — public route, gated by visibility (see below)
PUT    /forum/posts/{post_id}       — login + ownership required (403 otherwise); resets status to 'pending' unconditionally
PATCH  /forum/posts/{post_id}       — admin-gated; body `{status}`; validated against the allowed-transitions map
DELETE /forum/posts/{post_id}       — login required; owner or admin (403 otherwise); 204 on success
POST   /forum/posts/{post_id}/report — login required; same visibility gate as GET; body `{reason}` non-blank
GET    /forum/moderation/pending    — admin-gated; pending posts, oldest first
GET    /forum/moderation/reports    — admin-gated; open reports, each including the post's title and current status
PATCH  /forum/reports/{report_id}   — admin-gated; marks a report resolved; 404 if missing
```

**Category filter** on the list endpoint is lenient, not strict: an
invalid or missing `category` query parameter is silently treated as
"no filter" (matching `lib/forum.ts`'s current behavior) rather than
raising a `422`.

**Visibility rule** (`GET /forum/posts/{post_id}` and
`POST /forum/posts/{post_id}/report`): a post is visible if
`status == 'published'`, OR the caller is the post's author, OR the
caller is an admin. Anyone else gets `404` — never `403` — so a
stranger cannot distinguish "doesn't exist" from "exists but isn't
theirs to see." The viewer is resolved via the `get_current_user_optional`
dependency added in Phase 4, since these two endpoints have no
authentication requirement of their own but still need to know who's
asking.

**Status transitions** (`PATCH /forum/posts/{post_id}`), enforced
identically regardless of caller (there is no admin override):

```
pending   → published | rejected
published → hidden
rejected  → (none — terminal)
hidden    → (none — terminal)
```

A transition not in this map returns `409 Conflict` with
`HTTPException(detail="INVALID_STATUS_TRANSITION")` — matching the
established conflict-code pattern from `EMAIL_TAKEN` (Phase 1) and
`SLUG_TAKEN` (Phase 3), rather than the old Next.js route's plain `400`.

## Frontend integration

All 6 forum-facing files stay Client Components, unchanged in
architecture — only their `fetch('/api/forum/...')` calls become
`apiFetch('/forum/...')`: `components/forum/ForumPostList.tsx`,
`ForumPostDetail.tsx`, `ForumPostForm.tsx`, `MyForumPostList.tsx`,
`components/admin/ForumModerationQueue.tsx`, `ForumReportQueue.tsx`, and
the `app/forum/**` pages that fetch directly (`[id]/edit/page.tsx`).

`ForumPostForm.tsx` currently parses a per-field `data.errors` object
from a `400` response. Since FastAPI returns Pydantic's uniform `422`
shape instead, this collapses to the same generic pattern already used
by every other migrated form: `401`/`403` → `t('PostForm.unauthorizedError')`,
any other non-2xx → `t('PostForm.genericError')` — both keys already
exist in the translation files, so no i18n changes are needed.

`app/api/forum/**` (all 9 route files, `posts/validate.ts`,
`posts/[id]/validateStatus.ts`, and every `.test.ts`) are deleted once
the cutover is verified.

`lib/forum.ts` is trimmed, not deleted:
- **Shared types/constants**, still consumed by the (unchanged) forum
  components and pages after cutover: `ForumCategory`, `FORUM_CATEGORIES`,
  `ForumPostStatus`, `ForumPost`, `ForumReportStatus`, `ForumReport`.
- **Legacy shim**, kept only for `lib/stats.ts` (admin/stats, not
  migrated until Phase 6) and `lib/stats.test.ts`, which still counts
  `forum_posts` directly against SQLite and calls `createForumPost` to
  build fixture rows for its count assertions: `initSchema` (creates
  both `forum_posts` and `forum_reports`, never seeded) and
  `createForumPost`.
- Everything else (`getPublishedForumPosts`, `getForumPostsByAuthorId`,
  `getForumPostById`, `updateForumPost`, `deleteForumPost`,
  `getPendingForumPosts`, `setForumPostStatus`, `canViewForumPost`,
  `getForumReportById`, `getOpenForumReports`, `createForumReport`,
  `resolveForumReport`, `seedIfEmpty`, and the row-conversion helpers)
  is deleted — no production or test consumer needs them once
  `app/api/forum/**` is gone.

`lib/getDb.ts` keeps calling `initForumSchema(db)` but drops the
`seedForumIfEmpty(db)` call (already a no-op) along with the function
itself.

## Testing

Backend: `pytest` against the real Postgres test database via the
existing `tests/conftest.py` fixtures, with `test_models.py`,
`test_service.py`, and `test_router.py`. The router tests are the most
extensive of any domain so far, covering: public list with/without
category filter, create requires auth, get-by-id visibility for all
four combinations of (post status) × (stranger/owner/admin), `mine`
requires auth and returns all statuses, update requires ownership and
resets status to pending, delete allows owner-or-admin only, every
valid and several invalid status transitions (expecting `409` on
invalid), report creation respects the same visibility gate and
requires a non-blank reason, and the two admin moderation list
endpoints plus report resolution.

Frontend: Vitest suites for all 6 affected components/pages updated to
assert against `apiFetch`-routed calls, same mechanical diff as every
prior phase.

## Error handling

`404` for a post that doesn't exist or isn't visible to the caller
(uniformly, per the visibility rule above); `403` for an authenticated
caller who isn't the owner (or admin, where applicable) on `PUT`/
`DELETE`; `401` for missing authentication on any login-required
endpoint; `422` for Pydantic validation failures (blank title/body,
invalid category, blank report reason); `409 INVALID_STATUS_TRANSITION`
for a disallowed moderation transition — otherwise unchanged from every
prior phase's contract.
