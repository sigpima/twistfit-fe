# Tài khoản người dùng thật Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded mock accounts (`frontend/lib/auth/mockAccounts.ts`) with real
accounts stored in SQLite, so registration actually creates a user and login authenticates
against the database — the prerequisite for the Forum sub-project, which needs real
`user.id` values to attribute posts to.

**Architecture:** New module `frontend/lib/auth/users.ts` follows the exact
schema/CRUD/seed pattern already used throughout the codebase (types + `initSchema` + CRUD +
`seedIfEmpty`, `db` passed explicitly), wired into `lib/getDb.ts`. Passwords are hashed with
`node:crypto`'s `scryptSync` (no new dependency), compared with `timingSafeEqual`. The signed
session cookie mechanism in `lib/auth/session.ts` is unchanged — only its `Role` type now
comes from `users.ts` instead of `mockAccounts.ts`. `AuthProvider.login()` changes from
synchronous (reading a hardcoded array) to asynchronous (a single `fetch` to
`/api/auth/login`, which now checks the database) — this is a breaking signature change for
every caller, so `LoginForm.tsx`, `RegisterForm.tsx`, and their tests all update together.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, `node:crypto`
(`scryptSync`/`timingSafeEqual`), Vitest + Testing Library, next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-real-user-accounts-design.md`

## Global Constraints

- `lib/auth/users.ts` query functions take `db: Database.Database` as an explicit parameter
  (never a module-level singleton) and import `better-sqlite3` **only as a type**.
- Passwords are hashed with `scryptSync`, stored as `"<salt hex>:<hash hex>"`; comparison uses
  `timingSafeEqual` (same pattern as the cookie signature check in `lib/auth/session.ts`).
- Public registration (`createUser`) always creates `role: 'user'` — there is no way to create
  an admin account through the API.
- The 2 existing demo accounts (`admin@twistfit.vn`/`admin1234`, `user@twistfit.vn`/`user1234`)
  must keep working — they are seeded into the real `users` table with the same
  email/password/role.
- No `/admin/users` page, no ban/unban, no role-change UI, no self-service profile editing —
  explicitly out of scope for this plan.
- Route `params` are `Promise`s — `await params` in Route Handlers (not needed in this plan,
  no `[id]` routes, but kept for consistency with the rest of the codebase).
- Every new module/component gets a co-located `.test.ts`/`.test.tsx` file, written and run
  red before implementation (TDD).
- All new UI-facing error strings go through `next-intl` (`Register` namespace); API error
  codes are machine-readable strings (e.g. `'EMAIL_TAKEN'`), never hardcoded Vietnamese, so the
  frontend maps them to the correct translation key.

---

## Task 1: Data layer — `users` schema, password hashing, CRUD, seed

**Files:**
- Create: `frontend/lib/auth/users.ts`
- Test: `frontend/lib/auth/users.test.ts`

**Interfaces:**
- Produces: `Role` (`'user' | 'admin'`), `User`, `CreateUserInput`, `initSchema(db)`,
  `getUserByEmail(db, email)`, `getUserById(db, id)`, `isEmailTaken(db, email)`,
  `createUser(db, input)`, `verifyUserCredentials(db, email, password)`, `seedIfEmpty(db)`.
  Consumed by Task 2 (`getDb.ts` wiring), Task 3 (`session.ts`'s `Role` import), Task 4
  (register route), Task 5 (login route).

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/auth/users.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createUser,
  getUserByEmail,
  getUserById,
  isEmailTaken,
  verifyUserCredentials,
  seedIfEmpty,
  type CreateUserInput,
} from './users'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleInput: CreateUserInput = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  password: 'password123',
}

describe('createUser / getUserByEmail / getUserById', () => {
  it('creates a user with role "user" and a hashed password', () => {
    const created = createUser(db, sampleInput)
    expect(created.id).toBeGreaterThan(0)
    expect(created.name).toBe('Nguyễn Văn Test')
    expect(created.email).toBe('test@twistfit.vn')
    expect(created.role).toBe('user')
    expect((created as unknown as { passwordHash?: string }).passwordHash).toBeUndefined()

    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(created.id) as {
      password_hash: string
    }
    expect(row.password_hash).not.toBe('password123')
    expect(row.password_hash).toContain(':')
  })

  it('normalizes email to lowercase and trims it', () => {
    const created = createUser(db, { ...sampleInput, email: '  Test@TwistFit.vn  ' })
    expect(created.email).toBe('test@twistfit.vn')
    expect(getUserByEmail(db, 'TEST@twistfit.vn')?.id).toBe(created.id)
  })

  it('reads back a user by id', () => {
    const created = createUser(db, sampleInput)
    expect(getUserById(db, created.id)?.email).toBe('test@twistfit.vn')
    expect(getUserById(db, 999999)).toBeNull()
  })
})

describe('isEmailTaken', () => {
  it('reflects whether an email is already registered', () => {
    expect(isEmailTaken(db, 'test@twistfit.vn')).toBe(false)
    createUser(db, sampleInput)
    expect(isEmailTaken(db, 'test@twistfit.vn')).toBe(true)
    expect(isEmailTaken(db, 'Test@TwistFit.vn')).toBe(true)
  })
})

describe('verifyUserCredentials', () => {
  it('returns the user for correct credentials', () => {
    createUser(db, sampleInput)
    const user = verifyUserCredentials(db, 'test@twistfit.vn', 'password123')
    expect(user?.email).toBe('test@twistfit.vn')
  })

  it('is case-insensitive on email', () => {
    createUser(db, sampleInput)
    expect(verifyUserCredentials(db, 'TEST@twistfit.vn', 'password123')?.email).toBe('test@twistfit.vn')
  })

  it('returns null for a wrong password', () => {
    createUser(db, sampleInput)
    expect(verifyUserCredentials(db, 'test@twistfit.vn', 'wrongpass')).toBeNull()
  })

  it('returns null for an unknown email', () => {
    expect(verifyUserCredentials(db, 'nobody@twistfit.vn', 'password123')).toBeNull()
  })
})

describe('seedIfEmpty', () => {
  it('seeds the 2 demo accounts into an empty database', () => {
    seedIfEmpty(db)
    expect(verifyUserCredentials(db, 'user@twistfit.vn', 'user1234')?.role).toBe('user')
    expect(verifyUserCredentials(db, 'admin@twistfit.vn', 'admin1234')?.role).toBe('admin')
  })

  it('does nothing if users already has rows', () => {
    createUser(db, sampleInput)
    seedIfEmpty(db)
    expect(isEmailTaken(db, 'user@twistfit.vn')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/auth/users.test.ts`
