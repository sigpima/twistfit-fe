# Hộp thư liên hệ (Subproject 1/2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage contact form actually persist submissions to SQLite, and give admins
a page to view, mark read/unread, and delete those messages. This is the first of two
subprojects under the remaining "Dashboard thống kê / Hộp thư liên hệ" roadmap line — the
second (Stats Dashboard) will surface an unread-message count from the table this plan creates,
so it must land first.

**Architecture:** New module `frontend/lib/contact.ts` follows the exact schema/CRUD pattern
used by every other domain module, wired into `lib/getDb.ts` after `forum.ts` (the current end
of the chain). `ContactSection.tsx` — currently a fully fake form with no `name` attributes on
its inputs and a `handleSubmit` that only flips local state — gains real `name` attributes and
an async `handleSubmit` that POSTs to a new public `/api/contact` endpoint, following the same
`form.elements.namedItem(...)` pattern already used by `LoginForm`/`RegisterForm`. The admin
side is one list component (`ContactMessageList`, in `components/admin/` alongside every other
admin CRUD component) with inline expand/collapse per message — no separate edit page, since
there is nothing to edit, only read/toggle-read/delete.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, Vitest + Testing Library,
next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-contact-inbox-design.md`

## Global Constraints

- `lib/contact.ts` query functions take `db: Database.Database` as an explicit parameter and
  import `better-sqlite3` **only as a type**.
- `POST /api/contact` requires **no session** — sending a contact message stays open to
  anonymous visitors, per the spec's explicit decision.
- `GET /api/contact`, `PATCH /api/contact/[id]`, `DELETE /api/contact/[id]` all require an admin
  session via `getAdminSessionFromCookieHeader`.
- No seed data for `contact_messages` — same reasoning as `forum_posts` in the Forum plans:
  content only makes sense once real visitors submit it. `seedIfEmpty` is still defined as a
  no-op so `lib/getDb.ts`'s init/seed call sequence stays uniform across every domain module.
- No email sending, no rate limiting, no search/filter/pagination on the message list — all
  explicitly out of scope per the spec's Non-goals.
- `subject` is the fixed enum already used by the existing `<select>` in `ContactSection.tsx`:
  `'color-test' | 'virtual-fitting' | 'stylist' | 'other'` — do not invent new values.
  `phone` is optional; an empty string from the form becomes `null` in storage.
  Route `params` are `Promise`s — `await params` in Route Handlers.
- All new UI text goes through `next-intl`: a new `errorMessage` key in the existing
  `Home.ContactSection` namespace, and a new `Admin.ContactList` namespace for the admin page.
- Every new module/component gets a co-located `.test.ts`/`.test.tsx` file, written and run red
  before implementation (TDD). `ContactSection.test.tsx` already exists and gets rewritten,
  since its one existing test asserts on the old fake `handleSubmit` behavior.
- This plan does **not** touch `docs/admin-dashboard-roadmap.md` — the roadmap's combined
  "Dashboard thống kê / Hộp thư liên hệ" line is marked done only once the Stats Dashboard
  subproject (2/2) also lands.

---

## Task 1: Data layer — `contact_messages` schema, CRUD, no-op seed

**Files:**
- Create: `frontend/lib/contact.ts`
- Test: `frontend/lib/contact.test.ts`

**Interfaces:**
- Produces: `ContactSubject`, `CONTACT_SUBJECTS: ContactSubject[]`, `ContactMessage`,
  `ContactMessageInput`, `initSchema(db)`, `getContactMessages(db)`, `getContactMessageById(db,
  id)`, `createContactMessage(db, input)`, `setContactMessageRead(db, id, isRead)`,
  `deleteContactMessage(db, id)`, `seedIfEmpty(db)`. Consumed by Task 2 (`getDb.ts` wiring) and
  every later task.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/contact.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  setContactMessageRead,
  deleteContactMessage,
  seedIfEmpty,
  type ContactMessageInput,
} from './contact'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleInput: ContactMessageInput = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  phone: null,
  subject: 'other',
  message: 'Nội dung test',
}

describe('createContactMessage', () => {
  it('creates a message with isRead false', () => {
    const created = createContactMessage(db, sampleInput)
    expect(created.id).toBeGreaterThan(0)
    expect(created.isRead).toBe(false)
    expect(created.name).toBe('Nguyễn Văn Test')
    expect(created.phone).toBeNull()
  })

  it('stores an optional phone when provided', () => {
    const created = createContactMessage(db, { ...sampleInput, phone: '0909123456' })
    expect(created.phone).toBe('0909123456')
  })
})

describe('getContactMessages', () => {
  it('lists messages newest first', () => {
    createContactMessage(db, { ...sampleInput, name: 'Tin 1' })
    createContactMessage(db, { ...sampleInput, name: 'Tin 2' })
    expect(getContactMessages(db).map((m) => m.name)).toEqual(['Tin 2', 'Tin 1'])
  })
})

describe('getContactMessageById', () => {
  it('reads back a message by id, or null if missing', () => {
    const created = createContactMessage(db, sampleInput)
    expect(getContactMessageById(db, created.id)?.email).toBe('test@twistfit.vn')
    expect(getContactMessageById(db, 999999)).toBeNull()
  })
})

describe('setContactMessageRead', () => {
  it('toggles the isRead flag', () => {
    const created = createContactMessage(db, sampleInput)
    const marked = setContactMessageRead(db, created.id, true)
    expect(marked?.isRead).toBe(true)
    const unmarked = setContactMessageRead(db, created.id, false)
    expect(unmarked?.isRead).toBe(false)
  })

  it('returns null for a message that does not exist', () => {
    expect(setContactMessageRead(db, 999999, true)).toBeNull()
  })
})

describe('deleteContactMessage', () => {
  it('deletes a message', () => {
    const created = createContactMessage(db, sampleInput)
    expect(deleteContactMessage(db, created.id)).toBe(true)
    expect(getContactMessageById(db, created.id)).toBeNull()
    expect(deleteContactMessage(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('does nothing — contact messages are never auto-seeded', () => {
    seedIfEmpty(db)
    expect(getContactMessages(db)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/contact.test.ts`
