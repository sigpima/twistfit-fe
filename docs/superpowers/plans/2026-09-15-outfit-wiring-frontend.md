# Outfit Wiring — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the outfit wizard frontend to the real backend (wardrobe, tryon, model_catalog, quiz_attempts), gated behind a "login required" modal, replacing the mock/local state built in the earlier UI pass.

**Architecture:** A new modal-based auth gate (`LoginRequiredModalProvider`, mirroring the existing `QrModalProvider` pattern) blocks both the header's feature link and direct navigation to any `/outfit/*` page. Shared wizard state (occasion/style selection, the in-flight try-on job id) moves from component-local state into `OutfitFlowProvider`. Each step then calls `apiFetch` directly where it needs real data — matching this codebase's existing convention of no dedicated API-client layer per domain.

**Tech Stack:** Next.js (App Router), TypeScript, TailwindCSS, next-intl, Vitest + React Testing Library, `vi.stubGlobal('fetch', ...)` for mocking (this codebase's established pattern — there is no module-level `apiFetch` mock anywhere in it).

**Spec:** `frontend/docs/superpowers/specs/2026-09-15-outfit-wizard-api-wiring-design.md`

**Depends on:** `2026-09-15-outfit-wiring-backend.md` (all 3 backend tasks) being deployed to whatever backend this frontend points at — the tests in this plan mock `fetch` and don't require the real backend running, but the manual verification task at the end does.

## Global Constraints

- Follow this repo's existing patterns: `'use client'` components use `useTranslations` from `next-intl` with keys added to `messages/vi.json`; API calls go through `apiFetch` from `lib/apiClient.ts` (which never throws — callers check `.ok`); tests use `renderWithIntl` from `test-utils/renderWithIntl.tsx` and mock network calls via `vi.stubGlobal('fetch', vi.fn()...)`, never a module-level `apiFetch` mock.
- The wardrobe grid in Step 1 is browse-only — no click-to-select interaction. The backend auto-selects the best-matching item by occasion/style/color; the frontend never sends a specific wardrobe item id.
- `selectedModel.id` can be the non-numeric `FALLBACK_MODEL` id (`'carmen'`) when the model catalog fetch failed — guard against sending `Number('carmen')` (`NaN`) to the backend.
- All new/changed JSON keys go in `messages/vi.json` — this app is Vietnamese-only (no locale switching).

---

## Task 1: Login-required modal (provider + component)

**Files:**
- Create: `components/auth/LoginRequiredModal.tsx`
- Create: `components/auth/LoginRequiredModalProvider.tsx`
- Test: `components/auth/LoginRequiredModalProvider.test.tsx`
- Modify: `app/layout.tsx`
- Modify: `messages/vi.json`

**Interfaces:**
- Produces: `LoginRequiredModalProvider` (context provider) and `useLoginRequiredModal(): { isOpen, openLoginRequiredModal, closeLoginRequiredModal }` — consumed by Tasks 2 and 3.

- [ ] **Step 1: Add the translation keys**

Add to `messages/vi.json`, as a new top-level key (alongside `QrModal`):

```json
"LoginRequiredModal": {
  "title": "Bạn cần đăng nhập",
  "description": "Đăng nhập để sử dụng tính năng phối đồ và lưu tủ đồ của riêng bạn.",
  "loginButton": "Đăng nhập ngay",
  "closeAriaLabel": "Đóng"
}
```

- [ ] **Step 2: Write the failing test**

Create `components/auth/LoginRequiredModalProvider.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { LoginRequiredModalProvider, useLoginRequiredModal } from './LoginRequiredModalProvider'

function TestConsumer() {
  const { openLoginRequiredModal, closeLoginRequiredModal } = useLoginRequiredModal()
  return (
    <div>
      <button onClick={openLoginRequiredModal}>open</button>
      <button onClick={closeLoginRequiredModal}>close</button>
    </div>
  )
}

describe('LoginRequiredModalProvider', () => {
  it('does not render the modal by default', () => {
    renderWithIntl(
      <LoginRequiredModalProvider>
        <TestConsumer />
      </LoginRequiredModalProvider>
    )
    expect(screen.queryByText('Bạn cần đăng nhập')).not.toBeInTheDocument()
  })

  it('opens the modal when openLoginRequiredModal is called', () => {
    renderWithIntl(
      <LoginRequiredModalProvider>
        <TestConsumer />
      </LoginRequiredModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByText('Bạn cần đăng nhập')).toBeInTheDocument()
  })

  it('closes the modal when the close button is clicked', () => {
    renderWithIntl(
      <LoginRequiredModalProvider>
        <TestConsumer />
      </LoginRequiredModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    fireEvent.click(screen.getByLabelText('Đóng'))
    expect(screen.queryByText('Bạn cần đăng nhập')).not.toBeInTheDocument()
  })

  it('links to the login page', () => {
    renderWithIntl(
      <LoginRequiredModalProvider>
        <TestConsumer />
      </LoginRequiredModalProvider>
    )
    fireEvent.click(screen.getByText('open'))
    expect(screen.getByRole('link', { name: /Đăng nhập ngay/ })).toHaveAttribute('href', '/login')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- components/auth/LoginRequiredModalProvider.test.tsx
```

Expected: FAIL — the module doesn't exist yet.

- [ ] **Step 4: Implement the modal component**

Create `components/auth/LoginRequiredModal.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

type LoginRequiredModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  const t = useTranslations('LoginRequiredModal')

  if (!isOpen) return null

  return (
    <div
      data-testid="login-required-modal-backdrop"
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
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h3 className="text-headline-sm font-bold text-on-surface">{t('title')}</h3>
          <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">{t('description')}</p>
          <Link
            href="/login"
            onClick={onClose}
            className="mt-6 flex items-center gap-2 rounded-full bg-primary px-space-lg py-space-sm text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            {t('loginButton')}
          </Link>
        </div>
      </div>
    </div>
  )
}
```

Create `components/auth/LoginRequiredModalProvider.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import LoginRequiredModal from './LoginRequiredModal'

type LoginRequiredModalContextValue = {
  isOpen: boolean
  openLoginRequiredModal: () => void
  closeLoginRequiredModal: () => void
}

const LoginRequiredModalContext = createContext<LoginRequiredModalContextValue | null>(null)

export function LoginRequiredModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const value: LoginRequiredModalContextValue = {
    isOpen,
    openLoginRequiredModal: () => setIsOpen(true),
    closeLoginRequiredModal: () => setIsOpen(false),
  }

  return (
    <LoginRequiredModalContext.Provider value={value}>
      {children}
      <LoginRequiredModal isOpen={isOpen} onClose={value.closeLoginRequiredModal} />
    </LoginRequiredModalContext.Provider>
  )
}

export function useLoginRequiredModal() {
  const context = useContext(LoginRequiredModalContext)
  if (!context) {
    throw new Error('useLoginRequiredModal must be used within a LoginRequiredModalProvider')
  }
  return context
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- components/auth/LoginRequiredModalProvider.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 6: Mount the provider**

Modify `app/layout.tsx` — add the import and nest it inside `AuthProvider` (order relative to `QrModalProvider` doesn't matter functionally):

```tsx
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'
import { LoginRequiredModalProvider } from '@/components/auth/LoginRequiredModalProvider'
```

```tsx
<AuthProvider>
  <QrModalProvider>
    <LoginRequiredModalProvider>
      <Header />
      {children}
      <Footer />
    </LoginRequiredModalProvider>
  </QrModalProvider>
</AuthProvider>
```

- [ ] **Step 7: Commit**

```bash
git add components/auth/LoginRequiredModal.tsx components/auth/LoginRequiredModalProvider.tsx components/auth/LoginRequiredModalProvider.test.tsx app/layout.tsx messages/vi.json
git commit -m "feat: add login-required modal provider"
```

---

## Task 2: Header auth guard on the outfit link

**Files:**
- Modify: `components/layout/Header.tsx`
- Test: `components/layout/Header.test.tsx` (create if it doesn't already exist, matching the pattern below; otherwise append)

**Interfaces:**
- Consumes: `useLoginRequiredModal` from Task 1.

- [ ] **Step 1: Write the failing test**

Add to `components/layout/Header.test.tsx` (a new `describe` block; if the file doesn't exist yet, create it with just this block plus the imports below):

```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Header from './Header'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginRequiredModalProvider } from '@/components/auth/LoginRequiredModalProvider'

