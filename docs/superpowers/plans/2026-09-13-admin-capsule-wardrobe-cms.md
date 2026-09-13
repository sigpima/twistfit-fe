# Admin: Quản lý Capsule Wardrobe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the 3 suggested outfit "capsule" sets shown at the bottom of Outfit Step 4
from a hardcoded array into the SQLite data layer, with admin CRUD under
`/admin/capsule-wardrobe`, and `/outfit/step-4` reading from the DB.

**Architecture:** New module `frontend/lib/capsuleWardrobe.ts` follows the exact
schema/CRUD/seed pattern already used by `lib/db.ts`, `lib/faq.ts`, and
`lib/modelCatalog.ts`, wired into `lib/getDb.ts`. Each set's small line-item list (garment +
price) is stored as a JSON array in one column — it's always edited as a unit with its parent
set, so it doesn't need the independent-row treatment `quiz_options` got. The hardcoded
Tailwind `tagClass` string per set becomes a `tagVariant` enum (`primary`/`secondary`/
`tertiary`) resolved to a real class via a small code-side lookup, mirroring
`components/blog/categoryPresentation.ts`. `app/outfit/step-4/page.tsx` is currently a Client
Component, so — same as Model Catalog's step 2 — it splits into a thin Server Component that
fetches the data and a renamed Client Component that receives it as a prop.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, Vitest + Testing Library,
next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-admin-content-cms-expansion-design.md`

## Global Constraints

- All `lib/capsuleWardrobe.ts` query functions take `db: Database.Database` as an explicit
  parameter (never a module-level singleton).
- `lib/capsuleWardrobe.ts` imports `better-sqlite3` **only as a type** — never as a value.
  Only `lib/getDb.ts` may `new Database(...)`.
- Route `params` are `Promise`s — `await params` in Route Handlers; resolve with
  `params.then(...)` inside `useEffect` in Client Component pages (never React's `use()`).
- No file upload: `image` is a plain URL string.
- The write API routes (`POST`/`PUT`/`DELETE` under `/api/capsule-wardrobe`) must reject
  requests without a valid signed admin session cookie (401).
- Reuse existing input/label/button Tailwind classes from `BlogPostForm.tsx`, and the
  add/remove repeatable-row pattern from `QuizQuestionForm.tsx` for the line-item list.
- All new UI text goes through `next-intl`, namespace `Admin.CapsuleForm` /
  `Admin.CapsuleList`.
- Every new component/module gets a co-located `.test.ts`/`.test.tsx` file, written and run
  red before implementation (TDD).
- No sort order needed — 3 sets display in creation order, same as every other CMS type in
  this expansion.

---

## Task 1: Data layer — Capsule Wardrobe schema, CRUD, seed

**Files:**
- Create: `frontend/lib/capsuleWardrobe.ts`
- Test: `frontend/lib/capsuleWardrobe.test.ts`

**Interfaces:**
- Produces: `TagVariant` (`'primary' | 'secondary' | 'tertiary'`), `TAG_VARIANTS:
  TagVariant[]`, `CapsuleItem`, `CapsuleSet`, `CapsuleSetInput`, `initSchema(db)`,
  `getCapsuleSets(db)`, `getCapsuleSetById(db, id)`, `createCapsuleSet(db, input)`,
  `updateCapsuleSet(db, id, input)`, `deleteCapsuleSet(db, id)`, `seedIfEmpty(db)`. Consumed
  by Task 2 (`getDb.ts` wiring) and all later tasks.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/capsuleWardrobe.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createCapsuleSet,
  getCapsuleSets,
  getCapsuleSetById,
  updateCapsuleSet,
  deleteCapsuleSet,
  seedIfEmpty,
  type CapsuleSetInput,
} from './capsuleWardrobe'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleSet: CapsuleSetInput = {
  image: '/outfit/capsule-set-test.jpg',
  alt: 'Ảnh set đồ test',
  tagVariant: 'primary',
  tagLabel: 'Set Test',
  fitFor: 'Phù hợp: Test',
  title: 'Tiêu đề test',
  tone: 'Test Tone',
  description: 'Mô tả test',
  items: [
    { label: 'Món đồ A:', price: '100.000 ₫' },
    { label: 'Món đồ B:', price: '200.000 ₫' },
  ],
}

describe('Capsule Wardrobe CRUD', () => {
  it('creates and reads back a set with its items in order', () => {
    const created = createCapsuleSet(db, sampleSet)
    expect(created.id).toBeGreaterThan(0)
    expect(created.items).toHaveLength(2)
    expect(created.items[0]).toEqual({ label: 'Món đồ A:', price: '100.000 ₫' })
  })

  it('lists sets in creation order', () => {
    createCapsuleSet(db, { ...sampleSet, title: 'Set 1' })
    createCapsuleSet(db, { ...sampleSet, title: 'Set 2' })
    expect(getCapsuleSets(db).map((s) => s.title)).toEqual(['Set 1', 'Set 2'])
  })

  it('replaces the item list on update', () => {
    const created = createCapsuleSet(db, sampleSet)
    const updated = updateCapsuleSet(db, created.id, {
      ...sampleSet,
      items: [{ label: 'Món đồ mới:', price: '300.000 ₫' }],
    })
    expect(updated?.items).toHaveLength(1)
    expect(updated?.items[0].label).toBe('Món đồ mới:')
    expect(updateCapsuleSet(db, 999999, sampleSet)).toBeNull()
  })

  it('deletes a set', () => {
    const created = createCapsuleSet(db, sampleSet)
    expect(deleteCapsuleSet(db, created.id)).toBe(true)
    expect(getCapsuleSetById(db, created.id)).toBeNull()
    expect(deleteCapsuleSet(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 3 capsule sets into an empty database', () => {
    seedIfEmpty(db)
    expect(getCapsuleSets(db)).toHaveLength(3)
  })

  it('does nothing if capsule_sets already has rows', () => {
    createCapsuleSet(db, sampleSet)
    seedIfEmpty(db)
    expect(getCapsuleSets(db)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/capsuleWardrobe.test.ts`
Expected: FAIL — `./capsuleWardrobe` module does not exist yet.

- [ ] **Step 3: Implement `lib/capsuleWardrobe.ts`**

