# Catalog Domains Migration (team, model-catalog, capsule-wardrobe) — Design Spec

Date: 2026-09-14
Status: Approved for planning

## Context

This is Phase 2 of the multi-phase migration off the Next.js-embedded
SQLite backend onto the standalone FastAPI service, continuing the work
started in `2026-09-13-fastapi-backend-foundation-design.md` (Phase 1:
foundation + auth + FAQ). A scoping survey of the 9 remaining domains
(blog, quiz-questions, quiz-attempts, forum, contact, model-catalog,
capsule-wardrobe, team, admin/stats) found that `team`, `model-catalog`,
and `capsule-wardrobe` are structurally the simplest and closest match to
the already-migrated `faq` domain: flat/near-flat schemas, public GET +
admin-gated POST/PUT/DELETE, no cross-domain data dependencies (unlike
`forum`/`quiz-attempts`, which hold real foreign keys into `users`, or
`admin/stats`, which aggregates across several other domains). This spec
covers migrating all three together as one phase, reusing the FastAPI
project structure, auth dependencies, and frontend `apiClient` already
established in Phase 1 without any new architectural decisions.

The remaining 6 domains (blog, quiz-questions, quiz-attempts, forum,
contact, admin/stats) are explicitly out of scope here and will each get
their own follow-up phase, per the agreed ordering:
Phase 3 (blog + quiz-questions) → Phase 4 (contact + quiz-attempts) →
Phase 5 (forum) → Phase 6 (admin/stats).

## Goals

- Fully migrate `team`, `model-catalog`, and `capsule-wardrobe` to FastAPI:
  public read endpoints, admin-gated write endpoints, seed data ported
  verbatim from the existing SQLite seed arrays.
- Cut the frontend fully over to FastAPI for these three domains and
  delete the old Next.js/SQLite implementation, matching exactly what was
  done for `faq` in Phase 1 (no bridge needed — confirmed via the scoping
  survey that no other domain imports from `lib/team.ts`,
  `lib/modelCatalog.ts`, or `lib/capsuleWardrobe.ts`).

## Non-goals

- Migrating blog, quiz-questions, quiz-attempts, forum, contact, or
  admin/stats — each is its own future phase.
- Any change to the auth domain, the legacy `twistfit_session` cookie
  bridge, or the legacy user-record mirroring — both remain exactly as
  Phase 1 left them, still serving the 6 domains not yet migrated.
- Normalizing `capsule_sets.items` into a child table — kept as a Postgres
  `JSONB` column (see "Data model" below).

## Data model

Three new domains under `app/domains/{team,model_catalog,capsule_wardrobe}/`,
each following the exact shape established for `faq` in Phase 1
(`models.py` / `schemas.py` / `service.py` / `router.py` / matching
`tests/domains/<name>/`).

**`team_members`** (from `frontend/lib/team.ts`): `id`, `image` (str),
`name` (str), `role` (str), `bio` (text), `badge_variant` (str, one of
`primary`/`secondary`/`tertiary`), `role_variant` (str, same three
values), `footer_icon` (str), `footer_label` (str), `created_at`,
`updated_at`. Same "string column + Pydantic validation" treatment as
FAQ's `categories`/`highlight_icon` — no Postgres native `ENUM` type, so
adding a new allowed value later never needs an `ALTER TYPE`.

**`catalog_models`** (from `frontend/lib/modelCatalog.ts`): `id`, `name`,
`image`, `dossier_image`, `pose_count` (int), `tagline`, `undertone` (str,
one of `warm`/`cool`/`neutral`), `height` (str), `body_shape` (str),
`waist` (str), `personal_color` (str), `created_at`, `updated_at`.