Expected: FAIL — `./contact` module does not exist yet.

- [ ] **Step 3: Implement `lib/contact.ts`**

Create `frontend/lib/contact.ts`:
```ts
import type Database from 'better-sqlite3'

export type ContactSubject = 'color-test' | 'virtual-fitting' | 'stylist' | 'other'

export const CONTACT_SUBJECTS: ContactSubject[] = ['color-test', 'virtual-fitting', 'stylist', 'other']

export type ContactMessage = {
  id: number
  name: string
  email: string
  phone: string | null
  subject: ContactSubject
  message: string
  isRead: boolean
  createdAt: string
}

export type ContactMessageInput = {
  name: string
  email: string
  phone: string | null
  subject: ContactSubject
  message: string
}

type ContactMessageRow = {
  id: number
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  is_read: number
  created_at: string
}

function rowToContactMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject as ContactSubject,
    message: row.message,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `)
}

export function getContactMessages(db: Database.Database): ContactMessage[] {
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all() as ContactMessageRow[]
  return rows.map(rowToContactMessage)
}

export function getContactMessageById(db: Database.Database, id: number): ContactMessage | null {
  const row = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id) as
    | ContactMessageRow
    | undefined
  return row ? rowToContactMessage(row) : null
}

export function createContactMessage(db: Database.Database, input: ContactMessageInput): ContactMessage {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO contact_messages (name, email, phone, subject, message, is_read, created_at)
       VALUES (@name, @email, @phone, @subject, @message, 0, @createdAt)`
    )
    .run({ ...input, createdAt: now })
  const created = getContactMessageById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created contact message')
  }
  return created
}

export function setContactMessageRead(
  db: Database.Database,
  id: number,
  isRead: boolean
): ContactMessage | null {
  const existing = getContactMessageById(db, id)
  if (!existing) return null
  db.prepare('UPDATE contact_messages SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, id)
  return getContactMessageById(db, id)
}

export function deleteContactMessage(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id)
  return result.changes > 0
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function seedIfEmpty(_db: Database.Database): void {
  // Deliberately a no-op: contact messages are real visitor submissions, never
  // seeded demo data. Kept as a function so lib/getDb.ts's init/seed call
  // sequence stays uniform across every domain module.
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/contact.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/contact.ts lib/contact.test.ts
git commit -m "feat: add contact messages data layer with CRUD"
```

---

## Task 2: Wire the `contact_messages` schema into the shared `getDb()` singleton

**Files:**
- Modify: `frontend/lib/getDb.ts`

**Interfaces:**
- Consumes: `initSchema`, `seedIfEmpty` from `lib/contact.ts` (Task 1).

- [ ] **Step 1: Modify `lib/getDb.ts`**

Add the import:
```ts
import { initSchema as initContactSchema, seedIfEmpty as seedContactIfEmpty } from './contact'
```
Inside `getDb()`, after the forum init/seed calls (the current end of the chain), add:
```ts
  initContactSchema(db)
  seedContactIfEmpty(db)
```

- [ ] **Step 2: Verify the whole project still compiles and tests still pass**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every existing test still passes.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/getDb.ts
git commit -m "feat: initialize the contact_messages table when opening the database"
```

---

## Task 3: Contact API — validation + collection route (public create + admin list)

**Files:**
- Create: `frontend/app/api/contact/validate.ts`
- Create: `frontend/app/api/contact/validate.test.ts`
- Create: `frontend/app/api/contact/route.ts`
- Create: `frontend/app/api/contact/route.test.ts`

**Interfaces:**
- Consumes: `CONTACT_SUBJECTS`, `ContactSubject`, `ContactMessageInput`, `getContactMessages`,
  `createContactMessage` from `lib/contact.ts` (Task 1); `getAdminSessionFromCookieHeader` from
  `lib/auth/session.ts`; `getDb`.
- Produces: `validateContactMessageBody(body: unknown): { errors: Record<string, string> } |
  { data: ContactMessageInput }`; `GET`/`POST` handlers.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/contact/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateContactMessageBody } from './validate'

const validBody = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  phone: '0909123456',
  subject: 'other',
  message: 'Nội dung test',
}

describe('validateContactMessageBody', () => {
  it('accepts a valid body', () => {
    const result = validateContactMessageBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('accepts a missing phone as null', () => {
    const { phone, ...withoutPhone } = validBody
    void phone
    const result = validateContactMessageBody(withoutPhone)
    expect('data' in result && result.data.phone).toBeNull()
  })

  it('rejects an empty name', () => {
    const result = validateContactMessageBody({ ...validBody, name: '  ' })
    expect('errors' in result && result.errors.name).toBeDefined()
  })

  it('rejects an invalid email', () => {
    const result = validateContactMessageBody({ ...validBody, email: 'not-an-email' })
    expect('errors' in result && result.errors.email).toBeDefined()
  })

  it('rejects an invalid subject', () => {
    const result = validateContactMessageBody({ ...validBody, subject: 'not-a-subject' })
    expect('errors' in result && result.errors.subject).toBeDefined()
  })

  it('rejects an empty message', () => {
    const result = validateContactMessageBody({ ...validBody, message: '  ' })
    expect('errors' in result && result.errors.message).toBeDefined()
  })

  it('rejects a missing body', () => {
    expect('errors' in validateContactMessageBody(null)).toBe(true)
  })
})
```

Create `frontend/app/api/contact/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/contact')>('@/lib/contact')
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
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  phone: '0909123456',
  subject: 'other',
  message: 'Nội dung test',
}

beforeEach(() => {
  getDb().exec('DELETE FROM contact_messages')
})

describe('GET /api/contact', () => {
  it('rejects requests without an admin session', async () => {
    const response = await GET(new Request('http://localhost/api/contact'))
    expect(response.status).toBe(401)
  })

  it('returns messages for an admin session', async () => {
    const request = new Request('http://localhost/api/contact', { headers: { cookie: adminCookieHeader() } })
    const response = await GET(request)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/contact', () => {
  it('creates a message without requiring any session', async () => {
    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.isRead).toBe(false)
    expect(body.name).toBe('Nguyễn Văn Test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, email: 'not-an-email' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.email).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/api/contact/validate.test.ts app/api/contact/route.test.ts`
Expected: FAIL — neither `validate.ts` nor `route.ts` exist yet.

- [ ] **Step 3: Implement `validate.ts`**

Create `frontend/app/api/contact/validate.ts`:
```ts
import { CONTACT_SUBJECTS, type ContactSubject, type ContactMessageInput } from '@/lib/contact'

type RawContactBody = {
  name?: unknown
  email?: unknown
  phone?: unknown
  subject?: unknown
  message?: unknown
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validateContactMessageBody(
  body: unknown
): { errors: Record<string, string> } | { data: ContactMessageInput } {
  const raw = (body ?? {}) as RawContactBody
  const errors: Record<string, string> = {}

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) errors.name = 'Họ tên không được để trống'

  const email = typeof raw.email === 'string' ? raw.email.trim() : ''
  if (!email || !isValidEmail(email)) errors.email = 'Email không hợp lệ'

  const phone = typeof raw.phone === 'string' && raw.phone.trim() ? raw.phone.trim() : null

  const subject = raw.subject as ContactSubject
  if (!CONTACT_SUBJECTS.includes(subject)) errors.subject = 'Chủ đề không hợp lệ'

  const message = typeof raw.message === 'string' ? raw.message.trim() : ''
  if (!message) errors.message = 'Nội dung không được để trống'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { name, email, phone, subject, message } }
}
```

- [ ] **Step 4: Implement `route.ts`**

Create `frontend/app/api/contact/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getContactMessages, createContactMessage } from '@/lib/contact'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateContactMessageBody } from './validate'

export async function GET(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }
  return NextResponse.json(getContactMessages(getDb()))
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const result = validateContactMessageBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createContactMessage(getDb(), result.data)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/contact/validate.test.ts app/api/contact/route.test.ts`
Expected: PASS (7 + 4 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add app/api/contact/validate.ts app/api/contact/validate.test.ts app/api/contact/route.ts app/api/contact/route.test.ts
git commit -m "feat: add contact API (public create + admin list)"
```

---

## Task 4: Contact API — single-message route (admin toggle-read + delete)

**Files:**
- Create: `frontend/app/api/contact/[id]/route.ts`
- Create: `frontend/app/api/contact/[id]/route.test.ts`

**Interfaces:**
- Consumes: `setContactMessageRead`, `deleteContactMessage` from `lib/contact.ts` (Task 1);
  `getAdminSessionFromCookieHeader`; `getDb`.
- Produces: `PATCH`/`DELETE` handlers, consumed by Task 6 (`ContactMessageList`).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/contact/[id]/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { createContactMessage, type ContactMessageInput } from '@/lib/contact'
import { PATCH, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/contact')>('@/lib/contact')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  return { getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

const validInput: ContactMessageInput = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  phone: null,
  subject: 'other',
  message: 'Nội dung test',
}

beforeEach(() => {
  getDb().exec('DELETE FROM contact_messages')
})

describe('PATCH /api/contact/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createContactMessage(getDb(), validInput)
    const request = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ isRead: true }) })
    const response = await PATCH(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('marks a message read', async () => {
    const created = createContactMessage(getDb(), validInput)
    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ isRead: true }),
    })
    const response = await PATCH(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).isRead).toBe(true)
  })

  it('returns 404 for a message that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ isRead: true }),
    })
    const response = await PATCH(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/contact/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createContactMessage(getDb(), validInput)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes a message', async () => {
    const created = createContactMessage(getDb(), validInput)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
  })

  it('returns 404 for a message that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(999999))
    expect(response.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/contact/\[id\]/route.test.ts"`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `frontend/app/api/contact/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { setContactMessageRead, deleteContactMessage } from '@/lib/contact'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as { isRead?: unknown } | null
  const isRead = body?.isRead === true

  const updated = setContactMessageRead(getDb(), Number(id), isRead)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy tin nhắn' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteContactMessage(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy tin nhắn' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/contact/\[id\]/route.test.ts"`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/contact/[id]/route.ts" "app/api/contact/[id]/route.test.ts"
git commit -m "feat: add single contact message API route"
```

---

## Task 5: `ContactSection` submits for real

**Files:**
- Modify: `frontend/components/home/ContactSection.tsx`
- Modify: `frontend/components/home/ContactSection.test.tsx`
- Modify: `frontend/messages/vi.json` (`Home.ContactSection.errorMessage`)

**Interfaces:**
- Consumes: `POST /api/contact` (Task 3).

- [ ] **Step 1: Add the message**

In `frontend/messages/vi.json`, inside `"Home"."ContactSection"`, add `errorMessage` as a
sibling of `successMessage`:
```json
    "successMessage": "Cảm ơn bạn! Lời nhắn đã được chuyển đến bộ phận chăm sóc TwistFit.",
    "errorMessage": "Có lỗi xảy ra, vui lòng thử lại."
```

- [ ] **Step 2: Rewrite the test**

Replace `frontend/components/home/ContactSection.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ContactSection from './ContactSection'

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Linh Đan' } })
  fireEvent.change(screen.getByLabelText('Địa chỉ Email *'), { target: { value: 'linhdan@gmail.com' } })
  fireEvent.change(screen.getByLabelText('Chủ đề góp ý *'), { target: { value: 'other' } })
  fireEvent.change(screen.getByLabelText('Nội dung tin nhắn *'), { target: { value: 'Xin chào' } })
}

describe('ContactSection', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs the form data to /api/contact and shows a confirmation on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<ContactSection />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /GỬI LỜI NHẮN/ }))

    await waitFor(() => expect(screen.getByText(/Cảm ơn bạn/)).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Linh Đan',
          email: 'linhdan@gmail.com',
          phone: '',
          subject: 'other',
          message: 'Xin chào',
        }),
      })
    )
  })

  it('shows an error message and no confirmation when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ errors: {} }) }))
    renderWithIntl(<ContactSection />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /GỬI LỜI NHẮN/ }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(screen.queryByText(/Cảm ơn bạn/)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/home/ContactSection.test.tsx`
Expected: FAIL — the current inputs have no `name` attributes and `handleSubmit` never calls
`fetch`.

- [ ] **Step 4: Update `ContactSection.tsx`**

In `frontend/components/home/ContactSection.tsx`, replace the imports and `handleSubmit`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'

export default function ContactSection() {
  const t = useTranslations('Home.ContactSection')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const body = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      setSubmitted(false)
      setError(true)
      return
    }

    setError(false)
    setSubmitted(true)
    form.reset()
  }
```

Add `name` attributes to the five form fields (currently they only have `id`) — update each
input/select/textarea:
```tsx
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      placeholder={t('placeholders.name')}
```
```tsx
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      placeholder={t('placeholders.email')}
```
```tsx
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      placeholder={t('placeholders.phone')}
```
```tsx
                    <select
                      id="contact-subject"
                      name="subject"
                      required
                      defaultValue=""
```
```tsx
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    placeholder={t('placeholders.message')}
```

Finally, replace the success-message span to also handle the error case:
```tsx
                <div className="flex items-center justify-between pt-2">
                  <span className="text-label-sm text-primary">{submitted ? t('successMessage') : ''}</span>
```
becomes:
```tsx
                <div className="flex items-center justify-between pt-2">
                  {submitted && <span className="text-label-sm text-primary">{t('successMessage')}</span>}
                  {error && <span className="text-label-sm text-error">{t('errorMessage')}</span>}
                  {!submitted && !error && <span />}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/home/ContactSection.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/home/ContactSection.tsx components/home/ContactSection.test.tsx messages/vi.json
git commit -m "feat: submit the contact form to the real API"
```

---

## Task 6: `ContactMessageList` + `/admin/contact` page

**Files:**
- Create: `frontend/components/admin/ContactMessageList.tsx`
- Create: `frontend/components/admin/ContactMessageList.test.tsx`
- Create: `frontend/app/admin/contact/page.tsx`
- Create: `frontend/app/admin/contact/page.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.ContactList` namespace)

**Interfaces:**
- Consumes: `ContactMessage` from `lib/contact.ts` (Task 1); `GET /api/contact` (Task 3);
  `PATCH`/`DELETE /api/contact/[id]` (Task 4); `AdminGate`.
- Produces: `ContactMessageList()`, default-exported `AdminContactPage`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add a new `ContactList` sub-namespace
(alongside `TeamForm`/`TeamList`/etc.):
```json
    "ContactList": {
      "title": "Hộp thư liên hệ",
      "subjects": {
        "color-test": "Hỏi về kết quả Personal Color",
        "virtual-fitting": "Góp ý tính năng Phòng Thử Đồ Ảo",
        "stylist": "Đăng ký hợp tác Stylist / Fashion KOL",
        "other": "Ý kiến đóng góp khác"
      },
      "unreadBadge": "Chưa đọc",
      "markReadButton": "Đánh dấu đã đọc",
      "markUnreadButton": "Đánh dấu chưa đọc",
      "deleteButton": "Xóa",
      "deleteConfirm": "Xóa tin nhắn này?",
      "emptyState": "Chưa có tin nhắn nào.",
      "loading": "Đang tải...",
      "detailEmailLabel": "Email",
      "detailPhoneLabel": "Số điện thoại"
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/admin/ContactMessageList.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ContactMessageList from './ContactMessageList'
import type { ContactMessage } from '@/lib/contact'

const MESSAGES: ContactMessage[] = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    email: 'a@twistfit.vn',
    phone: '0909123456',
    subject: 'stylist',
    message: 'Tôi muốn hợp tác',
    isRead: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('ContactMessageList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders messages with subject label and unread badge', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MESSAGES }))
    renderWithIntl(<ContactMessageList />)

    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/contact')
    expect(screen.getByText('Đăng ký hợp tác Stylist / Fashion KOL')).toBeInTheDocument()
    expect(screen.getByLabelText('Chưa đọc')).toBeInTheDocument()
  })

  it('expands a message to show details and lets the admin mark it read', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => MESSAGES })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ...MESSAGES[0], isRead: true }) })
    )
    renderWithIntl(<ContactMessageList />)
    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Nguyễn Văn A'))
    expect(screen.getByText(/Tôi muốn hợp tác/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' }))
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/contact/1',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ isRead: true }) })
      )
    )
  })

  it('deletes a message when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => MESSAGES }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<ContactMessageList />)
    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Nguyễn Văn A'))
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Nguyễn Văn A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/contact/1', { method: 'DELETE' })
  })

  it('shows an empty state when there are no messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ContactMessageList />)
    await waitFor(() => expect(screen.getByText('Chưa có tin nhắn nào.')).toBeInTheDocument())
  })
})
```

Create `frontend/app/admin/contact/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminContactPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('AdminContactPage', () => {
  beforeEach(() => {
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

  it('renders the heading for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminContactPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Hộp thư liên hệ' })).toBeInTheDocument())
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/admin/ContactMessageList.test.tsx app/admin/contact/page.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `ContactMessageList.tsx`**

Create `frontend/components/admin/ContactMessageList.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { ContactMessage } from '@/lib/contact'

export default function ContactMessageList() {
  const t = useTranslations('Admin.ContactList')
  const [messages, setMessages] = useState<ContactMessage[] | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/contact')
      .then((response) => response.json())
      .then(setMessages)
  }, [])

  async function handleToggleRead(message: ContactMessage) {
    const response = await fetch(`/api/contact/${message.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: !message.isRead }),
    })
    const updated = await response.json()
    setMessages((current) => current?.map((item) => (item.id === message.id ? updated : item)) ?? null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/contact/${id}`, { method: 'DELETE' })
    setMessages((current) => current?.filter((item) => item.id !== id) ?? null)
  }

  if (messages === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (messages.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {messages.map((message) => (
        <li key={message.id} className="rounded-2xl border border-outline-variant p-space-lg">
          <button
            type="button"
            onClick={() => setExpandedId((current) => (current === message.id ? null : message.id))}
            className="flex w-full flex-wrap items-center justify-between gap-space-sm text-left"
          >
            <span className="flex items-center gap-space-sm">
              {!message.isRead && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label={t('unreadBadge')} />
              )}
              <span className="font-semibold text-on-surface">{message.name}</span>
              <span className="text-label-sm text-on-surface-variant">{t(`subjects.${message.subject}`)}</span>
            </span>
            <span className="text-label-sm text-on-surface-variant">{message.createdAt}</span>
          </button>
          {expandedId === message.id && (
            <div className="mt-space-sm space-y-space-xs text-body-sm text-on-surface-variant">
              <p>
                {t('detailEmailLabel')}: {message.email}
              </p>
              {message.phone && (
                <p>
                  {t('detailPhoneLabel')}: {message.phone}
                </p>
              )}
              <p className="whitespace-pre-wrap text-on-surface">{message.message}</p>
              <div className="mt-space-sm flex gap-space-md">
                <button
                  type="button"
                  onClick={() => handleToggleRead(message)}
                  className="font-semibold text-primary hover:underline"
                >
                  {message.isRead ? t('markUnreadButton') : t('markReadButton')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(message.id)}
                  className="font-semibold text-error hover:underline"
                >
                  {t('deleteButton')}
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 5: Implement `app/admin/contact/page.tsx`**

Create `frontend/app/admin/contact/page.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import AdminGate from '@/components/auth/AdminGate'
import ContactMessageList from '@/components/admin/ContactMessageList'

export default function AdminContactPage() {
  const t = useTranslations('Admin.ContactList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
          <div className="mt-space-lg">
            <ContactMessageList />
          </div>
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/admin/ContactMessageList.test.tsx app/admin/contact/page.test.tsx`
Expected: PASS (4 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/admin/ContactMessageList.tsx components/admin/ContactMessageList.test.tsx app/admin/contact/page.tsx app/admin/contact/page.test.tsx messages/vi.json
git commit -m "feat: add admin contact inbox page"
```

---

## Task 7: `AdminDashboard` links to the contact inbox

**Files:**
- Modify: `frontend/components/auth/AdminDashboard.tsx`
- Modify: `frontend/components/auth/AdminDashboard.test.tsx`
- Modify: `frontend/messages/vi.json` (`Admin` namespace)

- [ ] **Step 1: Update messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add as siblings of `forumCardTitle`/`forumCardDescription`:
```json
    "contactCardTitle": "Quản lý Hộp thư",
    "contactCardDescription": "Xem, đánh dấu đã đọc và xóa tin nhắn liên hệ từ khách."
```

- [ ] **Step 2: Write the failing test**

Extend the existing test in `frontend/components/auth/AdminDashboard.test.tsx` — add this line
inside the existing `it` block, after the Forum assertion:
```tsx
    expect(screen.getByRole('link', { name: /Quản lý Hộp thư/ })).toHaveAttribute('href', '/admin/contact')
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: FAIL — no contact link exists yet.

- [ ] **Step 4: Update `AdminDashboard.tsx`**

Add an eighth `<Link>` card after the Forum card:
```tsx
          <Link
            href="/admin/contact"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('contactCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('contactCardDescription')}</p>
          </Link>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/AdminDashboard.tsx components/auth/AdminDashboard.test.tsx messages/vi.json
git commit -m "feat: link the admin dashboard to the contact inbox"
```

---

## Task 8: Full verification + manual browser check

- [ ] **Step 1: Run the full test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS — every test in the project.

- [ ] **Step 2: Lint**

Run: `cd frontend && npx eslint .`
Expected: no errors (pre-existing warnings unrelated to this work are not this plan's concern).

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test in a real browser**

Start the dev server (`cd frontend && npm run dev`):

1. Go to the homepage (`/`), scroll to the contact section, fill in the form (skip phone —
   confirm it's optional), submit. Confirm the success message appears and the form clears.
2. Submit again with an invalid email (e.g. `notanemail`) — the native HTML5 `type="email"`
   validation should block submission before it even reaches `handleSubmit`; confirm the
   browser's own validation UI appears rather than a network request firing.
3. Log in as `admin@twistfit.vn` / `admin1234`, go to `/admin` — confirm the new "Quản lý Hộp
   thư" card is present and links to `/admin/contact`.
4. On `/admin/contact`, confirm the message from step 1 appears with an unread dot. Click it to
   expand — confirm email/phone/message all render. Click "Đánh dấu đã đọc" — confirm the
   unread dot disappears and the button now reads "Đánh dấu chưa đọc".
5. Click "Xóa", confirm the browser confirm dialog, confirm the message disappears.
6. Check the browser console for errors on `/`, `/admin`, and `/admin/contact` — in particular
   confirm there is **no** `Module not found: Can't resolve 'fs'` error.

- [ ] **Step 5: Commit**

No doc update in this step — `docs/admin-dashboard-roadmap.md`'s combined "Dashboard thống kê /
Hộp thư liên hệ" line is updated once the Stats Dashboard subproject (2/2) also lands. If Steps
1-4 above required any fixes, commit them now with an appropriate message; otherwise there is
nothing to commit in this task.
