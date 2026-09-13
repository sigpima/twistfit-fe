# Camera Color-Season Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a live-camera page with a biometric-scan-style oval cutout surrounded by a switchable 12-variant color "frame" (seasonal color palette wheel), as a functional prototype — no capture, no backend calls.

**Architecture:** Next.js (App Router, TypeScript, TailwindCSS) frontend in `frontend/`, with pure logic (palette data, wedge geometry, index cycling) extracted into small testable modules under `lib/`, thin presentational components under `components/`, and a `useCameraStream` hook isolating all `getUserMedia` lifecycle handling. A skeleton FastAPI app lives in `backend/` for future features but is not used by this one.

**Tech Stack:** Next.js 14 (App Router), TypeScript, TailwindCSS, Vitest + React Testing Library (frontend tests), Python 3 + FastAPI (backend skeleton).

**Spec:** `docs/superpowers/specs/2026-09-10-camera-color-frame-design.md`

## Global Constraints

- Monorepo layout: `frontend/` (Next.js 14 App Router + TypeScript + TailwindCSS) and `backend/` (FastAPI skeleton, no endpoints yet) — per spec's "Project structure" section.
- This feature does not capture, store, or transmit any photo/video — it is a live preview only.
- Home page (`frontend/app/page.tsx`) has exactly one button, no nav menu, no auth.
- Camera-dependent UI (permission flow, live video, actual device behavior) is verified manually in a real browser, not with automated tests — per spec's "Testing approach" section. Pure logic/data modules (palettes, wedge geometry, index cycling) and presentational components that don't depend on real camera hardware get automated tests (Vitest + React Testing Library).
- 12 palettes: Spring (Warm, Light, Bright), Summer (Cool, Light, Soft), Autumn (Warm, Deep, Soft), Winter (Cool, Deep, Bright) — colors are hand-authored approximations of the reference image, not pixel-extracted.
- Camera stream must stop (`track.stop()`) on unmount to release the device.

---

## Task 1: Scaffold the monorepo (frontend + backend skeletons)

**Files:**
- Create: `frontend/` (via `create-next-app`)
- Create: `backend/main.py`
- Create: `backend/requirements.txt`
- Create: `.gitignore` (repo root)

**Interfaces:**
- Produces: a `frontend/` Next.js app runnable with `npm run dev`, and a `backend/main.py` exposing a FastAPI `app` instance runnable with `uvicorn main:app`. No other task depends on backend internals — it stays untouched for the rest of this plan.

- [ ] **Step 1: Scaffold the Next.js app**

Run from the repo root (`/home/nuc/Documents/project/fashion-web`):

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

Accept defaults for any interactive prompt not covered by the flags above.

- [ ] **Step 2: Verify the frontend dev server boots**

```bash
cd frontend && npm run dev
```

Expected: server starts and prints a `Local: http://localhost:3000` URL with no errors. Stop it with Ctrl+C.

- [ ] **Step 3: Scaffold the FastAPI backend skeleton**

```bash
mkdir -p backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi "uvicorn[standard]"
pip freeze > requirements.txt
```

Create `backend/main.py`:

```python
from fastapi import FastAPI

app = FastAPI()
```

- [ ] **Step 4: Verify the backend boots**

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

Expected: log line `Application startup complete.` with no errors. Stop it with Ctrl+C, then `deactivate`.

- [ ] **Step 5: Add root `.gitignore`**

Create `.gitignore` at the repo root:

```
# frontend
frontend/node_modules/
frontend/.next/
frontend/.env*.local

# backend
backend/venv/
backend/__pycache__/
backend/**/__pycache__/

# editors
.DS_Store
```

- [ ] **Step 6: Commit**

```bash
git add frontend backend .gitignore
git commit -m "chore: scaffold Next.js frontend and FastAPI backend skeleton"
```

---

## Task 2: Palette data module + test tooling setup

**Files:**
- Create: `frontend/lib/palettes.ts`
- Test: `frontend/lib/palettes.test.ts`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/vitest.setup.ts`
- Modify: `frontend/package.json` (add `test` script)

**Interfaces:**
- Produces: `type Palette = { id: string; name: string; colors: string[] }` and `PALETTES: Palette[]` (12 entries) from `@/lib/palettes` — consumed by Task 9 (`app/camera-frame/page.tsx`).

- [ ] **Step 1: Install test tooling**

```bash
cd frontend
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Configure Vitest**

