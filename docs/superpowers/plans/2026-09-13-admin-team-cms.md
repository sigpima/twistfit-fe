# Admin: Quản lý Team Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the team member cards on the About page from a hardcoded array into the
SQLite data layer, with admin CRUD under `/admin/team`, and `/about` reading from the DB.
This is the fourth and final plan of the "content CMS expansion" sub-project (after Blog/Quiz,
FAQ, Model Catalog, and Capsule Wardrobe) — its last task also updates
`docs/admin-dashboard-roadmap.md` to mark the whole content-CMS line item complete.

**Architecture:** New module `frontend/lib/team.ts` follows the exact schema/CRUD/seed
pattern already used throughout this expansion, wired into `lib/getDb.ts`. The two hardcoded
Tailwind color strings per member (`badgeColor`, `roleColor`) become two independent
`badgeVariant`/`roleVariant` enum fields (`primary`/`secondary`/`tertiary`), resolved to real
classes via a small code-side lookup — same pattern as Capsule Wardrobe's `tagVariant`. Unlike
the Model Catalog and Capsule Wardrobe pages, `app/about/page.tsx` is **already** a Server
Component and `TeamGrid` needs no Client/Server split — this is the simplest of the four CMS
plans.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, Vitest + Testing Library,
next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-admin-content-cms-expansion-design.md`

## Global Constraints

- All `lib/team.ts` query functions take `db: Database.Database` as an explicit parameter
  (never a module-level singleton).
- `lib/team.ts` imports `better-sqlite3` **only as a type** — never as a value. Only
  `lib/getDb.ts` may `new Database(...)`.
- Route `params` are `Promise`s — `await params` in Route Handlers; resolve with
  `params.then(...)` inside `useEffect` in Client Component pages (never React's `use()`).
- No file upload: `image` is a plain URL string.
- The write API routes (`POST`/`PUT`/`DELETE` under `/api/team`) must reject requests without
  a valid signed admin session cookie (401).
- Reuse existing input/label/button Tailwind classes from `BlogPostForm.tsx`.
- All new UI text goes through `next-intl`, namespace `Admin.TeamForm` / `Admin.TeamList`.
- Every new component/module gets a co-located `.test.ts`/`.test.tsx` file, written and run
  red before implementation (TDD).
- No sort order needed — 3 members display in creation order.

---

## Task 1: Data layer — Team schema, CRUD, seed

**Files:**
- Create: `frontend/lib/team.ts`
- Test: `frontend/lib/team.test.ts`

**Interfaces:**
- Produces: `ColorVariant` (`'primary' | 'secondary' | 'tertiary'`), `COLOR_VARIANTS:
  ColorVariant[]`, `TeamMember`, `TeamMemberInput`, `initSchema(db)`, `getTeamMembers(db)`,
  `getTeamMemberById(db, id)`, `createTeamMember(db, input)`, `updateTeamMember(db, id,
  input)`, `deleteTeamMember(db, id)`, `seedIfEmpty(db)`. Consumed by Task 2 (`getDb.ts`
  wiring) and all later tasks.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/team.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createTeamMember,
  getTeamMembers,
  getTeamMemberById,
  updateTeamMember,
  deleteTeamMember,
  seedIfEmpty,
  type TeamMemberInput,
} from './team'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleMember: TeamMemberInput = {
  image: '/about/team-test.jpg',
  name: 'Nguyễn Văn Test',
  role: 'Test Role',
  bio: 'Tiểu sử test.',
  badgeVariant: 'secondary',
  roleVariant: 'secondary',
  footerIcon: 'verified',
  footerLabel: 'Footer label test',
}

describe('Team CRUD', () => {
  it('creates and reads back a member', () => {
    const created = createTeamMember(db, sampleMember)
    expect(created.id).toBeGreaterThan(0)
    expect(created.name).toBe('Nguyễn Văn Test')
    expect(created.badgeVariant).toBe('secondary')
  })

  it('lists members in creation order', () => {
    createTeamMember(db, { ...sampleMember, name: 'Member 1' })
    createTeamMember(db, { ...sampleMember, name: 'Member 2' })
    expect(getTeamMembers(db).map((m) => m.name)).toEqual(['Member 1', 'Member 2'])
  })

  it('updates a member', () => {
    const created = createTeamMember(db, sampleMember)
    const updated = updateTeamMember(db, created.id, { ...sampleMember, name: 'Tên đã sửa' })
    expect(updated?.name).toBe('Tên đã sửa')
    expect(updateTeamMember(db, 999999, sampleMember)).toBeNull()
  })

  it('deletes a member', () => {
    const created = createTeamMember(db, sampleMember)
    expect(deleteTeamMember(db, created.id)).toBe(true)
    expect(getTeamMemberById(db, created.id)).toBeNull()
    expect(deleteTeamMember(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 3 team members into an empty database', () => {
    seedIfEmpty(db)
    expect(getTeamMembers(db)).toHaveLength(3)
  })

  it('does nothing if team_members already has rows', () => {
    createTeamMember(db, sampleMember)
    seedIfEmpty(db)
    expect(getTeamMembers(db)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/team.test.ts`
Expected: FAIL — `./team` module does not exist yet.

- [ ] **Step 3: Implement `lib/team.ts`**

