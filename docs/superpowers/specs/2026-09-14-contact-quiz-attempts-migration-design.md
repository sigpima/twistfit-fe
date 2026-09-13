# Contact + Quiz-Attempts Migration — Design Spec

Date: 2026-09-14
Status: Approved for planning

## Context

This is Phase 4 of the multi-phase migration off the Next.js-embedded
SQLite backend onto the standalone FastAPI service, continuing Phase 1
(foundation + auth + FAQ), Phase 2 (team, model-catalog,
capsule-wardrobe), and Phase 3 (blog, quiz-questions). `contact` and
`quiz-attempts` are unrelated domains that happen to be grouped into one
phase because they're both small (one or two endpoints each) and because
grouping them lets the same `lib/stats.ts` bridge fix (see below) be done
once instead of twice.

The remaining domains after this phase stay on their already-agreed
ordering: Phase 5 (forum) → Phase 6 (admin/stats — at which point the
legacy bridges accumulated so far, including the one added by this
phase, are finally removed).

## Goals

- Fully migrate `contact` to FastAPI: public create endpoint, admin-gated
  list/read-flag/delete endpoints.
- Fully migrate `quiz-attempts` to FastAPI: a single public create
  endpoint that optionally attributes the attempt to the logged-in user.
- Resolve "who is submitting this quiz attempt" using the new JWT
  access-token cookie instead of the legacy SQLite session bridge —
  the first domain to do this optionally (every prior use of
  `get_current_user` has been mandatory, via `require_admin` or the
  `/auth/me` endpoint).
- Keep `/admin/stats` from crashing or silently going stale, by applying
  the same minimal-legacy-shim pattern used for `blog_posts` in Phase 3
  to `contact_messages` and `quiz_attempts`.
- Cut the frontend fully over to FastAPI for both domains and delete the
  old Next.js routes and their real SQLite-backed implementations.

## Non-goals

- Migrating forum or admin/stats — each is its own future phase.
- Changing the legacy `twistfit_session` cookie bridge or the legacy
  user-record mirroring on registration — forum still depends on both
  until Phase 5.
- Migrating any historical `contact_messages` or `quiz_attempts` rows
  from SQLite into Postgres — consistent with every prior phase, this is
  dev-only data with no production traffic to preserve.
- Pagination or filtering on the admin contact list — the existing
  "fetch everything, newest first" behavior is preserved as-is.

## Data model

Two new domains under `app/domains/{contact,quiz_attempts}/`, following
the established shape (`models.py` / `schemas.py` / `service.py` /
`router.py` / matching `tests/domains/<name>/`). Neither domain has seed
data — both hold real visitor-generated records, never demo data — so
neither gets a `seed.py` or `test_seed.py`, matching the existing
`seedIfEmpty` no-ops in `lib/contact.ts`/`lib/quizAttempts.ts` today.

**`contact_messages`** (from `frontend/lib/contact.ts`): `id`, `name`,
`email`, `phone` (nullable), `subject` (string, one of
`color-test`/`virtual-fitting`/`stylist`/`other`, validated in Pydantic —
same treatment as every other category-like field so far), `message`,
`is_read` (bool, default `false`), `created_at`.

**`quiz_attempts`** (from `frontend/lib/quizAttempts.ts`): `id`, `season`
(string, one of `spring`/`summer`/`autumn`/`winter`), `user_id`
(nullable FK → `users.id`, `ON DELETE SET NULL` — a deliberate
improvement over the current schema's unqualified
`REFERENCES users(id)`, which defaults to `NO ACTION`/`RESTRICT` in
SQLite; there is no user-deletion feature anywhere in the app today, so
this is a safety default rather than a behavior change), `created_at`.

This is a separate domain folder from the existing `quiz` domain (which
owns `quiz_questions`/`quiz_options`) — the two tables are unrelated
other than sharing the word "quiz".

## API surface

**`contact`** (prefix `/contact`):

```
POST   /contact       — public, create (no auth required)
GET    /contact       — admin-gated, list all, ordered by id DESC
PATCH  /contact/{id}  — admin-gated, update is_read (404 if missing)
DELETE /contact/{id}  — admin-gated, delete (404 if missing), 204 on success
```

This is the first domain where the public/admin split is inverted from
every prior domain: the write (`POST`) is public and the reads/other
writes are admin-gated, rather than "public GET, admin-gated writes".

Validation (Pydantic, mirroring `app/api/contact/validate.ts`): `name`
and `message` non-blank (trimmed), `email` validated via Pydantic's
`EmailStr`, `subject` one of the four allowed values, `phone` optional
and nullable.

**`quiz-attempts`** (prefix `/quiz-attempts`):

