# Dynamic Wardrobe Taxonomy (Loại quần áo / Dịp / Phong cách) — Design

Date: 2026-09-17

## Goal

Replace the outfit step-1 wardrobe library's dead "Sắp xếp" (Sort)
button with a working "Lọc" (Filter) dropdown over clothing-type
categories (áo/quần/váy/đầm/áo khoác), and make the three taxonomies
that drive wardrobe-item classification — clothing type, occasion, and
style — admin-manageable instead of hardcoded, so the prompt sent to
Gemini when a wardrobe item is uploaded is built dynamically from
whatever groups/values currently exist in the database. Adding a
fourth taxonomy group later (e.g. "Chất liệu") must not require any
backend or frontend code changes — only an admin action.

## Current State (from investigation)

- [WardrobeLibrary.tsx](../../components/outfit/step1/WardrobeLibrary.tsx) lines 71-96 render a "Sắp xếp" dropdown
  that is pure UI stub: one option ("Theo loại áo quần"), no `sortBy`
  state, no comparator, clicking it just closes the menu. It does
  nothing today.
- [gemini_client.py](../../../backend/app/domains/wardrobe/gemini_client.py) builds a module-level `PROMPT` constant at
  import time by f-string-interpolating three hardcoded Python lists
  from [schemas.py](../../../backend/app/domains/wardrobe/schemas.py):
  `CATEGORIES = ["ao-thun", "ao-so-mi", "quan-jean", "dam", "ao-khoac"]`,
  `STYLE_TAGS = ["casual", "minimalist", "street", "formal"]`,
  `OCCASION_TAGS = ["di-lam", "du-tiec", "di-bien", "hang-ngay"]`.
  `POST /wardrobe/items/suggest-tags` calls this and returns
  `{category, styleTags, occasionTags, dominantColors, blobUrl}`.
- `wardrobe_items` ([models.py](../../../backend/app/domains/wardrobe/models.py)) stores these as three separate
  columns: `category: str`, `style_tags: JSONB list[str]`,
  `occasion_tags: JSONB list[str]`. Pydantic validators in
  [schemas.py](../../../backend/app/domains/wardrobe/schemas.py) reject any value not in the hardcoded lists.
- [accessories/gemini_client.py](../../../backend/app/domains/accessories/gemini_client.py) imports `STYLE_TAGS`/`OCCASION_TAGS`
  directly from the wardrobe domain and adds its own `ACCESSORY_CATEGORIES`
  and a `toneTags` field (color season, from `quiz_attempts/schemas.py`'s
  `PARENT_SEASONS` — unrelated to this feature, left untouched).
- No category/tag list anywhere in this codebase (wardrobe, accessories,
  blog, FAQ, forum) is database-backed or admin-editable today — every
  one is a hand-maintained constant duplicated by hand in TypeScript.
  This feature is the first admin-editable taxonomy in the codebase.
- [OccasionStyleSelector.tsx](../../components/outfit/step1/OccasionStyleSelector.tsx) renders the existing occasion/style
  filter toggle above the wardrobe grid, reading `OCCASION_TAGS`/`STYLE_TAGS`
  hardcoded in [OutfitFlowProvider.tsx](../../components/outfit/OutfitFlowProvider.tsx) lines 48-49.

## Scope decisions (from brainstorming)

- The new clothing-type group (áo/quần/váy/đầm/áo khoác) **replaces**
  the old 5-value `CATEGORIES` list entirely; existing wardrobe items
  are migrated, not left on the old vocabulary.
- All three groups (clothing type, occasion, style) become
  admin-manageable in this pass, not just clothing type — building a
  generic "taxonomy group" concept rather than a one-off clothing-type
  admin screen.
- Accessories keeps its own hardcoded `category` list
  (`ACCESSORY_CATEGORIES`, out of scope), but its `style_tags`/
  `occasion_tags` switch to reading the same dynamic `style`/`occasion`
  groups wardrobe uses (they were already logically the same shared
  vocabulary, just imported as Python constants).
- The Filter dropdown is multi-select (checkboxes): any items whose
  clothing-type intersects the checked set are shown; nothing checked
  = show all. This runs alongside the existing occasion/style filter,
  not replacing it.
- **Storage shape**: `wardrobe_items` drops its three fixed columns
  (`category`, `style_tags`, `occasion_tags`) in favor of one generic
  `attributes: JSONB` column, `dict[group_key, list[value_key]]`, e.g.
  `{"clothing-type": ["ao"], "occasion": ["di-lam"], "style": ["casual"]}`.
  This is what makes a future fourth group truly code-free: it
  automatically appears in the Gemini prompt loop and in the item's
  stored data with no schema or endpoint change, at the cost of one
  one-time backfill migration for existing rows.