Create `frontend/lib/capsuleWardrobe.ts`:
```ts
import type Database from 'better-sqlite3'

export type TagVariant = 'primary' | 'secondary' | 'tertiary'
export const TAG_VARIANTS: TagVariant[] = ['primary', 'secondary', 'tertiary']

export type CapsuleItem = {
  label: string
  price: string
}

export type CapsuleSet = {
  id: number
  image: string
  alt: string
  tagVariant: TagVariant
  tagLabel: string
  fitFor: string
  title: string
  tone: string
  description: string
  items: CapsuleItem[]
  createdAt: string
  updatedAt: string
}

export type CapsuleSetInput = {
  image: string
  alt: string
  tagVariant: TagVariant
  tagLabel: string
  fitFor: string
  title: string
  tone: string
  description: string
  items: CapsuleItem[]
}

type CapsuleSetRow = {
  id: number
  image: string
  alt: string
  tag_variant: string
  tag_label: string
  fit_for: string
  title: string
  tone: string
  description: string
  items_json: string
  created_at: string
  updated_at: string
}

function rowToCapsuleSet(row: CapsuleSetRow): CapsuleSet {
  return {
    id: row.id,
    image: row.image,
    alt: row.alt,
    tagVariant: row.tag_variant as TagVariant,
    tagLabel: row.tag_label,
    fitFor: row.fit_for,
    title: row.title,
    tone: row.tone,
    description: row.description,
    items: JSON.parse(row.items_json) as CapsuleItem[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS capsule_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT NOT NULL,
      alt TEXT NOT NULL,
      tag_variant TEXT NOT NULL,
      tag_label TEXT NOT NULL,
      fit_for TEXT NOT NULL,
      title TEXT NOT NULL,
      tone TEXT NOT NULL,
      description TEXT NOT NULL,
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getCapsuleSets(db: Database.Database): CapsuleSet[] {
  const rows = db.prepare('SELECT * FROM capsule_sets ORDER BY id ASC').all() as CapsuleSetRow[]
  return rows.map(rowToCapsuleSet)
}

export function getCapsuleSetById(db: Database.Database, id: number): CapsuleSet | null {
  const row = db.prepare('SELECT * FROM capsule_sets WHERE id = ?').get(id) as CapsuleSetRow | undefined
  return row ? rowToCapsuleSet(row) : null
}

export function createCapsuleSet(db: Database.Database, input: CapsuleSetInput): CapsuleSet {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO capsule_sets
        (image, alt, tag_variant, tag_label, fit_for, title, tone, description, items_json, created_at, updated_at)
       VALUES (@image, @alt, @tagVariant, @tagLabel, @fitFor, @title, @tone, @description, @itemsJson, @createdAt, @updatedAt)`
    )
    .run({
      image: input.image,
      alt: input.alt,
      tagVariant: input.tagVariant,
      tagLabel: input.tagLabel,
      fitFor: input.fitFor,
      title: input.title,
      tone: input.tone,
      description: input.description,
      itemsJson: JSON.stringify(input.items),
      createdAt: now,
      updatedAt: now,
    })
  const created = getCapsuleSetById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created capsule set')
  }
  return created
}

