# TwistFit i18n Foundation — Design Spec

## Goal

Introduce a centralized, i18n-ready system for all user-facing text in the
TwistFit frontend, replacing hardcoded strings scattered across components.
This spec covers **sub-project 1 only**: the core `next-intl` infrastructure,
plus migrating it end-to-end on a representative slice of the app (`Header`,
`Footer`, `QrModal`, and the three Home page sections). Later sub-projects
(Personal Color, Outfit flow, static pages) will reuse the exact pattern
established here, each going through its own lightweight brainstorming pass
before implementation.

## Context & Decisions Already Made

- **Multi-language intent is real**, not just a tidiness exercise — the
  infrastructure must support adding more locales later without another
  architectural rewrite.
- **Only Vietnamese (`vi`) ships now.** No English translation work happens
  in this sub-project or the ones that follow it until explicitly requested.
- **URLs keep their current shape** (`/outfit/step-1`, `/about`, etc.) — no
  `/vi/...` prefix now or when a second locale is added later.
- **Library: `next-intl`**, used in its ["without i18n routing"](https://next-intl.dev/docs/routing/configuration)
  mode — no middleware, no `app/[locale]` segment. Confirmed compatible with
  Next.js 16 App Router.
- **All text-bearing components are treated as Client Components** using the
  `useTranslations()` hook, even ones that are currently plain Server
  Components (namely `Footer`). This trades a small amount of "zero JS"
  optimization for one single, uniform consumption pattern and one single
  test-rendering pattern across the whole codebase — consistent with this
  codebase's existing heavy Client Component bias.

## Non-Goals (this sub-project)

- Translating anything to English or any other language.
- Building a language switcher UI or locale-persistence mechanism (cookie,
  `Accept-Language` detection, etc.). Noted under Future Extensibility, not
  implemented now.
- Migrating any page/component outside Header, Footer, QrModal, and the
  three Home sections (`Hero`, `FeatureShowcase`, `ContactSection`).
- Deciding whether existing content-config modules (`lib/personalColorQuiz.ts`,
  the FAQ/Blog data arrays) fold into the messages system — that's a decision
  for the Personal Color / static-pages sub-projects, made when those are
  brainstormed.
- "Fixing" content quirks discovered while extracting text (e.g. `Header`'s
  nav labels — "About us", "How it works" — are already English inside an
  otherwise-Vietnamese site). Text is extracted verbatim; content changes are
  a separate, explicit request.

## Architecture

**Package:** `next-intl` (single new dependency).

**`i18n/request.ts`** (new file) — returns a fixed locale for now; this is
the only place that changes when a second locale is introduced later:

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

**`next.config.ts`** — wrap the existing config with the next-intl plugin,
which points at `i18n/request.ts` (default location, no argument needed):

```ts
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.16.1.43'],
}

export default withNextIntl(nextConfig)
```

**`app/layout.tsx`** — wrap the existing tree in `NextIntlClientProvider`.
Since `RootLayout` is a Server Component, the provider automatically
inherits the locale/messages resolved by `i18n/request.ts` — no props to
pass by hand:

```tsx
import { NextIntlClientProvider } from 'next-intl'
// ...existing imports

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={`${montserrat.variable} antialiased`}>
      <head>{/* unchanged */}</head>
      <body className="flex min-h-screen flex-col bg-surface text-on-surface">
        <NextIntlClientProvider>
          <QrModalProvider>
            <Header />
            {children}
            <Footer />
          </QrModalProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

**Type safety:** add a `global.d.ts` that augments next-intl's `AppConfig`
with the shape of `messages/vi.json`, so `useTranslations('SomeNamespace')`
and key lookups are type-checked and autocompleted:

```ts
import messages from './messages/vi.json'

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof messages
  }
}
```

## Message File Structure & Namespacing Convention

One file per locale: `messages/vi.json`. Top-level keys are namespaces named
after the component/section they belong to (PascalCase, matching the
component name); leaf keys are `camelCase` and describe the string's role,
never its literal content (so wording can change without renaming the key).

Fully specified namespaces for this sub-project (`Header`, `Footer`,
`QrModal` — these components' text is small and fixed, so it's spelled out
completely here; `Home.*` is larger and array-heavy, see below for its
convention instead of a full transcription):

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

`Footer`'s `SOCIAL_LINKS` labels (`Instagram`, `TikTok`, `Facebook`,
`Pinterest`, `YouTube`) are brand names, not UI copy — they stay as plain
hardcoded constants in the component, never enter the messages file. The
same rule applies everywhere: proper nouns / brand names are not
translatable content.

### Convention for list/array data (applies to `Home.*` and all future work)

Several components hold arrays of objects that mix presentational fields
(icon name, Tailwind color class) with translatable text fields (title,
body). Example, `FeatureShowcase.tsx`'s `OUTFIT_STEPS`:

```ts
// Before
const OUTFIT_STEPS = [
  { step: '1', badge: 'bg-secondary-container text-on-secondary-fixed',
    title: 'Tải lên hoặc chọn items từ tủ đồ cá nhân',
    body: 'Chụp hình trang phục bất kỳ, AI thông minh sẽ tự động tách nền...' },
  // ...
]

// After
const OUTFIT_STEPS = [
  { step: '1', badge: 'bg-secondary-container text-on-secondary-fixed', key: 'uploadItems' },
  { step: '2', badge: 'bg-primary-fixed text-primary', key: 'chooseModel' },
  { step: '3', badge: 'bg-tertiary-fixed text-on-tertiary-fixed', key: 'viewResult' },
] as const

