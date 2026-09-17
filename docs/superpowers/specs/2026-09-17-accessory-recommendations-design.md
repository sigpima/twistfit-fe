# Accessory Recommendations with Affiliate Links — Design

Date: 2026-09-17

## Goal

After a user completes the AI outfit try-on (Step 4), show a short list
of accessories (bags, shoes, jewelry, ...) curated by an admin, each
linking out to an external affiliate URL. Recommendations must be
relevant to the outfit just generated — matched by occasion, style, and
the user's personal color (tone) — not a random/static list.

Phase 1 (this spec) ships the user-facing recommendation flow end to
end, plus the minimum admin surface needed to populate real data (an
admin can't be asked to use raw SQL). A fuller admin management UI
(edit, bulk actions, analytics) is explicitly deferred — see "Out of
scope".

## Current State (from investigation)

- No accessory/product/affiliate concept exists anywhere in the code
  today. The Step 4 result page ([Step4PageContent.tsx](../../components/outfit/step4/Step4PageContent.tsx),
  [ResultPreview.tsx](../../components/outfit/step4/ResultPreview.tsx)) only renders the generated
  try-on image.
- `app/domains/wardrobe` already does the closest analogous thing: it
  calls Gemini once per item, at creation time, with a prompt listing a
  **fixed** set of candidate `category`/`style_tags`/`occasion_tags`
  classes ([gemini_client.py](../../../backend/app/domains/wardrobe/gemini_client.py)), and lets
  the user review/edit the suggestion before it's persisted. This
  feature reuses that exact pattern rather than inventing a new one.
- `app/domains/capsule_wardrobe` is the existing pattern for a simple
  admin-curated catalog (CRUD router gated by `require_admin`, `CamelModel`
  schemas, JSONB list columns). This feature's CRUD follows the same
  shape.
- `OutfitFlowProvider` ([OutfitFlowProvider.tsx](../../components/outfit/OutfitFlowProvider.tsx)) already
  holds `selectedOccasion: OccasionTag` and `selectedStyle: StyleTag` for
  the current outfit — the same `hang-ngay/di-lam/du-tiec/di-bien` and
  `casual/minimalist/street/formal` vocabularies already defined as
  `OCCASION_TAGS`/`STYLE_TAGS` in `app/domains/wardrobe/schemas.py`.
  The accessory domain reuses those constants (imports them) instead of
  redefining the vocabulary a third time.
- The "tone" signal (spring/summer/autumn/winter) is **not** taken from
  `selectedGarment.tone` — that field is a display-only string on the
  still-mock `DEFAULT_GARMENT` and isn't populated from real wardrobe
  data (`WardrobeItem` has no tone field at all). Instead, the same
  source the try-on flow already uses is reused: the current user's
  latest `QuizAttempt.parent_season` (`app/domains/quiz_attempts/models.py`).
  This also matches `app/domains/tryon/router.py`'s own lookup, whose
  `.season` access was a stale bug just fixed (see commit
  `0eeff96`) — this spec's endpoint is written against the corrected
  field from the start.
- Outfit flow steps are gated behind `OutfitAuthGate`, so Step 4 always
  has an authenticated user — the recommendations endpoint can safely
  require auth and resolve `parent_season` server-side, with no
  frontend involvement in sourcing it.

## Scope decision: matching signals

Three matching signals were requested: occasion, style, and personal
color tone. A fourth ("loại trang phục" / garment category, e.g. "áo dạ
hội → clutch/giày cao gót") is **not** implemented as a separate
signal — it collapses into occasion+style already (a "dạ hội" occasion
implies `du-tiec`+`formal`, which is exactly the tag pair a clutch
would carry). Adding a second garment-type taxonomy just to re-derive
the same signal was rejected as unnecessary.

## Data Model

New domain `app/domains/accessories/`, following `capsule_wardrobe`'s
file layout (`models.py`, `schemas.py`, `service.py`, `router.py`).

`accessory_products` table:

| Column | Type | Notes |
|---|---|---|
| `id` | PK | |
| `name` | `String(255)` | admin-entered |
| `image_url` | `String(1000)` | uploaded via existing Blob Storage flow |
| `affiliate_link` | `String(1000)` | external URL |
| `category` | `String(50)` | one of `ACCESSORY_CATEGORIES` (below) — groups results for diversity, unrelated to garment type |
| `style_tags` | `JSONB` (`list[str]`) | subset of `wardrobe.schemas.STYLE_TAGS` |
| `occasion_tags` | `JSONB` (`list[str]`) | subset of `wardrobe.schemas.OCCASION_TAGS` |
| `tone_tags` | `JSONB` (`list[str]`) | subset of `PARENT_SEASONS` (`spring`/`summer`/`autumn`/`winter`) |
| `is_active` | `Boolean`, default `true` | soft hide without deleting |
| `created_at`, `updated_at` | `DateTime(timezone=True)` | |

`ACCESSORY_CATEGORIES = ["tui-xach", "giay", "trang-suc", "mu-non", "khan"]`
(bag / shoes / jewelry / hat / scarf), defined in
`app/domains/accessories/schemas.py`.

All three tag fields are lists (not single values) because a real
product can suit more than one occasion/style/tone — the same modeling
choice `wardrobe_items` already makes.

## Admin flow: create + Gemini auto-tagging

1. Admin uploads the product image through the **existing** Blob
   Storage upload flow (`POST /accessories/upload-url`, mirroring
   `wardrobe`'s `ensure_container`/`generate_upload_sas_url`, new
   container `"accessories"`).
2. Admin fills `name` and `affiliate_link`, then clicks "Gợi ý tag bằng
   AI". This calls `POST /accessories/suggest-tags {blobPath}`
   (admin-only), which:
   - Downloads the image bytes.
   - Calls Gemini via a new `app/domains/accessories/gemini_client.py`
     — a copy of `wardrobe/gemini_client.py`'s `_call_gemini`/`suggest_tags`
     shape, with its own prompt listing `ACCESSORY_CATEGORIES`,
     `STYLE_TAGS`, `OCCASION_TAGS`, and `PARENT_SEASONS` and asking for
     exactly one `category` plus subsets of the other three.
   - Returns `{category, styleTags, occasionTags, toneTags}` as a
     **draft**, not persisted yet — same "suggest, don't trust
     blindly" shape as wardrobe's `suggest-tags` endpoint.
3. The admin form pre-fills a category `<select>` and three tag chip
   pickers from the suggestion; the admin can edit any of them before
   saving (Gemini's classification isn't assumed perfect — this review
   step is the whole reason the field isn't just auto-saved).
4. Admin clicks Save → `POST /accessories` with the final
   `{name, imageUrl, affiliateLink, category, styleTags, occasionTags,
   toneTags}`, validated the same way `capsule_wardrobe`'s
   `CapsuleSetInput` validates (non-blank strings, values checked
   against the fixed vocab lists), `require_admin`-gated.
5. `GET /accessories` (list), `GET /accessories/{id}`, `PUT
   /accessories/{id}`, `DELETE /accessories/{id}` — CRUD copied
   directly from `capsule_wardrobe/router.py`'s shape: reads are
   public/no-auth, writes are `require_admin`, matching that domain's
   existing convention exactly. (The separate `/accessories/recommendations`
   endpoint below has its own, different auth requirement.)

If the Gemini call fails (network/parse error), the endpoint returns an
error the admin form surfaces inline; the admin can still fill every
tag manually and save — nothing blocks on Gemini being available.

## Recommendation matching (user-facing)

`GET /accessories/recommendations?occasion=<OccasionTag>&style=<StyleTag>`,
`get_current_user`-gated (per the auth decision above).

Service logic (`app/domains/accessories/service.py`,
`recommend(db, user_id, occasion, style, limit=6)`):

1. Resolve `tone` server-side: the requesting user's latest
   `QuizAttempt.parent_season`, or `None` if they have no quiz attempt
   (tone is simply excluded from scoring in that case — occasion/style
   still work for a user who hasn't done the quiz).
2. Load all `is_active` products.
3. Score each product: `+2` if `occasion` is in `occasion_tags`, `+2`
   if `tone` is in `tone_tags` (skipped if `tone` is `None`), `+1` if
   `style` is in `style_tags`. Occasion and tone are weighted above
   style because they're the stronger visual-fit signals (a
   party-appropriate, season-matching item still "reads" wrong faster
   from color/formality than from style aesthetic).
4. Group scored products by `category`, take the single highest-scoring
   product per category (ties broken by most-recent `created_at`) —
   this is what gives result diversity (one bag + one pair of shoes +
   one jewelry piece, not three bags).
5. Sort the per-category picks by score descending, cap to `limit`
   (default 6).
6. **Fallback for sparse catalogs**: if a category has no product with
   score > 0, it's simply omitted (never force an irrelevant item into
   a category with zero fit). If the *entire* result list is empty
   (e.g. catalog freshly seeded with items that don't cover this
   occasion/style/tone combination), fall back to the single
   most-recently-added active product per category regardless of
   score, so the section isn't empty during early rollout. This
   fallback only fires when the scored pass yields nothing at all.

Response: list of `{id, name, imageUrl, affiliateLink, category}`.

## Frontend

### User-facing: `AccessoryRecommendations`

New component `components/outfit/step4/AccessoryRecommendations.tsx`,
rendered from [Step4PageContent.tsx](../../components/outfit/step4/Step4PageContent.tsx) once
`ResultPreview`'s job reaches `status === 'done'`. Reads
`selectedOccasion`/`selectedStyle` from `useOutfitFlow()`, calls
`GET /accessories/recommendations?occasion=...&style=...` via
`apiFetch`. Renders nothing (section omitted entirely, no error UI) if
the call fails or returns an empty list — this is an upsell, not a
core part of the result, and must never look broken.

### Layout (responsive)

`Step4PageContent.tsx` moves from a single `max-w-2xl` column to a
`lg:grid-cols-12` layout (the same pattern as
[personal-color/result/page.tsx](../../app/personal-color/result/page.tsx)), container widened to
`lg:max-w-6xl`:

- **Desktop (`lg+`)**: `ResultPreview` spans columns 1–7,
  `AccessoryRecommendations` spans columns 8–12. The grid uses
  `lg:items-end` so the (shorter) accessory column sits flush with the
  bottom of the (taller) result image column — this achieves the
  requested "bottom-right corner" placement through normal in-flow
  grid alignment, not `position: fixed`/`absolute`. Inside the column:
  a vertical stack of compact horizontal cards (thumbnail left,
  name + "Mua ngay" button right), since the column itself is narrow
  (~5/12 width).
- **Mobile/tablet (`<lg`)**: single column — result image first, then
  the accessory section full-width below it, rendered as a horizontal
  scroll-snap carousel of vertical cards (image on top, name, CTA
  button below) rather than a vertical stack, to avoid pushing the
  "Thử outfit khác" button far down the page and to match natural
  swipe interaction on touch.
- Existing design tokens only (`rounded-2xl`, `surface-container-lowest`,
  `on-surface`, `material-symbols-outlined` icons) — no new palette
  introduced.
- Each card's image sits in a fixed-`aspect-ratio` box (prevents layout
  shift while the image loads). The "Mua ngay" control is a real link
  (`<a>`), not a button: `target="_blank" rel="sponsored noopener
  noreferrer"` (the `sponsored` value marks it as a paid/affiliate link
  per Google's link-attribute guidance), sized to a minimum 44×44px hit
  area, with an `aria-label` naming the product and stating it opens in
  a new tab (for screen reader users, since the visible text alone is
  just "Mua ngay" repeated on every card).

### Admin: `AccessoryList` + `AccessoryForm`

`components/admin/AccessoryList.tsx` and `AccessoryForm.tsx`, structured
like the existing `CapsuleList.tsx`/`CapsuleForm.tsx`. The form adds:
name input, affiliate link input, image upload (reusing whatever
upload widget the wardrobe/blog admin forms already use), a "Gợi ý tag
bằng AI" button that calls `suggest-tags` and pre-fills the pickers
below it, and editable pickers: one `<select>` for `category`, three
multi-select chip groups for `styleTags`/`occasionTags`/`toneTags`.

## Error Handling

- Gemini failure during admin tagging: inline error in the admin form;
  manual tag entry remains available (never blocks save).
- Recommendation fetch failure or empty result on the result page: the
  whole `AccessoryRecommendations` section is omitted; layout collapses
  back to the single result-image column look.
- No accessories admin-created yet at all: recommendations endpoint
  returns an empty list (not an error) — same "just don't render it"
  handling on the frontend.

## Testing

- Backend: unit tests for the scoring/grouping/fallback logic in
  `service.py` (pure function over fixture product lists — the
  highest-value place to test exhaustively, mirroring how
  `garment_selection.py` is tested in isolation from the DB). Tests for
  `gemini_client.py` with a mocked `httpx.post` (mirroring
  `tests/domains/wardrobe/test_gemini_client.py`). Router tests for
  CRUD + `require_admin` guard + the recommendations endpoint's
  auth requirement and tone-resolution-from-quiz-attempt behavior
  (including the "no quiz attempt" case).
- Frontend: component test for `AccessoryRecommendations` (mocked
  `apiFetch`) covering: normal render, empty-list hides the section,
  fetch error hides the section. Component tests for `AccessoryForm`/
  `AccessoryList` mirroring the existing Capsule admin tests. A layout
  smoke test isn't practical in Vitest/jsdom for the grid-alignment
  behavior — verified manually in a browser at the breakpoints listed
  in the UX guidance (320/375/414/768/1024/1440).

## Out of Scope

- Admin edit history, bulk actions, or usage analytics (click-through
  tracking on affiliate links) — a plain CRUD list is enough for Phase 1.
- Any embedding/vision-based matching against the actual try-on result
  image (considered and rejected earlier in favor of tag-based
  scoring — cheaper, deterministic, explainable).
- A garment-type → accessory-category mapping table (see "Scope
  decision" above — folded into occasion/style instead).
- Migrating `WardrobeLibrary.tsx`'s stale `{ season: string }` response
  type from `/quiz-attempts/me` (harmless today since only
  `result !== null` is read, but worth a follow-up cleanup pass
  separate from this feature).
- Backfilling `tone_tags`/etc. for accessories created before this
  feature — there are none, since the domain doesn't exist yet.
