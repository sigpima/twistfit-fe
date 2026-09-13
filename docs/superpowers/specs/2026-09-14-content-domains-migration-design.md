# Content Domains Migration (blog, quiz-questions) — Design Spec

Date: 2026-09-14
Status: Approved for planning

## Context

This is Phase 3 of the multi-phase migration off the Next.js-embedded
SQLite backend onto the standalone FastAPI service, continuing Phase 1
(foundation + auth + FAQ) and Phase 2 (team, model-catalog,
capsule-wardrobe). `blog` and `quiz-questions` currently share a single
Next.js module, `frontend/lib/db.ts`, and its wiring in
`frontend/lib/getDb.ts` — they are migrated together in one phase so that
shared file can be trimmed once, cleanly, rather than left half-migrated.

A scoping survey (done during Phase 2 brainstorming) found no domain
depends on blog or quiz-question data at the database level. One
still-Next.js domain, `quiz-attempts` (`app/api/quiz-attempts/route.ts`),
imports only the `Season`/`SEASONS` type and constant from
`lib/db.ts` — a type-only dependency, not a data dependency — so it is
unaffected by moving the tables themselves, as long as `lib/db.ts` keeps
exporting those two names after being trimmed.

The remaining domains after this phase (contact, quiz-attempts, forum,
admin/stats) stay on their already-agreed ordering: Phase 4 (contact +
quiz-attempts) → Phase 5 (forum) → Phase 6 (admin/stats).

## Goals

- Fully migrate `blog` and `quiz-questions` to FastAPI: public read
  endpoints, admin-gated write endpoints, seed data ported verbatim.
- Preserve the public blog detail page's slug-based lookup and the
  existing slug-auto-generation-from-title behavior, including
  uniqueness checking.
- Preserve `quiz_questions`/`quiz_options`'s one-to-many relationship and
  its transactional "replace all options" update behavior.
- Cut the frontend fully over to FastAPI for both domains and delete the
  old Next.js/SQLite implementation — no legacy bridge needed (confirmed
  no other domain reads blog/quiz-question tables; only a type/constant
  import survives in the trimmed `lib/db.ts`).

## Non-goals

- Migrating contact, quiz-attempts, forum, or admin/stats — each is its
  own future phase per the already-agreed ordering.
- Any change to markdown rendering (`lib/markdown.ts`) or reading-time
  estimation (`lib/readingTime.ts`) — both are pure client-side utilities
  operating on the `content` string the API returns; they need no backend
  involvement and are untouched.
- Any change to the auth domain or its legacy cookie bridge.

## Data model

Two new domains under `app/domains/{blog,quiz}/`, following the shape
established in Phase 1/2 (`models.py` / `schemas.py` / `service.py` /
`router.py` / matching `tests/domains/<name>/`).

