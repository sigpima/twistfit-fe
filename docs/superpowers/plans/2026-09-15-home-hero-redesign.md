# Home Hero Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home page Hero's static phone-mockup illustration and generic copy with new tagline/hook/benefit-bullet content and a real cross-fading background photo slideshow built from the user's own photo set.

**Architecture:** A new presentational `HeroSlideshow` component crossfades through a list of `{src, alt}` images on a 5s interval (skipped entirely if the user prefers reduced motion). `Hero.tsx` mounts it twice — once as a full-bleed mobile background with a dark gradient scrim behind the content, once inside a rounded desktop panel to the right of the content — each with its own pre-processed image set. The 33 source photos are processed once, up front, into two static file sets committed to `public/home/`; there is no runtime image pipeline.

**Tech Stack:** Next.js (App Router), TypeScript, TailwindCSS, next-intl, Vitest + React Testing Library (`renderWithIntl`), Python 3 + Pillow for the one-time image processing (not part of the app's runtime or build).

**Spec:** `frontend/docs/superpowers/specs/2026-09-15-home-hero-redesign-design.md`

## Global Constraints

- Exact copy (Vietnamese, verbatim from the spec): tagline `A LITTLE TWIST, A BETTER FIT`; heading `"Vặn nhẹ góc nhìn, tủ đồ hóa xinh, tự tin vừa vặn."`; three benefit bullets (outfit transform, personal color, community) — full text is in Task 4.
- No `next/image` anywhere in this codebase — plain `<img>` tags only, matching every other image in the app.
- Reuse the `lg:` breakpoint for the mobile/desktop split — that's what Hero's existing grid already keys off (`lg:grid-cols-12`, `lg:col-span-*`).
- Slideshow images are decorative, not content: `alt=""` on every `<img>`, wrapping element gets `aria-hidden="true"`.
- Crossfade every 5000ms; skip the interval entirely (render only the first image, no motion) when `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true.
- Desktop image panel target aspect ratio: 4:5. Mobile images: minimal cropping (sources are already ~2:3, close to ideal for a full-bleed portrait background) — resize and compress only.
- CTA buttons and the avatar/rating row keep their exact current JSX, translations, and behavior (`useQrModal`) — not touched by this plan except for surrounding text-color tweaks needed for the mobile dark backdrop.

---

## Task 1: Process the 33 source photos into mobile + desktop image sets

**Files:**
- Create (scratch, not committed): `/tmp/process-hero-images.py`
- Create (committed): `frontend/public/home/hero-slideshow/mobile/img-<n>.jpg` (33 files)
- Create (committed): `frontend/public/home/hero-slideshow/desktop/img-<n>.jpg` (33 files)

**Interfaces:**
- Produces: two directories of JPEGs, one file per source photo, named `img-<n>.jpg` where `<n>` is the numeric suffix from the source filename (`IMG_2852.JPG` → `img-2852.jpg`). Task 2 hardcodes the exact list of 33 numbers and builds `src` paths from this naming scheme — the filenames here must match exactly.

- [ ] **Step 1: Write the processing script**

Create `/tmp/process-hero-images.py`:

```python
#!/usr/bin/env python3
"""One-time processing of the Hero slideshow source photos into mobile/desktop sets."""
import os
from PIL import Image, ImageOps

SOURCE_DIR = "/home/nuc/Documents/project/fashion-web/resource/DGT MAR _ ẢNH CONTENT/DGT MAR _ ẢNH CONTENT"
MOBILE_DIR = "/home/nuc/Documents/project/fashion-web/frontend/public/home/hero-slideshow/mobile"
DESKTOP_DIR = "/home/nuc/Documents/project/fashion-web/frontend/public/home/hero-slideshow/desktop"
CONTACT_SHEET_PATH = "/tmp/hero-desktop-contact-sheet.jpg"

MOBILE_WIDTH = 960
DESKTOP_WIDTH = 800
DESKTOP_ASPECT = 4 / 5  # width:height
DEFAULT_TOP_FRACTION = 0.15

# After reviewing the contact sheet, add per-image overrides here, keyed by
# the numeric suffix from the source filename. Lower fraction keeps more of
# the TOP of the frame; higher keeps more of the BOTTOM. Example:
# {2870: 0.0} for a photo with a lot of empty space below the subject.
TOP_FRACTION_OVERRIDES: dict[int, float] = {}


def number_from_filename(filename: str) -> int:
    digits = "".join(ch for ch in filename if ch.isdigit())
    return int(digits)


def process_one(filename: str) -> None:
    number = number_from_filename(filename)
    image = ImageOps.exif_transpose(Image.open(os.path.join(SOURCE_DIR, filename)))
    width, height = image.size

    mobile_height = round(height * (MOBILE_WIDTH / width))
    mobile = image.resize((MOBILE_WIDTH, mobile_height), Image.LANCZOS)
    mobile.save(os.path.join(MOBILE_DIR, f"img-{number}.jpg"), quality=82)

    target_height = round(width / DESKTOP_ASPECT)
    top_fraction = TOP_FRACTION_OVERRIDES.get(number, DEFAULT_TOP_FRACTION)
    if target_height >= height:
        crop_box = (0, 0, width, height)
    else:
        crop_top = round((height - target_height) * top_fraction)
        crop_box = (0, crop_top, width, crop_top + target_height)
    cropped = image.crop(crop_box)
    desktop_height = round(DESKTOP_WIDTH / DESKTOP_ASPECT)
    desktop = cropped.resize((DESKTOP_WIDTH, desktop_height), Image.LANCZOS)
    desktop.save(os.path.join(DESKTOP_DIR, f"img-{number}.jpg"), quality=82)


def build_contact_sheet() -> None:
    files = sorted(os.listdir(DESKTOP_DIR))
    thumb_w, thumb_h = 200, 250
    cols = 6
    rows = (len(files) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * thumb_w, rows * thumb_h), "white")
    for index, filename in enumerate(files):
        thumb = Image.open(os.path.join(DESKTOP_DIR, filename)).resize((thumb_w, thumb_h))
        x = (index % cols) * thumb_w
        y = (index // cols) * thumb_h
        sheet.paste(thumb, (x, y))
    sheet.save(CONTACT_SHEET_PATH, quality=85)


def main() -> None:
    os.makedirs(MOBILE_DIR, exist_ok=True)
    os.makedirs(DESKTOP_DIR, exist_ok=True)
    source_files = sorted(f for f in os.listdir(SOURCE_DIR) if f.upper().endswith(".JPG"))
    print(f"Processing {len(source_files)} source photos...")
    for filename in source_files:
        process_one(filename)
    build_contact_sheet()
    print(f"Done. Contact sheet at {CONTACT_SHEET_PATH}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it**

```bash
python3 /tmp/process-hero-images.py
```

Expected: prints `Processing 33 source photos...` then `Done. Contact sheet at /tmp/hero-desktop-contact-sheet.jpg`.

- [ ] **Step 3: Review the contact sheet**

Open `/tmp/hero-desktop-contact-sheet.jpg`. It's a 6-column grid of every desktop crop, in filename order. Look for crops that clearly cut off a subject's head, or leave a lot of empty background where the subject should be — the default `DEFAULT_TOP_FRACTION = 0.15` biases toward keeping the top of the frame, which works for most of these photos but not photos with a lot of empty space *above* the subject (e.g. wide establishing shots where the subject sits low in the frame).

- [ ] **Step 4: Fix flagged crops**

For each photo that looked wrong, add its number to `TOP_FRACTION_OVERRIDES` in the script (try `0.4`–`0.6` for a photo where the subject sits in the lower half of the source frame), then re-run:

```bash
python3 /tmp/process-hero-images.py
```

Re-open the contact sheet and confirm the fix. Repeat until every crop looks reasonable.

- [ ] **Step 5: Verify the output**

```bash
ls frontend/public/home/hero-slideshow/mobile | wc -l
ls frontend/public/home/hero-slideshow/desktop | wc -l
du -sh frontend/public/home/hero-slideshow/
```

Expected: `33` for both counts; total directory size in the tens of MB, not hundreds (each file should be well under 300KB — if any file is much larger, the source photo may have unusual color depth; re-check that image specifically).

- [ ] **Step 6: Commit**

```bash
git add frontend/public/home/hero-slideshow/
git commit -m "feat: add processed Hero slideshow images (mobile + desktop crops)"
```

---

## Task 2: `lib/heroSlideshowImages.ts` — image list

**Files:**
- Create: `frontend/lib/heroSlideshowImages.ts`
- Test: `frontend/lib/heroSlideshowImages.test.ts`

**Interfaces:**
- Consumes: the file naming scheme from Task 1 (`img-<n>.jpg` in `public/home/hero-slideshow/{mobile,desktop}/`).
- Produces: `HeroSlideshowImage = { src: string; alt: string }`, `HERO_SLIDESHOW_MOBILE_IMAGES: HeroSlideshowImage[]`, `HERO_SLIDESHOW_DESKTOP_IMAGES: HeroSlideshowImage[]` — both consumed by Task 4's `Hero.tsx`.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/heroSlideshowImages.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { HERO_SLIDESHOW_MOBILE_IMAGES, HERO_SLIDESHOW_DESKTOP_IMAGES } from './heroSlideshowImages'

describe('heroSlideshowImages', () => {
  it('has 33 images in each set', () => {
    expect(HERO_SLIDESHOW_MOBILE_IMAGES).toHaveLength(33)
    expect(HERO_SLIDESHOW_DESKTOP_IMAGES).toHaveLength(33)
  })

  it('points the mobile set at the mobile directory and the desktop set at the desktop directory', () => {
    for (const image of HERO_SLIDESHOW_MOBILE_IMAGES) {
      expect(image.src).toMatch(/^\/home\/hero-slideshow\/mobile\/img-\d+\.jpg$/)
    }
    for (const image of HERO_SLIDESHOW_DESKTOP_IMAGES) {
      expect(image.src).toMatch(/^\/home\/hero-slideshow\/desktop\/img-\d+\.jpg$/)
    }
  })

  it('uses decorative empty alt text on every image', () => {
    for (const image of [...HERO_SLIDESHOW_MOBILE_IMAGES, ...HERO_SLIDESHOW_DESKTOP_IMAGES]) {
      expect(image.alt).toBe('')
    }
  })

  it('has unique src values within each set', () => {
    expect(new Set(HERO_SLIDESHOW_MOBILE_IMAGES.map((i) => i.src)).size).toBe(33)
    expect(new Set(HERO_SLIDESHOW_DESKTOP_IMAGES.map((i) => i.src)).size).toBe(33)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- lib/heroSlideshowImages.test.ts
```

Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Create `frontend/lib/heroSlideshowImages.ts`:

```ts
const IMAGE_NUMBERS = [
  2852, 2853, 2854, 2856, 2857, 2858, 2859, 2860, 2861, 2862, 2863, 2864,
  2865, 2866, 2867, 2868, 2869, 2870, 2871, 2872, 2874, 2875, 2876, 2877,
  2880, 2881, 2882, 2883, 2884, 2885, 2887, 2888, 2889,
] as const

export type HeroSlideshowImage = {
  src: string
  alt: string
}

export const HERO_SLIDESHOW_MOBILE_IMAGES: HeroSlideshowImage[] = IMAGE_NUMBERS.map((number) => ({
  src: `/home/hero-slideshow/mobile/img-${number}.jpg`,
  alt: '',
}))

export const HERO_SLIDESHOW_DESKTOP_IMAGES: HeroSlideshowImage[] = IMAGE_NUMBERS.map((number) => ({
  src: `/home/hero-slideshow/desktop/img-${number}.jpg`,
  alt: '',
}))
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- lib/heroSlideshowImages.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/heroSlideshowImages.ts frontend/lib/heroSlideshowImages.test.ts
git commit -m "feat: add the Hero slideshow's mobile and desktop image lists"
```

---

## Task 3: `HeroSlideshow` component

**Files:**
- Create: `frontend/components/home/HeroSlideshow.tsx`
- Test: `frontend/components/home/HeroSlideshow.test.tsx`
- Modify: `frontend/vitest.setup.ts`

**Interfaces:**
- Consumes: `HeroSlideshowImage` type from Task 2 (structurally — this component doesn't import from `lib/heroSlideshowImages.ts`, it just takes `images: HeroSlideshowImage[]` as a prop, keeping it independent of where the images come from).
- Produces: `HeroSlideshow` default export, props `{ images: { src: string; alt: string }[]; className?: string }` — consumed by Task 4's `Hero.tsx`.

- [ ] **Step 1: Add a default `matchMedia` polyfill to the shared test setup**

jsdom (this project's test environment) doesn't implement `window.matchMedia`, and this is the first component in the codebase to call it. Modify `frontend/vitest.setup.ts`:

```ts
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

afterEach(() => {
  cleanup()
})
```

This gives every test a safe default (`matches: false`, i.e. motion is not reduced) without having to touch any of the existing test files; a test that needs `matches: true` overrides it locally with `vi.stubGlobal('matchMedia', ...)`.

- [ ] **Step 2: Write the failing test**

Create `frontend/components/home/HeroSlideshow.test.tsx`:

```tsx
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import HeroSlideshow from './HeroSlideshow'

const IMAGES = [
  { src: '/a.jpg', alt: '' },
  { src: '/b.jpg', alt: '' },
]

function isVisible(img: Element) {
  return img.className.includes('opacity-100')
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('HeroSlideshow', () => {
  it('shows the first image at full opacity and the rest hidden initially', () => {
    const { container } = render(<HeroSlideshow images={IMAGES} />)
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(2)
    expect(isVisible(imgs[0])).toBe(true)
    expect(isVisible(imgs[1])).toBe(false)
  })

  it('crossfades to the next image after 5 seconds', () => {
    vi.useFakeTimers()
    const { container } = render(<HeroSlideshow images={IMAGES} />)
    vi.advanceTimersByTime(5000)
    const imgs = container.querySelectorAll('img')
    expect(isVisible(imgs[0])).toBe(false)
    expect(isVisible(imgs[1])).toBe(true)
  })

  it('does not advance when the user prefers reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    )
    vi.useFakeTimers()
    const { container } = render(<HeroSlideshow images={IMAGES} />)
    vi.advanceTimersByTime(10000)
    const imgs = container.querySelectorAll('img')
    expect(isVisible(imgs[0])).toBe(true)
  })

  it('renders a single image without crashing when only one image is given', () => {
    const { container } = render(<HeroSlideshow images={[IMAGES[0]]} />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- components/home/HeroSlideshow.test.tsx
```

Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 4: Write the implementation**

Create `frontend/components/home/HeroSlideshow.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

export type HeroSlideshowImage = {
  src: string
  alt: string
}

type HeroSlideshowProps = {
  images: HeroSlideshowImage[]
  className?: string
}

const INTERVAL_MS = 5000

export default function HeroSlideshow({ images, className }: HeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, INTERVAL_MS)
    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} aria-hidden="true">
      {images.map((image, index) => (
        <img
          key={image.src}
          src={image.src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- components/home/HeroSlideshow.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 6: Run the full test suite to check the `vitest.setup.ts` change didn't break anything**

```bash
npm test
```

Expected: all tests pass (the polyfill is additive and guarded by `if (!window.matchMedia)`, so it shouldn't affect any existing test).

- [ ] **Step 7: Commit**

```bash
git add frontend/components/home/HeroSlideshow.tsx frontend/components/home/HeroSlideshow.test.tsx frontend/vitest.setup.ts
git commit -m "feat: add HeroSlideshow, a crossfading background image component"
```

---

## Task 4: New Hero content, layout, and slideshow wiring

**Files:**
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/home/Hero.tsx`
- Modify: `frontend/components/home/Hero.test.tsx`

**Interfaces:**
- Consumes: `HeroSlideshow` from Task 3, `HERO_SLIDESHOW_MOBILE_IMAGES`/`HERO_SLIDESHOW_DESKTOP_IMAGES` from Task 2.

- [ ] **Step 1: Update `messages/vi.json`**

In the `Home.Hero` object, replace `versionBadge`, `heading`, and `subheading` with:

```json
"tagline": "A LITTLE TWIST, A BETTER FIT",
"heading": "“Vặn nhẹ góc nhìn, tủ đồ hóa xinh, tự tin vừa vặn.”",
"benefits": {
  "outfitTransform": "Nhìn tủ đồ qua một lăng kính hoàn toàn mới; thử hình dung mọi món đồ cũ đều được biến hóa thành outfit thời thượng chỉ trong vài giây.",
  "personalColor": "Hiểu rõ sắc da và những gam màu thực sự tôn vinh bạn; mua sắm thông minh hơn, mặc đẹp lâu bền hơn.",
  "community": "Lướt diễn đàn, trao đổi mẹo phối và cùng bạn bè nâng cấp phong cách mỗi ngày. Cạn kiệt ý tưởng lên đồ? Không bao giờ."
},
```

Leave `ctaPrimary`, `ctaSecondary`, `iconMarkAlt`, `avatarInitials`, `rating`, and `ratingCaption` exactly as they are. Delete the `phoneMock` and `accuracyBadge` objects entirely — they were only used by the phone-mockup markup this task removes.

- [ ] **Step 2: Update the failing test first**

Replace `frontend/components/home/Hero.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Hero from './Hero'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('Hero', () => {
  it('renders the main headline', () => {
    renderWithIntl(
      <QrModalProvider>
        <Hero />
      </QrModalProvider>
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Vặn nhẹ góc nhìn/)
  })

  it('renders the three benefit bullets', () => {
    renderWithIntl(
      <QrModalProvider>
        <Hero />
      </QrModalProvider>
    )
    expect(screen.getByText(/Nhìn tủ đồ qua một lăng kính hoàn toàn mới/)).toBeInTheDocument()
    expect(screen.getByText(/Hiểu rõ sắc da và những gam màu/)).toBeInTheDocument()
    expect(screen.getByText(/Lướt diễn đàn, trao đổi mẹo phối/)).toBeInTheDocument()
  })

  it('opens the QR modal when the camera CTA is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <Hero />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm Tra Màu Sắc (Camera QR)'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- components/home/Hero.test.tsx
```

Expected: FAIL — `Hero.tsx` still renders the old heading and has no benefit bullets.

- [ ] **Step 4: Rewrite `Hero.tsx`**

Replace the full contents of `frontend/components/home/Hero.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'
import HeroSlideshow from './HeroSlideshow'
import { HERO_SLIDESHOW_MOBILE_IMAGES, HERO_SLIDESHOW_DESKTOP_IMAGES } from '@/lib/heroSlideshowImages'

const BENEFIT_KEYS = ['outfitTransform', 'personalColor', 'community'] as const

export default function Hero() {
  const t = useTranslations('Home.Hero')
  const { openQrModal } = useQrModal()

  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0 lg:hidden">
        <HeroSlideshow images={HERO_SLIDESHOW_MOBILE_IMAGES} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/90" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-margin-desktop py-space-xl lg:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="flex flex-col items-start space-y-6 lg:col-span-7">
            <span className="text-label-md font-bold uppercase tracking-[0.2em] text-white lg:text-on-surface-variant">
              {t('tagline')}
            </span>
            <h1 className="text-display-lg tracking-tight text-white lg:text-on-surface">{t('heading')}</h1>
            <ul className="flex flex-col gap-space-sm">
              {BENEFIT_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-space-sm">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-on-surface lg:bg-primary lg:text-on-primary">
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </span>
                  <span className="text-body-lg text-white/90 lg:text-on-surface-variant">{t(`benefits.${key}`)}</span>
                </li>
              ))}
            </ul>
            <div className="flex w-full flex-wrap items-center gap-space-md pt-2 sm:w-auto">
              <button
                type="button"
                onClick={openQrModal}
                className="flex flex-1 transform items-center justify-center gap-space-sm rounded-full bg-primary px-7 py-3.5 text-label-lg text-on-primary shadow-[0_8px_20px_rgba(76,90,136,0.25)] transition-all hover:-translate-y-0.5 hover:bg-primary-container sm:flex-none"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span>{t('ctaPrimary')}</span>
              </button>
              <a
                href="#features-section"
                className="flex flex-1 items-center justify-center gap-space-sm rounded-full bg-surface-container px-7 py-3.5 text-label-lg text-on-surface transition-all hover:bg-surface-container-high sm:flex-none"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">checkroom</span>
                <span>{t('ctaSecondary')}</span>
              </a>
            </div>
            <div className="flex items-center gap-8 pt-6">
              <div className="flex -space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-label-md font-bold text-primary shadow-sm">
                  {t('avatarInitials.one')}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-label-md font-bold text-secondary shadow-sm">
                  {t('avatarInitials.two')}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed text-label-md font-bold text-tertiary shadow-sm">
                  {t('avatarInitials.three')}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-label-sm font-bold text-primary shadow-sm">
                  {t('avatarInitials.more')}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[#eab308]">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star_half
                  </span>
                  <span className="ml-1 text-label-md font-bold text-white lg:text-on-surface">{t('rating')}</span>
                </div>
                <p className="mt-0.5 text-body-sm text-white/80 lg:text-on-surface-variant">{t('ratingCaption')}</p>
              </div>
            </div>
          </div>
          <div className="hidden lg:col-span-5 lg:block">
            <div className="aspect-[4/5] w-full overflow-hidden rounded-[44px] shadow-[0_24px_50px_rgba(4,28,55,0.12)]">
              <HeroSlideshow images={HERO_SLIDESHOW_DESKTOP_IMAGES} className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- components/home/Hero.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 6: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Manually verify in a browser**

With the dev server running (`npm run dev`), open `/` and confirm:
- Desktop width (≥1024px): tagline/heading/bullets/CTAs/avatar row on the left in the page's normal light theme colors; a rounded, shadowed photo panel on the right cross-fading through the desktop image set every ~5s.
- Mobile width (<1024px): the same content in white text, anchored over a full-bleed photo background that cross-fades, with the gradient scrim keeping text readable regardless of which photo is showing.
- No layout shift or horizontal scroll at either width.

- [ ] **Step 9: Commit**

```bash
git add frontend/messages/vi.json frontend/components/home/Hero.tsx frontend/components/home/Hero.test.tsx
git commit -m "feat: redesign the home Hero with new copy and a background photo slideshow"
```
