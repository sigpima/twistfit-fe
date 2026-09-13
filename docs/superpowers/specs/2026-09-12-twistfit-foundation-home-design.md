# TwistFit — Foundation + Home Page (Design)

## Context

The Stitch-exported mockups in `stitch_personal_color_fashion_website/` define a
10-page design for TwistFit, a personal-color-analysis + virtual-try-on
fashion site (design tokens documented in
`stitch_personal_color_fashion_website/twistfit_atelier/DESIGN.md`). The
current Next.js app (`frontend/`) only has a placeholder home page with a
single button linking to `/camera-frame` (an existing, working live-camera
color-swatch overlay feature built in prior sessions).

This is too large for one pass, so the work is split into independent
sub-projects:

1. **Foundation + Home page** (this spec)
2. Personal Color result page
3. Virtual try-on flow (4-step wizard)
4. Static content pages (How it works, About us, FAQ, Blog)

The camera feature (`/camera-frame` and its components/hooks) is **out of
scope** here. It stays exactly as-is; it will be wired into the new design
(most likely behind the QR-scan modal) in a later sub-project. This spec only
removes the placeholder button linking to it from the home page.

## Goals

- Port the design system (colors, typography, spacing, radii) from
  `DESIGN.md` into the app's Tailwind v4 config so every future page can use
  the same tokens.
- Add shared `Header` / `Footer` layout so all future pages get consistent
  chrome for free.
- Rebuild `/` as the real TwistFit home page per the Stitch mockup
  (`trang_ch_twistfit_personal_color_fashion/`), replacing the placeholder.
- Establish the routing convention future sub-projects will follow.

## Non-goals

- Wiring the camera feature into anything.
- Building any page other than Home.
- Any real backend integration (contact form, QR-scan flow, auth) — visual
  only for now.

## Routing convention

Established now for consistency across all future sub-projects:

| Route | Page | Status |
|---|---|---|
| `/` | Home | Built in this spec |
| `/how-it-works` | Cách hoạt động | Later (sub-project 4) |
| `/about` | Về chúng tôi | Later (sub-project 4) |
| `/faq` | FAQ | Later (sub-project 4) |
| `/blog` | Blog | Later (sub-project 4) |
| `/personal-color/result` | Kết quả phân tích Personal Color | Later (sub-project 2) |
| `/outfit/step-1` .. `/outfit/step-4` | Luồng phối đồ ảo | Later (sub-project 3) |
| `/camera-frame` | Live camera color overlay | Existing, untouched |

`Header`/`Footer` link to these routes now even though most don't exist yet.
Until built, they 404 via Next's default not-found page — expected and
resolved as later sub-projects land.

## Architecture

- **`app/layout.tsx`**: load Montserrat via `next/font/google` (weights 400,
  500, 600, 700), add a `<link>` for the Material Symbols Outlined
  stylesheet, wrap `{children}` with `<QrModalProvider>`, `<Header />`,
  `<Footer />`.
- **`app/globals.css`**: add a Tailwind v4 `@theme` block mirroring the
  `DESIGN.md` front-matter — color tokens (`primary`, `on-surface`,
  `surface-container`, etc.), `--radius-*`, `--spacing-*` (`gutter`, `margin`,
  `space-sm` … `space-xl`), and composite `--text-*` tokens (`display-lg`,
  `headline-lg`, `body-md`, `label-lg`, etc., each with its paired
  `--text-*--line-height` / `--letter-spacing` / `--font-weight`) so classes
  like `bg-primary`, `text-on-surface`, `rounded-lg`, `px-margin-desktop`,
  `font-display-lg text-display-lg` work exactly as in the mockup.
- **`app/page.tsx`**: rewritten to compose the home-page components below.
  Delete the current placeholder implementation and `app/page.test.tsx`
  (superseded by new tests below).