export function updateCapsuleSet(
  db: Database.Database,
  id: number,
  input: CapsuleSetInput
): CapsuleSet | null {
  const existing = getCapsuleSetById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE capsule_sets SET
      image = @image, alt = @alt, tag_variant = @tagVariant, tag_label = @tagLabel,
      fit_for = @fitFor, title = @title, tone = @tone, description = @description,
      items_json = @itemsJson, updated_at = @updatedAt
     WHERE id = @id`
  ).run({
    id,
    image: input.image,
    alt: input.alt,
    tagVariant: input.tagVariant,
    tagLabel: input.tagLabel,
    fitFor: input.fitFor,
    title: input.title,
    tone: input.tone,
    description: input.description,
    itemsJson: JSON.stringify(input.items),
    updatedAt: now,
  })
  return getCapsuleSetById(db, id)
}

export function deleteCapsuleSet(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM capsule_sets WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_CAPSULE_SETS: CapsuleSetInput[] = [
  {
    image: '/outfit/capsule-set-office.jpg',
    alt: 'Set đồ công sở thanh lịch với áo peplum hồng, quần ống suông trắng ngà và túi xách minimalist',
    tagVariant: 'primary',
    tagLabel: 'Set 1 • Thanh Lịch',
    fitFor: 'Phù hợp: Office & Meeting',
    title: 'Thanh Lịch Công Sở',
    tone: 'Warm Cream',
    description:
      'Áo Peplum Voan Hồng + Quần Ống Suông Trắng Ngà + Túi xách Minimalist. Tối ưu chiều dài chân và tạo nét chuyên nghiệp, nhã nhặn.',
    items: [
      { label: 'Quần ống suông ngà:', price: '490.000 ₫' },
      { label: 'Túi xách Minimalist:', price: '720.000 ₫' },
    ],
  },
  {
    image: '/outfit/capsule-set-date.jpg',
    alt: 'Set đồ dạo phố với áo peplum hồng, chân váy midi xám bạc và giày slingback',
    tagVariant: 'secondary',
    tagLabel: 'Set 2 • Dạo Phố',
    fitFor: 'Phù hợp: Dating & Weekend',
    title: 'Hẹn Hò & Dạo Phố',
    tone: 'Soft Silver',
    description:
      'Áo Peplum + Chân Váy Xòe Midi Xám Bạc tôn vẻ nữ tính dịu dàng. Màu xám bạc lạnh làm nổi bật sắc hồng thanh khiết của áo.',
    items: [
      { label: 'Chân váy midi xám bạc:', price: '530.000 ₫' },
      { label: 'Giày Slingback Satin:', price: '650.000 ₫' },
    ],
  },
  {
    image: '/outfit/capsule-set-accessories.jpg',
    alt: 'Phụ kiện khuyên tai bạc và túi pastel lilac bổ trợ cho set đồ',
    tagVariant: 'tertiary',
    tagLabel: 'Set 3 • Điểm Nhấn',
    fitFor: 'Phù hợp: Điểm Nhấn Cao Cấp',
    title: 'Phụ Kiện Tối Ưu',
    tone: 'Pastel Lilac',
    description:
      'Khuyên Tai Bạc Silver + Túi Pastel Lilac ánh tím. Bổ trợ hoàn hảo cho nhóm màu Summer Soft mà không làm lu mờ sắc áo chính.',
    items: [
      { label: 'Khuyên tai bạc Ý 925:', price: '320.000 ₫' },
      { label: 'Túi Pastel Lilac:', price: '580.000 ₫' },
    ],
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM capsule_sets').get() as { count: number }
  if (count > 0) return
  SEED_CAPSULE_SETS.forEach((set) => createCapsuleSet(db, set))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/capsuleWardrobe.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/capsuleWardrobe.ts lib/capsuleWardrobe.test.ts
git commit -m "feat: add capsule wardrobe data layer with CRUD and seed"
```

---

## Task 2: Wire Capsule Wardrobe schema into the shared `getDb()` singleton

**Files:**
- Modify: `frontend/lib/getDb.ts`

- [ ] **Step 1: Modify `lib/getDb.ts`**

Add the import:
```ts
import { initSchema as initCapsuleSchema, seedIfEmpty as seedCapsuleIfEmpty } from './capsuleWardrobe'
```
Inside `getDb()`, after the Model Catalog init/seed calls, add:
```ts
  initCapsuleSchema(db)
  seedCapsuleIfEmpty(db)
```

- [ ] **Step 2: Verify the whole project still compiles and tests still pass**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every existing test still passes.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/getDb.ts
git commit -m "feat: initialize and seed the capsule wardrobe table when opening the database"
```

---

## Task 3: Capsule Wardrobe API — validation + collection route

**Files:**
- Create: `frontend/app/api/capsule-wardrobe/validate.ts`
- Create: `frontend/app/api/capsule-wardrobe/validate.test.ts`
- Create: `frontend/app/api/capsule-wardrobe/route.ts`
- Create: `frontend/app/api/capsule-wardrobe/route.test.ts`

**Interfaces:**
- Consumes: `TAG_VARIANTS`, `TagVariant`, `CapsuleSetInput`, `getCapsuleSets`,
  `createCapsuleSet` from `lib/capsuleWardrobe.ts`; `getDb`; `getAdminSessionFromCookieHeader`.
- Produces: `validateCapsuleSetBody(body: unknown): { errors: Record<string, string> } |
  { data: CapsuleSetInput }`; `GET`/`POST` handlers.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/capsule-wardrobe/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateCapsuleSetBody } from './validate'

const validBody = {
  image: '/outfit/capsule-set-test.jpg',
  alt: 'Ảnh test',
  tagVariant: 'primary',
  tagLabel: 'Set Test',
  fitFor: 'Phù hợp: Test',
  title: 'Tiêu đề test',
  tone: 'Test Tone',
  description: 'Mô tả test',
  items: [
    { label: 'Món đồ A:', price: '100.000 ₫' },
    { label: 'Món đồ B:', price: '200.000 ₫' },
  ],
}

describe('validateCapsuleSetBody', () => {
  it('accepts a valid body', () => {
    const result = validateCapsuleSetBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = validateCapsuleSetBody({ ...validBody, title: '' })
    expect('errors' in result && result.errors.title).toBeDefined()
  })

  it('rejects an invalid tag variant', () => {
    const result = validateCapsuleSetBody({ ...validBody, tagVariant: 'not-a-variant' })
    expect('errors' in result && result.errors.tagVariant).toBeDefined()
  })

  it('rejects zero items', () => {
    const result = validateCapsuleSetBody({ ...validBody, items: [] })
    expect('errors' in result && result.errors.items).toBeDefined()
  })

  it('rejects an item with an empty label', () => {
    const result = validateCapsuleSetBody({
      ...validBody,
      items: [{ label: '', price: '100.000 ₫' }],
    })
    expect('errors' in result && result.errors['items.0.label']).toBeDefined()
  })

  it('rejects an item with an empty price', () => {
    const result = validateCapsuleSetBody({
      ...validBody,
      items: [{ label: 'Món đồ:', price: '' }],
    })
    expect('errors' in result && result.errors['items.0.price']).toBeDefined()
  })
})
```

Create `frontend/app/api/capsule-wardrobe/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/capsuleWardrobe')>('@/lib/capsuleWardrobe')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  return { getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody = {
  image: '/outfit/capsule-set-test.jpg',
  alt: 'Ảnh test',
  tagVariant: 'primary',
  tagLabel: 'Set Test',
  fitFor: 'Phù hợp: Test',
  title: 'Tiêu đề test',
  tone: 'Test Tone',
  description: 'Mô tả test',
  items: [{ label: 'Món đồ A:', price: '100.000 ₫' }],
}

beforeEach(() => {
  getDb().exec('DELETE FROM capsule_sets')
})

describe('GET /api/capsule-wardrobe', () => {
  it('returns an empty list when there are no sets', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/capsule-wardrobe', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/capsule-wardrobe', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a set and returns 201', async () => {
    const request = new Request('http://localhost/api/capsule-wardrobe', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect((await response.json()).title).toBe('Tiêu đề test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/capsule-wardrobe', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, title: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.title).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/api/capsule-wardrobe/validate.test.ts app/api/capsule-wardrobe/route.test.ts`
Expected: FAIL — neither `validate.ts` nor `route.ts` exist yet.

- [ ] **Step 3: Implement `validate.ts`**

Create `frontend/app/api/capsule-wardrobe/validate.ts`:
```ts
import { TAG_VARIANTS, type CapsuleItem, type CapsuleSetInput, type TagVariant } from '@/lib/capsuleWardrobe'

type RawItem = { label?: unknown; price?: unknown }
type RawCapsuleBody = {
  image?: unknown
  alt?: unknown
  tagVariant?: unknown
  tagLabel?: unknown
  fitFor?: unknown
  title?: unknown
  tone?: unknown
  description?: unknown
  items?: unknown
}

function requiredString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateCapsuleSetBody(
  body: unknown
): { errors: Record<string, string> } | { data: CapsuleSetInput } {
  const raw = (body ?? {}) as RawCapsuleBody
  const errors: Record<string, string> = {}

  const image = requiredString(raw.image)
  if (!image) errors.image = 'Ảnh không được để trống'

  const alt = requiredString(raw.alt)
  if (!alt) errors.alt = 'Mô tả ảnh (alt) không được để trống'

  const tagVariant = raw.tagVariant as TagVariant
  if (!TAG_VARIANTS.includes(tagVariant)) errors.tagVariant = 'Màu nhãn không hợp lệ'

  const tagLabel = requiredString(raw.tagLabel)
  if (!tagLabel) errors.tagLabel = 'Nhãn không được để trống'

  const fitFor = requiredString(raw.fitFor)
  if (!fitFor) errors.fitFor = 'Phù hợp với không được để trống'

  const title = requiredString(raw.title)
  if (!title) errors.title = 'Tiêu đề không được để trống'

  const tone = requiredString(raw.tone)
  if (!tone) errors.tone = 'Tông màu không được để trống'

  const description = requiredString(raw.description)
  if (!description) errors.description = 'Mô tả không được để trống'

  const rawItems = Array.isArray(raw.items) ? (raw.items as RawItem[]) : []
  if (rawItems.length === 0) {
    errors.items = 'Cần ít nhất 1 món đồ'
  }

  const items: CapsuleItem[] = rawItems.map((item, index) => {
    const label = requiredString(item.label)
    const price = requiredString(item.price)
    if (!label) errors[`items.${index}.label`] = 'Tên món đồ không được để trống'
    if (!price) errors[`items.${index}.price`] = 'Giá không được để trống'
    return { label, price }
  })

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { image, alt, tagVariant, tagLabel, fitFor, title, tone, description, items } }
}
```

- [ ] **Step 4: Implement `route.ts`**

Create `frontend/app/api/capsule-wardrobe/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getCapsuleSets, createCapsuleSet } from '@/lib/capsuleWardrobe'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateCapsuleSetBody } from './validate'

export async function GET() {
  const db = getDb()
  return NextResponse.json(getCapsuleSets(db))
}

export async function POST(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateCapsuleSetBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createCapsuleSet(db, result.data)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/capsule-wardrobe/validate.test.ts app/api/capsule-wardrobe/route.test.ts`
Expected: PASS (6 + 3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add app/api/capsule-wardrobe/validate.ts app/api/capsule-wardrobe/validate.test.ts app/api/capsule-wardrobe/route.ts app/api/capsule-wardrobe/route.test.ts
git commit -m "feat: add capsule wardrobe collection API route with validation"
```

---

## Task 4: Capsule Wardrobe API — single-set route

**Files:**
- Create: `frontend/app/api/capsule-wardrobe/[id]/route.ts`
- Create: `frontend/app/api/capsule-wardrobe/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getCapsuleSetById`, `updateCapsuleSet`, `deleteCapsuleSet` from
  `lib/capsuleWardrobe.ts`; `getDb`; `validateCapsuleSetBody` from Task 3;
  `getAdminSessionFromCookieHeader`.
- Produces: `GET`/`PUT`/`DELETE` handlers, consumed by Task 10 (edit page) and Task 8
  (`CapsuleForm`'s PUT call).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/capsule-wardrobe/[id]/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { createCapsuleSet } from '@/lib/capsuleWardrobe'
import { GET, PUT, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/capsuleWardrobe')>('@/lib/capsuleWardrobe')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  return { getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody = {
  image: '/outfit/capsule-set-test.jpg',
  alt: 'Ảnh test',
  tagVariant: 'primary',
  tagLabel: 'Set Test',
  fitFor: 'Phù hợp: Test',
  title: 'Tiêu đề test',
  tone: 'Test Tone',
  description: 'Mô tả test',
  items: [{ label: 'Món đồ A:', price: '100.000 ₫' }],
}

beforeEach(() => {
  getDb().exec('DELETE FROM capsule_sets')
})

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/capsule-wardrobe/[id]', () => {
  it('returns the set when it exists', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).title).toBe('Tiêu đề test')
  })

  it('returns 404 when the set does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/capsule-wardrobe/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the set', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, title: 'Tiêu đề đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).title).toBe('Tiêu đề đã sửa')
  })

  it('returns 404 when updating a set that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/capsule-wardrobe/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the set', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM capsule_sets WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/capsule-wardrobe/\[id\]/route.test.ts"`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `frontend/app/api/capsule-wardrobe/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getCapsuleSetById, updateCapsuleSet, deleteCapsuleSet } from '@/lib/capsuleWardrobe'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateCapsuleSetBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const set = getCapsuleSetById(getDb(), Number(id))
  if (!set) {
    return NextResponse.json({ error: 'Không tìm thấy set đồ' }, { status: 404 })
  }
  return NextResponse.json(set)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = validateCapsuleSetBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateCapsuleSet(getDb(), Number(id), result.data)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy set đồ' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteCapsuleSet(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy set đồ' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/capsule-wardrobe/\[id\]/route.test.ts"`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/capsule-wardrobe/[id]/route.ts" "app/api/capsule-wardrobe/[id]/route.test.ts"
git commit -m "feat: add single capsule wardrobe set API route"
```

---

## Task 5: Tag variant → Tailwind class presentation lookup

**Files:**
- Create: `frontend/components/outfit/step4/tagPresentation.ts`
- Test: `frontend/components/outfit/step4/tagPresentation.test.ts`

**Interfaces:**
- Consumes: `TagVariant`, `TAG_VARIANTS` from `lib/capsuleWardrobe.ts`.
- Produces: `TAG_VARIANT_CLASSES: Record<TagVariant, string>`. Consumed by Task 6
  (`CapsuleWardrobe`).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/outfit/step4/tagPresentation.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { TAG_VARIANTS } from '@/lib/capsuleWardrobe'
import { TAG_VARIANT_CLASSES } from './tagPresentation'

describe('TAG_VARIANT_CLASSES', () => {
  it('has a class string for every tag variant', () => {
    for (const variant of TAG_VARIANTS) {
      expect(TAG_VARIANT_CLASSES[variant]).toBeTruthy()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/outfit/step4/tagPresentation.test.ts`
Expected: FAIL — module does not exist yet.

- [ ] **Step 3: Implement `tagPresentation.ts`**

```ts
import type { TagVariant } from '@/lib/capsuleWardrobe'

export const TAG_VARIANT_CLASSES: Record<TagVariant, string> = {
  primary: 'bg-surface-container-lowest/90 text-primary',
  secondary: 'bg-secondary-fixed text-on-secondary-fixed',
  tertiary: 'bg-surface-container-highest text-on-surface',
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/outfit/step4/tagPresentation.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/outfit/step4/tagPresentation.ts components/outfit/step4/tagPresentation.test.ts
git commit -m "feat: add capsule wardrobe tag variant color presentation lookup"
```

---

## Task 6: `CapsuleWardrobe` reads sets from a prop instead of the hardcoded file

**Files:**
- Modify: `frontend/components/outfit/step4/CapsuleWardrobe.tsx`
- Modify: `frontend/components/outfit/step4/CapsuleWardrobe.test.tsx`

**Interfaces:**
- Consumes: `CapsuleSet` from `lib/capsuleWardrobe.ts`; `TAG_VARIANT_CLASSES` from Task 5.
- Produces: `CapsuleWardrobe({ sets: CapsuleSet[] })` — consumed by Task 7
  (`Step4PageContent`).

- [ ] **Step 1: Write the failing test**

Replace `frontend/components/outfit/step4/CapsuleWardrobe.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import CapsuleWardrobe from './CapsuleWardrobe'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

const SETS: CapsuleSet[] = [
  {
    id: 1,
    image: '/outfit/capsule-set-office.jpg',
    alt: 'Ảnh set 1',
    tagVariant: 'primary',
    tagLabel: 'Set 1 • Thanh Lịch',
    fitFor: 'Phù hợp: Office & Meeting',
    title: 'Thanh Lịch Công Sở',
    tone: 'Warm Cream',
    description: 'Mô tả set 1',
    items: [{ label: 'Quần ống suông ngà:', price: '490.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 2,
    image: '/outfit/capsule-set-date.jpg',
    alt: 'Ảnh set 2',
    tagVariant: 'secondary',
    tagLabel: 'Set 2 • Dạo Phố',
    fitFor: 'Phù hợp: Dating & Weekend',
    title: 'Hẹn Hò & Dạo Phố',
    tone: 'Soft Silver',
    description: 'Mô tả set 2',
    items: [{ label: 'Chân váy midi xám bạc:', price: '530.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 3,
    image: '/outfit/capsule-set-accessories.jpg',
    alt: 'Ảnh set 3',
    tagVariant: 'tertiary',
    tagLabel: 'Set 3 • Điểm Nhấn',
    fitFor: 'Phù hợp: Điểm Nhấn Cao Cấp',
    title: 'Phụ Kiện Tối Ưu',
    tone: 'Pastel Lilac',
    description: 'Mô tả set 3',
    items: [{ label: 'Khuyên tai bạc Ý 925:', price: '320.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('CapsuleWardrobe', () => {
  it('renders every set passed in', () => {
    renderWithIntl(<CapsuleWardrobe sets={SETS} />)
    expect(screen.getByText('Thanh Lịch Công Sở')).toBeInTheDocument()
    expect(screen.getByText('Hẹn Hò & Dạo Phố')).toBeInTheDocument()
    expect(screen.getByText('Phụ Kiện Tối Ưu')).toBeInTheDocument()
  })

  it('renders each set’s line items with price', () => {
    renderWithIntl(<CapsuleWardrobe sets={SETS} />)
    expect(screen.getByText('Quần ống suông ngà:')).toBeInTheDocument()
    expect(screen.getByText('490.000 ₫')).toBeInTheDocument()
  })

  it('links to the personal color quiz', () => {
    renderWithIntl(<CapsuleWardrobe sets={SETS} />)
    expect(screen.getByRole('link', { name: 'Làm Bài Test Personal Color' })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/outfit/step4/CapsuleWardrobe.test.tsx`
Expected: FAIL — component still reads the hardcoded `CAPSULE_SETS`, no `sets` prop.

- [ ] **Step 3: Rewrite `CapsuleWardrobe.tsx`**

Replace `frontend/components/outfit/step4/CapsuleWardrobe.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'
import { TAG_VARIANT_CLASSES } from './tagPresentation'

export default function CapsuleWardrobe({ sets }: { sets: CapsuleSet[] }) {
  const t = useTranslations('Outfit.Step4.CapsuleWardrobe')

  return (
    <section id="capsule-wardrobe" className="w-full bg-surface py-space-xl">
      <div className="mx-auto max-w-7xl px-margin md:px-margin-desktop">
        <div className="mb-space-xl flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
          <div>
            <div className="mb-space-xs inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-semibold text-on-primary-fixed">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              {t('badgePill')}
            </div>
            <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">{t('subheading')}</p>
          </div>
          <div className="flex items-center gap-space-xs text-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-secondary">tips_and_updates</span>
            {t('timeSavedNote')}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-gutter-desktop md:grid-cols-3">
          {sets.map((set) => (
            <div
              key={set.id}
              className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-md shadow-md transition-all duration-300 hover:shadow-xl"
            >
              <div>
                <div className="relative mb-space-md aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={set.image} alt={set.alt} className="h-full w-full object-cover" />
                  <div
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-label-sm font-bold backdrop-blur-md ${TAG_VARIANT_CLASSES[set.tagVariant]}`}
                  >
                    {set.tagLabel}
                  </div>
                  <div className="absolute bottom-3 right-3 rounded bg-inverse-surface/85 px-2 py-0.5 text-label-sm text-inverse-on-surface backdrop-blur-md">
                    {set.fitFor}
                  </div>
                </div>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-title-md font-bold text-on-surface">{set.title}</h3>
                  <span className="text-label-sm font-bold text-secondary">{t('toneLabel', { tone: set.tone })}</span>
                </div>
                <p className="mb-space-sm text-body-sm leading-relaxed text-on-surface-variant">
                  {set.description}
                </p>
                <div className="mb-space-md rounded-xl bg-surface-container-low p-space-sm">
                  {set.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-label-sm text-on-surface-variant last:mb-0"
                    >
                      <span>{item.label}</span>
                      <span className="font-semibold text-on-surface">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-space-sm py-2.5 text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container"
                >
                  <span className="material-symbols-outlined text-[17px]">magic_button</span>
                  {t('tryOutfitButton')}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-container-high px-space-sm py-2 text-label-md text-on-surface transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                  {t('viewProductButton')}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-space-xl flex flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container-low p-space-lg md:flex-row">
          <div className="flex items-center gap-space-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[24px]">palette</span>
            </div>
            <div>
              <h4 className="text-headline-sm text-on-surface">{t('moreQuizTitle')}</h4>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">{t('moreQuizBody')}</p>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-space-sm md:w-auto">
            <Link
              href="/personal-color/quiz"
              className="rounded-full bg-primary px-space-lg py-space-sm text-label-md text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('quizButton')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/outfit/step4/CapsuleWardrobe.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/outfit/step4/CapsuleWardrobe.tsx components/outfit/step4/CapsuleWardrobe.test.tsx
git commit -m "feat: make CapsuleWardrobe render sets passed in as a prop"
```

---

## Task 7: Split Step 4 page into a Server Component fetch + `Step4PageContent`

**Files:**
- Create: `frontend/components/outfit/step4/Step4PageContent.tsx`
- Create: `frontend/components/outfit/step4/Step4PageContent.test.tsx`
- Modify: `frontend/app/outfit/step-4/page.tsx`
- Modify: `frontend/app/outfit/step-4/page.test.tsx`

**Interfaces:**
- Consumes: `getCapsuleSets` from `lib/capsuleWardrobe.ts`; `getDb`; `CapsuleWardrobe` (Task 6).
- Produces: `Step4PageContent({ capsuleSets: CapsuleSet[] })`; `Step4Page` (default export of
  `app/outfit/step-4/page.tsx`) becomes a synchronous Server Component with no props.

- [ ] **Step 1: Write the failing tests**

Create `frontend/components/outfit/step4/Step4PageContent.test.tsx` — the current
`app/outfit/step-4/page.test.tsx` content, moved here and given a `capsuleSets` prop:
```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step4PageContent from './Step4PageContent'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const SETS: CapsuleSet[] = [
  {
    id: 1,
    image: '/outfit/capsule-set-office.jpg',
    alt: 'Ảnh set 1',
    tagVariant: 'primary',
    tagLabel: 'Set 1 • Thanh Lịch',
    fitFor: 'Phù hợp: Office & Meeting',
    title: 'Thanh Lịch Công Sở',
    tone: 'Warm Cream',
    description: 'Mô tả set 1',
    items: [{ label: 'Quần ống suông ngà:', price: '490.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('Step4PageContent', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the result heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent capsuleSets={SETS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ Ảo AI FitRoom HD' })).toBeInTheDocument()
  })

  it('restarts the flow at step 1 when clicking Làm Mới', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent capsuleSets={SETS} />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Làm Mới/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-1')
  })

  it('links to the capsule wardrobe section', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent capsuleSets={SETS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Gợi ý Capsule Phối Đồ/ })).toHaveAttribute(
      'href',
      '#capsule-wardrobe'
    )
  })
})
```

Replace `frontend/app/outfit/step-4/page.test.tsx` with a thin smoke test:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const SETS: CapsuleSet[] = [
  {
    id: 1,
    image: '/outfit/capsule-set-office.jpg',
    alt: 'Ảnh set 1',
    tagVariant: 'primary',
    tagLabel: 'Set 1 • Thanh Lịch',
    fitFor: 'Phù hợp: Office & Meeting',
    title: 'Thanh Lịch Công Sở',
    tone: 'Warm Cream',
    description: 'Mô tả set 1',
    items: [{ label: 'Quần ống suông ngà:', price: '490.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

vi.mock('@/lib/getDb', () => ({ getDb: () => ({}) }))
vi.mock('@/lib/capsuleWardrobe', async () => {
  const actual = await vi.importActual<typeof import('@/lib/capsuleWardrobe')>('@/lib/capsuleWardrobe')
  return { ...actual, getCapsuleSets: () => SETS }
})

describe('Step4Page', async () => {
  const { default: Step4Page } = await import('./page')

  it('renders the result heading with capsule sets loaded from the database', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ Ảo AI FitRoom HD' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/outfit/step4/Step4PageContent.test.tsx app/outfit/step-4/page.test.tsx`
