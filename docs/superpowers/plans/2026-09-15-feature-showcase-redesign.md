# Feature Showcase Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page's 3-tab feature switcher with three always-visible feature sections, each with new copy and a clickable numbered-step illustration (real app screenshots for Personal Color/Outfit, designed mockups for Forum).

**Architecture:** A new `lib/featureShowcaseSteps.ts` maps each feature to an ordered list of `{key, src}` images. A new `PhoneMockupStepper` renders the active image in a phone frame plus a numbered-circle switcher; a new `FeatureSection` wraps it with the feature's title, CTA, and step text (full list on desktop, active-step-only on mobile — both always rendered, CSS picks which one shows, same pattern the Hero slideshow already uses). `FeatureShowcase.tsx` drops its tab state and stacks three `FeatureSection`s.

**Tech Stack:** Next.js (App Router), TypeScript, TailwindCSS, next-intl, Vitest + React Testing Library (`renderWithIntl`), Python 3 + Pillow + Playwright for one-time screenshot/mockup asset capture (not part of the app's runtime).

**Spec:** `frontend/docs/superpowers/specs/2026-09-15-feature-showcase-redesign-design.md`

## Global Constraints

- Copy is verbatim from the spec's Content section — do not rewrite, shorten, or "correct" it (the spec explicitly keeps "10 câu hỏi" even though the real quiz has 5, and keeps Forum's like/comment/collection claims even though those features don't exist yet — both are the user's explicit calls).
- Real screenshots (Personal Color, Outfit): 390×844 viewport, **not** full-page, captured **logged in** so the header shows the account icon rather than login/register buttons.
- Designed mockups (Forum): same 390×844 capture treatment, built from standalone HTML using this app's real color tokens (`--color-primary: #4c5a88`, `--color-secondary: #7b516d`, `--color-on-surface: #041c37`) so they sit visually next to the real screenshots without clashing.
- All 10 final images saved to `frontend/public/home/feature-steps/<feature>-<step>.jpg`, resized to ~480px wide, JPEG quality ~82 (matches the Hero slideshow asset convention).
- Step `key`s in `lib/featureShowcaseSteps.ts` must exactly match the translation keys under `Home.FeatureShowcase.features.<feature>.steps.<key>` — `FeatureSection` zips them by index.

---

## Task 1: `lib/featureShowcaseSteps.ts` — step image lists

**Files:**
- Create: `frontend/lib/featureShowcaseSteps.ts`
- Test: `frontend/lib/featureShowcaseSteps.test.ts`

