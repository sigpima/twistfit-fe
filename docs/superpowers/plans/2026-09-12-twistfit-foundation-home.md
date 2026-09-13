# TwistFit Foundation + Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the TwistFit design system into the Next.js app and rebuild `/` as the real home page from the Stitch mockup, replacing the placeholder camera-button page.

**Architecture:** Tailwind v4 `@theme` tokens ported from `DESIGN.md` power every color/spacing/typography class. Shared `Header`/`Footer` mount in the root layout so every future page gets them for free. A small `QrModalProvider` context (mounted once in the root layout) lets any button anywhere open the same QR-scan dialog without prop drilling. The home page itself is three components (`Hero`, `FeatureShowcase`, `ContactSection`) composed in `app/page.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (CSS-first `@theme` config, no `tailwind.config.js`), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-12-twistfit-foundation-home-design.md`

## Global Constraints

- No new npm dependencies — everything is built with what's already installed (Next, React, Tailwind v4, Vitest, Testing Library). Do not add an icon library or `next/image`.
- Icons use the Material Symbols Outlined font via a `<link>` stylesheet + `<span className="material-symbols-outlined">icon_name</span>`, exactly like the mockup.
- Images referenced by the home page are local files under `public/home/`, rendered with plain `<img>` tags (add `{/* eslint-disable-next-line @next/next/no-img-element */}` above each one — this repo's ESLint config flags raw `<img>`).
- `/camera-frame` and its components/hooks/libs (`CameraView`, `FrameOverlay`, `FrameSwitcher`, `useCameraStream`, `palettes`, `frameCycle`, `wedgeGeometry`, and their test files) must not be modified.
- Header/Footer nav links point to `/about`, `/how-it-works`, `/faq`, `/blog` even though those routes don't exist yet — they will 404 until later sub-projects build them. This is expected; do not create placeholder pages for them.
- Follow the existing test convention: Vitest + `@testing-library/react`, one test file per component, colocated next to the component (see `components/FrameSwitcher.tsx` / `components/FrameSwitcher.test.tsx` for the pattern).
- All UI copy is Vietnamese and must be copied verbatim from the source mockup at `stitch_personal_color_fashion_website/trang_ch_twistfit_personal_color_fashion/code.html` (already reproduced in full in this plan's tasks below — no need to re-open that file).

---

## Task 1: Port design tokens into Tailwind v4 theme

**Files:**
- Modify: `frontend/app/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes used by every later task — `bg-<token>` / `text-<token>` / `border-<token>` for all color tokens below, `rounded`/`rounded-lg`/`rounded-xl`/`rounded-full` (overridden) plus Tailwind's stock `rounded-sm`/`rounded-md`/`rounded-2xl`/`rounded-3xl` (left untouched), spacing utilities `p-gutter`, `px-margin-desktop`, `py-space-xl`, `gap-space-md`, etc. (any Tailwind spacing-consuming utility accepts these names), and typography utilities `text-display-lg`, `text-headline-lg`, `text-headline-md`, `text-headline-sm`, `text-title-md`, `text-body-lg`, `text-body-md`, `text-body-sm`, `text-label-lg`, `text-label-md`, `text-label-sm` (each sets font-size + line-height + font-weight, and letter-spacing where noted).

- [ ] **Step 1: Replace the contents of `frontend/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  /* Colors — ported from stitch_personal_color_fashion_website/twistfit_atelier/DESIGN.md */
  --color-surface: #f9f9ff;
  --color-surface-dim: #c7dbff;
  --color-surface-bright: #f9f9ff;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f0f3ff;
  --color-surface-container: #e7eeff;
  --color-surface-container-high: #dde9ff;
  --color-surface-container-highest: #d4e3ff;
  --color-on-surface: #041c37;
  --color-on-surface-variant: #45464f;
  --color-inverse-surface: #1c314d;
  --color-inverse-on-surface: #ebf1ff;
  --color-outline: #757680;
  --color-outline-variant: #c6c6d0;
  --color-surface-tint: #4f5d8b;
  --color-primary: #4c5a88;
  --color-on-primary: #ffffff;
  --color-primary-container: #6573a2;
  --color-on-primary-container: #fefcff;
  --color-inverse-primary: #b7c5f9;
  --color-secondary: #7b516d;
  --color-on-secondary: #ffffff;
  --color-secondary-container: #fdc8e9;
  --color-on-secondary-container: #7a506c;
  --color-tertiary: #615c48;
  --color-on-tertiary: #ffffff;
  --color-tertiary-container: #7a7560;
  --color-on-tertiary-container: #fffbff;
  --color-error: #ba1a1a;
  --color-on-error: #ffffff;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;
  --color-primary-fixed: #dbe1ff;
  --color-primary-fixed-dim: #b7c5f9;
  --color-on-primary-fixed: #071843;
  --color-on-primary-fixed-variant: #374571;
  --color-secondary-fixed: #ffd7ef;
  --color-secondary-fixed-dim: #ebb7d8;
  --color-on-secondary-fixed: #300f28;
  --color-on-secondary-fixed-variant: #613a55;
  --color-tertiary-fixed: #eae2c9;
  --color-tertiary-fixed-dim: #cdc6ae;
  --color-on-tertiary-fixed: #1f1c0c;
  --color-on-tertiary-fixed-variant: #4b4734;
  --color-background: #f9f9ff;
  --color-on-background: #041c37;
  --color-surface-variant: #d4e3ff;

  /* Radii — matches the Tailwind config actually embedded in the mockup's
     code.html (NOT the aspirational values in DESIGN.md's front-matter,
     which drifted from what the page was actually rendered with). Only
     DEFAULT/lg/xl/full are overridden; sm/md/2xl/3xl keep Tailwind's
     stock scale, exactly as the mockup left them. */
  --radius: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;

  /* Spacing — named tokens, used alongside Tailwind's numeric scale */
  --spacing-gutter: 1rem;
  --spacing-gutter-desktop: 1.5rem;
  --spacing-margin: 1.25rem;
  --spacing-margin-desktop: 2.5rem;
  --spacing-space-xs: 0.25rem;
  --spacing-space-sm: 0.5rem;
  --spacing-space-md: 1rem;
  --spacing-space-lg: 1.5rem;
  --spacing-space-xl: 2.25rem;

  /* Typography */
  --text-display-lg: 48px;
  --text-display-lg--line-height: 56px;
  --text-display-lg--letter-spacing: -0.02em;
  --text-display-lg--font-weight: 700;

  --text-display-lg-mobile: 34px;
  --text-display-lg-mobile--line-height: 42px;
  --text-display-lg-mobile--letter-spacing: -0.01em;
  --text-display-lg-mobile--font-weight: 700;

  --text-headline-lg: 32px;
  --text-headline-lg--line-height: 40px;
  --text-headline-lg--letter-spacing: -0.01em;
  --text-headline-lg--font-weight: 600;

  --text-headline-lg-mobile: 26px;
  --text-headline-lg-mobile--line-height: 34px;
  --text-headline-lg-mobile--font-weight: 600;

  --text-headline-md: 24px;
  --text-headline-md--line-height: 32px;
  --text-headline-md--font-weight: 600;

  --text-headline-sm: 20px;
  --text-headline-sm--line-height: 28px;
  --text-headline-sm--font-weight: 600;

  --text-title-md: 18px;
  --text-title-md--line-height: 24px;
  --text-title-md--font-weight: 500;

  --text-body-lg: 16px;
  --text-body-lg--line-height: 24px;
  --text-body-lg--font-weight: 400;

  --text-body-md: 14px;
  --text-body-md--line-height: 22px;
  --text-body-md--font-weight: 400;

  --text-body-sm: 12px;
  --text-body-sm--line-height: 18px;
  --text-body-sm--font-weight: 400;

  --text-label-lg: 14px;
  --text-label-lg--line-height: 20px;
  --text-label-lg--letter-spacing: 0.02em;
  --text-label-lg--font-weight: 600;

  --text-label-md: 12px;
  --text-label-md--line-height: 16px;
  --text-label-md--letter-spacing: 0.04em;
  --text-label-md--font-weight: 600;

  --text-label-sm: 11px;
  --text-label-sm--line-height: 14px;
  --text-label-sm--letter-spacing: 0.05em;
  --text-label-sm--font-weight: 500;
}

body {
  background: var(--color-surface);
  color: var(--color-on-surface);
  font-family: var(--font-montserrat), system-ui, sans-serif;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd frontend && npm run build`
Expected: build succeeds with no Tailwind/PostCSS errors. (There is no unit-testable behavior in a token file — this build is the verification step for this task instead of a Vitest test.)

- [ ] **Step 3: Commit**

```bash
git add frontend/app/globals.css
git commit -m "feat: port TwistFit design tokens into Tailwind v4 theme"
```

---

## Task 2: Download home-page image assets

**Files:**
- Create: `frontend/public/home/logo.png`
- Create: `frontend/public/home/icon-mark.png`
- Create: `frontend/public/home/hero-model-winter.png`
- Create: `frontend/public/home/studio-outfit.jpg`
- Create: `frontend/public/home/model-short-hair.jpg`
- Create: `frontend/public/home/model-long-curl.jpg`
- Create: `frontend/public/home/model-tall.jpg`
- Create: `frontend/public/home/model-tryon-result.jpg`
- Create: `frontend/public/home/street-outfit-hanoi.jpg`
- Create: `frontend/public/home/blazer-outfit.jpg`
- Create: `frontend/public/home/contact-logo.png`
- Create: `frontend/public/home/qr-logo.png`

**Interfaces:**
- Produces: the 12 local image paths under `/home/...` that Task 5 (Hero), Task 6 (FeatureShowcase), Task 7 (ContactSection), and Task 8 (QrModal) reference by exact filename.

- [ ] **Step 1: Create the directory and download each file**

```bash
mkdir -p frontend/public/home

curl -s -o frontend/public/home/logo.png "https://lh3.googleusercontent.com/aida-public/AB6AXuBV4fxD4pqPLe-_QJZA99ew-puVhE1iUiP85DnaFmb3hpbLeR9f6dcOAW_e4MZyoYQl6sc33v_EGf6CzmiyWYVDDTMl7csx8H0Xep5zHbhSOBf88BazgtKyYAdGa6BBBgFwfkguHysqvO0ynkUOiahTdzMkHwzWbFn-nLnWZ5g-U_zM30u62NrD3ChxS91wOEqk-gMh5jo0rOSobB8zIN4X2F75RLPc38Ioojn3hg_EyD6tJwuoJiLdKRJnmpl47rVTKg"

curl -s -o frontend/public/home/icon-mark.png "https://lh3.googleusercontent.com/aida-public/AB6AXuB2-xgz8CzA5DV8_JwA9zzSsQ23jUhijV6G9bMmyym7J8n6Cl4CrKPwv2Nw8AJMSiTj_utrBFUGmR23JUJNGqgduO6oJqTi8m8Lj3hdz-tnyGAbEHYyj7pYP_CvRHCa8Fy3xkeXiUj9TkEs4DF3br_FTalnoTQQ0ZCbibpytkXTVjoQ_6qTht5OlJsuPKoqECVQ34fzEeVs8JHOFtfIr5pc88sbZvE76sWuitkYNSVDpIBC14MrGlXmyWcczDRkIpy2fQ"

curl -s -o frontend/public/home/hero-model-winter.png "https://lh3.googleusercontent.com/aida-public/AB6AXuA5VOQxcJheGwh0Z9dgxucBjDwbTgLMvekvM77F7LEKpl5reRQ_bHS2nPbXWUX4dlp0QoVC4ZArXqwDM3gh2tYuaxQs-KvN7FcJZW1rJsftS7SKJL0zeLGfNp-2Miub7zuXYx39mYLreEZTYcDWP0es1Xrw721f0n85Bv8zzRM2lZP8xQaFrI8DpLP17YlEVe7GjAhD1nndJ9iU7iHEppD9U534GxxzVHNDJtyg7sDYB7P1sCEg1Csk"

curl -s -o frontend/public/home/studio-outfit.jpg "https://lh3.googleusercontent.com/aida-public/AB6AXuAVa-NEPlT48K4--_zmOb10CKfo1TlOzNxMUfLhOUbNJgGdebX-mwXffHVIA34WDkOKpRbjTbjrRokUu-5fI1XP1agJrljYvNAQck1ssSd8NpeLsLvkZEHZyoc-BrXFR-Zh2fEss1hDWLwJZM5eq26Eq-kLatlurbJBvIHDxFVGlRKwuZ8o7W2t8bsIBjA3ooBB-HcI27P8yh30OqX41jUWLdDYw_TJGWXAOftP7AhoArWDy4Jfyb1-"

curl -s -o frontend/public/home/model-short-hair.jpg "https://lh3.googleusercontent.com/aida-public/AB6AXuDlAVGUuth5ZpEuwZAmyEk9_KCU122L4DBIxmMiiq6nIw7ZbTbLMmwMeGkym6LDLWlAbb05c5ogdfSyZRpBMG7BVbhvCiOjJ3pI6iQ2BUZj9-rQ8JqeZ_9C8TCsWJlfl5VifoTEW8BvLIvHVXudBQ6gYxOtWJT2aU34__nBAbsxnsGkZvdBJXtQXFWpdFlj6ZdrBjKa7bZBWZQUBp01goe68JvKkq1HtvD0aAUHoaJD80Tk-LJwwVFj"

curl -s -o frontend/public/home/model-long-curl.jpg "https://lh3.googleusercontent.com/aida-public/AB6AXuBwUW4Z9ygwaN2DObK3L4kNtkxY91Q3gWHG4tjahnnJ8dGbCkDbfEo1-eY2RjyC0qgnbll3ERI-trYlX0gEyOmQmOri2YS-nqFJG24uLPop7ozBUIZhmr6dO5-485HEIF2ZbWLkwTclfjtS91C7x7vA5MKuOgAyfzBzPtv7YHy3o6qGoL7cscOkLje39dH3TpZ59uDKUulNO_04pn5MDBMa00PYyjCgeutm663eJaqgjkyFfVLGvbsN"

curl -s -o frontend/public/home/model-tall.jpg "https://lh3.googleusercontent.com/aida-public/AB6AXuAGsFFqmsOH8Ow5p7bY1o30w9VhDkmeCis110eG2b_DDV32vDB7le4sRrzEwhme4HJInHfuG4M225mTdeWGOER-AuOS99RVG0rBPefwh8oAoztCVWu3uRFaUG_lYVRZa1IkdWrhhTExIqY6g_Rrx0xqQxbO6R3k2yne3ekWRi2Gia9h1kOYDMuJh_Yu9u4y1hchg1Qejz0sPfBQTDALp8AgcYluRgbSSAL1oPypsIqaUW05LV5WaMr6"

curl -s -o frontend/public/home/model-tryon-result.jpg "https://lh3.googleusercontent.com/aida-public/AB6AXuBGaITImwKx3ykoLUnyePALU73u45uy5r5mJv9b70CrZastB4KqsxKFQQ_Lv6ywUhwKqtZ64vbHRUY3OeOiZbt2ztpzKhNi104nECPMzEij9KlsDaaOzp1WfkJasYCEHOGjXU5VWEMnZDKDSxz2c_BxBkTSohud-5elEsEPMQzcfi-ae3ine6RHlt_0Y9KgYpWvOb-vDx0dPhpyuRbEVmy5x-nRd67qYT037cntKFSsERB5XnF5dl8s"

curl -s -o frontend/public/home/street-outfit-hanoi.jpg "https://lh3.googleusercontent.com/aida-public/AB6AXuBDuLt3vK2-3TM7x9y56vCO1iZALZ7hUonz72DQzJc7QnMRnblbDYe7nI3NZKzQ0XJCvkMsj85Jr48RKZ5Y_3qVStnPE3WRaqSje_wLFDBobBgMMt1awRzf5ix9IoPzXs9q0KhoaBndKa-MEFjBSJHD-G8ByObwtQ9CHo7TlWLRtIxlp3JBnCuJ8Q9mEsRWbMs7tLx_b5nKZjcLvh39yn3TC-m2xgjIUzeCFZz_P2DnzYH3YZ_4dF9w"

curl -s -o frontend/public/home/blazer-outfit.jpg "https://lh3.googleusercontent.com/aida-public/AB6AXuD7PH40jaEAKjD_TWWHEADB2-C-Dj5jpusXv6SB2zGgKlpG2pA0LKtStKSb5QbPqxLLK6rS_4sCmUngo3Ap-TbEk_UkJCJ9AEB1GrewueFQ71SWzYAJS3GHlxolu0b5lGgmVkIxJ3tWAYYMurWdk9F8HHfbIlWWjNpgrFOsFX9-yWm9H4UnmNBuZc9saA5E8HnNQ1JKLkRXPOlHMRVqCVlIL3479zynYt7GPpEj-VuQqqz-qZa-wXUJ"

curl -s -o frontend/public/home/contact-logo.png "https://lh3.googleusercontent.com/aida-public/AB6AXuDR2qGyAaoRJmlRuUMmEKiskah4qDfO4CmpH-KjVE-ZzEHeP8-rghweqT9Lb74Dp41aWqOBNM6Ktfd0kDych8ndMQiu6WPPgVNHXoFp7hRzZLbBDNZVz6B9tYppwZf02H64fHbc-J-ZbEyrAT77uDN5T9-qb9PFoJU84qLfcKcnLj1cq8S3n4O4CPGcntiTINmtrYUxoaxihw6FZFCNx-gHLPHwohoIn9i01M80r2BPMa3Mz5PIRTSsAu4P0gjuUk_lJA"

curl -s -o frontend/public/home/qr-logo.png "https://lh3.googleusercontent.com/aida-public/AB6AXuCON1ys1z2go4otoTgdoLXGL_yBg8vYNF8qBwKvrXhaKzchEuX2u0zR9Qqm54ncgVjLJbx2JDlkOU2kGDSwCawHcLhR3Pyg_R8uOPwIlNJ34IDl6wqj_vow-m16NqKgEOKmTdCJbxEke2z0sSi2albwVxVDXgjk14swoS4XMb60EFjZ8HD9-l2Wl1WEVDypFh6GXjgR67sBdyt_rUBE0NGxsh7zaDoINQP1RrIQMEQj9_ZwV11peK3dCdhZmI2-hlVvNw"
```

- [ ] **Step 2: Verify all 12 files downloaded and are non-empty**

Run: `ls -la frontend/public/home/`
Expected: 12 files listed, each with a non-zero size (a few hundred KB range is normal; anything at 0 bytes means the download failed and must be retried).

- [ ] **Step 3: Commit**

```bash
git add frontend/public/home/
git commit -m "feat: add home page image assets"
```

---

## Task 3: QR modal (context provider + dialog)

**Files:**
- Create: `frontend/components/qr-modal/QrModalProvider.tsx`
- Create: `frontend/components/qr-modal/QrModal.tsx`
- Test: `frontend/components/qr-modal/QrModalProvider.test.tsx`

**Interfaces:**
- Consumes: `/home/qr-logo.png` (Task 2).
- Produces: `QrModalProvider` (component, wraps children), `useQrModal()` hook returning `{ isOpen: boolean; openQrModal: () => void; closeQrModal: () => void }` — this exact hook is imported by Header (Task 4), Hero (Task 5), and the Personal Color tab panel inside FeatureShowcase (Task 6).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/qr-modal/QrModalProvider.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QrModalProvider, useQrModal } from './QrModalProvider'

function TestConsumer() {
  const { openQrModal, closeQrModal } = useQrModal()
  return (
    <div>
      <button onClick={openQrModal}>open</button>
      <button onClick={closeQrModal}>close</button>
    </div>
  )
}

describe('QrModalProvider', () => {
  it('does not render the modal by default', () => {
    render(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    expect(screen.queryByText('Kiểm Tra Personal Color')).not.toBeInTheDocument()
  })

  it('opens the modal when openQrModal is called', () => {
    render(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })

  it('closes the modal when the close button is clicked', () => {
    render(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByLabelText('Đóng'))
    expect(screen.queryByText('Kiểm Tra Personal Color')).not.toBeInTheDocument()
  })

  it('closes the modal when the backdrop is clicked', () => {
    render(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByTestId('qr-modal-backdrop'))
    expect(screen.queryByText('Kiểm Tra Personal Color')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run components/qr-modal/QrModalProvider.test.tsx`
Expected: FAIL — `./QrModalProvider` cannot be found.

- [ ] **Step 3: Create `frontend/components/qr-modal/QrModal.tsx`**

```tsx
type QrModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function QrModal({ isOpen, onClose }: QrModalProps) {
  if (!isOpen) return null

  return (
    <div
      data-testid="qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-surface-container-lowest p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-secondary">
            <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
          </div>
          <h3 className="text-headline-sm font-bold text-on-surface">Kiểm Tra Personal Color</h3>
          <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">
            Quét mã QR bằng Camera điện thoại để mở bộ quét AI thời gian thực với độ chính xác cao nhất.
          </p>
          <div className="relative mt-6 flex flex-col items-center rounded-2xl bg-surface-container-low p-4 shadow-inner">
            <svg className="h-48 w-48 text-on-surface" fill="currentColor" viewBox="0 0 100 100">
              <rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="5" y="5" />
              <rect fill="currentColor" height="14" rx="2" width="14" x="11" y="11" />
              <rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="69" y="5" />
              <rect fill="currentColor" height="14" rx="2" width="14" x="75" y="11" />
              <rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="5" y="69" />
              <rect fill="currentColor" height="14" rx="2" width="14" x="11" y="75" />
              <rect height="4" rx="1" width="4" x="36" y="9" />
              <rect height="4" rx="1" width="4" x="44" y="9" />
              <rect height="4" rx="1" width="4" x="52" y="9" />
              <rect height="4" rx="1" width="4" x="60" y="9" />
              <rect height="4" rx="1" width="4" x="9" y="36" />
              <rect height="4" rx="1" width="4" x="9" y="44" />
              <rect height="4" rx="1" width="4" x="9" y="52" />
              <rect height="4" rx="1" width="4" x="9" y="60" />
              <rect fill="#4c5a88" height="8" rx="2" width="8" x="38" y="38" />
              <rect fill="#7b516d" height="8" rx="2" width="8" x="48" y="48" />
              <rect height="6" rx="1" width="6" x="38" y="58" />
              <rect height="6" rx="1" width="6" x="56" y="38" />
              <rect height="4" rx="1" width="8" x="68" y="46" />
              <rect height="6" rx="1" width="8" x="46" y="68" />
              <rect height="12" rx="2" width="12" x="76" y="68" />
              <rect height="10" rx="1" width="6" x="58" y="78" />
              <rect height="6" rx="1" width="10" x="68" y="86" />
              <rect height="6" rx="1" width="6" x="36" y="80" />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest p-1 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/qr-logo.png" alt="TwistFit Logo" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 text-label-md font-bold text-primary">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              Tương thích iPhone & Android
            </span>
            <p className="text-body-sm text-on-surface-variant">
              Không cần tải app • Quét và nhận kết quả tức thì
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `frontend/components/qr-modal/QrModalProvider.tsx`**

```tsx
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import QrModal from './QrModal'

type QrModalContextValue = {
  isOpen: boolean
  openQrModal: () => void
  closeQrModal: () => void
}

const QrModalContext = createContext<QrModalContextValue | null>(null)

export function QrModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const value: QrModalContextValue = {
    isOpen,
    openQrModal: () => setIsOpen(true),
    closeQrModal: () => setIsOpen(false),
  }

  return (
    <QrModalContext.Provider value={value}>
      {children}
      <QrModal isOpen={isOpen} onClose={value.closeQrModal} />
    </QrModalContext.Provider>
  )
}

export function useQrModal() {
  const context = useContext(QrModalContext)
  if (!context) {
    throw new Error('useQrModal must be used within a QrModalProvider')
  }
  return context
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd frontend && npx vitest run components/qr-modal/QrModalProvider.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add frontend/components/qr-modal/
git commit -m "feat: add QrModalProvider and QrModal dialog"
```

---

## Task 4: Header

**Files:**
- Create: `frontend/components/layout/Header.tsx`
- Test: `frontend/components/layout/Header.test.tsx`

**Interfaces:**
- Consumes: `useQrModal()` from `@/components/qr-modal/QrModalProvider` (Task 3), `/home/logo.png` (Task 2).
- Produces: default-exported `Header` component, no props.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/layout/Header.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('Header', () => {
  it('renders nav links to the expected routes', () => {
    render(
      <QrModalProvider>
        <Header />
      </QrModalProvider>
    )
    expect(screen.getByRole('link', { name: 'About us' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/how-it-works')
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
  })

  it('opens the QR modal when the CTA button is clicked', () => {
    render(
      <QrModalProvider>
        <Header />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm tra Personal Color'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run components/layout/Header.test.tsx`
Expected: FAIL — `./Header` cannot be found.

- [ ] **Step 3: Create `frontend/components/layout/Header.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'

const NAV_LINKS = [
  { href: '/about', label: 'About us' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
]

export default function Header() {
  const { openQrModal } = useQrModal()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e2e8f0]/80 bg-white/95 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/home/logo.png" alt="TwistFit Logo" className="h-12 w-auto object-contain" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#304461] transition-colors hover:text-[#7b89ba]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openQrModal}
            className="inline-flex items-center gap-2 rounded-full bg-[#7b89ba] px-5 py-2.5 text-xs font-medium tracking-wide text-white shadow-sm transition-all hover:bg-[#6875a6] hover:shadow"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <span>Kiểm tra Personal Color</span>
          </button>
          <button
            type="button"
            aria-label="Tài khoản"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f3ff] text-[#304461] transition-colors hover:bg-[#e2e8f0]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <svg className="ml-0.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run components/layout/Header.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/components/layout/Header.tsx frontend/components/layout/Header.test.tsx
git commit -m "feat: add site Header component"
```

---

## Task 5: Footer

**Files:**
- Create: `frontend/components/layout/Footer.tsx`
- Test: `frontend/components/layout/Footer.test.tsx`

**Interfaces:**
- Produces: default-exported `Footer` component, no props.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/layout/Footer.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('links footer nav items to the expected routes', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Về chúng tôi (About us)' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Cách hoạt động (How it works)' })).toHaveAttribute(
      'href',
      '/how-it-works'
    )
    expect(screen.getByRole('link', { name: 'Câu hỏi thường gặp (FAQ)' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: 'Tạp chí phong cách (Blog)' })).toHaveAttribute('href', '/blog')
  })

  it('renders the copyright line', () => {
    render(<Footer />)
    expect(screen.getByText(/2026 TwistFit Vietnam/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run components/layout/Footer.test.tsx`
Expected: FAIL — `./Footer` cannot be found.

- [ ] **Step 3: Create `frontend/components/layout/Footer.tsx`**

```tsx
import Link from 'next/link'

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'TikTok',
    path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.97-4.52V8.4a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.97.17z',
  },
  {
    label: 'Facebook',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'Pinterest',
    path: 'M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z',
  },
  {
    label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
]

export default function Footer() {
  return (
    <footer className="mt-20 w-full border-t border-[#e2e8f0] bg-white pb-8 pt-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 border-b border-[#f1f5f9] pb-12 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-black tracking-tight text-[#304461]">TwistFit</h3>
            <p className="text-xs italic text-[#7b89ba]">&quot;A little twist, a better fit&quot;</p>
            <p className="text-xs leading-relaxed text-[#64748b]">
              Nền tảng ứng dụng công nghệ AI Personal Color &amp; Virtual Fitting tiên phong, giúp bạn khám
              phá vẻ đẹp tự nhiên và nâng tầm phong cách thời trang cá nhân hóa.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">Tính năng chính</h4>
            <ul className="space-y-2.5 text-xs text-[#64748b]">
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Trắc nghiệm Personal Color AI
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Phòng thử đồ ảo TwistFit
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Phối đồ theo vóc dáng
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Bản tin xu hướng thời trang
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">Hỗ trợ &amp; thông tin</h4>
            <ul className="space-y-2.5 text-xs text-[#64748b]">
              <li>
                <Link href="/about" className="transition-colors hover:text-[#304461]">
                  Về chúng tôi (About us)
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="transition-colors hover:text-[#304461]">
                  Cách hoạt động (How it works)
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-[#304461]">
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-[#304461]">
                  Tạp chí phong cách (Blog)
                </Link>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">Liên hệ &amp; hợp tác</h4>
            <ul className="mb-5 space-y-2.5 text-xs text-[#64748b]">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7b89ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>support@twistfit.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7b89ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>Hotline: 1900 8899</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7b89ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Quận 1, TP. Hồ Chí Minh</span>
              </li>
            </ul>
            <div className="flex items-center gap-3 text-[#7b89ba]">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f3ff] transition-colors hover:bg-[#7b89ba] hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-[#94a3b8] md:flex-row">
          <p>© 2026 TwistFit Vietnam. All rights reserved. Nền tảng ứng dụng định hình phong cách cá nhân.</p>
          <p>Bản quyền thuộc về TwistFit Fashion AI.</p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run components/layout/Footer.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/components/layout/Footer.tsx frontend/components/layout/Footer.test.tsx
git commit -m "feat: add site Footer component"
```

---

## Task 6: Hero section

**Files:**
- Create: `frontend/components/home/Hero.tsx`
- Test: `frontend/components/home/Hero.test.tsx`

**Interfaces:**
- Consumes: `useQrModal()` (Task 3), `/home/icon-mark.png` + `/home/hero-model-winter.png` (Task 2).
- Produces: default-exported `Hero` component, no props.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/home/Hero.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Hero from './Hero'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('Hero', () => {
  it('renders the main headline', () => {
    render(
      <QrModalProvider>
        <Hero />
      </QrModalProvider>
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Khám Phá Bản Sắc Riêng Cùng/)
  })

  it('opens the QR modal when the camera CTA is clicked', () => {
    render(
      <QrModalProvider>
        <Hero />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm Tra Màu Sắc (Camera QR)'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run components/home/Hero.test.tsx`
Expected: FAIL — `./Hero` cannot be found.

- [ ] **Step 3: Create `frontend/components/home/Hero.tsx`**

```tsx
'use client'

import { useQrModal } from '@/components/qr-modal/QrModalProvider'

const PALETTE_SWATCHES = [
  '#1B365D',
  '#2E5B88',
  '#4C5A88',
  '#7B516D',
  '#9F2B68',
  '#C2185B',
  '#004D40',
  '#00695C',
  '#D4E3FF',
  '#FDC8E9',
  '#E0E0E0',
  '#1C314D',
]

export default function Hero() {
  const { openQrModal } = useQrModal()

  return (
    <section className="relative mx-auto w-full max-w-7xl px-margin-desktop py-space-xl lg:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="flex flex-col items-start space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-high px-4 py-1.5 text-label-md text-primary shadow-sm backdrop-blur-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/icon-mark.png" alt="Icon TwistFit" className="h-5 w-5 object-contain" />
            <span>Phiên bản nâng cấp TwistFit AI 2026</span>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          </div>
          <h1 className="text-display-lg tracking-tight text-on-surface">
            Khám Phá Bản Sắc Riêng Cùng{' '}
            <span className="text-primary underline decoration-secondary-container decoration-wavy decoration-2">
              Personal Color
            </span>{' '}
            &amp; Phối Đồ Thông Minh
          </h1>
          <p className="max-w-2xl text-body-lg text-on-surface-variant">
            Mỗi người là một bảng màu độc bản. TwistFit giúp bạn thấu hiểu sắc độ của chính mình, mở khóa
            phong cách ăn mặc thời thượng và tự tin tỏa sáng mỗi ngày.
          </p>
          <div className="flex w-full flex-wrap items-center gap-space-md pt-2 sm:w-auto">
            <button
              type="button"
              onClick={openQrModal}
              className="flex flex-1 transform items-center justify-center gap-space-sm rounded-full bg-primary px-7 py-3.5 text-label-lg text-on-primary shadow-[0_8px_20px_rgba(76,90,136,0.25)] transition-all hover:-translate-y-0.5 hover:bg-primary-container sm:flex-none"
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              <span>Kiểm Tra Màu Sắc (Camera QR)</span>
            </button>
            <a
              href="#features-section"
              className="flex flex-1 items-center justify-center gap-space-sm rounded-full bg-surface-container px-7 py-3.5 text-label-lg text-on-surface transition-all hover:bg-surface-container-high sm:flex-none"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">checkroom</span>
              <span>Bắt Đầu Phối Đồ Ngay</span>
            </a>
          </div>
          <div className="flex items-center gap-8 pt-6 text-on-surface-variant">
            <div className="flex -space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-label-md font-bold text-primary shadow-sm">
                LĐ
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-label-md font-bold text-secondary shadow-sm">
                MN
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed text-label-md font-bold text-tertiary shadow-sm">
                TH
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-label-sm font-bold text-primary shadow-sm">
                +98k
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
                <span className="ml-1 text-label-md font-bold text-on-surface">4.9/5</span>
              </div>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">Hơn 120.000 lượt phân tích màu sắc chuẩn xác</p>
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-center lg:col-span-5">
          <div className="relative w-full max-w-[340px] rounded-[44px] bg-surface-container-lowest p-3.5 shadow-[0_24px_50px_rgba(4,28,55,0.12)]">
            <div className="absolute left-1/2 top-6 z-30 h-4.5 w-28 -translate-x-1/2 rounded-full bg-on-surface" />
            <div className="flex w-full flex-col overflow-hidden rounded-[34px] bg-surface-container-low px-4 pb-4 pt-8">
              <div className="mb-2 flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary-container">
                    <span className="material-symbols-outlined text-[16px] text-secondary">palette</span>
                  </div>
                  <div>
                    <p className="text-label-sm font-bold text-on-surface">Kết Quả Personal Color</p>
                    <p className="text-[10px] text-on-surface-variant">Nhận diện bằng AI Camera</p>
                  </div>
                </div>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Cold Tone
                </span>
              </div>
              <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-surface-container shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/home/hero-model-winter.png"
                  alt="Chân dung minh hoạ kết quả Personal Color mùa Đông"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-xl bg-surface-container-lowest/80 p-2 backdrop-blur-md">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Mùa Phù Hợp</span>
                    <p className="text-[16px] font-bold leading-tight text-on-surface">Mùa Đông (Winter)</p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <span className="material-symbols-outlined text-[16px]">ac_unit</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-label-sm font-semibold text-on-surface">Bảng màu tôn da nhất</span>
                  <span className="text-[10px] font-bold text-primary">12 sắc thái</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {PALETTE_SWATCHES.map((hex) => (
                    <div key={hex} className="h-6 rounded-md shadow-xs" style={{ backgroundColor: hex }} />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex-1 rounded-xl bg-surface-container-lowest p-2 text-center">
                  <span className="material-symbols-outlined text-[18px] text-primary">checkroom</span>
                  <p className="text-[10px] font-medium text-on-surface">Đầm Dạ Hội</p>
                </div>
                <div className="flex-1 rounded-xl bg-surface-container-lowest p-2 text-center">
                  <span className="material-symbols-outlined text-[18px] text-secondary">brush</span>
                  <p className="text-[10px] font-medium text-on-surface">Son Berry Cold</p>
                </div>
                <div className="flex-1 rounded-xl bg-surface-container-lowest p-2 text-center">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">diamond</span>
                  <p className="text-[10px] font-medium text-on-surface">Bạc Platinum</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-6 flex items-center gap-3 rounded-2xl bg-surface-container-lowest/90 p-3.5 shadow-[0_12px_28px_rgba(4,28,55,0.08)] backdrop-blur-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <p className="text-label-sm font-bold text-on-surface">Độ chính xác 98.4%</p>
              <p className="text-body-sm text-on-surface-variant">Phân giải sắc tố da 3D</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run components/home/Hero.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/Hero.tsx frontend/components/home/Hero.test.tsx
git commit -m "feat: add home page Hero section"
```

---

## Task 7: FeatureShowcase (3-tab section)

**Files:**
- Create: `frontend/components/home/FeatureShowcase.tsx`
- Test: `frontend/components/home/FeatureShowcase.test.tsx`

**Interfaces:**
- Consumes: `useQrModal()` (Task 3); `/home/studio-outfit.jpg`, `/home/model-short-hair.jpg`, `/home/model-long-curl.jpg`, `/home/model-tall.jpg`, `/home/model-tryon-result.jpg`, `/home/street-outfit-hanoi.jpg`, `/home/blazer-outfit.jpg` (Task 2).
- Produces: default-exported `FeatureShowcase` component, no props. Renders a `<section id="features-section">` — the hero's "Bắt Đầu Phối Đồ Ngay" link (Task 6) anchors to this id.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/home/FeatureShowcase.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FeatureShowcase from './FeatureShowcase'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('FeatureShowcase', () => {
  it('shows the Phối Đồ Thông Minh panel by default', () => {
    render(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    expect(screen.getByText('Studio Thử Đồ Ảo AI')).toBeInTheDocument()
  })

  it('switches to the Personal Color Test panel when its tab is clicked', () => {
    render(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: /Personal Color Test/ }))
    expect(screen.getByText('Kết Quả Đo Sắc Tố Thực Tế')).toBeInTheDocument()
    expect(screen.queryByText('Studio Thử Đồ Ảo AI')).not.toBeInTheDocument()
  })

  it('switches to the Diễn Đàn Phong Cách panel when its tab is clicked', () => {
    render(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: /Diễn Đàn Phong Cách/ }))
    expect(screen.getByText('Cộng Đồng TwistFit Style Club')).toBeInTheDocument()
  })

  it('opens the QR modal from the Personal Color Test panel CTA', () => {
    render(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: /Personal Color Test/ }))
    fireEvent.click(screen.getByText('Mở Quét QR / Test Ngay'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run components/home/FeatureShowcase.test.tsx`
Expected: FAIL — `./FeatureShowcase` cannot be found.

- [ ] **Step 3: Create `frontend/components/home/FeatureShowcase.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'

const TABS = [
  { icon: 'styler', label: 'Phối Đồ Thông Minh' },
  { icon: 'palette', label: 'Personal Color Test' },
  { icon: 'forum', label: 'Diễn Đàn Phong Cách' },
] as const

export default function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section id="features-section" className="w-full bg-surface-container-lowest/60 py-space-xl">
      <div className="mx-auto max-w-7xl px-margin-desktop">
        <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary-fixed px-3.5 py-1 text-label-sm text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            <span>Hệ Sinh Thái Thời Trang Cá Nhân Hoá</span>
          </div>
          <h2 className="text-headline-lg text-on-surface">Ba Bước Đột Phá Nâng Tầm Phong Cách</h2>
          <p className="mt-2 text-body-lg text-on-surface-variant">
            Từ phân tích sinh trắc quang phổ đến trải nghiệm thử đồ ảo và kết nối hội những tín đồ mặc đẹp
            cùng hệ sắc tố.
          </p>
        </div>
        <div className="mb-10 flex justify-center overflow-x-auto pb-2">
          <div role="tablist" className="inline-flex gap-1 rounded-full bg-surface-container p-1.5 shadow-inner">
            {TABS.map((tab, index) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={activeTab === index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-label-lg transition-all ${
                  activeTab === index
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        {activeTab === 0 && <SmartOutfitPanel />}
        {activeTab === 1 && <PersonalColorPanel />}
        {activeTab === 2 && <CommunityPanel />}
      </div>
    </section>
  )
}

const OUTFIT_STEPS = [
  {
    step: '1',
    badge: 'bg-secondary-container text-on-secondary-fixed',
    title: 'Tải lên hoặc chọn items từ tủ đồ cá nhân',
    body: 'Chụp hình trang phục bất kỳ, AI thông minh sẽ tự động tách nền siêu tốc và phân loại vào danh mục áo, quần, váy hoặc phụ kiện.',
  },
  {
    step: '2',
    badge: 'bg-primary-fixed text-primary',
    title: 'Chọn người mẫu ảo theo vóc dáng',
    body: 'Chọn từ kho 40+ mẫu có sẵn đa dạng số đo hoặc tự tải lên ảnh toàn thân của chính bạn để cá nhân hóa tỷ lệ cơ thể tuyệt đối.',
  },
  {
    step: '3',
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Xem mô phỏng AI & Lưu công thức mặc đẹp',
    body: 'Chiêm ngưỡng outfit hiển thị sinh động, kiểm tra độ hòa hợp sắc thái và thêm ngay vào lookbook tuần để không bao giờ phải băn khoăn "Hôm nay mặc gì?".',
  },
]

function SmartOutfitPanel() {
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-low p-6 shadow-sm lg:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_fix_high</span>
            <h3 className="text-headline-sm text-on-surface">Studio Thử Đồ Ảo AI</h3>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
            Tự động tách nền
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-on-surface-variant">1. Chọn đồ</p>
            <div className="mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-surface-container p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/studio-outfit.jpg" alt="Áo peplum voan hồng pastel" className="h-full w-full object-contain" />
            </div>
            <div className="grid w-full grid-cols-3 gap-1">
              <div className="flex h-6 items-center justify-center rounded bg-primary-fixed text-[9px] font-bold text-primary">Áo</div>
              <div className="flex h-6 items-center justify-center rounded bg-surface-container text-[9px] text-on-surface-variant">Váy</div>
              <div className="flex h-6 items-center justify-center rounded bg-surface-container text-[9px] text-on-surface-variant">Kính</div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-on-surface-variant">2. Người mẫu</p>
            <div className="grid w-full grid-cols-2 gap-1.5">
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-short-hair.jpg" alt="Mẫu nữ tóc ngắn mặc áo phông trắng" className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-long-curl.jpg" alt="Mẫu nữ tóc dài xoăn nhẹ" className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-tall.jpg" alt="Mẫu nữ dáng cao gầy phong cách năng động" className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="flex aspect-square flex-col items-center justify-center rounded-lg bg-secondary-fixed text-secondary">
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                <span className="mt-0.5 text-[8px] font-bold">Tải ảnh</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-primary">3. Kết quả AI</p>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-container shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/model-tryon-result.jpg"
                alt="Người mẫu mặc thử áo lụa satin hồng pastel do AI ướm"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-1 right-1 rounded bg-on-surface/80 px-1.5 py-0.5 text-[8px] text-surface-container-lowest">
                Khớp 99%
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container-lowest px-2 pt-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">hd</span>
            <span className="text-label-sm text-on-surface">Chế độ hiển thị chất lượng cao HD</span>
          </div>
          <div className="flex h-5 w-10 items-center justify-end rounded-full bg-primary p-0.5">
            <div className="h-4 w-4 rounded-full bg-on-primary shadow-sm" />
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-primary">Tính năng trọng tâm 01</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">Phối Đồ Đa Năng Trong 3 Chạm</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Không còn nỗi lo mua quần áo online bị lệch form hay không hợp màu da. TwistFit tạo dựng phòng
            thay đồ ảo chuẩn xác đến từng nếp vải.
          </p>
        </div>
        <div className="space-y-4">
          {OUTFIT_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-high/40">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{item.title}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
          >
            <span>Thử Tính Năng Phối Đồ</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  )
}

const COLOR_TEST_STEPS = [
  {
    step: '1',
    badge: 'bg-secondary-container text-on-secondary-fixed',
    title: 'Quét mã QR bằng điện thoại',
    body: 'Mở camera máy ảnh quét mã để lập tức kết nối bộ quét nhận diện khuôn mặt trực tiếp mà không cần cài đặt thêm ứng dụng.',
  },
  {
    step: '2',
    badge: 'bg-primary-fixed text-primary',
    title: 'Căn chỉnh khuôn mặt trong 5 giây',
    body: 'Hệ thống tự động bù trừ ánh sáng, đo undertone (ấm/lạnh), sắc tố lòng đen mắt và độ tương phản tự nhiên của làn da.',
  },
  {
    step: '3',
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Nhận báo cáo 12 trang cá nhân hoá',
    body: 'Sở hữu cẩm nang chi tiết trọn đời: từ bảng màu "chân ái", màu son khử xỉn da đến loại trang sức giúp bạn tỏa sáng.',
  },
]

const SPECTRUM_METRICS = [
  { label: 'Độ sáng da', value: 68, color: 'bg-secondary' },
  { label: 'Sắc độ (Tone Lạnh)', value: 84, color: 'bg-primary' },
  { label: 'Độ tương phản tự nhiên', value: 76, color: 'bg-secondary-container' },
]

const SPECTRUM_RECOMMENDATIONS = [
  { icon: 'checkroom', badge: 'bg-primary-fixed text-primary', title: 'Trang phục', body: 'Xanh coban, hồng thạch anh' },
  { icon: 'brush', badge: 'bg-secondary-fixed text-secondary', title: 'Màu son', body: 'Hồng berry lạnh, đỏ mận' },
  { icon: 'diamond', badge: 'bg-tertiary-fixed text-tertiary', title: 'Phụ kiện', body: 'Bạc bạch kim, ngọc trai' },
]

function PersonalColorPanel() {
  const { openQrModal } = useQrModal()

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">palette</span>
            <span className="text-label-lg font-bold text-on-surface">Kết Quả Đo Sắc Tố Thực Tế</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#16a34a]">
            <span className="material-symbols-outlined text-[14px]">check_circle</span> Độ chính xác cao
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h4 className="text-label-md font-bold text-on-surface">Chỉ số phân giải quang phổ</h4>
            {SPECTRUM_METRICS.map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex justify-between text-xs font-medium">
                  <span className="text-on-surface-variant">{metric.label}</span>
                  <span className="font-bold text-on-surface">{metric.value} / 100</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className={`h-full rounded-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h4 className="text-label-md font-bold text-on-surface">Gợi ý ứng dụng thực tiễn</h4>
            {SPECTRUM_RECOMMENDATIONS.map((item) => (
              <div key={item.title} className="flex items-center gap-2 text-xs">
                <div className={`flex h-6 w-6 items-center justify-center rounded font-bold ${item.badge}`}>
                  <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">{item.title}</p>
                  <p className="text-[11px] text-on-surface-variant">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary-fixed/50 p-3">
          <span className="material-symbols-outlined text-[24px] text-secondary">phonelink_ring</span>
          <p className="text-body-sm text-on-secondary-fixed-variant">
            <strong>Gợi ý:</strong> Tính năng đạt kết quả tối ưu nhất khi sử dụng camera góc rộng trên điện
            thoại thông minh dưới ánh sáng tự nhiên.
          </p>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-secondary">Tính năng trọng tâm 02</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">Khám Phá Sắc Độ Mùa Cá Nhân</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Được bảo chứng bởi thuật toán phân tích màu sắc 12 mùa chuyên sâu từ Hàn Quốc kết hợp thị giác
            máy tính hiện đại.
          </p>
        </div>
        <div className="space-y-4">
          {COLOR_TEST_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{item.title}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={openQrModal}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-3.5 text-label-lg text-on-secondary shadow-md transition-all hover:bg-secondary/90"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            <span>Mở Quét QR / Test Ngay</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const COMMUNITY_POSTS = [
  {
    image: '/home/street-outfit-hanoi.jpg',
    alt: 'Outfit đường phố trench coat xanh pastel tại Hà Nội',
    tag: 'Mùa Hạ',
    tagColor: 'text-primary',
    author: 'An Nhiên',
    likes: 428,
    caption: 'Set đồ tone pastel nhẹ nhàng đi làm và cafe cuối tuần',
  },
  {
    image: '/home/blazer-outfit.jpg',
    alt: 'Set đồ blazer màu mận chín và trang sức bạc',
    tag: 'Mùa Đông',
    tagColor: 'text-secondary',
    author: 'Minh Khuê',
    likes: 852,
    caption: 'Công thức son mận chín và áo dạ đen cho ngày trở lạnh',
  },
]

const COMMUNITY_STEPS = [
  {
    step: '1',
    badge: 'bg-secondary-container text-on-secondary-fixed',
    title: 'Đăng tải lookbook & công thức outfit',
    body: 'Tự tin chia sẻ những set đồ hàng ngày, đánh dấu nhãn sắc độ cá nhân để giúp bạn bè cùng tông màu dễ dàng tham khảo.',
  },
  {
    step: '2',
    badge: 'bg-primary-fixed text-primary',
    title: 'Nhận feedback từ Stylist và cộng đồng',
    body: 'Gửi câu hỏi tư vấn cách phối phụ kiện hoặc lựa chọn kiểu cổ áo tôn dáng, nhận phản hồi tức thì từ cộng đồng sành điệu.',
  },
  {
    step: '3',
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Lưu vào bộ sưu tập cá nhân trong 1 chạm',
    body: 'Thả tim và gom những ý tưởng mix-match ưng ý vào album "Bộ sưu tập đã lưu" trên trang tài khoản của riêng bạn.',
  },
]

function CommunityPanel() {
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">groups</span>
            <span className="text-label-lg font-bold text-on-surface">Cộng Đồng TwistFit Style Club</span>
          </div>
          <span className="text-xs font-semibold text-primary">#CoolSummer #WinterVibe</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {COMMUNITY_POSTS.map((post) => (
            <div key={post.author} className="overflow-hidden rounded-2xl bg-surface-container-low shadow-sm">
              <div className="relative h-44 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.image} alt={post.alt} className="h-full w-full object-cover" />
                <span className={`absolute right-2 top-2 rounded-full bg-surface-container-lowest/80 px-2 py-0.5 text-[10px] font-bold ${post.tagColor}`}>
                  {post.tag}
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm font-bold text-on-surface">{post.author}</span>
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <span className="material-symbols-outlined text-[14px]">favorite</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] text-on-surface-variant">{post.caption}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container p-3">
          <span className="text-xs font-medium text-on-surface">Hơn 4,500 bài viết chia sẻ phong cách mỗi tháng</span>
          <span className="text-xs font-bold text-primary">Tham gia ngay →</span>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-tertiary">Tính năng trọng tâm 03</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">Không Gian Kết Nối Hội Tín Đồ Mặc Đẹp</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Học hỏi mẹo phối đồ từ những người bạn có cùng sắc thái da và cùng nhau xây dựng tủ đồ thông minh
            bền vững.
          </p>
        </div>
        <div className="space-y-4">
          {COMMUNITY_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{item.title}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-tertiary px-8 py-3.5 text-label-lg text-on-tertiary shadow-md transition-all hover:bg-tertiary/90"
          >
            <span>Khám Phá Diễn Đàn</span>
            <span className="material-symbols-outlined text-[18px]">explore</span>
          </a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run components/home/FeatureShowcase.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/FeatureShowcase.tsx frontend/components/home/FeatureShowcase.test.tsx
git commit -m "feat: add home page FeatureShowcase tabs section"
```

---

## Task 8: ContactSection

**Files:**
- Create: `frontend/components/home/ContactSection.tsx`
- Test: `frontend/components/home/ContactSection.test.tsx`

**Interfaces:**
- Consumes: `/home/contact-logo.png` (Task 2).
- Produces: default-exported `ContactSection` component, no props.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/home/ContactSection.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ContactSection from './ContactSection'

describe('ContactSection', () => {
  it('shows a confirmation message after submitting the form', () => {
    render(<ContactSection />)
    fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Linh Đan' } })
    fireEvent.change(screen.getByLabelText('Địa chỉ Email *'), { target: { value: 'linhdan@gmail.com' } })
    fireEvent.change(screen.getByLabelText('Chủ đề góp ý *'), { target: { value: 'other' } })
    fireEvent.change(screen.getByLabelText('Nội dung tin nhắn *'), { target: { value: 'Xin chào' } })
    fireEvent.click(screen.getByRole('button', { name: /GỬI LỜI NHẮN/ }))
    expect(screen.getByText(/Cảm ơn bạn/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run components/home/ContactSection.test.tsx`
Expected: FAIL — `./ContactSection` cannot be found.

- [ ] **Step 3: Create `frontend/components/home/ContactSection.tsx`**

```tsx
'use client'

import { useState, type FormEvent } from 'react'

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <section className="relative mt-12 w-full overflow-hidden bg-surface-container-low/80 py-space-xl">
      <div className="relative z-10 mx-auto max-w-7xl px-margin-desktop">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="flex flex-col space-y-6 lg:col-span-5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/contact-logo.png" alt="Logo TwistFit" className="h-12 w-12 object-contain" />
              <div>
                <span className="block text-headline-sm font-bold leading-none text-primary">TwistFit</span>
                <span className="text-body-sm text-on-surface-variant">A little twist, a better fit</span>
              </div>
            </div>
            <h3 className="text-headline-md text-on-surface">Chúng Tôi Luôn Lắng Nghe Ý Kiến Của Bạn</h3>
            <p className="text-body-md text-on-surface-variant">
              Bạn có câu hỏi về kết quả màu sắc, muốn hợp tác stylist hoặc muốn góp ý tính năng phối đồ? Hãy
              để lại lời nhắn cho đội ngũ cố vấn thời trang của TwistFit.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <span className="text-body-md">support@twistfit.vn</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <span className="text-body-md">1900 8899 (8:30 - 21:00 hàng ngày)</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <span className="text-body-md">TwistFit AI Studio, Quận 1, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_12px_36px_rgba(4,28,55,0.06)] lg:p-10">
              <div className="mb-6">
                <h4 className="text-headline-sm font-bold text-on-surface">Hòm Thư Góp Ý &amp; Đặt Lịch Tư Vấn</h4>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Vui lòng điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
                </p>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-label-md font-semibold text-on-surface">
                      Họ và tên *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Linh Đan"
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-label-md font-semibold text-on-surface">
                      Địa chỉ Email *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="linhdan@gmail.com"
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="text-label-md font-semibold text-on-surface">
                      Số điện thoại
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder="0909 xxx xxx"
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-subject" className="text-label-md font-semibold text-on-surface">
                      Chủ đề góp ý *
                    </label>
                    <select
                      id="contact-subject"
                      required
                      defaultValue=""
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface transition-colors focus:bg-surface-container-high focus:outline-none"
                    >
                      <option value="" disabled>
                        -- Chọn chủ đề --
                      </option>
                      <option value="color-test">Hỏi về kết quả Personal Color</option>
                      <option value="virtual-fitting">Góp ý tính năng Phòng Thử Đồ Ảo</option>
                      <option value="stylist">Đăng ký hợp tác Stylist / Fashion KOL</option>
                      <option value="other">Ý kiến đóng góp khác</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-label-md font-semibold text-on-surface">
                    Nội dung tin nhắn *
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="Chia sẻ suy nghĩ, góp ý hoặc yêu cầu hỗ trợ của bạn tại đây..."
                    className="w-full resize-none rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-label-sm text-primary">
                    {submitted ? 'Cảm ơn bạn! Lời nhắn đã được chuyển đến bộ phận chăm sóc TwistFit.' : ''}
                  </span>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container sm:w-auto"
                  >
                    <span>GỬI LỜI NHẮN</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run components/home/ContactSection.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add frontend/components/home/ContactSection.tsx frontend/components/home/ContactSection.test.tsx
git commit -m "feat: add home page ContactSection form"
```

---

## Task 9: Wire the root layout

**Files:**
- Modify: `frontend/app/layout.tsx`

**Interfaces:**
- Consumes: `QrModalProvider` (Task 3), `Header` (Task 4), `Footer` (Task 5).

- [ ] **Step 1: Replace the contents of `frontend/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'TwistFit — Personal Color & Phối Đồ Thông Minh',
  description:
    'TwistFit giúp bạn khám phá Personal Color của chính mình và phối đồ thông minh bằng AI.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={`${montserrat.variable} antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface text-on-surface">
        <QrModalProvider>
          <Header />
          {children}
          <Footer />
        </QrModalProvider>
      </body>
    </html>
  )
}
```

This repo has no test for `app/layout.tsx` (a root layout renders `<html>`/`<body>`, which Testing Library cannot mount in isolation) — verification is the manual check in Step 2, consistent with there being no pre-existing `layout.test.tsx` in this codebase.

- [ ] **Step 2: Manually verify in the browser**

Run: `cd frontend && npm run dev` and open `http://localhost:3000` (or the printed port).
Expected: the page loads with the Header pinned at the top, Montserrat font applied, and Material Symbols icons rendering as icons (not text words like "close" or "mail"). Stop the dev server after checking (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git add frontend/app/layout.tsx
git commit -m "feat: wire Header, Footer, and QrModalProvider into root layout"
```

---

## Task 10: Rebuild the home page

**Files:**
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/page.test.tsx`

**Interfaces:**
- Consumes: `Hero` (Task 6), `FeatureShowcase` (Task 7), `ContactSection` (Task 8).

- [ ] **Step 1: Replace the failing test in `frontend/app/page.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HomePage from './page'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('HomePage', () => {
  it('renders the hero headline', () => {
    render(
      <QrModalProvider>
        <HomePage />
      </QrModalProvider>
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Khám Phá Bản Sắc Riêng Cùng/)
  })

  it('opens the QR modal from the hero CTA', () => {
    render(
      <QrModalProvider>
        <HomePage />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm Tra Màu Sắc (Camera QR)'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd frontend && npx vitest run app/page.test.tsx`
Expected: FAIL — the old placeholder `HomePage` doesn't render an `<h1>` or the new CTA text.

- [ ] **Step 3: Replace `frontend/app/page.tsx`**

```tsx
import Hero from '@/components/home/Hero'
import FeatureShowcase from '@/components/home/FeatureShowcase'
import ContactSection from '@/components/home/ContactSection'

export default function HomePage() {
  return (
    <main className="w-full bg-surface">
      <div className="relative flex w-full flex-col overflow-hidden">
        <Hero />
        <FeatureShowcase />
        <ContactSection />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd frontend && npx vitest run app/page.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/app/page.tsx frontend/app/page.test.tsx
git commit -m "feat: rebuild home page from TwistFit design"
```

---

## Task 11: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `cd frontend && npm run test`
Expected: every test file passes, including the untouched `/camera-frame` tests (`CameraView.test.tsx`, `FrameOverlay.test.tsx`, `FrameSwitcher.test.tsx`, `useCameraStream.test.ts`, `frameCycle.test.ts`, `palettes.test.ts`, `wedgeGeometry.test.ts`) and every new test from Tasks 3–10.

- [ ] **Step 2: Run the linter**

Run: `cd frontend && npm run lint`
Expected: no errors.

- [ ] **Step 3: Run a production build**

Run: `cd frontend && npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 4: Manually verify the home page end-to-end**

Run: `cd frontend && npm run dev`, open the home page in a browser, and check against the mockup screenshot at `stitch_personal_color_fashion_website/trang_ch_twistfit_personal_color_fashion/screen.png`:
- Header sticky at top, logo + nav + "Kiểm tra Personal Color" button.
- Hero headline, CTA buttons, phone mockup visual with the 12-swatch palette grid.
- Clicking "Kiểm Tra Màu Sắc (Camera QR)" (hero) opens the QR modal; clicking the header CTA also opens it; the X button and clicking outside the dialog close it.
- The 3 feature tabs switch content correctly and don't visually jump/break layout.
- The contact form shows the confirmation message after submitting.
- Footer renders with all 4 columns.
- `/camera-frame` (open it directly by URL) still works exactly as before.

Stop the dev server after checking (Ctrl+C).

- [ ] **Step 5: Commit (only if Step 1–3 required fixes)**

If any fixes were needed to pass lint/build/tests, commit them now:

```bash
git add -A
git commit -m "fix: address lint/build/test issues from foundation + home page work"
```
