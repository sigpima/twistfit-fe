# Diễn đàn — Đăng bài (Plan 1/2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a logged-in user create, edit, and delete their own forum posts, and let anyone
browse published posts by category — everything except admin moderation and the report
mechanism, which is Plan 2 (`docs/superpowers/plans/2026-09-13-forum-moderation.md`, written
after this plan is merged). On its own, this plan produces a forum where posts can be created
but never appear on the public `/forum` list yet, because nothing can move a post out of
`pending` until Plan 2 adds the admin approval queue — that is expected, not a bug.

**Architecture:** New module `frontend/lib/forum.ts` follows the exact schema/CRUD/seed
pattern used by every other domain module in this codebase, wired into `lib/getDb.ts` after
the `users` table (posts have a foreign key to `users`). Because forum actions need to know
*which* user is acting — not just whether they're an admin — `lib/auth/session.ts` gains a new
general-purpose `getSessionFromCookieHeader` (no role check), and `getAdminSessionFromCookieHeader`
is rewritten to call it. A new `AuthGate` component (sibling to the existing `AdminGate`) lets
any signed-in user access `/forum/new`, `/forum/my-posts`, and `/forum/[id]/edit`, redirecting
signed-out visitors to `/login`. The public `/forum` and `/forum/[id]` pages are plain Client
Components that fetch from the API, matching the design spec's explicit choice — this is a
deliberate difference from `/blog` and `/faq`, which read the database directly in a Server
Component, because forum visibility (of pending/rejected/hidden posts) depends on *who is
asking*, something only the signed-in session — available client-side via `AuthProvider` and
checked server-side via the cookie — can answer.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, Vitest + Testing Library,
next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-forum-design.md`

## Global Constraints

- `lib/forum.ts` query functions take `db: Database.Database` as an explicit parameter (never
  a module-level singleton) and import `better-sqlite3` **only as a type**.
- A new post is always created with `status: 'pending'`. Editing a post (`PUT`) **always**
  resets its `status` back to `'pending'`, regardless of what it was before — this is the
  pre-moderation rule from the spec, not optional behavior.
- No comments, no likes, no free-form categories — categories are the fixed enum
  `ForumCategory` (`'general' | 'outfit-showcase' | 'styling-help' | 'personal-color' |
  'sustainable-swap'`).
- No admin moderation UI, no report mechanism, no `forum_reports` table in this plan — that is
  entirely Plan 2's scope. `deleteForumPost`/the `DELETE` route do accept an admin session as
  well as the owner's, per the spec's route table, since that check is free to add now and the
  spec requires it regardless of which plan builds the admin UI that will eventually trigger it.
- Route `params` are `Promise`s — `await params` in Route Handlers; resolve with
  `params.then(...)` inside `useEffect` in Client Component pages (never React's `use()`).
- The write API routes must reject requests without a valid signed session cookie for the
  correct actor: `POST /api/forum/posts` and `POST`-like mutations need *any* logged-in user
  (`getSessionFromCookieHeader`); nothing in this plan requires an admin session.
- All new UI text goes through `next-intl` under a single root namespace, `Forum`, with one
  sub-key per component (`Forum.PostForm`, `Forum.MyPosts`, `Forum.Public`, `Forum.Detail`,
  `Forum.Edit`, `Forum.AuthGate`) plus a shared `Forum.categories` map — every Forum component
  calls `useTranslations('Forum')` and reaches its own strings with a dotted path (e.g.
  `t('PostForm.submitCreate')`, `t('categories.general')`), so the 5 category labels are
  defined exactly once and reused everywhere they're shown.
- Every new module/component gets a co-located `.test.ts`/`.test.tsx` file, written and run
  red before implementation (TDD).
- **Deliberate UX simplification vs. the spec's wording:** the spec says a non-owner visiting
  `/forum/[id]/edit` should be "redirected to `/forum/my-posts`". This plan instead shows the
  same inline `unauthorizedError` message `ForumPostForm` already displays for a failed
  `PUT`/`POST` (consistent with how `LoginForm`/`RegisterForm` report errors), because the
  client has no reliable way to know it isn't the owner *before* submitting — `AuthUser` only
  carries `name`/`email`/`role`, no numeric id, so there's nothing to compare against
  `post.authorId` up front. The server-side 403 on `PUT` still fully prevents the edit; only
  the cosmetic "redirect early" behavior is traded for a simpler, already-existing error path.

---

## Task 1: Data layer — `forum_posts` schema, CRUD, no-op seed

**Files:**
- Create: `frontend/lib/forum.ts`
- Test: `frontend/lib/forum.test.ts`

**Interfaces:**
- Consumes: `createUser` from `lib/auth/users.ts` (test only, to satisfy the `author_id`
  foreign key).
- Produces: `ForumCategory`, `FORUM_CATEGORIES: ForumCategory[]`, `ForumPostStatus`,
  `ForumPost`, `ForumPostInput`, `initSchema(db)`, `getPublishedForumPosts(db, category?)`,
  `getForumPostsByAuthorId(db, authorId)`, `getForumPostById(db, id)`, `createForumPost(db,
  authorId, input)`, `updateForumPost(db, id, input)`, `deleteForumPost(db, id)`,
  `seedIfEmpty(db)`. Consumed by Task 2 (`getDb.ts` wiring) and every later task.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/forum.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema as initUsersSchema, createUser } from './auth/users'
import {
  initSchema,
  createForumPost,
  getPublishedForumPosts,
  getForumPostsByAuthorId,
  getForumPostById,
  updateForumPost,
  deleteForumPost,
  seedIfEmpty,
  type ForumPostInput,
} from './forum'

let db: Database.Database
let authorId: number

beforeEach(() => {
  db = new Database(':memory:')
  initUsersSchema(db)
  initSchema(db)
  authorId = createUser(db, { name: 'Tác giả Test', email: 'author@twistfit.vn', password: 'password123' }).id
})

afterEach(() => {
  db.close()
})

const sampleInput: ForumPostInput = {
  title: 'Bài viết test',
  body: 'Nội dung test',
  category: 'general',
}

describe('createForumPost', () => {
  it('creates a post with status "pending" attributed to the given author', () => {
    const created = createForumPost(db, authorId, sampleInput)
    expect(created.id).toBeGreaterThan(0)
    expect(created.status).toBe('pending')
    expect(created.authorId).toBe(authorId)
    expect(created.title).toBe('Bài viết test')
  })
})

describe('getPublishedForumPosts', () => {
  it('excludes pending posts', () => {
    createForumPost(db, authorId, sampleInput)
    expect(getPublishedForumPosts(db)).toHaveLength(0)
  })

  it('returns only published posts, newest first, optionally filtered by category', () => {
    const post1 = createForumPost(db, authorId, { ...sampleInput, category: 'general' })
    const post2 = createForumPost(db, authorId, { ...sampleInput, category: 'styling-help' })
    db.prepare("UPDATE forum_posts SET status = 'published' WHERE id IN (?, ?)").run(post1.id, post2.id)

    expect(getPublishedForumPosts(db).map((p) => p.id)).toEqual([post2.id, post1.id])
    expect(getPublishedForumPosts(db, 'styling-help').map((p) => p.id)).toEqual([post2.id])
  })
})

describe('getForumPostsByAuthorId', () => {
  it("returns only that author's posts, newest first, regardless of status", () => {
    const otherAuthorId = createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' }).id
    const mine1 = createForumPost(db, authorId, sampleInput)
    createForumPost(db, otherAuthorId, sampleInput)
    const mine2 = createForumPost(db, authorId, sampleInput)

    expect(getForumPostsByAuthorId(db, authorId).map((p) => p.id)).toEqual([mine2.id, mine1.id])
  })
})

describe('updateForumPost', () => {
  it('updates fields and resets status to "pending" even if it was published', () => {
    const created = createForumPost(db, authorId, sampleInput)
    db.prepare("UPDATE forum_posts SET status = 'published' WHERE id = ?").run(created.id)

    const updated = updateForumPost(db, created.id, { ...sampleInput, title: 'Đã sửa' })
    expect(updated?.title).toBe('Đã sửa')
    expect(updated?.status).toBe('pending')
  })

  it('returns null for a post that does not exist', () => {
    expect(updateForumPost(db, 999999, sampleInput)).toBeNull()
  })
})

describe('deleteForumPost', () => {
  it('deletes a post', () => {
    const created = createForumPost(db, authorId, sampleInput)
    expect(deleteForumPost(db, created.id)).toBe(true)
    expect(getForumPostById(db, created.id)).toBeNull()
    expect(deleteForumPost(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('does nothing — forum content is never auto-seeded', () => {
    seedIfEmpty(db)
    expect(getPublishedForumPosts(db)).toHaveLength(0)
    expect(getForumPostsByAuthorId(db, authorId)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/forum.test.ts`
