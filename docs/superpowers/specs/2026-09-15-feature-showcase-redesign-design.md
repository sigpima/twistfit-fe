# Feature Showcase Redesign — Design Spec

Date: 2026-09-15

## Context

The home page's feature-introduction section (`components/home/FeatureShowcase.tsx`)
currently shows one of 3 features at a time behind a 3-tab switcher, and
each tab's panel is a hand-built decorative mockup (fake UI elements —
no relationship to any real screen in the app). The user has provided
new copy for all 3 features, each broken into ordered steps, and wants:

1. The top tab switcher removed — each feature gets its own always-visible
   section with its own title (the title that used to live in the tab).
2. Each step within a feature has an illustration. Clicking a step swaps
   which illustration shows, via a numbered-circle step indicator
   (approved as "Option A" during brainstorming — plain numbered circles
   connected by a thin line, not simple dots).
3. Illustrations for **Màu sắc cá nhân** (Personal Color) and **Phối đồ**
   (Outfit) are real screenshots of the actual running app — not
   decorative mockups — because both features are fully built.
4. **Diễn đàn** (Forum)'s copy describes features that don't exist yet in
   the real app (image-attached posts, like/heart reactions, comments,
   saved collections — confirmed absent from both frontend and backend
   during brainstorming). Per explicit user decision, the copy stays
   exactly as given and is **not** softened to match current reality; the
   3 illustrations for this feature are designed mockups (not real
   screenshots), matching the same phone-frame visual treatment as the
   real ones so the section reads as one consistent design.
5. Copy also states the Personal Color quiz has "10 câu hỏi" — the real
   quiz currently seeds 5. Per explicit user decision, kept as-is (the
   quiz will grow to 10 later); not this plan's concern.

A related, unplanned fix landed during brainstorming: the header's
login/register buttons overlapped the logo below ~390px width even after
an earlier logo-size fix, because the logo plus both full pill buttons
never fit in that little space. Fixed by collapsing the two buttons to
icon-only below the `sm:` breakpoint (already shipped, not part of this
plan).

## Content

Exact copy as given by the user — Vietnamese, verbatim, no rewrites:

**Màu sắc cá nhân** (3 steps):
1. *Khám phá sắc độ qua bài kiểm tra nhanh.* — Trả lời 10 câu hỏi ngắn
   gọn để hệ thống bước đầu phân tích sắc tố tự nhiên, tông da và độ
   tương phản trên khuôn mặt bạn.
2. *Mở khóa cẩm nang màu sắc cá nhân.* — Nhận kết quả phân tích chuyên
   sâu gồm nhóm mùa đặc trưng, palette màu chuẩn, các chỉ số màu sắc và
   gợi ý ứng dụng thực tế (trang phục, makeup, phụ kiện,...)
3. *Kiểm chứng trực quan cùng công nghệ AR.* — Bật camera ướm thử trực
   tiếp các dải màu thuộc nhóm mùa đó lên gương mặt để thấy rõ ngũ quan
   bừng sáng và tự tin kiểm tra độ tương thích ngay tức thì.

**Phối đồ** (4 steps):
1. *Số hóa tủ đồ chỉ trong tích tắc* — Tải lên từng món đồ bạn có. Hệ
   thống sẽ tự động nhận diện và phân loại ngăn nắp vào tủ đồ ảo của bạn.
2. *Thiết lập gu và nhu cầu riêng* — Lựa chọn dịp diện đồ, phong cách yêu
   thích hoặc mix-match chuẩn bảng màu cá nhân. Muốn đổi gió? Hãy bật
   tính năng gợi ý thêm item mới từ bên ngoài.
3. *Chọn mẫu và dáng pose theo ý thích* — Chọn người mẫu sẵn có cùng
   dáng đứng phù hợp nhất để dễ dàng hình dung tổng thể bộ trang phục
   khi mặc lên người.
4. *Nhận ngay outfit hoàn chỉnh* — Chiêm ngưỡng set đồ được AI phối sẵn
   chuẩn chỉnh theo từng đường nét, sẵn sàng để bạn tự tin diện ra ngoài.

**Diễn đàn** (3 steps):
1. *Chia sẻ phong cách cá nhân* — Đăng tải outfit thường ngày với hình
   ảnh sắc nét và caption chia sẻ câu chuyện, ý tưởng phối đồ của riêng
   bạn.
2. *Kết nối và lan tỏa cảm hứng* — Tương tác trực tiếp với cộng đồng mê
   thời trang qua từng lượt thả tim yêu thích và những dòng bình luận
   rôm rả.
3. *Lưu giữ outfit tâm đắc* — Tạo các bộ sưu tập riêng và lưu lại những
   bài đăng ấn tượng để mở ra tham khảo bất cứ khi nào cần lên đồ.

