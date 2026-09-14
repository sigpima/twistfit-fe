# Outfit Wizard API Wiring — Design Spec

Date: 2026-09-15

## Context

The outfit wizard (`/outfit/step-1` through `/outfit/step-4`) currently
runs entirely on mock/local state (see
`2026-09-15-virtual-tryon-design.md` for the backend it was built
against, and the earlier Step 1/3 UI redesign that this spec builds
on top of). The backend `wardrobe` and `tryon` domains, plus the
existing `model_catalog` and `quiz_attempts` domains, are fully built
and tested. This spec wires the frontend wizard to those real APIs.

Three gaps surfaced while designing this that need small backend
additions before the frontend wiring makes sense:

1. There's no way to ask "has this user already taken the personal
   color quiz" — `quiz_attempts` only has `POST` (create), no read-back.
2. `POST /tryon` takes no way to say which pose (front/side) to
   render — needed because the wizard already has a pose-selection
   step, and each catalog model needs a second photo for it.
3. The original assumption that Step 1 lets a user pick one specific
   wardrobe item to use is wrong — confirmed with the user that the
   wardrobe grid is browse-only; the backend already auto-selects the
   best-matching item from the whole wardrobe by occasion/style/color,
   which is what should happen. No change needed here, just removing
   the click-to-select interaction the earlier UI pass added.

## Backend additions

### `GET /quiz-attempts/me`

New route in the existing `quiz_attempts` domain. Returns the current
user's most recent attempt, or `null` if they have none:

```json
{ "season": "autumn" }
```
or `null`. Requires authentication (`Depends(get_current_user)` — no
anonymous case, unlike `POST /quiz-attempts` which allows anonymous
submission).

### `CatalogModel.side_image`

New nullable-at-the-DB-level-but-always-populated column on
`catalog_models` (migration required). Seed data for the 4 existing
demo models sets `side_image` to the same value as `image` as a
placeholder — the user will replace these with real side-view photos
later; the column existing now is what matters for wiring the rest of
this feature. `CatalogModelResponse` schema gains `side_image` (→
`sideImage` in the camelCase JSON the frontend already expects).

### `POST /tryon` gains `pose`

`TryOnJobCreate` gains `pose: Literal["front", "side"] = "front"`.
`create_tryon_job` passes the corresponding `catalog_model.image` or
`catalog_model.side_image` as the "person image" URL to
`process_job`/`_process_job_with_fresh_session` instead of always
`catalog_model.image`. `TryOnJob` gets a `pose` column (migration) so
the choice is recorded on the job row alongside `occasion`/`style`.

## Auth gate