function setStoredUser(user: { name: string; email: string; role: 'user' | 'admin' } | null) {
  if (user) {
    window.localStorage.setItem('twistfit.auth', JSON.stringify(user))
  } else {
    window.localStorage.removeItem('twistfit.auth')
  }
}

function renderHeader() {
  return renderWithIntl(
    <AuthProvider>
      <LoginRequiredModalProvider>
        <Header />
      </LoginRequiredModalProvider>
    </AuthProvider>
  )
}

describe('Header — outfit link auth guard', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('opens the login-required modal instead of navigating when signed out', () => {
    setStoredUser(null)
    renderHeader()
    fireEvent.click(screen.getByText('Phối đồ'))
    expect(screen.getByText('Bạn cần đăng nhập')).toBeInTheDocument()
  })

  it('does not open the modal when signed in', () => {
    setStoredUser({ name: 'Test', email: 'user@twistfit.vn', role: 'user' })
    renderHeader()
    fireEvent.click(screen.getByText('Phối đồ'))
    expect(screen.queryByText('Bạn cần đăng nhập')).not.toBeInTheDocument()
  })
})
```

Note: `afterEach` needs importing from `vitest` alongside the other named imports if this file is newly created.

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- components/layout/Header.test.tsx
```

Expected: FAIL — clicking "Phối đồ" while signed out does not currently show any modal (the link just navigates).

- [ ] **Step 3: Add the guard**

Modify `components/layout/Header.tsx` — add the import and use the hook, then special-case the `outfitStyling` link inside the `FEATURE_LINKS.map(...)`:

```tsx
import { useLoginRequiredModal } from '@/components/auth/LoginRequiredModalProvider'
```

```tsx
export default function Header() {
  const t = useTranslations('Header')
  const { user, logout } = useAuth()
  const { openLoginRequiredModal } = useLoginRequiredModal()
  const [isScrolled, setIsScrolled] = useState(false)
  // ...
```

```tsx
{FEATURE_LINKS.map((item) => (
  <Link
    key={item.href}
    href={item.href}
    onClick={(event) => {
      if (item.key === 'outfitStyling' && !user) {
        event.preventDefault()
        openLoginRequiredModal()
      }
    }}
    className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#3c4a63] transition-colors hover:bg-[#fdf3d3]"
  >
    {t(`features.${item.key}`)}
  </Link>
))}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- components/layout/Header.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Header.tsx components/layout/Header.test.tsx
git commit -m "feat: guard the header's outfit link behind the login-required modal"
```

---

## Task 3: Block direct navigation to `/outfit/*` when signed out

**Files:**
- Create: `components/outfit/OutfitAuthGate.tsx`
- Test: `components/outfit/OutfitAuthGate.test.tsx`
- Modify: `components/outfit/OutfitFlowChrome.tsx`

**Interfaces:**
- Consumes: `useAuth` (existing), `useLoginRequiredModal` from Task 1.
- Produces: `<OutfitAuthGate />`, a state-less-render (`null`) client component — mounted once inside `OutfitFlowChrome`.

- [ ] **Step 1: Write the failing test**

Create `components/outfit/OutfitAuthGate.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import OutfitAuthGate from './OutfitAuthGate'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginRequiredModalProvider } from '@/components/auth/LoginRequiredModalProvider'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}))

function setStoredUser(user: { name: string; email: string; role: 'user' | 'admin' } | null) {
  if (user) {
    window.localStorage.setItem('twistfit.auth', JSON.stringify(user))
  } else {
    window.localStorage.removeItem('twistfit.auth')
  }
}

function renderGate() {
  return renderWithIntl(
    <AuthProvider>
      <LoginRequiredModalProvider>
        <OutfitAuthGate />
      </LoginRequiredModalProvider>
    </AuthProvider>
  )
}

describe('OutfitAuthGate', () => {
  beforeEach(() => {
    replaceMock.mockClear()
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('redirects home and opens the login modal when signed out', async () => {
    setStoredUser(null)
    const { findByText } = renderGate()
    expect(await findByText('Bạn cần đăng nhập')).toBeInTheDocument()
    expect(replaceMock).toHaveBeenCalledWith('/')
  })

  it('does nothing for a signed-in user', () => {
    setStoredUser({ name: 'Test', email: 'user@twistfit.vn', role: 'user' })
    const { queryByText } = renderGate()
    expect(queryByText('Bạn cần đăng nhập')).not.toBeInTheDocument()
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- components/outfit/OutfitAuthGate.test.tsx
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement the gate**

Create `components/outfit/OutfitAuthGate.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useLoginRequiredModal } from '@/components/auth/LoginRequiredModalProvider'

