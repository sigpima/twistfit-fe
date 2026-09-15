# Personal Color Quiz v2 (3-Axis Scoring, 12 Sub-Seasons) — Design

## Goal

Replace the current 5-question / 4-season Personal Color quiz with a 10-question,
3-axis (Hue, Value, Chroma) quiz that resolves to one of 12 sub-seasons, with
scoring moved from the frontend (today a placeholder majority-vote) to the
backend, and a result page that displays the real computed sub-season with a
full color-theory content profile (palette, description, styling
recommendations) instead of today's hardcoded "Winter" mock.

## Current State (from investigation)

- `QuizQuestion`/`QuizOption` (backend `app/domains/quiz/`): each option carries
  exactly one `season` string from a fixed 4-value enum (`spring/summer/autumn/winter`).
  No image field, no axis/weight concept.
- `QuizAttempt` (`app/domains/quiz_attempts/`): stores only a `season` string.
  No raw answers, no breakdown.
- Scoring is 100% client-side: `frontend/lib/computeSeasonResult.ts`, explicitly
  labeled "Placeholder scoring" — plurality vote over the 5 answered seasons.
- Result page (`app/personal-color/result/`) never reads the actual computed
  season — `ColorProfileCard.tsx` and `ColorInsights.tsx` hardcode "Winter"
  content and fake metrics regardless of the real result.
- Admin form (`QuizQuestionForm.tsx`) edits `label` + `season` (fixed 4 values)
  per option; no axis, no image.

## Content: The 10 New Questions

Verbatim from the user, grouped by axis. `axisValue` is the internal key each
option maps to (validated against the parent question's `axis`).

### Axis `hue` (Warm / Cool / Neutral) — Questions 1–4, 10

1. **"Hãy nhìn vào tĩnh mạch ở cổ tay dưới ánh sáng tự nhiên. Chúng nghiêng về màu gì?"** (has an illustrative image)
   - A "Xanh lá / Olive" → `warm`
   - B "Xanh dương / Tím" → `cool`
   - C "Lẫn lộn khó phân biệt" → `neutral`
2. **"Đặt một tờ giấy bạc và giấy vàng (hoặc trang sức vàng/bạc) kề sát mặt. Loại nào làm da bạn sáng hơn?"**
   - A "Vàng nguyên bản (Gold)" → `warm`
   - B "Bạc / Bạch kim (Silver)" → `cool`
   - C "Cả hai đều hài hòa" → `neutral`
3. **"Khi tiếp xúc lâu với nắng gắt, da bạn phản ứng thế nào?"**
   - A "Nhanh chóng rám nắng, sạm đen" → `warm`
   - B "Dễ ửng đỏ, cháy rát" → `cool`
   - C "Ửng đỏ nhẹ rồi mới chuyển rám" → `neutral`
4. **"Cầm một tờ giấy trắng tinh kề cạnh mặt. So với tờ giấy, da bạn ánh lên màu gì?"**
   - A "Ánh vàng / Cam (Yellowish/Golden)" → `warm`
   - B "Ánh hồng / Đỏ (Pinkish/Rosy)" → `cool`
   - C "Không rõ ràng (No strong leaning)" → `neutral`
10. **"Nhóm màu nào bạn mặc và được khen nhiều nhất?"** (cross-check)
    - A "Ấm: Cam đào, Vàng ấm, Nâu đất, Rêu" → `warm`
    - B "Lạnh: Hồng pastel, Xanh baby, Đỏ cherry, Navy" → `cool`
    - C "Bình thường" → `neutral`

### Axis `value` (Dark / Light / Medium) — Questions 5–7

5. **"Màu tóc tự nhiên của bạn là màu gì?"**
   - A "Đen láy / Nâu cực đậm" → `dark`
   - B "Nâu sáng / Hạt dẻ" → `light`
   - C "Nâu trung bình" → `medium`
6. **"Màu tròng đen của mắt bạn nghiêng về phổ màu nào?"**
   - A "Đen / Nâu rất đậm, sâu thẳm" → `dark`
   - B "Nâu sáng / Hổ phách, trong trẻo" → `light`
   - C "Nâu trung bình" → `medium`
7. **"Nhìn vào ảnh mặt mộc, sự chênh lệch (tương phản) giữa Tóc - Da - Mắt của bạn thế nào? (Chụp ảnh và chỉnh thành màu đen trắng sẽ dễ xác định hơn)"**
   - A "Rất rõ (Tóc sẫm nổi bật trên nền da)" → `dark`
   - B "Thấp (Tóc, da, mắt gần màu nhau, hòa quyện)" → `light`
   - C "Trung bình" → `medium`

### Axis `chroma` (Bright / Muted / Neutral) — Questions 8–9

8. **"Khi mặc màu rực rỡ (Đỏ tươi, Xanh cobalt, Vàng chanh), khuôn mặt bạn trông thế nào?"**
   - A "Bừng sáng, sắc nét và nổi bật hẳn lên" → `bright`
   - B "Bị màu áo lấn át, da nhợt nhạt/tối sầm" → `muted`
   - C "Bình thường" → `neutral`
9. **"Khi mặc màu trầm khói (Hồng đất, Rêu xám, Nâu be), bạn thấy thế nào?"**
   - A "Nhợt nhạt, già đi và thiếu sức sống" → `bright`
   - B "Rất sang trọng, hài hòa và tôn da" → `muted`
   - C "Bình thường" → `neutral`

Question order in the seed: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (`sortOrder` 0–9) —
matches the user's numbering; question 10 stays last despite scoring into the
`hue` axis, since it's explicitly a "cross-check" step done after the other two
phases.

## Scoring Algorithm

Runs server-side. Input: the 10 `(questionId, optionId)` answers for one
attempt. Each option resolves to `(axis, axisValue)` via its parent question's
`axis` and its own `axisValue`.

### Step 1 — Per-axis result

For each axis, tally votes for its 3 `axisValue`s among the answers belonging
to that axis (hue: 5 answers: Q1-4,10; value: 3 answers: Q5-7; chroma: 2
answers: Q8-9). The axis's **result** is the value with the most votes.

**Tie rule:** if there is no single maximum (e.g. 2/2/1 or 1/1 for a 2-question
axis), the result is the axis's middle value (`neutral` for hue/chroma,
`medium` for value) — the tie itself represents "no strong lean," which is
exactly what the middle option means.