New `components/auth/LoginRequiredModalProvider.tsx`, copying
`components/qr-modal/QrModalProvider.tsx`'s shape exactly: a context
exposing `{ isOpen, openLoginRequiredModal, closeLoginRequiredModal }`,
rendering a `LoginRequiredModal` (title + "Bạn cần đăng nhập để dùng
tính năng này" + a button linking to `/login`) as a sibling, with a
`useLoginRequiredModal()` hook. Mounted in `app/layout.tsx` alongside
the existing `QrModalProvider`.

Two call sites:
- `components/layout/Header.tsx`'s `outfitStyling` feature link: reads
  `useAuth()` and `useLoginRequiredModal()`; if `!user`, the link's
  `onClick` calls `preventDefault()` and `openLoginRequiredModal()`
  instead of navigating.
- A new small client component, `components/outfit/OutfitAuthGate.tsx`,
  mounted at the top of `OutfitFlowChrome` (wraps all four steps):
  once `isHydrated && !user`, it calls `openLoginRequiredModal()` and
  `router.replace('/')` — covers direct URL visits to any `/outfit/*`
  page.

Both paths reuse the same modal/provider — there is exactly one
"you must log in" UI in the app, not two.

## Step 1 — wardrobe (browse-only)

`WardrobeLibrary` drops `selectedGarment`/click-to-select entirely
(no more check-badge overlay, no more `Phối đồ (N)` tied to a
selection — there is no selection). On mount, it calls `GET
/wardrobe/items` and renders the real list (loading skeleton while
in flight, an empty-state message if the list is empty). The
"Đề xuất thêm đồ ngoài" checkbox stays local-only (no backend support
for this exists yet — out of scope here). The personal-color checkbox
calls `GET /quiz-attempts/me` on mount instead of using the demo
toggle: a result present shows the real checkbox, `null` shows the
existing CTA link to `/personal-color/quiz`.

The occasion/style mode + selected tag (currently local state inside
`WardrobeLibrary`) moves up into `OutfitFlowProvider` so Step 3's job
creation can read it — `WardrobeLibrary` keeps using it to filter the
*read-only preview* of matching items, but the tag itself is shared
context state now, not local to this component.

## Step 1 — upload flow (real)

`GarmentDropzone`'s upload becomes a real multi-step flow instead of
an `URL.createObjectURL` preview:

1. User picks a file → `POST /wardrobe/upload-url` → PUT the file
   directly to the returned SAS URL (browser → Blob Storage, not
   through our backend).
2. `POST /wardrobe/items/suggest-tags` with the returned `blobPath` →
   Gemini-suggested `category`/`styleTags`/`occasionTags` plus the
   extracted `dominantColors`.
3. Show the suggestion in an editable form (category dropdown, tag
   toggles) — the user confirms or corrects before saving, per the
   original wardrobe design's "don't trust zero-shot tagging blindly"
   rationale.
4. `POST /wardrobe/items` with the confirmed values persists it; the
   Step 1 wardrobe list (from the section above) is refetched so the
   new item shows up immediately.

## Step 2 — model selection

No behavior change — already backed by real `model_catalog` data via
`app/outfit/layout.tsx`. The shared `Model` type in
`OutfitFlowProvider` gains a `sideImage` field alongside the existing
`image`/`dossierImage`, populated from `CatalogModel.side_image`, so
Step 3/4 can use it.

## Step 3 — pose selection triggers job creation

UI is unchanged (front/side, already trimmed). What changes is the
"Tạo Đồ Ảo Ngay" button's `handleGenerate`: instead of only
`router.push('/outfit/step-4')`, it first calls `POST /tryon` with
`{ catalogModelId: Number(selectedModel.id), occasion, style, pose }`
(occasion/style read from the shared context state from Step 1's
selector; guard against `selectedModel.id` being the non-numeric
`FALLBACK_MODEL` id — treat that as "no real model selected yet" and
disable the button rather than sending `NaN`). The returned job `id`
is stored in `OutfitFlowProvider` before navigating to step 4.

## Step 4 — polling

On mount, if there's a `jobId` in context, poll `GET /tryon/{jobId}`
every 3 seconds (cleared on unmount or once a terminal status is
reached) instead of showing the hardcoded mock image immediately.
`pending`/`processing` → a loading state (replaces the current
always-shown "hoàn tất" badge and static image). `done` → render
`resultBlobUrl` in place of the mock image. `failed` → show
`errorMessage` with a link back to Step 1. No `jobId` at all (e.g. a
direct visit to `/outfit/step-4`, or a reload that lost in-memory
context state) → a "chưa có yêu cầu phối đồ nào" message with a link
back to Step 1, instead of silently rendering stale mock content.

## Out of scope

- "Đề xuất thêm đồ ngoài" checkbox's actual behavior (no backend
  support exists for this).
- Model catalog's "upload your own model" tile in Step 2 (no backend
  support for user-uploaded models exists; stays mock).
- Real side-view photos for the 4 demo catalog models — the user adds
  these later; this spec only adds the column and wires the pose
  choice through to it.
- Any redesign of Step 2/Step 3's visual UI beyond what's described
  above — both already match the desired UI from the earlier
  brainstorming pass.
