# TwistFit i18n Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce `next-intl` as the single source of truth for all user-facing text, and migrate `Header`, `Footer`, `QrModal`, and the three Home page sections to it as the reference pattern for later sub-projects.

**Architecture:** `next-intl` in "without i18n routing" mode (no middleware, no `app/[locale]` segment, no URL prefix). A fixed `locale = 'vi'` is resolved in `i18n/request.ts` from a single `messages/vi.json` file. Every text-bearing component becomes (or already is) a Client Component using `useTranslations()`, wrapped once at the root by `NextIntlClientProvider`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `next-intl`, Vitest + `@testing-library/react`.

**Spec:** `docs/superpowers/specs/2026-09-12-i18n-foundation-design.md`

## Global Constraints

- No `/vi/...` URL prefix, no middleware, no `app/[locale]` route segment — locale resolution is a fixed value in `i18n/request.ts` for now.
- Only `vi` ships. No translation to any other language in this plan.
- Every component that renders translated text is a Client Component (`'use client'`) using `useTranslations()` — including components that are pure Server Components today (`Footer`).
- Messages live in one file, `messages/vi.json`, namespaced by PascalCase component name; leaf keys are `camelCase` and describe the string's role, not its literal content.
- Missing translation keys must fail loudly (next-intl's default behavior) — no custom fallback.
- Brand names / proper nouns (e.g. `Instagram`, `TikTok`, `Facebook`, `Pinterest`, `YouTube`) are never moved into the messages file.
- All work commits directly to `master` (no feature branch / worktree — established convention for this project).
- All commands below run from the `frontend/` directory.

---

## Task 1: Core i18n infrastructure + Header migration

**Files:**
- Modify: `frontend/package.json` (via `npm install`)
- Create: `frontend/messages/vi.json`
- Create: `frontend/i18n/request.ts`
- Modify: `frontend/next.config.ts`
- Create: `frontend/global.d.ts`
- Create: `frontend/test-utils/renderWithIntl.tsx`
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/components/layout/Header.tsx`
- Modify: `frontend/components/layout/Header.test.tsx`

**Interfaces:**
- Produces: `renderWithIntl(ui: ReactElement, options?: RenderOptions)` exported from `frontend/test-utils/renderWithIntl.tsx` — every later task's test file imports this instead of `@testing-library/react`'s `render`.
- Produces: `messages/vi.json` — a plain JSON object; every later task adds a new top-level or nested key to it.

- [ ] **Step 1: Install next-intl**

Run: `npm install next-intl`
Expected: `next-intl` added to `frontend/package.json` `dependencies` and `frontend/package-lock.json` updated.

- [ ] **Step 2: Write the failing test**

Replace the full contents of `frontend/components/layout/Header.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Header from './Header'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('Header', () => {
  it('renders nav links to the expected routes', () => {
    renderWithIntl(
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
    renderWithIntl(
      <QrModalProvider>
        <Header />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('Kiểm tra Personal Color'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: FAIL — `Failed to resolve import "@/test-utils/renderWithIntl"` (module doesn't exist yet).

- [ ] **Step 4: Create the messages file**

Create `frontend/messages/vi.json`:

```json
{
  "Header": {
    "nav": {
      "about": "About us",
      "howItWorks": "How it works",
      "faq": "FAQ",
      "blog": "Blog"
    },
    "checkPersonalColor": "Kiểm tra Personal Color",
    "accountAriaLabel": "Tài khoản"
  }
}
```

- [ ] **Step 5: Create the request config**

Create `frontend/i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async () => {
  const locale = 'vi'

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 6: Wrap next.config.ts with the next-intl plugin**

Replace the full contents of `frontend/next.config.ts`:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["172.16.1.43"],
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Add the type augmentation**

Create `frontend/global.d.ts`:

```ts
import messages from './messages/vi.json'

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages
  }
}
```

- [ ] **Step 8: Create the shared test helper**

Create `frontend/test-utils/renderWithIntl.tsx`:

```tsx
import { render, type RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import messages from '@/messages/vi.json'

export function renderWithIntl(ui: ReactElement, options?: RenderOptions) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
    options
  )
}
```

- [ ] **Step 9: Wire the provider into the root layout**

In `frontend/app/layout.tsx`, add the import and wrap the existing body content:

```tsx
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'
```

Replace the `<body>` contents:

```tsx
      <body className="flex min-h-screen flex-col bg-surface text-on-surface">
        <NextIntlClientProvider>
          <QrModalProvider>
            <Header />
            {children}
            <Footer />
          </QrModalProvider>
        </NextIntlClientProvider>
      </body>
```

- [ ] **Step 10: Migrate Header.tsx**

Replace the full contents of `frontend/components/layout/Header.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'

const NAV_LINKS = [
  { href: '/about', key: 'about' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/faq', key: 'faq' },
  { href: '/blog', key: 'blog' },
] as const

export default function Header() {
  const t = useTranslations('Header')
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
              {t(`nav.${link.key}`)}
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
            <span>{t('checkPersonalColor')}</span>
          </button>
          <button
            type="button"
            aria-label={t('accountAriaLabel')}
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

- [ ] **Step 11: Run test to verify it passes**

Run: `npx vitest run components/layout/Header.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 12: Run the full suite, lint, and build**

Run: `npm run test`
Expected: All existing tests still pass (the provider wiring in `app/layout.tsx` doesn't affect other components' unit tests, since those render components in isolation, not through the root layout).

Run: `npm run lint`
Expected: No errors or warnings.

Run: `npm run build`
Expected: Build succeeds, same route list as before.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json messages/vi.json i18n/request.ts next.config.ts global.d.ts test-utils/renderWithIntl.tsx app/layout.tsx components/layout/Header.tsx components/layout/Header.test.tsx
git commit -m "feat: add next-intl i18n foundation, migrate Header"
```

---

## Task 2: Footer migration

**Files:**
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/layout/Footer.tsx`
- Modify: `frontend/components/layout/Footer.test.tsx`

**Interfaces:**
- Consumes: `renderWithIntl` from `frontend/test-utils/renderWithIntl.tsx` (Task 1).

- [ ] **Step 1: Write the failing test**

Replace the full contents of `frontend/components/layout/Footer.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Footer from './Footer'

describe('Footer', () => {
  it('links footer nav items to the expected routes', () => {
    renderWithIntl(<Footer />)
    expect(screen.getByRole('link', { name: 'Về chúng tôi (About us)' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Cách hoạt động (How it works)' })).toHaveAttribute(
      'href',
      '/how-it-works'
    )
    expect(screen.getByRole('link', { name: 'Câu hỏi thường gặp (FAQ)' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: 'Tạp chí phong cách (Blog)' })).toHaveAttribute('href', '/blog')
  })

  it('renders the copyright line', () => {
    renderWithIntl(<Footer />)
    expect(screen.getByText(/2026 TwistFit Vietnam/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/layout/Footer.test.tsx`
Expected: FAIL — `Footer` still renders plain hardcoded text, but more importantly this locks in the target behavior before the component changes; since the text is currently identical, run this to confirm today's baseline passes with `renderWithIntl` wrapping alone (it will), then proceed — the real regression check is Step 4 after the component starts calling `useTranslations`.

- [ ] **Step 3: Add the Footer namespace to messages/vi.json**

Replace the full contents of `frontend/messages/vi.json`:

```json
{
  "Header": {
    "nav": {
      "about": "About us",
      "howItWorks": "How it works",
      "faq": "FAQ",
      "blog": "Blog"
    },
    "checkPersonalColor": "Kiểm tra Personal Color",
    "accountAriaLabel": "Tài khoản"
  },
  "Footer": {
    "brand": "TwistFit",
    "tagline": "\"A little twist, a better fit\"",
    "description": "Nền tảng ứng dụng công nghệ AI Personal Color & Virtual Fitting tiên phong, giúp bạn khám phá vẻ đẹp tự nhiên và nâng tầm phong cách thời trang cá nhân hóa.",
    "featuresHeading": "Tính năng chính",
    "features": {
      "colorTest": "Trắc nghiệm Personal Color AI",
      "virtualFitting": "Phòng thử đồ ảo TwistFit",
      "outfitByBodyShape": "Phối đồ theo vóc dáng",
      "newsletter": "Bản tin xu hướng thời trang"
    },
    "supportHeading": "Hỗ trợ & thông tin",
    "support": {
      "about": "Về chúng tôi (About us)",
      "howItWorks": "Cách hoạt động (How it works)",
      "faq": "Câu hỏi thường gặp (FAQ)",
      "blog": "Tạp chí phong cách (Blog)",
      "privacy": "Chính sách bảo mật"
    },
    "contactHeading": "Liên hệ & hợp tác",
    "email": "support@twistfit.vn",
    "hotline": "Hotline: 1900 8899",
    "address": "Quận 1, TP. Hồ Chí Minh",
    "copyright": "© 2026 TwistFit Vietnam. All rights reserved. Nền tảng ứng dụng định hình phong cách cá nhân.",
    "copyrightSecondary": "Bản quyền thuộc về TwistFit Fashion AI."
  }
}
```

- [ ] **Step 4: Migrate Footer.tsx**

Replace the full contents of `frontend/components/layout/Footer.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('Footer')

  return (
    <footer className="mt-20 w-full border-t border-[#e2e8f0] bg-white pb-8 pt-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 border-b border-[#f1f5f9] pb-12 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-black tracking-tight text-[#304461]">{t('brand')}</h3>
            <p className="text-xs italic text-[#7b89ba]">{t('tagline')}</p>
            <p className="text-xs leading-relaxed text-[#64748b]">{t('description')}</p>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">
              {t('featuresHeading')}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#64748b]">
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  {t('features.colorTest')}
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  {t('features.virtualFitting')}
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  {t('features.outfitByBodyShape')}
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  {t('features.newsletter')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">
              {t('supportHeading')}
            </h4>
            <ul className="space-y-2.5 text-xs text-[#64748b]">
              <li>
                <Link href="/about" className="transition-colors hover:text-[#304461]">
                  {t('support.about')}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="transition-colors hover:text-[#304461]">
                  {t('support.howItWorks')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-[#304461]">
                  {t('support.faq')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-[#304461]">
                  {t('support.blog')}
                </Link>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  {t('support.privacy')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">
              {t('contactHeading')}
            </h4>
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
                <span>{t('email')}</span>
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
                <span>{t('hotline')}</span>
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
                <span>{t('address')}</span>
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
          <p>{t('copyright')}</p>
          <p>{t('copyrightSecondary')}</p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/layout/Footer.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add messages/vi.json components/layout/Footer.tsx components/layout/Footer.test.tsx
git commit -m "feat: migrate Footer to next-intl"
```

---

## Task 3: QrModal + QrModalProvider migration

**Files:**
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/qr-modal/QrModal.tsx`
- Modify: `frontend/components/qr-modal/QrModalProvider.test.tsx`

**Interfaces:**
- Consumes: `renderWithIntl` from `frontend/test-utils/renderWithIntl.tsx` (Task 1).

- [ ] **Step 1: Write the failing test**

Replace the full contents of `frontend/components/qr-modal/QrModalProvider.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
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
    renderWithIntl(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    expect(screen.queryByText('Kiểm Tra Personal Color')).not.toBeInTheDocument()
  })

  it('opens the modal when openQrModal is called', () => {
    renderWithIntl(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByText('Kiểm Tra Personal Color')).toBeInTheDocument()
  })

  it('closes the modal when the close button is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <TestConsumer />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByLabelText('Đóng'))
    expect(screen.queryByText('Kiểm Tra Personal Color')).not.toBeInTheDocument()
  })

  it('closes the modal when the backdrop is clicked', () => {
    renderWithIntl(
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

- [ ] **Step 2: Run test to verify it still passes on the old component**

Run: `npx vitest run components/qr-modal/QrModalProvider.test.tsx`
Expected: PASS — `QrModal.tsx` hasn't changed yet, so this just confirms `renderWithIntl` doesn't break anything before the real migration in Step 4.

- [ ] **Step 3: Add the QrModal namespace to messages/vi.json**

In `frontend/messages/vi.json`, add a `"QrModal"` key as a sibling of `"Footer"` (after Footer's closing `}`, before the file's final closing `}`):

```json
  "QrModal": {
    "closeAriaLabel": "Đóng",
    "title": "Kiểm Tra Personal Color",
    "description": "Quét mã QR bằng Camera điện thoại để mở bộ quét AI thời gian thực với độ chính xác cao nhất.",
    "compatibility": "Tương thích iPhone & Android",
    "instructions": "Không cần tải app • Quét và nhận kết quả tức thì"
  }
```

The full file now reads:

```json
{
  "Header": {
    "nav": {
      "about": "About us",
      "howItWorks": "How it works",
      "faq": "FAQ",
      "blog": "Blog"
    },
    "checkPersonalColor": "Kiểm tra Personal Color",
    "accountAriaLabel": "Tài khoản"
  },
  "Footer": {
    "brand": "TwistFit",
    "tagline": "\"A little twist, a better fit\"",
    "description": "Nền tảng ứng dụng công nghệ AI Personal Color & Virtual Fitting tiên phong, giúp bạn khám phá vẻ đẹp tự nhiên và nâng tầm phong cách thời trang cá nhân hóa.",
    "featuresHeading": "Tính năng chính",
    "features": {
      "colorTest": "Trắc nghiệm Personal Color AI",
      "virtualFitting": "Phòng thử đồ ảo TwistFit",
      "outfitByBodyShape": "Phối đồ theo vóc dáng",
      "newsletter": "Bản tin xu hướng thời trang"
    },
    "supportHeading": "Hỗ trợ & thông tin",
    "support": {
      "about": "Về chúng tôi (About us)",
      "howItWorks": "Cách hoạt động (How it works)",
      "faq": "Câu hỏi thường gặp (FAQ)",
      "blog": "Tạp chí phong cách (Blog)",
      "privacy": "Chính sách bảo mật"
    },
    "contactHeading": "Liên hệ & hợp tác",
    "email": "support@twistfit.vn",
    "hotline": "Hotline: 1900 8899",
    "address": "Quận 1, TP. Hồ Chí Minh",
    "copyright": "© 2026 TwistFit Vietnam. All rights reserved. Nền tảng ứng dụng định hình phong cách cá nhân.",
    "copyrightSecondary": "Bản quyền thuộc về TwistFit Fashion AI."
  },
  "QrModal": {
    "closeAriaLabel": "Đóng",
    "title": "Kiểm Tra Personal Color",
    "description": "Quét mã QR bằng Camera điện thoại để mở bộ quét AI thời gian thực với độ chính xác cao nhất.",
    "compatibility": "Tương thích iPhone & Android",
    "instructions": "Không cần tải app • Quét và nhận kết quả tức thì"
  }
}
```

- [ ] **Step 4: Migrate QrModal.tsx**

Replace the full contents of `frontend/components/qr-modal/QrModal.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'

type QrModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function QrModal({ isOpen, onClose }: QrModalProps) {
  const t = useTranslations('QrModal')

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
          aria-label={t('closeAriaLabel')}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-secondary">
            <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
          </div>
          <h3 className="text-headline-sm font-bold text-on-surface">{t('title')}</h3>
          <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">{t('description')}</p>
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
              {t('compatibility')}
            </span>
            <p className="text-body-sm text-on-surface-variant">{t('instructions')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/qr-modal/QrModalProvider.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add messages/vi.json components/qr-modal/QrModal.tsx components/qr-modal/QrModalProvider.test.tsx
git commit -m "feat: migrate QrModal to next-intl"
```

---

## Task 4: Hero migration

**Files:**
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/home/Hero.tsx`
- Modify: `frontend/components/home/Hero.test.tsx`

**Interfaces:**
- Consumes: `renderWithIntl` from `frontend/test-utils/renderWithIntl.tsx` (Task 1).
- Introduces the `t.rich()` pattern for text with an embedded styled sub-span — later Home tasks reuse this for `FeatureShowcase`'s "tip" text.

- [ ] **Step 1: Write the failing test**

Replace the full contents of `frontend/components/home/Hero.test.tsx`:

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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Khám Phá Bản Sắc Riêng Cùng/)
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

- [ ] **Step 2: Run test to verify it still passes on the old component**

Run: `npx vitest run components/home/Hero.test.tsx`
Expected: PASS — confirms `renderWithIntl` alone doesn't break anything before Step 4's real migration.

- [ ] **Step 3: Add the Home.Hero namespace to messages/vi.json**

In `frontend/messages/vi.json`, add a top-level `"Home"` key as a sibling of `"QrModal"`:

```json
  "Home": {
    "Hero": {
      "versionBadge": "Phiên bản nâng cấp TwistFit AI 2026",
      "heading": "Khám Phá Bản Sắc Riêng Cùng <highlight>Personal Color</highlight> & Phối Đồ Thông Minh",
      "subheading": "Mỗi người là một bảng màu độc bản. TwistFit giúp bạn thấu hiểu sắc độ của chính mình, mở khóa phong cách ăn mặc thời thượng và tự tin tỏa sáng mỗi ngày.",
      "ctaPrimary": "Kiểm Tra Màu Sắc (Camera QR)",
      "ctaSecondary": "Bắt Đầu Phối Đồ Ngay",
      "iconMarkAlt": "Icon TwistFit",
      "avatarInitials": {
        "one": "LĐ",
        "two": "MN",
        "three": "TH",
        "more": "+98k"
      },
      "rating": "4.9/5",
      "ratingCaption": "Hơn 120.000 lượt phân tích màu sắc chuẩn xác",
      "phoneMock": {
        "resultTitle": "Kết Quả Personal Color",
        "resultSubtitle": "Nhận diện bằng AI Camera",
        "coldToneBadge": "Cold Tone",
        "modelImageAlt": "Chân dung minh hoạ kết quả Personal Color mùa Đông",
        "seasonLabel": "Mùa Phù Hợp",
        "seasonValue": "Mùa Đông (Winter)",
        "paletteHeading": "Bảng màu tôn da nhất",
        "paletteCount": "12 sắc thái",
        "itemDress": "Đầm Dạ Hội",
        "itemLipstick": "Son Berry Cold",
        "itemAccessory": "Bạc Platinum"
      },
      "accuracyBadge": {
        "title": "Độ chính xác 98.4%",
        "subtitle": "Phân giải sắc tố da 3D"
      }
    }
  }
```

This becomes the file's new final top-level key (after `"QrModal"`, before the file's closing `}`).

- [ ] **Step 4: Migrate Hero.tsx**

Replace the full contents of `frontend/components/home/Hero.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
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
  const t = useTranslations('Home.Hero')
  const { openQrModal } = useQrModal()

  return (
    <section className="relative mx-auto w-full max-w-7xl px-margin-desktop py-space-xl lg:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="flex flex-col items-start space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-high px-4 py-1.5 text-label-md text-primary shadow-sm backdrop-blur-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/icon-mark.png" alt={t('iconMarkAlt')} className="h-5 w-5 object-contain" />
            <span>{t('versionBadge')}</span>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          </div>
          <h1 className="text-display-lg tracking-tight text-on-surface">
            {t.rich('heading', {
              highlight: (chunks) => (
                <span className="text-primary underline decoration-secondary-container decoration-wavy decoration-2">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="max-w-2xl text-body-lg text-on-surface-variant">{t('subheading')}</p>
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
          <div className="flex items-center gap-8 pt-6 text-on-surface-variant">
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
                <span className="ml-1 text-label-md font-bold text-on-surface">{t('rating')}</span>
              </div>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">{t('ratingCaption')}</p>
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
                    <p className="text-label-sm font-bold text-on-surface">{t('phoneMock.resultTitle')}</p>
                    <p className="text-[10px] text-on-surface-variant">{t('phoneMock.resultSubtitle')}</p>
                  </div>
                </div>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {t('phoneMock.coldToneBadge')}
                </span>
              </div>
              <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-surface-container shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/home/hero-model-winter.png"
                  alt={t('phoneMock.modelImageAlt')}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-xl bg-surface-container-lowest/80 p-2 backdrop-blur-md">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {t('phoneMock.seasonLabel')}
                    </span>
                    <p className="text-[16px] font-bold leading-tight text-on-surface">
                      {t('phoneMock.seasonValue')}
                    </p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <span className="material-symbols-outlined text-[16px]">ac_unit</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-label-sm font-semibold text-on-surface">
                    {t('phoneMock.paletteHeading')}
                  </span>
                  <span className="text-[10px] font-bold text-primary">{t('phoneMock.paletteCount')}</span>
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
                  <p className="text-[10px] font-medium text-on-surface">{t('phoneMock.itemDress')}</p>
                </div>
                <div className="flex-1 rounded-xl bg-surface-container-lowest p-2 text-center">
                  <span className="material-symbols-outlined text-[18px] text-secondary">brush</span>
                  <p className="text-[10px] font-medium text-on-surface">{t('phoneMock.itemLipstick')}</p>
                </div>
                <div className="flex-1 rounded-xl bg-surface-container-lowest p-2 text-center">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">diamond</span>
                  <p className="text-[10px] font-medium text-on-surface">{t('phoneMock.itemAccessory')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-6 flex items-center gap-3 rounded-2xl bg-surface-container-lowest/90 p-3.5 shadow-[0_12px_28px_rgba(4,28,55,0.08)] backdrop-blur-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <p className="text-label-sm font-bold text-on-surface">{t('accuracyBadge.title')}</p>
              <p className="text-body-sm text-on-surface-variant">{t('accuracyBadge.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/home/Hero.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add messages/vi.json components/home/Hero.tsx components/home/Hero.test.tsx
git commit -m "feat: migrate Hero to next-intl"
```

---

## Task 5: FeatureShowcase migration — chrome, tabs, and the Outfit panel

**Files:**
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/home/FeatureShowcase.tsx`
- Modify: `frontend/components/home/FeatureShowcase.test.tsx`

**Interfaces:**
- Consumes: `renderWithIntl` from `frontend/test-utils/renderWithIntl.tsx` (Task 1).
- This task introduces `useTranslations('Home.FeatureShowcase')` in the file; Tasks 6 and 7 add more calls to the same `t` inside the same file's other panel functions, so they must each accept a `t` parameter or call their own `useTranslations('Home.FeatureShowcase')` — this task defines `SmartOutfitPanel` as a function taking no props and calling its own `useTranslations('Home.FeatureShowcase')` internally, and Tasks 6/7 follow the identical pattern for `PersonalColorPanel`/`CommunityPanel` (each panel function is only ever rendered as a Client Component descendant, so an extra `useTranslations` call per panel is cheap and keeps each panel self-contained).

- [ ] **Step 1: Write the failing test**

Replace the full contents of `frontend/components/home/FeatureShowcase.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FeatureShowcase from './FeatureShowcase'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'

describe('FeatureShowcase', () => {
  it('shows the Phối Đồ Thông Minh panel by default', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    expect(screen.getByText('Studio Thử Đồ Ảo AI')).toBeInTheDocument()
  })

  it('switches to the Personal Color Test panel when its tab is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: /Personal Color Test/ }))
    expect(screen.getByText('Kết Quả Đo Sắc Tố Thực Tế')).toBeInTheDocument()
    expect(screen.queryByText('Studio Thử Đồ Ảo AI')).not.toBeInTheDocument()
  })

  it('switches to the Diễn Đàn Phong Cách panel when its tab is clicked', () => {
    renderWithIntl(
      <QrModalProvider>
        <FeatureShowcase />
      </QrModalProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: /Diễn Đàn Phong Cách/ }))
    expect(screen.getByText('Cộng Đồng TwistFit Style Club')).toBeInTheDocument()
  })

  it('opens the QR modal from the Personal Color Test panel CTA', () => {
    renderWithIntl(
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

- [ ] **Step 2: Run test to verify it still passes on the old component**

Run: `npx vitest run components/home/FeatureShowcase.test.tsx`
Expected: PASS — confirms `renderWithIntl` alone doesn't break anything before this task's migration below.

- [ ] **Step 3: Add the Home.FeatureShowcase namespace (outfitPanel + shared keys) to messages/vi.json**

In `frontend/messages/vi.json`, add a `"FeatureShowcase"` key inside the existing `"Home"` object, as a sibling of `"Hero"`:

```json
    "FeatureShowcase": {
      "badgePill": "Hệ Sinh Thái Thời Trang Cá Nhân Hoá",
      "heading": "Ba Bước Đột Phá Nâng Tầm Phong Cách",
      "subheading": "Từ phân tích sinh trắc quang phổ đến trải nghiệm thử đồ ảo và kết nối hội những tín đồ mặc đẹp cùng hệ sắc tố.",
      "tabs": {
        "outfit": "Phối Đồ Thông Minh",
        "colorTest": "Personal Color Test",
        "community": "Diễn Đàn Phong Cách"
      },
      "outfitPanel": {
        "studioTitle": "Studio Thử Đồ Ảo AI",
        "autoBgRemovalBadge": "Tự động tách nền",
        "step1Label": "1. Chọn đồ",
        "garmentAlt": "Áo peplum voan hồng pastel",
        "tagTop": "Áo",
        "tagDress": "Váy",
        "tagGlasses": "Kính",
        "step2Label": "2. Người mẫu",
        "modelShortHairAlt": "Mẫu nữ tóc ngắn mặc áo phông trắng",
        "modelLongCurlAlt": "Mẫu nữ tóc dài xoăn nhẹ",
        "modelTallAlt": "Mẫu nữ dáng cao gầy phong cách năng động",
        "uploadPhoto": "Tải ảnh",
        "step3Label": "3. Kết quả AI",
        "tryonResultAlt": "Người mẫu mặc thử áo lụa satin hồng pastel do AI ướm",
        "matchBadge": "Khớp 99%",
        "hdModeLabel": "Chế độ hiển thị chất lượng cao HD",
        "featureTag": "Tính năng trọng tâm 01",
        "panelHeading": "Phối Đồ Đa Năng Trong 3 Chạm",
        "panelBody": "Không còn nỗi lo mua quần áo online bị lệch form hay không hợp màu da. TwistFit tạo dựng phòng thay đồ ảo chuẩn xác đến từng nếp vải.",
        "steps": {
          "uploadItems": {
            "title": "Tải lên hoặc chọn items từ tủ đồ cá nhân",
            "body": "Chụp hình trang phục bất kỳ, AI thông minh sẽ tự động tách nền siêu tốc và phân loại vào danh mục áo, quần, váy hoặc phụ kiện."
          },
          "chooseModel": {
            "title": "Chọn người mẫu ảo theo vóc dáng",
            "body": "Chọn từ kho 40+ mẫu có sẵn đa dạng số đo hoặc tự tải lên ảnh toàn thân của chính bạn để cá nhân hóa tỷ lệ cơ thể tuyệt đối."
          },
          "viewResult": {
            "title": "Xem mô phỏng AI & Lưu công thức mặc đẹp",
            "body": "Chiêm ngưỡng outfit hiển thị sinh động, kiểm tra độ hòa hợp sắc thái và thêm ngay vào lookbook tuần để không bao giờ phải băn khoăn \"Hôm nay mặc gì?\"."
          }
        },
        "cta": "Thử Tính Năng Phối Đồ"
      }
    }
```

- [ ] **Step 4: Migrate the top of FeatureShowcase.tsx (header, tabs, SmartOutfitPanel)**

In `frontend/components/home/FeatureShowcase.tsx`, replace from the top of the file through the end of `SmartOutfitPanel` (i.e. everything up to, but not including, the `const COLOR_TEST_STEPS = [` line) with:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'

const TABS = [
  { icon: 'styler', key: 'outfit' },
  { icon: 'palette', key: 'colorTest' },
  { icon: 'forum', key: 'community' },
] as const

export default function FeatureShowcase() {
  const t = useTranslations('Home.FeatureShowcase')
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section id="features-section" className="w-full bg-surface-container-lowest/60 py-space-xl">
      <div className="mx-auto max-w-7xl px-margin-desktop">
        <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary-fixed px-3.5 py-1 text-label-sm text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            <span>{t('badgePill')}</span>
          </div>
          <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
          <p className="mt-2 text-body-lg text-on-surface-variant">{t('subheading')}</p>
        </div>
        <div className="mb-10 flex justify-center overflow-x-auto pb-2">
          <div role="tablist" className="inline-flex gap-1 rounded-full bg-surface-container p-1.5 shadow-inner">
            {TABS.map((tab, index) => (
              <button
                key={tab.key}
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
                <span>{t(`tabs.${tab.key}`)}</span>
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
  { step: '1', badge: 'bg-secondary-container text-on-secondary-fixed', key: 'uploadItems' },
  { step: '2', badge: 'bg-primary-fixed text-primary', key: 'chooseModel' },
  { step: '3', badge: 'bg-tertiary-fixed text-on-tertiary-fixed', key: 'viewResult' },
] as const

function SmartOutfitPanel() {
  const t = useTranslations('Home.FeatureShowcase')

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-low p-6 shadow-sm lg:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_fix_high</span>
            <h3 className="text-headline-sm text-on-surface">{t('outfitPanel.studioTitle')}</h3>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
            {t('outfitPanel.autoBgRemovalBadge')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-on-surface-variant">{t('outfitPanel.step1Label')}</p>
            <div className="mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-surface-container p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/studio-outfit.jpg" alt={t('outfitPanel.garmentAlt')} className="h-full w-full object-contain" />
            </div>
            <div className="grid w-full grid-cols-3 gap-1">
              <div className="flex h-6 items-center justify-center rounded bg-primary-fixed text-[9px] font-bold text-primary">
                {t('outfitPanel.tagTop')}
              </div>
              <div className="flex h-6 items-center justify-center rounded bg-surface-container text-[9px] text-on-surface-variant">
                {t('outfitPanel.tagDress')}
              </div>
              <div className="flex h-6 items-center justify-center rounded bg-surface-container text-[9px] text-on-surface-variant">
                {t('outfitPanel.tagGlasses')}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-on-surface-variant">{t('outfitPanel.step2Label')}</p>
            <div className="grid w-full grid-cols-2 gap-1.5">
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-short-hair.jpg" alt={t('outfitPanel.modelShortHairAlt')} className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-long-curl.jpg" alt={t('outfitPanel.modelLongCurlAlt')} className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-tall.jpg" alt={t('outfitPanel.modelTallAlt')} className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="flex aspect-square flex-col items-center justify-center rounded-lg bg-secondary-fixed text-secondary">
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                <span className="mt-0.5 text-[8px] font-bold">{t('outfitPanel.uploadPhoto')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-primary">{t('outfitPanel.step3Label')}</p>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-container shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/model-tryon-result.jpg"
                alt={t('outfitPanel.tryonResultAlt')}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-1 right-1 rounded bg-on-surface/80 px-1.5 py-0.5 text-[8px] text-surface-container-lowest">
                {t('outfitPanel.matchBadge')}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container-lowest px-2 pt-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">hd</span>
            <span className="text-label-sm text-on-surface">{t('outfitPanel.hdModeLabel')}</span>
          </div>
          <div className="flex h-5 w-10 items-center justify-end rounded-full bg-primary p-0.5">
            <div className="h-4 w-4 rounded-full bg-on-primary shadow-sm" />
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-primary">{t('outfitPanel.featureTag')}</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">{t('outfitPanel.panelHeading')}</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">{t('outfitPanel.panelBody')}</p>
        </div>
        <div className="space-y-4">
          {OUTFIT_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-high/40">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{t(`outfitPanel.steps.${item.key}.title`)}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{t(`outfitPanel.steps.${item.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
          >
            <span>{t('outfitPanel.cta')}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  )
}
```

Leave everything from `const COLOR_TEST_STEPS = [` to the end of the file (the `PersonalColorPanel` and `CommunityPanel` functions) untouched for now — Tasks 6 and 7 migrate them.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/home/FeatureShowcase.test.tsx`
Expected: PASS (4 tests) — the two tests that click into `PersonalColorPanel`/`CommunityPanel` still pass because those panels are unchanged and still render their original hardcoded text.

- [ ] **Step 6: Commit**

```bash
git add messages/vi.json components/home/FeatureShowcase.tsx components/home/FeatureShowcase.test.tsx
git commit -m "feat: migrate FeatureShowcase outfit panel to next-intl"
```

---

## Task 6: FeatureShowcase migration — PersonalColorPanel

**Files:**
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/home/FeatureShowcase.tsx`

**Interfaces:**
- Consumes: the `Home.FeatureShowcase` namespace pattern established in Task 5.

- [ ] **Step 1: Add the outfitPanel's sibling keys for PersonalColorPanel to messages/vi.json**

In `frontend/messages/vi.json`, inside `"Home"."FeatureShowcase"`, add a `"colorTestPanel"` key as a sibling of `"outfitPanel"`:

```json
      "colorTestPanel": {
        "resultTitle": "Kết Quả Đo Sắc Tố Thực Tế",
        "accuracyBadge": "Độ chính xác cao",
        "spectrumHeading": "Chỉ số phân giải quang phổ",
        "metrics": {
          "brightness": "Độ sáng da",
          "coolTone": "Sắc độ (Tone Lạnh)",
          "contrast": "Độ tương phản tự nhiên"
        },
        "recommendationsHeading": "Gợi ý ứng dụng thực tiễn",
        "recommendations": {
          "outfit": { "title": "Trang phục", "body": "Xanh coban, hồng thạch anh" },
          "lipstick": { "title": "Màu son", "body": "Hồng berry lạnh, đỏ mận" },
          "accessory": { "title": "Phụ kiện", "body": "Bạc bạch kim, ngọc trai" }
        },
        "tip": "<bold>Gợi ý:</bold> Tính năng đạt kết quả tối ưu nhất khi sử dụng camera góc rộng trên điện thoại thông minh dưới ánh sáng tự nhiên.",
        "featureTag": "Tính năng trọng tâm 02",
        "panelHeading": "Khám Phá Sắc Độ Mùa Cá Nhân",
        "panelBody": "Được bảo chứng bởi thuật toán phân tích màu sắc 12 mùa chuyên sâu từ Hàn Quốc kết hợp thị giác máy tính hiện đại.",
        "steps": {
          "scanQr": {
            "title": "Quét mã QR bằng điện thoại",
            "body": "Mở camera máy ảnh quét mã để lập tức kết nối bộ quét nhận diện khuôn mặt trực tiếp mà không cần cài đặt thêm ứng dụng."
          },
          "alignFace": {
            "title": "Căn chỉnh khuôn mặt trong 5 giây",
            "body": "Hệ thống tự động bù trừ ánh sáng, đo undertone (ấm/lạnh), sắc tố lòng đen mắt và độ tương phản tự nhiên của làn da."
          },
          "getReport": {
            "title": "Nhận báo cáo 12 trang cá nhân hoá",
            "body": "Sở hữu cẩm nang chi tiết trọn đời: từ bảng màu \"chân ái\", màu son khử xỉn da đến loại trang sức giúp bạn tỏa sáng."
          }
        },
        "cta": "Mở Quét QR / Test Ngay"
      }
```

- [ ] **Step 2: Verify the existing tests still pass before migrating (baseline)**

Run: `npx vitest run components/home/FeatureShowcase.test.tsx`
Expected: PASS (4 tests) — the messages file change alone doesn't affect the still-hardcoded `PersonalColorPanel`.

- [ ] **Step 3: Migrate PersonalColorPanel**

In `frontend/components/home/FeatureShowcase.tsx`, replace the `COLOR_TEST_STEPS`, `SPECTRUM_METRICS`, `SPECTRUM_RECOMMENDATIONS` constants and the `PersonalColorPanel` function (everything from `const COLOR_TEST_STEPS = [` through the end of `function PersonalColorPanel() { ... }`) with:

```tsx
const COLOR_TEST_STEPS = [
  { step: '1', badge: 'bg-secondary-container text-on-secondary-fixed', key: 'scanQr' },
  { step: '2', badge: 'bg-primary-fixed text-primary', key: 'alignFace' },
  { step: '3', badge: 'bg-tertiary-fixed text-on-tertiary-fixed', key: 'getReport' },
] as const

const SPECTRUM_METRICS = [
  { key: 'brightness', value: 68, color: 'bg-secondary' },
  { key: 'coolTone', value: 84, color: 'bg-primary' },
  { key: 'contrast', value: 76, color: 'bg-secondary-container' },
] as const

const SPECTRUM_RECOMMENDATIONS = [
  { icon: 'checkroom', badge: 'bg-primary-fixed text-primary', key: 'outfit' },
  { icon: 'brush', badge: 'bg-secondary-fixed text-secondary', key: 'lipstick' },
  { icon: 'diamond', badge: 'bg-tertiary-fixed text-tertiary', key: 'accessory' },
] as const

function PersonalColorPanel() {
  const t = useTranslations('Home.FeatureShowcase')
  const { openQrModal } = useQrModal()

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">palette</span>
            <span className="text-label-lg font-bold text-on-surface">{t('colorTestPanel.resultTitle')}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#16a34a]">
            <span className="material-symbols-outlined text-[14px]">check_circle</span> {t('colorTestPanel.accuracyBadge')}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h4 className="text-label-md font-bold text-on-surface">{t('colorTestPanel.spectrumHeading')}</h4>
            {SPECTRUM_METRICS.map((metric) => (
              <div key={metric.key}>
                <div className="mb-1 flex justify-between text-xs font-medium">
                  <span className="text-on-surface-variant">{t(`colorTestPanel.metrics.${metric.key}`)}</span>
                  <span className="font-bold text-on-surface">{metric.value} / 100</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className={`h-full rounded-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h4 className="text-label-md font-bold text-on-surface">{t('colorTestPanel.recommendationsHeading')}</h4>
            {SPECTRUM_RECOMMENDATIONS.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-xs">
                <div className={`flex h-6 w-6 items-center justify-center rounded font-bold ${item.badge}`}>
                  <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">{t(`colorTestPanel.recommendations.${item.key}.title`)}</p>
                  <p className="text-[11px] text-on-surface-variant">{t(`colorTestPanel.recommendations.${item.key}.body`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary-fixed/50 p-3">
          <span className="material-symbols-outlined text-[24px] text-secondary">phonelink_ring</span>
          <p className="text-body-sm text-on-secondary-fixed-variant">
            {t.rich('colorTestPanel.tip', { bold: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-secondary">{t('colorTestPanel.featureTag')}</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">{t('colorTestPanel.panelHeading')}</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">{t('colorTestPanel.panelBody')}</p>
        </div>
        <div className="space-y-4">
          {COLOR_TEST_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{t(`colorTestPanel.steps.${item.key}.title`)}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{t(`colorTestPanel.steps.${item.key}.body`)}</p>
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
            <span>{t('colorTestPanel.cta')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
```

Leave the `COMMUNITY_POSTS`, `COMMUNITY_STEPS` constants and `CommunityPanel` function (the rest of the file) untouched — Task 7 migrates them.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/home/FeatureShowcase.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add messages/vi.json components/home/FeatureShowcase.tsx
git commit -m "feat: migrate FeatureShowcase color-test panel to next-intl"
```

---

## Task 7: FeatureShowcase migration — CommunityPanel

**Files:**
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/home/FeatureShowcase.tsx`

**Interfaces:**
- Consumes: the `Home.FeatureShowcase` namespace pattern established in Tasks 5–6. This is the last task touching `FeatureShowcase.tsx`.

- [ ] **Step 1: Add the communityPanel key to messages/vi.json**

In `frontend/messages/vi.json`, inside `"Home"."FeatureShowcase"`, add a `"communityPanel"` key as a sibling of `"colorTestPanel"` (now the last key in `FeatureShowcase`):

```json
      "communityPanel": {
        "title": "Cộng Đồng TwistFit Style Club",
        "hashtags": "#CoolSummer #WinterVibe",
        "posts": {
          "anNhien": {
            "imageAlt": "Outfit đường phố trench coat xanh pastel tại Hà Nội",
            "tag": "Mùa Hạ",
            "author": "An Nhiên",
            "caption": "Set đồ tone pastel nhẹ nhàng đi làm và cafe cuối tuần"
          },
          "minhKhue": {
            "imageAlt": "Set đồ blazer màu mận chín và trang sức bạc",
            "tag": "Mùa Đông",
            "author": "Minh Khuê",
            "caption": "Công thức son mận chín và áo dạ đen cho ngày trở lạnh"
          }
        },
        "statsLabel": "Hơn 4,500 bài viết chia sẻ phong cách mỗi tháng",
        "joinNow": "Tham gia ngay →",
        "featureTag": "Tính năng trọng tâm 03",
        "panelHeading": "Không Gian Kết Nối Hội Tín Đồ Mặc Đẹp",
        "panelBody": "Học hỏi mẹo phối đồ từ những người bạn có cùng sắc thái da và cùng nhau xây dựng tủ đồ thông minh bền vững.",
        "steps": {
          "shareLookbook": {
            "title": "Đăng tải lookbook & công thức outfit",
            "body": "Tự tin chia sẻ những set đồ hàng ngày, đánh dấu nhãn sắc độ cá nhân để giúp bạn bè cùng tông màu dễ dàng tham khảo."
          },
          "getFeedback": {
            "title": "Nhận feedback từ Stylist và cộng đồng",
            "body": "Gửi câu hỏi tư vấn cách phối phụ kiện hoặc lựa chọn kiểu cổ áo tôn dáng, nhận phản hồi tức thì từ cộng đồng sành điệu."
          },
          "saveCollection": {
            "title": "Lưu vào bộ sưu tập cá nhân trong 1 chạm",
            "body": "Thả tim và gom những ý tưởng mix-match ưng ý vào album \"Bộ sưu tập đã lưu\" trên trang tài khoản của riêng bạn."
          }
        },
        "cta": "Khám Phá Diễn Đàn"
      }
```

- [ ] **Step 2: Verify the existing tests still pass before migrating (baseline)**

Run: `npx vitest run components/home/FeatureShowcase.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 3: Migrate CommunityPanel**

In `frontend/components/home/FeatureShowcase.tsx`, replace the `COMMUNITY_POSTS`, `COMMUNITY_STEPS` constants and the `CommunityPanel` function (from `const COMMUNITY_POSTS = [` to the end of the file) with:

```tsx
const COMMUNITY_POSTS = [
  { key: 'anNhien', image: '/home/street-outfit-hanoi.jpg', tagColor: 'text-primary', likes: 428 },
  { key: 'minhKhue', image: '/home/blazer-outfit.jpg', tagColor: 'text-secondary', likes: 852 },
] as const

const COMMUNITY_STEPS = [
  { step: '1', badge: 'bg-secondary-container text-on-secondary-fixed', key: 'shareLookbook' },
  { step: '2', badge: 'bg-primary-fixed text-primary', key: 'getFeedback' },
  { step: '3', badge: 'bg-tertiary-fixed text-on-tertiary-fixed', key: 'saveCollection' },
] as const

function CommunityPanel() {
  const t = useTranslations('Home.FeatureShowcase')

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">groups</span>
            <span className="text-label-lg font-bold text-on-surface">{t('communityPanel.title')}</span>
          </div>
          <span className="text-xs font-semibold text-primary">{t('communityPanel.hashtags')}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {COMMUNITY_POSTS.map((post) => (
            <div key={post.key} className="overflow-hidden rounded-2xl bg-surface-container-low shadow-sm">
              <div className="relative h-44 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.image} alt={t(`communityPanel.posts.${post.key}.imageAlt`)} className="h-full w-full object-cover" />
                <span className={`absolute right-2 top-2 rounded-full bg-surface-container-lowest/80 px-2 py-0.5 text-[10px] font-bold ${post.tagColor}`}>
                  {t(`communityPanel.posts.${post.key}.tag`)}
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm font-bold text-on-surface">{t(`communityPanel.posts.${post.key}.author`)}</span>
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <span className="material-symbols-outlined text-[14px]">favorite</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] text-on-surface-variant">{t(`communityPanel.posts.${post.key}.caption`)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container p-3">
          <span className="text-xs font-medium text-on-surface">{t('communityPanel.statsLabel')}</span>
          <span className="text-xs font-bold text-primary">{t('communityPanel.joinNow')}</span>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-tertiary">{t('communityPanel.featureTag')}</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">{t('communityPanel.panelHeading')}</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">{t('communityPanel.panelBody')}</p>
        </div>
        <div className="space-y-4">
          {COMMUNITY_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{t(`communityPanel.steps.${item.key}.title`)}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{t(`communityPanel.steps.${item.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-tertiary px-8 py-3.5 text-label-lg text-on-tertiary shadow-md transition-all hover:bg-tertiary/90"
          >
            <span>{t('communityPanel.cta')}</span>
            <span className="material-symbols-outlined text-[18px]">explore</span>
          </a>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/home/FeatureShowcase.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add messages/vi.json components/home/FeatureShowcase.tsx
git commit -m "feat: migrate FeatureShowcase community panel to next-intl"
```

---

## Task 8: ContactSection migration

**Files:**
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/home/ContactSection.tsx`
- Modify: `frontend/components/home/ContactSection.test.tsx`

**Interfaces:**
- Consumes: `renderWithIntl` from `frontend/test-utils/renderWithIntl.tsx` (Task 1).

- [ ] **Step 1: Write the failing test**

Replace the full contents of `frontend/components/home/ContactSection.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ContactSection from './ContactSection'

describe('ContactSection', () => {
  it('shows a confirmation message after submitting the form', () => {
    renderWithIntl(<ContactSection />)
    fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Linh Đan' } })
    fireEvent.change(screen.getByLabelText('Địa chỉ Email *'), { target: { value: 'linhdan@gmail.com' } })
    fireEvent.change(screen.getByLabelText('Chủ đề góp ý *'), { target: { value: 'other' } })
    fireEvent.change(screen.getByLabelText('Nội dung tin nhắn *'), { target: { value: 'Xin chào' } })
    fireEvent.click(screen.getByRole('button', { name: /GỬI LỜI NHẮN/ }))
    expect(screen.getByText(/Cảm ơn bạn/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it still passes on the old component**

Run: `npx vitest run components/home/ContactSection.test.tsx`
Expected: PASS — confirms `renderWithIntl` alone doesn't break anything before Step 4's migration.

- [ ] **Step 3: Add the Home.ContactSection namespace to messages/vi.json**

In `frontend/messages/vi.json`, add a `"ContactSection"` key inside `"Home"`, as a sibling of `"FeatureShowcase"` (now the last key in `Home`):

```json
    "ContactSection": {
      "brandTagline": "A little twist, a better fit",
      "logoAlt": "Logo TwistFit",
      "heading": "Chúng Tôi Luôn Lắng Nghe Ý Kiến Của Bạn",
      "description": "Bạn có câu hỏi về kết quả màu sắc, muốn hợp tác stylist hoặc muốn góp ý tính năng phối đồ? Hãy để lại lời nhắn cho đội ngũ cố vấn thời trang của TwistFit.",
      "email": "support@twistfit.vn",
      "phone": "1900 8899 (8:30 - 21:00 hàng ngày)",
      "address": "TwistFit AI Studio, Quận 1, TP. Hồ Chí Minh",
      "formHeading": "Hòm Thư Góp Ý & Đặt Lịch Tư Vấn",
      "formSubheading": "Vui lòng điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.",
      "labels": {
        "name": "Họ và tên *",
        "email": "Địa chỉ Email *",
        "phone": "Số điện thoại",
        "subject": "Chủ đề góp ý *",
        "message": "Nội dung tin nhắn *"
      },
      "placeholders": {
        "name": "Ví dụ: Nguyễn Linh Đan",
        "email": "linhdan@gmail.com",
        "phone": "0909 xxx xxx",
        "message": "Chia sẻ suy nghĩ, góp ý hoặc yêu cầu hỗ trợ của bạn tại đây..."
      },
      "subjectOptions": {
        "placeholder": "-- Chọn chủ đề --",
        "colorTest": "Hỏi về kết quả Personal Color",
        "virtualFitting": "Góp ý tính năng Phòng Thử Đồ Ảo",
        "stylist": "Đăng ký hợp tác Stylist / Fashion KOL",
        "other": "Ý kiến đóng góp khác"
      },
      "submitButton": "GỬI LỜI NHẮN",
      "successMessage": "Cảm ơn bạn! Lời nhắn đã được chuyển đến bộ phận chăm sóc TwistFit."
    }
```

- [ ] **Step 4: Migrate ContactSection.tsx**

Replace the full contents of `frontend/components/home/ContactSection.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'

export default function ContactSection() {
  const t = useTranslations('Home.ContactSection')
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
              <img src="/home/contact-logo.png" alt={t('logoAlt')} className="h-12 w-12 object-contain" />
              <div>
                <span className="block text-headline-sm font-bold leading-none text-primary">TwistFit</span>
                <span className="text-body-sm text-on-surface-variant">{t('brandTagline')}</span>
              </div>
            </div>
            <h3 className="text-headline-md text-on-surface">{t('heading')}</h3>
            <p className="text-body-md text-on-surface-variant">{t('description')}</p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <span className="text-body-md">{t('email')}</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <span className="text-body-md">{t('phone')}</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <span className="text-body-md">{t('address')}</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_12px_36px_rgba(4,28,55,0.06)] lg:p-10">
              <div className="mb-6">
                <h4 className="text-headline-sm font-bold text-on-surface">{t('formHeading')}</h4>
                <p className="mt-1 text-body-sm text-on-surface-variant">{t('formSubheading')}</p>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-label-md font-semibold text-on-surface">
                      {t('labels.name')}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder={t('placeholders.name')}
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-label-md font-semibold text-on-surface">
                      {t('labels.email')}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder={t('placeholders.email')}
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="text-label-md font-semibold text-on-surface">
                      {t('labels.phone')}
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder={t('placeholders.phone')}
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-subject" className="text-label-md font-semibold text-on-surface">
                      {t('labels.subject')}
                    </label>
                    <select
                      id="contact-subject"
                      required
                      defaultValue=""
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface transition-colors focus:bg-surface-container-high focus:outline-none"
                    >
                      <option value="" disabled>
                        {t('subjectOptions.placeholder')}
                      </option>
                      <option value="color-test">{t('subjectOptions.colorTest')}</option>
                      <option value="virtual-fitting">{t('subjectOptions.virtualFitting')}</option>
                      <option value="stylist">{t('subjectOptions.stylist')}</option>
                      <option value="other">{t('subjectOptions.other')}</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-label-md font-semibold text-on-surface">
                    {t('labels.message')}
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder={t('placeholders.message')}
                    className="w-full resize-none rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-label-sm text-primary">{submitted ? t('successMessage') : ''}</span>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container sm:w-auto"
                  >
                    <span>{t('submitButton')}</span>
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

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/home/ContactSection.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add messages/vi.json components/home/ContactSection.tsx components/home/ContactSection.test.tsx
git commit -m "feat: migrate ContactSection to next-intl"
```

---

## Task 9: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: All test files pass (same or higher count than the pre-existing 153 tests, plus this plan's changes — no regressions).

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors or warnings.

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: Build succeeds; the route list is unchanged from before this plan (`/`, `/_not-found`, `/about`, `/blog`, `/camera-frame`, `/faq`, `/how-it-works`, `/outfit/step-1`..`/outfit/step-4`, `/personal-color/quiz`, `/personal-color/result`) — this work changes 0 routes.

- [ ] **Step 4: Manual smoke check**

Run: `npm run dev` in the background, then:

```bash
curl -s http://localhost:3000/ | grep -o 'Kiểm Tra Màu Sắc (Camera QR)'
curl -s http://localhost:3000/ | grep -o 'TwistFit Vietnam'
```

Expected: Both greps return a match (Hero CTA and Footer copyright render server-side with real translated content, proving `NextIntlClientProvider` resolves messages during SSR, not only in tests). Stop the dev server afterward.

- [ ] **Step 5: Report**

No commit for this task (verification only) — summarize the final test/lint/build counts to the user.