Create `frontend/lib/team.ts`:
```ts
import type Database from 'better-sqlite3'

export type ColorVariant = 'primary' | 'secondary' | 'tertiary'
export const COLOR_VARIANTS: ColorVariant[] = ['primary', 'secondary', 'tertiary']

export type TeamMember = {
  id: number
  image: string
  name: string
  role: string
  bio: string
  badgeVariant: ColorVariant
  roleVariant: ColorVariant
  footerIcon: string
  footerLabel: string
  createdAt: string
  updatedAt: string
}

export type TeamMemberInput = {
  image: string
  name: string
  role: string
  bio: string
  badgeVariant: ColorVariant
  roleVariant: ColorVariant
  footerIcon: string
  footerLabel: string
}

type TeamMemberRow = {
  id: number
  image: string
  name: string
  role: string
  bio: string
  badge_variant: string
  role_variant: string
  footer_icon: string
  footer_label: string
  created_at: string
  updated_at: string
}

function rowToTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    image: row.image,
    name: row.name,
    role: row.role,
    bio: row.bio,
    badgeVariant: row.badge_variant as ColorVariant,
    roleVariant: row.role_variant as ColorVariant,
    footerIcon: row.footer_icon,
    footerLabel: row.footer_label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT NOT NULL,
      badge_variant TEXT NOT NULL,
      role_variant TEXT NOT NULL,
      footer_icon TEXT NOT NULL,
      footer_label TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getTeamMembers(db: Database.Database): TeamMember[] {
  const rows = db.prepare('SELECT * FROM team_members ORDER BY id ASC').all() as TeamMemberRow[]
  return rows.map(rowToTeamMember)
}

export function getTeamMemberById(db: Database.Database, id: number): TeamMember | null {
  const row = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id) as TeamMemberRow | undefined
  return row ? rowToTeamMember(row) : null
}

export function createTeamMember(db: Database.Database, input: TeamMemberInput): TeamMember {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO team_members
        (image, name, role, bio, badge_variant, role_variant, footer_icon, footer_label, created_at, updated_at)
       VALUES (@image, @name, @role, @bio, @badgeVariant, @roleVariant, @footerIcon, @footerLabel, @createdAt, @updatedAt)`
    )
    .run({ ...input, createdAt: now, updatedAt: now })
  const created = getTeamMemberById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created team member')
  }
  return created
}