Expected: FAIL — `./users` module does not exist yet.

- [ ] **Step 3: Implement `lib/auth/users.ts`**

Create `frontend/lib/auth/users.ts`:
```ts
import type Database from 'better-sqlite3'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export type Role = 'user' | 'admin'

export type User = {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
}

type InsertUserInput = {
  name: string
  email: string
  password: string
  role: Role
}

type UserRow = {
  id: number
  name: string
  email: string
  password_hash: string
  role: string
  created_at: string
  updated_at: string
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getUserByEmail(db: Database.Database, email: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email)) as
    | UserRow
    | undefined
  return row ? rowToUser(row) : null
}

export function getUserById(db: Database.Database, id: number): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
  return row ? rowToUser(row) : null
}

export function isEmailTaken(db: Database.Database, email: string): boolean {
  return getUserByEmail(db, email) !== null
}

function insertUser(db: Database.Database, input: InsertUserInput): User {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES (@name, @email, @passwordHash, @role, @createdAt, @updatedAt)`
    )
    .run({
      name: input.name,
      email: normalizeEmail(input.email),
      passwordHash: hashPassword(input.password),
      role: input.role,
      createdAt: now,
      updatedAt: now,
    })
  const created = getUserById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created user')
  }
  return created
}

export function createUser(db: Database.Database, input: CreateUserInput): User {
  return insertUser(db, { ...input, role: 'user' })
}

export function verifyUserCredentials(db: Database.Database, email: string, password: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email)) as
    | UserRow
    | undefined
  if (!row) return null
  if (!verifyPassword(password, row.password_hash)) return null
  return rowToUser(row)
}