Each feature keeps a title (was the tab label) and a CTA button, reusing
the current targets: Personal Color's CTA opens the QR modal
(`useQrModal`, same as today); Outfit's CTA links to `/outfit/step-1`;
Forum's CTA links to `/forum`.

## Illustrations

**Real screenshots** (Personal Color + Outfit, 7 total), captured at a
390×844 mobile viewport, viewport-only (not full-page) — scrolled to
whichever portion of the real screen best represents that step, since a
full scrollable page squeezed into a small phone-frame illustration
would be illegible. Captured **while logged in** where the real page
requires auth (`/outfit/*` is gated), so the header shows the account
icon instead of login/register buttons in the shot.

| Feature | Step | Real route | What the crop shows |
|---|---|---|---|
| Màu sắc cá nhân | Khám phá sắc độ | `/personal-color/quiz` | mid-quiz question card |
| Màu sắc cá nhân | Mở khóa cẩm nang | `/personal-color/result` | top of the result page (season card + metrics) |
| Màu sắc cá nhân | Kiểm chứng AR | `/camera-frame` | live camera view with a color frame overlay |
| Phối đồ | Số hóa tủ đồ | `/outfit/step-1` (Upload mới tab) | the upload/review screen |
| Phối đồ | Thiết lập gu | `/outfit/step-1` (Tủ đồ của tôi tab) | the occasion/style filter card |
| Phối đồ | Chọn mẫu và pose | `/outfit/step-2` | the model-selection grid |
| Phối đồ | Nhận outfit hoàn chỉnh | `/outfit/step-4` | the rendered try-on result |

Saved to `frontend/public/home/feature-steps/<feature>-<step>.jpg`
(e.g. `color-test-quiz.jpg`, `outfit-choose-model.jpg`).