**Interfaces:**
- Produces: `FeatureKey = 'colorTest' | 'outfit' | 'community'`, `FeatureStepImage = {key: string; src: string}`, `FEATURE_STEP_IMAGES: Record<FeatureKey, FeatureStepImage[]>` — consumed by Task 6 (`FeatureSection.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/featureShowcaseSteps.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { FEATURE_STEP_IMAGES } from './featureShowcaseSteps'

describe('featureShowcaseSteps', () => {
  it('has the right number of steps per feature', () => {
    expect(FEATURE_STEP_IMAGES.colorTest).toHaveLength(3)
    expect(FEATURE_STEP_IMAGES.outfit).toHaveLength(4)
    expect(FEATURE_STEP_IMAGES.community).toHaveLength(3)
  })

  it('uses unique keys within each feature', () => {
    for (const images of Object.values(FEATURE_STEP_IMAGES)) {
      const keys = images.map((image) => image.key)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('points every image at the feature-steps directory as a jpg', () => {
    for (const images of Object.values(FEATURE_STEP_IMAGES)) {
      for (const image of images) {
        expect(image.src).toMatch(/^\/home\/feature-steps\/[a-z0-9-]+\.jpg$/)
      }
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- lib/featureShowcaseSteps.test.ts
```

Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Create `frontend/lib/featureShowcaseSteps.ts`:

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

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- lib/featureShowcaseSteps.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/featureShowcaseSteps.ts frontend/lib/featureShowcaseSteps.test.ts
git commit -m "feat: add the Feature Showcase step image lists"
```

---

## Task 2: `PhoneMockupStepper` component

**Files:**
- Create: `frontend/components/home/PhoneMockupStepper.tsx`
- Test: `frontend/components/home/PhoneMockupStepper.test.tsx`

**Interfaces:**
- Produces: `PhoneMockupStepper` default export, props `{images: {key,src,alt}[]; activeIndex: number; onSelect: (index: number) => void}` — consumed by Task 6 (`FeatureSection.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/home/PhoneMockupStepper.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhoneMockupStepper from './PhoneMockupStepper'

const IMAGES = [
  { key: 'a', src: '/a.jpg', alt: 'A' },
  { key: 'b', src: '/b.jpg', alt: 'B' },
  { key: 'c', src: '/c.jpg', alt: 'C' },
]

describe('PhoneMockupStepper', () => {
  it('shows the image at activeIndex', () => {
    render(<PhoneMockupStepper images={IMAGES} activeIndex={1} onSelect={vi.fn()} />)
    expect(screen.getByAltText('B')).toBeInTheDocument()
  })

  it('renders one step button per image', () => {
    render(<PhoneMockupStepper images={IMAGES} activeIndex={0} onSelect={vi.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('calls onSelect with the clicked step index', () => {
    const onSelect = vi.fn()
    render(<PhoneMockupStepper images={IMAGES} activeIndex={0} onSelect={onSelect} />)
    fireEvent.click(screen.getAllByRole('button')[2])
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('marks only the active step button with aria-current', () => {
    render(<PhoneMockupStepper images={IMAGES} activeIndex={1} onSelect={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[1]).toHaveAttribute('aria-current', 'step')
    expect(buttons[0]).not.toHaveAttribute('aria-current')
    expect(buttons[2]).not.toHaveAttribute('aria-current')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- components/home/PhoneMockupStepper.test.tsx
```

Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Create `frontend/components/home/PhoneMockupStepper.tsx`:

```tsx
'use client'

type PhoneMockupStepperImage = {
  key: string
  src: string
  alt: string
}

type PhoneMockupStepperProps = {
  images: PhoneMockupStepperImage[]
  activeIndex: number
  onSelect: (index: number) => void
}

export default function PhoneMockupStepper({ images, activeIndex, onSelect }: PhoneMockupStepperProps) {
  const activeImage = images[activeIndex]

  return (
    <div className="flex flex-col items-center gap-space-md">
      <div className="w-full max-w-[240px] overflow-hidden rounded-[28px] border-[6px] border-on-surface shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activeImage.src} alt={activeImage.alt} className="block w-full" />
      </div>
      <div className="flex items-center">
        {images.map((image, index) => (
          <div key={image.key} className="flex items-center">
            {index > 0 && <div className="h-0.5 w-6 bg-surface-container-high" />}
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === activeIndex ? 'step' : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-label-md font-bold transition-colors ${
                index === activeIndex
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {index + 1}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- components/home/PhoneMockupStepper.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/PhoneMockupStepper.tsx frontend/components/home/PhoneMockupStepper.test.tsx
git commit -m "feat: add PhoneMockupStepper, a clickable numbered-step image switcher"
```

---

## Task 3: Real screenshots — Màu sắc cá nhân (3 images)

**Files:**
- Create (committed): `frontend/public/home/feature-steps/color-test-quiz.jpg`
- Create (committed): `frontend/public/home/feature-steps/color-test-result.jpg`
- Create (committed): `frontend/public/home/feature-steps/color-test-ar.jpg`

No app-code interface — this task only produces static assets consumed by Task 1's already-committed `FEATURE_STEP_IMAGES.colorTest` paths.

- [ ] **Step 1: Start the app**

```bash
cd frontend && npm run dev &
cd backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

Wait for both (`curl -sf http://localhost:3000` and `curl -sf http://localhost:8000/faq` succeed) before continuing.

- [ ] **Step 2: Register a test account**

```bash
curl -s -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Feature Showcase","email":"feature-showcase@twistfit.vn","password":"ShowcasePass123!"}'
```

If it 409s because the account already exists from a previous run, that's fine — continue.

- [ ] **Step 3: Capture the quiz screen (mid-quiz)**

Write and run a small Playwright script (Node, using the `playwright` package already installed in the scratchpad from earlier work this session):

```js
const { chromium } = require('playwright')

const UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: UA })
  const page = await context.newPage()

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
  await page.fill('input[name="email"]', 'feature-showcase@twistfit.vn')
  await page.fill('input[name="password"]', 'ShowcasePass123!')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1500)

  await page.goto('http://localhost:3000/personal-color/quiz', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const firstOption = await page.locator('[data-quiz-option="true"]').first()
  await firstOption.click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: '/tmp/color-test-quiz-raw.png' })

  await browser.close()
}

main()
```

Run it, then view `/tmp/color-test-quiz-raw.png` — confirm it shows the quiz card with the first option selected (highlighted) and the progress bar at "Câu hỏi 1/5". If the header's account icon isn't visible (still shows login/register), the login step failed — check the email/password and retry.

- [ ] **Step 4: Get a real result, capture the result screen**

Extend the same script (or write a second one) to finish the quiz and capture `/personal-color/result`:

```js
  for (let i = 0; i < 5; i++) {
    const option = await page.locator('[data-quiz-option="true"]').first()
    await option.click()
    await page.waitForTimeout(200)
    const nextButton = page.locator('button', { hasText: /Tiếp theo|Xem kết quả/ })
    await nextButton.click()
    await page.waitForTimeout(400)
  }
  await page.waitForTimeout(1000)
  await page.screenshot({ path: '/tmp/color-test-result-raw.png' })
```

View the result — confirm it shows the season card, palette swatches, and metric bars (not the empty state — if you see the empty state, the quiz submission failed; check for a console error with `page.on('console', console.log)`).

- [ ] **Step 5: Capture the AR camera screen**

Headless Chromium has no real webcam, so `getUserMedia` fails with "device not found" by default. Launch with a fake video device so the real camera-frame UI actually renders over a synthetic feed:

```js
const browser2 = await chromium.launch({
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
})
const context2 = await browser2.newContext({ viewport: { width: 390, height: 844 }, userAgent: UA })
const page2 = await context2.newPage()
await page2.goto('http://localhost:3000/camera-frame', { waitUntil: 'networkidle' })
await page2.waitForTimeout(1500)
await page2.screenshot({ path: '/tmp/color-test-ar-raw.png' })
```

View it — confirm the oval face-cutout frame and color palette overlay render on top of the (synthetic test-pattern) video feed, rather than an error message. This screenshot's camera *feed* is a synthetic pattern (headless capture limitation), but the frame/overlay UI captured is the real feature.

- [ ] **Step 6: Resize, compress, and place the final images**

```bash
python3 <<'EOF'
from PIL import Image

for src, dst in [
    ('/tmp/color-test-quiz-raw.png', 'frontend/public/home/feature-steps/color-test-quiz.jpg'),
    ('/tmp/color-test-result-raw.png', 'frontend/public/home/feature-steps/color-test-result.jpg'),
    ('/tmp/color-test-ar-raw.png', 'frontend/public/home/feature-steps/color-test-ar.jpg'),
]:
    img = Image.open(src).convert('RGB')
    width, height = img.size
    new_width = 480
    new_height = round(height * (new_width / width))
    img.resize((new_width, new_height), Image.LANCZOS).save(dst, quality=82)
    print(dst, new_width, new_height)
EOF
```

- [ ] **Step 7: Verify and commit**

```bash
ls -la frontend/public/home/feature-steps/color-test-*.jpg
git add frontend/public/home/feature-steps/color-test-quiz.jpg frontend/public/home/feature-steps/color-test-result.jpg frontend/public/home/feature-steps/color-test-ar.jpg
git commit -m "feat: add real screenshots for the Personal Color feature steps"
```

---

## Task 4: Real screenshots — Phối đồ (4 images)

**Files:**
- Create (committed): `frontend/public/home/feature-steps/outfit-digitize-closet.jpg`
- Create (committed): `frontend/public/home/feature-steps/outfit-set-preferences.jpg`
- Create (committed): `frontend/public/home/feature-steps/outfit-choose-model.jpg`
- Create (committed): `frontend/public/home/feature-steps/outfit-get-outfit.jpg`

No app-code interface — static assets consumed by Task 1's already-committed `FEATURE_STEP_IMAGES.outfit` paths.

**Blocker to handle first:** `GEMINI_API_KEY` isn't configured in this environment (`backend/app/core/config.py` defaults it to a placeholder that fails against the real Gemini API), so the wardrobe upload flow's real "suggest tags" call will error. Don't edit the committed `gemini_client.py` — instead run the backend through a small wrapper that monkeypatches the function in-memory for this capture session only, leaving the repo untouched.

- [ ] **Step 1: Start the backend with `suggest_tags` mocked**

Stop any already-running backend (`pkill -f "uvicorn app.main:app"` or find and kill its PID), then:

```bash
cd backend && source venv/bin/activate
python3 <<'EOF' &
import uvicorn
from unittest.mock import patch
from app.domains.wardrobe import gemini_client

def fake_suggest_tags(image_bytes):
    return {"category": "ao-thun", "styleTags": ["casual"], "occasionTags": ["hang-ngay"]}

with patch.object(gemini_client, "suggest_tags", fake_suggest_tags):
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
EOF
```

Note: `patch.object` on the module reference works here because `wardrobe/router.py` calls `suggest_tags(...)` via `from app.domains.wardrobe.gemini_client import suggest_tags` — confirm this still resolves to the patched function by checking the router imports it the same way as the module attribute being patched (if the router imported the name directly rather than the module, patch `app.domains.wardrobe.router.suggest_tags` instead, following the pattern documented earlier this session for monkeypatching an already-imported reference).

- [ ] **Step 2: Upload a wardrobe item and capture the review screen**

Reuse the login from Task 3 (same test account). Extend the Playwright script:

```js
await page.goto('http://localhost:3000/outfit/step-1', { waitUntil: 'networkidle' })
await page.click('text=Upload mới')
await page.waitForTimeout(300)
const fileInput = page.locator('#wardrobeUploadInput')
await fileInput.setInputFiles('frontend/public/home/studio-outfit.jpg')
await page.waitForTimeout(1500) // upload-url + PUT + suggest-tags round trip
await page.screenshot({ path: '/tmp/outfit-digitize-closet-raw.png' })
```

View it — confirm it shows the review screen (category dropdown, style/occasion checkboxes, "Lưu vào tủ đồ" button) with the uploaded image preview, not the initial "pick a file" screen. Click "Lưu vào tủ đồ" afterward so the item is saved:

```js
await page.click('text=Lưu vào tủ đồ')
await page.waitForTimeout(800)
```

Repeat the upload+save once or twice more with different sample images (`frontend/public/home/blazer-outfit.jpg`, `frontend/public/home/street-outfit-hanoi.jpg`) so the wardrobe isn't a single lonely item for the next screenshot.

- [ ] **Step 3: Capture the occasion/style filter screen**

```js
await page.goto('http://localhost:3000/outfit/step-1', { waitUntil: 'networkidle' })
await page.click('text=Tủ đồ của tôi')
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/outfit-set-preferences-raw.png' })
```

View it — confirm it shows the merged filter card (suggest-external/personal-color checkboxes + occasion/style chips) with the wardrobe grid below.

- [ ] **Step 4: Capture the model-selection screen**

```js
await page.click('text=Tiếp tục sang Bước 2')
await page.waitForTimeout(800)
await page.screenshot({ path: '/tmp/outfit-choose-model-raw.png' })
```

View it — confirm it shows the model grid with at least one card visible.

- [ ] **Step 5: Generate a real try-on and capture the result**

```js
await page.click('text=Xác nhận người mẫu')
await page.waitForTimeout(500)
// Step 3: pose is "front" by default — just generate.
const generateButton = page.locator('button', { hasText: /Tạo Đồ Ảo Ngay/ })
await generateButton.click()
await page.waitForTimeout(2000)
console.log('Now on:', page.url())
```

The background job calls the real CatVTON service (confirmed reachable during planning). Poll for completion instead of guessing a fixed wait:

```js
for (let i = 0; i < 40; i++) {
  const text = await page.textContent('body')
  if (text.includes('Xem Kết Quả') || text.includes('renderCompleteLabel') || !text.includes('Đang xử lý')) break
  await page.waitForTimeout(3000)
}
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/outfit-get-outfit-raw.png' })
```

View it. **If it still shows "Đang xử lý phối đồ" (still processing) or a failure message after ~2 minutes** — the GPU box may have gone idle/stopped since it was last checked. Fall back to seeding the job directly instead of waiting further:

```bash
cd backend && source venv/bin/activate
python3 <<'EOF'
from app.db.session import SessionLocal
from app.domains.tryon.models import TryOnJob

db = SessionLocal()
job = db.query(TryOnJob).order_by(TryOnJob.id.desc()).first()
job.status = "done"
job.result_blob_url = "/home/model-tryon-result.jpg"  # an existing local sample image, good enough for a marketing screenshot
db.commit()
db.close()
EOF
```

Then reload the Step 4 page (`page.reload()`) and re-screenshot — `ResultPreview`'s poll picks up the update within 3s of load.

- [ ] **Step 6: Resize, compress, and place the final images**

```bash
python3 <<'EOF'
from PIL import Image

for src, dst in [
    ('/tmp/outfit-digitize-closet-raw.png', 'frontend/public/home/feature-steps/outfit-digitize-closet.jpg'),
    ('/tmp/outfit-set-preferences-raw.png', 'frontend/public/home/feature-steps/outfit-set-preferences.jpg'),
    ('/tmp/outfit-choose-model-raw.png', 'frontend/public/home/feature-steps/outfit-choose-model.jpg'),
    ('/tmp/outfit-get-outfit-raw.png', 'frontend/public/home/feature-steps/outfit-get-outfit.jpg'),
]:
    img = Image.open(src).convert('RGB')
    width, height = img.size
    new_width = 480
    new_height = round(height * (new_width / width))
    img.resize((new_width, new_height), Image.LANCZOS).save(dst, quality=82)
    print(dst, new_width, new_height)
EOF
```

- [ ] **Step 7: Stop the mocked backend, restart the normal one**

```bash
pkill -f "uvicorn app.main:app"
cd backend && source venv/bin/activate && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
```

Confirm `backend/app/domains/wardrobe/gemini_client.py` shows no diff in `git status` — the monkeypatch never touched the file.

- [ ] **Step 8: Verify and commit**

```bash
ls -la frontend/public/home/feature-steps/outfit-*.jpg
git add frontend/public/home/feature-steps/outfit-digitize-closet.jpg frontend/public/home/feature-steps/outfit-set-preferences.jpg frontend/public/home/feature-steps/outfit-choose-model.jpg frontend/public/home/feature-steps/outfit-get-outfit.jpg
git commit -m "feat: add real screenshots for the Outfit feature steps"
```

---

## Task 5: Designed mockups — Diễn đàn (3 images)

**Files:**
- Create (committed): `frontend/public/home/feature-steps/community-share.jpg`
- Create (committed): `frontend/public/home/feature-steps/community-connect.jpg`
- Create (committed): `frontend/public/home/feature-steps/community-save.jpg`

No app-code interface — static assets consumed by Task 1's already-committed `FEATURE_STEP_IMAGES.community` paths. These depict features that don't exist in the real app yet (per the spec, deferred) — built as standalone HTML, not extracted from any real page.

- [ ] **Step 1: Write the three mockup HTML files**

Create `/tmp/community-share.html`:

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; font-family: system-ui, sans-serif; background:#faf9fb; }
  .header { display:flex; align-items:center; justify-content:space-between; padding:16px; background:#fff; border-bottom:1px solid #eee; }
  .header h1 { font-size:16px; color:#041c37; margin:0; }
  .post-btn { background:#4c5a88; color:#fff; border:none; border-radius:999px; padding:8px 16px; font-size:13px; font-weight:600; }
  .photo { width:100%; height:280px; background:linear-gradient(135deg,#7b516d,#4c5a88); }
  .field { margin:16px; }
  .field label { font-size:12px; font-weight:700; color:#45464f; display:block; margin-bottom:6px; }
  .caption { width:100%; box-sizing:border-box; border:1px solid #ddd; border-radius:12px; padding:10px; font-size:13px; height:70px; color:#041c37; }
</style></head>
<body>
  <div class="header"><h1>Đăng bài mới</h1><button class="post-btn">Đăng</button></div>
  <div class="photo"></div>
  <div class="field">
    <label>Caption</label>
    <div class="caption">Outfit hôm nay: blazer be phối cùng quần ống suông, năng lượng công sở tối giản ✨</div>
  </div>
</body></html>
```

Create `/tmp/community-connect.html`:

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; font-family: system-ui, sans-serif; background:#faf9fb; }
  .photo { width:100%; height:260px; background:linear-gradient(135deg,#4c5a88,#7b516d); }
  .actions { display:flex; gap:16px; align-items:center; padding:12px 16px; border-bottom:1px solid #eee; background:#fff; }
  .like { display:flex; align-items:center; gap:4px; color:#7b516d; font-weight:700; font-size:13px; }
  .caption { padding:12px 16px; font-size:13px; color:#041c37; }
  .comment { display:flex; gap:8px; padding:10px 16px; }
  .avatar { width:28px; height:28px; border-radius:999px; background:#e5e0f0; flex-shrink:0; }
  .comment-body { font-size:12px; color:#45464f; }
  .comment-body b { color:#041c37; }
</style></head>
<body>
  <div class="photo"></div>
  <div class="actions"><span class="like">♥ 128</span><span style="color:#45464f;font-size:13px;">💬 24 bình luận</span></div>
  <div class="caption">Set đồ dạo phố cuối tuần, ai cũng khen hợp mùa thu 🍂</div>
  <div class="comment"><div class="avatar"></div><div class="comment-body"><b>Minh Khuê</b> Phối màu đẹp quá!</div></div>
  <div class="comment"><div class="avatar"></div><div class="comment-body"><b>An Nhiên</b> Cho mình xin link áo với ạ</div></div>
</body></html>
```

Create `/tmp/community-save.html`:

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; font-family: system-ui, sans-serif; background:#faf9fb; }
  .header { padding:16px; background:#fff; border-bottom:1px solid #eee; }
  .header h1 { font-size:16px; color:#041c37; margin:0 0 4px 0; }
  .header p { font-size:12px; color:#45464f; margin:0; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:16px; }
  .card { border-radius:14px; overflow:hidden; background:#fff; box-shadow:0 2px 6px rgba(0,0,0,0.06); }
  .thumb { height:120px; }
  .c1 { background:linear-gradient(135deg,#4c5a88,#7b516d); }
  .c2 { background:linear-gradient(135deg,#7b516d,#e5c07b); }
  .c3 { background:linear-gradient(135deg,#4c5a88,#5fa8a0); }
  .c4 { background:linear-gradient(135deg,#e5c07b,#4c5a88); }
  .label { padding:8px; font-size:11px; font-weight:700; color:#041c37; }
</style></head>
<body>
  <div class="header"><h1>Bộ sưu tập của tôi</h1><p>12 outfit đã lưu</p></div>
  <div class="grid">
    <div class="card"><div class="thumb c1"></div><div class="label">Đi làm thanh lịch</div></div>
    <div class="card"><div class="thumb c2"></div><div class="label">Dạo phố cuối tuần</div></div>
    <div class="card"><div class="thumb c3"></div><div class="label">Tiệc tối sang trọng</div></div>
    <div class="card"><div class="thumb c4"></div><div class="label">Mùa thu năng động</div></div>
  </div>
</body></html>
```

- [ ] **Step 2: Screenshot each mockup**

```bash
UA="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
npx playwright screenshot -b chromium --viewport-size "390,844" --user-agent "$UA" "file:///tmp/community-share.html" "/tmp/community-share-raw.png"
npx playwright screenshot -b chromium --viewport-size "390,844" --user-agent "$UA" "file:///tmp/community-connect.html" "/tmp/community-connect-raw.png"
npx playwright screenshot -b chromium --viewport-size "390,844" --user-agent "$UA" "file:///tmp/community-save.html" "/tmp/community-save-raw.png"
```

View each — confirm the layout renders as designed (no broken CSS, gradients visible).

- [ ] **Step 3: Resize, compress, and place the final images**

```bash
python3 <<'EOF'
from PIL import Image

for src, dst in [
    ('/tmp/community-share-raw.png', 'frontend/public/home/feature-steps/community-share.jpg'),
    ('/tmp/community-connect-raw.png', 'frontend/public/home/feature-steps/community-connect.jpg'),
    ('/tmp/community-save-raw.png', 'frontend/public/home/feature-steps/community-save.jpg'),
]:
    img = Image.open(src).convert('RGB')
    width, height = img.size
    new_width = 480
    new_height = round(height * (new_width / width))
    img.resize((new_width, new_height), Image.LANCZOS).save(dst, quality=82)
    print(dst, new_width, new_height)
EOF
```

- [ ] **Step 4: Verify and commit**

```bash
ls -la frontend/public/home/feature-steps/community-*.jpg
git add frontend/public/home/feature-steps/community-share.jpg frontend/public/home/feature-steps/community-connect.jpg frontend/public/home/feature-steps/community-save.jpg
git commit -m "feat: add designed mockup illustrations for the Forum feature steps"
```

---

## Task 6: `FeatureSection` component

**Files:**
- Create: `frontend/components/home/FeatureSection.tsx`
- Test: `frontend/components/home/FeatureSection.test.tsx`

**Interfaces:**
- Consumes: `FEATURE_STEP_IMAGES` (Task 1), `PhoneMockupStepper` (Task 2).
- Produces: `FeatureSection` default export, props `{featureKey: 'colorTest' | 'outfit' | 'community'; accentClassName: string; cta: {label: string; onClick?: () => void; href?: string}}` — consumed by Task 7 (`FeatureShowcase.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/home/FeatureSection.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FeatureSection from './FeatureSection'

describe('FeatureSection', () => {
  it('renders the feature title and the CTA', () => {
    renderWithIntl(<FeatureSection featureKey="colorTest" accentClassName="text-secondary" cta={{ label: 'Kiểm Tra Ngay', onClick: vi.fn() }} />)
    expect(screen.getByRole('heading', { name: 'Màu sắc cá nhân' })).toBeInTheDocument()
    expect(screen.getByText('Kiểm Tra Ngay')).toBeInTheDocument()
  })

  it('shows the first step title/body by default', () => {
    renderWithIntl(<FeatureSection featureKey="colorTest" accentClassName="text-secondary" cta={{ label: 'Kiểm Tra Ngay', onClick: vi.fn() }} />)
    expect(screen.getAllByText('Khám phá sắc độ qua bài kiểm tra nhanh.').length).toBeGreaterThan(0)
  })

  it('switches the active step when a desktop step card is clicked', () => {
    renderWithIntl(<FeatureSection featureKey="colorTest" accentClassName="text-secondary" cta={{ label: 'Kiểm Tra Ngay', onClick: vi.fn() }} />)
    fireEvent.click(screen.getByText('Mở khóa cẩm nang màu sắc cá nhân.'))
    const stepButtons = screen.getAllByRole('button', { name: '2' })
    expect(stepButtons[0]).toHaveAttribute('aria-current', 'step')
  })

  it('calls the CTA onClick handler when clicked', () => {
    const onClick = vi.fn()
    renderWithIntl(<FeatureSection featureKey="colorTest" accentClassName="text-secondary" cta={{ label: 'Kiểm Tra Ngay', onClick }} />)
    fireEvent.click(screen.getByText('Kiểm Tra Ngay'))
    expect(onClick).toHaveBeenCalled()
  })

  it('renders the CTA as a link when href is given instead of onClick', () => {
    renderWithIntl(<FeatureSection featureKey="outfit" accentClassName="text-primary" cta={{ label: 'Bắt Đầu Phối Đồ Ngay', href: '/outfit/step-1' }} />)
    expect(screen.getByRole('link', { name: 'Bắt Đầu Phối Đồ Ngay' })).toHaveAttribute('href', '/outfit/step-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- components/home/FeatureSection.test.tsx
```

Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Create `frontend/components/home/FeatureSection.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import PhoneMockupStepper from './PhoneMockupStepper'
import { FEATURE_STEP_IMAGES, type FeatureKey } from '@/lib/featureShowcaseSteps'

type FeatureSectionProps = {
  featureKey: FeatureKey
  accentClassName: string
  cta: { label: string; onClick?: () => void; href?: string }
}

export default function FeatureSection({ featureKey, accentClassName, cta }: FeatureSectionProps) {
  const t = useTranslations(`Home.FeatureShowcase.features.${featureKey}`)
  const [activeStep, setActiveStep] = useState(0)
  const images = FEATURE_STEP_IMAGES[featureKey]

  const stepperImages = images.map((image, index) => ({
    key: image.key,
    src: image.src,
    alt: t(`steps.${image.key}.title`) || `Step ${index + 1}`,
  }))

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <PhoneMockupStepper images={stepperImages} activeIndex={activeStep} onSelect={setActiveStep} />
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-7">
        <h3 className={`text-headline-lg font-bold ${accentClassName}`}>{t('title')}</h3>

        <div className="space-y-2 lg:hidden">
          <h4 className="text-title-md font-bold text-on-surface">{t(`steps.${images[activeStep].key}.title`)}</h4>
          <p className="text-body-md text-on-surface-variant">{t(`steps.${images[activeStep].key}.body`)}</p>
        </div>

        <div className="hidden space-y-4 lg:block">
          {images.map((image, index) => (
            <button
              key={image.key}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-surface-container-lowest ${
                index === activeStep ? 'bg-surface-container-lowest' : ''
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-container-high text-headline-sm font-bold text-on-surface-variant">
                {index + 1}
              </span>
              <span>
                <span className="block text-title-md font-bold text-on-surface">{t(`steps.${image.key}.title`)}</span>
                <span className="mt-1 block text-body-md text-on-surface-variant">{t(`steps.${image.key}.body`)}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="pt-2">
          {cta.href ? (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              <span>{cta.label}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={cta.onClick}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              <span>{cta.label}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

Note: the desktop step-card `<button>`'s own number badge (plain `<span>`) is separate from `PhoneMockupStepper`'s numbered circles — clicking either sets the same `activeStep` state. Task 6's third test exercises exactly that synchronization: it clicks a desktop step card, then asserts the *stepper circle* (not the step card) picked up `aria-current="step"` — proving the two pieces share one source of truth rather than drifting independently.

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- components/home/FeatureSection.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/FeatureSection.tsx frontend/components/home/FeatureSection.test.tsx
git commit -m "feat: add FeatureSection, a titled feature block with a clickable step list"
```

---

## Task 7: Final integration — content, `FeatureShowcase.tsx`, tests

**Files:**
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/home/FeatureShowcase.tsx`
- Modify: `frontend/components/home/FeatureShowcase.test.tsx`

**Interfaces:**
- Consumes: `FeatureSection` (Task 6).

- [ ] **Step 1: Update `messages/vi.json`**

In `Home.FeatureShowcase`, delete the `tabs`, `outfitPanel`, `colorTestPanel`, and `communityPanel` keys entirely. Add a `features` object in their place (keep `badgePill`, `heading`, `subheading` untouched):

```json
"features": {
  "colorTest": {
    "title": "Màu sắc cá nhân",
    "cta": "Kiểm Tra Ngay",
    "steps": {
      "quiz": {
        "title": "Khám phá sắc độ qua bài kiểm tra nhanh.",
        "body": "Trả lời 10 câu hỏi ngắn gọn để hệ thống bước đầu phân tích sắc tố tự nhiên, tông da và độ tương phản trên khuôn mặt bạn."
      },
      "result": {
        "title": "Mở khóa cẩm nang màu sắc cá nhân.",
        "body": "Nhận kết quả phân tích chuyên sâu gồm nhóm mùa đặc trưng, palette màu chuẩn, các chỉ số màu sắc và gợi ý ứng dụng thực tế (trang phục, makeup, phụ kiện,...)"
      },
      "ar": {
        "title": "Kiểm chứng trực quan cùng công nghệ AR.",
        "body": "Bật camera ướm thử trực tiếp các dải màu thuộc nhóm mùa đó lên gương mặt để thấy rõ ngũ quan bừng sáng và tự tin kiểm tra độ tương thích ngay tức thì."
      }
    }
  },
  "outfit": {
    "title": "Phối đồ",
    "cta": "Bắt Đầu Phối Đồ Ngay",
    "steps": {
      "digitizeCloset": {
        "title": "Số hóa tủ đồ chỉ trong tích tắc",
        "body": "Tải lên từng món đồ bạn có. Hệ thống sẽ tự động nhận diện và phân loại ngăn nắp vào tủ đồ ảo của bạn."
      },
      "setPreferences": {
        "title": "Thiết lập gu và nhu cầu riêng",
        "body": "Lựa chọn dịp diện đồ, phong cách yêu thích hoặc mix-match chuẩn bảng màu cá nhân. Muốn đổi gió? Hãy bật tính năng gợi ý thêm item mới từ bên ngoài."
      },
      "chooseModel": {
        "title": "Chọn mẫu và dáng pose theo ý thích",
        "body": "Chọn người mẫu sẵn có cùng dáng đứng phù hợp nhất để dễ dàng hình dung tổng thể bộ trang phục khi mặc lên người."
      },
      "getOutfit": {
        "title": "Nhận ngay outfit hoàn chỉnh",
        "body": "Chiêm ngưỡng set đồ được AI phối sẵn chuẩn chỉnh theo từng đường nét, sẵn sàng để bạn tự tin diện ra ngoài."
      }
    }
  },
  "community": {
    "title": "Diễn đàn",
    "cta": "Khám Phá Diễn Đàn",
    "steps": {
      "share": {
        "title": "Chia sẻ phong cách cá nhân",
        "body": "Đăng tải outfit thường ngày với hình ảnh sắc nét và caption chia sẻ câu chuyện, ý tưởng phối đồ của riêng bạn."
      },
      "connect": {
        "title": "Kết nối và lan tỏa cảm hứng",
        "body": "Tương tác trực tiếp với cộng đồng mê thời trang qua từng lượt thả tim yêu thích và những dòng bình luận rôm rả."
      },
      "save": {
        "title": "Lưu giữ outfit tâm đắc",
        "body": "Tạo các bộ sưu tập riêng và lưu lại những bài đăng ấn tượng để mở ra tham khảo bất cứ khi nào cần lên đồ."
      }
    }
  }
}
```

- [ ] **Step 2: Update the failing test first**

Replace `frontend/components/home/FeatureShowcase.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FeatureShowcase from './FeatureShowcase'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('FeatureShowcase', () => {
  it('shows all three feature titles at once, with no tab switching', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    expect(screen.getByRole('heading', { name: 'Màu sắc cá nhân' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Phối đồ' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Diễn đàn' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('opens the QR modal from the Personal Color CTA', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm Tra Ngay'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })

  it('links the Outfit CTA to /outfit/step-1', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    expect(screen.getByRole('link', { name: 'Bắt Đầu Phối Đồ Ngay' })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('links the Forum CTA to /forum', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    expect(screen.getByRole('link', { name: 'Khám Phá Diễn Đàn' })).toHaveAttribute('href', '/forum')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- components/home/FeatureShowcase.test.tsx
```

Expected: FAIL — `FeatureShowcase.tsx` still has the old tab-based content.

- [ ] **Step 4: Rewrite `FeatureShowcase.tsx`**

Replace the full contents of `frontend/components/home/FeatureShowcase.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'
import FeatureSection from './FeatureSection'

export default function FeatureShowcase() {
  const t = useTranslations('Home.FeatureShowcase')
  const { openQrModal } = useQrModal()

  return (
    <section id="features-section" className="w-full bg-surface-container-lowest/60 py-space-xl">
      <div className="mx-auto max-w-7xl px-margin-desktop">
        <div className="mx-auto mb-16 flex max-w-3xl flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary-fixed px-3.5 py-1 text-label-sm text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            <span>{t('badgePill')}</span>
          </div>
          <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
          <p className="mt-2 text-body-lg text-on-surface-variant">{t('subheading')}</p>
        </div>
        <div className="flex flex-col gap-16">
          <FeatureSection
            featureKey="colorTest"
            accentClassName="text-secondary"
            cta={{ label: t('features.colorTest.cta'), onClick: openQrModal }}
          />
          <FeatureSection
            featureKey="outfit"
            accentClassName="text-primary"
            cta={{ label: t('features.outfit.cta'), href: '/outfit/step-1' }}
          />
          <FeatureSection
            featureKey="community"
            accentClassName="text-tertiary"
            cta={{ label: t('features.community.cta'), href: '/forum' }}
          />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- components/home/FeatureShowcase.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 6: Run the full test suite**

```bash
npm test
```

Expected: all tests pass. If `app/page.test.tsx` or any other file asserts old FeatureShowcase copy (e.g. old panel titles), update those assertions the same way Task 4 of the Hero plan did.

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Manually verify in a browser**

With the dev server running, open `/` and scroll to the features section. Confirm:
- No tab bar; three titled sections stacked vertically.
- Each section's phone mockup shows a real (or, for Diễn đàn, designed) screenshot; clicking a numbered circle or a desktop step card swaps it.
- Mobile width (<1024px): only the active step's title/body shows below the mockup; clicking a different circle updates both the image and the text.
- Desktop width (≥1024px): the full step list with all titles/bodies is visible at once, each clickable.
- Personal Color's CTA opens the QR modal; Outfit's and Forum's CTAs navigate to `/outfit/step-1` and `/forum`.

- [ ] **Step 9: Commit**

```bash
git add frontend/messages/vi.json frontend/components/home/FeatureShowcase.tsx frontend/components/home/FeatureShowcase.test.tsx
git commit -m "feat: redesign the Feature Showcase with titled sections and clickable step illustrations"
```
