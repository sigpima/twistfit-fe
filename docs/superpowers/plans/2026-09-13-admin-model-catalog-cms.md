# Admin: Quản lý Model Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the "thử đồ ảo" model catalog (Bước 2 của luồng Outfit) from a hardcoded array
into the SQLite data layer, with admin CRUD under `/admin/model-catalog`, while every other
part of the Outfit flow (`ModelDossier`, `ResultPreview`, `BodyMeasurements`,
`QuickSelectionSummary`) keeps working unchanged because the `Model` shape itself doesn't
change.

**Architecture:** New module `frontend/lib/modelCatalog.ts` follows the exact
schema/CRUD/seed pattern of `lib/db.ts` and `lib/faq.ts`, wired into `lib/getDb.ts`. Because
`ModelCatalog.tsx` and `app/outfit/step-2/page.tsx` are both Client Components (interactive
tab state), the data flows in from two Server Components that already sit above them in the
tree: `app/outfit/layout.tsx` (wraps the whole `/outfit/*` flow) fetches the catalog and
passes the first model as the new `OutfitFlowProvider`'s `initialModel` prop (replacing the
`DEFAULT_MODEL` constant it used to import), and a new thin Server Component
`app/outfit/step-2/page.tsx` fetches the full catalog and passes it down to a renamed Client
Component (`Step2PageContent`) that contains everything the old `page.tsx` did.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, Vitest + Testing Library,
next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-admin-content-cms-expansion-design.md`

## Global Constraints

- All `lib/modelCatalog.ts` query functions take `db: Database.Database` as an explicit
  parameter (never a module-level singleton).
- `lib/modelCatalog.ts` imports `better-sqlite3` **only as a type**
  (`import type Database from 'better-sqlite3'`) — never as a value. Only `lib/getDb.ts` may
  `new Database(...)`.
- Route `params` are `Promise`s — `await params` in Route Handlers; resolve with
  `params.then(...)` inside `useEffect` in Client Component pages (never React's `use()`).
- No file upload: `image`/`dossierImage` are plain URL strings, same as every other CMS type
  so far.
- The write API routes (`POST`/`PUT`/`DELETE` under `/api/model-catalog`) must reject
  requests without a valid signed admin session cookie (401).
- Reuse existing input/label/button Tailwind classes from `BlogPostForm.tsx`.
- All new UI text goes through `next-intl`, namespace `Admin.ModelForm` / `Admin.ModelList`.
- Every new component/module gets a co-located `.test.ts`/`.test.tsx` file, written and run
  red before implementation (TDD).
- **Do not change the `Model` type** (`components/outfit/OutfitFlowProvider.tsx`) — its 10
  fields and their names/types are consumed by `ModelDossier.tsx`, `ResultPreview.tsx`,
  `BodyMeasurements.tsx`, and `QuickSelectionSummary.tsx` via the shared `selectedModel`
  context value, none of which this plan touches.
- `lib/getDb.ts` has no unit test (established precedent) — verify changes to it via
  `tsc --noEmit` and the full `vitest run` suite. `app/outfit/layout.tsx` likewise has no
  test file anywhere in this codebase's `layout.tsx` files — verify it the same way, plus the
  mandatory manual browser check in the final task.

---

## Task 1: Data layer — Model Catalog schema, CRUD, seed

**Files:**
- Create: `frontend/lib/modelCatalog.ts`
- Test: `frontend/lib/modelCatalog.test.ts`

**Interfaces:**
- Consumes: `Model`, `Undertone` types are **not** reused from `OutfitFlowProvider.tsx` —
  this module defines its own `CatalogModel`/`CatalogModelInput` types (identical field names
  and types to `Model`, but declared independently so `lib/modelCatalog.ts` has zero
  dependency on a Client Component file). Task 6 is responsible for confirming the two types
  are structurally identical when it wires them together.
- Produces: `Undertone` (`'warm' | 'cool' | 'neutral'`), `UNDERTONES: Undertone[]`,
  `CatalogModel`, `CatalogModelInput`, `initSchema(db)`, `getModels(db)`,
  `getModelById(db, id)`, `createModel(db, input)`, `updateModel(db, id, input)`,
  `deleteModel(db, id)`, `seedIfEmpty(db)`. Consumed by Task 2 (`getDb.ts` wiring) and all
  later tasks.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/modelCatalog.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createModel,
  getModels,
  getModelById,
  updateModel,
  deleteModel,
  seedIfEmpty,
  type CatalogModelInput,
} from './modelCatalog'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleModel: CatalogModelInput = {
  name: 'Test Model',
  image: '/outfit/models/test.jpg',
  dossierImage: '/outfit/models/test-dossier.jpg',
  poseCount: 15,
  tagline: 'Tagline test',
  undertone: 'warm',
  height: '1m70',
  bodyShape: 'Đồng hồ cát',
  waist: '66cm',
  personalColor: 'Warm Autumn',
}

describe('Model Catalog CRUD', () => {
  it('creates and reads back a model', () => {
    const created = createModel(db, sampleModel)
    expect(created.id).toBeGreaterThan(0)
    expect(created.name).toBe('Test Model')
    expect(created.poseCount).toBe(15)
    expect(created.undertone).toBe('warm')
  })

  it('lists models in creation order', () => {
    createModel(db, { ...sampleModel, name: 'Model 1' })
    createModel(db, { ...sampleModel, name: 'Model 2' })
    expect(getModels(db).map((m) => m.name)).toEqual(['Model 1', 'Model 2'])
  })

  it('updates a model', () => {
    const created = createModel(db, sampleModel)
    const updated = updateModel(db, created.id, { ...sampleModel, name: 'Tên đã sửa' })
    expect(updated?.name).toBe('Tên đã sửa')
    expect(updateModel(db, 999999, sampleModel)).toBeNull()
  })

  it('deletes a model', () => {
    const created = createModel(db, sampleModel)
    expect(deleteModel(db, created.id)).toBe(true)
    expect(getModelById(db, created.id)).toBeNull()
    expect(deleteModel(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 12 models into an empty database, with Carmen first', () => {
    seedIfEmpty(db)
    const models = getModels(db)
    expect(models).toHaveLength(12)
    expect(models[0].name).toBe('Carmen')
  })

  it('does nothing if catalog_models already has rows', () => {
    createModel(db, sampleModel)
    seedIfEmpty(db)
    expect(getModels(db)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/modelCatalog.test.ts`
Expected: FAIL — `./modelCatalog` module does not exist yet.

- [ ] **Step 3: Implement `lib/modelCatalog.ts`**

Create `frontend/lib/modelCatalog.ts`:
```ts
import type Database from 'better-sqlite3'

export type Undertone = 'warm' | 'cool' | 'neutral'
export const UNDERTONES: Undertone[] = ['warm', 'cool', 'neutral']

export type CatalogModel = {
  id: number
  name: string
  image: string
  dossierImage: string
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
  createdAt: string
  updatedAt: string
}

export type CatalogModelInput = {
  name: string
  image: string
  dossierImage: string
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
}

type CatalogModelRow = {
  id: number
  name: string
  image: string
  dossier_image: string
  pose_count: number
  tagline: string
  undertone: string
  height: string
  body_shape: string
  waist: string
  personal_color: string
  created_at: string
  updated_at: string
}

function rowToModel(row: CatalogModelRow): CatalogModel {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    dossierImage: row.dossier_image,
    poseCount: row.pose_count,
    tagline: row.tagline,
    undertone: row.undertone as Undertone,
    height: row.height,
    bodyShape: row.body_shape,
    waist: row.waist,
    personalColor: row.personal_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS catalog_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      dossier_image TEXT NOT NULL,
      pose_count INTEGER NOT NULL,
      tagline TEXT NOT NULL,
      undertone TEXT NOT NULL,
      height TEXT NOT NULL,
      body_shape TEXT NOT NULL,
      waist TEXT NOT NULL,
      personal_color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getModels(db: Database.Database): CatalogModel[] {
  const rows = db.prepare('SELECT * FROM catalog_models ORDER BY id ASC').all() as CatalogModelRow[]
  return rows.map(rowToModel)
}

export function getModelById(db: Database.Database, id: number): CatalogModel | null {
  const row = db.prepare('SELECT * FROM catalog_models WHERE id = ?').get(id) as CatalogModelRow | undefined
  return row ? rowToModel(row) : null
}

export function createModel(db: Database.Database, input: CatalogModelInput): CatalogModel {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO catalog_models
        (name, image, dossier_image, pose_count, tagline, undertone, height, body_shape, waist, personal_color, created_at, updated_at)
       VALUES (@name, @image, @dossierImage, @poseCount, @tagline, @undertone, @height, @bodyShape, @waist, @personalColor, @createdAt, @updatedAt)`
    )
    .run({ ...input, createdAt: now, updatedAt: now })
  const created = getModelById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created model')
  }
  return created
}