Create `frontend/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

Create `frontend/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

In `frontend/package.json`, add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Write the failing test**

Create `frontend/lib/palettes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { PALETTES } from './palettes'

describe('PALETTES', () => {
  it('has exactly 12 entries', () => {
    expect(PALETTES).toHaveLength(12)
  })

  it('has unique ids', () => {
    const ids = PALETTES.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every palette has a name and at least 6 colors', () => {
    for (const palette of PALETTES) {
      expect(palette.name.length).toBeGreaterThan(0)
      expect(palette.colors.length).toBeGreaterThanOrEqual(6)
      for (const color of palette.colors) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    }
  })

  it('covers all 4 seasons', () => {
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter']
    for (const season of seasons) {
      const matches = PALETTES.filter((p) => p.name.startsWith(season))
      expect(matches).toHaveLength(3)
    }
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd frontend && npm test -- lib/palettes.test.ts
```

Expected: FAIL — `frontend/lib/palettes.ts` does not exist yet (module not found).

- [ ] **Step 5: Implement the palette data**

Create `frontend/lib/palettes.ts`:

```ts
export type Palette = {
  id: string
  name: string
  colors: string[]
}

export const PALETTES: Palette[] = [
  { id: 'spring-warm', name: 'Spring · Warm', colors: ['#F2A93B', '#F4C542', '#8FC93A', '#E8622C', '#C23B3B', '#B23A6B', '#6C4FA0', '#3F7FBF', '#2FA6A0', '#4AA648'] },
  { id: 'spring-light', name: 'Spring · Light', colors: ['#F6D65A', '#F2A6C4', '#8FD1E0', '#A6D96A', '#F2B84B', '#E88A9A', '#B7DC8F', '#6FB5D9', '#9E7FC9', '#F0E48A'] },
  { id: 'spring-bright', name: 'Spring · Bright', colors: ['#3EC77A', '#F5E23E', '#F2A93B', '#E8452C', '#D6336C', '#7B3FA0', '#2F6FE0', '#1FB6C9', '#4ADE80', '#F5D742'] },
  { id: 'summer-cool', name: 'Summer · Cool', colors: ['#3F7F9E', '#5B9BD5', '#6FB7C9', '#8B6CA8', '#C2568F', '#7A8FC2', '#5FA0A0', '#4A6FA5', '#9E6FA0', '#3F5F8F'] },
  { id: 'summer-light', name: 'Summer · Light', colors: ['#A9D4E0', '#C9A9D4', '#F2C6D6', '#B7D9A9', '#9EC9E0', '#D4B7E0', '#A9E0C6', '#E0C9A9', '#C6A9E0', '#9ED4C9'] },
  { id: 'summer-soft', name: 'Summer · Soft', colors: ['#8A7F6A', '#9E8FA0', '#7F8F7A', '#A08F7F', '#6A7F8F', '#8F7A8A', '#7F9E9E', '#9E7F7A', '#6A8A7F', '#8F8A6A'] },
  { id: 'autumn-warm', name: 'Autumn · Warm', colors: ['#2F8F6A', '#D9822B', '#B2481C', '#8F3F2F', '#2F6F5A', '#C9A22B', '#7A3F1C', '#4F7F3F', '#B2601C', '#2F5F4F'] },
  { id: 'autumn-deep', name: 'Autumn · Deep', colors: ['#1F5F5A', '#6F1F2F', '#8F4F1F', '#2F4F1F', '#4F2F1F', '#7F5F1F', '#1F3F3F', '#5F1F3F', '#3F5F2F', '#6F3F1F'] },
  { id: 'autumn-soft', name: 'Autumn · Soft', colors: ['#8F7A5F', '#9E8F6A', '#7A8F6A', '#8F6A5F', '#6A7A5F', '#9E7A6A', '#7F8F7F', '#8A7A6F', '#6F8A7A', '#9E8A7F'] },
  { id: 'winter-cool', name: 'Winter · Cool', colors: ['#1F3F6F', '#2F5F8F', '#0F6F6F', '#3F2F6F', '#6F1F4F', '#1F4F8F', '#4F1F6F', '#0F4F5F', '#2F1F5F', '#1F6F8F'] },
  { id: 'winter-deep', name: 'Winter · Deep', colors: ['#0F1F4F', '#3F0F2F', '#4F0F3F', '#0F3F3F', '#2F0F4F', '#4F0F1F', '#0F2F4F', '#3F0F4F', '#1F0F3F', '#0F4F2F'] },
  { id: 'winter-bright', name: 'Winter · Bright', colors: ['#2F6FE0', '#D6336C', '#F5E23E', '#7B3FA0', '#0FBF9F', '#E0247A', '#3EC77A', '#2F2FE0', '#F5D742', '#C71585'] },
]
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd frontend && npm test -- lib/palettes.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add frontend/lib/palettes.ts frontend/lib/palettes.test.ts frontend/vitest.config.ts frontend/vitest.setup.ts frontend/package.json frontend/package-lock.json
git commit -m "feat: add 12-palette color data and Vitest test tooling"
```