export function updateTeamMember(
  db: Database.Database,
  id: number,
  input: TeamMemberInput
): TeamMember | null {
  const existing = getTeamMemberById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE team_members SET
      image = @image, name = @name, role = @role, bio = @bio,
      badge_variant = @badgeVariant, role_variant = @roleVariant,
      footer_icon = @footerIcon, footer_label = @footerLabel, updated_at = @updatedAt
     WHERE id = @id`
  ).run({ ...input, id, updatedAt: now })
  return getTeamMemberById(db, id)
}

export function deleteTeamMember(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM team_members WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_TEAM_MEMBERS: TeamMemberInput[] = [
  {
    image: '/about/team-mai-anh.jpg',
    name: 'Trần Mai Anh',
    role: 'Head of Color Science & Consulting',
    bio: 'Chứng chỉ Chuyên gia Màu sắc Quốc tế (IIC). 8+ năm kinh nghiệm tư vấn định vị hình ảnh cá nhân cho các người mẫu, KOL và doanh nhân hàng đầu.',
    badgeVariant: 'secondary',
    roleVariant: 'secondary',
    footerIcon: 'verified',
    footerLabel: 'Korea Image Industry Association',
  },
  {
    image: '/about/team-quang-huy.jpg',
    name: 'Dr. Lê Quang Huy',
    role: 'Chief Technology Officer (CTO)',
    bio: 'Tiến sĩ Khoa học Máy tính tại NTU Singapore, chuyên sâu về Deep Learning và Thị giác Máy tính ứng dụng trong phân tích sắc ký ảnh kỹ thuật số.',
    badgeVariant: 'primary',
    roleVariant: 'primary',
    footerIcon: 'memory',
    footerLabel: '5+ Sáng chế thị giác màu quang phổ',
  },
  {
    image: '/about/team-khanh-linh.jpg',
    name: 'Nguyễn Khánh Linh',
    role: 'Creative Director & Master Stylist',
    bio: 'Tốt nghiệp Học viện Thời trang London (LCA). Cựu biên tập viên phong cách cho các tạp chí phong cách sống hàng đầu, đam mê tái cấu trúc tủ đồ thông minh.',
    badgeVariant: 'tertiary',
    roleVariant: 'tertiary',
    footerIcon: 'auto_fix_high',
    footerLabel: 'Stylist của 100+ Fashion Lookbooks',
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM team_members').get() as { count: number }
  if (count > 0) return
  SEED_TEAM_MEMBERS.forEach((member) => createTeamMember(db, member))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/team.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/team.ts lib/team.test.ts
git commit -m "feat: add team data layer with CRUD and seed"
```

---

## Task 2: Wire Team schema into the shared `getDb()` singleton

**Files:**
- Modify: `frontend/lib/getDb.ts`

- [ ] **Step 1: Modify `lib/getDb.ts`**

Add the import:
```ts
import { initSchema as initTeamSchema, seedIfEmpty as seedTeamIfEmpty } from './team'
```
Inside `getDb()`, after the Capsule Wardrobe init/seed calls, add:
```ts
  initTeamSchema(db)
  seedTeamIfEmpty(db)
```

- [ ] **Step 2: Verify the whole project still compiles and tests still pass**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every existing test still passes.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/getDb.ts
git commit -m "feat: initialize and seed the team table when opening the database"
```

---

## Task 3: Team API — validation + collection route

**Files:**
- Create: `frontend/app/api/team/validate.ts`
- Create: `frontend/app/api/team/validate.test.ts`
- Create: `frontend/app/api/team/route.ts`
- Create: `frontend/app/api/team/route.test.ts`

**Interfaces:**
- Consumes: `COLOR_VARIANTS`, `ColorVariant`, `TeamMemberInput`, `getTeamMembers`,
  `createTeamMember` from `lib/team.ts`; `getDb`; `getAdminSessionFromCookieHeader`.
- Produces: `validateTeamMemberBody(body: unknown): { errors: Record<string, string> } |
  { data: TeamMemberInput }`; `GET`/`POST` handlers.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/team/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateTeamMemberBody } from './validate'

const validBody = {
  image: '/about/team-test.jpg',
  name: 'Nguyễn Văn Test',
  role: 'Test Role',
  bio: 'Tiểu sử test.',
  badgeVariant: 'primary',
  roleVariant: 'primary',
  footerIcon: 'verified',
  footerLabel: 'Footer label test',
}

describe('validateTeamMemberBody', () => {
  it('accepts a valid body', () => {
    const result = validateTeamMemberBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = validateTeamMemberBody({ ...validBody, name: '' })
    expect('errors' in result && result.errors.name).toBeDefined()
  })

  it('rejects an empty bio', () => {
    const result = validateTeamMemberBody({ ...validBody, bio: '' })
    expect('errors' in result && result.errors.bio).toBeDefined()
  })

  it('rejects an invalid badge variant', () => {
    const result = validateTeamMemberBody({ ...validBody, badgeVariant: 'not-a-variant' })
    expect('errors' in result && result.errors.badgeVariant).toBeDefined()
  })

  it('rejects an invalid role variant', () => {
    const result = validateTeamMemberBody({ ...validBody, roleVariant: 'not-a-variant' })
    expect('errors' in result && result.errors.roleVariant).toBeDefined()
  })
})
```

Create `frontend/app/api/team/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/team')>('@/lib/team')
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
  image: '/about/team-test.jpg',
  name: 'Nguyễn Văn Test',
  role: 'Test Role',
  bio: 'Tiểu sử test.',
  badgeVariant: 'primary',
  roleVariant: 'primary',
  footerIcon: 'verified',
  footerLabel: 'Footer label test',
}

beforeEach(() => {
  getDb().exec('DELETE FROM team_members')
})

describe('GET /api/team', () => {
  it('returns an empty list when there are no members', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/team', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/team', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a member and returns 201', async () => {
    const request = new Request('http://localhost/api/team', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect((await response.json()).name).toBe('Nguyễn Văn Test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/team', {
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

Run: `cd frontend && npx vitest run app/api/team/validate.test.ts app/api/team/route.test.ts`
Expected: FAIL — neither `validate.ts` nor `route.ts` exist yet.

- [ ] **Step 3: Implement `validate.ts`**

Create `frontend/app/api/team/validate.ts`:
```ts
import { COLOR_VARIANTS, type ColorVariant, type TeamMemberInput } from '@/lib/team'

type RawTeamBody = {
  image?: unknown
  name?: unknown
  role?: unknown
  bio?: unknown
  badgeVariant?: unknown
  roleVariant?: unknown
  footerIcon?: unknown
  footerLabel?: unknown
}

function requiredString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateTeamMemberBody(
  body: unknown
): { errors: Record<string, string> } | { data: TeamMemberInput } {
  const raw = (body ?? {}) as RawTeamBody
  const errors: Record<string, string> = {}

  const image = requiredString(raw.image)
  if (!image) errors.image = 'Ảnh không được để trống'

  const name = requiredString(raw.name)
  if (!name) errors.name = 'Tên không được để trống'

  const role = requiredString(raw.role)
  if (!role) errors.role = 'Vai trò không được để trống'

  const bio = requiredString(raw.bio)
  if (!bio) errors.bio = 'Tiểu sử không được để trống'

  const badgeVariant = raw.badgeVariant as ColorVariant
  if (!COLOR_VARIANTS.includes(badgeVariant)) errors.badgeVariant = 'Màu badge không hợp lệ'

  const roleVariant = raw.roleVariant as ColorVariant
  if (!COLOR_VARIANTS.includes(roleVariant)) errors.roleVariant = 'Màu vai trò không hợp lệ'

  const footerIcon = requiredString(raw.footerIcon)
  if (!footerIcon) errors.footerIcon = 'Icon không được để trống'

  const footerLabel = requiredString(raw.footerLabel)
  if (!footerLabel) errors.footerLabel = 'Nhãn cuối không được để trống'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { image, name, role, bio, badgeVariant, roleVariant, footerIcon, footerLabel } }
}
```

- [ ] **Step 4: Implement `route.ts`**

Create `frontend/app/api/team/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getTeamMembers, createTeamMember } from '@/lib/team'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateTeamMemberBody } from './validate'

export async function GET() {
  const db = getDb()
  return NextResponse.json(getTeamMembers(db))
}