**`blog_posts`** (from `frontend/lib/db.ts`): `id`, `slug` (unique,
indexed), `title`, `excerpt`, `content` (text, stored and returned as raw
markdown — never rendered server-side), `cover_image_url`, `category`
(string, one of `personal-color`/`styling`/`sustainable`/`beauty`/
`community`, validated in Pydantic — no Postgres native `ENUM`, same
treatment as every other domain's category-like field so far),
`author_name` (nullable), `is_featured` (bool), `published_at` (stored as
the plain date string the admin form submits, unchanged from today),
`created_at`, `updated_at`.

**`quiz_questions`**: `id`, `question_text`, `sort_order` (int).
**`quiz_options`**: `id`, `question_id` (FK → `quiz_questions.id`,
`ON DELETE CASCADE`), `label`, `season` (string, one of
`spring`/`summer`/`autumn`/`winter`), `sort_order` (int, assigned by
position in the submitted list — the frontend never sends it explicitly
for options, matching today's behavior). A question is always read with
its options ordered by `sort_order`.

## API surface

**`blog`** (prefix `/blog`):

```
GET    /blog                — public, list all, ordered by published_at DESC
GET    /blog/slug/{slug}    — public, get one by slug (404 if missing) — the public detail page's lookup key
GET    /blog/{id}           — public, get one by id (404 if missing) — used by the admin edit page to prefill
POST   /blog                — admin-gated, create
PUT    /blog/{id}           — admin-gated, update (404 if missing)
DELETE /blog/{id}           — admin-gated, delete (404 if missing), 204 on success
```

Slug handling lives in the service layer, not in a Pydantic validator,
because it needs a database query: if the submitted `slug` is blank, it
is generated from `title` using the same algorithm as the existing
`frontend/lib/slugify.ts` (Unicode NFD-normalize, strip combining marks,
`đ`/`Đ` → `d`, lowercase, collapse everything outside `a-z0-9` into a
single `-`, trim leading/trailing `-`), ported to Python verbatim. The
resulting slug is checked for uniqueness (excluding the post's own id on
update); a collision raises a `SlugAlreadyTakenError`, which the router
turns into `409` with `{"error": "SLUG_TAKEN"}` — the same shape and
status Phase 1 already established for `EMAIL_TAKEN` on registration.
This is a deliberate departure from the current Next.js behavior (which
returns slug conflicts as a field-level `400` validation error) to keep
one consistent "conflict" contract across the whole API, rather than
carrying forward two different shapes for the same kind of error.

**`quiz-questions`** (prefix `/quiz-questions`):

```
GET    /quiz-questions          — public, list all, ordered by sort_order ASC, each with its options
GET    /quiz-questions/{id}     — public, get one (404 if missing)
POST   /quiz-questions          — admin-gated, create (question + its options, transactional)
PUT    /quiz-questions/{id}     — admin-gated, update (404 if missing) — replaces all options wholesale
DELETE /quiz-questions/{id}     — admin-gated, delete (404 if missing), 204 on success — cascades to options
```

Request/response bodies carry a nested `options` list
(`{label, season}` on input; `{id, label, season, sortOrder}` on output).
Validation: `questionText` non-blank, at least 2 options, each option's
`label` non-blank and `season` one of the four valid values — mirroring
`frontend/app/api/quiz-questions/validate.ts` exactly.

## Frontend integration

Three Server Components currently call `lib/db.ts` directly, in-process,
and switch to `apiFetch`, same pattern as every prior phase:
`app/blog/page.tsx` (list), `app/blog/[slug]/page.tsx` (detail, via the
new `/blog/slug/{slug}` endpoint), `app/personal-color/quiz/page.tsx`
(quiz questions for the personal-color flow).

Admin CRUD pages/components (`BlogPostList`/`BlogPostForm` under
`app/admin/blog/*`, `QuizQuestionList`/`QuizQuestionForm` under
`app/admin/quiz/*`) switch their `fetch('/api/...')` calls to
`apiFetch('/...')`. Their error handling collapses to the same generic
`t('genericError')` / `t('unauthorizedError')` pattern already applied to
every other admin form in Phase 1/2 — no more field-level error parsing.

`frontend/lib/db.ts` is trimmed to just the shared types/constants that
survive: `BlogPost`, `BlogCategory`, `BLOG_CATEGORIES`, `QuizQuestion`,
`QuizOption`, `Season`, `SEASONS` (the last two still imported by
`quiz-attempts`, which is out of scope this phase). All SQLite
functions (`initSchema`, `getBlogPosts`, `createQuizQuestion`, etc.) and
their seed data are deleted. `app/api/blog/*` and
`app/api/quiz-questions/*` (routes, `validate.ts`, and all their tests)
are deleted outright once the frontend cutover is verified — confirmed no
legacy-mirroring concern, unlike auth.

## Testing

Identical strategy to prior phases: backend `pytest` against the real
Postgres test database via `tests/conftest.py`'s `db_session`/`client`
fixtures, `test_service.py` + `test_router.py` per domain (plus a
`test_seed.py` verifying the ported seed data). Frontend Vitest suites for
the affected pages/components updated to assert against the new
`apiFetch`-routed calls, same mechanical diff as every prior phase.

## Error handling

`404` for missing resources, `422` for validation failures (Pydantic
default shape), `401`/`403` from `get_current_user`/`require_admin` for
unauthenticated/non-admin write attempts, and the new `409 SLUG_TAKEN`
for blog slug conflicts (see "API surface" above) — otherwise unchanged
from every prior phase's contract.
