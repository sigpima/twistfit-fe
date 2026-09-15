# About Page: Real Brand Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fabricated marketing copy on `/about` with the real brand story, brand-name/logo meaning, mission, and vision the user provided, reordering the page to match that content's natural narrative order.

**Architecture:** Frontend-only content and layout change. A new shared `ContrastCardPair` presentational component renders the "two contrasting ideas side by side" pattern that shows up three times (Twist/Fit, Tĩnh/Động, Sắc vàng/Sắc hồng). A new `BrandMeaningSection` component uses it twice for the brand-name and logo-meaning content. `StorySection` and `MissionVisionGrid` get their fabricated stats stripped and their real copy wired in. `app/about/page.tsx` is reordered.

**Tech Stack:** Next.js + TypeScript + Tailwind CSS, next-intl, Vitest + Testing Library.

**Spec:** `frontend/docs/superpowers/specs/2026-09-16-about-page-brand-content-design.md`

## Global Constraints

- No backend changes — this is a pure frontend content/layout change.
- Every long-form paragraph block gets `max-w-prose` (Tailwind core utility, ~65-75 characters per line) for readability, per the spec's `ui-ux-pro-max`-informed decision.
- All contrast-card pairs (`ContrastCardPair`) stack to one column below `md:` (768px) and sit side by side from `md:` up.
- All content is copied verbatim from the spec's Content section — no rewording.
- Presentational components with no `useTranslations` call of their own (`ContrastCardPair`) are tested with plain `render` from `@testing-library/react`, matching this codebase's existing convention (see `components/home/PhoneMockupStepper.test.tsx`); components that call `useTranslations` directly are tested with `renderWithIntl`.

---

## Task 1: `ContrastCardPair` — shared two-column contrast component

**Files:**
- Create: `frontend/components/about/ContrastCardPair.tsx`
- Test: `frontend/components/about/ContrastCardPair.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `export default function ContrastCardPair({ left, right }: ContrastCardPairProps)` where
  ```ts
  type ContrastCard = {
    title: string
    body: string
    accentClassName: string
    containerClassName?: string
  }
  type ContrastCardPairProps = { left: ContrastCard; right: ContrastCard }
  ```
  Task 3 (`BrandMeaningSection`) imports and renders this 3 times.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/about/ContrastCardPair.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContrastCardPair from './ContrastCardPair'

describe('ContrastCardPair', () => {
  it('renders both cards with their title and body', () => {
    render(
      <ContrastCardPair
        left={{ title: 'Twist', body: 'Twist body text', accentClassName: 'text-primary' }}
        right={{ title: 'Fit', body: 'Fit body text', accentClassName: 'text-secondary' }}
      />
    )
    expect(screen.getByText('Twist')).toBeInTheDocument()
    expect(screen.getByText('Twist body text')).toBeInTheDocument()
    expect(screen.getByText('Fit')).toBeInTheDocument()
    expect(screen.getByText('Fit body text')).toBeInTheDocument()
  })

  it('applies the accent class to each title and the container class when given', () => {
    render(
      <ContrastCardPair
        left={{ title: 'Twist', body: 'Twist body text', accentClassName: 'text-primary' }}
        right={{
          title: 'Fit',
          body: 'Fit body text',
          accentClassName: 'text-secondary',
          containerClassName: 'bg-secondary-container',
        }}
      />
    )
    expect(screen.getByText('Twist')).toHaveClass('text-primary')
    expect(screen.getByText('Fit')).toHaveClass('text-secondary')
    expect(screen.getByText('Fit').closest('div')).toHaveClass('bg-secondary-container')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd frontend && npx vitest run components/about/ContrastCardPair.test.tsx
```

Expected: FAIL — `ContrastCardPair.tsx` doesn't exist.

- [ ] **Step 3: Implement the component**

Create `frontend/components/about/ContrastCardPair.tsx`:

```tsx
type ContrastCard = {
  title: string
  body: string
  accentClassName: string
  containerClassName?: string
}

type ContrastCardPairProps = {
  left: ContrastCard
  right: ContrastCard
}

export default function ContrastCardPair({ left, right }: ContrastCardPairProps) {
  return (
    <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
      {[left, right].map((card) => (
        <div
          key={card.title}
          className={`rounded-xl p-space-lg shadow-sm ${card.containerClassName ?? 'bg-surface-container-lowest'}`}
        >
          <h4 className={`text-headline-sm font-bold ${card.accentClassName}`}>{card.title}</h4>
          <p className="mt-space-xs text-body-md leading-relaxed text-on-surface-variant">{card.body}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd frontend && npx vitest run components/about/ContrastCardPair.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/about/ContrastCardPair.tsx frontend/components/about/ContrastCardPair.test.tsx
git commit -m "feat: add ContrastCardPair for the About page's paired-idea layout"
```

---

## Task 2: `StorySection` — real story copy, remove fabricated stats

**Files:**
- Modify: `frontend/components/about/StorySection.tsx`
- Modify: `frontend/components/about/StorySection.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new consumed by later tasks (leaf component).

- [ ] **Step 1: Write the failing tests**

Replace `frontend/components/about/StorySection.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import StorySection from './StorySection'

describe('StorySection', () => {
  it('renders the brand story narrative', () => {
    renderWithIntl(<StorySection />)
    expect(screen.getByRole('heading', { name: 'Câu Chuyện Thương Hiệu' })).toBeInTheDocument()
    expect(screen.getByText(/tủ đồ đầy ngập của bạn Minh Ánh/)).toBeInTheDocument()
    expect(screen.getByText(/trăn trở chung của rất nhiều người trẻ/)).toBeInTheDocument()
  })

  it('no longer renders the removed milestones or AI-core panel', () => {
    renderWithIntl(<StorySection />)
    expect(screen.queryByText('Khởi sinh thuật toán quang phổ da')).not.toBeInTheDocument()
    expect(screen.queryByText('120K+ người dùng tại Việt Nam')).not.toBeInTheDocument()
    expect(screen.queryByText(/TwistFit AI Camera Core/)).not.toBeInTheDocument()
  })

  it('renders the story image', () => {
    renderWithIntl(<StorySection />)
    expect(screen.getByAltText(/Phân Tích Draping Vải Truyền Thống/)).toHaveAttribute(
      'src',
      '/about/story-draping.jpg'
    )
  })
})
```

- [ ] **Step 2: Run the tests to verify the new assertions fail**

```bash
cd frontend && npx vitest run components/about/StorySection.test.tsx
```

Expected: FAIL on the first test (`headingPrefix`'s current content doesn't produce a heading named exactly "Câu Chuyện Thương Hiệu", and the new paragraph text isn't there yet). The second and third tests currently PASS (milestones/AI-core panel still exist today — that's expected until Step 3 removes them; the image assertion already passes and stays passing).

- [ ] **Step 3: Update `messages/vi.json`'s `About.StorySection` block**

Replace the entire `StorySection` object under `About` with:

```json
"StorySection": {
  "kicker": "Câu Chuyện Thương Hiệu",
  "heading": "Câu Chuyện Thương Hiệu",
  "paragraph1": "Câu chuyện của TwistFit không bắt đầu từ những lý thuyết cao siêu, mà bắt đầu từ chính tủ đồ đầy ngập của bạn Minh Ánh nhóm mình. Có những buổi sáng, bạn loay hoay trước tủ quần áo chất đống nhưng vẫn thốt lên: \"Không có gì để mặc!\". Mua sắm thì nhiều, nhưng món thì khiến da bị xỉn, món thì mua theo trend về rồi chẳng biết phối với cái gì. Nhìn tủ đồ vừa tốn tiền, vừa lãng phí mà vẫn không tạo được outfit đúng ý.",
  "paragraph2": "Chúng tôi nhận ra đây không chỉ là câu chuyện của riêng bạn, mà là trăn trở chung của rất nhiều người trẻ hiện nay: mua sắm theo cảm hứng, tủ đồ luôn đầy ắp nhưng lại thiếu sự thấu hiểu bản thân để định hình một phong cách thực sự là chính mình. Xuất phát từ niềm tin rằng mỗi người là một bản thể độc nhất, TwistFit ra đời như một người bạn đồng hành, giúp bạn lắng nghe chính mình, khám phá và tự do thể hiện bản sắc riêng.",
  "imageAlt": "Phân Tích Draping Vải Truyền Thống trong atelier TwistFit",
  "imageCaptionLabel": "Atelier Studio",
  "imageCaptionTitle": "Phân Tích Draping Vải Truyền Thống"
}
```

This removes `headingPrefix`, `paragraph3`, every `milestones.*` key, and `aiCoreLabel`/`aiCoreBody`/`spectrumLabel`/`spectrumValue`.

- [ ] **Step 4: Rewrite `StorySection.tsx`**

Replace the full contents of `frontend/components/about/StorySection.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'