Expected: FAIL — `Step4PageContent` doesn't exist; `page.tsx` still renders
`<CapsuleWardrobe />` with no `sets` prop.

- [ ] **Step 3: Create `Step4PageContent.tsx`**

Create `frontend/components/outfit/step4/Step4PageContent.tsx` with the entire body of the
current `app/outfit/step-4/page.tsx`, renamed and taking a `capsuleSets` prop it forwards to
`CapsuleWardrobe`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useOutfitFlow } from '@/components/outfit/OutfitFlowProvider'
import ResultPreview from './ResultPreview'
import ResultActionsPanel from './ResultActionsPanel'
import GarmentSummaryPanel from './GarmentSummaryPanel'
import CapsuleWardrobe from './CapsuleWardrobe'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

export default function Step4PageContent({ capsuleSets }: { capsuleSets: CapsuleSet[] }) {
  const t = useTranslations('Outfit.Step4.Page')
  const router = useRouter()
  const { selectedModel } = useOutfitFlow()

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-gradient-to-b from-surface-container-high/40 via-background to-surface-container-low/60 pb-space-xl">
        <div className="mx-auto max-w-7xl px-margin pt-space-lg md:px-margin-desktop">
          <div className="mb-space-lg flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
            <div>
              <div className="mb-space-xs inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed px-space-sm py-1 text-label-sm text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                {t('readyBadge')}
              </div>
              <h1 className="text-headline-lg tracking-tight text-on-surface">{t('heading')}</h1>
              <p className="mt-1 text-body-md text-on-surface-variant">
                {t.rich('subheading', { name: selectedModel.name, strong: (chunks) => <strong>{chunks}</strong> })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-space-sm">
              <a
                href="#capsule-wardrobe"
                className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-md py-space-sm text-label-md text-on-surface shadow-sm transition-all hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">style</span>
                {t('capsuleLinkText')}
              </a>
              <button
                type="button"
                onClick={() => router.push('/outfit/step-1')}
                className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-high px-space-md py-space-sm text-label-md text-on-surface-variant transition-all hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                {t('refreshButton')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ResultPreview />
            </div>
            <div className="flex flex-col gap-space-md lg:col-span-5">
              <ResultActionsPanel />
              <GarmentSummaryPanel />
            </div>
          </div>
        </div>
      </section>
      <CapsuleWardrobe sets={capsuleSets} />
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `app/outfit/step-4/page.tsx`**

```tsx
import Step4PageContent from '@/components/outfit/step4/Step4PageContent'
import { getCapsuleSets } from '@/lib/capsuleWardrobe'
import { getDb } from '@/lib/getDb'

export default function Step4Page() {
  const capsuleSets = getCapsuleSets(getDb())
  return <Step4PageContent capsuleSets={capsuleSets} />
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/outfit/step4/Step4PageContent.test.tsx app/outfit/step-4/page.test.tsx`
Expected: PASS (3 + 1 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/outfit/step4/Step4PageContent.tsx components/outfit/step4/Step4PageContent.test.tsx app/outfit/step-4/page.tsx app/outfit/step-4/page.test.tsx
git commit -m "feat: read capsule wardrobe sets from the database on the outfit step 4 page"
```

---

## Task 8: `CapsuleForm` — shared create/edit admin form

**Files:**
- Create: `frontend/components/admin/CapsuleForm.tsx`
- Create: `frontend/components/admin/CapsuleForm.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.CapsuleForm` namespace)

**Interfaces:**
- Consumes: `TAG_VARIANTS`, `TagVariant`, `CapsuleSet` from `lib/capsuleWardrobe.ts`;
  `/api/capsule-wardrobe`, `/api/capsule-wardrobe/[id]` from Tasks 3-4.
- Produces: `CapsuleForm({ initialSet?: CapsuleSet })` — consumed by Task 10.

The line-item list (add/remove label+price rows) follows the exact same pattern as
`QuizQuestionForm.tsx`'s option list.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "CapsuleForm": {
      "fields": {
        "image": "Ảnh (URL)",
        "alt": "Mô tả ảnh (alt text)",
        "tagVariant": "Màu nhãn",
        "tagLabel": "Nhãn (vd: Set 1 • Thanh Lịch)",
        "fitFor": "Phù hợp với",
        "title": "Tiêu đề",
        "tone": "Tông màu",
        "description": "Mô tả"
      },
      "tagVariants": {
        "primary": "Primary",
        "secondary": "Secondary",
        "tertiary": "Tertiary"
      },
      "itemLabel": "Món đồ",
      "itemPrice": "Giá",
      "addItem": "Thêm món đồ",
      "removeItem": "Xóa món đồ",
      "submitCreate": "Tạo set đồ",
      "submitEdit": "Lưu thay đổi",
      "unauthorizedError": "Bạn cần đăng nhập với quyền quản trị.",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại."
    }
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/admin/CapsuleForm.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import CapsuleForm from './CapsuleForm'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_SET: CapsuleSet = {
  id: 9,
  image: '/outfit/capsule-set-existing.jpg',
  alt: 'Ảnh hiện có',
  tagVariant: 'secondary',
  tagLabel: 'Set hiện có',
  fitFor: 'Phù hợp: Test',
  title: 'Set hiện có',
  tone: 'Test Tone',
  description: 'Mô tả hiện có',
  items: [
    { label: 'Món đồ 1:', price: '100.000 ₫' },
    { label: 'Món đồ 2:', price: '200.000 ₫' },
  ],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('CapsuleForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('starts with 2 empty items when creating', () => {
    renderWithIntl(<CapsuleForm />)
    expect(screen.getAllByLabelText(/Món đồ \d/)).toHaveLength(2)
  })

  it('can add and remove items', () => {
    renderWithIntl(<CapsuleForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm món đồ' }))
    expect(screen.getAllByLabelText(/Món đồ \d/)).toHaveLength(3)

    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa món đồ' })[0])
    expect(screen.getAllByLabelText(/Món đồ \d/)).toHaveLength(2)
  })

  it('POSTs to /api/capsule-wardrobe when creating and redirects on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<CapsuleForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Set Mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo set đồ' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/capsule-wardrobe'))
    expect(fetch).toHaveBeenCalledWith('/api/capsule-wardrobe', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/capsule-wardrobe/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_SET }))
    renderWithIntl(<CapsuleForm initialSet={EXISTING_SET} />)
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Set hiện có')
    expect(screen.getAllByLabelText(/Món đồ \d/)).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/capsule-wardrobe'))
    expect(fetch).toHaveBeenCalledWith('/api/capsule-wardrobe/9', expect.objectContaining({ method: 'PUT' }))
  })

  it('shows field errors returned by the API instead of redirecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: { title: 'Tiêu đề không được để trống' } }),
      })
    )
    renderWithIntl(<CapsuleForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo set đồ' }))

    await waitFor(() => expect(screen.getByText('Tiêu đề không được để trống')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/CapsuleForm.test.tsx`
Expected: FAIL — `./CapsuleForm` module does not exist yet.

- [ ] **Step 4: Implement `CapsuleForm.tsx`**

Create `frontend/components/admin/CapsuleForm.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { TAG_VARIANTS, type CapsuleItem, type CapsuleSet, type TagVariant } from '@/lib/capsuleWardrobe'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

function initialItems(initialSet?: CapsuleSet): CapsuleItem[] {
  if (initialSet) return initialSet.items.map((item) => ({ ...item }))
  return [
    { label: '', price: '' },
    { label: '', price: '' },
  ]
}

export default function CapsuleForm({ initialSet }: { initialSet?: CapsuleSet }) {
  const t = useTranslations('Admin.CapsuleForm')
  const router = useRouter()
  const isEditing = Boolean(initialSet)

  const [image, setImage] = useState(initialSet?.image ?? '')
  const [alt, setAlt] = useState(initialSet?.alt ?? '')
  const [tagVariant, setTagVariant] = useState<TagVariant>(initialSet?.tagVariant ?? TAG_VARIANTS[0])
  const [tagLabel, setTagLabel] = useState(initialSet?.tagLabel ?? '')
  const [fitFor, setFitFor] = useState(initialSet?.fitFor ?? '')
  const [title, setTitle] = useState(initialSet?.title ?? '')
  const [tone, setTone] = useState(initialSet?.tone ?? '')
  const [description, setDescription] = useState(initialSet?.description ?? '')
  const [items, setItems] = useState<CapsuleItem[]>(() => initialItems(initialSet))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function updateItem(index: number, patch: Partial<CapsuleItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    setItems((current) => [...current, { label: '', price: '' }])
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = { image, alt, tagVariant, tagLabel, fitFor, title, tone, description, items }

    const response = await fetch(
      isEditing ? `/api/capsule-wardrobe/${initialSet!.id}` : '/api/capsule-wardrobe',
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    setSubmitting(false)

    if (response.status === 401) {
      setErrors({ form: t('unauthorizedError') })
      return
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setErrors(data.errors ?? { form: t('genericError') })
      return
    }

    router.push('/admin/capsule-wardrobe')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="capsule-title" className="text-label-md font-semibold text-on-surface">
          {t('fields.title')}
        </label>
        <input id="capsule-title" value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        {errors.title && <p className="text-label-sm text-error">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="capsule-image" className="text-label-md font-semibold text-on-surface">
            {t('fields.image')}
          </label>
          <input
            id="capsule-image"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            className={inputClass}
          />
          {errors.image && <p className="text-label-sm text-error">{errors.image}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="capsule-alt" className="text-label-md font-semibold text-on-surface">
            {t('fields.alt')}
          </label>
          <input id="capsule-alt" value={alt} onChange={(event) => setAlt(event.target.value)} className={inputClass} />
          {errors.alt && <p className="text-label-sm text-error">{errors.alt}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="capsule-tag-variant" className="text-label-md font-semibold text-on-surface">
            {t('fields.tagVariant')}
          </label>
          <select
            id="capsule-tag-variant"
            value={tagVariant}
            onChange={(event) => setTagVariant(event.target.value as TagVariant)}
            className={inputClass}
          >
            {TAG_VARIANTS.map((variant) => (
              <option key={variant} value={variant}>
                {t(`tagVariants.${variant}`)}
              </option>
            ))}
          </select>
          {errors.tagVariant && <p className="text-label-sm text-error">{errors.tagVariant}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="capsule-tag-label" className="text-label-md font-semibold text-on-surface">
            {t('fields.tagLabel')}
          </label>
          <input
            id="capsule-tag-label"
            value={tagLabel}
            onChange={(event) => setTagLabel(event.target.value)}
            className={inputClass}
          />
          {errors.tagLabel && <p className="text-label-sm text-error">{errors.tagLabel}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="capsule-fit-for" className="text-label-md font-semibold text-on-surface">
            {t('fields.fitFor')}
          </label>
          <input
            id="capsule-fit-for"
            value={fitFor}
            onChange={(event) => setFitFor(event.target.value)}
            className={inputClass}
          />
          {errors.fitFor && <p className="text-label-sm text-error">{errors.fitFor}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="capsule-tone" className="text-label-md font-semibold text-on-surface">
            {t('fields.tone')}
          </label>
          <input id="capsule-tone" value={tone} onChange={(event) => setTone(event.target.value)} className={inputClass} />
          {errors.tone && <p className="text-label-sm text-error">{errors.tone}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="capsule-description" className="text-label-md font-semibold text-on-surface">
          {t('fields.description')}
        </label>
        <textarea
          id="capsule-description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
        />
        {errors.description && <p className="text-label-sm text-error">{errors.description}</p>}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-1 space-y-1.5">
              <label htmlFor={`item-label-${index}`} className="text-label-md font-semibold text-on-surface">
                {t('itemLabel')} {index + 1}
              </label>
              <input
                id={`item-label-${index}`}
                value={item.label}
                onChange={(event) => updateItem(index, { label: event.target.value })}
                className={inputClass}
              />
              {errors[`items.${index}.label`] && (
                <p className="text-label-sm text-error">{errors[`items.${index}.label`]}</p>
              )}
            </div>
            <div className="w-40 space-y-1.5">
              <label htmlFor={`item-price-${index}`} className="text-label-md font-semibold text-on-surface">
                {t('itemPrice')}
              </label>
              <input
                id={`item-price-${index}`}
                value={item.price}
                onChange={(event) => updateItem(index, { price: event.target.value })}
                className={inputClass}
              />
              {errors[`items.${index}.price`] && (
                <p className="text-label-sm text-error">{errors[`items.${index}.price`]}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="mt-8 text-label-md font-semibold text-error hover:underline"
            >
              {t('removeItem')}
            </button>
          </div>
        ))}
        {errors.items && <p className="text-label-sm text-error">{errors.items}</p>}
        <button type="button" onClick={addItem} className="text-label-md font-semibold text-primary hover:underline">
          {t('addItem')}
        </button>
      </div>

      {errors.form && <p className="text-label-sm text-error">{errors.form}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
      >
        {isEditing ? t('submitEdit') : t('submitCreate')}
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/admin/CapsuleForm.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/admin/CapsuleForm.tsx components/admin/CapsuleForm.test.tsx messages/vi.json
git commit -m "feat: add shared capsule wardrobe create/edit admin form"
```

---

## Task 9: Capsule Wardrobe admin list — `CapsuleList` + `/admin/capsule-wardrobe` page

**Files:**
- Create: `frontend/components/admin/CapsuleList.tsx`
- Create: `frontend/components/admin/CapsuleList.test.tsx`
- Create: `frontend/app/admin/capsule-wardrobe/page.tsx`
- Create: `frontend/app/admin/capsule-wardrobe/page.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.CapsuleList` namespace)

**Interfaces:**
- Consumes: `CapsuleSet` from `lib/capsuleWardrobe.ts`; `GET`/`DELETE
  /api/capsule-wardrobe(/[id])` from Tasks 3-4; `AdminGate`; `CapsuleForm` link targets.
- Produces: `CapsuleList()`, default-exported `AdminCapsuleWardrobePage`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "CapsuleList": {
      "title": "Quản lý Capsule Wardrobe",
      "newButton": "Thêm set đồ",
      "columnTitle": "Tiêu đề",
      "editButton": "Sửa",
      "deleteButton": "Xóa",
      "deleteConfirm": "Xóa set đồ này?",
      "emptyState": "Chưa có set đồ nào.",
      "loading": "Đang tải..."
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/admin/CapsuleList.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import CapsuleList from './CapsuleList'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

const SETS: CapsuleSet[] = [
  {
    id: 1,
    image: '/outfit/capsule-set-a.jpg',
    alt: 'Ảnh A',
    tagVariant: 'primary',
    tagLabel: 'Set A',
    fitFor: 'Phù hợp: Test',
    title: 'Set A',
    tone: 'Test Tone',
    description: 'Mô tả',
    items: [{ label: 'Món đồ:', price: '100.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('CapsuleList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders sets with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => SETS }))
    renderWithIntl(<CapsuleList />)

    await waitFor(() => expect(screen.getByText('Set A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/capsule-wardrobe/1/edit')
  })

  it('deletes a set when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => SETS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<CapsuleList />)

    await waitFor(() => expect(screen.getByText('Set A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Set A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/capsule-wardrobe/1', { method: 'DELETE' })
  })

  it('shows an empty state when there are no sets', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<CapsuleList />)
    await waitFor(() => expect(screen.getByText('Chưa có set đồ nào.')).toBeInTheDocument())
  })
})
```

Create `frontend/app/admin/capsule-wardrobe/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminCapsuleWardrobePage from './page'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('AdminCapsuleWardrobePage', () => {
  beforeEach(() => {
    pushMock.mockClear()
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders the heading and a link to create a new set, for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminCapsuleWardrobePage />
      </AuthProvider>
    )
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Quản lý Capsule Wardrobe' })).toBeInTheDocument()
    )
    expect(screen.getByRole('link', { name: 'Thêm set đồ' })).toHaveAttribute(
      'href',
      '/admin/capsule-wardrobe/new'
    )
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/admin/CapsuleList.test.tsx app/admin/capsule-wardrobe/page.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `CapsuleList.tsx`**

Create `frontend/components/admin/CapsuleList.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

export default function CapsuleList() {
  const t = useTranslations('Admin.CapsuleList')
  const [sets, setSets] = useState<CapsuleSet[] | null>(null)

  useEffect(() => {
    fetch('/api/capsule-wardrobe')
      .then((response) => response.json())
      .then(setSets)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/capsule-wardrobe/${id}`, { method: 'DELETE' })
    setSets((current) => current?.filter((set) => set.id !== id) ?? null)
  }

  if (sets === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (sets.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnTitle')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {sets.map((set) => (
          <tr key={set.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{set.title}</td>
            <td className="py-3 text-right">
              <Link
                href={`/admin/capsule-wardrobe/${set.id}/edit`}
                className="mr-4 font-semibold text-primary hover:underline"
              >
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(set.id)}
                className="font-semibold text-error hover:underline"
              >
                {t('deleteButton')}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 5: Implement `app/admin/capsule-wardrobe/page.tsx`**

Create `frontend/app/admin/capsule-wardrobe/page.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AdminGate from '@/components/auth/AdminGate'
import CapsuleList from '@/components/admin/CapsuleList'

export default function AdminCapsuleWardrobePage() {
  const t = useTranslations('Admin.CapsuleList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <Link
              href="/admin/capsule-wardrobe/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('newButton')}
            </Link>
          </div>
          <CapsuleList />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/admin/CapsuleList.test.tsx app/admin/capsule-wardrobe/page.test.tsx`
Expected: PASS (3 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/admin/CapsuleList.tsx components/admin/CapsuleList.test.tsx app/admin/capsule-wardrobe/page.tsx app/admin/capsule-wardrobe/page.test.tsx messages/vi.json
git commit -m "feat: add capsule wardrobe admin list page"
```

---

## Task 10: `/admin/capsule-wardrobe/new` and `/admin/capsule-wardrobe/[id]/edit` pages

**Files:**
- Create: `frontend/app/admin/capsule-wardrobe/new/page.tsx`
- Create: `frontend/app/admin/capsule-wardrobe/new/page.test.tsx`
- Create: `frontend/app/admin/capsule-wardrobe/[id]/edit/page.tsx`
- Create: `frontend/app/admin/capsule-wardrobe/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `CapsuleForm` from Task 8; `AdminGate`; `GET /api/capsule-wardrobe/[id]` from
  Task 4.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/admin/capsule-wardrobe/new/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewCapsuleSetPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewCapsuleSetPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders the create form', () => {
    renderWithIntl(
      <AuthProvider>
        <NewCapsuleSetPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Tạo set đồ' })).toBeInTheDocument()
  })
})
```

Create `frontend/app/admin/capsule-wardrobe/[id]/edit/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditCapsuleSetPage from './page'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const SET: CapsuleSet = {
  id: 4,
  image: '/outfit/capsule-set-x.jpg',
  alt: 'Ảnh X',
  tagVariant: 'primary',
  tagLabel: 'Set X',
  fitFor: 'Phù hợp: Test',
  title: 'Set cần sửa',
  tone: 'Test Tone',
  description: 'Mô tả',
  items: [{ label: 'Món đồ:', price: '100.000 ₫' }],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditCapsuleSetPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => SET }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the set by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditCapsuleSetPage params={Promise.resolve({ id: '4' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Set cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/api/capsule-wardrobe/4')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/admin/capsule-wardrobe/new/page.test.tsx "app/admin/capsule-wardrobe/\[id\]/edit/page.test.tsx"`
Expected: FAIL — neither page exists yet.

- [ ] **Step 3: Implement `app/admin/capsule-wardrobe/new/page.tsx`**

```tsx
'use client'

import AdminGate from '@/components/auth/AdminGate'
import CapsuleForm from '@/components/admin/CapsuleForm'

export default function NewCapsuleSetPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <CapsuleForm />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 4: Implement `app/admin/capsule-wardrobe/[id]/edit/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import CapsuleForm from '@/components/admin/CapsuleForm'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

export default function EditCapsuleSetPage({ params }: { params: Promise<{ id: string }> }) {
  const [set, setSet] = useState<CapsuleSet | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/capsule-wardrobe/${id}`)
        .then((response) => response.json())
        .then(setSet)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {set && <CapsuleForm initialSet={set} />}
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/admin/capsule-wardrobe/new/page.test.tsx "app/admin/capsule-wardrobe/\[id\]/edit/page.test.tsx"`
Expected: PASS (1 + 1 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add "app/admin/capsule-wardrobe/new" "app/admin/capsule-wardrobe/[id]"
git commit -m "feat: add capsule wardrobe create/edit admin pages"
```

---

## Task 11: `AdminDashboard` links to Capsule Wardrobe management

**Files:**
- Modify: `frontend/components/auth/AdminDashboard.tsx`
- Modify: `frontend/components/auth/AdminDashboard.test.tsx`
- Modify: `frontend/messages/vi.json` (`Admin` namespace)

- [ ] **Step 1: Update messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "capsuleCardTitle": "Quản lý Capsule Wardrobe",
    "capsuleCardDescription": "Tạo, sửa và xóa set đồ gợi ý hiển thị ở kết quả thử đồ ảo."
```

- [ ] **Step 2: Write the failing test**

Extend the existing test in `frontend/components/auth/AdminDashboard.test.tsx`:
```tsx
    expect(screen.getByRole('link', { name: /Quản lý Capsule Wardrobe/ })).toHaveAttribute(
      'href',
      '/admin/capsule-wardrobe'
    )
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: FAIL — no Capsule Wardrobe link exists yet.

- [ ] **Step 4: Update `AdminDashboard.tsx`**

Add a fifth `<Link>` card after the Model Catalog card:
```tsx
          <Link
            href="/admin/capsule-wardrobe"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('capsuleCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('capsuleCardDescription')}</p>
          </Link>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/AdminDashboard.tsx components/auth/AdminDashboard.test.tsx messages/vi.json
git commit -m "feat: link the admin dashboard to capsule wardrobe management"
```

---

## Task 12: Full verification

- [ ] **Step 1: Run the full test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS — every test in the project.

- [ ] **Step 2: Lint**

Run: `cd frontend && npx eslint .`
Expected: no errors.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test in a real browser**

Start the dev server (`cd frontend && npm run dev`) and:

1. Complete the Outfit flow to `/outfit/step-4` — confirm all 3 capsule sets render at the
   bottom with correct tag colors and line-item prices.
2. Log in as `admin@twistfit.vn` / `admin1234`, go to `/admin` → `/admin/capsule-wardrobe`:
   create a set (with 2 line items), verify it appears on `/outfit/step-4`; edit it (add a
   3rd item); delete it.
3. Check the browser console for errors on both pages — in particular confirm there is
   **no** `Module not found: Can't resolve 'fs'` error.

- [ ] **Step 5: Commit** (only if Step 4 required fixes; otherwise skip)

```bash
cd frontend && git add -A
git commit -m "fix: address issues found in capsule wardrobe CMS manual verification"
```