export function updateModel(db: Database.Database, id: number, input: CatalogModelInput): CatalogModel | null {
  const existing = getModelById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE catalog_models SET
      name = @name, image = @image, dossier_image = @dossierImage, pose_count = @poseCount,
      tagline = @tagline, undertone = @undertone, height = @height, body_shape = @bodyShape,
      waist = @waist, personal_color = @personalColor, updated_at = @updatedAt
     WHERE id = @id`
  ).run({ ...input, id, updatedAt: now })
  return getModelById(db, id)
}

export function deleteModel(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM catalog_models WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_MODELS: CatalogModelInput[] = [
  {
    name: 'Carmen',
    image: '/outfit/models/carmen-card.jpg',
    dossierImage: '/outfit/models/carmen-dossier.jpg',
    poseCount: 15,
    tagline: 'Tông da: Warm Neutral',
    undertone: 'neutral',
    height: '1m65',
    bodyShape: 'Đồng hồ cát',
    waist: '64cm',
    personalColor: 'Autumn Soft',
  },
  {
    name: 'Aisha',
    image: '/outfit/models/aisha.jpg',
    dossierImage: '/outfit/models/aisha.jpg',
    poseCount: 15,
    tagline: 'Da ngăm • Warm Deep',
    undertone: 'warm',
    height: '1m70',
    bodyShape: 'Đồng hồ cát',
    waist: '66cm',
    personalColor: 'Warm Deep Autumn',
  },
  {
    name: 'Alice',
    image: '/outfit/models/alice.jpg',
    dossierImage: '/outfit/models/alice.jpg',
    poseCount: 15,
    tagline: 'Da sáng • Cool Summer',
    undertone: 'cool',
    height: '1m68',
    bodyShape: 'Dáng thước kẻ',
    waist: '62cm',
    personalColor: 'Cool Summer Light',
  },
  {
    name: 'Amara',
    image: '/outfit/models/amara.jpg',
    dossierImage: '/outfit/models/amara.jpg',
    poseCount: 15,
    tagline: 'Afro Chic • Tôn đồ màu',
    undertone: 'warm',
    height: '1m72',
    bodyShape: 'Đồng hồ cát',
    waist: '68cm',
    personalColor: 'Warm Spring Bright',
  },
  {
    name: 'Arjun',
    image: '/outfit/models/arjun.jpg',
    dossierImage: '/outfit/models/arjun.jpg',
    poseCount: 12,
    tagline: 'Mẫu nam • Form Unisex',
    undertone: 'neutral',
    height: '1m80',
    bodyShape: 'Chữ nhật',
    waist: '80cm',
    personalColor: 'Neutral Autumn',
  },
  {
    name: 'Astrid',
    image: '/outfit/models/astrid.jpg',
    dossierImage: '/outfit/models/astrid.jpg',
    poseCount: 15,
    tagline: 'Tây Âu • Dáng thanh mảnh',
    undertone: 'cool',
    height: '1m75',
    bodyShape: 'Dáng thước kẻ',
    waist: '60cm',
    personalColor: 'Cool Winter Bright',
  },
  {
    name: 'Chloe',
    image: '/outfit/models/chloe.jpg',
    dossierImage: '/outfit/models/chloe.jpg',
    poseCount: 15,
    tagline: 'Á Đông • Dáng Petite',
    undertone: 'neutral',
    height: '1m58',
    bodyShape: 'Petite',
    waist: '58cm',
    personalColor: 'Neutral Spring',
  },
  {
    name: 'Bella',
    image: '/outfit/models/bella.jpg',
    dossierImage: '/outfit/models/bella.jpg',
    poseCount: 15,
    tagline: 'Đồng hồ cát • Đầy đặn',
    undertone: 'warm',
    height: '1m67',
    bodyShape: 'Đồng hồ cát',
    waist: '70cm',
    personalColor: 'Warm Autumn Deep',
  },
  {
    name: 'Camille',
    image: '/outfit/models/camille.jpg',
    dossierImage: '/outfit/models/camille.jpg',
    poseCount: 15,
    tagline: 'Parisian Chic • Dáng Quả Lê',
    undertone: 'neutral',
    height: '1m66',
    bodyShape: 'Quả lê',
    waist: '65cm',
    personalColor: 'Neutral Summer',
  },
  {
    name: 'Dave',
    image: '/outfit/models/dave.jpg',
    dossierImage: '/outfit/models/dave.jpg',
    poseCount: 10,
    tagline: 'Mẫu nam • Dáng thể thao',
    undertone: 'warm',
    height: '1m82',
    bodyShape: 'Thể thao',
    waist: '82cm',
    personalColor: 'Warm Spring',
  },
  {
    name: 'Linh Đan',
    image: '/outfit/models/linh-dan.jpg',
    dossierImage: '/outfit/models/linh-dan.jpg',
    poseCount: 15,
    tagline: 'Thuần Việt • Da trắng hồng',
    undertone: 'cool',
    height: '1m62',
    bodyShape: 'Đồng hồ cát',
    waist: '60cm',
    personalColor: 'Cool Summer Soft',
  },
  {
    name: 'Kenji',
    image: '/outfit/models/kenji.jpg',
    dossierImage: '/outfit/models/kenji.jpg',
    poseCount: 12,
    tagline: 'Tokyo Street • Tối giản',
    undertone: 'cool',
    height: '1m75',
    bodyShape: 'Chữ nhật',
    waist: '76cm',
    personalColor: 'Cool Winter Deep',
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM catalog_models').get() as { count: number }
  if (count > 0) return
  SEED_MODELS.forEach((model) => createModel(db, model))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/modelCatalog.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/modelCatalog.ts lib/modelCatalog.test.ts
git commit -m "feat: add model catalog data layer with CRUD and seed"
```

---

## Task 2: Wire Model Catalog schema into the shared `getDb()` singleton

**Files:**
- Modify: `frontend/lib/getDb.ts`

**Interfaces:**
- Consumes: `initSchema`, `seedIfEmpty` from `lib/modelCatalog.ts` (Task 1), aliased to avoid
  a name collision with the FAQ and Blog/Quiz `initSchema`/`seedIfEmpty` already imported.

- [ ] **Step 1: Modify `lib/getDb.ts`**

Add the import:
```ts
import { initSchema as initModelCatalogSchema, seedIfEmpty as seedModelCatalogIfEmpty } from './modelCatalog'
```
Inside `getDb()`, after the FAQ init/seed calls added in the FAQ CMS plan, add:
```ts
  initModelCatalogSchema(db)
  seedModelCatalogIfEmpty(db)
```

- [ ] **Step 2: Verify the whole project still compiles and tests still pass**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every existing test still passes.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/getDb.ts
git commit -m "feat: initialize and seed the model catalog table when opening the database"
```

---

## Task 3: Model Catalog API — validation + collection route

**Files:**
- Create: `frontend/app/api/model-catalog/validate.ts`
- Create: `frontend/app/api/model-catalog/validate.test.ts`
- Create: `frontend/app/api/model-catalog/route.ts`
- Create: `frontend/app/api/model-catalog/route.test.ts`

**Interfaces:**
- Consumes: `UNDERTONES`, `Undertone`, `CatalogModelInput`, `getModels`, `createModel` from
  `lib/modelCatalog.ts`; `getDb` from `lib/getDb.ts`; `getAdminSessionFromCookieHeader`.
- Produces: `validateModelBody(body: unknown): { errors: Record<string, string> } | { data:
  CatalogModelInput }`; `GET`/`POST` handlers.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/model-catalog/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateModelBody } from './validate'

const validBody = {
  name: 'Model Test',
  image: '/outfit/models/test.jpg',
  dossierImage: '/outfit/models/test-dossier.jpg',
  poseCount: 15,
  tagline: 'Tagline test',
  undertone: 'warm',
  height: '1m70',
  bodyShape: 'Đồng hồ cát',
  waist: '66cm',
  personalColor: 'Warm Autumn',
}

describe('validateModelBody', () => {
  it('accepts a valid body', () => {
    const result = validateModelBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = validateModelBody({ ...validBody, name: '' })
    expect('errors' in result && result.errors.name).toBeDefined()
  })

  it('rejects a non-positive pose count', () => {
    const result = validateModelBody({ ...validBody, poseCount: 0 })
    expect('errors' in result && result.errors.poseCount).toBeDefined()
  })

  it('rejects an invalid undertone', () => {
    const result = validateModelBody({ ...validBody, undertone: 'not-a-tone' })
    expect('errors' in result && result.errors.undertone).toBeDefined()
  })

  it('rejects an empty image URL', () => {
    const result = validateModelBody({ ...validBody, image: '' })
    expect('errors' in result && result.errors.image).toBeDefined()
  })
})
```

Create `frontend/app/api/model-catalog/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/modelCatalog')>('@/lib/modelCatalog')
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
  name: 'Model Test',
  image: '/outfit/models/test.jpg',
  dossierImage: '/outfit/models/test-dossier.jpg',
  poseCount: 15,
  tagline: 'Tagline test',
  undertone: 'warm',
  height: '1m70',
  bodyShape: 'Đồng hồ cát',
  waist: '66cm',
  personalColor: 'Warm Autumn',
}

beforeEach(() => {
  getDb().exec('DELETE FROM catalog_models')
})

describe('GET /api/model-catalog', () => {
  it('returns an empty list when there are no models', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/model-catalog', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/model-catalog', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a model and returns 201', async () => {
    const request = new Request('http://localhost/api/model-catalog', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect((await response.json()).name).toBe('Model Test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/model-catalog', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, name: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.name).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/api/model-catalog/validate.test.ts app/api/model-catalog/route.test.ts`
Expected: FAIL — neither `validate.ts` nor `route.ts` exist yet.

- [ ] **Step 3: Implement `validate.ts`**

Create `frontend/app/api/model-catalog/validate.ts`:
```ts
import { UNDERTONES, type CatalogModelInput, type Undertone } from '@/lib/modelCatalog'

type RawModelBody = {
  name?: unknown
  image?: unknown
  dossierImage?: unknown
  poseCount?: unknown
  tagline?: unknown
  undertone?: unknown
  height?: unknown
  bodyShape?: unknown
  waist?: unknown
  personalColor?: unknown
}

function requiredString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateModelBody(
  body: unknown
): { errors: Record<string, string> } | { data: CatalogModelInput } {
  const raw = (body ?? {}) as RawModelBody
  const errors: Record<string, string> = {}

  const name = requiredString(raw.name)
  if (!name) errors.name = 'Tên người mẫu không được để trống'

  const image = requiredString(raw.image)
  if (!image) errors.image = 'Ảnh đại diện không được để trống'

  const dossierImage = requiredString(raw.dossierImage)
  if (!dossierImage) errors.dossierImage = 'Ảnh hồ sơ không được để trống'

  const poseCount = typeof raw.poseCount === 'number' ? raw.poseCount : NaN
  if (!Number.isInteger(poseCount) || poseCount <= 0) {
    errors.poseCount = 'Số dáng chụp phải là số nguyên dương'
  }

  const tagline = requiredString(raw.tagline)
  if (!tagline) errors.tagline = 'Tagline không được để trống'

  const undertone = raw.undertone as Undertone
  if (!UNDERTONES.includes(undertone)) errors.undertone = 'Undertone không hợp lệ'

  const height = requiredString(raw.height)
  if (!height) errors.height = 'Chiều cao không được để trống'

  const bodyShape = requiredString(raw.bodyShape)
  if (!bodyShape) errors.bodyShape = 'Dáng người không được để trống'

  const waist = requiredString(raw.waist)
  if (!waist) errors.waist = 'Số đo vòng eo không được để trống'

  const personalColor = requiredString(raw.personalColor)
  if (!personalColor) errors.personalColor = 'Personal Color không được để trống'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return {
    data: { name, image, dossierImage, poseCount, tagline, undertone, height, bodyShape, waist, personalColor },
  }
}
```

- [ ] **Step 4: Implement `route.ts`**

Create `frontend/app/api/model-catalog/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getModels, createModel } from '@/lib/modelCatalog'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateModelBody } from './validate'

export async function GET() {
  const db = getDb()
  return NextResponse.json(getModels(db))
}

export async function POST(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateModelBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createModel(db, result.data)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/model-catalog/validate.test.ts app/api/model-catalog/route.test.ts`
Expected: PASS (5 + 3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add app/api/model-catalog/validate.ts app/api/model-catalog/validate.test.ts app/api/model-catalog/route.ts app/api/model-catalog/route.test.ts
git commit -m "feat: add model catalog collection API route with validation"
```

---

## Task 4: Model Catalog API — single-model route

**Files:**
- Create: `frontend/app/api/model-catalog/[id]/route.ts`
- Create: `frontend/app/api/model-catalog/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getModelById`, `updateModel`, `deleteModel` from `lib/modelCatalog.ts`; `getDb`;
  `validateModelBody` from Task 3; `getAdminSessionFromCookieHeader`.
- Produces: `GET`/`PUT`/`DELETE` handlers, consumed by Task 11 (edit page) and Task 9
  (`ModelForm`'s PUT call).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/model-catalog/[id]/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { createModel } from '@/lib/modelCatalog'
import { GET, PUT, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/modelCatalog')>('@/lib/modelCatalog')
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
  name: 'Model Test',
  image: '/outfit/models/test.jpg',
  dossierImage: '/outfit/models/test-dossier.jpg',
  poseCount: 15,
  tagline: 'Tagline test',
  undertone: 'warm',
  height: '1m70',
  bodyShape: 'Đồng hồ cát',
  waist: '66cm',
  personalColor: 'Warm Autumn',
}

beforeEach(() => {
  getDb().exec('DELETE FROM catalog_models')
})

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/model-catalog/[id]', () => {
  it('returns the model when it exists', async () => {
    const created = createModel(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Model Test')
  })

  it('returns 404 when the model does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/model-catalog/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createModel(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the model', async () => {
    const created = createModel(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, name: 'Tên đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Tên đã sửa')
  })

  it('returns 404 when updating a model that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/model-catalog/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createModel(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the model', async () => {
    const created = createModel(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM catalog_models WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/model-catalog/\[id\]/route.test.ts"`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `frontend/app/api/model-catalog/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getModelById, updateModel, deleteModel } from '@/lib/modelCatalog'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateModelBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const model = getModelById(getDb(), Number(id))
  if (!model) {
    return NextResponse.json({ error: 'Không tìm thấy người mẫu' }, { status: 404 })
  }
  return NextResponse.json(model)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = validateModelBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateModel(getDb(), Number(id), result.data)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy người mẫu' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteModel(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy người mẫu' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/model-catalog/\[id\]/route.test.ts"`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/model-catalog/[id]/route.ts" "app/api/model-catalog/[id]/route.test.ts"
git commit -m "feat: add single model catalog API route"
```

---

## Task 5: `OutfitFlowProvider` accepts the default model from a prop

**Files:**
- Modify: `frontend/components/outfit/OutfitFlowProvider.tsx`
- Modify: `frontend/components/outfit/OutfitFlowProvider.test.tsx`
- Modify: `frontend/components/outfit/step3/QuickSelectionSummary.test.tsx`

**Interfaces:**
- Produces: `OutfitFlowProvider({ children, initialModel? })` — `initialModel` is an
  **optional** `Model` prop; when omitted, the provider falls back to an internal
  `FALLBACK_MODEL` constant (same Carmen data as before, but no longer named `DEFAULT_MODEL`
  and no longer treated as "the" canonical default — the real default now comes from
  `app/outfit/layout.tsx` passing the DB's first model, see Task 8). Consumed by Task 8
  (`app/outfit/layout.tsx`).

Why keep a fallback constant at all: 16 other test files across the Outfit flow render
`<OutfitFlowProvider>` with no props and don't care which model is selected — forcing all of
them to pass a fixture model would be a large, unrelated diff for zero product value. Only
the two files below actually assert against the default model's identity, so only they
change.

- [ ] **Step 1: Update the failing tests first**

In `frontend/components/outfit/OutfitFlowProvider.test.tsx`, change the import and the one
assertion that reference `DEFAULT_MODEL`:
```ts
import {
  OutfitFlowProvider,
  useOutfitFlow,
  DEFAULT_GARMENT,
  FALLBACK_MODEL,
  DEFAULT_POSE,
} from './OutfitFlowProvider'
```
(replacing the old `DEFAULT_MODEL` import name), and in the `'provides the default garment
and model before any selection'` test, change:
```ts
    expect(screen.getByText(DEFAULT_MODEL.name)).toBeInTheDocument()
```
to:
```ts
    expect(screen.getByText(FALLBACK_MODEL.name)).toBeInTheDocument()
```

In `frontend/components/outfit/step3/QuickSelectionSummary.test.tsx`, apply the same rename:
```ts
import { OutfitFlowProvider, DEFAULT_GARMENT, FALLBACK_MODEL } from '../OutfitFlowProvider'
```
and:
```ts
    expect(screen.getByText(new RegExp(FALLBACK_MODEL.name))).toBeInTheDocument()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/outfit/OutfitFlowProvider.test.tsx components/outfit/step3/QuickSelectionSummary.test.tsx`
Expected: FAIL — `FALLBACK_MODEL` is not exported yet (still called `DEFAULT_MODEL`).

- [ ] **Step 3: Update `OutfitFlowProvider.tsx`**

Rename the exported constant and accept the new prop. Change:
```ts
export const DEFAULT_MODEL: Model = {
```
to:
```ts
export const FALLBACK_MODEL: Model = {
```
(the object body is unchanged). Then change the provider function signature and initial
state:
```ts
export function OutfitFlowProvider({
  children,
  initialModel,
}: {
  children: ReactNode
  initialModel?: Model
}) {
  const [selectedGarment, setSelectedGarment] = useState<Garment>(DEFAULT_GARMENT)
  const [selectedModel, setSelectedModel] = useState<Model>(initialModel ?? FALLBACK_MODEL)
```
(only the function signature's first line and the `selectedModel` initializer change; every
other line of `OutfitFlowProvider` stays the same).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/outfit/OutfitFlowProvider.test.tsx components/outfit/step3/QuickSelectionSummary.test.tsx`
Expected: PASS (7 + 1 tests)

- [ ] **Step 5: Run the full outfit-flow test suite to confirm nothing else broke**

Run: `cd frontend && npx vitest run components/outfit`
Expected: PASS — every other Outfit test file renders `<OutfitFlowProvider>` with no props
and is unaffected by the optional prop.

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/outfit/OutfitFlowProvider.tsx components/outfit/OutfitFlowProvider.test.tsx components/outfit/step3/QuickSelectionSummary.test.tsx
git commit -m "feat: let OutfitFlowProvider accept the default model as a prop"
```

---

## Task 6: `ModelCatalog` reads models from a prop instead of the hardcoded file

**Files:**
- Modify: `frontend/components/outfit/step2/ModelCatalog.tsx`
- Modify: `frontend/components/outfit/step2/ModelCatalog.test.tsx`

**Interfaces:**
- Consumes: `CatalogModel`, `Undertone` from `lib/modelCatalog.ts` (Task 1) — used **only**
  as the prop type; `DEFAULT_MODEL`/`FALLBACK_MODEL` import is removed entirely, since the
  prop list itself now includes Carmen (seeded first).
- Produces: `ModelCatalog({ models: CatalogModel[] })` — consumed by Task 7
  (`Step2PageContent`).

- [ ] **Step 1: Write the failing test**

Replace `frontend/components/outfit/step2/ModelCatalog.test.tsx`:
```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ModelCatalog from './ModelCatalog'
import { OutfitFlowProvider, useOutfitFlow } from '../OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'

function makeModel(overrides: Partial<CatalogModel> & Pick<CatalogModel, 'id' | 'name'>): CatalogModel {
  return {
    image: `/outfit/models/${overrides.id}.jpg`,
    dossierImage: `/outfit/models/${overrides.id}.jpg`,
    poseCount: 15,
    tagline: 'Tagline',
    undertone: 'neutral',
    height: '1m65',
    bodyShape: 'Đồng hồ cát',
    waist: '64cm',
    personalColor: 'Autumn Soft',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  }
}

const MODELS: CatalogModel[] = [
  makeModel({ id: 1, name: 'Carmen', undertone: 'neutral' }),
  makeModel({ id: 2, name: 'Aisha', undertone: 'warm' }),
  makeModel({ id: 3, name: 'Astrid', undertone: 'cool' }),
  makeModel({ id: 4, name: 'Kenji', undertone: 'cool' }),
  makeModel({ id: 5, name: 'Linh Đan', undertone: 'cool' }),
]

function SelectedModelName() {
  const { selectedModel } = useOutfitFlow()
  return <p>Đang xem: {selectedModel.name}</p>
}

describe('ModelCatalog', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock-model') })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders every model passed in', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Kenji')).toBeInTheDocument()
    expect(screen.getByText('Linh Đan')).toBeInTheDocument()
  })

  it('updates the shared selected model when a card is clicked', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <SelectedModelName />
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByText('Kenji'))
    expect(screen.getByText('Đang xem: Kenji')).toBeInTheDocument()
  })

  it('filters the grid by undertone', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cool' }))
    expect(screen.getByText('Astrid')).toBeInTheDocument()
    expect(screen.queryByText('Aisha')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }))
    expect(screen.getByText('Aisha')).toBeInTheDocument()
  })

  it('creates and selects a custom model from an uploaded photo', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <SelectedModelName />
        <ModelCatalog models={MODELS} />
      </OutfitFlowProvider>
    )
    const file = new File(['fake'], 'me.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Tải ảnh mặt \/ dáng/) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText('Đang xem: Ảnh của bạn')).toBeInTheDocument()
  })
})
```

Note: the old test's `'renders all 12 models and marks Carmen as selected by default'`
assertion (`getAllByText('Đang chọn')` length 1) is dropped from the "renders every model"
case because which model shows the "selected" badge now depends on `OutfitFlowProvider`'s
default (a separate concern already covered by Task 5's tests) rather than on `ModelCatalog`
itself — re-asserting it here would duplicate that coverage against an implementation detail
(the fallback model's `id`) this component doesn't own.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/outfit/step2/ModelCatalog.test.tsx`
Expected: FAIL — `ModelCatalog` still reads its own hardcoded `MODELS`/`DEFAULT_MODEL`, no
`models` prop.

- [ ] **Step 3: Rewrite `ModelCatalog.tsx`**

Replace `frontend/components/outfit/step2/ModelCatalog.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState, type ChangeEvent } from 'react'
import { useOutfitFlow } from '../OutfitFlowProvider'
import type { CatalogModel, Undertone } from '@/lib/modelCatalog'

const UNDERTONE_FILTERS: { id: 'all' | Undertone; key: 'all' | 'warm' | 'cool' | 'neutral' }[] = [
  { id: 'all', key: 'all' },
  { id: 'warm', key: 'warm' },
  { id: 'cool', key: 'cool' },
  { id: 'neutral', key: 'neutral' },
]

export default function ModelCatalog({ models }: { models: CatalogModel[] }) {
  const t = useTranslations('Outfit.Step2.ModelCatalog')
  const { selectedModel, setSelectedModel } = useOutfitFlow()
  const [undertoneFilter, setUndertoneFilter] = useState<'all' | Undertone>('all')

  const visibleModels = models.filter(
    (model) => undertoneFilter === 'all' || model.undertone === undertoneFilter
  )

  function handleCustomUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const imageUrl = URL.createObjectURL(file)
    setSelectedModel({
      id: 'custom-upload',
      name: t('customUploadName'),
      image: imageUrl,
      dossierImage: imageUrl,
      poseCount: 1,
      tagline: t('customUploadTagline'),
      undertone: 'neutral',
      height: '—',
      bodyShape: '—',
      waist: '—',
      personalColor: '—',
    })
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <span className="flex items-center gap-space-xs text-label-lg font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
            {t('filterHeading')}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm font-medium text-on-surface-variant">{t('undertoneLabel')}</label>
          <div className="flex items-center gap-1.5 rounded-xl bg-surface-container-low p-1">
            {UNDERTONE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setUndertoneFilter(filter.id)}
                className={`flex-1 rounded-lg py-1.5 text-center text-label-sm ${
                  undertoneFilter === filter.id
                    ? 'bg-surface-container-lowest font-semibold text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t(`undertoneFilters.${filter.key}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="text-label-lg font-semibold text-on-surface">
            {t('listHeading', { count: models.length })}
          </span>
          <span className="text-body-sm text-outline">{t('clickHint')}</span>
        </div>
        <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3 md:grid-cols-4">
          <label
            htmlFor="modelUploadInput"
            className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl bg-surface-container-high/60 p-space-md text-center shadow-xs transition-all hover:bg-secondary-fixed/30 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
              <span className="material-symbols-outlined text-[26px]">add</span>
            </div>
            <span className="mt-space-sm font-semibold text-label-lg text-on-surface">{t('uploadTitle')}</span>
            <p className="mt-1 px-1 text-body-sm text-outline">{t('uploadHint')}</p>
            <span className="mt-2 rounded-full bg-surface-container-lowest px-2 py-0.5 text-label-sm text-secondary">
              {t('uploadBadge')}
            </span>
          </label>
          <input
            id="modelUploadInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomUpload}
          />
          {visibleModels.map((model) => {
            const isSelected = selectedModel.id === String(model.id)
            return (
              <button
                key={model.id}
                type="button"
                onClick={() =>
                  setSelectedModel({
                    id: String(model.id),
                    name: model.name,
                    image: model.image,
                    dossierImage: model.dossierImage,
                    poseCount: model.poseCount,
                    tagline: model.tagline,
                    undertone: model.undertone,
                    height: model.height,
                    bodyShape: model.bodyShape,
                    waist: model.waist,
                    personalColor: model.personalColor,
                  })
                }
                className={`relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest text-left shadow-sm transition-all hover:shadow-md ${
                  isSelected ? 'bg-gradient-to-b from-primary/5 to-secondary/10 shadow-lg' : ''
                }`}
              >
                {isSelected && (
                  <>
                    <div className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary shadow-md">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <div className="absolute left-2 top-2 z-10 rounded-full bg-surface-container-lowest/90 px-2 py-0.5 text-label-sm font-bold text-primary shadow-xs backdrop-blur-md">
                      {t('selectedBadge')}
                    </div>
                  </>
                )}
                <div className="aspect-[3/4] w-full overflow-hidden bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={model.image}
                    alt={model.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="flex flex-col bg-surface-container-lowest p-space-sm">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-label-lg font-semibold ${isSelected ? 'font-bold text-primary' : 'text-on-surface'}`}
                    >
                      {model.name}
                    </span>
                    <span className={`text-label-sm ${isSelected ? 'font-semibold text-primary' : 'text-outline'}`}>
                      {t('poseCount', { count: model.poseCount })}
                    </span>
                  </div>
                  <span className="mt-0.5 text-body-sm text-on-surface-variant">{model.tagline}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

Note the `id: String(model.id)` conversion: `CatalogModel.id` is a numeric database id (like
every other CMS entity in this codebase), but the shared `Model` type used by
`OutfitFlowProvider`/`ModelDossier`/etc. has always used a **string** `id` (it also has to
hold the non-numeric `'custom-upload'` id for the photo-upload case) — converting at the one
point where a `CatalogModel` becomes a `Model` keeps that existing string-based contract
intact everywhere else without touching it.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/outfit/step2/ModelCatalog.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/outfit/step2/ModelCatalog.tsx components/outfit/step2/ModelCatalog.test.tsx
git commit -m "feat: make ModelCatalog render models passed in as a prop"
```

---

## Task 7: Split Step 2 page into a Server Component fetch + `Step2PageContent`

**Files:**
- Create: `frontend/components/outfit/step2/Step2PageContent.tsx`
- Create: `frontend/components/outfit/step2/Step2PageContent.test.tsx`
- Modify: `frontend/app/outfit/step-2/page.tsx`
- Modify: `frontend/app/outfit/step-2/page.test.tsx`

**Interfaces:**
- Consumes: `getModels` from `lib/modelCatalog.ts`; `getDb` from `lib/getDb.ts`;
  `ModelCatalog` (Task 6).
- Produces: `Step2PageContent({ models: CatalogModel[] })` (everything the old `Step2Page`
  rendered, now prop-driven); `Step2Page` (default export of `app/outfit/step-2/page.tsx`)
  becomes a synchronous Server Component with no props.

`getModels` is synchronous, so the page does not need to become `async`, same as every other
CMS page so far.

- [ ] **Step 1: Write the failing tests**

Create `frontend/components/outfit/step2/Step2PageContent.test.tsx` — this is the full,
unmodified content of the **current** `app/outfit/step-2/page.test.tsx`, moved here and given
a `models` prop:
```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step2PageContent from './Step2PageContent'
import { OutfitFlowProvider } from '../OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const MODELS: CatalogModel[] = [
  {
    id: 1,
    name: 'Carmen',
    image: '/outfit/models/carmen-card.jpg',
    dossierImage: '/outfit/models/carmen-dossier.jpg',
    poseCount: 15,
    tagline: 'Tông da: Warm Neutral',
    undertone: 'neutral',
    height: '1m65',
    bodyShape: 'Đồng hồ cát',
    waist: '64cm',
    personalColor: 'Autumn Soft',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('Step2PageContent', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('renders the step heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Bước 2: Chọn Người Mẫu Hoặc Tải Ảnh Cá Nhân' })
    ).toBeInTheDocument()
  })

  it('links back to step 1', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('link', { name: /Quay lại Bước 1/ })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('navigates to step 3 after confirming the model', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2PageContent models={MODELS} />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận người mẫu/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-3')
  })
})
```

Replace `frontend/app/outfit/step-2/page.test.tsx` with a thin smoke test, mirroring
`app/personal-color/quiz/page.test.tsx`'s pattern:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MODELS: CatalogModel[] = [
  {
    id: 1,
    name: 'Carmen',
    image: '/outfit/models/carmen-card.jpg',
    dossierImage: '/outfit/models/carmen-dossier.jpg',
    poseCount: 15,
    tagline: 'Tông da: Warm Neutral',
    undertone: 'neutral',
    height: '1m65',
    bodyShape: 'Đồng hồ cát',
    waist: '64cm',
    personalColor: 'Autumn Soft',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

vi.mock('@/lib/getDb', () => ({ getDb: () => ({}) }))
vi.mock('@/lib/modelCatalog', async () => {
  const actual = await vi.importActual<typeof import('@/lib/modelCatalog')>('@/lib/modelCatalog')
  return { ...actual, getModels: () => MODELS }
})

describe('Step2Page', async () => {
  const { default: Step2Page } = await import('./page')

  it('renders the step heading with models loaded from the database', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step2Page />
      </OutfitFlowProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Bước 2: Chọn Người Mẫu Hoặc Tải Ảnh Cá Nhân' })
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/outfit/step2/Step2PageContent.test.tsx app/outfit/step-2/page.test.tsx`
Expected: FAIL — `Step2PageContent` doesn't exist; `page.tsx` still renders the old inline
Client Component with no `models` prop plumbed through.

- [ ] **Step 3: Create `Step2PageContent.tsx`**

Create `frontend/components/outfit/step2/Step2PageContent.tsx` with the **entire body of the
current** `app/outfit/step-2/page.tsx`, renamed and taking a `models` prop that it forwards to
`ModelCatalog`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SelectedGarmentBanner from './SelectedGarmentBanner'
import ModelCatalog from './ModelCatalog'
import ModelDossier from './ModelDossier'
import type { CatalogModel } from '@/lib/modelCatalog'

const MODE_TABS = [
  { id: 'our-models', icon: 'group', key: 'ourModels' },
  { id: 'user-model', icon: 'add_a_photo', key: 'userModel' },
] as const

export default function Step2PageContent({ models }: { models: CatalogModel[] }) {
  const t = useTranslations('Outfit.Step2.Page')
  const router = useRouter()
  const [activeMode, setActiveMode] = useState<(typeof MODE_TABS)[number]['id']>('our-models')

  function handleContinue() {
    router.push('/outfit/step-3')
  }

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-surface-container-low px-margin-desktop py-space-lg">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-space-md lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-space-xs text-label-md font-semibold uppercase tracking-wider text-secondary">
              <span className="material-symbols-outlined text-[18px]">face_retouching_natural</span>
              {t('eyebrow')}
            </div>
            <h1 className="mt-1 text-headline-lg tracking-tight text-on-surface">{t('heading')}</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">{t('subheading')}</p>
          </div>
          <SelectedGarmentBanner />
        </div>
      </section>
      <section className="w-full bg-background px-margin-desktop py-space-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-gutter-desktop lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-8">
            <div className="flex items-center gap-space-xs rounded-2xl bg-surface-container p-1.5">
              {MODE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-space-sm rounded-xl px-space-md py-3 text-title-md transition-all ${
                    activeMode === tab.id
                      ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                      : 'font-medium text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                  <span>{t(`modeTabs.${tab.key}.label`)}</span>
                  <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-label-sm text-on-primary-fixed">
                    {t(`modeTabs.${tab.key}.badge`)}
                  </span>
                </button>
              ))}
            </div>
            <ModelCatalog models={models} />
          </div>
          <div className="lg:col-span-4">
            <ModelDossier />
          </div>
        </div>
      </section>
      <section className="sticky bottom-0 z-40 w-full bg-surface-container-lowest/95 px-margin-desktop py-space-md shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-space-md sm:flex-row">
          <Link
            href="/outfit/step-1"
            className="flex w-full items-center justify-center gap-space-xs rounded-full bg-surface-container-high px-space-lg py-3 text-label-lg text-on-surface transition-colors hover:bg-surface-container-highest sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('backButton')}
          </Link>
          <button
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-space-sm rounded-full bg-primary px-space-xl py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg sm:w-auto"
          >
            <span>{t('continueButton')}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `app/outfit/step-2/page.tsx`**

```tsx
import Step2PageContent from '@/components/outfit/step2/Step2PageContent'
import { getModels } from '@/lib/modelCatalog'
import { getDb } from '@/lib/getDb'

export default function Step2Page() {
  const models = getModels(getDb())
  return <Step2PageContent models={models} />
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/outfit/step2/Step2PageContent.test.tsx app/outfit/step-2/page.test.tsx`
Expected: PASS (3 + 1 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/outfit/step2/Step2PageContent.tsx components/outfit/step2/Step2PageContent.test.tsx app/outfit/step-2/page.tsx app/outfit/step-2/page.test.tsx
git commit -m "feat: read the model catalog from the database on the outfit step 2 page"
```

---

## Task 8: `app/outfit/layout.tsx` seeds the default model from the database

**Files:**
- Modify: `frontend/app/outfit/layout.tsx`

**Interfaces:**
- Consumes: `getModels` from `lib/modelCatalog.ts`; `getDb` from `lib/getDb.ts`;
  `OutfitFlowProvider`'s new `initialModel` prop (Task 5).

No test file (no `layout.tsx` in this codebase has one — see Global Constraints); verified by
`tsc --noEmit`, the full suite, and the mandatory manual browser check in Task 13.

- [ ] **Step 1: Rewrite `app/outfit/layout.tsx`**

```tsx
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import OutfitFlowChrome from '@/components/outfit/OutfitFlowChrome'
import { getModels } from '@/lib/modelCatalog'
import { getDb } from '@/lib/getDb'

export default function OutfitLayout({ children }: { children: React.ReactNode }) {
  const models = getModels(getDb())

  return (
    <OutfitFlowProvider initialModel={models[0]}>
      <OutfitFlowChrome>{children}</OutfitFlowChrome>
    </OutfitFlowProvider>
  )
}
```

- [ ] **Step 2: Verify the whole project still compiles and tests still pass**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every existing test still passes.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add app/outfit/layout.tsx
git commit -m "feat: seed the outfit flow's default model from the database"
```

---

## Task 9: `ModelForm` — shared create/edit admin form

**Files:**
- Create: `frontend/components/admin/ModelForm.tsx`
- Create: `frontend/components/admin/ModelForm.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.ModelForm` namespace)

**Interfaces:**
- Consumes: `UNDERTONES`, `Undertone`, `CatalogModel` from `lib/modelCatalog.ts`;
  `/api/model-catalog`, `/api/model-catalog/[id]` from Tasks 3-4.
- Produces: `ModelForm({ initialModel?: CatalogModel })` — consumed by Task 11.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "ModelForm": {
      "fields": {
        "name": "Tên người mẫu",
        "image": "Ảnh đại diện (URL)",
        "dossierImage": "Ảnh hồ sơ (URL)",
        "poseCount": "Số dáng chụp",
        "tagline": "Tagline",
        "undertone": "Undertone",
        "height": "Chiều cao",
        "bodyShape": "Dáng người",
        "waist": "Số đo vòng eo",
        "personalColor": "Personal Color"
      },
      "undertones": {
        "warm": "Warm",
        "cool": "Cool",
        "neutral": "Neutral"
      },
      "submitCreate": "Tạo người mẫu",
      "submitEdit": "Lưu thay đổi",
      "unauthorizedError": "Bạn cần đăng nhập với quyền quản trị.",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại."
    }
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/admin/ModelForm.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ModelForm from './ModelForm'
import type { CatalogModel } from '@/lib/modelCatalog'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_MODEL: CatalogModel = {
  id: 5,
  name: 'Model hiện có',
  image: '/outfit/models/existing.jpg',
  dossierImage: '/outfit/models/existing-dossier.jpg',
  poseCount: 12,
  tagline: 'Tagline hiện có',
  undertone: 'cool',
  height: '1m70',
  bodyShape: 'Chữ nhật',
  waist: '70cm',
  personalColor: 'Cool Winter',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('ModelForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('POSTs to /api/model-catalog when creating and redirects on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<ModelForm />)
    fireEvent.change(screen.getByLabelText('Tên người mẫu'), { target: { value: 'Model Mới' } })
    fireEvent.change(screen.getByLabelText('Ảnh đại diện (URL)'), { target: { value: '/outfit/models/new.jpg' } })
    fireEvent.change(screen.getByLabelText('Ảnh hồ sơ (URL)'), { target: { value: '/outfit/models/new-dossier.jpg' } })
    fireEvent.change(screen.getByLabelText('Số dáng chụp'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('Tagline'), { target: { value: 'Tagline mới' } })
    fireEvent.change(screen.getByLabelText('Chiều cao'), { target: { value: '1m70' } })
    fireEvent.change(screen.getByLabelText('Dáng người'), { target: { value: 'Chữ nhật' } })
    fireEvent.change(screen.getByLabelText('Số đo vòng eo'), { target: { value: '68cm' } })
    fireEvent.change(screen.getByLabelText('Personal Color'), { target: { value: 'Warm Spring' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo người mẫu' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/model-catalog'))
    expect(fetch).toHaveBeenCalledWith('/api/model-catalog', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/model-catalog/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_MODEL }))
    renderWithIntl(<ModelForm initialModel={EXISTING_MODEL} />)
    expect(screen.getByLabelText('Tên người mẫu')).toHaveValue('Model hiện có')
    expect(screen.getByLabelText('Undertone')).toHaveValue('cool')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/model-catalog'))
    expect(fetch).toHaveBeenCalledWith('/api/model-catalog/5', expect.objectContaining({ method: 'PUT' }))
  })

  it('shows field errors returned by the API instead of redirecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: { name: 'Tên người mẫu không được để trống' } }),
      })
    )
    renderWithIntl(<ModelForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo người mẫu' }))

    await waitFor(() => expect(screen.getByText('Tên người mẫu không được để trống')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/ModelForm.test.tsx`
Expected: FAIL — `./ModelForm` module does not exist yet.

- [ ] **Step 4: Implement `ModelForm.tsx`**

Create `frontend/components/admin/ModelForm.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { UNDERTONES, type CatalogModel, type Undertone } from '@/lib/modelCatalog'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function ModelForm({ initialModel }: { initialModel?: CatalogModel }) {
  const t = useTranslations('Admin.ModelForm')
  const router = useRouter()
  const isEditing = Boolean(initialModel)

  const [name, setName] = useState(initialModel?.name ?? '')
  const [image, setImage] = useState(initialModel?.image ?? '')
  const [dossierImage, setDossierImage] = useState(initialModel?.dossierImage ?? '')
  const [poseCount, setPoseCount] = useState(String(initialModel?.poseCount ?? ''))
  const [tagline, setTagline] = useState(initialModel?.tagline ?? '')
  const [undertone, setUndertone] = useState<Undertone>(initialModel?.undertone ?? UNDERTONES[0])
  const [height, setHeight] = useState(initialModel?.height ?? '')
  const [bodyShape, setBodyShape] = useState(initialModel?.bodyShape ?? '')
  const [waist, setWaist] = useState(initialModel?.waist ?? '')
  const [personalColor, setPersonalColor] = useState(initialModel?.personalColor ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = {
      name,
      image,
      dossierImage,
      poseCount: Number(poseCount),
      tagline,
      undertone,
      height,
      bodyShape,
      waist,
      personalColor,
    }

    const response = await fetch(isEditing ? `/api/model-catalog/${initialModel!.id}` : '/api/model-catalog', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

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

    router.push('/admin/model-catalog')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="model-name" className="text-label-md font-semibold text-on-surface">
          {t('fields.name')}
        </label>
        <input id="model-name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        {errors.name && <p className="text-label-sm text-error">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="model-image" className="text-label-md font-semibold text-on-surface">
            {t('fields.image')}
          </label>
          <input
            id="model-image"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            className={inputClass}
          />
          {errors.image && <p className="text-label-sm text-error">{errors.image}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="model-dossier-image" className="text-label-md font-semibold text-on-surface">
            {t('fields.dossierImage')}
          </label>
          <input
            id="model-dossier-image"
            value={dossierImage}
            onChange={(event) => setDossierImage(event.target.value)}
            className={inputClass}
          />
          {errors.dossierImage && <p className="text-label-sm text-error">{errors.dossierImage}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="model-pose-count" className="text-label-md font-semibold text-on-surface">
            {t('fields.poseCount')}
          </label>
          <input
            id="model-pose-count"
            type="number"
            value={poseCount}
            onChange={(event) => setPoseCount(event.target.value)}
            className={inputClass}
          />
          {errors.poseCount && <p className="text-label-sm text-error">{errors.poseCount}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="model-tagline" className="text-label-md font-semibold text-on-surface">
            {t('fields.tagline')}
          </label>
          <input
            id="model-tagline"
            value={tagline}
            onChange={(event) => setTagline(event.target.value)}
            className={inputClass}
          />
          {errors.tagline && <p className="text-label-sm text-error">{errors.tagline}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="model-undertone" className="text-label-md font-semibold text-on-surface">
          {t('fields.undertone')}
        </label>
        <select
          id="model-undertone"
          value={undertone}
          onChange={(event) => setUndertone(event.target.value as Undertone)}
          className={inputClass}
        >
          {UNDERTONES.map((value) => (
            <option key={value} value={value}>
              {t(`undertones.${value}`)}
            </option>
          ))}
        </select>
        {errors.undertone && <p className="text-label-sm text-error">{errors.undertone}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="model-height" className="text-label-md font-semibold text-on-surface">
            {t('fields.height')}
          </label>
          <input
            id="model-height"
            value={height}
            onChange={(event) => setHeight(event.target.value)}
            className={inputClass}
          />
          {errors.height && <p className="text-label-sm text-error">{errors.height}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="model-body-shape" className="text-label-md font-semibold text-on-surface">
            {t('fields.bodyShape')}
          </label>
          <input
            id="model-body-shape"
            value={bodyShape}
            onChange={(event) => setBodyShape(event.target.value)}
            className={inputClass}
          />
          {errors.bodyShape && <p className="text-label-sm text-error">{errors.bodyShape}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="model-waist" className="text-label-md font-semibold text-on-surface">
            {t('fields.waist')}
          </label>
          <input
            id="model-waist"
            value={waist}
            onChange={(event) => setWaist(event.target.value)}
            className={inputClass}
          />
          {errors.waist && <p className="text-label-sm text-error">{errors.waist}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="model-personal-color" className="text-label-md font-semibold text-on-surface">
          {t('fields.personalColor')}
        </label>
        <input
          id="model-personal-color"
          value={personalColor}
          onChange={(event) => setPersonalColor(event.target.value)}
          className={inputClass}
        />
        {errors.personalColor && <p className="text-label-sm text-error">{errors.personalColor}</p>}
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

Run: `cd frontend && npx vitest run components/admin/ModelForm.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/admin/ModelForm.tsx components/admin/ModelForm.test.tsx messages/vi.json
git commit -m "feat: add shared model catalog create/edit admin form"
```

---

## Task 10: Model Catalog admin list — `ModelList` + `/admin/model-catalog` page

**Files:**
- Create: `frontend/components/admin/ModelList.tsx`
- Create: `frontend/components/admin/ModelList.test.tsx`
- Create: `frontend/app/admin/model-catalog/page.tsx`
- Create: `frontend/app/admin/model-catalog/page.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.ModelList` namespace)

**Interfaces:**
- Consumes: `CatalogModel` from `lib/modelCatalog.ts`; `GET`/`DELETE
  /api/model-catalog(/[id])` from Tasks 3-4; `AdminGate` (existing); `ModelForm` link targets.
- Produces: `ModelList()`, default-exported `AdminModelCatalogPage`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "ModelList": {
      "title": "Quản lý Model Catalog",
      "newButton": "Thêm người mẫu",
      "columnName": "Tên",
      "columnUndertone": "Undertone",
      "editButton": "Sửa",
      "deleteButton": "Xóa",
      "deleteConfirm": "Xóa người mẫu này?",
      "emptyState": "Chưa có người mẫu nào.",
      "loading": "Đang tải..."
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/admin/ModelList.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ModelList from './ModelList'
import type { CatalogModel } from '@/lib/modelCatalog'

const MODELS: CatalogModel[] = [
  {
    id: 1,
    name: 'Model A',
    image: '/outfit/models/a.jpg',
    dossierImage: '/outfit/models/a.jpg',
    poseCount: 15,
    tagline: 'Tagline A',
    undertone: 'warm',
    height: '1m70',
    bodyShape: 'Chữ nhật',
    waist: '70cm',
    personalColor: 'Warm Spring',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('ModelList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders models with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MODELS }))
    renderWithIntl(<ModelList />)

    await waitFor(() => expect(screen.getByText('Model A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/model-catalog/1/edit')
  })

  it('deletes a model when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => MODELS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<ModelList />)

    await waitFor(() => expect(screen.getByText('Model A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Model A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/model-catalog/1', { method: 'DELETE' })
  })

  it('shows an empty state when there are no models', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ModelList />)
    await waitFor(() => expect(screen.getByText('Chưa có người mẫu nào.')).toBeInTheDocument())
  })
})
```

Create `frontend/app/admin/model-catalog/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminModelCatalogPage from './page'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('AdminModelCatalogPage', () => {
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

  it('renders the heading and a link to create a new model, for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminModelCatalogPage />
      </AuthProvider>
    )
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Quản lý Model Catalog' })).toBeInTheDocument()
    )
    expect(screen.getByRole('link', { name: 'Thêm người mẫu' })).toHaveAttribute('href', '/admin/model-catalog/new')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/admin/ModelList.test.tsx app/admin/model-catalog/page.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `ModelList.tsx`**

Create `frontend/components/admin/ModelList.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { CatalogModel } from '@/lib/modelCatalog'

export default function ModelList() {
  const t = useTranslations('Admin.ModelList')
  const [models, setModels] = useState<CatalogModel[] | null>(null)

  useEffect(() => {
    fetch('/api/model-catalog')
      .then((response) => response.json())
      .then(setModels)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/model-catalog/${id}`, { method: 'DELETE' })
    setModels((current) => current?.filter((model) => model.id !== id) ?? null)
  }

  if (models === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (models.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnName')}</th>
          <th className="py-2">{t('columnUndertone')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {models.map((model) => (
          <tr key={model.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{model.name}</td>
            <td className="py-3 text-on-surface-variant">{model.undertone}</td>
            <td className="py-3 text-right">
              <Link
                href={`/admin/model-catalog/${model.id}/edit`}
                className="mr-4 font-semibold text-primary hover:underline"
              >
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(model.id)}
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

- [ ] **Step 5: Implement `app/admin/model-catalog/page.tsx`**

Create `frontend/app/admin/model-catalog/page.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AdminGate from '@/components/auth/AdminGate'
import ModelList from '@/components/admin/ModelList'

export default function AdminModelCatalogPage() {
  const t = useTranslations('Admin.ModelList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <Link
              href="/admin/model-catalog/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('newButton')}
            </Link>
          </div>
          <ModelList />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/admin/ModelList.test.tsx app/admin/model-catalog/page.test.tsx`
Expected: PASS (3 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/admin/ModelList.tsx components/admin/ModelList.test.tsx app/admin/model-catalog/page.tsx app/admin/model-catalog/page.test.tsx messages/vi.json
git commit -m "feat: add model catalog admin list page"
```

---

## Task 11: `/admin/model-catalog/new` and `/admin/model-catalog/[id]/edit` pages

**Files:**
- Create: `frontend/app/admin/model-catalog/new/page.tsx`
- Create: `frontend/app/admin/model-catalog/new/page.test.tsx`
- Create: `frontend/app/admin/model-catalog/[id]/edit/page.tsx`
- Create: `frontend/app/admin/model-catalog/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `ModelForm` from Task 9; `AdminGate`; `GET /api/model-catalog/[id]` from Task 4.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/admin/model-catalog/new/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewModelPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewModelPage', () => {
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
        <NewModelPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Tạo người mẫu' })).toBeInTheDocument()
  })
})
```

Create `frontend/app/admin/model-catalog/[id]/edit/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditModelPage from './page'
import type { CatalogModel } from '@/lib/modelCatalog'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MODEL: CatalogModel = {
  id: 3,
  name: 'Model cần sửa',
  image: '/outfit/models/x.jpg',
  dossierImage: '/outfit/models/x.jpg',
  poseCount: 15,
  tagline: 'Tagline',
  undertone: 'neutral',
  height: '1m65',
  bodyShape: 'Đồng hồ cát',
  waist: '64cm',
  personalColor: 'Autumn Soft',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditModelPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MODEL }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the model by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditModelPage params={Promise.resolve({ id: '3' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Tên người mẫu')).toHaveValue('Model cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/api/model-catalog/3')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/admin/model-catalog/new/page.test.tsx "app/admin/model-catalog/\[id\]/edit/page.test.tsx"`
Expected: FAIL — neither page exists yet.

- [ ] **Step 3: Implement `app/admin/model-catalog/new/page.tsx`**

```tsx
'use client'

import AdminGate from '@/components/auth/AdminGate'
import ModelForm from '@/components/admin/ModelForm'

export default function NewModelPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <ModelForm />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 4: Implement `app/admin/model-catalog/[id]/edit/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import ModelForm from '@/components/admin/ModelForm'
import type { CatalogModel } from '@/lib/modelCatalog'

export default function EditModelPage({ params }: { params: Promise<{ id: string }> }) {
  const [model, setModel] = useState<CatalogModel | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/model-catalog/${id}`)
        .then((response) => response.json())
        .then(setModel)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {model && <ModelForm initialModel={model} />}
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/admin/model-catalog/new/page.test.tsx "app/admin/model-catalog/\[id\]/edit/page.test.tsx"`
Expected: PASS (1 + 1 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add "app/admin/model-catalog/new" "app/admin/model-catalog/[id]"
git commit -m "feat: add model catalog create/edit admin pages"
```

---

## Task 12: `AdminDashboard` links to Model Catalog management

**Files:**
- Modify: `frontend/components/auth/AdminDashboard.tsx`
- Modify: `frontend/components/auth/AdminDashboard.test.tsx`
- Modify: `frontend/messages/vi.json` (`Admin` namespace)

- [ ] **Step 1: Update messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add (alongside `faqCardTitle`/etc. from the
FAQ CMS plan):
```json
    "modelCardTitle": "Quản lý Model Catalog",
    "modelCardDescription": "Tạo, sửa và xóa người mẫu hiển thị trong bước chọn người mẫu thử đồ ảo."
```

- [ ] **Step 2: Write the failing test**

In `frontend/components/auth/AdminDashboard.test.tsx`, extend the existing test with one more
assertion:
```tsx
    expect(screen.getByRole('link', { name: /Quản lý Model Catalog/ })).toHaveAttribute('href', '/admin/model-catalog')
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: FAIL — no Model Catalog link exists yet.

- [ ] **Step 4: Update `AdminDashboard.tsx`**

Add a fourth `<Link>` card after the FAQ card:
```tsx
          <Link
            href="/admin/model-catalog"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('modelCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('modelCardDescription')}</p>
          </Link>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/AdminDashboard.tsx components/auth/AdminDashboard.test.tsx messages/vi.json
git commit -m "feat: link the admin dashboard to model catalog management"
```

---

## Task 13: Full verification

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

1. Visit `/outfit/step-1` → `/outfit/step-2` — confirm Carmen (the first DB model) is
   pre-selected, the undertone filter works, clicking a card updates the dossier panel on the
   right, and the "tải ảnh của tôi" upload flow still works.
2. Log in as `admin@twistfit.vn` / `admin1234`, go to `/admin` → `/admin/model-catalog`:
   create a model, verify it appears in `/outfit/step-2`'s grid; edit it; delete it.
3. Edit Carmen's `name` field via `/admin/model-catalog`, then revisit `/outfit/step-2` fresh
   (new tab) and confirm the pre-selected model's name updated too (proves the default now
   comes from the DB, not a hardcoded constant).
4. Check the browser console for errors on `/outfit/step-2` and `/admin/model-catalog` — in
   particular confirm there is **no** `Module not found: Can't resolve 'fs'` error.

- [ ] **Step 5: Commit** (only if Step 4 required fixes; otherwise skip)

```bash
cd frontend && git add -A
git commit -m "fix: address issues found in model catalog CMS manual verification"
```