## Data Model

New domain `backend/app/domains/taxonomy/`, following the existing
domain-per-folder layout (`models.py`, `schemas.py`, `service.py`,
`router.py`).

`taxonomy_groups`:

| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `key` | `String(50)`, unique | slug, e.g. `clothing-type` |
| `label` | `String(100)` | admin-facing name, e.g. "Loại quần áo" |
| `sort_order` | `Integer`, default `0` | display order in admin + prompt |
| `created_at`, `updated_at` | `DateTime(timezone=True)` | |

`taxonomy_values`:

| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `group_id` | FK → `taxonomy_groups.id`, `ondelete="CASCADE"` | |
| `key` | `String(50)` | slug within the group, e.g. `ao` |
| `label` | `String(100)` | e.g. "Áo" |
| `sort_order` | `Integer`, default `0` | |
| `created_at`, `updated_at` | `DateTime(timezone=True)` | |

Unique constraint on (`group_id`, `key`).

Seed data (in the same migration):

- `clothing-type` — Loại quần áo: `ao`("Áo"), `quan`("Quần"),
  `vay`("Váy"), `dam`("Đầm"), `ao-khoac`("Áo khoác")
- `occasion` — Loại dịp: `hang-ngay`, `di-lam`, `du-tiec`, `di-bien`
  (labels unchanged from today's Vietnamese strings)
- `style` — Loại phong cách: `casual`, `minimalist`, `street`, `formal`
  (labels unchanged)

`wardrobe_items` migration: add `attributes JSONB NOT NULL DEFAULT '{}'`,
backfill every existing row from its old `category`/`style_tags`/
`occasion_tags` values using this mapping, then drop the three old
columns:

| Old `category` | New `clothing-type` key |
|---|---|
| `ao-thun` | `ao` |
| `ao-so-mi` | `ao` |
| `quan-jean` | `quan` |
| `dam` | `dam` |
| `ao-khoac` | `ao-khoac` |

Old `style_tags`/`occasion_tags` values map 1:1 by key (unchanged
vocabulary) into `attributes["style"]` / `attributes["occasion"]`.

`accessory_products` (existing table, unaffected by this migration):
`category` column stays as-is; `style_tags`/`occasion_tags` columns
stay as-is too (still real columns, just validated against the dynamic
`style`/`occasion` groups instead of Python constants — accessories is
not moving to the generic `attributes` shape in this pass, since its
category isn't becoming dynamic).

## Backend

**`taxonomy` domain**:
- `service.py`: `list_groups_with_values(db) -> list[TaxonomyGroup]`
  (eager-loads values, ordered by `sort_order`), `get_group_values(db,
  group_key) -> list[str]` (value keys only, used by validation and
  Gemini prompt building), plus CRUD for groups and values.
- `router.py`: `GET /taxonomy` (public, no auth — used by both the
  admin UI and the wardrobe upload form) returns all groups with their
  values. `POST/PUT /taxonomy/groups` (create/rename — no delete, see
  "Out of scope") and `POST/PUT/DELETE /taxonomy/groups/{groupId}/values`,
  all `require_admin`-gated, mirroring [faq/router.py](../../../backend/app/domains/faq/router.py)'s shape.
  Deleting a value that's currently referenced by any `wardrobe_items.attributes`
  (or, for `style`/`occasion`, any `accessory_products.style_tags`/
  `occasion_tags`) is rejected with a Vietnamese error naming the
  in-use count, rather than silently orphaning data.
- Alembic migration creates both tables and seeds the three groups.

**`wardrobe/gemini_client.py` refactor**: `suggest_tags(image_bytes,
db: Session)` gains the `db` parameter. Internally it calls
`taxonomy_service.list_groups_with_values(db)` and builds the prompt
JSON-schema description from *all* groups currently in the database
(not just three named ones) — `{"<group.key>": [<subset of
group.values>], ...}` for every group. The router's `suggest-tags`
handler passes its existing `db` dependency through. Gemini's response
is validated against the same live group/value data: any key or value
Gemini returns that isn't a real current group/value is dropped rather
than causing a 500.

**`wardrobe/schemas.py` / `service.py`**: `WardrobeItemCreate`'s static
field validators (which rejected non-listed categories/tags) are
removed; validation moves to `service.py`'s create/update path, which
checks every `attributes` key against a real taxonomy group key and
every value against that group's current values via
`taxonomy_service.get_group_values`.

**`accessories/gemini_client.py`**: drops the `from
app.domains.wardrobe.schemas import STYLE_TAGS, OCCASION_TAGS` import;
calls `taxonomy_service.get_group_values(db, "style")` /
`get_group_values(db, "occasion")` instead. `ACCESSORY_CATEGORIES`
stays a local hardcoded constant (out of scope for this pass).

## Frontend

**New admin section `/admin/taxonomy`**:
- `app/admin/taxonomy/page.tsx` → `TaxonomyGroupList` component: cards
  listing each group (label, value count), "+ Thêm nhóm mới" button
  (inline create: admin types only the Vietnamese label, e.g. "Chất
  liệu" — `key` is auto-slugified from it via the existing
  [slugify.ts](../../lib/slugify.ts) helper already used for blog post slugs,
  editable before save same as the blog slug field), link into each
  group. Same auto-slug-from-label pattern applies to adding a value
  inside a group.
- `app/admin/taxonomy/[groupId]/page.tsx` → `TaxonomyGroupDetail`:
  editable group label, and an inline-editable table of the group's
  values (add row, edit label, delete, up/down buttons to adjust
  `sort_order`) — one page per group rather than separate new/edit
  routes, since a value is just `{key, label}`.

**`WardrobeLibrary.tsx`**: "Sắp xếp" button and its stub dropdown are
replaced with "Lọc": fetches `/taxonomy` on mount (or reuses a fetch
already made for the upload form's group data, see below), renders
checkboxes for the `clothing-type` group's values, filters
`visibleItems` to items whose `attributes['clothing-type']` intersects
the checked set (empty selection = show all). Runs independently of
the existing `OccasionStyleSelector`-driven filtering.

**`OccasionStyleSelector.tsx` / `OutfitFlowProvider.tsx`**: switch from
the hardcoded `OccasionTag`/`StyleTag` unions to reading `occasion`/
`style` group values from the same `/taxonomy` fetch, so admin edits
here are reflected without a frontend deploy.

**Wardrobe upload result UI**: wherever Gemini's suggested
category/style/occasion tags are shown for review before saving, that
UI iterates generically over whatever groups `/taxonomy` returns
(rendering one picker section per group) instead of three hardcoded
blocks — this is what lets a new admin-created group show up in the
upload flow with no frontend code change.

**Types**: `WardrobeItem`'s `category`/`styleTags`/`occasionTags`
fields become `attributes: Record<string, string[]>`. Every current
reader of the old fields (outfit result/build pages, any admin screen
referencing wardrobe categories) is updated to read from `attributes`
by group key instead.

## Error Handling

- Deleting an in-use taxonomy value: blocked server-side with a count
  of affected items, surfaced as an inline admin form error.
- Gemini returning a group key/value that no longer exists (stale
  model output, or a group deleted between prompt-build and response):
  filtered out silently before the suggestion reaches the frontend —
  never a 500.
- `/taxonomy` fetch failure in the wardrobe upload form or
  `WardrobeLibrary`: shows the existing "list of things is unavailable"
  empty/error state already used elsewhere in the outfit flow, rather
  than crashing the page.
- Migration: single Alembic revision (add column → backfill → drop old
  columns), so a mid-migration failure rolls back cleanly instead of
  leaving the table in a half-migrated shape.

## Testing

- Backend: `taxonomy/service.py` unit tests (CRUD, delete-while-in-use
  rejection, `get_group_values`). `gemini_client.py` tests with a
  seeded test DB session, asserting the built prompt reflects whatever
  groups/values exist (including a case with a 4th ad-hoc group, to
  prove no hardcoding leaked back in) and that stale Gemini output is
  filtered. Router tests for the new `/taxonomy` CRUD endpoints'
  `require_admin` gating. Migration is exercised via Alembic's
  upgrade/downgrade in the existing migration test setup, if one
  exists, or manually verified against a copy of seeded dev data.
- Frontend: `WardrobeLibrary` Filter-dropdown test (checkbox selection
  narrows `visibleItems` correctly, empty selection shows all).
  `TaxonomyGroupList`/`TaxonomyGroupDetail` component tests mirroring
  the existing `FaqList`/`FaqForm` test shape. A smoke test that the
  wardrobe upload review UI renders a picker for an extra, non-built-in
  group name returned by a mocked `/taxonomy` response, proving the
  "no code change for a new group" property end to end.

## Out of Scope

- Accessories' own `category` (túi/giày/...) becoming admin-manageable
  — stays hardcoded this pass.
- Any UI for reordering/renaming groups themselves beyond label edits
  (e.g. no group deletion in v1, to avoid needing to decide what
  happens to items still referencing that group's data — can be added
  later once real usage patterns are clearer).
- Bulk import/export of taxonomy values.
- Migrating the `OutfitFlowProvider` selected-occasion/style *display
  copy* elsewhere in the outfit flow (step 2-4 UI strings) — this spec
  only covers the taxonomy source of truth and the step-1 filter/admin
  surfaces; any other place in the flow that still hardcodes occasion/
  style option lists is a follow-up, not blocking this feature.