---

## Task 3: Wedge geometry pure function

**Files:**
- Create: `frontend/lib/wedgeGeometry.ts`
- Test: `frontend/lib/wedgeGeometry.test.ts`

**Interfaces:**
- Produces: `type Wedge = { color: string; path: string }` and `buildWedges(colors: string[], centerX: number, centerY: number, innerRadius: number, outerRadius: number): Wedge[]` from `@/lib/wedgeGeometry` — consumed by Task 5 (`components/FrameOverlay.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/wedgeGeometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildWedges } from './wedgeGeometry'

describe('buildWedges', () => {
  it('returns one wedge per color, in order', () => {
    const colors = ['#111111', '#222222', '#333333', '#444444']
    const wedges = buildWedges(colors, 100, 100, 50, 90)
    expect(wedges).toHaveLength(4)
    expect(wedges.map((w) => w.color)).toEqual(colors)
  })

  it('every wedge has a non-empty SVG path starting with M', () => {
    const wedges = buildWedges(['#111111', '#222222'], 100, 100, 50, 90)
    for (const wedge of wedges) {
      expect(wedge.path.startsWith('M')).toBe(true)
      expect(wedge.path.length).toBeGreaterThan(0)
    }
  })

  it('returns an empty array for no colors', () => {
    expect(buildWedges([], 100, 100, 50, 90)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- lib/wedgeGeometry.test.ts
```

Expected: FAIL — module `./wedgeGeometry` not found.

- [ ] **Step 3: Implement the geometry function**

Create `frontend/lib/wedgeGeometry.ts`:

```ts
export type Wedge = {
  color: string
  path: string
}

export function buildWedges(
  colors: string[],
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number
): Wedge[] {
  const count = colors.length
  if (count === 0) return []

  const anglePerWedge = (2 * Math.PI) / count
  const wedges: Wedge[] = []

  for (let i = 0; i < count; i++) {
    const startAngle = i * anglePerWedge - Math.PI / 2
    const endAngle = startAngle + anglePerWedge

    const x1Outer = centerX + outerRadius * Math.cos(startAngle)
    const y1Outer = centerY + outerRadius * Math.sin(startAngle)
    const x2Outer = centerX + outerRadius * Math.cos(endAngle)
    const y2Outer = centerY + outerRadius * Math.sin(endAngle)

    const x1Inner = centerX + innerRadius * Math.cos(endAngle)
    const y1Inner = centerY + innerRadius * Math.sin(endAngle)
    const x2Inner = centerX + innerRadius * Math.cos(startAngle)
    const y2Inner = centerY + innerRadius * Math.sin(startAngle)

    const largeArc = anglePerWedge > Math.PI ? 1 : 0

    const path = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
      'Z',
    ].join(' ')

    wedges.push({ color: colors[i], path })
  }

  return wedges
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- lib/wedgeGeometry.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/wedgeGeometry.ts frontend/lib/wedgeGeometry.test.ts
git commit -m "feat: add pure wedge geometry function for frame overlay"
```

---

## Task 4: Frame cycling pure functions

**Files:**
- Create: `frontend/lib/frameCycle.ts`
- Test: `frontend/lib/frameCycle.test.ts`

**Interfaces:**
- Produces: `nextIndex(current: number, length: number): number` and `prevIndex(current: number, length: number): number` from `@/lib/frameCycle` — consumed by Task 9 (`app/camera-frame/page.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/frameCycle.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { nextIndex, prevIndex } from './frameCycle'

describe('nextIndex', () => {
  it('advances by one', () => {
    expect(nextIndex(0, 12)).toBe(1)
  })

  it('wraps from the last index to 0', () => {
    expect(nextIndex(11, 12)).toBe(0)
  })
})

describe('prevIndex', () => {
  it('goes back by one', () => {
    expect(prevIndex(5, 12)).toBe(4)
  })

  it('wraps from 0 to the last index', () => {
    expect(prevIndex(0, 12)).toBe(11)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- lib/frameCycle.test.ts
```

Expected: FAIL — module `./frameCycle` not found.

- [ ] **Step 3: Implement the cycling functions**

Create `frontend/lib/frameCycle.ts`:

```ts
export function nextIndex(current: number, length: number): number {
  if (length === 0) return 0
  return (current + 1) % length
}

export function prevIndex(current: number, length: number): number {
  if (length === 0) return 0
  return (current - 1 + length) % length
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- lib/frameCycle.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/frameCycle.ts frontend/lib/frameCycle.test.ts
git commit -m "feat: add wrap-around frame index cycling functions"
```

---

## Task 5: FrameOverlay component (SVG oval cutout + color wedges)

**Files:**
- Create: `frontend/components/FrameOverlay.tsx`
- Test: `frontend/components/FrameOverlay.test.tsx`

**Interfaces:**
- Consumes: `buildWedges` from `@/lib/wedgeGeometry` (Task 3).
- Produces: `FrameOverlay({ colors: string[] })` default export from `@/components/FrameOverlay` — consumed by Task 9 (`app/camera-frame/page.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/FrameOverlay.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import FrameOverlay from './FrameOverlay'

describe('FrameOverlay', () => {
  it('renders one SVG path per color', () => {
    const colors = ['#111111', '#222222', '#333333']
    const { container } = render(<FrameOverlay colors={colors} />)
    const paths = container.querySelectorAll('g[data-testid="wedge-ring"] path')
    expect(paths).toHaveLength(3)
  })

  it('renders each wedge with the matching fill color', () => {
    const colors = ['#111111', '#222222']
    const { container } = render(<FrameOverlay colors={colors} />)
    const paths = container.querySelectorAll('g[data-testid="wedge-ring"] path')
    expect(paths[0].getAttribute('fill')).toBe('#111111')
    expect(paths[1].getAttribute('fill')).toBe('#222222')
  })

  it('renders an oval cutout mask', () => {
    const { container } = render(<FrameOverlay colors={['#111111']} />)
    expect(container.querySelector('mask#oval-cutout ellipse')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- components/FrameOverlay.test.tsx
```

Expected: FAIL — module `./FrameOverlay` not found.

- [ ] **Step 3: Implement the component**

Create `frontend/components/FrameOverlay.tsx`:

```tsx
'use client'

import { buildWedges } from '@/lib/wedgeGeometry'

type FrameOverlayProps = {
  colors: string[]
}

const VIEWBOX_SIZE = 200
const CENTER = VIEWBOX_SIZE / 2
const INNER_RADIUS = 55
const OUTER_RADIUS = 95
const OVAL_STRETCH_Y = 1.3

export default function FrameOverlay({ colors }: FrameOverlayProps) {
  const wedges = buildWedges(colors, CENTER, CENTER, INNER_RADIUS, OUTER_RADIUS)

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <mask id="oval-cutout">
          <rect x="0" y="0" width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} fill="white" />
          <ellipse
            cx={CENTER}
            cy={CENTER}
            rx={INNER_RADIUS}
            ry={INNER_RADIUS * OVAL_STRETCH_Y}
            fill="black"
          />
        </mask>
      </defs>

      <rect
        x="0"
        y="0"
        width={VIEWBOX_SIZE}
        height={VIEWBOX_SIZE}
        fill="rgba(0,0,0,0.55)"
        mask="url(#oval-cutout)"
      />

      <g
        data-testid="wedge-ring"
        transform={`translate(${CENTER} ${CENTER}) scale(1 ${OVAL_STRETCH_Y}) translate(${-CENTER} ${-CENTER})`}
      >
        {wedges.map((wedge, index) => (
          <path key={index} d={wedge.path} fill={wedge.color} opacity={0.9} />
        ))}
      </g>
    </svg>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- components/FrameOverlay.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/FrameOverlay.tsx frontend/components/FrameOverlay.test.tsx
git commit -m "feat: add FrameOverlay component with oval cutout and color wedges"
```

---

## Task 6: FrameSwitcher component

**Files:**
- Create: `frontend/components/FrameSwitcher.tsx`
- Test: `frontend/components/FrameSwitcher.test.tsx`

**Interfaces:**
- Produces: `FrameSwitcher({ currentName: string; onPrev: () => void; onNext: () => void })` default export from `@/components/FrameSwitcher` — consumed by Task 9 (`app/camera-frame/page.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/FrameSwitcher.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FrameSwitcher from './FrameSwitcher'

describe('FrameSwitcher', () => {
  it('displays the current frame name', () => {
    render(<FrameSwitcher currentName="Spring · Bright" onPrev={() => {}} onNext={() => {}} />)
    expect(screen.getByText('Spring · Bright')).toBeInTheDocument()
  })

  it('calls onPrev when the previous button is clicked', () => {
    const onPrev = vi.fn()
    render(<FrameSwitcher currentName="Spring · Bright" onPrev={onPrev} onNext={() => {}} />)
    fireEvent.click(screen.getByLabelText('Frame trước'))
    expect(onPrev).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when the next button is clicked', () => {
    const onNext = vi.fn()
    render(<FrameSwitcher currentName="Spring · Bright" onPrev={() => {}} onNext={onNext} />)
    fireEvent.click(screen.getByLabelText('Frame sau'))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- components/FrameSwitcher.test.tsx
```

Expected: FAIL — module `./FrameSwitcher` not found.

- [ ] **Step 3: Implement the component**

Create `frontend/components/FrameSwitcher.tsx`:

```tsx
'use client'

type FrameSwitcherProps = {
  currentName: string
  onPrev: () => void
  onNext: () => void
}

export default function FrameSwitcher({ currentName, onPrev, onNext }: FrameSwitcherProps) {
  return (
    <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6 text-white">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Frame trước"
        className="rounded-full bg-white/20 px-4 py-2 text-xl"
      >
        ‹
      </button>
      <span className="min-w-[10rem] text-center text-lg font-medium">{currentName}</span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Frame sau"
        className="rounded-full bg-white/20 px-4 py-2 text-xl"
      >
        ›
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- components/FrameSwitcher.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/FrameSwitcher.tsx frontend/components/FrameSwitcher.test.tsx
git commit -m "feat: add FrameSwitcher prev/next control"
```

---

## Task 7: useCameraStream hook

**Files:**
- Create: `frontend/hooks/useCameraStream.ts`
- Test: `frontend/hooks/useCameraStream.test.ts`

**Interfaces:**
- Produces: `type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error'`, `type CameraStreamState = { status: CameraStatus; stream: MediaStream | null; errorMessage: string | null }`, and `useCameraStream(): CameraStreamState` from `@/hooks/useCameraStream` — consumed by Task 8 (`components/CameraView.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/hooks/useCameraStream.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCameraStream } from './useCameraStream'

function makeFakeStream() {
  const stop = vi.fn()
  return {
    getTracks: () => [{ stop }],
    __stop: stop,
  } as unknown as MediaStream & { __stop: typeof stop }
}

beforeEach(() => {
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: vi.fn(),
    },
  })
})

describe('useCameraStream', () => {
  it('sets status to ready and exposes the stream on success', async () => {
    const fakeStream = makeFakeStream()
    ;(navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValue(fakeStream)

    const { result } = renderHook(() => useCameraStream())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.stream).toBe(fakeStream)
    expect(result.current.errorMessage).toBeNull()
  })

  it('sets status to error with a message on permission denial', async () => {
    ;(navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Permission denied')
    )

    const { result } = renderHook(() => useCameraStream())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.errorMessage).toBe('Permission denied')
    expect(result.current.stream).toBeNull()
  })

  it('stops all tracks on unmount', async () => {
    const fakeStream = makeFakeStream()
    ;(navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockResolvedValue(fakeStream)

    const { result, unmount } = renderHook(() => useCameraStream())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    unmount()

    expect(fakeStream.__stop).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- hooks/useCameraStream.test.ts
```

Expected: FAIL — module `./useCameraStream` not found.

- [ ] **Step 3: Implement the hook**

Create `frontend/hooks/useCameraStream.ts`:

```ts
'use client'

import { useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error'

export type CameraStreamState = {
  status: CameraStatus
  stream: MediaStream | null
  errorMessage: string | null
}

export function useCameraStream(): CameraStreamState {
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      setStatus('requesting')
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = mediaStream
        setStream(mediaStream)
        setStatus('ready')
      } catch (error) {
        if (cancelled) return
        setErrorMessage(error instanceof Error ? error.message : 'Không thể truy cập camera')
        setStatus('error')
      }
    }

    start()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  return { status, stream, errorMessage }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- hooks/useCameraStream.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/hooks/useCameraStream.ts frontend/hooks/useCameraStream.test.ts
git commit -m "feat: add useCameraStream hook for getUserMedia lifecycle"
```

---

## Task 8: CameraView component

**Files:**
- Create: `frontend/components/CameraView.tsx`
- Test: `frontend/components/CameraView.test.tsx`

**Interfaces:**
- Consumes: `useCameraStream` from `@/hooks/useCameraStream` (Task 7).
- Produces: `CameraView()` default export (no props) from `@/components/CameraView` — consumed by Task 9 (`app/camera-frame/page.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/CameraView.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CameraView from './CameraView'
import { useCameraStream } from '@/hooks/useCameraStream'

vi.mock('@/hooks/useCameraStream', () => ({
  useCameraStream: vi.fn(),
}))

describe('CameraView', () => {
  it('shows an error message when the hook reports an error', () => {
    vi.mocked(useCameraStream).mockReturnValue({
      status: 'error',
      stream: null,
      errorMessage: 'Permission denied',
    })

    render(<CameraView />)
    expect(screen.getByText(/Permission denied/)).toBeInTheDocument()
  })

  it('renders the video element when the stream is ready', () => {
    vi.mocked(useCameraStream).mockReturnValue({
      status: 'ready',
      stream: { getTracks: () => [] } as unknown as MediaStream,
      errorMessage: null,
    })

    render(<CameraView />)
    expect(screen.getByTestId('camera-video')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- components/CameraView.test.tsx
```

Expected: FAIL — module `./CameraView` not found.

- [ ] **Step 3: Implement the component**

Create `frontend/components/CameraView.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { useCameraStream } from '@/hooks/useCameraStream'

export default function CameraView() {
  const { status, stream, errorMessage } = useCameraStream()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (status === 'error') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black p-6 text-center text-white">
        <p>Không thể mở camera: {errorMessage}. Vui lòng cấp quyền camera và tải lại trang.</p>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="h-full w-full scale-x-[-1] object-cover"
      data-testid="camera-video"
    />
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- components/CameraView.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/CameraView.tsx frontend/components/CameraView.test.tsx
git commit -m "feat: add CameraView component with error and ready states"
```

---

## Task 9: Camera-frame page (composition)

**Files:**
- Create: `frontend/app/camera-frame/page.tsx`

**Interfaces:**
- Consumes: `PALETTES` from `@/lib/palettes` (Task 2), `nextIndex`/`prevIndex` from `@/lib/frameCycle` (Task 4), `CameraView` from `@/components/CameraView` (Task 8), `FrameOverlay` from `@/components/FrameOverlay` (Task 5), `FrameSwitcher` from `@/components/FrameSwitcher` (Task 6).
- Produces: the `/camera-frame` route — consumed by Task 10 (`app/page.tsx` links to it).

This task wires together already-tested units, so there's no new pure logic to unit test — verification happens in Task 11's manual pass.

- [ ] **Step 1: Implement the page**

Create `frontend/app/camera-frame/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import CameraView from '@/components/CameraView'
import FrameOverlay from '@/components/FrameOverlay'
import FrameSwitcher from '@/components/FrameSwitcher'
import { PALETTES } from '@/lib/palettes'
import { nextIndex, prevIndex } from '@/lib/frameCycle'

export default function CameraFramePage() {
  const [index, setIndex] = useState(0)
  const current = PALETTES[index]

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <CameraView />
      <FrameOverlay colors={current.colors} />
      <FrameSwitcher
        currentName={current.name}
        onPrev={() => setIndex((i) => prevIndex(i, PALETTES.length))}
        onNext={() => setIndex((i) => nextIndex(i, PALETTES.length))}
      />
    </main>
  )
}
```

- [ ] **Step 2: Verify it builds and type-checks**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/camera-frame/page.tsx
git commit -m "feat: compose camera, overlay, and switcher into /camera-frame page"
```

---

## Task 10: Home page button

**Files:**
- Modify: `frontend/app/page.tsx` (replace the `create-next-app` default content)
- Test: `frontend/app/page.test.tsx`

**Interfaces:**
- Produces: the `/` route with a single link/button to `/camera-frame`.

- [ ] **Step 1: Write the failing test**

Create `frontend/app/page.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders a single link to /camera-frame', () => {
    render(<HomePage />)
    const link = screen.getByRole('link', { name: 'Thử tính năng Camera Frame' })
    expect(link).toHaveAttribute('href', '/camera-frame')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- app/page.test.tsx
```

Expected: FAIL — the default `create-next-app` home page has no link with this accessible name.

- [ ] **Step 3: Replace the home page content**

Replace the contents of `frontend/app/page.tsx`:

```tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex h-[100dvh] w-full items-center justify-center bg-neutral-100">
      <Link
        href="/camera-frame"
        className="rounded-full bg-neutral-900 px-8 py-4 text-lg font-medium text-white"
      >
        Thử tính năng Camera Frame
      </Link>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd frontend && npm test -- app/page.test.tsx
```

Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add frontend/app/page.tsx frontend/app/page.test.tsx
git commit -m "feat: replace default home page with single camera-frame entry button"
```

---

## Task 11: Manual verification pass

**Files:** none (verification only, per the spec's "Testing approach" section — camera behavior isn't automatable).

- [ ] **Step 1: Run the full automated test suite**

```bash
cd frontend && npm test
```

Expected: all tests from Tasks 2, 3, 4, 5, 6, 7, 8, 10 pass.

- [ ] **Step 2: Start the dev server and open the app**

```bash
cd frontend && npm run dev
```

Open `http://localhost:3000` in a browser.

- [ ] **Step 3: Verify the home page and navigation**

Confirm the page shows exactly one button ("Thử tính năng Camera Frame") and clicking it navigates to `/camera-frame`.

- [ ] **Step 4: Verify the camera permission and live view**

Grant camera permission when prompted. Confirm: the video feed is mirrored and full-screen, a dark overlay covers the screen with a transparent oval cutout showing your face, and colored wedge segments surround the oval.

- [ ] **Step 5: Verify frame switching**

Click the next (`›`) arrow 12 times and confirm the frame name and wedge colors change each time, cycling through all 12 names (Spring · Warm, Spring · Light, Spring · Bright, Summer · Cool, Summer · Light, Summer · Soft, Autumn · Warm, Autumn · Deep, Autumn · Soft, Winter · Cool, Winter · Deep, Winter · Bright) and wrapping back to the first. Click the previous (`‹`) arrow and confirm it wraps backward correctly too.

- [ ] **Step 6: Verify the permission-denied path**

In the browser's site settings, block camera access for `localhost:3000`, reload `/camera-frame`, and confirm a clear error message is shown instead of a blank screen.

- [ ] **Step 7: Verify responsive layout**

Using the browser's device toolbar, check the page at a mobile portrait size (e.g. 375×667) and a desktop landscape size (e.g. 1440×900). Confirm the oval and color wedges stay centered and proportioned at both sizes, with no horizontal scrollbar.

- [ ] **Step 8: Verify camera release on navigation**

With the camera active on `/camera-frame`, navigate back to `/`. Confirm the browser's camera-in-use indicator (tab icon or OS-level indicator) turns off.