**Designed mockups** (Diễn đàn, 3 total) — since the features they depict
don't exist yet, these are built as small standalone static HTML pages
(reusing this app's real color tokens — `--color-primary: #4c5a88`,
`--color-secondary: #7b516d`, `--color-on-surface: #041c37` — so they
don't clash with the real screenshots), then screenshotted the same way
as the real ones (390×844, viewport-only) so every illustration in the
section — real or designed — ends up as an equivalent JPG in the same
phone frame. Depicts: (1) a post-creation screen with an attached outfit
photo and caption field, (2) a post-detail screen with a hero image,
like count, and a couple of comments, (3) a "saved collections" grid
screen. Saved to the same directory:
`community-share.jpg`, `community-connect.jpg`, `community-save.jpg`.

## Components

### `lib/featureShowcaseSteps.ts` (new)

```ts
export type FeatureKey = 'colorTest' | 'outfit' | 'community'

export type FeatureStepImage = {
  key: string
  src: string
}

export const FEATURE_STEP_IMAGES: Record<FeatureKey, FeatureStepImage[]> = {
  colorTest: [
    { key: 'quiz', src: '/home/feature-steps/color-test-quiz.jpg' },
    { key: 'result', src: '/home/feature-steps/color-test-result.jpg' },
    { key: 'ar', src: '/home/feature-steps/color-test-ar.jpg' },
  ],
  outfit: [
    { key: 'digitizeCloset', src: '/home/feature-steps/outfit-digitize-closet.jpg' },
    { key: 'setPreferences', src: '/home/feature-steps/outfit-set-preferences.jpg' },
    { key: 'chooseModel', src: '/home/feature-steps/outfit-choose-model.jpg' },
    { key: 'getOutfit', src: '/home/feature-steps/outfit-get-outfit.jpg' },
  ],
  community: [
    { key: 'share', src: '/home/feature-steps/community-share.jpg' },
    { key: 'connect', src: '/home/feature-steps/community-connect.jpg' },
    { key: 'save', src: '/home/feature-steps/community-save.jpg' },
  ],
}
```

The step `key`s here must exactly match the translation keys under
`Home.FeatureShowcase.features.<feature>.steps.<key>` (see Content
section — `quiz`/`result`/`ar`, `digitizeCloset`/`setPreferences`/
`chooseModel`/`getOutfit`, `share`/`connect`/`save`) — `FeatureSection`
zips the two arrays together by index, and a mismatch would put the
wrong image next to the wrong text.

### `components/home/PhoneMockupStepper.tsx` (new)

```ts
type PhoneMockupStepperProps = {
  images: { key: string; src: string; alt: string }[]
  activeIndex: number
  onSelect: (index: number) => void
}
```

Renders the phone-framed image for `images[activeIndex]` (rounded
rectangle, dark border, drop shadow — the same treatment approved for
both the real screenshots and the designed mockups) and, below it, the
numbered-circle step indicator: one circle per image, filled/dark when
`index === activeIndex`, connected by a thin horizontal line, each
circle a `<button>` calling `onSelect(index)`. Purely presentational —
doesn't know which feature it belongs to or fetch anything.

### `components/home/FeatureSection.tsx` (new)

```ts
type FeatureSectionProps = {
  featureKey: 'colorTest' | 'outfit' | 'community'
  accentClassName: string // e.g. 'text-primary' / 'text-secondary' / 'text-tertiary', for the title/CTA color
  cta: { label: string; onClick?: () => void; href?: string }
}
```

Holds `activeStep` state (`useState(0)`), reads
`FEATURE_STEP_IMAGES[featureKey]` and the matching translations under
`Home.FeatureShowcase.features.<featureKey>`. Layout:

- Feature title (`text-headline-lg`, was the removed tab's label).
- `grid lg:grid-cols-12`: left column (`lg:col-span-6`) is
  `PhoneMockupStepper`; right column (`lg:col-span-6`) holds two
  alternate renderings of the step content, one visible per breakpoint
  (same "both render, CSS picks one" pattern already used for the Hero
  slideshow — safe here since it's just text, no double image-fetch
  concern):
  - `lg:hidden`: only `steps[activeStep]`'s title + body (mobile
    doesn't show all steps' text at once — would make the page very
    long next to a single phone illustration).
  - `hidden lg:block`: the full step list, each item clickable
    (`onClick={() => setActiveStep(index)}`), numbered badge + title +
    body for every step — closest to today's desktop layout, just with
    a real/designed screenshot on the left instead of a fake mockup.
  - CTA button below the step content, in both breakpoints.

### `components/home/FeatureShowcase.tsx` (rewritten)

Keeps the top badge/heading/subheading block unchanged. Removes the
`TABS` array, `activeTab` state, and the tablist markup entirely.
Renders three `FeatureSection`s stacked with vertical spacing:

```tsx
<FeatureSection featureKey="colorTest" accentClassName="text-secondary" cta={{ label: t('features.colorTest.cta'), onClick: openQrModal }} />
<FeatureSection featureKey="outfit" accentClassName="text-primary" cta={{ label: t('features.outfit.cta'), href: '/outfit/step-1' }} />
<FeatureSection featureKey="community" accentClassName="text-tertiary" cta={{ label: t('features.community.cta'), href: '/forum' }} />
```

## Content keys (`messages/vi.json`)

Replace `Home.FeatureShowcase.tabs`, `outfitPanel`, `colorTestPanel`,
`communityPanel` with:

```json
"features": {
  "colorTest": {
    "title": "Màu sắc cá nhân",
    "cta": "Kiểm Tra Ngay",
    "steps": {
      "quiz": { "title": "...", "body": "..." },
      "result": { "title": "...", "body": "..." },
      "ar": { "title": "...", "body": "..." }
    }
  },
  "outfit": {
    "title": "Phối đồ",
    "cta": "Bắt Đầu Phối Đồ Ngay",
    "steps": {
      "digitizeCloset": { "title": "...", "body": "..." },
      "setPreferences": { "title": "...", "body": "..." },
      "chooseModel": { "title": "...", "body": "..." },
      "getOutfit": { "title": "...", "body": "..." }
    }
  },
  "community": {
    "title": "Diễn đàn",
    "cta": "Khám Phá Diễn Đàn",
    "steps": {
      "share": { "title": "...", "body": "..." },
      "connect": { "title": "...", "body": "..." },
      "save": { "title": "...", "body": "..." }
    }
  }
}
```

(`...` placeholders above stand for the exact copy already written out
in full in the Content section of this spec — the plan copies it in
verbatim, not left as an actual placeholder.)

## Testing

- `lib/featureShowcaseSteps.test.ts` (new): each feature's image array
  length matches its step count (3/4/3); every `key` is unique within
  its feature.
- `components/home/PhoneMockupStepper.test.tsx` (new): renders the
  image at `activeIndex`; clicking a different circle calls `onSelect`
  with that index; renders one circle per image.
- `components/home/FeatureSection.test.tsx` (new): shows step 0's
  title/body by default; clicking a desktop step card updates which
  step's image/text is active; clicking a mobile-only element isn't
  tested here since jsdom doesn't apply real CSS breakpoints — the
  "which content shows" split is a pure CSS concern already covered by
  the fact both blocks read from the same `activeStep` state.
- `components/home/FeatureShowcase.test.tsx` (rewritten): no more tab
  queries; asserts all three feature titles render at once (no
  switching); asserts the Personal Color CTA still opens the QR modal;
  asserts the Outfit/Forum CTAs link to `/outfit/step-1` / `/forum`.

## Out of scope

- Building the missing Forum features (image posts, likes, comments,
  saved collections) — explicitly deferred by the user.
- Expanding the Personal Color quiz to 10 questions — explicitly
  deferred by the user.
- Wiring `suggestExternal` (Step 1's "gợi ý thêm đồ ngoài" checkbox) or
  making `/camera-frame` read the user's real season — both pre-existing
  gaps noted during brainstorming, neither blocks taking a real
  screenshot of the screens that already exist.