export default function StorySection() {
  const t = useTranslations('About.StorySection')

  return (
    <section className="w-full bg-surface-container-low/50 px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-6">
            <div className="inline-flex items-center gap-space-xs">
              <span className="h-px w-8 bg-secondary" />
              <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
                {t('kicker')}
              </span>
            </div>
            <h2 className="text-headline-lg leading-snug text-on-surface">{t('heading')}</h2>
            <div className="flex max-w-prose flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
              <p>{t('paragraph1')}</p>
              <p>{t('paragraph2')}</p>
            </div>
          </div>
          <div className="relative flex flex-col items-center lg:col-span-6">
            <div className="relative aspect-[4/5] w-full max-w-lg overflow-hidden rounded-xl shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/about/story-draping.jpg" alt={t('imageAlt')} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent" />
              <div className="absolute inset-x-space-md bottom-space-md text-inverse-on-surface">
                <span className="text-label-sm uppercase tracking-wider text-secondary-container">
                  {t('imageCaptionLabel')}
                </span>
                <p className="text-headline-sm font-semibold">{t('imageCaptionTitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/about/StorySection.test.tsx
```

Expected: PASS (all 3 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/components/about/StorySection.tsx frontend/components/about/StorySection.test.tsx frontend/messages/vi.json
git commit -m "feat: replace About page story section with the real brand story"
```

---

## Task 3: `BrandMeaningSection` — brand name and logo meaning

**Files:**
- Create: `frontend/components/about/BrandMeaningSection.tsx`
- Create: `frontend/components/about/BrandMeaningSection.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: `ContrastCardPair` from Task 1.
- Produces: `export default function BrandMeaningSection()` — Task 5 (`app/about/page.tsx`) renders it.

- [ ] **Step 1: Write the failing tests**

Create `frontend/components/about/BrandMeaningSection.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BrandMeaningSection from './BrandMeaningSection'

describe('BrandMeaningSection', () => {
  it('renders the name-meaning heading and both contrast cards', () => {
    renderWithIntl(<BrandMeaningSection />)
    expect(screen.getByRole('heading', { name: 'Ý Nghĩa Tên Thương Hiệu' })).toBeInTheDocument()
    expect(screen.getByText('Twist')).toBeInTheDocument()
    expect(screen.getByText('Fit')).toBeInTheDocument()
    expect(screen.getByText(/cú bẻ lái đầy bất ngờ/)).toBeInTheDocument()
    expect(screen.getByText(/vẻ đẹp bền vững không đến từ việc chạy theo xu hướng/)).toBeInTheDocument()
  })

  it('renders the symbol-meaning heading, logo image, and both contrast pairs', () => {
    renderWithIntl(<BrandMeaningSection />)
    expect(screen.getByRole('heading', { name: 'Ý Nghĩa Biểu Tượng TwistFit' })).toBeInTheDocument()
    expect(screen.getByAltText('Logo TwistFit')).toHaveAttribute('src', '/home/logo.png')
    expect(screen.getByText('Tĩnh')).toBeInTheDocument()
    expect(screen.getByText('Động')).toBeInTheDocument()
    expect(screen.getByText('Sắc Vàng Vintage - Trạng Thái Tĩnh')).toBeInTheDocument()
    expect(screen.getByText('Sắc Hồng Hiện Đại - Sự Tái Sinh')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/about/BrandMeaningSection.test.tsx
```

Expected: FAIL — `BrandMeaningSection.tsx` doesn't exist.

- [ ] **Step 3: Add the `About.BrandMeaning` translations**

In `frontend/messages/vi.json`, insert this new object under `About`, right after `StorySection`:

```json
"BrandMeaning": {
  "kicker": "Ý Nghĩa Thương Hiệu",
  "name": {
    "heading": "Ý Nghĩa Tên Thương Hiệu",
    "intro": "Tên gọi TwistFit là sự giao thoa hoàn hảo giữa tinh thần tự do và sự thấu hiểu chính mình:",
    "twist": {
      "title": "Twist",
      "body": "Ở Twist, đó là cú bẻ lái đầy bất ngờ của sự đổi mới, phá cách và sáng tạo không rập khuôn. Đó là lời mời gọi bạn bước ra khỏi vùng an toàn, thử nghiệm những bản phối mới mẻ để biến trang phục thường nhật thành tuyên ngôn phong cách riêng biệt."
    },
    "fit": {
      "title": "Fit",
      "body": "Trong khi đó, Fit chính là sự vừa vặn tuyệt đối. Không chỉ dừng lại ở số đo, màu sắc hay phong cách mong muốn, Fit tại TwistFit còn là sự ăn ý đến hoàn hảo với chính tủ đồ hiện tại của bạn - giúp bạn mặc đẹp và tự tin nhất từ chính những món đồ mình đang có."
    },
    "closing": "TwistFit tin rằng vẻ đẹp bền vững không đến từ việc chạy theo xu hướng nhất thời, mà khởi nguồn từ sự thấu hiểu bản thân cùng lòng can đảm tạo nên những \"cú twist\" khác biệt — nơi bạn luôn tìm thấy sự vừa vặn hoàn hảo để tự tin là chính mình mỗi ngày."
  },
  "symbol": {
    "heading": "Ý Nghĩa Biểu Tượng TwistFit",
    "intro": "Logo TwistFit không chỉ là một nhận diện thị giác, mà còn chứa đựng toàn bộ triết lý chuyển dịch từ sự tĩnh lặng của tủ đồ truyền thống sang không gian số hóa thời trang đầy năng lượng và sáng tạo.",
    "logoAlt": "Logo TwistFit",
    "movementHeading": "Hình Tượng & Chuyển Động",
    "static": {
      "title": "Tĩnh",
      "body": "Chiếc móc màu vàng vẫn neo cố định trên thanh ngang biểu trưng cho trạng thái lưu trữ truyền thống - nơi những bộ trang phục quen thuộc dần bị lãng quên theo thời gian."
    },
    "dynamic": {
      "title": "Động",
      "body": "Ngược lại, chiếc móc màu hồng tách khỏi thanh treo với góc nghiêng tự do đại diện cho hành động \"giải phóng\" không gian tủ đồ. Quần áo không còn bị \"treo chết\", mà được công nghệ AI đánh thức, tái kết hợp và đưa trở lại nhịp sống thường nhật."
    },
    "layeringNote": "Hai chiếc móc lồng ghép và đan xen nhau mô phỏng trực quan tính năng phối đồ cùng phòng thử đồ ảo của TwistFit. Ở đó, những món trang phục tưởng chừng rời rạc, đối lập lại tìm thấy điểm chạm hài hòa để tạo nên những bản phối hoàn toàn mới mẻ.",
    "colorHeading": "Ngôn Ngữ Màu Sắc & Hiệu Ứng Ombre",
    "vintage": {
      "title": "Sắc Vàng Vintage - Trạng Thái Tĩnh",
      "body": "Gam vàng ombre nhuốm màu thời gian gợi nhắc trực tiếp về những món đồ xưa cũ, quen thuộc nằm sâu nơi góc tủ. Neo giữ sắc vàng này trên thanh treo phản ánh giá trị trang phục đang bị \"đóng băng\" và chờ đợi được tái sinh."
    },
    "modern": {
      "title": "Sắc Hồng Hiện Đại - Sự Tái Sinh",
      "body": "Tương phản với nét hoài niệm là sắc hồng ombre tươi sáng và rực rỡ. Đi cùng chuyển động vươn lên rời khỏi thanh treo, gam màu này phá vỡ hoàn toàn định kiến về \"đồ cũ\", thổi bùng sức sống mới để mỗi món đồ bước ra khỏi góc tối bất động và trở thành diện mạo đầy tự tin của bạn mỗi ngày."
    }
  }
},
```

- [ ] **Step 4: Implement `BrandMeaningSection.tsx`**

Create `frontend/components/about/BrandMeaningSection.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import ContrastCardPair from './ContrastCardPair'

export default function BrandMeaningSection() {
  const t = useTranslations('About.BrandMeaning')

  return (
    <section className="w-full px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-space-xl inline-flex items-center gap-space-xs">
          <span className="h-px w-8 bg-secondary" />
          <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
            {t('kicker')}
          </span>
        </div>

        <div className="flex flex-col gap-space-lg">
          <h3 className="text-headline-md text-on-surface">{t('name.heading')}</h3>
          <p className="max-w-prose text-body-md leading-relaxed text-on-surface-variant">{t('name.intro')}</p>
          <ContrastCardPair
            left={{ title: t('name.twist.title'), body: t('name.twist.body'), accentClassName: 'text-primary' }}
            right={{ title: t('name.fit.title'), body: t('name.fit.body'), accentClassName: 'text-secondary' }}
          />
          <p className="max-w-prose text-body-md leading-relaxed text-on-surface-variant">{t('name.closing')}</p>
        </div>

        <div className="mt-space-xl flex flex-col gap-space-lg">
          <h3 className="text-headline-md text-on-surface">{t('symbol.heading')}</h3>
          <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
            <div className="lg:col-span-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/logo.png" alt={t('symbol.logoAlt')} className="mx-auto w-full max-w-xs" />
            </div>
            <p className="max-w-prose text-body-md leading-relaxed text-on-surface-variant lg:col-span-8">
              {t('symbol.intro')}
            </p>
          </div>

          <h4 className="text-headline-sm text-on-surface">{t('symbol.movementHeading')}</h4>
          <ContrastCardPair
            left={{
              title: t('symbol.static.title'),
              body: t('symbol.static.body'),
              accentClassName: 'text-tertiary',
            }}
            right={{
              title: t('symbol.dynamic.title'),
              body: t('symbol.dynamic.body'),
              accentClassName: 'text-secondary',
            }}
          />
          <p className="max-w-prose text-body-md leading-relaxed text-on-surface-variant">
            {t('symbol.layeringNote')}
          </p>

          <h4 className="text-headline-sm text-on-surface">{t('symbol.colorHeading')}</h4>
          <ContrastCardPair
            left={{
              title: t('symbol.vintage.title'),
              body: t('symbol.vintage.body'),
              accentClassName: 'text-tertiary',
              containerClassName: 'bg-tertiary-fixed',
            }}
            right={{
              title: t('symbol.modern.title'),
              body: t('symbol.modern.body'),
              accentClassName: 'text-secondary',
              containerClassName: 'bg-secondary-container',
            }}
          />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/about/BrandMeaningSection.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/components/about/BrandMeaningSection.tsx frontend/components/about/BrandMeaningSection.test.tsx frontend/messages/vi.json
git commit -m "feat: add the brand-name and logo-meaning section to the About page"
```

---

## Task 4: `MissionVisionGrid` — real mission essay and vision statement

**Files:**
- Modify: `frontend/components/about/MissionVisionGrid.tsx`
- Modify: `frontend/components/about/MissionVisionGrid.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new consumed by later tasks (leaf component).

- [ ] **Step 1: Write the failing tests**

Replace `frontend/components/about/MissionVisionGrid.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import MissionVisionGrid from './MissionVisionGrid'

describe('MissionVisionGrid', () => {
  it('renders the mission quote and all mission paragraphs', () => {
    renderWithIntl(<MissionVisionGrid />)
    expect(
      screen.getByRole('heading', { name: 'Hiểu Rõ Chính Mình, Làm Chủ Phong Cách' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        '"Mặc đẹp thực chất không bắt đầu từ việc sắm thêm một món đồ mới, mà khởi nguồn từ khoảnh khắc bạn thực sự thấu hiểu bản thân."'
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/Chúng ta đều từng đứng trước tủ đồ chật kín/)).toBeInTheDocument()
    expect(screen.getByText(/TwistFit ra đời để thay đổi hoàn toàn trải nghiệm/)).toBeInTheDocument()
    expect(screen.getByText(/giá trị lớn nhất mà TwistFit mong muốn trao gửi/)).toBeInTheDocument()
  })

  it('renders the vision heading and body', () => {
    renderWithIntl(<MissionVisionGrid />)
    expect(
      screen.getByRole('heading', { name: 'Hệ Sinh Thái Thời Trang Số Dẫn Đầu Giới Trẻ Việt' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Trở thành mạng xã hội phối đồ AI tiên phong/)).toBeInTheDocument()
  })

  it('no longer renders the removed core value cards', () => {
    renderWithIntl(<MissionVisionGrid />)
    expect(screen.queryByText('Cá Nhân Hóa Tối Đa')).not.toBeInTheDocument()
    expect(screen.queryByText('Khoa Học & Chính Xác')).not.toBeInTheDocument()
    expect(screen.queryByText('Bền Vững & Tối Ưu')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/about/MissionVisionGrid.test.tsx
```

Expected: FAIL — none of the new headings/text exist yet (the third test currently passes, since nothing has removed the core value cards yet; it will keep passing throughout).

- [ ] **Step 3: Replace `messages/vi.json`'s `About.MissionVisionGrid` block**

Replace the entire `MissionVisionGrid` object under `About` with:

```json
"MissionVisionGrid": {
  "kicker": "Sứ Mệnh & Tầm Nhìn",
  "heading": "Sứ Mệnh & Tầm Nhìn",
  "introText": "Hiểu rõ chính mình, làm chủ phong cách.",
  "missionLabel": "Sứ mệnh của TwistFit",
  "missionHeading": "Hiểu Rõ Chính Mình, Làm Chủ Phong Cách",
  "missionQuote": "\"Mặc đẹp thực chất không bắt đầu từ việc sắm thêm một món đồ mới, mà khởi nguồn từ khoảnh khắc bạn thực sự thấu hiểu bản thân.\"",
  "missionParagraph1": "Chúng ta đều từng đứng trước tủ đồ chật kín nhưng vẫn cảm thấy bối rối vì không có gì để mặc cho ngày hôm nay. Thuật toán gợi ý của TikTok hay Shopee rất giỏi cuốn người dùng vào các xu hướng nhất thời, khiến chúng ta mua sắm theo cảm hứng đám đông rồi nhanh chóng nhận ra món đồ đó lệch dáng, dìm da và không thuộc về mình. Vòng lặp mua sắm rồi lãng quên ấy xảy ra vì một lý do đơn giản: bạn đang cố gắng ướm mình vào gu của người khác thay vì bắt đầu từ những đặc điểm vốn có của chính bạn.",
  "missionParagraph2": "TwistFit ra đời để thay đổi hoàn toàn trải nghiệm đó bằng cách đặt hành trình khám phá bản thân làm trọng tâm. Thay vì bảo bạn phải mua sắm theo đám đông, nền tảng đồng hành cùng bạn giải mã chính mình qua Bài đánh giá màu sắc cá nhân trực quan kết hợp bài trắc nghiệm ngắn chuẩn xác và công nghệ thực tế ảo thử màu tức thì. Từ sắc độ da nguyên bản, TwistFit khai phóng tiềm năng tủ đồ sẵn có của riêng bạn với khả năng mix & match linh hoạt theo từng dịp, từng phong cách hay bảng màu cá nhân, đồng thời gợi ý khéo léo những món đồ bên ngoài để hoàn thiện outfit. Một trải nghiệm thời trang được cá nhân hóa trọn vẹn, giúp bạn luôn tự tin tỏa sáng theo cách vừa vặn nhất.",
  "missionParagraph3": "Chính vì vậy, giá trị lớn nhất mà TwistFit mong muốn trao gửi không nằm ở công nghệ, mà nằm ở sự thức tỉnh giá trị độc bản bên trong mỗi người. Chúng tôi tin rằng khi bạn thực sự thấu hiểu bản thân, bạn sẽ không còn cảm giác hoang mang hay phải nương tựa vào ánh nhìn của đám đông. Hiểu mình chính là bước khởi đầu vững chắc nhất để bạn ngừng phán xét vẻ ngoài, yêu lấy những gì mình đang có và biến mỗi bộ trang phục khoác lên người thành một tuyên ngôn tự tin, chân thật và bền vững nhất về chính bạn.",
  "visionLabel": "Tầm nhìn tương lai",
  "visionHeading": "Hệ Sinh Thái Thời Trang Số Dẫn Đầu Giới Trẻ Việt",
  "visionBody": "Trở thành mạng xã hội phối đồ AI tiên phong — nơi việc làm mới phong cách cá nhân từ tủ đồ sẵn có là nhịp cầu kết nối trực tiếp cộng đồng người mặc với hệ sinh thái sáng tạo của các thương hiệu Việt Nam."
}
```

This removes `coreValues.*` entirely and renames `missionTitle`→`missionHeading`, `visionTitle`→`visionHeading` (the component in Step 4 uses the new names).

- [ ] **Step 4: Rewrite `MissionVisionGrid.tsx`**

Replace the full contents of `frontend/components/about/MissionVisionGrid.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'

export default function MissionVisionGrid() {
  const t = useTranslations('About.MissionVisionGrid')

  return (
    <section className="w-full px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-space-xl flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
          <div>
            <span className="text-label-sm font-semibold uppercase tracking-wider text-secondary">
              {t('kicker')}
            </span>
            <h2 className="mt-space-xs text-headline-lg text-on-surface">{t('heading')}</h2>
          </div>
          <p className="max-w-md text-body-md text-on-surface-variant">{t('introText')}</p>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
          <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
            {t('missionLabel')}
          </span>
          <h3 className="mb-space-md mt-space-xs text-headline-md text-on-surface">{t('missionHeading')}</h3>
          <p className="mb-space-md text-headline-sm font-serif italic text-secondary">{t('missionQuote')}</p>
          <div className="flex max-w-prose flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
            <p>{t('missionParagraph1')}</p>
            <p>{t('missionParagraph2')}</p>
            <p>{t('missionParagraph3')}</p>
          </div>
        </div>

        <div className="mt-space-lg rounded-xl bg-gradient-to-br from-primary-container to-primary p-space-xl text-on-primary shadow-md">
          <span className="text-label-sm font-semibold uppercase tracking-widest text-primary-fixed">
            {t('visionLabel')}
          </span>
          <h3 className="mb-space-sm mt-space-xs text-headline-md text-on-primary">{t('visionHeading')}</h3>
          <p className="max-w-prose text-body-md leading-relaxed text-primary-fixed">{t('visionBody')}</p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/about/MissionVisionGrid.test.tsx
```

Expected: PASS (all 3 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/components/about/MissionVisionGrid.tsx frontend/components/about/MissionVisionGrid.test.tsx frontend/messages/vi.json
git commit -m "feat: replace About page mission/vision with the real statements"
```

---

## Task 5: Reorder the About page

**Files:**
- Modify: `frontend/app/about/page.tsx`
- Modify: `frontend/app/about/page.test.tsx`

**Interfaces:**
- Consumes: `BrandMeaningSection` (Task 3), the updated `StorySection`/`MissionVisionGrid` (Tasks 2 and 4).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Write the failing assertion**

In `frontend/app/about/page.test.tsx`, add one line to the existing test (after the existing `expect`):

```tsx
  it('renders the seeded team member', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MEMBERS }))
    const page = await AboutPage()
    renderWithIntl(page)
    expect(screen.getByText('Thành viên seed test')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ý Nghĩa Tên Thương Hiệu' })).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd frontend && npx vitest run app/about/page.test.tsx
```

Expected: FAIL — `BrandMeaningSection` isn't rendered on the page yet.

- [ ] **Step 3: Reorder and wire up the page**

Replace the full contents of `frontend/app/about/page.tsx`:

```tsx
import AboutHero from '@/components/about/AboutHero'
import StorySection from '@/components/about/StorySection'
import BrandMeaningSection from '@/components/about/BrandMeaningSection'
import MissionVisionGrid from '@/components/about/MissionVisionGrid'
import TeamGrid from '@/components/about/TeamGrid'
import AboutCtaBanner from '@/components/about/AboutCtaBanner'
import { apiFetch } from '@/lib/apiClient'
import type { TeamMember } from '@/lib/team'

export default async function AboutPage() {
  const response = await apiFetch('/team', { cache: 'no-store' })
  const members = response.ok ? ((await response.json()) as TeamMember[]) : []

  return (
    <main className="w-full bg-surface">
      <AboutHero />
      <StorySection />
      <BrandMeaningSection />
      <MissionVisionGrid />
      <TeamGrid members={members} />
      <AboutCtaBanner />
    </main>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd frontend && npx vitest run app/about/page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/about/page.tsx frontend/app/about/page.test.tsx
git commit -m "feat: reorder the About page around the real brand narrative"
```

---

## Task 6: Final integration

**Files:** none (verification only).

- [ ] **Step 1: Run the full frontend test suite**

```bash
cd frontend && npx vitest run
```

Expected: PASS, no regressions outside the `about`-related files.

- [ ] **Step 2: Run the TypeScript compiler as a final check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual visual check in a real browser**

With the frontend dev server running (`npm run dev`), visit `/about` and confirm, at both a desktop width (~1280px) and a mobile width (~390px):

1. Section order top to bottom: Hero → Câu chuyện thương hiệu → Ý nghĩa thương hiệu (Twist/Fit cards, then logo + Tĩnh/Động cards, then the tinted Sắc vàng/Sắc hồng cards) → Sứ mệnh & Tầm nhìn → Đội ngũ → CTA.
2. No fabricated content remains: no 2023/2024 milestones, no "120K+ người dùng", no "TwistFit AI Camera Core" panel, no "Cá Nhân Hóa Tối Đa / Khoa Học & Chính Xác / Bền Vững & Tối Ưu" cards.
3. At ~390px, every `ContrastCardPair` (Twist/Fit, Tĩnh/Động, Sắc vàng/Sắc hồng) stacks to one column, and the logo+intro row in the symbol-meaning section stacks with the logo on top.
4. Long paragraphs (story, mission) don't stretch edge-to-edge on a wide desktop window — they stay within a readable column width.

Report the outcome; fix any issue found before considering this task done.

- [ ] **Step 4: Invoke `finishing-a-development-branch`**

Announce: "I'm using the finishing-a-development-branch skill to complete this work." and follow that skill (verify tests, present the merge/PR/keep-as-is menu, act on the choice) for the `frontend` repo (branch `master`).