**`capsule_sets`** (from `frontend/lib/capsuleWardrobe.ts`): `id`,
`image`, `alt`, `tag_variant` (str, one of `primary`/`secondary`/
`tertiary`), `tag_label`, `fit_for`, `title`, `tone`, `description`,
`items` (**`JSONB`**, an array of `{label: string, price: string}`
objects — kept as JSONB rather than a normalized child table since
nothing ever queries into individual items; parity with the existing
`items_json TEXT` column in SQLite, just using Postgres's native JSON
type instead of a manually-serialized string), `created_at`, `updated_at`.

All three mirror FAQ's `CamelModel`-based schema convention: JSON keys
are camelCase, matching the existing frontend `TeamMember`, `CatalogModel`,
and `CapsuleSet` TypeScript types exactly (no frontend type changes
needed beyond removing the SQLite-only functions).

## API surface

Each domain gets the identical 5-endpoint shape FAQ has:

```
GET    /<domain>          — public, list all
GET    /<domain>/{id}     — public, get one (404 if missing)
POST   /<domain>          — admin-gated, create
PUT    /<domain>/{id}     — admin-gated, update (404 if missing)
DELETE /<domain>/{id}     — admin-gated, delete (404 if missing), 204 on success
```

Route prefixes: `/team`, `/model-catalog`, `/capsule-wardrobe` (matching
the existing frontend URL segments, so only the base URL changes on the
frontend, not the path shape).

## Frontend integration

Two call-site patterns need updating per domain, exactly as `faq` was
handled in Phase 1:

- **Public Server Component pages** currently call the SQLite lib module
  directly, in-process: `app/about/page.tsx` (team, via
  `components/about/TeamGrid.tsx`), `app/outfit/step-2/page.tsx` and
  `app/outfit/layout.tsx` (model-catalog), `app/outfit/step-4/page.tsx`
  (capsule-wardrobe). Each switches to `await apiFetch('/<domain>', {
  cache: 'no-store' })`, same pattern as `app/faq/page.tsx`.
- **Admin CRUD pages** (`app/admin/team/*`, `app/admin/model-catalog/*`,
  `app/admin/capsule-wardrobe/*` and their `TeamForm`/`TeamList`,
  `ModelForm`/`ModelList`, `CapsuleForm`/`CapsuleList` components) switch
  their `fetch('/api/<domain>/...')` calls to `apiFetch('/<domain>/...')`,
  same mechanical change as `FaqForm`/`FaqList` in Phase 1.
- Validation error handling on each admin form follows the same
  simplification already applied to `FaqForm`: one generic error message
  on any failed submit, since FastAPI's default 422 shape isn't parsed
  into per-field messages (per Phase 1's spec addendum on error handling).

`lib/team.ts`, `lib/modelCatalog.ts`, `lib/capsuleWardrobe.ts` are trimmed
to just their shared types/constants (`TeamMember`/`ColorVariant`,
`CatalogModel`/`Undertone`, `CapsuleSet`/`CapsuleItem`/`TagVariant`) —
same treatment as `lib/faq.ts` — since `TeamGrid`, model-catalog display
components, and capsule display components still import these types.
`app/api/team/*`, `app/api/model-catalog/*`, `app/api/capsule-wardrobe/*`
(routes, `validate.ts`, and all their tests) are deleted outright once the
frontend cutover is verified — the scoping survey confirmed no other
domain imports from these three lib modules, so (unlike `faq`) there is
no legacy-mirroring concern here at all.

## Testing

Identical strategy to Phase 1: backend `pytest` against the real Postgres
test database via the existing `tests/conftest.py` fixtures (`db_session`,
`client`), one `test_service.py` + `test_router.py` per domain under
`tests/domains/{team,model_catalog,capsule_wardrobe}/`. Frontend Vitest
suites for the affected pages/components updated to assert against the
new `apiFetch`-routed calls, same mechanical diff already applied to the
FAQ tests in Phase 1.

## Error handling

Unchanged from Phase 1's established contract: FastAPI's default 404 for
missing resources, 422 for validation failures (Pydantic's default shape,
no custom envelope), 401/403 from the shared `get_current_user`/
`require_admin` dependencies for unauthenticated/non-admin write attempts.