```
POST   /quiz-attempts — public, create; attributes to the current user if logged in, else null
```

`season` must be one of the four valid values (`422` otherwise). No
`GET`, no admin UI — this mirrors today's app exactly (attempts are
fire-and-forget analytics events with no read-back surface anywhere).

### Optional current-user resolution

A new dependency, `get_current_user_optional`, is added to `app/deps.py`
alongside the existing `get_current_user`/`require_admin`:

```python
def get_current_user_optional(
    access_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> User | None:
    if access_token is None:
        return None
    payload = decode_access_token(access_token)
    if payload is None:
        return None
    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        return None
    return user
```

It never raises — a missing, expired, or otherwise invalid access token
simply resolves to `None`, and the attempt is recorded as anonymous. This
is a deliberate simplification versus the legacy behavior (a 7-day
session cookie): if the 15-minute access token has expired but the
7-day refresh token is still valid, the attempt is attributed as
anonymous rather than triggering a refresh — acceptable because
quiz-attempt attribution is a soft analytics signal, not a
security-sensitive action, and the frontend call is fire-and-forget with
no retry logic.

## The `lib/stats.ts` bridge

`lib/stats.ts` (admin/stats, not yet migrated — planned for Phase 6)
does raw SQL against `contact_messages` and `quiz_attempts` directly in
SQLite. Once both domains move to Postgres and their Next.js
routes/libs are deleted, these SQLite tables would either go stale (if
left as-is) or not exist at all (if `initSchema` calls are removed too),
the latter crashing `getAdminStats`.

Following the pattern established in Phase 3 for `blog_posts`:
`lib/contact.ts` and `lib/quizAttempts.ts` are trimmed down to legacy
shims containing only their `initSchema` functions (tables created,
never written to or seeded). No other file in the frontend imports
`ContactMessage`/`ContactSubject`/`CONTACT_SUBJECTS`/`QuizAttempt` for
anything other than the API-facing components being cut over in this
phase (verified by grep during exploration), so those types are deleted
along with the rest — the implementation plan must re-grep before
deleting each type, per the standing lesson that leftover consumers have
been found late in every prior phase. `lib/getDb.ts` keeps calling
`initContactSchema`/`initQuizAttemptsSchema` but the
`seedContactIfEmpty`/`seedQuizAttemptsIfEmpty` calls and the functions
themselves are deleted, since they were already no-ops. All real CRUD
functions and row types are deleted, along with the `.test.ts` files
that exercise them. `/admin/stats` will report `0` for
`contactMessages` and `quizAttempts` from this phase until Phase 6.

## Frontend integration

`components/home/ContactSection.tsx` and `components/admin/
ContactMessageList.tsx` switch their `fetch('/api/contact...')` calls to
`apiFetch('/contact...')` — a plain swap, no new error-handling UI, same
treatment `FaqList.tsx` and every other admin list component already
got (only admin *forms* got the generic-error-message upgrade in prior
phases; list components did not, and neither of these two components is
a form).

`components/personal-color/QuizFlow.tsx` switches its
`fetch('/api/quiz-attempts', ...)` call to `apiFetch('/quiz-attempts',
...)`. It stays fire-and-forget (`.catch(() => {})`), unchanged in
structure.

`app/api/contact/*` (route, `[id]/route.ts`, `validate.ts`, and all
their `.test.ts`/`validate.test.ts` files) and `app/api/quiz-attempts/*`
are deleted outright once the cutover is verified. Per the lesson from
every prior phase, the implementer must explicitly check for (and
delete) any `lib/contact.test.ts` / `lib/quizAttempts.test.ts` that
exercise the real CRUD functions being removed — plans have
under-anticipated these every time so far.

## Testing

Identical strategy to prior phases: backend `pytest` against the real
Postgres test database via `tests/conftest.py`'s `db_session`/`client`
fixtures, `test_service.py` + `test_router.py` per domain (no
`test_seed.py`, since neither domain seeds data). The `quiz-attempts`
router tests cover all three cases already exercised by
`app/api/quiz-attempts/route.test.ts` today: anonymous attempt,
attempt attributed to a logged-in user (via a valid `access_token`
cookie obtained through `/auth/login` in the test), and an invalid
`season` value. Frontend Vitest suites for the affected components are
updated to assert against the new `apiFetch`-routed calls, same
mechanical diff as every prior phase.

## Error handling

`404` for missing contact messages, `422` for validation failures
(Pydantic default shape), `401`/`403` from `require_admin` for
non-admin access to the contact list/update/delete endpoints — otherwise
unchanged from every prior phase's contract. `quiz-attempts` never
returns `401` — an absent or invalid access token simply results in an
anonymous attempt.