const SEED_USERS: InsertUserInput[] = [
  { name: 'Người dùng Test', email: 'user@twistfit.vn', password: 'user1234', role: 'user' },
  { name: 'Quản trị viên Test', email: 'admin@twistfit.vn', password: 'admin1234', role: 'admin' },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }
  if (count > 0) return
  SEED_USERS.forEach((user) => insertUser(db, user))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/auth/users.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/auth/users.ts lib/auth/users.test.ts
git commit -m "feat: add real user accounts data layer with password hashing"
```

---

## Task 2: Wire the `users` schema into the shared `getDb()` singleton

**Files:**
- Modify: `frontend/lib/getDb.ts`

**Interfaces:**
- Consumes: `initSchema`, `seedIfEmpty` from `lib/auth/users.ts` (Task 1).

- [ ] **Step 1: Modify `lib/getDb.ts`**

Add the import (path is relative to `lib/`, so `./auth/users`):
```ts
import { initSchema as initUsersSchema, seedIfEmpty as seedUsersIfEmpty } from './auth/users'
```
Inside `getDb()`, after the Team init/seed calls, add:
```ts
  initUsersSchema(db)
  seedUsersIfEmpty(db)
```

- [ ] **Step 2: Verify the whole project still compiles and tests still pass**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every existing test still passes (mock accounts are still in place
and untouched at this point, so nothing regresses yet).

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/getDb.ts
git commit -m "feat: initialize and seed the users table when opening the database"
```

---

## Task 3: Point `lib/auth/session.ts`'s `Role` type at the real `users` module

**Files:**
- Modify: `frontend/lib/auth/session.ts:2`

**Interfaces:**
- Consumes: `Role` from `lib/auth/users.ts` (Task 1).
- No change to any exported function signature — `SessionPayload`, `createSessionCookieValue`,
  `verifySessionCookieValue`, `getAdminSessionFromCookieHeader` all keep their current shape.

- [ ] **Step 1: Change the import**

In `frontend/lib/auth/session.ts`, change line 2 from:
```ts
import type { Role } from '@/lib/auth/mockAccounts'
```
to:
```ts
import type { Role } from '@/lib/auth/users'
```

- [ ] **Step 2: Run the existing session tests to confirm nothing broke**

Run: `cd frontend && npx vitest run lib/auth/session.test.ts`
Expected: PASS (existing tests unchanged — they only use the string literals `'admin'`/`'user'`,
never import `Role` from `mockAccounts` directly, so this is a type-only change with no
behavioral difference).

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/auth/session.ts
git commit -m "refactor: source session Role type from the real users module"
```

---

## Task 4: Registration API — validation + route

**Files:**
- Create: `frontend/app/api/auth/register/validate.ts`
- Create: `frontend/app/api/auth/register/validate.test.ts`
- Create: `frontend/app/api/auth/register/route.ts`
- Create: `frontend/app/api/auth/register/route.test.ts`

**Interfaces:**
- Consumes: `createUser`, `isEmailTaken` from `lib/auth/users.ts` (Task 1); `getDb`.
- Produces: `validateRegisterBody(body: unknown): { errors: Record<string, string> } | { data:
  RegisterInput }` where `RegisterInput = { name: string; email: string; password: string }`;
  `POST` handler returning 201 with `{ id, name, email, role }`, 400 with `{ errors }`, or 409
  with `{ error: 'EMAIL_TAKEN' }`.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/auth/register/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateRegisterBody } from './validate'

const validBody = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  password: 'password123',
}

describe('validateRegisterBody', () => {
  it('accepts a valid body and trims/normalizes fields', () => {
    const result = validateRegisterBody({ ...validBody, name: '  Nguyễn Văn Test  ' })
    expect('data' in result && result.data.name).toBe('Nguyễn Văn Test')
  })

  it('rejects an empty name', () => {
    const result = validateRegisterBody({ ...validBody, name: '  ' })
    expect('errors' in result && result.errors.name).toBeDefined()
  })

  it('rejects an invalid email', () => {
    const result = validateRegisterBody({ ...validBody, email: 'not-an-email' })
    expect('errors' in result && result.errors.email).toBeDefined()
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = validateRegisterBody({ ...validBody, password: 'short' })
    expect('errors' in result && result.errors.password).toBeDefined()
  })

  it('rejects a missing body', () => {
    const result = validateRegisterBody(null)
    expect('errors' in result).toBe(true)
  })
})
```