- **`/camera-frame`** route, its components (`CameraView`, `FrameOverlay`,
  `FrameSwitcher`), hooks (`useCameraStream`), and libs (`palettes`,
  `frameCycle`, `wedgeGeometry`) are not modified.
- **Images**: download the 12 unique `lh3.googleusercontent.com` images
  referenced in the home-page mockup into `public/home/` with descriptive
  names (e.g. `logo.png`, `icon-mark.png`, `hero-model-winter.jpg`,
  `studio-outfit.png`, `model-shortsleeve.jpg`, `model-tee.jpg`,
  `model-longcurl.jpg`, `model-tall.jpg`, `model-tryon-result.jpg`,
  `street-outfit-hanoi.jpg`, `blazer-outfit.jpg`, `footer-logo.png`).
  Rendered with plain `<img>` tags (not `next/image`) to match the mockup's
  structure closely and avoid needing per-image intrinsic dimensions.

## Components & data flow

- `components/layout/Header.tsx` — static nav (About us, How it works, FAQ,
  Blog) per the routing table; CTA button "Kiểm tra Personal Color" calls
  `openQrModal()` from `useQrModal()`. No auth, so the profile icon is
  decorative (no menu).
- `components/layout/Footer.tsx` — static, mirrors the mockup's footer
  columns and links, using the same routing table.
- `components/qr-modal/QrModalProvider.tsx` — a small context (`useQrModal()`
  → `{ isOpen, openQrModal, closeQrModal }`) mounted once in `app/layout.tsx`.
  Renders `QrModal` itself so any component on any page can trigger it later
  without prop-drilling. Justified because 3+ buttons across the home page
  (and future pages) need to open the same modal.
- `components/qr-modal/QrModal.tsx` — the QR-scan dialog from the mockup
  (backdrop blur, inline QR SVG, close button, closes on backdrop click).
  Purely presentational; reads state from `useQrModal()`.
- `components/home/Hero.tsx` — hero section (headline, subcopy, stat badges,
  phone mockup visual, CTA buttons that call `openQrModal()` / scroll to
  features).
- `components/home/FeatureShowcase.tsx` — the "Ba Bước Đột Phá" section with
  3 tabs (Phối Đồ Thông Minh / Personal Color Test / Diễn Đàn Phong Cách).
  Owns its own `useState<0|1|2>` for the active tab; each panel is static
  content per the mockup.
- `components/home/ContactSection.tsx` — "Hòm Thư Góp Ý" form. Controlled
  inputs, `onSubmit` calls `preventDefault` and flips a local `submitted`
  boolean to show an inline "Đã gửi (demo)" confirmation. No network call —
  there is no backend yet.
- `app/page.tsx` composes `Hero`, `FeatureShowcase`, `ContactSection` in
  mockup order. `Header`/`Footer`/`QrModal` come from the root layout, not
  from this page.

## Error handling

No network calls exist on this page (contact form is a local-only stub, QR
modal has no camera logic yet). Images are bundled locally in `public/`, so
there's no runtime image-loading failure mode to handle. Nothing else to
handle at this stage.

## Testing

Following the repo's existing convention (Vitest + Testing Library, one
focused test file per component):

- `components/qr-modal/QrModalProvider.test.tsx` — `openQrModal`/`closeQrModal`
  toggle `isOpen`; `QrModal` renders only when open; backdrop click closes it.
- `components/home/FeatureShowcase.test.tsx` — clicking each tab shows the
  corresponding panel and hides the others.
- `app/page.test.tsx` — replaces the old placeholder test. Asserts the hero
  heading renders and that a hero CTA opens the QR modal (via
  `QrModalProvider` wrapper in the test).
- Existing `/camera-frame` tests (`CameraView.test.tsx`,
  `FrameOverlay.test.tsx`, `FrameSwitcher.test.tsx`, `useCameraStream.test.ts`,
  `frameCycle.test.ts`, `palettes.test.ts`, `wedgeGeometry.test.ts`) are left
  untouched.