### Step 2 — Parent season (Hue × Chroma quadrant)

| Hue result | Chroma result | Parent season |
|---|---|---|
| warm | bright | Spring |
| warm | muted | Autumn |
| cool | bright | Winter |
| cool | muted | Summer |

If Hue result is `neutral`: fall back to the raw `warm` vs `cool` vote count
among the 5 hue answers (ignore the neutral votes) — whichever has more votes
decides the side. If those two also tie exactly, default to `warm`
(documented, arbitrary, deterministic).

If Chroma result is `neutral`: same approach — fall back to raw `bright` vs
`muted` count among the 2 chroma answers; if tied, default to `muted`.

(Value's result does not affect which parent season is chosen — in the
4-season model, Spring/Summer are inherently the "light" pair and
Autumn/Winter the "deep" pair already implied by warm+bright /
cool+muted / etc.; Value differentiates *within* a season, at the
sub-season step.)

### Step 3 — Sub-season (dominant axis)

Compute a **vote share** for Value and for Chroma, but only if that axis's
Step-1 result is a *polar* value (not the middle one):

- Value share = (votes for the winning value) / 3, only counted if the
  winning value is `dark` or `light` (not `medium`).
- Chroma share = (votes for the winning value) / 2, only counted if the
  winning value is `bright` or `muted` (not `neutral`).

An axis whose Step-1 result is the middle value contributes a share of 0 (it
can't be "dominant" — it didn't lean anywhere).

- **Value share > Chroma share** → sub-season is the Light/Deep variant.
- **Chroma share > Value share** → sub-season is the Bright/Soft variant.
- **Equal** (including both being 0, i.e. both landed on their middle value)
  → sub-season is the **True** variant — the "no strong secondary lean"
  default, which also happens to match how True seasons are described in
  real color-analysis systems (the archetype of that parent season).

Final mapping table:

| Parent season | Value-dominant | Hue-dominant (tie) | Chroma-dominant |
|---|---|---|---|
| Spring | `light-spring` | `true-spring` | `bright-spring` |
| Summer | `light-summer` | `true-summer` | `soft-summer` |
| Autumn | `deep-autumn` | `true-autumn` | `soft-autumn` |
| Winter | `deep-winter` | `true-winter` | `bright-winter` |

(Spring/Summer use the Light-dominant slot since they're already the "light"
parent seasons — a *dark*-winning Value axis inside Spring/Summer would be an
unusual profile; it still resolves to the Light-dominant slot's label because
the table's job is just "which of the 3 named sub-seasons," not a literal
light/dark check. Likewise Autumn/Winter use the Deep-dominant slot
regardless of whether Value literally won on `dark` or `light`, for the same
reason — matching the naming convention the user specified.)