// messages/vi.json
"FeatureShowcase": {
  "outfitSteps": {
    "uploadItems": { "title": "Tải lên hoặc chọn items từ tủ đồ cá nhân", "body": "..." },
    "chooseModel": { "title": "...", "body": "..." },
    "viewResult":  { "title": "...", "body": "..." }
  }
}

// component
<h4>{t(`outfitSteps.${item.key}.title`)}</h4>
<p>{t(`outfitSteps.${item.key}.body`)}</p>
```

next-intl accepts any string as a key at runtime, so a template-built path
like `outfitSteps.${item.key}.title` resolves fine — but because the key
isn't a static literal, the `global.d.ts` type augmentation can't catch a
typo in `item.key` at compile time (it can still verify a static key like
`t('checkPersonalColor')`). A typo here is instead caught at test/render
time by the loud missing-key behavior described below — this is an accepted
gap in compile-time safety for data-driven lists, not an oversight.
Presentational-only fields (`step`, `badge`) stay in the component array
untouched. This same key-instead-of-index pattern applies
to `TABS`, `COLOR_TEST_STEPS`, `SPECTRUM_METRICS`,
`SPECTRUM_RECOMMENDATIONS`, `COMMUNITY_STEPS`, and the static labels
embedded directly in JSX throughout `Hero.tsx` and `ContactSection.tsx`.
`COMMUNITY_POSTS`' `author`/`caption`/`image`/`alt` fields are demo content
tied to a specific fictional post, not reusable UI copy — they get flat
per-post keys (e.g. `communityPosts.anNhien.caption`) rather than being
treated as structural chrome.

The exact, complete key list and JSON for `Home.Hero`, `Home.FeatureShowcase`,
and `Home.ContactSection` will be produced during the implementation plan
(mechanical, one task per component) — not duplicated here on top of the
source files.

## Component Consumption Pattern

Every migrated component:

1. Has (or gains) a `'use client'` directive.
2. Calls `const t = useTranslations('Namespace')` (namespace = the
   component's PascalCase name, or `Home.ComponentName` for the three Home
   sections, since they share the `Home` parent namespace).
3. Replaces every hardcoded literal in scope with `t('key')`.

Example, `Header.tsx`:

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
    // ...
    {NAV_LINKS.map((link) => (
      <Link key={link.href} href={link.href} className="...">
        {t(`nav.${link.key}`)}
      </Link>
    ))}
    // ...
    <span>{t('checkPersonalColor')}</span>
    // ...
    <button aria-label={t('accountAriaLabel')}>...</button>
  )
}
```

`Footer.tsx` gains `'use client'` and follows the identical pattern; its
`SOCIAL_LINKS` array is untouched (brand names, see above).

## Missing-Key / Error Handling

Use next-intl's default behavior: a missing key throws/logs a visible
console error during render (dev) rather than silently rendering nothing or
the raw key. This is deliberate — as the remaining sub-projects migrate more
of the app, a loud failure surfaces incomplete migrations immediately
instead of shipping a silently blank label. No custom `onError` /
`getMessageFallback` override in this sub-project.

## Testing Strategy

Add one shared test helper, `test-utils/renderWithIntl.tsx`, that wraps
`@testing-library/react`'s `render` in a `NextIntlClientProvider` using the
real `messages/vi.json` (not a mock) — so tests exercise actual copy and
immediately fail if a key is renamed without updating its usage:

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

Every test file for a migrated component switches its `render(...)` calls
to `renderWithIntl(...)` (import swapped from `@testing-library/react` to
the new helper; `screen`/`fireEvent` imports are unaffected). Because the
messages file's values equal today's hardcoded strings, **no assertion text
needs to change** — tests keep asserting on the same rendered Vietnamese
strings as before; only the render wrapper changes. Where a component is
nested inside a provider in its test (e.g. `Header` inside `QrModalProvider`),
`renderWithIntl` wraps the outside of that existing nesting, it doesn't
replace it.

## Migration Scope for This Sub-Project

Files created:
- `messages/vi.json`
- `i18n/request.ts`
- `global.d.ts`
- `test-utils/renderWithIntl.tsx`

Files modified (implementation + colocated test):
- `next.config.ts`
- `app/layout.tsx`
- `components/layout/Header.tsx` + `Header.test.tsx`
- `components/layout/Footer.tsx` + `Footer.test.tsx`
- `components/qr-modal/QrModal.tsx` (no existing test file — none added
  here either, consistent with current coverage; it's exercised indirectly
  via `QrModalProvider.test.tsx`)
- `components/qr-modal/QrModalProvider.test.tsx` (render calls only — the
  component itself doesn't render text directly)
- `components/home/Hero.tsx` + `Hero.test.tsx`
- `components/home/FeatureShowcase.tsx` + `FeatureShowcase.test.tsx`
- `components/home/ContactSection.tsx` + `ContactSection.test.tsx`

Package changes:
- `package.json` / `package-lock.json` — add `next-intl`.

## Future Extensibility (not built now)

- **Adding a second locale:** add `messages/en.json`, change
  `i18n/request.ts` to resolve `locale` from a cookie (or `Accept-Language`)
  instead of the hardcoded `'vi'`, and add a switcher UI that sets that
  cookie. No route/`next.config.ts`/provider changes needed — this is the
  entire point of choosing the "without routing" mode now.
- **Non-UI content** (quiz questions, FAQ items, blog articles) may or may
  not move into the messages system — deferred to those sub-projects.

## Testing/Build Verification Plan (applies to every sub-project task)

- `npm run test` — full suite green.
- `npm run lint` — clean.
- `npm run build` — succeeds, same route list as before (no route/URL
  changes from this work).