Create `frontend/app/api/auth/register/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { POST } from './route'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/auth/users')>('@/lib/auth/users')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  return { getDb: () => testDb }
})

const validBody = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  password: 'password123',
}

beforeEach(() => {
  getDb().exec('DELETE FROM users')
})

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 without a password hash', async () => {
    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.email).toBe('test@twistfit.vn')
    expect(body.role).toBe('user')
    expect(body.passwordHash).toBeUndefined()
    expect(body.password).toBeUndefined()
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, email: 'not-an-email' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.email).toBeDefined()
  })

  it('returns 409 when the email is already registered', async () => {
    await POST(new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify(validBody) }))
    const response = await POST(
      new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify(validBody) })
    )
    expect(response.status).toBe(409)
    expect((await response.json()).error).toBe('EMAIL_TAKEN')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/api/auth/register/validate.test.ts app/api/auth/register/route.test.ts`
Expected: FAIL — neither `validate.ts` nor `route.ts` exist yet.

- [ ] **Step 3: Implement `validate.ts`**

Create `frontend/app/api/auth/register/validate.ts`:
```ts
export type RegisterInput = {
  name: string
  email: string
  password: string
}

type RawRegisterBody = {
  name?: unknown
  email?: unknown
  password?: unknown
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validateRegisterBody(
  body: unknown
): { errors: Record<string, string> } | { data: RegisterInput } {
  const raw = (body ?? {}) as RawRegisterBody
  const errors: Record<string, string> = {}

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) errors.name = 'Họ tên không được để trống'

  const email = typeof raw.email === 'string' ? raw.email.trim() : ''
  if (!email || !isValidEmail(email)) errors.email = 'Email không hợp lệ'

  const password = typeof raw.password === 'string' ? raw.password : ''
  if (password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { name, email, password } }
}
```

- [ ] **Step 4: Implement `route.ts`**

Create `frontend/app/api/auth/register/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { createUser, isEmailTaken } from '@/lib/auth/users'
import { getDb } from '@/lib/getDb'
import { validateRegisterBody } from './validate'

export async function POST(request: Request) {
  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateRegisterBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  if (isEmailTaken(db, result.data.email)) {
    return NextResponse.json({ error: 'EMAIL_TAKEN' }, { status: 409 })
  }

  const user = createUser(db, result.data)
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/auth/register/validate.test.ts app/api/auth/register/route.test.ts`
Expected: PASS (5 + 3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add app/api/auth/register/validate.ts app/api/auth/register/validate.test.ts app/api/auth/register/route.ts app/api/auth/register/route.test.ts
git commit -m "feat: add user registration API route"
```

---

## Task 5: Login API — authenticate against the real `users` table

**Files:**
- Modify: `frontend/app/api/auth/login/route.ts`
- Modify: `frontend/app/api/auth/login/route.test.ts`

**Interfaces:**
- Consumes: `verifyUserCredentials` from `lib/auth/users.ts` (Task 1); `getDb`.
- Produces: same `POST` handler shape as before, but the success response body changes from
  `{ email, role }` to `{ name, email, role }` — required by Task 6, since `AuthProvider` will
  read `name` directly from this response instead of a hardcoded mock account.

- [ ] **Step 1: Update the test to seed real users instead of relying on `mockAccounts`**

Replace `frontend/app/api/auth/login/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { POST } from './route'
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema, seedIfEmpty } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  seedIfEmpty(testDb)
  return { getDb: () => testDb }
})