## Data Model Changes (backend)

`app/domains/quiz/models.py`:
- `QuizQuestion` — add `axis: Mapped[str]` (`"hue" | "value" | "chroma"`), add
  `image_url: Mapped[str | None]`.
- `QuizOption` — rename `season: Mapped[str]` → `axis_value: Mapped[str]`.

`app/domains/quiz/schemas.py`:
- `AXES = ["hue", "value", "chroma"]`, `AXIS_VALUES = {"hue": ["warm","cool","neutral"], "value": ["dark","light","medium"], "chroma": ["bright","muted","neutral"]}`.
- `QuizQuestionInput` validates every option's `axisValue` is a member of
  `AXIS_VALUES[axis]` (cross-field validator at the question level, since it
  needs both the question's `axis` and each option's `axisValue`).

`app/domains/quiz_attempts/models.py`:
- Add `sub_season: Mapped[str]`, `parent_season: Mapped[str]`,
  `hue_result: Mapped[str]`, `value_result: Mapped[str]`,
  `chroma_result: Mapped[str]`.
- Drop the old `season` column (superseded by `parent_season`/`sub_season`).

`app/domains/quiz_attempts/schemas.py`:
- `SUB_SEASONS` (12 values), `PARENT_SEASONS` (4 values) replace the old
  `SEASONS` enum.
- New request shape: `POST /quiz-attempts` takes
  `{"answers": [{"questionId": int, "optionId": int}, ...]}` (10 entries)
  instead of `{"season": str}`. The endpoint calls the new scoring
  module and persists+returns the full result (sub_season, parent_season,
  three axis results).

New module `app/domains/quiz_attempts/scoring.py`: pure functions implementing
Steps 1–3 above, taking the list of `(axis, axis_value)` pairs (resolved by
the router/service from the submitted `(questionId, optionId)` pairs) and
returning `{hue_result, value_result, chroma_result, parent_season, sub_season}`.
Fully unit-testable without touching the DB.

**Migration:** schema migration for the new/renamed columns. Since this
replaces the question/option content wholesale, the existing 5 seeded
questions (and any options) are cleared and reseeded with the new 10 — same
approach already used this session for `catalog_models`. Existing
`quiz_attempts` rows (old 4-value `season` strings) are historical data with
no `sub_season`/axis breakdown available; they are left as-is with NULL/blank
new columns rather than back-filled (there's no way to reconstruct a
sub-season from a bare season string), and `get_latest_attempt` callers must
tolerate a legacy row missing the new fields if one exists in production data
— for this dev/test environment there are no real user attempts to preserve.

## Frontend Changes

`lib/db.ts`: `QuizOption{axisValue}` replaces `{season}`; `QuizQuestion` adds
`axis`, `imageUrl`. New types `Axis`, `AxisValue`, `SubSeason`, `ParentSeason`.

`components/personal-color/QuizFlow.tsx`:
- Track `Record<questionId, optionId>` instead of `Season[]`.
- Render `question.imageUrl` above the options when present (only Q1 has one).
- On finish: POST the 10 `{questionId, optionId}` pairs to `/quiz-attempts`,
  read the full result object back from the response, store it (both the
  authenticated path and the anonymous `sessionStorage` path) instead of a
  bare season string.

`lib/quizResultStorage.ts`: stores the full result shape
`{subSeason, parentSeason, hueResult, valueResult, chromaResult, createdAt}`.

`lib/computeSeasonResult.ts` and its test are deleted — scoring is no longer
client-side.

New `lib/seasonProfiles.ts`: a static `Record<SubSeason, SeasonProfile>` with
`{displayName, paletteHex: string[], description, recommendations: {outfit, lipstick, accessory}}`
for all 12 sub-seasons (content drafted below). This is reference color-theory
content, not admin-editable business data, so it lives in code rather than
the DB — consistent with treating the axis/scoring definitions themselves as
fixed.

`app/personal-color/result/page.tsx` + `ColorProfileCard.tsx` +
`ColorInsights.tsx`: read the real stored result (from `/quiz-attempts/me` or
`sessionStorage`), look up `seasonProfiles[result.subSeason]`, and render the
real palette/description/recommendations plus a breakdown row showing the
three axis results (e.g. "Ấm · Sáng · Tươi sáng").

## Admin Form Changes

`components/admin/QuizQuestionForm.tsx`:
- Add an `axis` `<select>` (Hue/Value/Chroma) for the question.
- Add an `imageUrl` text input (optional) for the question.
- Each option's season `<select>` becomes an `axisValue` `<select>` whose
  options depend on the question's currently-selected `axis` (re-render the
  3 valid choices when `axis` changes; existing options whose value is no
  longer valid for a newly-chosen axis reset to that axis's first value).