Expected: FAIL — `./forum` module does not exist yet.

- [ ] **Step 3: Implement `lib/forum.ts`**

Create `frontend/lib/forum.ts`:
```ts
import type Database from 'better-sqlite3'

export type ForumCategory =
  | 'general'
  | 'outfit-showcase'
  | 'styling-help'
  | 'personal-color'
  | 'sustainable-swap'

export const FORUM_CATEGORIES: ForumCategory[] = [
  'general',
  'outfit-showcase',
  'styling-help',
  'personal-color',
  'sustainable-swap',
]

export type ForumPostStatus = 'pending' | 'published' | 'rejected' | 'hidden'

export type ForumPost = {
  id: number
  title: string
  body: string
  category: ForumCategory
  status: ForumPostStatus
  authorId: number
  createdAt: string
  updatedAt: string
}

export type ForumPostInput = {
  title: string
  body: string
  category: ForumCategory
}

type ForumPostRow = {
  id: number
  title: string
  body: string
  category: string
  status: string
  author_id: number
  created_at: string
  updated_at: string
}

function rowToForumPost(row: ForumPostRow): ForumPost {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category as ForumCategory,
    status: row.status as ForumPostStatus,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      author_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getPublishedForumPosts(db: Database.Database, category?: ForumCategory): ForumPost[] {
  const rows = category
    ? (db
        .prepare("SELECT * FROM forum_posts WHERE status = 'published' AND category = ? ORDER BY id DESC")
        .all(category) as ForumPostRow[])
    : (db.prepare("SELECT * FROM forum_posts WHERE status = 'published' ORDER BY id DESC").all() as ForumPostRow[])
  return rows.map(rowToForumPost)
}

export function getForumPostsByAuthorId(db: Database.Database, authorId: number): ForumPost[] {
  const rows = db
    .prepare('SELECT * FROM forum_posts WHERE author_id = ? ORDER BY id DESC')
    .all(authorId) as ForumPostRow[]
  return rows.map(rowToForumPost)
}

export function getForumPostById(db: Database.Database, id: number): ForumPost | null {
  const row = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(id) as ForumPostRow | undefined
  return row ? rowToForumPost(row) : null
}

export function createForumPost(db: Database.Database, authorId: number, input: ForumPostInput): ForumPost {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO forum_posts (title, body, category, status, author_id, created_at, updated_at)
       VALUES (@title, @body, @category, 'pending', @authorId, @createdAt, @updatedAt)`
    )
    .run({ ...input, authorId, createdAt: now, updatedAt: now })
  const created = getForumPostById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created forum post')
  }
  return created
}