describe('POST /api/auth/login', () => {
  it('sets a signed session cookie for valid admin credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@twistfit.vn', password: 'admin1234' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Quản trị viên Test')

    const cookie = response.cookies.get(SESSION_COOKIE_NAME)
    expect(cookie).toBeDefined()
    const session = verifySessionCookieValue(cookie!.value)
    expect(session?.role).toBe('admin')
    expect(session?.email).toBe('admin@twistfit.vn')
  })

  it('returns 401 and sets no cookie for invalid credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@twistfit.vn', password: 'wrongpass' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
    expect(response.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it('returns 400 when email or password is missing', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/api/auth/login/route.test.ts`
Expected: FAIL — `route.ts` still uses `findMockAccount` and returns `{ email, role }` without
`name`, and doesn't go through the mocked `getDb()` at all yet.

- [ ] **Step 3: Update `route.ts`**

Replace `frontend/app/api/auth/login/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { verifyUserCredentials } from '@/lib/auth/users'
import { getDb } from '@/lib/getDb'
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null
  const email = body?.email
  const password = body?.password

  if (!email || !password) {
    return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 })
  }

  const user = verifyUserCredentials(getDb(), email, password)
  if (!user) {
    return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 })
  }

  const response = NextResponse.json({ name: user.name, email: user.email, role: user.role })
  response.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(user.email, user.role), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return response
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/api/auth/login/route.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/api/auth/login/route.ts app/api/auth/login/route.test.ts
git commit -m "feat: authenticate login against real user accounts"
```

---

## Task 6: `AuthProvider.login()` becomes async and single-sourced from `/api/auth/login`

**Files:**
- Modify: `frontend/components/auth/AuthProvider.tsx`
- Modify: `frontend/components/auth/AuthProvider.test.tsx`

**Interfaces:**
- Consumes: `Role` from `lib/auth/users.ts` (Task 1, replacing the `mockAccounts` import).
- Produces: `AuthUser = { name, email, role }` (unchanged shape), `login: (email: string,
  password: string) => Promise<AuthUser | null>` (changed from sync to async — **breaking
  change**, consumed by Task 7 and Task 8), `logout: () => void` (unchanged), `useAuth()`
  (unchanged).

- [ ] **Step 1: Rewrite the test for async `login()`**

Replace `frontend/components/auth/AuthProvider.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

function stubLoginFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse((init?.body as string) ?? '{}') as { email: string; password: string }
      if (body.email === 'user@twistfit.vn' && body.password === 'user1234') {
        return { ok: true, json: async () => ({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' }) }
      }
      if (body.email === 'admin@twistfit.vn' && body.password === 'admin1234') {
        return {
          ok: true,
          json: async () => ({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' }),
        }
      }
      return { ok: false, status: 401, json: async () => ({ error: 'Email hoặc mật khẩu không đúng' }) }
    })
  )
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    window.localStorage.clear()
    stubLoginFetch()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('starts logged out', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
  })

  it('logs in with valid credentials and persists to localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const account = await result.current.login('user@twistfit.vn', 'user1234')
      expect(account?.role).toBe('user')
    })

    expect(result.current.user).toEqual({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    expect(window.localStorage.getItem('twistfit.auth')).toContain('user@twistfit.vn')
  })

  it('rejects invalid credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const account = await result.current.login('user@twistfit.vn', 'wrongpass')
      expect(account).toBeNull()
    })

    expect(result.current.user).toBeNull()
  })

  it('logs out and clears localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('admin@twistfit.vn', 'admin1234')
    })
    expect(result.current.user?.role).toBe('admin')

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(window.localStorage.getItem('twistfit.auth')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/AuthProvider.test.tsx`
Expected: FAIL — `login()` is still synchronous and reads `mockAccounts` directly, ignoring
`fetch` for its authentication decision.

- [ ] **Step 3: Rewrite `AuthProvider.tsx`**

Replace `frontend/components/auth/AuthProvider.tsx`:
```tsx
'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Role } from '@/lib/auth/users'

const STORAGE_KEY = 'twistfit.auth'

export type AuthUser = {
  name: string
  email: string
  role: Role
}

type AuthContextValue = {
  user: AuthUser | null
  // False only until the initial localStorage read completes. A protected
  // page must wait for this before redirecting on `user === null`, or it
  // will bounce an already-logged-in visitor during that first render.
  isHydrated: boolean
  login: (email: string, password: string) => Promise<AuthUser | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // One-time hydration from localStorage after mount, not a React->React
    // sync: reading window here during render would break SSR/hydration, so
    // this must stay in an effect despite the lint rule's general advice.
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(stored) as AuthUser)
    }
    setIsHydrated(true)
  }, [])

  async function login(email: string, password: string): Promise<AuthUser | null> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) return null
    const account = (await response.json()) as AuthUser
    setUser(account)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
    return account
  }

  function logout() {
    setUser(null)
    window.localStorage.removeItem(STORAGE_KEY)
    void fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  }

  return <AuthContext.Provider value={{ user, isHydrated, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/AuthProvider.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/auth/AuthProvider.tsx components/auth/AuthProvider.test.tsx
git commit -m "feat: make AuthProvider.login async and source it from the login API"
```

---

## Task 7: `LoginForm` — drop the redundant second `fetch` call

**Files:**
- Modify: `frontend/components/auth/LoginForm.tsx`
- Modify: `frontend/components/auth/LoginForm.test.tsx`

**Interfaces:**
- Consumes: `login` from `AuthProvider` (Task 6, now `Promise<AuthUser | null>`).

- [ ] **Step 1: Update the test's fetch stub to decide success/failure itself**

Replace `frontend/components/auth/LoginForm.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import LoginForm from './LoginForm'
import { AuthProvider } from '@/components/auth/AuthProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function renderLoginForm() {
  return renderWithIntl(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  )
}

function submit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Địa chỉ Email *'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Mật khẩu *'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG NHẬP' }))
}

function stubLoginFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse((init?.body as string) ?? '{}') as { email: string; password: string }
      if (body.email === 'user@twistfit.vn' && body.password === 'user1234') {
        return { ok: true, json: async () => ({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' }) }
      }
      if (body.email === 'admin@twistfit.vn' && body.password === 'admin1234') {
        return {
          ok: true,
          json: async () => ({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' }),
        }
      }
      return { ok: false, status: 401, json: async () => ({ error: 'Email hoặc mật khẩu không đúng' }) }
    })
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
    window.localStorage.clear()
    stubLoginFetch()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders the form and a link back to register', () => {
    renderLoginForm()
    expect(screen.getByLabelText('Địa chỉ Email *')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu *')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng ký ngay' })).toHaveAttribute('href', '/register')
  })

  it('calls the session login API and redirects a regular user to the homepage', async () => {
    renderLoginForm()
    submit('user@twistfit.vn', 'user1234')
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'))
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@twistfit.vn', password: 'user1234' }),
      })
    )
  })

  it('redirects an admin to /admin', async () => {
    renderLoginForm()
    submit('admin@twistfit.vn', 'admin1234')
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin'))
  })

  it('shows an error and does not redirect for invalid credentials', async () => {
    renderLoginForm()
    submit('user@twistfit.vn', 'wrongpass')
    await waitFor(() =>
      expect(screen.getByText('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')).toBeInTheDocument()
    )
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/LoginForm.test.tsx`
Expected: FAIL — `handleSubmit` still calls the now-async `login()` without `await`, so
`account` is a `Promise` (always truthy), and it still fires its own separate `fetch` call.

- [ ] **Step 3: Update `LoginForm.tsx`**

In `frontend/components/auth/LoginForm.tsx`, replace `handleSubmit`:
```ts
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const account = await login(email, password)
    if (!account) {
      setError(true)
      return
    }

    setError(false)
    router.push(account.role === 'admin' ? '/admin' : '/')
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/LoginForm.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/auth/LoginForm.tsx components/auth/LoginForm.test.tsx
git commit -m "refactor: LoginForm awaits the single async login call"
```

---

## Task 8: `RegisterForm` — actually register, then auto-login and redirect

**Files:**
- Modify: `frontend/components/auth/RegisterForm.tsx`
- Modify: `frontend/components/auth/RegisterForm.test.tsx`
- Modify: `frontend/messages/vi.json` (`Register` namespace)

**Interfaces:**
- Consumes: `login` from `AuthProvider` (Task 6); `POST /api/auth/register` (Task 4).

- [ ] **Step 1: Update `messages/vi.json`**

In `frontend/messages/vi.json`, inside `"Register"`:
- Remove the `"comingSoon"` key entirely.
- Add, alongside the existing `"errors": { "passwordMismatch": ... }`, two new keys so the
  block reads:
```json
  "errors": {
    "passwordMismatch": "Mật khẩu xác nhận không khớp",
    "emailTaken": "Email này đã được đăng ký",
    "generic": "Có lỗi xảy ra, vui lòng thử lại."
  },
```

- [ ] **Step 2: Rewrite the test for real registration behavior**

Replace `frontend/components/auth/RegisterForm.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import RegisterForm from './RegisterForm'
import { AuthProvider } from '@/components/auth/AuthProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function renderRegisterForm() {
  return renderWithIntl(
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  )
}

function fillValidForm(overrides: { password?: string; confirmPassword?: string } = {}) {
  fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Linh Đan' } })
  fireEvent.change(screen.getByLabelText('Địa chỉ Email *'), { target: { value: 'linhdan@gmail.com' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu *'), {
    target: { value: overrides.password ?? 'password123' },
  })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu *'), {
    target: { value: overrides.confirmPassword ?? 'password123' },
  })
}

