# How It Works: Real Personal Color Assessment Methodology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/how-it-works`'s factually-wrong "camera scan" Step 1 with the real 3-phase (Hue/Value/Chroma) personal color assessment methodology, displayed as a tabbed section.

**Architecture:** Frontend-only content and layout change. A new `AssessmentMethodology` component owns its own tab state (active phase 0/1/2) and renders the phase's intro + a responsive grid of method cards. `ProcessSteps.tsx` drops its old Step 1 block and renders this component in its place; Steps 2 and 3 are untouched.

**Tech Stack:** Next.js + TypeScript + Tailwind CSS, next-intl, Vitest + Testing Library.

**Spec:** `frontend/docs/superpowers/specs/2026-09-16-how-it-works-assessment-methodology-design.md`

## Global Constraints

- No backend changes — pure frontend content/layout change.
- Tab labels stay in the short `"{n}. {Axis}"` form so all 3 tabs fit one row with no wrapping or horizontal scroll down to ~360px width.
- The method-card grid stacks to one column below `md:` (768px), matching `ContrastCardPair`'s existing breakpoint (About page).
- Tabs use `aria-current` on the active one (matching `PhoneMockupStepper`'s existing convention) and keep ≥8px gaps with comfortable touch padding.
- Long-form paragraphs use `max-w-prose`.
- All content is copied verbatim from the spec's Content section.

---

## Task 1: `AssessmentMethodology` — tabbed 3-phase methodology component

**Files:**
- Create: `frontend/components/how-it-works/AssessmentMethodology.tsx`
- Create: `frontend/components/how-it-works/AssessmentMethodology.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: nothing new.
- Produces: `export default function AssessmentMethodology()` — Task 2 (`ProcessSteps.tsx`) renders it.

- [ ] **Step 1: Write the failing tests**

Create `frontend/components/how-it-works/AssessmentMethodology.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AssessmentMethodology from './AssessmentMethodology'

describe('AssessmentMethodology', () => {
  it('renders the section title, intro, and the Hue phase by default', () => {
    renderWithIntl(<AssessmentMethodology />)
    expect(screen.getByRole('heading', { name: 'Đánh Giá Màu Sắc Cá Nhân' })).toBeInTheDocument()
    expect(screen.getByText(/Bộ câu hỏi được chia thành 3 giai đoạn/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)' })
    ).toBeInTheDocument()
    expect(screen.getByText('Tán xạ tĩnh mạch dưới ánh sáng tự nhiên')).toBeInTheDocument()
    expect(screen.getByText('Độ tương thích trang sức kim loại')).toBeInTheDocument()
    expect(screen.getByText('Phản ứng sinh học da Fitzpatrick')).toBeInTheDocument()
    expect(screen.getByText('Thử nghiệm Drapery sắc trắng')).toBeInTheDocument()
  })

  it('marks only the Hue tab as current by default', () => {
    renderWithIntl(<AssessmentMethodology />)
    expect(screen.getByRole('button', { name: '1. Hue' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: '2. Value' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: '3. Chroma' })).not.toHaveAttribute('aria-current')
  })

  it('switches to the Value phase when its tab is clicked', () => {
    renderWithIntl(<AssessmentMethodology />)
    fireEvent.click(screen.getByRole('button', { name: '2. Value' }))

    expect(
      screen.getByRole('heading', { name: 'Đo Lường Độ Sáng - Tối (Value: Light vs Deep)' })
    ).toBeInTheDocument()
    expect(screen.getByText('Chiều sâu sắc tố Mắt & Tóc tự nhiên')).toBeInTheDocument()
    expect(screen.getByText('Định lượng tương phản diện mạo (Contrast Level)')).toBeInTheDocument()
    expect(screen.getByText('Định hướng công thức phối màu trang phục')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2. Value' })).toHaveAttribute('aria-current', 'true')
  })

  it('switches to the Chroma phase when its tab is clicked', () => {
    renderWithIntl(<AssessmentMethodology />)
    fireEvent.click(screen.getByRole('button', { name: '3. Chroma' }))

    expect(
      screen.getByRole('heading', { name: 'Độ Bão Hòa & Khóa Kết Quả (Chroma: Clear vs Muted)' })
    ).toBeInTheDocument()
    expect(screen.getByText('Bài kiểm tra hiệu ứng lấp lánh (Sparkle Test)')).toBeInTheDocument()
    expect(screen.getByText('Đối chiếu chéo trải nghiệm thực tế (Triangulation)')).toBeInTheDocument()
    expect(screen.getByText('Khóa kết quả & Định vị mùa phụ (Sub-season)')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/how-it-works/AssessmentMethodology.test.tsx
```

Expected: FAIL — `AssessmentMethodology.tsx` doesn't exist.

- [ ] **Step 3: Add the `HowItWorks.AssessmentMethodology` translations**

In `frontend/messages/vi.json`, add this new object under `HowItWorks`, right after `Hero` (before `ProcessSteps`):

```json
"AssessmentMethodology": {
  "title": "Đánh Giá Màu Sắc Cá Nhân",
  "intro": "Bộ câu hỏi được chia thành 3 giai đoạn rõ rệt dựa trên 3 trục độc lập của Munsell, giao điểm của ba trục sẽ chỉ ra một trong 12 mùa.",
  "phases": {
    "hue": {
      "tabLabel": "1. Hue",
      "title": "Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)",
      "intro": "Tìm ra màu nền ẩn bên dưới da (Undertone) thông qua các phản ứng quang học trên bề mặt và cơ chế biến đổi sinh học tự nhiên dưới ánh sáng.",
      "methods": {
        "veins": {
          "title": "Tán xạ tĩnh mạch dưới ánh sáng tự nhiên",
          "body": "Quan sát sự phản chiếu qua thành mạch để nhận diện sắc tố ẩn: ánh xanh tím (Cool undertone) hoặc ánh xanh lá (Warm undertone chịu ảnh hưởng từ carotenoid)."
        },
        "jewelry": {
          "title": "Độ tương thích trang sức kim loại",
          "body": "Kiểm tra độ hòa hợp sắc da khi tiếp xúc gần với ánh kim để đối chiếu phản ứng cùng gam màu ấm (vàng) hay gam màu lạnh (bạc/bạch kim)."
        },
        "fitzpatrick": {
          "title": "Phản ứng sinh học da Fitzpatrick",
          "body": "Đo lường mức độ nhạy cảm trước ánh nắng mặt trời giữa phản ứng ửng đỏ (hoạt động của hemoglobin) và dễ rám nắng (tăng sinh eumelanin)."
        },
        "drapery": {
          "title": "Thử nghiệm Drapery sắc trắng",
          "body": "Phân tách sắc tố qua hai sắc thái chuẩn: sắc trắng tinh (Pure White) kích hoạt undertone lạnh và sắc trắng kem/ngà (Ivory) làm rạng rỡ undertone ấm."
        }
      }
    },
    "value": {
      "tabLabel": "2. Value",
      "title": "Đo Lường Độ Sáng - Tối (Value: Light vs Deep)",
      "intro": "Đo lường chiều sâu sắc tố tổng thể và định lượng độ chênh lệch sáng/tối giữa các vùng đặc trưng trên gương mặt ở trạng thái nguyên bản.",
      "methods": {
        "eyesHair": {
          "title": "Chiều sâu sắc tố Mắt & Tóc tự nhiên",
          "body": "Phân tích đặc điểm khuôn mặt (Facial feature analysis) ở trạng thái mộc nhằm xác định cấp độ giá trị sắc tố tổng thể thuộc nhóm Sáng (Light) hay Tối (Deep)."
        },
        "contrastLevel": {
          "title": "Định lượng tương phản diện mạo (Contrast Level)",
          "body": "Đo lường khoảng cách sắc độ giữa màu da, mắt và chân tóc để phân loại độ tương phản cao (High Contrast) hay tương phản thấp/đồng điệu (Low Contrast)."
        },
        "colorFormula": {
          "title": "Định hướng công thức phối màu trang phục",
          "body": "Chuyển hóa chỉ số tương phản khuôn mặt thành nguyên tắc chọn đồ: gợi ý cách phối màu đối lập rõ rệt hay phối màu đơn sắc/chuyển tông mượt mà (Tonal)."
        }
      }
    },
    "chroma": {
      "tabLabel": "3. Chroma",
      "title": "Độ Bão Hòa & Khóa Kết Quả (Chroma: Clear vs Muted)",
      "intro": "Đánh giá mức độ tương thích với dải màu rực rỡ hay trầm khói, kết hợp dữ liệu kiểm chứng đa chiều để khóa chuẩn xác 1 trong 12 mùa sắc thái.",
      "methods": {
        "sparkleTest": {
          "title": "Bài kiểm tra hiệu ứng lấp lánh (Sparkle Test)",
          "body": "Xác định giới hạn sắc độ giúp gương mặt nổi bật: nhóm Soft cần độ đục nhẹ để tránh bị lấn át, nhóm Bright cần độ bão hòa cao để diện mạo không mờ nhạt."
        },
        "triangulation": {
          "title": "Đối chiếu chéo trải nghiệm thực tế (Triangulation)",
          "body": "Thu thập dữ liệu từ những nhóm màu trang phục từng giúp bạn nhận được nhiều lời khen nhất nhằm kiểm chứng độ chuẩn xác của các bước phân tích."
        },
        "lockResult": {
          "title": "Khóa kết quả & Định vị mùa phụ (Sub-season)",
          "body": "Tổng hợp giao điểm của 3 trục Munsell để đưa ra kết luận mùa cá nhân chính xác tuyệt đối kèm bộ cẩm nang màu sắc độc bản."
        }
      }
    }
  }
},
```

- [ ] **Step 4: Implement `AssessmentMethodology.tsx`**

Create `frontend/components/how-it-works/AssessmentMethodology.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

const PHASES = [
  {
    key: 'hue',
    methodKeys: ['veins', 'jewelry', 'fitzpatrick', 'drapery'],
    icons: { veins: 'water_drop', jewelry: 'diamond', fitzpatrick: 'wb_sunny', drapery: 'checkroom' },
  },
  {
    key: 'value',
    methodKeys: ['eyesHair', 'contrastLevel', 'colorFormula'],
    icons: { eyesHair: 'visibility', contrastLevel: 'contrast', colorFormula: 'palette' },
  },
  {
    key: 'chroma',
    methodKeys: ['sparkleTest', 'triangulation', 'lockResult'],
    icons: { sparkleTest: 'auto_awesome', triangulation: 'hub', lockResult: 'verified' },
  },
] as const

export default function AssessmentMethodology() {
  const t = useTranslations('HowItWorks.AssessmentMethodology')
  const [activeIndex, setActiveIndex] = useState(0)
  const activePhase = PHASES[activeIndex]

  return (
    <div className="mb-20">
      <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-headline-sm font-bold text-on-secondary-fixed shadow-sm">
        01
      </div>
      <h3 className="text-headline-md font-bold text-on-surface">{t('title')}</h3>
      <p className="mt-space-sm max-w-prose text-body-lg leading-relaxed text-on-surface-variant">
        {t('intro')}
      </p>

      <div className="mt-space-lg flex flex-wrap gap-space-sm">
        {PHASES.map((phase, index) => (
          <button
            key={phase.key}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-current={index === activeIndex ? 'true' : undefined}
            className={`rounded-full px-space-lg py-space-sm text-label-lg font-semibold transition-colors ${
              index === activeIndex
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {t(`phases.${phase.key}.tabLabel`)}
          </button>
        ))}
      </div>

      <h4 className="mt-space-lg text-headline-sm font-bold text-on-surface">
        {t(`phases.${activePhase.key}.title`)}
      </h4>
      <p className="mt-space-xs max-w-prose text-body-md leading-relaxed text-on-surface-variant">
        {t(`phases.${activePhase.key}.intro`)}
      </p>

      <div className="mt-space-md grid grid-cols-1 gap-space-md md:grid-cols-2">
        {activePhase.methodKeys.map((methodKey) => (
          <div key={methodKey} className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <span className="material-symbols-outlined text-[24px] text-secondary">
              {(activePhase.icons as Record<string, string>)[methodKey]}
            </span>
            <h5 className="mt-space-xs text-label-lg font-bold text-on-surface">
              {t(`phases.${activePhase.key}.methods.${methodKey}.title`)}
            </h5>
            <p className="mt-space-xs text-body-sm text-on-surface-variant">
              {t(`phases.${activePhase.key}.methods.${methodKey}.body`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/how-it-works/AssessmentMethodology.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/components/how-it-works/AssessmentMethodology.tsx frontend/components/how-it-works/AssessmentMethodology.test.tsx frontend/messages/vi.json
git commit -m "feat: add the real personal color assessment methodology section"
```

---

## Task 2: Wire `AssessmentMethodology` into `ProcessSteps`, remove the old Step 1

**Files:**
- Modify: `frontend/components/how-it-works/ProcessSteps.tsx`
- Modify: `frontend/components/how-it-works/ProcessSteps.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: `AssessmentMethodology` from Task 1.
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Write the failing tests**

Replace `frontend/components/how-it-works/ProcessSteps.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ProcessSteps from './ProcessSteps'

describe('ProcessSteps', () => {
  it('renders the assessment methodology section in place of the old Step 1', () => {
    renderWithIntl(<ProcessSteps />)
    expect(screen.getByRole('heading', { name: 'Đánh Giá Màu Sắc Cá Nhân' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Chụp hoặc Tải Ảnh Khuôn Mặt')).not.toBeInTheDocument()
    expect(screen.queryByAltText(/AI Camera Calibrator/)).not.toBeInTheDocument()
  })

  it('renders the remaining step 2 and step 3 headings', () => {
    renderWithIntl(<ProcessSteps />)
    expect(screen.getByText('Phân Tích AI & Báo Cáo 12 Mùa Sắc Thái')).toBeInTheDocument()
    expect(screen.getByText('Thử Đồ Ảo 3D & Xây Dựng Capsule Wardrobe')).toBeInTheDocument()
  })

  it('still renders the step 3 garment image', () => {
    renderWithIntl(<ProcessSteps />)
    expect(screen.getByAltText(/Trang phục đã chọn/)).toHaveAttribute(
      'src',
      '/how-it-works/garment-isolated.jpg'
    )
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/how-it-works/ProcessSteps.test.tsx
```

Expected: FAIL on the first test — the old Step 1 still renders and `AssessmentMethodology` isn't wired in yet. The other two tests currently PASS and must keep passing after this task.

- [ ] **Step 3: Remove the old `step1` translations**

In `frontend/messages/vi.json`, delete the entire `step1` object from `HowItWorks.ProcessSteps` (everything from `"step1": {` through its matching closing `},`, i.e. `title`, `body`, `tipTitle`, `tipBody`, `checkAutoBg`, `checkPrivacy`, `calibratorLabel`, `calibratorSpec`, `imageAlt`, `lockLabel`, `undertoneLabel`, `undertoneValue`, `contrastLabel`, `contrastValue`, `pigmentLabel`, `pigmentValue`). `ProcessSteps.kicker` and `ProcessSteps.heading` stay; `step2` and `step3` stay untouched.

- [ ] **Step 4: Replace Step 1's JSX with `AssessmentMethodology`**

In `frontend/components/how-it-works/ProcessSteps.tsx`, add the import:

```tsx
import AssessmentMethodology from './AssessmentMethodology'
```

Replace the entire `{/* Step 1 */}` block — from `<div className="mb-20 grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">` through its matching closing `</div>` (everything between the heading block and the `{/* Step 2 */}` comment) — with:

```tsx
      <AssessmentMethodology />
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/how-it-works/ProcessSteps.test.tsx
```

Expected: PASS (all 3 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/components/how-it-works/ProcessSteps.tsx frontend/components/how-it-works/ProcessSteps.test.tsx frontend/messages/vi.json
git commit -m "feat: replace the how-it-works camera-scan step with the real assessment methodology"
```

---

## Task 3: Final integration

**Files:** none (verification only).

- [ ] **Step 1: Run the full frontend test suite**

```bash
cd frontend && npx vitest run
```

Expected: PASS, no regressions outside the `how-it-works`-related files.

- [ ] **Step 2: Run the TypeScript compiler as a final check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Manual visual check in a real browser**

With the frontend dev server running (`npm run dev`), visit `/how-it-works` and confirm, at both a desktop width (~1280px) and a mobile width (~390px):

1. Where Step 1 used to show a camera-mockup image, the new "Đánh Giá Màu Sắc Cá Nhân" section now appears full-width with 3 tabs (1. Hue / 2. Value / 3. Chroma).
2. All 3 tabs fit on one row with no wrapping or horizontal scroll at ~390px.
3. Clicking each tab swaps both the phase heading/intro and the method-card grid; the method cards stack to one column at ~390px and sit 2-per-row from tablet width up.
4. No leftover references to "AI Camera Calibrator", "1.024 điểm quang phổ", or the old camera image.
5. Steps 2 and 3 below are unchanged.

Report the outcome; fix any issue found before considering this task done.

- [ ] **Step 4: Invoke `finishing-a-development-branch`**

Announce: "I'm using the finishing-a-development-branch skill to complete this work." and follow that skill (verify tests, present the merge/PR/keep-as-is menu, act on the choice) for the `frontend` repo (branch `master`).