## 12 Sub-Season Content (drafted from standard color-analysis theory)

| Sub-season | Palette (hex) | Description |
|---|---|---|
| `light-spring` | `#FFD9B3 #FFF2CC #C9E4CA #F7C6C7 #FCE38A #9FD8CB` | Da tươi sáng, tóc/mắt màu nhạt ấm — hợp tông ấm nhẹ nhàng, tươi sáng |
| `true-spring` | `#FF7F50 #FFC72C #4CBB17 #40E0D0 #FF6347 #FFB07C` | Tông ấm rõ rệt, sắc độ trung bình — hợp màu tươi sáng rực vừa phải |
| `bright-spring` | `#FF4F79 #00CED1 #FFEA00 #FF3131 #FF8C00 #39FF88` | Ấm nhưng rất sắc nét, tương phản khá cao — hợp màu ấm cực tươi |
| `light-summer` | `#AEC6E8 #D8BFD8 #F4C2C2 #B5C9A8 #D8A7B1 #C9D6EA` | Da sáng, tông lạnh nhẹ — hợp pastel lạnh dịu |
| `true-summer` | `#6C93B8 #A76A82 #C05C7E #8FA3B3 #A6A2D0 #B0789A` | Tông lạnh rõ rệt, sắc độ trung bình — hợp màu lạnh dịu vừa phải |
| `soft-summer` | `#C8A2A2 #A9BA9D #B49A8B #A6A9C7 #B08CA6 #C9BFB0` | Lạnh nhẹ, độ bão hoà thấp — hợp tông trầm nhẹ nhàng |
| `soft-autumn` | `#A98B6D #8A9A5B #C98A5D #C9A66B #C08769 #A68A64` | Ấm nhẹ, độ bão hoà thấp — hợp tông đất nhẹ nhàng |
| `true-autumn` | `#B7410E #6B8E23 #E1AD01 #8B5A2B #D2691E #B8860B` | Ấm rõ rệt, bão hoà trung bình-đậm — hợp tông đất ấm rực |
| `deep-autumn` | `#4A2C1D #3D3D1F #A0421D #1B4D3E #5C4033 #7A3B12` | Ấm và sẫm, tương phản khá rõ — hợp tông đất đậm sâu |
| `deep-winter` | `#000000 #36454F #6A0033 #046307 #B22222 #002147` | Lạnh và sẫm, tương phản cao — hợp tông đậm sắc lạnh |
| `true-winter` | `#003399 #FF0033 #E0FFFF #FF00FF #FFFFFF #000000` | Lạnh rõ rệt, sắc nét, tương phản cao — hợp màu lạnh trong trẻo |
| `bright-winter` | `#FF1493 #00BFFF #FF0000 #FFFFFF #000000 #F0F8FF` | Lạnh nhưng cực rực rỡ, tương phản rất cao |

Each also gets short `recommendations` (outfit / lipstick / accessory) — full
text lives in the plan/implementation, not duplicated here to keep this table
scannable.

## Question 1's Illustrative Image

No real wrist-vein photo is available. Following this session's established
pattern for "no real asset available" (the Forum mockups), a small designed
graphic is built: two simplified wrist illustrations side-by-side, one
labeled "Ấm" with olive-green vein lines, one labeled "Lạnh" with blue-purple
vein lines — built as a standalone HTML/CSS file, screenshotted, resized, and
saved as `frontend/public/personal-color/quiz/wrist-veins.jpg`.

## Testing

- Backend: `scoring.py` gets full unit coverage of Steps 1–3 (including every
  tie-break branch) — this is pure logic, the highest-value place to test
  exhaustively. Router/service tests cover the new request/response shape and
  persistence of the 5 result fields. Schema tests cover the axis/axisValue
  cross-validation.
- Frontend: `QuizFlow.test.tsx` updated for the new answer-tracking shape and
  image rendering; `seasonProfiles.ts` gets a small test asserting all 12 keys
  exist with non-empty palettes; result-page component tests updated to
  assert real content renders for a given stored result instead of the fixed
  "Winter" mock.

## Out of Scope

- Editing existing `quiz_attempts` historical rows to backfill sub-season data.
- Any change to the wardrobe/outfit/auth features touched earlier this
  session.
- A rich-text/WYSIWYG editor for quiz question images (still a plain URL
  input, matching the existing blog/model-catalog admin convention).