export function updateForumPost(db: Database.Database, id: number, input: ForumPostInput): ForumPost | null {
  const existing = getForumPostById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE forum_posts SET
      title = @title, body = @body, category = @category, status = 'pending', updated_at = @updatedAt
     WHERE id = @id`
  ).run({ ...input, id, updatedAt: now })
  return getForumPostById(db, id)
}

export function deleteForumPost(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM forum_posts WHERE id = ?').run(id)
  return result.changes > 0
}

export function seedIfEmpty(_db: Database.Database): void {
  // Deliberately a no-op: unlike the other CMS tables, forum content only
  // makes sense once real users post it, so there is nothing to seed. Kept
  // as a function so lib/getDb.ts's init/seed call sequence stays uniform
  // across every domain module.
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/forum.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/forum.ts lib/forum.test.ts
git commit -m "feat: add forum posts data layer with CRUD and pre-moderation reset"
```

---

## Task 2: Wire the `forum_posts` schema into the shared `getDb()` singleton

**Files:**
- Modify: `frontend/lib/getDb.ts`

**Interfaces:**
- Consumes: `initSchema`, `seedIfEmpty` from `lib/forum.ts` (Task 1).

- [ ] **Step 1: Modify `lib/getDb.ts`**

Add the import:
```ts
import { initSchema as initForumSchema, seedIfEmpty as seedForumIfEmpty } from './forum'
```
Inside `getDb()`, after the users init/seed calls (forum posts reference `users(id)`, so users
must exist first), add:
```ts
  initForumSchema(db)
  seedForumIfEmpty(db)
```

- [ ] **Step 2: Verify the whole project still compiles and tests still pass**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every existing test still passes.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/getDb.ts
git commit -m "feat: initialize the forum_posts table when opening the database"
```

---

## Task 3: General-purpose session lookup — `getSessionFromCookieHeader`

**Files:**
- Modify: `frontend/lib/auth/session.ts`
- Modify: `frontend/lib/auth/session.test.ts`

**Interfaces:**
- Produces: `getSessionFromCookieHeader(cookieHeader: string | null): SessionPayload | null` —
  same lookup as `getAdminSessionFromCookieHeader` but without the `role === 'admin'` check.
  Consumed by every forum API route task (4-6) to identify the acting user regardless of role.
- `getAdminSessionFromCookieHeader`'s signature and behavior are unchanged — it now delegates
  to the new function internally.

- [ ] **Step 1: Write the failing test**

In `frontend/lib/auth/session.test.ts`, add the import and a new `describe` block:
```ts
import {
  signPayload,
  createSessionCookieValue,
  verifySessionCookieValue,
  getAdminSessionFromCookieHeader,
  getSessionFromCookieHeader,
  SESSION_COOKIE_NAME,
  type SessionPayload,
} from './session'
```
```ts
describe('getSessionFromCookieHeader', () => {
  it('returns the session for a valid cookie regardless of role', () => {
    const value = createSessionCookieValue('user@twistfit.vn', 'user')
    const header = `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
    expect(getSessionFromCookieHeader(header)?.email).toBe('user@twistfit.vn')
    expect(getSessionFromCookieHeader(header)?.role).toBe('user')
  })

  it('returns null when the header is missing the cookie or is null', () => {
    expect(getSessionFromCookieHeader('other=1')).toBeNull()
    expect(getSessionFromCookieHeader(null)).toBeNull()
  })

  it('returns null for a tampered cookie', () => {
    const value = createSessionCookieValue('user@twistfit.vn', 'user')
    const tampered = value.slice(0, -1) + (value.at(-1) === 'a' ? 'b' : 'a')
    expect(getSessionFromCookieHeader(`${SESSION_COOKIE_NAME}=${encodeURIComponent(tampered)}`)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/auth/session.test.ts`
Expected: FAIL — `getSessionFromCookieHeader` is not exported yet.

- [ ] **Step 3: Update `session.ts`**

Replace the existing `getAdminSessionFromCookieHeader` function in `frontend/lib/auth/session.ts`
with:
```ts
export function getSessionFromCookieHeader(cookieHeader: string | null): SessionPayload | null {
  if (!cookieHeader) return null

  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
  if (!match) return null

  const rawValue = match.slice(SESSION_COOKIE_NAME.length + 1)
  return verifySessionCookieValue(decodeURIComponent(rawValue))
}

export function getAdminSessionFromCookieHeader(cookieHeader: string | null): SessionPayload | null {
  const session = getSessionFromCookieHeader(cookieHeader)
  return session?.role === 'admin' ? session : null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run lib/auth/session.test.ts`
Expected: PASS (all existing tests plus the 3 new ones — the existing
`getAdminSessionFromCookieHeader` tests are unaffected since its observable behavior didn't
change).

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/auth/session.ts lib/auth/session.test.ts
git commit -m "feat: add general-purpose session lookup for non-admin authenticated actions"
```

---

## Task 4: Forum posts API — validation + collection route (public list + create)

**Files:**
- Create: `frontend/app/api/forum/posts/validate.ts`
- Create: `frontend/app/api/forum/posts/validate.test.ts`
- Create: `frontend/app/api/forum/posts/route.ts`
- Create: `frontend/app/api/forum/posts/route.test.ts`

**Interfaces:**
- Consumes: `FORUM_CATEGORIES`, `ForumCategory`, `ForumPostInput`, `getPublishedForumPosts`,
  `createForumPost` from `lib/forum.ts` (Task 1); `getUserByEmail` from `lib/auth/users.ts`;
  `getSessionFromCookieHeader` from `lib/auth/session.ts` (Task 3); `getDb`.
- Produces: `validateForumPostBody(body: unknown): { errors: Record<string, string> } | {
  data: ForumPostInput }`; `GET`/`POST` handlers. `validateForumPostBody` and the route file's
  shape are consumed by Task 6 (`[id]` route reuses the same validator).

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/forum/posts/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateForumPostBody } from './validate'

const validBody = {
  title: 'Bài viết test',
  body: 'Nội dung test',
  category: 'general',
}

describe('validateForumPostBody', () => {
  it('accepts a valid body', () => {
    const result = validateForumPostBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = validateForumPostBody({ ...validBody, title: '  ' })
    expect('errors' in result && result.errors.title).toBeDefined()
  })

  it('rejects an empty body', () => {
    const result = validateForumPostBody({ ...validBody, body: '  ' })
    expect('errors' in result && result.errors.body).toBeDefined()
  })

  it('rejects an invalid category', () => {
    const result = validateForumPostBody({ ...validBody, category: 'not-a-category' })
    expect('errors' in result && result.errors.category).toBeDefined()
  })

  it('rejects a missing body', () => {
    expect('errors' in validateForumPostBody(null)).toBe(true)
  })
})
```

Create `frontend/app/api/forum/posts/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createUser } from '@/lib/auth/users'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema: initUsersSchema } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const { initSchema: initForumSchema } = await vi.importActual<typeof import('@/lib/forum')>('@/lib/forum')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initUsersSchema(testDb)
  initForumSchema(testDb)
  return { getDb: () => testDb }
})

function cookieFor(email: string, role: 'user' | 'admin') {
  const value = createSessionCookieValue(email, role)
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody = { title: 'Bài test', body: 'Nội dung test', category: 'general' }

beforeEach(() => {
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('GET /api/forum/posts', () => {
  it('returns an empty list when there are no published posts', async () => {
    const response = await GET(new Request('http://localhost/api/forum/posts'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('filters by category', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    db.prepare(
      `INSERT INTO forum_posts (title, body, category, status, author_id, created_at, updated_at)
       VALUES ('T', 'B', 'styling-help', 'published', ?, '2026-01-01', '2026-01-01')`
    ).run(author.id)

    const matching = await GET(new Request('http://localhost/api/forum/posts?category=styling-help'))
    expect(await matching.json()).toHaveLength(1)
    const nonMatching = await GET(new Request('http://localhost/api/forum/posts?category=general'))
    expect(await nonMatching.json()).toHaveLength(0)
  })
})

describe('POST /api/forum/posts', () => {
  it('rejects requests without a session', async () => {
    const request = new Request('http://localhost/api/forum/posts', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a post with status "pending" for a logged-in user', async () => {
    createUser(getDb(), { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const request = new Request('http://localhost/api/forum/posts', {
      method: 'POST',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.status).toBe('pending')
    expect(body.title).toBe('Bài test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    createUser(getDb(), { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const request = new Request('http://localhost/api/forum/posts', {
      method: 'POST',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
      body: JSON.stringify({ ...validBody, title: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.title).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/api/forum/posts/validate.test.ts app/api/forum/posts/route.test.ts`
Expected: FAIL — neither `validate.ts` nor `route.ts` exist yet.

- [ ] **Step 3: Implement `validate.ts`**

Create `frontend/app/api/forum/posts/validate.ts`:
```ts
import { FORUM_CATEGORIES, type ForumCategory, type ForumPostInput } from '@/lib/forum'

type RawForumPostBody = {
  title?: unknown
  body?: unknown
  category?: unknown
}

export function validateForumPostBody(
  body: unknown
): { errors: Record<string, string> } | { data: ForumPostInput } {
  const raw = (body ?? {}) as RawForumPostBody
  const errors: Record<string, string> = {}

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) errors.title = 'Tiêu đề không được để trống'

  const bodyText = typeof raw.body === 'string' ? raw.body.trim() : ''
  if (!bodyText) errors.body = 'Nội dung không được để trống'

  const category = raw.category as ForumCategory
  if (!FORUM_CATEGORIES.includes(category)) errors.category = 'Chuyên mục không hợp lệ'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { title, body: bodyText, category } }
}
```

- [ ] **Step 4: Implement `route.ts`**

Create `frontend/app/api/forum/posts/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getPublishedForumPosts, createForumPost, FORUM_CATEGORIES, type ForumCategory } from '@/lib/forum'
import { getUserByEmail } from '@/lib/auth/users'
import { getSessionFromCookieHeader } from '@/lib/auth/session'
import { validateForumPostBody } from './validate'

export async function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const categoryParam = searchParams.get('category')
  const category = (FORUM_CATEGORIES as string[]).includes(categoryParam ?? '')
    ? (categoryParam as ForumCategory)
    : undefined
  return NextResponse.json(getPublishedForumPosts(db, category))
}

export async function POST(request: Request) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const author = getUserByEmail(db, session.email)
  if (!author) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const result = validateForumPostBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createForumPost(db, author.id, result.data)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/forum/posts/validate.test.ts app/api/forum/posts/route.test.ts`
Expected: PASS (5 + 4 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add app/api/forum/posts/validate.ts app/api/forum/posts/validate.test.ts app/api/forum/posts/route.ts app/api/forum/posts/route.test.ts
git commit -m "feat: add forum posts collection API (public list + authenticated create)"
```

---

## Task 5: Forum posts API — `mine` route (own posts, every status)

**Files:**
- Create: `frontend/app/api/forum/posts/mine/route.ts`
- Create: `frontend/app/api/forum/posts/mine/route.test.ts`

**Interfaces:**
- Consumes: `getForumPostsByAuthorId` from `lib/forum.ts` (Task 1); `getUserByEmail` from
  `lib/auth/users.ts`; `getSessionFromCookieHeader` from `lib/auth/session.ts` (Task 3); `getDb`.
- Produces: `GET` handler, consumed by Task 10 (`MyForumPostList`).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/forum/posts/mine/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost } from '@/lib/forum'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema: initUsersSchema } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const { initSchema: initForumSchema } = await vi.importActual<typeof import('@/lib/forum')>('@/lib/forum')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initUsersSchema(testDb)
  initForumSchema(testDb)
  return { getDb: () => testDb }
})

function cookieFor(email: string, role: 'user' | 'admin') {
  const value = createSessionCookieValue(email, role)
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

beforeEach(() => {
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('GET /api/forum/posts/mine', () => {
  it('rejects requests without a session', async () => {
    const response = await GET(new Request('http://localhost/api/forum/posts/mine'))
    expect(response.status).toBe(401)
  })

  it("returns only the caller's own posts, regardless of status", async () => {
    const db = getDb()
    const me = createUser(db, { name: 'Tôi', email: 'me@twistfit.vn', password: 'password123' })
    const other = createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' })
    createForumPost(db, me.id, { title: 'Bài của tôi', body: 'B', category: 'general' })
    createForumPost(db, other.id, { title: 'Bài của người khác', body: 'B', category: 'general' })

    const request = new Request('http://localhost/api/forum/posts/mine', {
      headers: { cookie: cookieFor('me@twistfit.vn', 'user') },
    })
    const response = await GET(request)
    expect(response.status).toBe(200)
    const posts = await response.json()
    expect(posts).toHaveLength(1)
    expect(posts[0].title).toBe('Bài của tôi')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/api/forum/posts/mine/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `route.ts`**

Create `frontend/app/api/forum/posts/mine/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getForumPostsByAuthorId } from '@/lib/forum'
import { getUserByEmail } from '@/lib/auth/users'
import { getSessionFromCookieHeader } from '@/lib/auth/session'

export async function GET(request: Request) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const viewer = getUserByEmail(db, session.email)
  if (!viewer) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  return NextResponse.json(getForumPostsByAuthorId(db, viewer.id))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/api/forum/posts/mine/route.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/api/forum/posts/mine/route.ts app/api/forum/posts/mine/route.test.ts
git commit -m "feat: add API route for a user's own forum posts"
```

---

## Task 6: Forum posts API — single-post route (visibility, owner edit/delete)

**Files:**
- Create: `frontend/app/api/forum/posts/[id]/route.ts`
- Create: `frontend/app/api/forum/posts/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getForumPostById`, `updateForumPost`, `deleteForumPost` from `lib/forum.ts` (Task
  1); `validateForumPostBody` from Task 4; `getUserByEmail` from `lib/auth/users.ts`;
  `getSessionFromCookieHeader` from `lib/auth/session.ts` (Task 3); `getDb`.
- Produces: `GET`/`PUT`/`DELETE` handlers, consumed by Task 8 (`ForumPostForm`'s PUT call),
  Task 10 (`MyForumPostList`'s DELETE call), Task 11 (edit page's GET call), Task 13 (detail
  page's GET call).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/forum/posts/[id]/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, PUT, DELETE } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, type ForumPostInput } from '@/lib/forum'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema: initUsersSchema } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const { initSchema: initForumSchema } = await vi.importActual<typeof import('@/lib/forum')>('@/lib/forum')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initUsersSchema(testDb)
  initForumSchema(testDb)
  return { getDb: () => testDb }
})

function cookieFor(email: string, role: 'user' | 'admin') {
  const value = createSessionCookieValue(email, role)
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

const validInput: ForumPostInput = { title: 'Bài test', body: 'Nội dung test', category: 'general' }

beforeEach(() => {
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('GET /api/forum/posts/[id]', () => {
  it('returns a published post to anyone', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    db.prepare("UPDATE forum_posts SET status = 'published' WHERE id = ?").run(post.id)

    const response = await GET(new Request('http://localhost'), params(post.id))
    expect(response.status).toBe(200)
  })

  it('returns 404 for a pending post viewed by someone else', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('other@twistfit.vn', 'user') } })
    const response = await GET(request, params(post.id))
    expect(response.status).toBe(404)
  })

  it('returns a pending post to its own author', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('author@twistfit.vn', 'user') } })
    const response = await GET(request, params(post.id))
    expect(response.status).toBe(200)
  })

  it('returns a pending post to an admin', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Admin', email: 'admin2@twistfit.vn', password: 'password123' })
    db.prepare("UPDATE users SET role = 'admin' WHERE email = 'admin2@twistfit.vn'").run()
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('admin2@twistfit.vn', 'admin') } })
    const response = await GET(request, params(post.id))
    expect(response.status).toBe(200)
  })

  it('returns 404 for a non-existent post', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/forum/posts/[id]', () => {
  it('rejects requests without a session', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validInput) })
    const response = await PUT(request, params(post.id))
    expect(response.status).toBe(401)
  })

  it('rejects a user who is not the owner', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: cookieFor('other@twistfit.vn', 'user') },
      body: JSON.stringify(validInput),
    })
    const response = await PUT(request, params(post.id))
    expect(response.status).toBe(403)
  })

  it('updates the post and resets its status to "pending"', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    db.prepare("UPDATE forum_posts SET status = 'published' WHERE id = ?").run(post.id)

    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
      body: JSON.stringify({ ...validInput, title: 'Đã sửa' }),
    })
    const response = await PUT(request, params(post.id))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.title).toBe('Đã sửa')
    expect(body.status).toBe('pending')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
      body: JSON.stringify({ ...validInput, title: '' }),
    })
    const response = await PUT(request, params(post.id))
    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/forum/posts/[id]', () => {
  it('rejects requests without a session', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(post.id))
    expect(response.status).toBe(401)
  })

  it('lets the owner delete their own post', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
    })
    const response = await DELETE(request, params(post.id))
    expect(response.status).toBe(204)
  })

  it('lets an admin delete a post they do not own', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Admin', email: 'admin2@twistfit.vn', password: 'password123' })
    db.prepare("UPDATE users SET role = 'admin' WHERE email = 'admin2@twistfit.vn'").run()
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: cookieFor('admin2@twistfit.vn', 'admin') },
    })
    const response = await DELETE(request, params(post.id))
    expect(response.status).toBe(204)
  })

  it('rejects a user who is neither the owner nor an admin', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: cookieFor('other@twistfit.vn', 'user') },
    })
    const response = await DELETE(request, params(post.id))
    expect(response.status).toBe(403)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/forum/posts/\[id\]/route.test.ts"`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `frontend/app/api/forum/posts/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getForumPostById, updateForumPost, deleteForumPost } from '@/lib/forum'
import { getDb } from '@/lib/getDb'
import { getUserByEmail } from '@/lib/auth/users'
import { getSessionFromCookieHeader } from '@/lib/auth/session'
import { validateForumPostBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params
  const db = getDb()
  const post = getForumPostById(db, Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  if (post.status === 'published') {
    return NextResponse.json(post)
  }

  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  const viewer = session ? getUserByEmail(db, session.email) : null
  const isOwner = viewer?.id === post.authorId
  const isAdmin = session?.role === 'admin'
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }
  return NextResponse.json(post)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const { id } = await params
  const post = getForumPostById(db, Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const viewer = getUserByEmail(db, session.email)
  if (!viewer || viewer.id !== post.authorId) {
    return NextResponse.json({ error: 'Bạn không có quyền sửa bài này' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = validateForumPostBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateForumPost(db, post.id, result.data)
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const { id } = await params
  const post = getForumPostById(db, Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const viewer = getUserByEmail(db, session.email)
  const isOwner = viewer?.id === post.authorId
  if (!isOwner && session.role !== 'admin') {
    return NextResponse.json({ error: 'Bạn không có quyền xóa bài này' }, { status: 403 })
  }

  deleteForumPost(db, post.id)
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/forum/posts/\[id\]/route.test.ts"`
Expected: PASS (5 + 4 + 4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/forum/posts/[id]/route.ts" "app/api/forum/posts/[id]/route.test.ts"
git commit -m "feat: add single forum post API route with visibility and ownership rules"
```

---

## Task 7: `AuthGate` — gate for any signed-in user (not admin-only)

**Files:**
- Create: `frontend/components/auth/AuthGate.tsx`
- Create: `frontend/components/auth/AuthGate.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Forum` namespace, `AuthGate` sub-key)

**Interfaces:**
- Consumes: `useAuth` from `AuthProvider`.
- Produces: `AuthGate({ children })`, consumed by Tasks 9, 10, 11.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, add a new top-level `"Forum"` namespace (after `"Admin"`):
```json
  "Forum": {
    "AuthGate": {
      "checkingAccess": "Đang kiểm tra đăng nhập..."
    }
  },
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/auth/AuthGate.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AuthGate from './AuthGate'
import { AuthProvider } from '@/components/auth/AuthProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function setStoredUser(user: { name: string; email: string; role: 'user' | 'admin' } | null) {
  if (user) {
    window.localStorage.setItem('twistfit.auth', JSON.stringify(user))
  } else {
    window.localStorage.removeItem('twistfit.auth')
  }
}

function renderAuthGate() {
  return renderWithIntl(
    <AuthProvider>
      <AuthGate>
        <p>Nội dung cần đăng nhập</p>
      </AuthGate>
    </AuthProvider>
  )
}

describe('AuthGate', () => {
  beforeEach(() => {
    pushMock.mockClear()
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('redirects to /login when signed out', () => {
    setStoredUser(null)
    renderAuthGate()
    expect(pushMock).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('Nội dung cần đăng nhập')).not.toBeInTheDocument()
  })

  it('renders children for a regular signed-in user', () => {
    setStoredUser({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    renderAuthGate()
    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByText('Nội dung cần đăng nhập')).toBeInTheDocument()
  })

  it('renders children for an admin too', () => {
    setStoredUser({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    renderAuthGate()
    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByText('Nội dung cần đăng nhập')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/AuthGate.test.tsx`
Expected: FAIL — `./AuthGate` module does not exist yet.

- [ ] **Step 4: Implement `AuthGate.tsx`**

Create `frontend/components/auth/AuthGate.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

export default function AuthGate({ children }: { children: ReactNode }) {
  const t = useTranslations('Forum')
  const router = useRouter()
  const { user, isHydrated } = useAuth()

  useEffect(() => {
    if (!isHydrated) return
    if (!user) {
      router.push('/login')
    }
  }, [isHydrated, user, router])

  if (!isHydrated || !user) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-body-md text-on-surface-variant">{t('AuthGate.checkingAccess')}</p>
      </div>
    )
  }

  return <>{children}</>
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/AuthGate.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/AuthGate.tsx components/auth/AuthGate.test.tsx messages/vi.json
git commit -m "feat: add AuthGate for pages that require any signed-in user"
```

---

## Task 8: `ForumPostForm` — shared create/edit form

**Files:**
- Create: `frontend/components/forum/ForumPostForm.tsx`
- Create: `frontend/components/forum/ForumPostForm.test.tsx`
- Modify: `frontend/messages/vi.json` (`Forum.categories`, `Forum.PostForm`)

**Interfaces:**
- Consumes: `FORUM_CATEGORIES`, `ForumCategory`, `ForumPost` from `lib/forum.ts` (Task 1);
  `/api/forum/posts` (Task 4), `/api/forum/posts/[id]` (Task 6).
- Produces: `ForumPostForm({ initialPost?: ForumPost })`, consumed by Tasks 9 and 11.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside the `"Forum"` namespace added in Task 7, add
`categories` as a sibling of `AuthGate`, and a new `PostForm` sibling:
```json
  "Forum": {
    "categories": {
      "general": "Thảo luận chung",
      "outfit-showcase": "Khoe đồ",
      "styling-help": "Xin tư vấn phối đồ",
      "personal-color": "Personal Color",
      "sustainable-swap": "Trao đổi đồ cũ"
    },
    "AuthGate": {
      "checkingAccess": "Đang kiểm tra đăng nhập..."
    },
    "PostForm": {
      "fields": {
        "title": "Tiêu đề",
        "category": "Chuyên mục",
        "body": "Nội dung"
      },
      "submitCreate": "Đăng bài",
      "submitEdit": "Lưu thay đổi",
      "unauthorizedError": "Bạn không có quyền thực hiện thao tác này.",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại."
    }
  },
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/forum/ForumPostForm.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostForm from './ForumPostForm'
import type { ForumPost } from '@/lib/forum'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_POST: ForumPost = {
  id: 7,
  title: 'Bài hiện có',
  body: 'Nội dung hiện có',
  category: 'styling-help',
  status: 'published',
  authorId: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('ForumPostForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('POSTs to /api/forum/posts when creating and redirects to my-posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<ForumPostForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài mới' } })
    fireEvent.change(screen.getByLabelText('Nội dung'), { target: { value: 'Nội dung mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/forum/my-posts'))
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/forum/posts/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_POST }))
    renderWithIntl(<ForumPostForm initialPost={EXISTING_POST} />)
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài hiện có')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/forum/my-posts'))
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts/7', expect.objectContaining({ method: 'PUT' }))
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
    renderWithIntl(<ForumPostForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))

    await waitFor(() => expect(screen.getByText('Tiêu đề không được để trống')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('shows the unauthorized error and does not redirect on a 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }))
    renderWithIntl(<ForumPostForm initialPost={EXISTING_POST} />)
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(screen.getByText('Bạn không có quyền thực hiện thao tác này.')).toBeInTheDocument()
    )
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/forum/ForumPostForm.test.tsx`
Expected: FAIL — `./ForumPostForm` module does not exist yet.

- [ ] **Step 4: Implement `ForumPostForm.tsx`**

Create `frontend/components/forum/ForumPostForm.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { FORUM_CATEGORIES, type ForumCategory, type ForumPost } from '@/lib/forum'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function ForumPostForm({ initialPost }: { initialPost?: ForumPost }) {
  const t = useTranslations('Forum')
  const router = useRouter()
  const isEditing = Boolean(initialPost)

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [category, setCategory] = useState<ForumCategory>(initialPost?.category ?? FORUM_CATEGORIES[0])
  const [body, setBody] = useState(initialPost?.body ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const requestBody = { title, body, category }

    const response = await fetch(isEditing ? `/api/forum/posts/${initialPost!.id}` : '/api/forum/posts', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    setSubmitting(false)

    if (response.status === 401 || response.status === 403) {
      setErrors({ form: t('PostForm.unauthorizedError') })
      return
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setErrors(data.errors ?? { form: t('PostForm.genericError') })
      return
    }

    router.push('/forum/my-posts')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="forum-title" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.title')}
        </label>
        <input
          id="forum-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClass}
        />
        {errors.title && <p className="text-label-sm text-error">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="forum-category" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.category')}
        </label>
        <select
          id="forum-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as ForumCategory)}
          className={inputClass}
        >
          {FORUM_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {t(`categories.${value}`)}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-label-sm text-error">{errors.category}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="forum-body" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.body')}
        </label>
        <textarea
          id="forum-body"
          rows={8}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className={inputClass}
        />
        {errors.body && <p className="text-label-sm text-error">{errors.body}</p>}
      </div>

      {errors.form && <p className="text-label-sm text-error">{errors.form}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
      >
        {isEditing ? t('PostForm.submitEdit') : t('PostForm.submitCreate')}
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/forum/ForumPostForm.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/forum/ForumPostForm.tsx components/forum/ForumPostForm.test.tsx messages/vi.json
git commit -m "feat: add shared forum post create/edit form"
```

---

## Task 9: `/forum/new` page

**Files:**
- Create: `frontend/app/forum/new/page.tsx`
- Create: `frontend/app/forum/new/page.test.tsx`

**Interfaces:**
- Consumes: `AuthGate` (Task 7), `ForumPostForm` (Task 8).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/forum/new/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewForumPostPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewForumPostPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders the create form for a signed-in user', () => {
    renderWithIntl(
      <AuthProvider>
        <NewForumPostPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Đăng bài' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/forum/new/page.test.tsx`
Expected: FAIL — `./page` does not exist yet.

- [ ] **Step 3: Implement `app/forum/new/page.tsx`**

```tsx
'use client'

import AuthGate from '@/components/auth/AuthGate'
import ForumPostForm from '@/components/forum/ForumPostForm'

export default function NewForumPostPage() {
  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <ForumPostForm />
        </section>
      </AuthGate>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/forum/new/page.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/forum/new
git commit -m "feat: add /forum/new page for creating a post"
```

---

## Task 10: `MyForumPostList` + `/forum/my-posts` page

**Files:**
- Create: `frontend/components/forum/MyForumPostList.tsx`
- Create: `frontend/components/forum/MyForumPostList.test.tsx`
- Create: `frontend/app/forum/my-posts/page.tsx`
- Create: `frontend/app/forum/my-posts/page.test.tsx`
- Modify: `frontend/messages/vi.json` (`Forum.MyPosts`)

**Interfaces:**
- Consumes: `ForumPost`, `ForumPostStatus` from `lib/forum.ts` (Task 1); `GET
  /api/forum/posts/mine` (Task 5); `DELETE /api/forum/posts/[id]` (Task 6); `AuthGate` (Task 7).
- Produces: `MyForumPostList()`, default-exported `MyForumPostsPage`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Forum"`, add `MyPosts` as a sibling of `PostForm`:
```json
    "MyPosts": {
      "title": "Bài viết của tôi",
      "newButton": "Đăng bài mới",
      "emptyState": "Bạn chưa đăng bài nào.",
      "loading": "Đang tải...",
      "editButton": "Sửa",
      "deleteButton": "Xóa",
      "deleteConfirm": "Xóa bài viết này?",
      "status": {
        "pending": "Chờ duyệt",
        "published": "Đã duyệt",
        "rejected": "Bị từ chối",
        "hidden": "Đã ẩn"
      }
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/forum/MyForumPostList.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import MyForumPostList from './MyForumPostList'
import type { ForumPost } from '@/lib/forum'

const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài của tôi',
    body: 'Nội dung',
    category: 'general',
    status: 'pending',
    authorId: 5,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('MyForumPostList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders own posts with a status label and edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<MyForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài của tôi')).toBeInTheDocument())
    expect(screen.getByText('Chờ duyệt')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/forum/1/edit')
  })

  it('deletes a post when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => POSTS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<MyForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài của tôi')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Bài của tôi')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts/1', { method: 'DELETE' })
  })

  it('shows an empty state when there are no posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<MyForumPostList />)
    await waitFor(() => expect(screen.getByText('Bạn chưa đăng bài nào.')).toBeInTheDocument())
  })
})
```

Create `frontend/app/forum/my-posts/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import MyForumPostsPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('MyForumPostsPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders the heading and a link to create a new post, for a signed-in user', async () => {
    renderWithIntl(
      <AuthProvider>
        <MyForumPostsPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Bài viết của tôi' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Đăng bài mới' })).toHaveAttribute('href', '/forum/new')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/forum/MyForumPostList.test.tsx app/forum/my-posts/page.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `MyForumPostList.tsx`**

Create `frontend/components/forum/MyForumPostList.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ForumPost } from '@/lib/forum'

export default function MyForumPostList() {
  const t = useTranslations('Forum')
  const [posts, setPosts] = useState<ForumPost[] | null>(null)

  useEffect(() => {
    fetch('/api/forum/posts/mine')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('MyPosts.deleteConfirm'))) return
    await fetch(`/api/forum/posts/${id}`, { method: 'DELETE' })
    setPosts((current) => current?.filter((post) => post.id !== id) ?? null)
  }

  if (posts === null) {
    return <p className="text-body-md text-on-surface-variant">{t('MyPosts.loading')}</p>
  }

  if (posts.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('MyPosts.emptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {posts.map((post) => (
        <li key={post.id} className="rounded-2xl border border-outline-variant p-space-lg">
          <div className="flex items-center justify-between gap-space-md">
            <h2 className="text-headline-sm font-semibold text-on-surface">{post.title}</h2>
            <span className="shrink-0 rounded-full bg-surface-container px-space-md py-space-xs text-label-sm text-on-surface-variant">
              {t(`MyPosts.status.${post.status}`)}
            </span>
          </div>
          <div className="mt-space-sm flex gap-space-md">
            <Link href={`/forum/${post.id}/edit`} className="font-semibold text-primary hover:underline">
              {t('MyPosts.editButton')}
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(post.id)}
              className="font-semibold text-error hover:underline"
            >
              {t('MyPosts.deleteButton')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 5: Implement `app/forum/my-posts/page.tsx`**

Create `frontend/app/forum/my-posts/page.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AuthGate from '@/components/auth/AuthGate'
import MyForumPostList from '@/components/forum/MyForumPostList'

export default function MyForumPostsPage() {
  const t = useTranslations('Forum')

  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('MyPosts.title')}</h1>
            <Link
              href="/forum/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('MyPosts.newButton')}
            </Link>
          </div>
          <MyForumPostList />
        </section>
      </AuthGate>
    </main>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/forum/MyForumPostList.test.tsx app/forum/my-posts/page.test.tsx`
Expected: PASS (3 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/forum/MyForumPostList.tsx components/forum/MyForumPostList.test.tsx app/forum/my-posts/page.tsx app/forum/my-posts/page.test.tsx messages/vi.json
git commit -m "feat: add my-posts page listing a user's own forum posts"
```

---

## Task 11: `/forum/[id]/edit` page

**Files:**
- Create: `frontend/app/forum/[id]/edit/page.tsx`
- Create: `frontend/app/forum/[id]/edit/page.test.tsx`
- Modify: `frontend/messages/vi.json` (`Forum.Edit`)

**Interfaces:**
- Consumes: `ForumPost` from `lib/forum.ts` (Task 1); `GET /api/forum/posts/[id]` (Task 6);
  `AuthGate` (Task 7); `ForumPostForm` (Task 8).

As noted in Global Constraints, this page does not attempt to detect "not the owner" before
rendering the form — it relies on `ForumPostForm`'s existing 403 handling. It only distinguishes
"post not found or not visible to me at all" (show a message) from "post visible to me" (show
the form, which may still reject the save server-side if this viewer isn't the owner).

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Forum"`, add `Edit` as a sibling of `MyPosts`:
```json
    "Edit": {
      "notFoundBody": "Bài viết này không tồn tại hoặc bạn không có quyền sửa."
    }
```

- [ ] **Step 2: Write the failing test**

Create `frontend/app/forum/[id]/edit/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditForumPostPage from './page'
import type { ForumPost } from '@/lib/forum'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const POST: ForumPost = {
  id: 3,
  title: 'Bài cần sửa',
  body: 'Nội dung cần sửa',
  category: 'general',
  status: 'pending',
  authorId: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditForumPostPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the post by id and pre-fills the form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderWithIntl(
      <AuthProvider>
        <EditForumPostPage params={Promise.resolve({ id: '3' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts/3')
  })

  it('shows a not-found message when the post cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }))
    renderWithIntl(
      <AuthProvider>
        <EditForumPostPage params={Promise.resolve({ id: '999' })} />
      </AuthProvider>
    )
    await waitFor(() =>
      expect(screen.getByText('Bài viết này không tồn tại hoặc bạn không có quyền sửa.')).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/forum/\[id\]/edit/page.test.tsx"`
Expected: FAIL — `./page` does not exist yet.

- [ ] **Step 4: Implement `app/forum/[id]/edit/page.tsx`**

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import AuthGate from '@/components/auth/AuthGate'
import ForumPostForm from '@/components/forum/ForumPostForm'
import type { ForumPost } from '@/lib/forum'

export default function EditForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('Forum')
  const [post, setPost] = useState<ForumPost | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/forum/posts/${id}`).then((response) => {
        if (!response.ok) {
          setNotFound(true)
          return
        }
        response.json().then(setPost)
      })
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {notFound && <p className="text-body-md text-on-surface-variant">{t('Edit.notFoundBody')}</p>}
          {post && <ForumPostForm initialPost={post} />}
        </section>
      </AuthGate>
    </main>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/forum/\[id\]/edit/page.test.tsx"`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add "app/forum/[id]/edit" messages/vi.json
git commit -m "feat: add /forum/[id]/edit page"
```

---

## Task 12: `ForumPostList` (public) + `/forum` page

**Files:**
- Create: `frontend/components/forum/ForumPostList.tsx`
- Create: `frontend/components/forum/ForumPostList.test.tsx`
- Create: `frontend/app/forum/page.tsx`
- Create: `frontend/app/forum/page.test.tsx`
- Modify: `frontend/messages/vi.json` (`Forum.categoryAll`, `Forum.Public`)

**Interfaces:**
- Consumes: `FORUM_CATEGORIES`, `ForumCategory`, `ForumPost` from `lib/forum.ts` (Task 1); `GET
  /api/forum/posts` (Task 4).
- Produces: `ForumPostList()`, default-exported `ForumPage`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Forum"`, add `categoryAll` as a sibling of
`categories`, and `Public` as a sibling of `Edit`:
```json
    "categoryAll": "Tất cả",
```
```json
    "Public": {
      "title": "Diễn đàn TwistFit",
      "subtitle": "Nơi chia sẻ và xin tư vấn phối đồ cùng cộng đồng TwistFit.",
      "loading": "Đang tải...",
      "emptyState": "Chưa có bài viết nào trong chuyên mục này."
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/forum/ForumPostList.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostList from './ForumPostList'
import type { ForumPost } from '@/lib/forum'

const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài công khai',
    body: 'Nội dung',
    category: 'styling-help',
    status: 'published',
    authorId: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('ForumPostList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches published posts on mount and links to the detail page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<ForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts')
    expect(screen.getByRole('link', { name: 'Bài công khai' })).toHaveAttribute('href', '/forum/1')
  })

  it('refetches with a category query param when a filter is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<ForumPostList />)
    await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xin tư vấn phối đồ' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/forum/posts?category=styling-help'))
  })

  it('shows an empty state when there are no posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumPostList />)
    await waitFor(() => expect(screen.getByText('Chưa có bài viết nào trong chuyên mục này.')).toBeInTheDocument())
  })
})
```

Create `frontend/app/forum/page.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPage from './page'

describe('ForumPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the heading and the post list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumPage />)
    expect(screen.getByRole('heading', { name: 'Diễn đàn TwistFit' })).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/forum/posts'))
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/forum/ForumPostList.test.tsx app/forum/page.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `ForumPostList.tsx`**

Create `frontend/components/forum/ForumPostList.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FORUM_CATEGORIES, type ForumCategory, type ForumPost } from '@/lib/forum'

type CategoryFilter = 'all' | ForumCategory

export default function ForumPostList() {
  const t = useTranslations('Forum')
  const [posts, setPosts] = useState<ForumPost[] | null>(null)
  const [category, setCategory] = useState<CategoryFilter>('all')

  useEffect(() => {
    const query = category === 'all' ? '' : `?category=${category}`
    setPosts(null)
    fetch(`/api/forum/posts${query}`)
      .then((response) => response.json())
      .then(setPosts)
  }, [category])

  const filters: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: t('categoryAll') },
    ...FORUM_CATEGORIES.map((value) => ({ id: value, label: t(`categories.${value}`) })),
  ]

  return (
    <div>
      <div className="flex items-center gap-space-xs overflow-x-auto pb-space-sm">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setCategory(filter.id)}
            className={`shrink-0 rounded-full px-space-lg py-space-sm text-label-lg transition-all duration-200 ${
              category === filter.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {posts === null && <p className="mt-space-lg text-body-md text-on-surface-variant">{t('Public.loading')}</p>}
      {posts !== null && posts.length === 0 && (
        <p className="mt-space-lg text-body-md text-on-surface-variant">{t('Public.emptyState')}</p>
      )}
      {posts !== null && posts.length > 0 && (
        <ul className="mt-space-lg space-y-space-md">
          {posts.map((post) => (
            <li key={post.id} className="rounded-2xl border border-outline-variant p-space-lg">
              <Link
                href={`/forum/${post.id}`}
                className="text-headline-sm font-semibold text-on-surface hover:underline"
              >
                {post.title}
              </Link>
              <p className="mt-space-xs text-label-sm text-on-surface-variant">{t(`categories.${post.category}`)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Implement `app/forum/page.tsx`**

Create `frontend/app/forum/page.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import ForumPostList from '@/components/forum/ForumPostList'

export default function ForumPage() {
  const t = useTranslations('Forum')

  return (
    <main className="w-full bg-surface">
      <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
        <div className="mb-6 text-center">
          <h1 className="text-headline-lg font-bold text-on-surface">{t('Public.title')}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">{t('Public.subtitle')}</p>
        </div>
        <ForumPostList />
      </section>
    </main>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/forum/ForumPostList.test.tsx app/forum/page.test.tsx`
Expected: PASS (3 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/forum/ForumPostList.tsx components/forum/ForumPostList.test.tsx app/forum/page.tsx app/forum/page.test.tsx messages/vi.json
git commit -m "feat: add public forum listing page with category filter"
```

---

## Task 13: `ForumPostDetail` + `/forum/[id]` page

**Files:**
- Create: `frontend/components/forum/ForumPostDetail.tsx`
- Create: `frontend/components/forum/ForumPostDetail.test.tsx`
- Create: `frontend/app/forum/[id]/page.tsx`
- Create: `frontend/app/forum/[id]/page.test.tsx`
- Modify: `frontend/messages/vi.json` (`Forum.Detail`)

**Interfaces:**
- Consumes: `ForumPost` from `lib/forum.ts` (Task 1); `GET /api/forum/posts/[id]` (Task 6).
- Produces: `ForumPostDetail({ id: string })`, default-exported `ForumPostPage`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Forum"`, add `Detail` as a sibling of `Public`:
```json
    "Detail": {
      "backLink": "← Quay lại Diễn đàn",
      "notFoundTitle": "Không tìm thấy bài viết",
      "notFoundBody": "Bài viết này không tồn tại hoặc bạn không có quyền xem."
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/forum/ForumPostDetail.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostDetail from './ForumPostDetail'
import type { ForumPost } from '@/lib/forum'

const POST: ForumPost = {
  id: 9,
  title: 'Bài chi tiết',
  body: 'Nội dung chi tiết',
  category: 'general',
  status: 'published',
  authorId: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('ForumPostDetail', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders the post', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderWithIntl(<ForumPostDetail id="9" />)
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts/9')
  })

  it('shows a not-found message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }))
    renderWithIntl(<ForumPostDetail id="999" />)
    await waitFor(() => expect(screen.getByText('Không tìm thấy bài viết')).toBeInTheDocument())
  })
})
```

Create `frontend/app/forum/[id]/page.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostPage from './page'
import type { ForumPost } from '@/lib/forum'

const POST: ForumPost = {
  id: 4,
  title: 'Bài test route',
  body: 'Nội dung',
  category: 'general',
  status: 'published',
  authorId: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('ForumPostPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves params and renders the post detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderWithIntl(<ForumPostPage params={Promise.resolve({ id: '4' })} />)
    await waitFor(() => expect(screen.getByText('Bài test route')).toBeInTheDocument())
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx "app/forum/\[id\]/page.test.tsx"`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `ForumPostDetail.tsx`**

Create `frontend/components/forum/ForumPostDetail.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ForumPost } from '@/lib/forum'

export default function ForumPostDetail({ id }: { id: string }) {
  const t = useTranslations('Forum.Detail')
  const [post, setPost] = useState<ForumPost | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/forum/posts/${id}`).then((response) => {
      if (!response.ok) {
        setNotFound(true)
        return
      }
      response.json().then(setPost)
    })
  }, [id])

  return (
    <article className="mx-auto max-w-3xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
      <Link href="/forum" className="text-label-md font-semibold text-primary hover:underline">
        {t('backLink')}
      </Link>
      {notFound && (
        <div className="mt-space-lg">
          <h1 className="text-headline-md font-bold text-on-surface">{t('notFoundTitle')}</h1>
          <p className="mt-space-xs text-body-md text-on-surface-variant">{t('notFoundBody')}</p>
        </div>
      )}
      {post && (
        <>
          <h1 className="mt-space-md text-headline-lg font-bold text-on-surface">{post.title}</h1>
          <p className="mt-space-xs whitespace-pre-wrap text-body-md text-on-surface">{post.body}</p>
        </>
      )}
    </article>
  )
}
```

- [ ] **Step 5: Implement `app/forum/[id]/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import ForumPostDetail from '@/components/forum/ForumPostDetail'

export default function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then((resolved) => setId(resolved.id))
  }, [params])

  return <main className="w-full bg-surface">{id && <ForumPostDetail id={id} />}</main>
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx "app/forum/\[id\]/page.test.tsx"`
Expected: PASS (2 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/forum/ForumPostDetail.tsx components/forum/ForumPostDetail.test.tsx "app/forum/[id]/page.tsx" "app/forum/[id]/page.test.tsx" messages/vi.json
git commit -m "feat: add forum post detail page"
```

---

## Task 14: Full verification + scoped manual browser check

- [ ] **Step 1: Run the full test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS — every test in the project, including all forum tests added above.

- [ ] **Step 2: Lint**

Run: `cd frontend && npx eslint .`
Expected: no errors.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test in a real browser**

This plan alone cannot demonstrate a post going public — that requires Plan 2's moderation
queue. Verify what this plan *does* deliver:

1. Start the dev server (`cd frontend && npm run dev`).
2. Visit `/forum` while signed out — confirm it loads with an empty list and the category
   filter buttons render.
3. Try visiting `/forum/new` while signed out — confirm it redirects to `/login`.
4. Log in as `user@twistfit.vn` / `user1234`. Go to `/forum/new`, create a post. Confirm it
   redirects to `/forum/my-posts` and the new post shows there with a "Chờ duyệt" badge.
5. Confirm the new post does **not** appear on the public `/forum` list (expected — nothing
   has approved it yet).
6. Click "Sửa" on the post, change the title, save — confirm it's still "Chờ duyệt" and the
   title updated on `/forum/my-posts`.
7. Click "Xóa", confirm the browser confirm dialog, confirm the post disappears from
   `/forum/my-posts`.
8. Log out, log in as `admin@twistfit.vn` / `admin1234`, go to `/forum/new` — confirm an admin
   can also create a post (nothing in this plan blocks that; moderation of it is Plan 2's job).
9. Check the browser console for errors on `/forum`, `/forum/new`, and `/forum/my-posts` — in
   particular confirm there is **no** `Module not found: Can't resolve 'fs'` error (the
   recurring failure mode from bundling `better-sqlite3` into client code).

- [ ] **Step 5: Commit**

No doc update in this step — `docs/admin-dashboard-roadmap.md`'s "Diễn đàn (đăng bài + kiểm
duyệt)" line covers both plans together and is updated at the end of Plan 2, once the feature
is actually usable end-to-end. If Step 1-4 above required any fixes, commit them now with an
appropriate message; otherwise there is nothing to commit in this task.