export async function POST(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateTeamMemberBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createTeamMember(db, result.data)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/team/validate.test.ts app/api/team/route.test.ts`
Expected: PASS (5 + 3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add app/api/team/validate.ts app/api/team/validate.test.ts app/api/team/route.ts app/api/team/route.test.ts
git commit -m "feat: add team collection API route with validation"
```

---

## Task 4: Team API — single-member route

**Files:**
- Create: `frontend/app/api/team/[id]/route.ts`
- Create: `frontend/app/api/team/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getTeamMemberById`, `updateTeamMember`, `deleteTeamMember` from `lib/team.ts`;
  `getDb`; `validateTeamMemberBody` from Task 3; `getAdminSessionFromCookieHeader`.
- Produces: `GET`/`PUT`/`DELETE` handlers, consumed by Task 10 (edit page) and Task 8
  (`TeamForm`'s PUT call).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/team/[id]/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { createTeamMember } from '@/lib/team'
import { GET, PUT, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/team')>('@/lib/team')
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
  image: '/about/team-test.jpg',
  name: 'Nguyễn Văn Test',
  role: 'Test Role',
  bio: 'Tiểu sử test.',
  badgeVariant: 'primary',
  roleVariant: 'primary',
  footerIcon: 'verified',
  footerLabel: 'Footer label test',
}

beforeEach(() => {
  getDb().exec('DELETE FROM team_members')
})

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/team/[id]', () => {
  it('returns the member when it exists', async () => {
    const created = createTeamMember(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Nguyễn Văn Test')
  })

  it('returns 404 when the member does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/team/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createTeamMember(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the member', async () => {
    const created = createTeamMember(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, name: 'Tên đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Tên đã sửa')
  })

  it('returns 404 when updating a member that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/team/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createTeamMember(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the member', async () => {
    const created = createTeamMember(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM team_members WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/team/\[id\]/route.test.ts"`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `frontend/app/api/team/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getTeamMemberById, updateTeamMember, deleteTeamMember } from '@/lib/team'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateTeamMemberBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const member = getTeamMemberById(getDb(), Number(id))
  if (!member) {
    return NextResponse.json({ error: 'Không tìm thấy thành viên' }, { status: 404 })
  }
  return NextResponse.json(member)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = validateTeamMemberBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateTeamMember(getDb(), Number(id), result.data)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy thành viên' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteTeamMember(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy thành viên' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/team/\[id\]/route.test.ts"`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/team/[id]/route.ts" "app/api/team/[id]/route.test.ts"
git commit -m "feat: add single team member API route"
```

---

## Task 5: Color variant → Tailwind class presentation lookup

**Files:**
- Create: `frontend/components/about/teamColorPresentation.ts`
- Test: `frontend/components/about/teamColorPresentation.test.ts`

**Interfaces:**
- Consumes: `ColorVariant`, `COLOR_VARIANTS` from `lib/team.ts`.
- Produces: `COLOR_VARIANT_CLASSES: Record<ColorVariant, string>`. Consumed by Task 6
  (`TeamGrid`).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/about/teamColorPresentation.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { COLOR_VARIANTS } from '@/lib/team'
import { COLOR_VARIANT_CLASSES } from './teamColorPresentation'

describe('COLOR_VARIANT_CLASSES', () => {
  it('has a class string for every color variant', () => {
    for (const variant of COLOR_VARIANTS) {
      expect(COLOR_VARIANT_CLASSES[variant]).toMatch(/^text-/)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/about/teamColorPresentation.test.ts`
Expected: FAIL — module does not exist yet.

- [ ] **Step 3: Implement `teamColorPresentation.ts`**

```ts
import type { ColorVariant } from '@/lib/team'

export const COLOR_VARIANT_CLASSES: Record<ColorVariant, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/about/teamColorPresentation.test.ts`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/about/teamColorPresentation.ts components/about/teamColorPresentation.test.ts
git commit -m "feat: add team color variant presentation lookup"
```

---

## Task 6: `TeamGrid` reads members from a prop instead of the hardcoded file

**Files:**
- Modify: `frontend/components/about/TeamGrid.tsx`
- Modify: `frontend/components/about/TeamGrid.test.tsx`

**Interfaces:**
- Consumes: `TeamMember` from `lib/team.ts`; `COLOR_VARIANT_CLASSES` from Task 5.
- Produces: `TeamGrid({ members: TeamMember[] })` — consumed by Task 7 (`app/about/page.tsx`).

- [ ] **Step 1: Write the failing test**

Replace `frontend/components/about/TeamGrid.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TeamGrid from './TeamGrid'
import type { TeamMember } from '@/lib/team'

const MEMBERS: TeamMember[] = [
  {
    id: 1,
    image: '/about/team-a.jpg',
    name: 'Thành viên A',
    role: 'Vai trò A',
    bio: 'Tiểu sử A',
    badgeVariant: 'primary',
    roleVariant: 'primary',
    footerIcon: 'verified',
    footerLabel: 'Footer A',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 2,
    image: '/about/team-b.jpg',
    name: 'Thành viên B',
    role: 'Vai trò B',
    bio: 'Tiểu sử B',
    badgeVariant: 'secondary',
    roleVariant: 'secondary',
    footerIcon: 'memory',
    footerLabel: 'Footer B',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('TeamGrid', () => {
  it('renders every member passed in', () => {
    renderWithIntl(<TeamGrid members={MEMBERS} />)
    expect(screen.getByText('Thành viên A')).toBeInTheDocument()
    expect(screen.getByText('Thành viên B')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/about/TeamGrid.test.tsx`
Expected: FAIL — component still reads the hardcoded `TEAM`, no `members` prop.

- [ ] **Step 3: Rewrite `TeamGrid.tsx`**

Replace `frontend/components/about/TeamGrid.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import type { TeamMember } from '@/lib/team'
import { COLOR_VARIANT_CLASSES } from './teamColorPresentation'

export default function TeamGrid({ members }: { members: TeamMember[] }) {
  const t = useTranslations('About.TeamGrid')

  return (
    <section className="w-full px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-space-xl max-w-2xl text-center">
          <div className="mb-space-sm inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed/50 px-space-md py-space-xs">
            <span className="text-label-sm font-semibold uppercase tracking-wider text-on-secondary-fixed">
              {t('kicker')}
            </span>
          </div>
          <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
          <p className="mt-space-xs text-body-md text-on-surface-variant">{t('subheading')}</p>
        </div>
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                <div className="absolute right-space-sm top-space-sm rounded-full bg-surface-container-lowest/80 px-space-sm py-space-xs shadow-sm backdrop-blur-md">
                  <span className={`text-label-sm font-semibold ${COLOR_VARIANT_CLASSES[member.badgeVariant]}`}>
                    {member.role.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-space-lg">
                <div>
                  <h3 className="text-headline-sm font-semibold text-on-surface">{member.name}</h3>
                  <p className={`mt-space-xs text-label-md font-medium ${COLOR_VARIANT_CLASSES[member.roleVariant]}`}>
                    {member.role}
                  </p>
                  <p className="mt-space-sm text-body-sm leading-relaxed text-on-surface-variant">
                    {member.bio}
                  </p>
                </div>
                <div className="mt-space-md flex items-center gap-space-sm pt-space-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    {member.footerIcon}
                  </span>
                  <span className="text-label-sm">{member.footerLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

Note: the old hardcoded data had a separate short `badge` string (e.g. `'Color Specialist'`)
distinct from the full `role` (e.g. `'Head of Color Science & Consulting'`). The new schema
(per the approved spec) has no separate badge-text field — only `role`. Rather than add back
a field the spec didn't include, the badge now shows the first two words of `role`, which for
all 3 seeded members reads sensibly (e.g. "Head of" is not ideal, so the seed data's `role`
strings in Task 1 were not changed, meaning this heuristic **will** look slightly worse than
the original hand-picked badges for member 1 specifically). If this bothers a reviewer, treat
it as reasonable to swap for showing the full `role` string in both places instead of a
truncated badge — the plan takes the "first two words" approach because it's the plan
author's best guess at preserving the original card layout's compactness, not because the
spec mandated it (the spec is silent on this specific rendering detail).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/about/TeamGrid.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/about/TeamGrid.tsx components/about/TeamGrid.test.tsx
git commit -m "feat: make TeamGrid render members passed in as a prop"
```

---

## Task 7: `app/about/page.tsx` reads team members from the database

**Files:**
- Modify: `frontend/app/about/page.tsx`
- Create: `frontend/app/about/page.test.tsx`

**Interfaces:**
- Consumes: `getDb` from `lib/getDb.ts`; `getTeamMembers` from `lib/team.ts`; `TeamGrid`
  (Task 6).

`app/about/page.tsx` is already a plain (non-`async`, non-`'use client'`) Server Component
today — no split needed, unlike the Outfit step pages.

- [ ] **Step 1: Write the failing test**

Create `frontend/app/about/page.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { TeamMember } from '@/lib/team'

const MEMBERS: TeamMember[] = [
  {
    id: 1,
    image: '/about/team-seed.jpg',
    name: 'Thành viên seed test',
    role: 'Vai trò seed test',
    bio: 'Tiểu sử seed test',
    badgeVariant: 'primary',
    roleVariant: 'primary',
    footerIcon: 'verified',
    footerLabel: 'Footer seed test',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

vi.mock('@/lib/getDb', () => ({ getDb: () => ({}) }))
vi.mock('@/lib/team', async () => {
  const actual = await vi.importActual<typeof import('@/lib/team')>('@/lib/team')
  return { ...actual, getTeamMembers: () => MEMBERS }
})

describe('AboutPage', async () => {
  const { default: AboutPage } = await import('./page')

  it('renders the seeded team member', () => {
    renderWithIntl(<AboutPage />)
    expect(screen.getByText('Thành viên seed test')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/about/page.test.tsx`
Expected: FAIL — `AboutPage` still renders `<TeamGrid />` with no `members` prop.

- [ ] **Step 3: Update `app/about/page.tsx`**

```tsx
import AboutHero from '@/components/about/AboutHero'
import MissionVisionGrid from '@/components/about/MissionVisionGrid'
import StorySection from '@/components/about/StorySection'
import TeamGrid from '@/components/about/TeamGrid'
import AboutCtaBanner from '@/components/about/AboutCtaBanner'
import { getTeamMembers } from '@/lib/team'
import { getDb } from '@/lib/getDb'

export default function AboutPage() {
  const members = getTeamMembers(getDb())

  return (
    <main className="w-full bg-surface">
      <AboutHero />
      <MissionVisionGrid />
      <StorySection />
      <TeamGrid members={members} />
      <AboutCtaBanner />
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/about/page.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/about/page.tsx app/about/page.test.tsx
git commit -m "feat: read team members from the database on the about page"
```

---

## Task 8: `TeamForm` — shared create/edit admin form

**Files:**
- Create: `frontend/components/admin/TeamForm.tsx`
- Create: `frontend/components/admin/TeamForm.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.TeamForm` namespace)

**Interfaces:**
- Consumes: `COLOR_VARIANTS`, `ColorVariant`, `TeamMember` from `lib/team.ts`; `/api/team`,
  `/api/team/[id]` from Tasks 3-4.
- Produces: `TeamForm({ initialMember?: TeamMember })` — consumed by Task 10.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "TeamForm": {
      "fields": {
        "image": "Ảnh (URL)",
        "name": "Họ tên",
        "role": "Vai trò",
        "bio": "Tiểu sử",
        "badgeVariant": "Màu badge",
        "roleVariant": "Màu vai trò",
        "footerIcon": "Icon cuối thẻ",
        "footerLabel": "Nhãn cuối thẻ"
      },
      "colorVariants": {
        "primary": "Primary",
        "secondary": "Secondary",
        "tertiary": "Tertiary"
      },
      "submitCreate": "Tạo thành viên",
      "submitEdit": "Lưu thay đổi",
      "unauthorizedError": "Bạn cần đăng nhập với quyền quản trị.",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại."
    }
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/admin/TeamForm.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TeamForm from './TeamForm'
import type { TeamMember } from '@/lib/team'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_MEMBER: TeamMember = {
  id: 6,
  image: '/about/team-existing.jpg',
  name: 'Thành viên hiện có',
  role: 'Vai trò hiện có',
  bio: 'Tiểu sử hiện có',
  badgeVariant: 'tertiary',
  roleVariant: 'tertiary',
  footerIcon: 'verified',
  footerLabel: 'Footer hiện có',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('TeamForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('POSTs to /api/team when creating and redirects on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<TeamForm />)
    fireEvent.change(screen.getByLabelText('Họ tên'), { target: { value: 'Thành viên mới' } })
    fireEvent.change(screen.getByLabelText('Vai trò'), { target: { value: 'Vai trò mới' } })
    fireEvent.change(screen.getByLabelText('Tiểu sử'), { target: { value: 'Tiểu sử mới' } })
    fireEvent.change(screen.getByLabelText('Ảnh (URL)'), { target: { value: '/about/new.jpg' } })
    fireEvent.change(screen.getByLabelText('Icon cuối thẻ'), { target: { value: 'star' } })
    fireEvent.change(screen.getByLabelText('Nhãn cuối thẻ'), { target: { value: 'Nhãn mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo thành viên' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/team'))
    expect(fetch).toHaveBeenCalledWith('/api/team', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/team/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_MEMBER }))
    renderWithIntl(<TeamForm initialMember={EXISTING_MEMBER} />)
    expect(screen.getByLabelText('Họ tên')).toHaveValue('Thành viên hiện có')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/team'))
    expect(fetch).toHaveBeenCalledWith('/api/team/6', expect.objectContaining({ method: 'PUT' }))
  })

  it('shows field errors returned by the API instead of redirecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: { name: 'Tên không được để trống' } }),
      })
    )
    renderWithIntl(<TeamForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo thành viên' }))

    await waitFor(() => expect(screen.getByText('Tên không được để trống')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/TeamForm.test.tsx`
Expected: FAIL — `./TeamForm` module does not exist yet.

- [ ] **Step 4: Implement `TeamForm.tsx`**

Create `frontend/components/admin/TeamForm.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { COLOR_VARIANTS, type ColorVariant, type TeamMember } from '@/lib/team'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function TeamForm({ initialMember }: { initialMember?: TeamMember }) {
  const t = useTranslations('Admin.TeamForm')
  const router = useRouter()
  const isEditing = Boolean(initialMember)

  const [image, setImage] = useState(initialMember?.image ?? '')
  const [name, setName] = useState(initialMember?.name ?? '')
  const [role, setRole] = useState(initialMember?.role ?? '')
  const [bio, setBio] = useState(initialMember?.bio ?? '')
  const [badgeVariant, setBadgeVariant] = useState<ColorVariant>(initialMember?.badgeVariant ?? COLOR_VARIANTS[0])
  const [roleVariant, setRoleVariant] = useState<ColorVariant>(initialMember?.roleVariant ?? COLOR_VARIANTS[0])
  const [footerIcon, setFooterIcon] = useState(initialMember?.footerIcon ?? '')
  const [footerLabel, setFooterLabel] = useState(initialMember?.footerLabel ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = { image, name, role, bio, badgeVariant, roleVariant, footerIcon, footerLabel }

    const response = await fetch(isEditing ? `/api/team/${initialMember!.id}` : '/api/team', {
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

    router.push('/admin/team')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="team-name" className="text-label-md font-semibold text-on-surface">
          {t('fields.name')}
        </label>
        <input id="team-name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        {errors.name && <p className="text-label-sm text-error">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="team-role" className="text-label-md font-semibold text-on-surface">
            {t('fields.role')}
          </label>
          <input id="team-role" value={role} onChange={(event) => setRole(event.target.value)} className={inputClass} />
          {errors.role && <p className="text-label-sm text-error">{errors.role}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="team-image" className="text-label-md font-semibold text-on-surface">
            {t('fields.image')}
          </label>
          <input
            id="team-image"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            className={inputClass}
          />
          {errors.image && <p className="text-label-sm text-error">{errors.image}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="team-bio" className="text-label-md font-semibold text-on-surface">
          {t('fields.bio')}
        </label>
        <textarea id="team-bio" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} className={inputClass} />
        {errors.bio && <p className="text-label-sm text-error">{errors.bio}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="team-badge-variant" className="text-label-md font-semibold text-on-surface">
            {t('fields.badgeVariant')}
          </label>
          <select
            id="team-badge-variant"
            value={badgeVariant}
            onChange={(event) => setBadgeVariant(event.target.value as ColorVariant)}
            className={inputClass}
          >
            {COLOR_VARIANTS.map((variant) => (
              <option key={variant} value={variant}>
                {t(`colorVariants.${variant}`)}
              </option>
            ))}
          </select>
          {errors.badgeVariant && <p className="text-label-sm text-error">{errors.badgeVariant}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="team-role-variant" className="text-label-md font-semibold text-on-surface">
            {t('fields.roleVariant')}
          </label>
          <select
            id="team-role-variant"
            value={roleVariant}
            onChange={(event) => setRoleVariant(event.target.value as ColorVariant)}
            className={inputClass}
          >
            {COLOR_VARIANTS.map((variant) => (
              <option key={variant} value={variant}>
                {t(`colorVariants.${variant}`)}
              </option>
            ))}
          </select>
          {errors.roleVariant && <p className="text-label-sm text-error">{errors.roleVariant}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="team-footer-icon" className="text-label-md font-semibold text-on-surface">
            {t('fields.footerIcon')}
          </label>
          <input
            id="team-footer-icon"
            value={footerIcon}
            onChange={(event) => setFooterIcon(event.target.value)}
            className={inputClass}
          />
          {errors.footerIcon && <p className="text-label-sm text-error">{errors.footerIcon}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="team-footer-label" className="text-label-md font-semibold text-on-surface">
            {t('fields.footerLabel')}
          </label>
          <input
            id="team-footer-label"
            value={footerLabel}
            onChange={(event) => setFooterLabel(event.target.value)}
            className={inputClass}
          />
          {errors.footerLabel && <p className="text-label-sm text-error">{errors.footerLabel}</p>}
        </div>
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

Run: `cd frontend && npx vitest run components/admin/TeamForm.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/admin/TeamForm.tsx components/admin/TeamForm.test.tsx messages/vi.json
git commit -m "feat: add shared team create/edit admin form"
```

---

## Task 9: Team admin list — `TeamList` + `/admin/team` page

**Files:**
- Create: `frontend/components/admin/TeamList.tsx`
- Create: `frontend/components/admin/TeamList.test.tsx`
- Create: `frontend/app/admin/team/page.tsx`
- Create: `frontend/app/admin/team/page.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.TeamList` namespace)

**Interfaces:**
- Consumes: `TeamMember` from `lib/team.ts`; `GET`/`DELETE /api/team(/[id])` from Tasks 3-4;
  `AdminGate`; `TeamForm` link targets.
- Produces: `TeamList()`, default-exported `AdminTeamPage`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "TeamList": {
      "title": "Quản lý Team",
      "newButton": "Thêm thành viên",
      "columnName": "Họ tên",
      "columnRole": "Vai trò",
      "editButton": "Sửa",
      "deleteButton": "Xóa",
      "deleteConfirm": "Xóa thành viên này?",
      "emptyState": "Chưa có thành viên nào.",
      "loading": "Đang tải..."
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/admin/TeamList.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TeamList from './TeamList'
import type { TeamMember } from '@/lib/team'

const MEMBERS: TeamMember[] = [
  {
    id: 1,
    image: '/about/team-a.jpg',
    name: 'Thành viên A',
    role: 'Vai trò A',
    bio: 'Tiểu sử A',
    badgeVariant: 'primary',
    roleVariant: 'primary',
    footerIcon: 'verified',
    footerLabel: 'Footer A',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('TeamList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders members with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MEMBERS }))
    renderWithIntl(<TeamList />)

    await waitFor(() => expect(screen.getByText('Thành viên A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/team/1/edit')
  })

  it('deletes a member when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => MEMBERS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<TeamList />)

    await waitFor(() => expect(screen.getByText('Thành viên A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Thành viên A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/team/1', { method: 'DELETE' })
  })

  it('shows an empty state when there are no members', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<TeamList />)
    await waitFor(() => expect(screen.getByText('Chưa có thành viên nào.')).toBeInTheDocument())
  })
})
```

Create `frontend/app/admin/team/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminTeamPage from './page'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('AdminTeamPage', () => {
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

  it('renders the heading and a link to create a new member, for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminTeamPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Quản lý Team' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Thêm thành viên' })).toHaveAttribute('href', '/admin/team/new')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/admin/TeamList.test.tsx app/admin/team/page.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `TeamList.tsx`**

Create `frontend/components/admin/TeamList.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { TeamMember } from '@/lib/team'

export default function TeamList() {
  const t = useTranslations('Admin.TeamList')
  const [members, setMembers] = useState<TeamMember[] | null>(null)

  useEffect(() => {
    fetch('/api/team')
      .then((response) => response.json())
      .then(setMembers)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/team/${id}`, { method: 'DELETE' })
    setMembers((current) => current?.filter((member) => member.id !== id) ?? null)
  }

  if (members === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (members.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnName')}</th>
          <th className="py-2">{t('columnRole')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <tr key={member.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{member.name}</td>
            <td className="py-3 text-on-surface-variant">{member.role}</td>
            <td className="py-3 text-right">
              <Link href={`/admin/team/${member.id}/edit`} className="mr-4 font-semibold text-primary hover:underline">
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(member.id)}
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

- [ ] **Step 5: Implement `app/admin/team/page.tsx`**

Create `frontend/app/admin/team/page.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AdminGate from '@/components/auth/AdminGate'
import TeamList from '@/components/admin/TeamList'

export default function AdminTeamPage() {
  const t = useTranslations('Admin.TeamList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <Link
              href="/admin/team/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('newButton')}
            </Link>
          </div>
          <TeamList />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/admin/TeamList.test.tsx app/admin/team/page.test.tsx`
Expected: PASS (3 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/admin/TeamList.tsx components/admin/TeamList.test.tsx app/admin/team/page.tsx app/admin/team/page.test.tsx messages/vi.json
git commit -m "feat: add team admin list page"
```

---

## Task 10: `/admin/team/new` and `/admin/team/[id]/edit` pages

**Files:**
- Create: `frontend/app/admin/team/new/page.tsx`
- Create: `frontend/app/admin/team/new/page.test.tsx`
- Create: `frontend/app/admin/team/[id]/edit/page.tsx`
- Create: `frontend/app/admin/team/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `TeamForm` from Task 8; `AdminGate`; `GET /api/team/[id]` from Task 4.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/admin/team/new/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewTeamMemberPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewTeamMemberPage', () => {
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
        <NewTeamMemberPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Tạo thành viên' })).toBeInTheDocument()
  })
})
```

Create `frontend/app/admin/team/[id]/edit/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditTeamMemberPage from './page'
import type { TeamMember } from '@/lib/team'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MEMBER: TeamMember = {
  id: 2,
  image: '/about/team-x.jpg',
  name: 'Thành viên cần sửa',
  role: 'Vai trò X',
  bio: 'Tiểu sử X',
  badgeVariant: 'primary',
  roleVariant: 'primary',
  footerIcon: 'verified',
  footerLabel: 'Footer X',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditTeamMemberPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MEMBER }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the member by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditTeamMemberPage params={Promise.resolve({ id: '2' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Họ tên')).toHaveValue('Thành viên cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/api/team/2')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/admin/team/new/page.test.tsx "app/admin/team/\[id\]/edit/page.test.tsx"`
Expected: FAIL — neither page exists yet.

- [ ] **Step 3: Implement `app/admin/team/new/page.tsx`**

```tsx
'use client'

import AdminGate from '@/components/auth/AdminGate'
import TeamForm from '@/components/admin/TeamForm'

export default function NewTeamMemberPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <TeamForm />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 4: Implement `app/admin/team/[id]/edit/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import TeamForm from '@/components/admin/TeamForm'
import type { TeamMember } from '@/lib/team'

export default function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const [member, setMember] = useState<TeamMember | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/team/${id}`)
        .then((response) => response.json())
        .then(setMember)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {member && <TeamForm initialMember={member} />}
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/admin/team/new/page.test.tsx "app/admin/team/\[id\]/edit/page.test.tsx"`
Expected: PASS (1 + 1 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add "app/admin/team/new" "app/admin/team/[id]"
git commit -m "feat: add team create/edit admin pages"
```

---

## Task 11: `AdminDashboard` links to Team management

**Files:**
- Modify: `frontend/components/auth/AdminDashboard.tsx`
- Modify: `frontend/components/auth/AdminDashboard.test.tsx`
- Modify: `frontend/messages/vi.json` (`Admin` namespace)

- [ ] **Step 1: Update messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "teamCardTitle": "Quản lý Team",
    "teamCardDescription": "Tạo, sửa và xóa thành viên hiển thị trên trang Giới thiệu."
```

- [ ] **Step 2: Write the failing test**

Extend the existing test in `frontend/components/auth/AdminDashboard.test.tsx`:
```tsx
    expect(screen.getByRole('link', { name: /Quản lý Team/ })).toHaveAttribute('href', '/admin/team')
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: FAIL — no Team link exists yet.

- [ ] **Step 4: Update `AdminDashboard.tsx`**

Add a sixth `<Link>` card after the Capsule Wardrobe card:
```tsx
          <Link
            href="/admin/team"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('teamCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('teamCardDescription')}</p>
          </Link>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/AdminDashboard.tsx components/auth/AdminDashboard.test.tsx messages/vi.json
git commit -m "feat: link the admin dashboard to team management"
```

---

## Task 12: Full verification + roadmap doc update

- [ ] **Step 1: Run the full test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS — every test in the project (all four content-CMS plans plus everything
pre-existing).

- [ ] **Step 2: Lint**

Run: `cd frontend && npx eslint .`
Expected: no errors.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test in a real browser**

Start the dev server (`cd frontend && npm run dev`) and:

1. Visit `/about` — confirm all 3 team members render.
2. Log in as `admin@twistfit.vn` / `admin1234`, go to `/admin` — confirm all 6 cards (Blog,
   Quiz, FAQ, Model Catalog, Capsule Wardrobe, Team) are present and link correctly. Go to
   `/admin/team`: create a member, verify it appears on `/about`; edit it; delete it.
3. Check the browser console for errors on `/about` and `/admin/team` — in particular
   confirm there is **no** `Module not found: Can't resolve 'fs'` error.
4. As a final regression pass, spot-check `/blog`, `/faq`, `/outfit/step-2`, and
   `/outfit/step-4` still work (all four content types now share the same `getDb()`
   singleton and schema-init sequence in `lib/getDb.ts` — confirm one didn't break another).

- [ ] **Step 5: Update the roadmap doc**

In `docs/admin-dashboard-roadmap.md`, update the status table:
```markdown
| FAQ / Catalog người mẫu / Capsule wardrobe / Team | ✅ Hoàn thành |
```
(replacing the `Chưa bắt đầu` row for this item; leave the rest — Quản lý người dùng, Diễn
đàn, Dashboard thống kê / Hộp thư liên hệ — unchanged, they're separate sub-projects in the
roadmap not covered by this plan).

- [ ] **Step 6: Commit**

```bash
git add docs/admin-dashboard-roadmap.md
git commit -m "docs: mark FAQ/Model Catalog/Capsule Wardrobe/Team admin management as complete"
```