export default function OutfitAuthGate() {
  const { user, isHydrated } = useAuth()
  const { openLoginRequiredModal } = useLoginRequiredModal()
  const router = useRouter()

  useEffect(() => {
    if (!isHydrated || user) return
    openLoginRequiredModal()
    router.replace('/')
  }, [isHydrated, user, openLoginRequiredModal, router])

  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- components/outfit/OutfitAuthGate.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Mount it in the flow chrome**

Modify `components/outfit/OutfitFlowChrome.tsx`:

```tsx
import OutfitAuthGate from './OutfitAuthGate'
```

```tsx
  return (
    <>
      <OutfitAuthGate />
      <OutfitStepper currentStep={currentStep} maxStepReached={Math.max(currentStep, maxStepReached) as FlowStep} />
      {children}
    </>
  )
```

- [ ] **Step 6: Commit**

```bash
git add components/outfit/OutfitAuthGate.tsx components/outfit/OutfitAuthGate.test.tsx components/outfit/OutfitFlowChrome.tsx
git commit -m "feat: block direct navigation to /outfit/* when signed out"
```

---

## Task 4: Shared occasion/style/job state on `OutfitFlowProvider`

**Files:**
- Modify: `components/outfit/OutfitFlowProvider.tsx`
- Modify: `components/outfit/OutfitFlowProvider.test.tsx`
- Modify: `lib/modelCatalog.ts`

**Interfaces:**
- Produces: `occasionStyleMode`/`setOccasionStyleMode`, `selectedOccasion`/`setSelectedOccasion`, `selectedStyle`/`setSelectedStyle`, `jobId`/`setJobId`, and `Model.sideImage: string | null` — consumed by Tasks 5, 7, 8.
- Also relocates `OccasionTag`/`StyleTag`/`OccasionStyleMode` type definitions here (previously in `components/outfit/step1/wardrobeMockData.ts`, which Task 5 deletes) since they're now flow-wide, not wardrobe-specific.

- [ ] **Step 1: Write the failing test**

Add to `components/outfit/OutfitFlowProvider.test.tsx` (new cases alongside whatever's already there):

```tsx
import { renderHook, act } from '@testing-library/react'
import { OutfitFlowProvider, useOutfitFlow } from './OutfitFlowProvider'

function wrapper({ children }: { children: React.ReactNode }) {
  return <OutfitFlowProvider>{children}</OutfitFlowProvider>
}

describe('OutfitFlowProvider — occasion/style/job state', () => {
  it('defaults to occasion mode, "hang-ngay", "casual", and no job', () => {
    const { result } = renderHook(() => useOutfitFlow(), { wrapper })
    expect(result.current.occasionStyleMode).toBe('occasion')
    expect(result.current.selectedOccasion).toBe('hang-ngay')
    expect(result.current.selectedStyle).toBe('casual')
    expect(result.current.jobId).toBeNull()
  })

  it('updates occasion, style, mode, and job id', () => {
    const { result } = renderHook(() => useOutfitFlow(), { wrapper })
    act(() => result.current.setOccasionStyleMode('style'))
    act(() => result.current.setSelectedStyle('formal'))
    act(() => result.current.setSelectedOccasion('du-tiec'))
    act(() => result.current.setJobId(42))
    expect(result.current.occasionStyleMode).toBe('style')
    expect(result.current.selectedStyle).toBe('formal')
    expect(result.current.selectedOccasion).toBe('du-tiec')
    expect(result.current.jobId).toBe(42)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- components/outfit/OutfitFlowProvider.test.tsx
```

Expected: FAIL — the new context fields don't exist yet.

- [ ] **Step 3: Implement the provider changes**

Replace the full contents of `components/outfit/OutfitFlowProvider.tsx`:

```tsx
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type Garment = {
  id: string
  name: string
  image: string
  thumbnail: string
  matchScore: string
  tone: string
  type: string
}

export const DEFAULT_GARMENT: Garment = {
  id: 'peplum-pink',
  name: 'Áo Peplum Voan Xếp Ly Hồng Phấn',
  image: '/outfit/garment-peplum-main.jpg',
  thumbnail: '/outfit/garment-peplum-thumb.jpg',
  matchScore: '98%',
  tone: 'Light Summer',
  type: 'Top',
}

export type Undertone = 'warm' | 'cool' | 'neutral'

export type Model = {
  id: string
  name: string
  image: string
  dossierImage: string
  sideImage: string | null
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
}

export const FALLBACK_MODEL: Model = {
  id: 'carmen',
  name: 'Carmen',
  image: '/outfit/models/carmen-card.jpg',
  dossierImage: '/outfit/models/carmen-dossier.jpg',
  sideImage: null,
  poseCount: 15,
  tagline: 'Tông da: Warm Neutral',
  undertone: 'neutral',
  height: '1m65',
  bodyShape: 'Đồng hồ cát',
  waist: '64cm',
  personalColor: 'Autumn Soft',
}

export type Pose = {
  id: string
  label: string
}

export const DEFAULT_POSE: Pose = { id: 'front', label: 'Đứng thẳng phía trước' }

export type FlowStep = 1 | 2 | 3 | 4

export type OccasionTag = 'hang-ngay' | 'di-lam' | 'du-tiec' | 'di-bien'
export type StyleTag = 'casual' | 'minimalist' | 'street' | 'formal'
export type OccasionStyleMode = 'occasion' | 'style'

type OutfitFlowContextValue = {
  selectedGarment: Garment
  setSelectedGarment: (garment: Garment) => void
  selectedModel: Model
  setSelectedModel: (model: Model) => void
  selectedPose: Pose
  setSelectedPose: (pose: Pose) => void
  maxStepReached: FlowStep
  markStepVisited: (step: FlowStep) => void
  occasionStyleMode: OccasionStyleMode
  setOccasionStyleMode: (mode: OccasionStyleMode) => void
  selectedOccasion: OccasionTag
  setSelectedOccasion: (tag: OccasionTag) => void
  selectedStyle: StyleTag
  setSelectedStyle: (tag: StyleTag) => void
  jobId: number | null
  setJobId: (id: number | null) => void
}

const OutfitFlowContext = createContext<OutfitFlowContextValue | null>(null)

export function OutfitFlowProvider({
  children,
  initialModel,
}: {
  children: ReactNode
  initialModel?: Model
}) {
  const [selectedGarment, setSelectedGarment] = useState<Garment>(DEFAULT_GARMENT)
  const [selectedModel, setSelectedModel] = useState<Model>(initialModel ?? FALLBACK_MODEL)
  const [selectedPose, setSelectedPose] = useState<Pose>(DEFAULT_POSE)
  const [maxStepReached, setMaxStepReached] = useState<FlowStep>(1)
  const [occasionStyleMode, setOccasionStyleMode] = useState<OccasionStyleMode>('occasion')
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionTag>('hang-ngay')
  const [selectedStyle, setSelectedStyle] = useState<StyleTag>('casual')
  const [jobId, setJobId] = useState<number | null>(null)

  function markStepVisited(step: FlowStep) {
    setMaxStepReached((current) => (step > current ? step : current))
  }

  return (
    <OutfitFlowContext.Provider
      value={{
        selectedGarment,
        setSelectedGarment,
        selectedModel,
        setSelectedModel,
        selectedPose,
        setSelectedPose,
        maxStepReached,
        markStepVisited,
        occasionStyleMode,
        setOccasionStyleMode,
        selectedOccasion,
        setSelectedOccasion,
        selectedStyle,
        setSelectedStyle,
        jobId,
        setJobId,
      }}
    >
      {children}
    </OutfitFlowContext.Provider>
  )
}

export function useOutfitFlow() {
  const context = useContext(OutfitFlowContext)
  if (!context) {
    throw new Error('useOutfitFlow must be used within an OutfitFlowProvider')
  }
  return context
}
```

- [ ] **Step 4: Add `sideImage` to the model catalog type**

Modify `lib/modelCatalog.ts` — add `sideImage: string | null` to the `CatalogModel` type, next to the existing `dossierImage: string` field (matching the backend's new `sideImage` field from Task 2 of the backend plan — `app/outfit/layout.tsx` already spreads `firstModel` into the initial `Model`, so this one type change is sufficient to carry it through without touching `layout.tsx` itself).

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- components/outfit/OutfitFlowProvider.test.tsx
```

Expected: PASS (all cases, old and new).

- [ ] **Step 6: Run the full outfit test suite to check for regressions**

```bash
npm test -- components/outfit app/outfit
```

Expected: any failures here are from Task 5 not having happened yet (since `OccasionTag`/`StyleTag` still live in `wardrobeMockData.ts` too, temporarily duplicated) — if `OccasionStyleSelector.tsx`/`WardrobeLibrary.tsx` still import from `./wardrobeMockData`, this is fine for now; Task 5 removes the duplication.

- [ ] **Step 7: Commit**

```bash
git add components/outfit/OutfitFlowProvider.tsx components/outfit/OutfitFlowProvider.test.tsx lib/modelCatalog.ts
git commit -m "feat: add shared occasion/style/job state and model side-image to OutfitFlowProvider"
```

---

## Task 5: Step 1 wardrobe — real listing, drop selection, real personal-color check

**Files:**
- Modify: `components/outfit/step1/WardrobeLibrary.tsx`
- Modify: `components/outfit/step1/WardrobeLibrary.test.tsx`
- Modify: `components/outfit/step1/OccasionStyleSelector.tsx`
- Modify: `components/outfit/step1/OccasionStyleSelector.test.tsx`
- Delete: `components/outfit/step1/wardrobeMockData.ts`
- Modify: `messages/vi.json`

**Interfaces:**
- Consumes: `occasionStyleMode`/`setOccasionStyleMode`/`selectedOccasion`/`setSelectedOccasion`/`selectedStyle`/`setSelectedStyle` from `OutfitFlowProvider` (Task 4).
- Produces: nothing new for later tasks — this is a leaf UI update.

- [ ] **Step 1: Update `OccasionStyleSelector` to import shared types and drop local wardrobe-mock coupling**

Modify `components/outfit/step1/OccasionStyleSelector.tsx` — change the type import line from:

```tsx
import type { OccasionTag, StyleTag } from './wardrobeMockData'
```

to:

```tsx
import type { OccasionTag, StyleTag } from '../OutfitFlowProvider'
```

(No other changes needed in this file — its props/behavior are unchanged, only where the types come from.)

Modify `components/outfit/step1/OccasionStyleSelector.test.tsx` similarly if it imports the tag types directly (check the file — if it only uses string literals like `'hang-ngay'` inline without importing the type, no change is needed there).

- [ ] **Step 2: Run the existing OccasionStyleSelector tests to verify they still pass**

```bash
npm test -- components/outfit/step1/OccasionStyleSelector.test.tsx
```

Expected: PASS (unchanged behavior, just a different import source).

- [ ] **Step 3: Add new translation keys for loading/error states**

Add to `messages/vi.json`'s `Outfit.Step1.WardrobeLibrary` section:

```json
"loadingItems": "Đang tải tủ đồ...",
"loadError": "Không tải được tủ đồ, vui lòng thử lại.",
"itemCountBadge": "{count} món đồ phù hợp"
```

Also delete the now-unused `"matchBadge": "Phối đồ ({count})",` line from that same `Outfit.Step1.WardrobeLibrary` section — it's replaced by `itemCountBadge` above, since there's no longer a "selected" count, just how many items match the current occasion/style filter.

- [ ] **Step 4: Write the failing test**

Replace the full contents of `components/outfit/step1/WardrobeLibrary.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import WardrobeLibrary from './WardrobeLibrary'
import { OutfitFlowProvider } from '../OutfitFlowProvider'

function renderLibrary() {
  return renderWithIntl(
    <OutfitFlowProvider>
      <WardrobeLibrary />
    </OutfitFlowProvider>
  )
}

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

const WARDROBE_ITEM = {
  id: 1,
  blobUrl: 'https://example.com/a.png',
  category: 'ao-thun',
  styleTags: ['casual'],
  occasionTags: ['hang-ngay'],
  dominantColors: ['#ff0000'],
}

describe('WardrobeLibrary', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse([WARDROBE_ITEM]))
        if (url.includes('/quiz-attempts/me')) return Promise.resolve(jsonResponse(null))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a loading state, then the fetched items', async () => {
    renderLibrary()
    expect(screen.getByText('Đang tải tủ đồ...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('ao-thun')).toBeInTheDocument())
  })

  it('shows an error message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))
    renderLibrary()
    await waitFor(() => expect(screen.getByText('Không tải được tủ đồ, vui lòng thử lại.')).toBeInTheDocument())
  })

  it('does not render a clickable/selectable card — items are plain display only', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getByText('ao-thun')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /ao-thun/ })).not.toBeInTheDocument()
  })

  it('shows the personal-color CTA link when the user has no quiz result', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getByRole('link', { name: /Personal Color/ })).toBeInTheDocument())
  })

  it('shows the real personal-color checkbox when the user has a quiz result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse([WARDROBE_ITEM]))
        if (url.includes('/quiz-attempts/me')) return Promise.resolve(jsonResponse({ season: 'autumn' }))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
    renderLibrary()
    await waitFor(() =>
      expect(screen.getByText('Phối đồ theo kết quả đánh giá personal color')).toBeInTheDocument()
    )
    expect(screen.queryByRole('link', { name: /Personal Color/ })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

```bash
npm test -- components/outfit/step1/WardrobeLibrary.test.tsx
```

Expected: FAIL — the component still uses mock data and the demo toggle, not real fetches.

- [ ] **Step 6: Rewrite the component**

Replace the full contents of `components/outfit/step1/WardrobeLibrary.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '../OutfitFlowProvider'
import OccasionStyleSelector from './OccasionStyleSelector'

type WardrobeItemResponse = {
  id: number
  blobUrl: string
  category: string
  styleTags: string[]
  occasionTags: string[]
  dominantColors: string[]
}

export default function WardrobeLibrary() {
  const t = useTranslations('Outfit.Step1.WardrobeLibrary')
  const { occasionStyleMode, setOccasionStyleMode, selectedOccasion, setSelectedOccasion, selectedStyle, setSelectedStyle } =
    useOutfitFlow()

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const [suggestExternal, setSuggestExternal] = useState(false)

  const [items, setItems] = useState<WardrobeItemResponse[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  const [hasPersonalColorResult, setHasPersonalColorResult] = useState(false)
  const [matchByPersonalColor, setMatchByPersonalColor] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiFetch('/wardrobe/items').then(async (response) => {
      if (cancelled) return
      if (!response.ok) {
        setLoadError(true)
        return
      }
      setItems((await response.json()) as WardrobeItemResponse[])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiFetch('/quiz-attempts/me').then(async (response) => {
      if (cancelled || !response.ok) return
      const result = (await response.json()) as { season: string } | null
      setHasPersonalColorResult(result !== null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const visibleItems = useMemo(() => {
    if (!items) return []
    const activeTag = occasionStyleMode === 'occasion' ? selectedOccasion : selectedStyle
    return items.filter((item) =>
      occasionStyleMode === 'occasion' ? item.occasionTags.includes(activeTag) : item.styleTags.includes(activeTag)
    )
  }, [items, occasionStyleMode, selectedOccasion, selectedStyle])

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSortMenuOpen((open) => !open)}
            aria-expanded={isSortMenuOpen}
            className="flex items-center gap-space-xs rounded-xl bg-surface-container-low px-space-md py-2 text-label-lg font-semibold text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">sort</span>
            <span>{t('sortLabel')}</span>
            <span className="material-symbols-outlined text-[18px]">
              {isSortMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {isSortMenuOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl bg-surface-container-lowest p-1 shadow-lg">
              <button
                type="button"
                onClick={() => setIsSortMenuOpen(false)}
                className="flex w-full items-center justify-between rounded-lg px-space-sm py-2 text-left text-label-md font-medium text-primary"
              >
                <span>{t('sortByCategory')}</span>
                <span className="material-symbols-outlined text-[18px]">check</span>
              </button>
            </div>
          )}
        </div>
        {items && (
          <span className="rounded-full bg-primary-fixed px-space-md py-2 text-label-lg font-semibold text-on-primary-fixed">
            {t('itemCountBadge', { count: visibleItems.length })}
          </span>
        )}
      </div>

      <div className="flex flex-col items-start gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <label className="flex cursor-pointer select-none items-center gap-space-xs">
          <input
            type="checkbox"
            checked={suggestExternal}
            onChange={(event) => setSuggestExternal(event.target.checked)}
          />
          <span className="text-label-md font-medium text-on-surface">{t('suggestExternalLabel')}</span>
        </label>
        {hasPersonalColorResult ? (
          <label className="flex cursor-pointer select-none items-center gap-space-xs">
            <input
              type="checkbox"
              checked={matchByPersonalColor}
              onChange={(event) => setMatchByPersonalColor(event.target.checked)}
            />
            <span className="text-label-md font-medium text-on-surface">{t('personalColorLabel')}</span>
          </label>
        ) : (
          <Link
            href="/personal-color/quiz"
            className="flex items-center gap-space-xs rounded-full bg-secondary-fixed px-space-md py-2 text-label-md font-semibold text-on-secondary-fixed hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">palette</span>
            <span>{t('personalColorCta')}</span>
          </Link>
        )}
      </div>

      <OccasionStyleSelector
        mode={occasionStyleMode}
        onModeChange={setOccasionStyleMode}
        selectedOccasion={selectedOccasion}
        onOccasionChange={setSelectedOccasion}
        selectedStyle={selectedStyle}
        onStyleChange={setSelectedStyle}
      />

      {loadError ? (
        <p className="rounded-2xl bg-error-container p-space-lg text-center text-body-md text-on-error-container">
          {t('loadError')}
        </p>
      ) : !items ? (
        <p className="rounded-2xl bg-surface-container-low p-space-lg text-center text-body-md text-on-surface-variant">
          {t('loadingItems')}
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="rounded-2xl bg-surface-container-low p-space-lg text-center text-body-md text-on-surface-variant">
          {t('emptyState')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3 md:grid-cols-4">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest text-left shadow-sm"
            >
              <div className="aspect-square w-full overflow-hidden bg-surface-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.blobUrl} alt={item.category} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col p-space-sm">
                <span className="truncate text-label-md font-semibold text-on-surface">{item.category}</span>
                <span className="text-body-sm text-on-surface-variant">{item.styleTags.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
npm test -- components/outfit/step1/WardrobeLibrary.test.tsx
```

Expected: PASS (5 tests).

- [ ] **Step 8: Delete the now-unused mock data file**

```bash
rm components/outfit/step1/wardrobeMockData.ts
```

Confirm nothing else imports it:

```bash
grep -rl "wardrobeMockData" .
```

Expected: no output (Task 5 Step 1 already updated `OccasionStyleSelector.tsx`'s import).

- [ ] **Step 9: Run the full outfit test suite**

```bash
npm test -- components/outfit app/outfit
```

Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add components/outfit/step1/WardrobeLibrary.tsx components/outfit/step1/WardrobeLibrary.test.tsx components/outfit/step1/OccasionStyleSelector.tsx components/outfit/step1/OccasionStyleSelector.test.tsx messages/vi.json
git rm components/outfit/step1/wardrobeMockData.ts
git commit -m "feat: wire Step 1 wardrobe grid to real GET /wardrobe/items and GET /quiz-attempts/me"
```

---

## Task 6: Real wardrobe upload flow

**Files:**
- Create: `components/outfit/step1/UploadFlow.tsx`
- Test: `components/outfit/step1/UploadFlow.test.tsx`
- Modify: `app/outfit/step-1/page.tsx`
- Delete: `components/outfit/step1/GarmentDropzone.tsx`, `GarmentDropzone.test.tsx`
- Delete: `components/outfit/step1/ProductUrlFetcher.tsx`, `ProductUrlFetcher.test.tsx`
- Delete: `components/outfit/step1/ColorHarmonyCard.tsx`, `ColorHarmonyCard.test.tsx`
- Modify: `messages/vi.json`

**Interfaces:**
- Produces: `<UploadFlow onUploaded={() => void} />` — the "Upload mới" tab's content; `onUploaded` lets `app/outfit/step-1/page.tsx` know a new item was saved (not required to do anything with it in this task, since Task 5's `WardrobeLibrary` already refetches on its own mount — but a page reload/tab switch back to "closet" is the simplest way to see the new item, which is acceptable for this pass).

This replaces the mock upload UI (`GarmentDropzone`/`ProductUrlFetcher`/`ColorHarmonyCard`, none of which are backed by any real endpoint — no product-URL scraping exists, and the "AI color harmony" numbers were fictional) with the real 4-step flow from the design spec.

- [ ] **Step 1: Add translation keys**

Add a new `UploadFlow` section under `Outfit.Step1` in `messages/vi.json`:

```json
"UploadFlow": {
  "pickFileTitle": "Chọn ảnh áo quần để thêm vào tủ đồ",
  "pickFileHint": "Hỗ trợ PNG, JPG, WEBP",
  "uploading": "Đang tải ảnh lên...",
  "analyzing": "Đang phân tích ảnh...",
  "categoryLabel": "Danh mục",
  "styleTagsLabel": "Phong cách",
  "occasionTagsLabel": "Dịp",
  "saveButton": "Lưu vào tủ đồ",
  "saving": "Đang lưu...",
  "savedMessage": "Đã lưu vào tủ đồ!",
  "errorMessage": "Có lỗi xảy ra, vui lòng thử lại.",
  "categories": {
    "aoThun": "Áo thun",
    "aoSoMi": "Áo sơ mi",
    "quanJean": "Quần jean",
    "dam": "Đầm",
    "aoKhoac": "Áo khoác"
  },
  "styles": {
    "casual": "Casual",
    "minimalist": "Minimalist",
    "street": "Street",
    "formal": "Formal"
  },
  "occasions": {
    "hangNgay": "Hằng ngày",
    "diLam": "Đi làm",
    "duTiec": "Dự tiệc",
    "diBien": "Đi biển"
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `components/outfit/step1/UploadFlow.test.tsx`:

```tsx
import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import UploadFlow from './UploadFlow'

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('UploadFlow', () => {
  it('uploads a file, shows suggested tags, and saves on confirm', async () => {
    const onUploaded = vi.fn()
    const putMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'PUT') return putMock(url, init)
        if (url.includes('/wardrobe/upload-url')) {
          return Promise.resolve(jsonResponse({ uploadUrl: 'https://blob.example.com/upload?sig=abc', blobPath: 'u1/x.png' }))
        }
        if (url.includes('/wardrobe/items/suggest-tags')) {
          return Promise.resolve(
            jsonResponse({
              category: 'ao-thun',
              styleTags: ['casual'],
              occasionTags: ['hang-ngay'],
              dominantColors: ['#ff0000'],
              blobUrl: 'https://blob.example.com/u1/x.png',
            })
          )
        }
        if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse({ id: 1 }))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )

    renderWithIntl(<UploadFlow onUploaded={onUploaded} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Chọn ảnh áo quần/) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('Lưu vào tủ đồ')).toBeInTheDocument())
    expect(putMock).toHaveBeenCalledWith('https://blob.example.com/upload?sig=abc', expect.objectContaining({ method: 'PUT' }))

    fireEvent.click(screen.getByText('Lưu vào tủ đồ'))

    await waitFor(() => expect(screen.getByText('Đã lưu vào tủ đồ!')).toBeInTheDocument())
    expect(onUploaded).toHaveBeenCalled()
  })

  it('shows an error message when the upload URL request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))

    renderWithIntl(<UploadFlow onUploaded={vi.fn()} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Chọn ảnh áo quần/) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- components/outfit/step1/UploadFlow.test.tsx
```

Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Implement the component**

Create `components/outfit/step1/UploadFlow.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState, type ChangeEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'

type Suggestion = {
  category: string
  styleTags: string[]
  occasionTags: string[]
  dominantColors: string[]
  blobUrl: string
}

type FlowState =
  | { step: 'pick' }
  | { step: 'uploading' }
  | { step: 'review'; blobPath: string; suggestion: Suggestion }
  | { step: 'saving'; blobPath: string; suggestion: Suggestion }
  | { step: 'saved' }
  | { step: 'error' }

const CATEGORIES = ['ao-thun', 'ao-so-mi', 'quan-jean', 'dam', 'ao-khoac'] as const
const STYLE_TAGS = ['casual', 'minimalist', 'street', 'formal'] as const
const OCCASION_TAGS = ['hang-ngay', 'di-lam', 'du-tiec', 'di-bien'] as const

const CATEGORY_KEYS: Record<(typeof CATEGORIES)[number], string> = {
  'ao-thun': 'aoThun',
  'ao-so-mi': 'aoSoMi',
  'quan-jean': 'quanJean',
  dam: 'dam',
  'ao-khoac': 'aoKhoac',
}

export default function UploadFlow({ onUploaded }: { onUploaded: () => void }) {
  const t = useTranslations('Outfit.Step1.UploadFlow')
  const [state, setState] = useState<FlowState>({ step: 'pick' })

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setState({ step: 'uploading' })

    const uploadUrlResponse = await apiFetch('/wardrobe/upload-url', { method: 'POST' })
    if (!uploadUrlResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const { uploadUrl, blobPath } = (await uploadUrlResponse.json()) as { uploadUrl: string; blobPath: string }

    await fetch(uploadUrl, { method: 'PUT', body: file })

    const suggestResponse = await apiFetch('/wardrobe/items/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blobPath }),
    })
    if (!suggestResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const suggestion = (await suggestResponse.json()) as Suggestion
    setState({ step: 'review', blobPath, suggestion })
  }

  function updateSuggestion(patch: Partial<Suggestion>) {
    if (state.step !== 'review') return
    setState({ ...state, suggestion: { ...state.suggestion, ...patch } })
  }

  async function handleSave() {
    if (state.step !== 'review') return
    const { suggestion } = state
    setState({ step: 'saving', blobPath: state.blobPath, suggestion })

    const response = await apiFetch('/wardrobe/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blobUrl: suggestion.blobUrl,
        category: suggestion.category,
        styleTags: suggestion.styleTags,
        occasionTags: suggestion.occasionTags,
        dominantColors: suggestion.dominantColors,
      }),
    })

    if (!response.ok) {
      setState({ step: 'error' })
      return
    }
    setState({ step: 'saved' })
    onUploaded()
  }

  if (state.step === 'pick') {
    return (
      <div className="flex flex-col items-center gap-space-md rounded-3xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-primary">cloud_upload</span>
        <label
          htmlFor="wardrobeUploadInput"
          className="cursor-pointer text-headline-sm font-semibold text-on-surface"
        >
          {t('pickFileTitle')}
        </label>
        <p className="text-body-sm text-on-surface-variant">{t('pickFileHint')}</p>
        <input id="wardrobeUploadInput" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  if (state.step === 'uploading') {
    return <p className="text-center text-body-md text-on-surface-variant">{t('uploading')}</p>
  }

  if (state.step === 'error') {
    return <p className="text-center text-body-md text-error">{t('errorMessage')}</p>
  }

  if (state.step === 'saved') {
    return <p className="text-center text-body-md text-primary">{t('savedMessage')}</p>
  }

  const { suggestion } = state
  const isSaving = state.step === 'saving'

  return (
    <div className="flex flex-col gap-space-md rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={suggestion.blobUrl} alt="" className="mx-auto h-48 w-48 object-contain" />

      <div className="flex flex-col gap-1">
        <span className="text-label-md font-semibold text-on-surface">{t('categoryLabel')}</span>
        <select
          value={suggestion.category}
          onChange={(event) => updateSuggestion({ category: event.target.value })}
          className="rounded-xl border border-outline px-space-sm py-2"
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`categories.${CATEGORY_KEYS[category]}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-label-md font-semibold text-on-surface">{t('styleTagsLabel')}</span>
        <div className="flex flex-wrap gap-2">
          {STYLE_TAGS.map((tag) => {
            const isChecked = suggestion.styleTags.includes(tag)
            return (
              <label key={tag} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    updateSuggestion({
                      styleTags: isChecked
                        ? suggestion.styleTags.filter((existing) => existing !== tag)
                        : [...suggestion.styleTags, tag],
                    })
                  }
                />
                {tag}
              </label>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-label-md font-semibold text-on-surface">{t('occasionTagsLabel')}</span>
        <div className="flex flex-wrap gap-2">
          {OCCASION_TAGS.map((tag) => {
            const isChecked = suggestion.occasionTags.includes(tag)
            return (
              <label key={tag} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    updateSuggestion({
                      occasionTags: isChecked
                        ? suggestion.occasionTags.filter((existing) => existing !== tag)
                        : [...suggestion.occasionTags, tag],
                    })
                  }
                />
                {tag}
              </label>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-full bg-primary px-space-lg py-space-sm text-label-lg font-semibold text-on-primary disabled:opacity-60"
      >
        {isSaving ? t('saving') : t('saveButton')}
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- components/outfit/step1/UploadFlow.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 6: Wire it into the Step 1 page, removing the old mock components**

Modify `app/outfit/step-1/page.tsx` — replace the imports and the "Upload mới" tab's content:

```tsx
import UploadFlow from '@/components/outfit/step1/UploadFlow'
```

(remove the `GarmentDropzone`, `ProductUrlFetcher`, `ColorHarmonyCard` imports)

```tsx
        {activeTab === 'closet' ? (
          <WardrobeLibrary />
        ) : (
          <UploadFlow onUploaded={() => setActiveTab('closet')} />
        )}
```

- [ ] **Step 7: Delete the now-unused mock components**

```bash
rm components/outfit/step1/GarmentDropzone.tsx components/outfit/step1/GarmentDropzone.test.tsx
rm components/outfit/step1/ProductUrlFetcher.tsx components/outfit/step1/ProductUrlFetcher.test.tsx
rm components/outfit/step1/ColorHarmonyCard.tsx components/outfit/step1/ColorHarmonyCard.test.tsx
grep -rl "GarmentDropzone\|ProductUrlFetcher\|ColorHarmonyCard" . --include="*.tsx" --include="*.ts"
```

Expected: the `grep` finds nothing (confirms no other file still imports them). Also remove their now-orphaned translation sections (`Outfit.Step1.GarmentDropzone`, `Outfit.Step1.ProductUrlFetcher`, `Outfit.Step1.ColorHarmonyCard`) from `messages/vi.json`.

- [ ] **Step 8: Run the full outfit test suite**

```bash
npm test -- components/outfit app/outfit
```

Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add components/outfit/step1/UploadFlow.tsx components/outfit/step1/UploadFlow.test.tsx app/outfit/step-1/page.tsx messages/vi.json
git rm components/outfit/step1/GarmentDropzone.tsx components/outfit/step1/GarmentDropzone.test.tsx components/outfit/step1/ProductUrlFetcher.tsx components/outfit/step1/ProductUrlFetcher.test.tsx components/outfit/step1/ColorHarmonyCard.tsx components/outfit/step1/ColorHarmonyCard.test.tsx
git commit -m "feat: replace mock upload UI with the real wardrobe upload flow"
```

---

## Task 7: Step 3 — create the real try-on job

**Files:**
- Modify: `app/outfit/step-3/page.tsx`
- Modify: `app/outfit/step-3/page.test.tsx`

**Interfaces:**
- Consumes: `selectedModel`, `occasionStyleMode`/`selectedOccasion`/`selectedStyle`, `selectedPose`, `setJobId` from `OutfitFlowProvider` (Task 4).
- Produces: on success, `jobId` is set in context before navigating — consumed by Task 8.

- [ ] **Step 1: Write the failing test**

Add to `app/outfit/step-3/page.test.tsx` (create it if it doesn't exist yet, using the same `vi.mock('next/navigation', ...)` + `renderWithIntl` + `OutfitFlowProvider` wrapping pattern as `app/outfit/step-1/page.test.tsx`):

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step3Page from './page'
import { OutfitFlowProvider, useOutfitFlow } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

function JobIdProbe() {
  const { jobId } = useOutfitFlow()
  return <p>jobId: {jobId ?? 'none'}</p>
}

describe('Step3Page', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates a try-on job and stores the job id before navigating', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 77 }, { status: 201 })))

    renderWithIntl(
      <OutfitFlowProvider>
        <JobIdProbe />
        <Step3Page />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByText('Tạo Đồ Ảo Ngay (Nhanh - 1 credit)'))

    await waitFor(() => expect(screen.getByText('jobId: 77')).toBeInTheDocument())
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-4')
  })

  it('does not navigate when job creation fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))

    renderWithIntl(
      <OutfitFlowProvider>
        <Step3Page />
      </OutfitFlowProvider>
    )

    fireEvent.click(screen.getByText('Tạo Đồ Ảo Ngay (Nhanh - 1 credit)'))

    await waitFor(() => expect(screen.getByText(/không thể tạo/i)).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

Note: confirm the exact current button text via `messages/vi.json`'s `Outfit.Step3.Page.generateButton` key before running this — use whatever that value actually is, verbatim, in the `getByText` call above.

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- app/outfit/step-3/page.test.tsx
```

Expected: FAIL — `handleGenerate` doesn't call the API yet.

- [ ] **Step 3: Add an error-message translation key**

Add to `messages/vi.json`'s `Outfit.Step3.Page` section:

```json
"generateError": "Không thể tạo yêu cầu phối đồ, vui lòng thử lại."
```

- [ ] **Step 4: Implement the real `handleGenerate`**

Modify `app/outfit/step-3/page.tsx` — add imports and state, replace `handleGenerate`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '@/components/outfit/OutfitFlowProvider'
import FlowOverviewBanner from '@/components/outfit/FlowOverviewBanner'
import QuickSelectionSummary from '@/components/outfit/step3/QuickSelectionSummary'
import PoseSelector from '@/components/outfit/step3/PoseSelector'
import RenderSettings from '@/components/outfit/step3/RenderSettings'
import BodyMeasurements from '@/components/outfit/step3/BodyMeasurements'

export default function Step3Page() {
  const t = useTranslations('Outfit.Step3.Page')
  const router = useRouter()
  const { selectedModel, selectedPose, occasionStyleMode, selectedOccasion, selectedStyle, setJobId } = useOutfitFlow()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(false)

  async function handleGenerate() {
    const catalogModelId = Number(selectedModel.id)
    if (Number.isNaN(catalogModelId)) {
      setGenerateError(true)
      return
    }

    setIsGenerating(true)
    setGenerateError(false)

    const response = await apiFetch('/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogModelId,
        occasion: occasionStyleMode === 'occasion' ? selectedOccasion : 'hang-ngay',
        style: occasionStyleMode === 'style' ? selectedStyle : 'casual',
        pose: selectedPose.id === 'side' ? 'side' : 'front',
      }),
    })

    setIsGenerating(false)

    if (!response.ok) {
      setGenerateError(true)
      return
    }

    const job = (await response.json()) as { id: number }
    setJobId(job.id)
    router.push('/outfit/step-4')
  }

  return (
    <div className="flex w-full flex-col pb-space-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-lg px-margin-desktop pt-space-lg">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-label-sm font-semibold uppercase text-on-secondary-fixed">
                {t('badge')}
              </span>
              <span className="text-outline-variant">•</span>
              <span className="text-label-sm text-outline">{t('engineBadge')}</span>
            </div>
            <h1 className="text-headline-lg text-on-surface">{t('heading')}</h1>
            <p className="text-body-md text-on-surface-variant">{t('subheading')}</p>
          </div>
          <QuickSelectionSummary />
        </div>
        <FlowOverviewBanner
          title={t('flowBannerTitle')}
          subtitle={t('flowBannerSubtitle')}
          image="/outfit/flow-overview-step3.png"
          imageAlt={t('flowBannerImageAlt')}
        />
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-7">
            <PoseSelector />
            <RenderSettings />
          </div>
          <div className="lg:col-span-5">
            <div className="flex flex-col gap-space-md">
              <BodyMeasurements />
              <div className="flex flex-col gap-space-sm">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="group flex w-full transform items-center justify-center gap-space-sm rounded-full bg-gradient-to-r from-secondary via-primary-container to-primary px-space-lg py-space-md text-headline-sm text-on-primary shadow-xl transition-all hover:shadow-2xl active:scale-98 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[26px] transition-transform group-hover:rotate-12">
                    bolt
                  </span>
                  <span>{t('generateButton')}</span>
                </button>
                {generateError && <p className="text-center text-body-sm text-error">{t('generateError')}</p>}
                <button
                  type="button"
                  onClick={() => router.push('/outfit/step-2')}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container px-space-md py-space-sm text-label-lg text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>{t('backButton')}</span>
                </button>
                <div className="flex items-center justify-center gap-2 text-label-sm text-outline">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>{t('estimatedTime')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container-low/70 p-space-lg md:flex-row">
          <div className="flex items-center gap-space-md">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container shadow-sm">
              <span className="material-symbols-outlined text-[32px]">tips_and_updates</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm text-on-surface">{t('tipTitle')}</span>
              <p className="max-w-2xl text-body-md text-on-surface-variant">{t('tipBody')}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-space-sm">
            <span className="text-label-lg font-semibold text-primary">{t('creditsBalance')}</span>
            <button
              type="button"
              className="rounded-full bg-primary-fixed px-space-md py-space-xs text-label-md font-semibold text-on-primary-fixed transition-all hover:bg-primary hover:text-on-primary"
            >
              {t('topUpButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- app/outfit/step-3/page.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add app/outfit/step-3/page.tsx app/outfit/step-3/page.test.tsx messages/vi.json
git commit -m "feat: create the real try-on job from Step 3 before navigating to Step 4"
```

---

## Task 8: Step 4 — poll the real job and show its result

**Files:**
- Modify: `components/outfit/step4/ResultPreview.tsx`
- Modify: `components/outfit/step4/ResultPreview.test.tsx`

**Interfaces:**
- Consumes: `jobId` from `OutfitFlowProvider` (Task 4).

- [ ] **Step 1: Add translation keys**

Add to `messages/vi.json`'s `Outfit.Step4.ResultPreview` section:

```json
"noJob": "Chưa có yêu cầu phối đồ nào.",
"backToStep1": "Quay lại Bước 1",
"processingStatus": "Đang xử lý phối đồ, vui lòng đợi...",
"failedStatus": "Không thể hoàn tất phối đồ."
```

- [ ] **Step 2: Write the failing test**

Replace the relevant parts of `components/outfit/step4/ResultPreview.test.tsx` — if this file doesn't already exist, create it fresh with:

```tsx
import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ResultPreview from './ResultPreview'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

function SetJobId({ jobId }: { jobId: number | null }) {
  const { setJobId } = useOutfitFlow()
  setJobId(jobId)
  return null
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('ResultPreview', () => {
  it('shows a "no job" message when there is no job id', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ResultPreview />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Chưa có yêu cầu phối đồ nào.')).toBeInTheDocument()
  })

  it('polls until the job is done, then shows the result image', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: 'processing' }))
      .mockResolvedValueOnce(jsonResponse({ status: 'done', resultBlobUrl: 'https://example.com/result.png' }))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider>
        <SetJobId jobId={7} />
        <ResultPreview />
      </OutfitFlowProvider>
    )

    expect(screen.getByText('Đang xử lý phối đồ, vui lòng đợi...')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(3000)
    await waitFor(() => expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.com/result.png'))
  })

  it('shows the error message when the job fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ status: 'failed', errorMessage: 'Không tìm thấy món đồ phù hợp' }))
    )

    renderWithIntl(
      <OutfitFlowProvider>
        <SetJobId jobId={9} />
        <ResultPreview />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(screen.getByText('Không tìm thấy món đồ phù hợp')).toBeInTheDocument())
  })
})
```

Note: `SetJobId` calling `setJobId` directly in render (not in an effect) is unusual but works for a one-shot test seed like this since `OutfitFlowProvider`'s state setter is stable and safe to call synchronously during a child's render in a test context; if this causes an "update during render" warning in practice, move it into a `useEffect` with an empty dependency array instead.

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- components/outfit/step4/ResultPreview.test.tsx
```

Expected: FAIL — the component currently shows the hardcoded mock image unconditionally.

- [ ] **Step 4: Implement polling in the component**

Modify `components/outfit/step4/ResultPreview.tsx` — add the polling logic and conditional rendering around the existing image block, keeping the rest of the decorative UI (AI review card, share/fullscreen buttons, etc.) unchanged:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '../OutfitFlowProvider'

type JobStatus = 'pending' | 'processing' | 'done' | 'failed'
type JobPollResult = { status: JobStatus; resultBlobUrl: string | null; errorMessage: string | null }

export default function ResultPreview() {
  const t = useTranslations('Outfit.Step4.ResultPreview')
  const { selectedModel, selectedGarment, jobId } = useOutfitFlow()
  const [isZoomed, setIsZoomed] = useState(false)
  const [rotationStatus, setRotationStatus] = useState<string | null>(null)
  const [job, setJob] = useState<JobPollResult | null>(null)

  useEffect(() => {
    if (jobId === null) return
    let cancelled = false

    async function poll() {
      const response = await apiFetch(`/tryon/${jobId}`)
      if (cancelled || !response.ok) return
      const result = (await response.json()) as JobPollResult
      setJob(result)
      if (result.status === 'pending' || result.status === 'processing') {
        setTimeout(poll, 3000)
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [jobId])

  if (jobId === null) {
    return <p className="text-center text-body-md text-on-surface-variant">{t('noJob')}</p>
  }

  if (!job || job.status === 'pending' || job.status === 'processing') {
    return <p className="text-center text-body-md text-on-surface-variant">{t('processingStatus')}</p>
  }

  if (job.status === 'failed') {
    return <p className="text-center text-body-md text-error">{job.errorMessage ?? t('failedStatus')}</p>
  }

  const resultImageUrl = job.resultBlobUrl ?? '/outfit/flow-overview.png'

  return (
    <div className="flex flex-col gap-space-md">
      <div className="group relative w-full overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl">
        <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-inverse-surface/85 px-3 py-1 text-label-sm text-inverse-on-surface shadow-md backdrop-blur-md">
            <span className="h-2 w-2 animate-ping rounded-full bg-secondary" />
            {t('studioBadge')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-lowest/90 px-3 py-1 text-label-sm font-semibold text-primary shadow-sm backdrop-blur-md">
            <span className="material-symbols-outlined text-[15px]">motion_sensor_active</span>
            {t('physicsBadge')}
          </span>
        </div>
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5">
          <button
            type="button"
            title={t('zoomTitle')}
            onClick={() => setIsZoomed((zoomed) => !zoomed)}
            className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all ${
              isZoomed ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest/90 text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">zoom_in</span>
          </button>
          <button
            type="button"
            title={t('rotateTitle')}
            onClick={() => setRotationStatus(t('rotationStatus'))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface shadow-sm backdrop-blur-md transition-all hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">360</span>
          </button>
        </div>
        <div className="relative flex min-h-[520px] w-full flex-col items-center justify-center overflow-hidden bg-surface-container-low p-space-sm md:p-space-md">
          <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-surface-container shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultImageUrl}
              alt=""
              style={{ transform: isZoomed ? 'scale(1.35)' : 'scale(1)' }}
              className="h-auto w-full object-cover object-right transition-transform duration-500"
            />
            <div className="absolute bottom-3 right-3 rounded-md bg-inverse-surface/80 px-2.5 py-1 text-label-sm text-inverse-on-surface backdrop-blur-sm">
              {t('renderCompleteLabel')}
            </div>
          </div>
          {rotationStatus && (
            <p className="mt-space-sm text-label-sm text-on-surface-variant">{rotationStatus}</p>
          )}
          <div className="mt-space-sm flex w-full items-center justify-between px-space-xs text-on-surface-variant">
            <span className="flex items-center gap-1 text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              {t.rich('modelInfo', {
                name: selectedModel.name,
                height: selectedModel.height,
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
            <span className="flex items-center gap-1 text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">palette</span>
              {t.rich('garmentToneInfo', {
                tone: selectedGarment.tone,
                bold: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-fixed-dim" />
            <span className="text-body-sm text-on-surface-variant">{t('peplumNote')}</span>
          </div>
          <div className="flex items-center gap-space-sm text-on-surface-variant">
            <button type="button" className="flex items-center gap-1 text-label-sm transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">share</span> {t('shareButton')}
            </button>
            <span className="text-outline-variant">•</span>
            <button type="button" className="flex items-center gap-1 text-label-sm transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">fullscreen</span> {t('fullscreenButton')}
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-gradient-to-r from-surface-container-high/60 via-surface-container-low to-secondary-fixed/30 p-space-md shadow-sm">
        <div className="flex items-start gap-space-sm">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[22px]">psychology</span>
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-primary">
                {t('aiReviewTitle')}
              </span>
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-label-sm font-semibold text-on-secondary-container">
                {t('matchBadge')}
              </span>
            </div>
            <p className="text-body-md leading-relaxed text-on-surface">
              {t.rich('aiReviewBody', { bold: (chunks) => <strong>{chunks}</strong> })}
            </p>
            <div className="mt-space-sm flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-surface-container-lowest px-2.5 py-1 text-label-sm text-on-surface-variant">
                {t('toneTag')}
              </span>
              <span className="rounded-md bg-surface-container-lowest px-2.5 py-1 text-label-sm text-on-surface-variant">
                {t('contrastTag')}
              </span>
              <span className="rounded-md bg-surface-container-lowest px-2.5 py-1 text-label-sm text-on-surface-variant">
                {t('ratioTag')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

(The "AI review" card below the image stays hardcoded decorative copy — it was never backed by any real computation, and replacing it is out of scope for this API-wiring pass.)

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- components/outfit/step4/ResultPreview.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 6: Run the full frontend test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add components/outfit/step4/ResultPreview.tsx components/outfit/step4/ResultPreview.test.tsx messages/vi.json
git commit -m "feat: poll the real try-on job status and show its result in Step 4"
```

---

## Task 9: Manual end-to-end verification

**Files:** none — verification only, requires the real backend (with all 3 backend-plan tasks deployed) and the real CatVTON service running, per the earlier CatVTON/wardrobe-tryon plans' own manual verification tasks.

- [ ] **Step 1: Run the full automated suite one more time**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 2: Manually walk the flow in a browser**

With the real backend running (`GET /quiz-attempts/me`, `catalog_models.side_image`, and `POST /tryon`'s `pose` field all deployed):

1. Visit `/outfit/step-1` signed out — confirm the login-required modal appears and you're redirected home. Click the header's "Phối đồ" link signed out — same modal, no navigation.
2. Sign in, visit `/outfit/step-1` — confirm the wardrobe grid loads real items (or the empty state if you have none), the personal-color checkbox/CTA reflects your real quiz status, and switching occasion/style chips filters the grid.
3. Use "Upload mới" to add a real item — confirm it appears back in "Tủ đồ của tôi" tab.
4. Go through Step 2 (pick a model) and Step 3 (pick a pose, click "Tạo Đồ Ảo Ngay") — confirm Step 4 shows a processing state, then the real generated result once the background job finishes (tens of seconds).
5. Force a failure (e.g. pick an occasion/style combination with no matching wardrobe item) — confirm Step 4 shows a clear error instead of hanging.