describe('RegisterForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders all fields, the submit button, and a link back to login', () => {
    renderRegisterForm()
    expect(screen.getByLabelText('Họ và tên *')).toBeInTheDocument()
    expect(screen.getByLabelText('Địa chỉ Email *')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu *')).toBeInTheDocument()
    expect(screen.getByLabelText('Xác nhận mật khẩu *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ĐĂNG KÝ' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng nhập ngay' })).toHaveAttribute('href', '/login')
  })

  it('toggles password visibility', () => {
    renderRegisterForm()
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    expect(passwordInput).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getAllByLabelText('Hiện mật khẩu')[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('shows a mismatch error and never calls the API when passwords differ', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderRegisterForm()
    fillValidForm({ confirmPassword: 'somethingElse123' })
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    expect(screen.getByText('Mật khẩu xác nhận không khớp')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('registers, logs in, and redirects to the homepage on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/auth/register') {
          return {
            ok: true,
            status: 201,
            json: async () => ({ id: 1, name: 'Linh Đan', email: 'linhdan@gmail.com', role: 'user' }),
          }
        }
        return { ok: true, json: async () => ({ name: 'Linh Đan', email: 'linhdan@gmail.com', role: 'user' }) }
      })
    )
    renderRegisterForm()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'))
  })

  it('shows an email-taken error and does not redirect when the API returns 409', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'EMAIL_TAKEN' }) })
    )
    renderRegisterForm()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    await waitFor(() => expect(screen.getByText('Email này đã được đăng ký')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/RegisterForm.test.tsx`
Expected: FAIL — `RegisterForm` still only shows a "coming soon" message and never calls
`fetch`.

- [ ] **Step 4: Rewrite `RegisterForm.tsx`**

Replace `frontend/components/auth/RegisterForm.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

export default function RegisterForm() {
  const t = useTranslations('Register')
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmError, setConfirmError] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

    if (password !== confirmPassword) {
      setConfirmError(true)
      setFormError(null)
      ;(form.elements.namedItem('confirmPassword') as HTMLInputElement).focus()
      return
    }
    setConfirmError(false)

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setFormError(data.error === 'EMAIL_TAKEN' ? t('errors.emailTaken') : t('errors.generic'))
      return
    }

    setFormError(null)
    const account = await login(email, password)
    if (account) {
      router.push(account.role === 'admin' ? '/admin' : '/')
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-6 py-space-xl lg:py-24">
      <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-8 shadow-[0_12px_36px_rgba(4,28,55,0.08)] lg:p-10">
        <div className="mb-6 text-center">
          <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">{t('subtitle')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="register-name" className="text-label-md font-semibold text-on-surface">
              {t('fields.name.label')}
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              required
              placeholder={t('fields.name.placeholder')}
              className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-email" className="text-label-md font-semibold text-on-surface">
              {t('fields.email.label')}
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              required
              placeholder={t('fields.email.placeholder')}
              className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-password" className="text-label-md font-semibold text-on-surface">
              {t('fields.password.label')}
            </label>
            <div className="relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder={t('fields.password.placeholder')}
                className="w-full rounded-xl bg-surface px-4 py-3 pr-12 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-confirm-password" className="text-label-md font-semibold text-on-surface">
              {t('fields.confirmPassword.label')}
            </label>
            <div className="relative">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder={t('fields.confirmPassword.placeholder')}
                aria-invalid={confirmError}
                aria-describedby={confirmError ? 'register-confirm-password-error' : undefined}
                onChange={() => setConfirmError(false)}
                className="w-full rounded-xl bg-surface px-4 py-3 pr-12 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {confirmError && (
              <p id="register-confirm-password-error" className="text-label-sm text-error">
                {t('errors.passwordMismatch')}
              </p>
            )}
          </div>

          {formError && (
            <p className="rounded-xl bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
          >
            {t('submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-body-sm text-on-surface-variant">
          {t('haveAccount')}{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/RegisterForm.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/RegisterForm.tsx components/auth/RegisterForm.test.tsx messages/vi.json
git commit -m "feat: RegisterForm creates a real account and auto-logs in"
```

---

## Task 9: Remove `mockAccounts` and update the roadmap note

**Files:**
- Delete: `frontend/lib/auth/mockAccounts.ts`
- Delete: `frontend/lib/auth/mockAccounts.test.ts`
- Modify: `docs/admin-dashboard-roadmap.md`

By this point nothing imports `mockAccounts.ts` anymore: `session.ts` was repointed in Task 3,
`AuthProvider.tsx` in Task 6, and `app/api/auth/login/route.ts` in Task 5.

- [ ] **Step 1: Confirm no remaining references**

Run: `cd frontend && grep -rln "mockAccounts" --include="*.ts" --include="*.tsx" . | grep -v node_modules`
Expected: only `lib/auth/mockAccounts.ts` and `lib/auth/mockAccounts.test.ts` themselves.

- [ ] **Step 2: Delete the files**

```bash
cd frontend && git rm lib/auth/mockAccounts.ts lib/auth/mockAccounts.test.ts
```

- [ ] **Step 3: Run the full test suite and type check**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every test passes (mock-account tests are gone, real-account tests
from Tasks 1-8 cover the same ground and more).

- [ ] **Step 4: Update the roadmap note**

In `docs/admin-dashboard-roadmap.md`, change the status table row:
```
| Quản lý người dùng | Chưa bắt đầu |
```
to:
```
| Đăng ký/Đăng nhập tài khoản thật | ✅ Hoàn thành (quản lý user cho admin — khóa/mở, đổi vai trò — vẫn chưa làm, xem `docs/superpowers/specs/2026-09-13-real-user-accounts-design.md`) |
```

- [ ] **Step 5: Commit**

```bash
cd frontend && git add -A
git commit -m "chore: remove mock accounts now that real user accounts are live"
cd .. && git add docs/admin-dashboard-roadmap.md
git commit -m "docs: mark real user accounts (register/login) complete on the roadmap"
```

---

## Manual browser verification (required before merging)

Automated tests passing does not guarantee the real login/register flow works — a past bug in
this codebase (client-side bundling of `better-sqlite3`) was caught only by opening a browser.
Before finishing this branch:

1. Start the dev server (`cd frontend && npm run dev`).
2. Go to `/register`, create a brand-new account with a fresh email — confirm it redirects to
   `/` (not `/admin`) and the header shows the new user as logged in.
3. Log out, go to `/login`, log back in with that same new account — confirm it works.
4. Log out, log in as `admin@twistfit.vn` / `admin1234` — confirm it still works and lands on
   `/admin`.
5. Log out, log in as `user@twistfit.vn` / `user1234` — confirm it still works and lands on
   `/`.
6. Try registering again with the same email used in step 2 — confirm it shows "Email này đã
   được đăng ký" and does not redirect.
7. Try registering with mismatched passwords — confirm the existing mismatch error still shows
   and no network request fires (open devtools Network tab to check).
