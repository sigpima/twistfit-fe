# Diễn đàn — Kiểm duyệt + Report (Plan 2/2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Forum sub-project by adding admin moderation (approve/reject a pending
post, hide a published one, delete any post) and the report mechanism (a logged-in user flags
a post with a reason; admin sees an open-report queue and marks it handled). Once this plan
merges, the end-to-end flow works: a user posts → an admin approves it → it appears on the
public `/forum` list — something Plan 1 alone could never demonstrate.

**Architecture:** Extends `frontend/lib/forum.ts` (already on master from Plan 1) with a second
table, `forum_reports`, and new query functions — no new module. The existing single-post API
route (`frontend/app/api/forum/posts/[id]/route.ts`) gains a `PATCH` handler for admin-only
status changes, alongside its existing `GET`/`PUT`/`DELETE`. A new nested route
(`posts/[id]/report`) lets any signed-in user file a report; two new `moderation/*` routes feed
the admin queue UI; a `reports/[id]` route resolves one. Two new admin-only components
(`ForumModerationQueue`, `ForumReportQueue`) live in `components/admin/` — matching where every
other admin CRUD component in this codebase lives — while the report *submission* UI is added
to the existing public-facing `ForumPostDetail` component in `components/forum/`.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, Vitest + Testing Library,
next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-forum-design.md`

## Global Constraints

- Status transitions are a fixed allow-list, enforced server-side: `pending → published`,
  `pending → rejected`, `published → hidden`. Every other pair (including a post staying at
  the same status, or a transition out of `rejected`/`hidden`) is a 400.
- Visibility logic ("can this viewer see this post?") is defined **once**, in
  `lib/forum.ts`'s new `canViewForumPost`, and reused by both the single-post `GET` route
  (already existed, now refactored to call it) and the new report route — no duplicated
  ownership-or-admin checks.
- Report reason is a single required free-text field — no fixed reason taxonomy (per spec).
  Because it is a single field, its validation is inline in the route handler rather than a
  separate `validate.ts` file — the multi-field `validate.ts` pattern used elsewhere in this
  codebase (`ForumPostForm`, `TeamForm`, etc.) exists to keep several field-level error
  messages organized; one field doesn't need that structure.
- Handling a report (marking it resolved) is independent of acting on the reported post (hide
  or delete) — the admin UI exposes both as separate buttons, per the spec's explicit
  non-goal ("Report không tự động ẩn bài").
- Admin-only routes use `getAdminSessionFromCookieHeader`; the report-submission route uses
  the general `getSessionFromCookieHeader` (any signed-in user, added in Plan 1).
- Admin moderation components go in `components/admin/` (matching `TeamForm`, `TeamList`,
  etc.); the report-submission UI is added to the existing public `components/forum/ForumPostDetail.tsx`.
- Every new/changed module gets its test written and run red before implementation (TDD).
- This is the last plan of the Forum sub-project — its final task updates
  `docs/admin-dashboard-roadmap.md`'s "Diễn đàn (đăng bài + kiểm duyệt)" row to done.

---

## Task 1: Data layer — `forum_reports` schema, moderation queries, report CRUD

**Files:**
- Modify: `frontend/lib/forum.ts`
- Modify: `frontend/lib/forum.test.ts`

**Interfaces:**
- Consumes: `createUser` from `lib/auth/users.ts` (test only); `type Role` from
  `lib/auth/users.ts` (type-only import).
- Produces: `ForumReportStatus`, `ForumReport`, `getPendingForumPosts(db)`,
  `setForumPostStatus(db, id, status)`, `canViewForumPost(post, viewerId, viewerRole)`,
  `createForumReport(db, postId, reporterId, reason)`, `getForumReportById(db, id)`,
  `getOpenForumReports(db)`, `resolveForumReport(db, id)`. Consumed by every later task in
  this plan.

- [ ] **Step 1: Write the failing tests**

In `frontend/lib/forum.test.ts`, update the import line to pull in the new functions:
```ts
import {
  initSchema,
  createForumPost,
  getPublishedForumPosts,
  getForumPostsByAuthorId,
  getForumPostById,
  updateForumPost,
  deleteForumPost,
  seedIfEmpty,
  getPendingForumPosts,
  setForumPostStatus,
  canViewForumPost,
  createForumReport,
  getForumReportById,
  getOpenForumReports,
  resolveForumReport,
  type ForumPostInput,
} from './forum'
```

Append these `describe` blocks at the end of the file (after the existing `seedIfEmpty` block):
```ts
describe('getPendingForumPosts', () => {
  it('returns only pending posts, oldest first', () => {
    const post1 = createForumPost(db, authorId, sampleInput)
    const post2 = createForumPost(db, authorId, sampleInput)
    setForumPostStatus(db, post2.id, 'published')
    expect(getPendingForumPosts(db).map((p) => p.id)).toEqual([post1.id])
  })
})

describe('setForumPostStatus', () => {
  it('updates the status field', () => {
    const created = createForumPost(db, authorId, sampleInput)
    const updated = setForumPostStatus(db, created.id, 'published')
    expect(updated?.status).toBe('published')
  })

  it('returns null for a post that does not exist', () => {
    expect(setForumPostStatus(db, 999999, 'published')).toBeNull()
  })
})

describe('canViewForumPost', () => {
  it('lets anyone view a published post', () => {
    const created = createForumPost(db, authorId, sampleInput)
    const published = setForumPostStatus(db, created.id, 'published')!
    expect(canViewForumPost(published, null, null)).toBe(true)
  })

  it('lets only the owner or an admin view a pending post', () => {
    const created = createForumPost(db, authorId, sampleInput)
    expect(canViewForumPost(created, authorId, 'user')).toBe(true)
    expect(canViewForumPost(created, 999999, 'user')).toBe(false)
    expect(canViewForumPost(created, 999999, 'admin')).toBe(true)
    expect(canViewForumPost(created, null, null)).toBe(false)
  })
})

describe('forum reports', () => {
  it('creates a report attributed to the reporter, joined with post info', () => {
    const created = createForumPost(db, authorId, sampleInput)
    const reporterId = createUser(db, {
      name: 'Người báo cáo',
      email: 'reporter@twistfit.vn',
      password: 'password123',
    }).id
    const report = createForumReport(db, created.id, reporterId, 'Nội dung không phù hợp')
    expect(report.status).toBe('open')
    expect(report.postTitle).toBe(sampleInput.title)
    expect(report.postStatus).toBe('pending')
    expect(getForumReportById(db, report.id)?.reason).toBe('Nội dung không phù hợp')
  })

  it('lists only open reports, oldest first', () => {
    const created = createForumPost(db, authorId, sampleInput)
    const reporterId = createUser(db, {
      name: 'Người báo cáo',
      email: 'reporter@twistfit.vn',
      password: 'password123',
    }).id
    const report1 = createForumReport(db, created.id, reporterId, 'Lý do 1')
    const report2 = createForumReport(db, created.id, reporterId, 'Lý do 2')
    resolveForumReport(db, report1.id)
    expect(getOpenForumReports(db).map((r) => r.id)).toEqual([report2.id])
  })

  it('resolveForumReport returns null for a report that does not exist', () => {
    expect(resolveForumReport(db, 999999)).toBeNull()
  })

  it('deletes reports when their post is deleted (cascade)', () => {
    const created = createForumPost(db, authorId, sampleInput)
    const reporterId = createUser(db, {
      name: 'Người báo cáo',
      email: 'reporter@twistfit.vn',
      password: 'password123',
    }).id
    const report = createForumReport(db, created.id, reporterId, 'Lý do')
    deleteForumPost(db, created.id)
    expect(getForumReportById(db, report.id)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run lib/forum.test.ts`
Expected: FAIL — none of the new functions exist yet.

- [ ] **Step 3: Update `lib/forum.ts`**

Add this import near the top, alongside the existing `better-sqlite3` type import:
```ts
import type { Role } from '@/lib/auth/users'
```

In `initSchema`, add a second `CREATE TABLE` and the `foreign_keys` pragma (needed for
`ON DELETE CASCADE` to actually fire — the production DB gets this pragma from `lib/db.ts`'s
`initSchema`, which always runs first in `getDb.ts`'s chain, but a test that creates its own
`:memory:` database and calls only `initSchema` from `lib/forum.ts` needs it set here too):
```ts
export function initSchema(db: Database.Database): void {
  db.pragma('foreign_keys = ON')
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

    CREATE TABLE IF NOT EXISTS forum_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL
    );
  `)
}
```

Add these types near the existing `ForumPost`/`ForumPostStatus` types:
```ts
export type ForumReportStatus = 'open' | 'resolved'

export type ForumReport = {
  id: number
  postId: number
  postTitle: string
  postStatus: ForumPostStatus
  reporterId: number
  reason: string
  status: ForumReportStatus
  createdAt: string
}

type ForumReportRow = {
  id: number
  post_id: number
  post_title: string
  post_status: string
  reporter_id: number
  reason: string
  status: string
  created_at: string
}

function rowToForumReport(row: ForumReportRow): ForumReport {
  return {
    id: row.id,
    postId: row.post_id,
    postTitle: row.post_title,
    postStatus: row.post_status as ForumPostStatus,
    reporterId: row.reporter_id,
    reason: row.reason,
    status: row.status as ForumReportStatus,
    createdAt: row.created_at,
  }
}
```

Add these functions after `deleteForumPost` and before `seedIfEmpty`:
```ts
export function getPendingForumPosts(db: Database.Database): ForumPost[] {
  const rows = db
    .prepare("SELECT * FROM forum_posts WHERE status = 'pending' ORDER BY id ASC")
    .all() as ForumPostRow[]
  return rows.map(rowToForumPost)
}

export function setForumPostStatus(
  db: Database.Database,
  id: number,
  status: ForumPostStatus
): ForumPost | null {
  const existing = getForumPostById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare('UPDATE forum_posts SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id)
  return getForumPostById(db, id)
}

export function canViewForumPost(post: ForumPost, viewerId: number | null, viewerRole: Role | null): boolean {
  if (post.status === 'published') return true
  if (viewerId !== null && viewerId === post.authorId) return true
  if (viewerRole === 'admin') return true
  return false
}

const FORUM_REPORT_SELECT = `
  SELECT forum_reports.id AS id, forum_reports.post_id AS post_id,
         forum_posts.title AS post_title, forum_posts.status AS post_status,
         forum_reports.reporter_id AS reporter_id, forum_reports.reason AS reason,
         forum_reports.status AS status, forum_reports.created_at AS created_at
  FROM forum_reports
  JOIN forum_posts ON forum_posts.id = forum_reports.post_id
`

export function getForumReportById(db: Database.Database, id: number): ForumReport | null {
  const row = db.prepare(`${FORUM_REPORT_SELECT} WHERE forum_reports.id = ?`).get(id) as
    | ForumReportRow
    | undefined
  return row ? rowToForumReport(row) : null
}

export function getOpenForumReports(db: Database.Database): ForumReport[] {
  const rows = db
    .prepare(`${FORUM_REPORT_SELECT} WHERE forum_reports.status = 'open' ORDER BY forum_reports.id ASC`)
    .all() as ForumReportRow[]
  return rows.map(rowToForumReport)
}

export function createForumReport(
  db: Database.Database,
  postId: number,
  reporterId: number,
  reason: string
): ForumReport {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO forum_reports (post_id, reporter_id, reason, status, created_at)
       VALUES (?, ?, ?, 'open', ?)`
    )
    .run(postId, reporterId, reason, now)
  const created = getForumReportById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created forum report')
  }
  return created
}

export function resolveForumReport(db: Database.Database, id: number): ForumReport | null {
  const existing = getForumReportById(db, id)
  if (!existing) return null
  db.prepare("UPDATE forum_reports SET status = 'resolved' WHERE id = ?").run(id)
  return getForumReportById(db, id)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run lib/forum.test.ts`
Expected: PASS (8 existing + 11 new = 19 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/forum.ts lib/forum.test.ts
git commit -m "feat: add forum reports data layer and moderation queries"
```

---

## Task 2: Status-transition validator

**Files:**
- Create: `frontend/app/api/forum/posts/[id]/validateStatus.ts`
- Create: `frontend/app/api/forum/posts/[id]/validateStatus.test.ts`

**Interfaces:**
- Consumes: `ForumPostStatus` from `lib/forum.ts` (Task 1).
- Produces: `validateStatusChangeBody(body: unknown, currentStatus: ForumPostStatus): { error:
  string } | { data: { status: ForumPostStatus } }`. Consumed by Task 3.

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/forum/posts/[id]/validateStatus.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateStatusChangeBody } from './validateStatus'

describe('validateStatusChangeBody', () => {
  it('allows pending -> published', () => {
    expect('data' in validateStatusChangeBody({ status: 'published' }, 'pending')).toBe(true)
  })

  it('allows pending -> rejected', () => {
    expect('data' in validateStatusChangeBody({ status: 'rejected' }, 'pending')).toBe(true)
  })

  it('allows published -> hidden', () => {
    expect('data' in validateStatusChangeBody({ status: 'hidden' }, 'published')).toBe(true)
  })

  it('rejects pending -> hidden', () => {
    expect('error' in validateStatusChangeBody({ status: 'hidden' }, 'pending')).toBe(true)
  })

  it('rejects a no-op transition (published -> published)', () => {
    expect('error' in validateStatusChangeBody({ status: 'published' }, 'published')).toBe(true)
  })

  it('rejects transitions out of a terminal state', () => {
    expect('error' in validateStatusChangeBody({ status: 'published' }, 'rejected')).toBe(true)
    expect('error' in validateStatusChangeBody({ status: 'published' }, 'hidden')).toBe(true)
  })

  it('rejects a missing or invalid status', () => {
    expect('error' in validateStatusChangeBody({}, 'pending')).toBe(true)
    expect('error' in validateStatusChangeBody({ status: 'not-a-status' }, 'pending')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/forum/posts/\[id\]/validateStatus.test.ts"`
Expected: FAIL — `./validateStatus` does not exist yet.

- [ ] **Step 3: Implement `validateStatus.ts`**

Create `frontend/app/api/forum/posts/[id]/validateStatus.ts`:
```ts
import type { ForumPostStatus } from '@/lib/forum'

const ALLOWED_TRANSITIONS: Record<ForumPostStatus, ForumPostStatus[]> = {
  pending: ['published', 'rejected'],
  published: ['hidden'],
  rejected: [],
  hidden: [],
}

type RawStatusBody = { status?: unknown }

export function validateStatusChangeBody(
  body: unknown,
  currentStatus: ForumPostStatus
): { error: string } | { data: { status: ForumPostStatus } } {
  const raw = (body ?? {}) as RawStatusBody
  const status = raw.status as ForumPostStatus
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []
  if (!allowed.includes(status)) {
    return { error: 'Chuyển trạng thái không hợp lệ' }
  }
  return { data: { status } }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/forum/posts/\[id\]/validateStatus.test.ts"`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/forum/posts/[id]/validateStatus.ts" "app/api/forum/posts/[id]/validateStatus.test.ts"
git commit -m "feat: add status-transition validator for forum post moderation"
```

---

## Task 3: `PATCH /api/forum/posts/[id]` (admin status change) + refactor `GET` to use `canViewForumPost`

**Files:**
- Modify: `frontend/app/api/forum/posts/[id]/route.ts`
- Modify: `frontend/app/api/forum/posts/[id]/route.test.ts`

**Interfaces:**
- Consumes: `setForumPostStatus`, `canViewForumPost` from `lib/forum.ts` (Task 1);
  `validateStatusChangeBody` from Task 2; `getAdminSessionFromCookieHeader` from
  `lib/auth/session.ts`.
- Produces: `PATCH` handler, consumed by Task 5 (`ForumModerationQueue`) and Task 10
  (`ForumReportQueue`'s "Ẩn bài" button).

- [ ] **Step 1: Add the failing tests**

Append to `frontend/app/api/forum/posts/[id]/route.test.ts` (the `PATCH` import needs adding to
the existing `import { GET, PUT, DELETE } from './route'` line — change it to `import { GET, PUT,
PATCH, DELETE } from './route'`):
```ts
describe('PATCH /api/forum/posts/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    const request = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    })
    const response = await PATCH(request, params(post.id))
    expect(response.status).toBe(401)
  })

  it('rejects a non-admin session', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
      body: JSON.stringify({ status: 'published' }),
    })
    const response = await PATCH(request, params(post.id))
    expect(response.status).toBe(401)
  })

  it('approves a pending post', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') },
      body: JSON.stringify({ status: 'published' }),
    })
    const response = await PATCH(request, params(post.id))
    expect(response.status).toBe(200)
    expect((await response.json()).status).toBe('published')
  })

  it('rejects an invalid transition', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') },
      body: JSON.stringify({ status: 'hidden' }),
    })
    const response = await PATCH(request, params(post.id))
    expect(response.status).toBe(400)
  })

  it('returns 404 for a non-existent post', async () => {
    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') },
      body: JSON.stringify({ status: 'published' }),
    })
    const response = await PATCH(request, params(999999))
    expect(response.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/forum/posts/\[id\]/route.test.ts"`
Expected: FAIL — `PATCH` is not exported from `./route` yet.

- [ ] **Step 3: Update `route.ts`**

Replace `frontend/app/api/forum/posts/[id]/route.ts`:
```ts
import { NextResponse } from 'next/server'
import {
  getForumPostById,
  updateForumPost,
  deleteForumPost,
  setForumPostStatus,
  canViewForumPost,
} from '@/lib/forum'
import { getDb } from '@/lib/getDb'
import { getUserByEmail } from '@/lib/auth/users'
import { getSessionFromCookieHeader, getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateForumPostBody } from '../validate'
import { validateStatusChangeBody } from './validateStatus'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params
  const db = getDb()
  const post = getForumPostById(db, Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  const viewer = session ? getUserByEmail(db, session.email) : null
  if (!canViewForumPost(post, viewer?.id ?? null, session?.role ?? null)) {
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

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const { id } = await params
  const post = getForumPostById(db, Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const result = validateStatusChangeBody(body, post.status)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const updated = setForumPostStatus(db, post.id, result.data.status)
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

Note: `GET`'s behavior is unchanged (it now calls `canViewForumPost` instead of inlining the
same two comparisons), so every pre-existing `GET` test from Plan 1 keeps passing unmodified.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/forum/posts/\[id\]/route.test.ts"`
Expected: PASS (13 existing + 5 new = 18 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/forum/posts/[id]/route.ts" "app/api/forum/posts/[id]/route.test.ts"
git commit -m "feat: add admin status-change endpoint to the single forum post route"
```

---

## Task 4: `POST /api/forum/posts/[id]/report`

**Files:**
- Create: `frontend/app/api/forum/posts/[id]/report/route.ts`
- Create: `frontend/app/api/forum/posts/[id]/report/route.test.ts`

**Interfaces:**
- Consumes: `getForumPostById`, `createForumReport`, `canViewForumPost` from `lib/forum.ts`
  (Task 1); `getUserByEmail` from `lib/auth/users.ts`; `getSessionFromCookieHeader` from
  `lib/auth/session.ts`.
- Produces: `POST` handler, consumed by Task 5 (`ForumPostDetail`'s report form).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/forum/posts/[id]/report/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { POST } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, setForumPostStatus, type ForumPostInput } from '@/lib/forum'
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
  getDb().exec('DELETE FROM forum_reports')
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('POST /api/forum/posts/[id]/report', () => {
  it('rejects requests without a session', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ reason: 'Spam' }) })
    const response = await POST(request, params(post.id))
    expect(response.status).toBe(401)
  })

  it('creates a report for a visible post', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    setForumPostStatus(db, post.id, 'published')

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { cookie: cookieFor('reporter@twistfit.vn', 'user') },
      body: JSON.stringify({ reason: 'Nội dung không phù hợp' }),
    })
    const response = await POST(request, params(post.id))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.reason).toBe('Nội dung không phù hợp')
    expect(body.postId).toBe(post.id)
  })

  it('returns 400 when the reason is missing', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    setForumPostStatus(db, post.id, 'published')

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { cookie: cookieFor('reporter@twistfit.vn', 'user') },
      body: JSON.stringify({ reason: '  ' }),
    })
    const response = await POST(request, params(post.id))
    expect(response.status).toBe(400)
  })

  it('returns 404 for a post the reporter cannot view', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { cookie: cookieFor('reporter@twistfit.vn', 'user') },
      body: JSON.stringify({ reason: 'Spam' }),
    })
    const response = await POST(request, params(post.id))
    expect(response.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/forum/posts/\[id\]/report/route.test.ts"`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `route.ts`**

Create `frontend/app/api/forum/posts/[id]/report/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getForumPostById, createForumReport, canViewForumPost } from '@/lib/forum'
import { getDb } from '@/lib/getDb'
import { getUserByEmail } from '@/lib/auth/users'
import { getSessionFromCookieHeader } from '@/lib/auth/session'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const reporter = getUserByEmail(db, session.email)
  if (!reporter) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const { id } = await params
  const post = getForumPostById(db, Number(id))
  if (!post || !canViewForumPost(post, reporter.id, session.role)) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as { reason?: unknown } | null
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  if (!reason) {
    return NextResponse.json({ error: 'Vui lòng nhập lý do báo cáo' }, { status: 400 })
  }

  const report = createForumReport(db, post.id, reporter.id, reason)
  return NextResponse.json(report, { status: 201 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/forum/posts/\[id\]/report/route.test.ts"`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/forum/posts/[id]/report/route.ts" "app/api/forum/posts/[id]/report/route.test.ts"
git commit -m "feat: add forum post report API route"
```

---

## Task 5: Report-submission UI in `ForumPostDetail`

**Files:**
- Modify: `frontend/components/forum/ForumPostDetail.tsx`
- Modify: `frontend/components/forum/ForumPostDetail.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Forum.Report` namespace)

**Interfaces:**
- Consumes: `useAuth` from `AuthProvider`; `POST /api/forum/posts/[id]/report` (Task 4).

This is the piece of Plan 2 the design spec's own plan-split section didn't spell out as a
separate item (it only listed the API endpoints and the admin page) but which the feature
needs to be usable at all: nothing else in the UI ever calls the report endpoint.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Forum"`, add `Report` as a sibling of `Detail`:
```json
    "Report": {
      "reportButton": "Báo cáo bài viết",
      "reasonPlaceholder": "Mô tả lý do báo cáo...",
      "submitButton": "Gửi báo cáo",
      "successMessage": "Đã gửi báo cáo, cảm ơn bạn.",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại."
    }
```

- [ ] **Step 2: Write the failing tests**

Replace `frontend/components/forum/ForumPostDetail.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostDetail from './ForumPostDetail'
import { AuthProvider } from '@/components/auth/AuthProvider'
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

function renderDetail() {
  return renderWithIntl(
    <AuthProvider>
      <ForumPostDetail id="9" />
    </AuthProvider>
  )
}

describe('ForumPostDetail', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches and renders the post', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts/9')
  })

  it('shows a not-found message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Không tìm thấy bài viết')).toBeInTheDocument())
  })

  it('does not show a report button when signed out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Báo cáo bài viết' })).not.toBeInTheDocument()
  })

  it('lets a signed-in user submit a report', async () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Báo cáo bài viết' }))
    fireEvent.change(screen.getByPlaceholderText('Mô tả lý do báo cáo...'), {
      target: { value: 'Spam' },
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gửi báo cáo' }))

    await waitFor(() => expect(screen.getByText('Đã gửi báo cáo, cảm ơn bạn.')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/api/forum/posts/9/report',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ reason: 'Spam' }) })
    )
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx`
Expected: FAIL — no report button exists yet, and rendering without `AuthProvider` throws.

- [ ] **Step 4: Update `ForumPostDetail.tsx`**

Replace `frontend/components/forum/ForumPostDetail.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { ForumPost } from '@/lib/forum'

export default function ForumPostDetail({ id }: { id: string }) {
  const t = useTranslations('Forum')
  const { user } = useAuth()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reason, setReason] = useState('')
  const [reportMessage, setReportMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/forum/posts/${id}`).then((response) => {
      if (!response.ok) {
        setNotFound(true)
        return
      }
      response.json().then(setPost)
    })
  }, [id])

  async function handleSubmitReport() {
    const response = await fetch(`/api/forum/posts/${id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (!response.ok) {
      setReportMessage(t('Report.genericError'))
      return
    }
    setReportMessage(t('Report.successMessage'))
    setShowReportForm(false)
    setReason('')
  }

  return (
    <article className="mx-auto max-w-3xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
      <Link href="/forum" className="text-label-md font-semibold text-primary hover:underline">
        {t('Detail.backLink')}
      </Link>
      {notFound && (
        <div className="mt-space-lg">
          <h1 className="text-headline-md font-bold text-on-surface">{t('Detail.notFoundTitle')}</h1>
          <p className="mt-space-xs text-body-md text-on-surface-variant">{t('Detail.notFoundBody')}</p>
        </div>
      )}
      {post && (
        <>
          <h1 className="mt-space-md text-headline-lg font-bold text-on-surface">{post.title}</h1>
          <p className="mt-space-xs whitespace-pre-wrap text-body-md text-on-surface">{post.body}</p>

          {user && (
            <div className="mt-space-lg">
              {!showReportForm && !reportMessage && (
                <button
                  type="button"
                  onClick={() => setShowReportForm(true)}
                  className="text-label-sm font-semibold text-on-surface-variant hover:underline"
                >
                  {t('Report.reportButton')}
                </button>
              )}
              {showReportForm && (
                <div className="space-y-2">
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t('Report.reasonPlaceholder')}
                    rows={3}
                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-body-sm text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    disabled={!reason.trim()}
                    className="rounded-full bg-primary px-6 py-2 text-label-md text-on-primary disabled:opacity-60"
                  >
                    {t('Report.submitButton')}
                  </button>
                </div>
              )}
              {reportMessage && <p className="text-label-sm text-on-surface-variant">{reportMessage}</p>}
            </div>
          )}
        </>
      )}
    </article>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Check the consuming page still passes its own test**

`frontend/app/forum/[id]/page.tsx` renders `<ForumPostDetail>` outside of any `AuthProvider` in
its own test (`frontend/app/forum/[id]/page.test.tsx`) — `ForumPostDetail` now calls
`useAuth()`, which throws if there is no provider above it. Run:

Run: `cd frontend && npx vitest run "app/forum/\[id\]/page.test.tsx"`
Expected: FAIL — `useAuth must be used within an AuthProvider`.

Replace `frontend/app/forum/[id]/page.test.tsx` to wrap in `AuthProvider`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
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
    renderWithIntl(
      <AuthProvider>
        <ForumPostPage params={Promise.resolve({ id: '4' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByText('Bài test route')).toBeInTheDocument())
  })
})
```

Run: `cd frontend && npx vitest run "app/forum/\[id\]/page.test.tsx"`
Expected: PASS (1 test)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/forum/ForumPostDetail.tsx components/forum/ForumPostDetail.test.tsx "app/forum/[id]/page.test.tsx" messages/vi.json
git commit -m "feat: add report-submission UI to the forum post detail page"
```

---

## Task 6: `GET /api/forum/moderation/pending`

**Files:**
- Create: `frontend/app/api/forum/moderation/pending/route.ts`
- Create: `frontend/app/api/forum/moderation/pending/route.test.ts`

**Interfaces:**
- Consumes: `getPendingForumPosts` from `lib/forum.ts` (Task 1); `getAdminSessionFromCookieHeader`.
- Produces: `GET` handler, consumed by Task 9 (`ForumModerationQueue`).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/forum/moderation/pending/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, setForumPostStatus } from '@/lib/forum'
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
  getDb().exec('DELETE FROM forum_reports')
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('GET /api/forum/moderation/pending', () => {
  it('rejects requests without an admin session', async () => {
    const response = await GET(new Request('http://localhost'))
    expect(response.status).toBe(401)
  })

  it('returns only pending posts', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createForumPost(db, author.id, { title: 'Chờ duyệt', body: 'B', category: 'general' })
    const published = createForumPost(db, author.id, { title: 'Đã duyệt', body: 'B', category: 'general' })
    setForumPostStatus(db, published.id, 'published')

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') } })
    const response = await GET(request)
    expect(response.status).toBe(200)
    const posts = await response.json()
    expect(posts).toHaveLength(1)
    expect(posts[0].title).toBe('Chờ duyệt')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/api/forum/moderation/pending/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `route.ts`**

Create `frontend/app/api/forum/moderation/pending/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getPendingForumPosts } from '@/lib/forum'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'

export async function GET(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }
  return NextResponse.json(getPendingForumPosts(getDb()))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/api/forum/moderation/pending/route.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/api/forum/moderation/pending/route.ts app/api/forum/moderation/pending/route.test.ts
git commit -m "feat: add admin API route listing pending forum posts"
```

---

## Task 7: `GET /api/forum/moderation/reports`

**Files:**
- Create: `frontend/app/api/forum/moderation/reports/route.ts`
- Create: `frontend/app/api/forum/moderation/reports/route.test.ts`

**Interfaces:**
- Consumes: `getOpenForumReports` from `lib/forum.ts` (Task 1); `getAdminSessionFromCookieHeader`.
- Produces: `GET` handler, consumed by Task 10 (`ForumReportQueue`).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/forum/moderation/reports/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, createForumReport, resolveForumReport } from '@/lib/forum'
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
  getDb().exec('DELETE FROM forum_reports')
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('GET /api/forum/moderation/reports', () => {
  it('rejects requests without an admin session', async () => {
    const response = await GET(new Request('http://localhost'))
    expect(response.status).toBe(401)
  })

  it('returns only open reports', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const reporter = createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, { title: 'Bài bị báo cáo', body: 'B', category: 'general' })
    const openReport = createForumReport(db, post.id, reporter.id, 'Lý do mở')
    const resolvedReport = createForumReport(db, post.id, reporter.id, 'Lý do đã xử lý')
    resolveForumReport(db, resolvedReport.id)

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') } })
    const response = await GET(request)
    expect(response.status).toBe(200)
    const reports = await response.json()
    expect(reports).toHaveLength(1)
    expect(reports[0].id).toBe(openReport.id)
    expect(reports[0].postTitle).toBe('Bài bị báo cáo')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/api/forum/moderation/reports/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `route.ts`**

Create `frontend/app/api/forum/moderation/reports/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getOpenForumReports } from '@/lib/forum'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'

export async function GET(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }
  return NextResponse.json(getOpenForumReports(getDb()))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/api/forum/moderation/reports/route.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/api/forum/moderation/reports/route.ts app/api/forum/moderation/reports/route.test.ts
git commit -m "feat: add admin API route listing open forum reports"
```

---

## Task 8: `PATCH /api/forum/reports/[id]` (mark resolved)

**Files:**
- Create: `frontend/app/api/forum/reports/[id]/route.ts`
- Create: `frontend/app/api/forum/reports/[id]/route.test.ts`

**Interfaces:**
- Consumes: `resolveForumReport` from `lib/forum.ts` (Task 1); `getAdminSessionFromCookieHeader`.
- Produces: `PATCH` handler, consumed by Task 10 (`ForumReportQueue`'s "Đánh dấu đã xử lý"
  button).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/forum/reports/[id]/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { PATCH } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, createForumReport } from '@/lib/forum'
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

beforeEach(() => {
  getDb().exec('DELETE FROM forum_reports')
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('PATCH /api/forum/reports/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const response = await PATCH(new Request('http://localhost', { method: 'PATCH' }), params(1))
    expect(response.status).toBe(401)
  })

  it('marks a report resolved', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const reporter = createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, { title: 'Bài test', body: 'B', category: 'general' })
    const report = createForumReport(db, post.id, reporter.id, 'Lý do')

    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') },
    })
    const response = await PATCH(request, params(report.id))
    expect(response.status).toBe(200)
    expect((await response.json()).status).toBe('resolved')
  })

  it('returns 404 for a report that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') },
    })
    const response = await PATCH(request, params(999999))
    expect(response.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/forum/reports/\[id\]/route.test.ts"`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `route.ts`**

Create `frontend/app/api/forum/reports/[id]/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { resolveForumReport } from '@/lib/forum'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const resolved = resolveForumReport(getDb(), Number(id))
  if (!resolved) {
    return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 })
  }
  return NextResponse.json(resolved)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/forum/reports/\[id\]/route.test.ts"`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/forum/reports/[id]/route.ts" "app/api/forum/reports/[id]/route.test.ts"
git commit -m "feat: add API route to resolve a forum report"
```

---

## Task 9: `ForumModerationQueue` admin component

**Files:**
- Create: `frontend/components/admin/ForumModerationQueue.tsx`
- Create: `frontend/components/admin/ForumModerationQueue.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Forum.Moderation` namespace)

**Interfaces:**
- Consumes: `ForumPost` from `lib/forum.ts` (Task 1); `GET /api/forum/moderation/pending`
  (Task 6); `PATCH /api/forum/posts/[id]` (Task 3).
- Produces: `ForumModerationQueue()`, consumed by Task 11 (`/admin/forum` page).

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Forum"`, add `Moderation` as a sibling of `Report`:
```json
    "Moderation": {
      "title": "Kiểm duyệt Diễn đàn",
      "pendingTitle": "Bài chờ duyệt",
      "approveButton": "Duyệt",
      "rejectButton": "Từ chối",
      "pendingEmptyState": "Không có bài nào chờ duyệt.",
      "loading": "Đang tải...",
      "reportsTitle": "Báo cáo",
      "resolveButton": "Đánh dấu đã xử lý",
      "hideButton": "Ẩn bài",
      "deleteButton": "Xóa bài",
      "deleteConfirm": "Xóa bài viết này?",
      "reportsEmptyState": "Không có báo cáo nào đang mở.",
      "reasonLabel": "Lý do"
    }
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/admin/ForumModerationQueue.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumModerationQueue from './ForumModerationQueue'
import type { ForumPost } from '@/lib/forum'

const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài chờ duyệt',
    body: 'Nội dung',
    category: 'general',
    status: 'pending',
    authorId: 5,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('ForumModerationQueue', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders pending posts with approve/reject buttons', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<ForumModerationQueue />)

    await waitFor(() => expect(screen.getByText('Bài chờ duyệt')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/moderation/pending')
    expect(screen.getByRole('button', { name: 'Duyệt' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeInTheDocument()
  })

  it('approving a post PATCHes its status and removes it from the list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => POSTS }).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    )
    renderWithIntl(<ForumModerationQueue />)
    await waitFor(() => expect(screen.getByText('Bài chờ duyệt')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Duyệt' }))

    await waitFor(() => expect(screen.queryByText('Bài chờ duyệt')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/api/forum/posts/1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'published' }) })
    )
  })

  it('shows an empty state when there is nothing pending', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumModerationQueue />)
    await waitFor(() => expect(screen.getByText('Không có bài nào chờ duyệt.')).toBeInTheDocument())
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/ForumModerationQueue.test.tsx`
Expected: FAIL — `./ForumModerationQueue` does not exist yet.

- [ ] **Step 4: Implement `ForumModerationQueue.tsx`**

Create `frontend/components/admin/ForumModerationQueue.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { ForumPost } from '@/lib/forum'

export default function ForumModerationQueue() {
  const t = useTranslations('Forum.Moderation')
  const [posts, setPosts] = useState<ForumPost[] | null>(null)

  useEffect(() => {
    fetch('/api/forum/moderation/pending')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleDecision(id: number, status: 'published' | 'rejected') {
    await fetch(`/api/forum/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setPosts((current) => current?.filter((post) => post.id !== id) ?? null)
  }

  if (posts === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (posts.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('pendingEmptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {posts.map((post) => (
        <li key={post.id} className="rounded-2xl border border-outline-variant p-space-lg">
          <h3 className="text-headline-sm font-semibold text-on-surface">{post.title}</h3>
          <p className="mt-space-xs whitespace-pre-wrap text-body-sm text-on-surface-variant">{post.body}</p>
          <div className="mt-space-sm flex gap-space-md">
            <button
              type="button"
              onClick={() => handleDecision(post.id, 'published')}
              className="font-semibold text-primary hover:underline"
            >
              {t('approveButton')}
            </button>
            <button
              type="button"
              onClick={() => handleDecision(post.id, 'rejected')}
              className="font-semibold text-error hover:underline"
            >
              {t('rejectButton')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/admin/ForumModerationQueue.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/admin/ForumModerationQueue.tsx components/admin/ForumModerationQueue.test.tsx messages/vi.json
git commit -m "feat: add admin pending-posts moderation queue"
```

---

## Task 10: `ForumReportQueue` admin component

**Files:**
- Create: `frontend/components/admin/ForumReportQueue.tsx`
- Create: `frontend/components/admin/ForumReportQueue.test.tsx`

**Interfaces:**
- Consumes: `ForumReport` from `lib/forum.ts` (Task 1); `GET /api/forum/moderation/reports`
  (Task 7); `PATCH /api/forum/reports/[id]` (Task 8); `PATCH`/`DELETE /api/forum/posts/[id]`
  (Task 3 and Plan 1's Task 6).
- Produces: `ForumReportQueue()`, consumed by Task 11 (`/admin/forum` page).

- [ ] **Step 1: Write the failing test**

Create `frontend/components/admin/ForumReportQueue.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumReportQueue from './ForumReportQueue'
import type { ForumReport } from '@/lib/forum'

const REPORTS: ForumReport[] = [
  {
    id: 1,
    postId: 10,
    postTitle: 'Bài bị báo cáo',
    postStatus: 'published',
    reporterId: 5,
    reason: 'Nội dung không phù hợp',
    status: 'open',
    createdAt: '2026-01-01',
  },
]

describe('ForumReportQueue', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders open reports with the post title and reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => REPORTS }))
    renderWithIntl(<ForumReportQueue />)

    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/moderation/reports')
    expect(screen.getByText(/Nội dung không phù hợp/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ẩn bài' })).toBeInTheDocument()
  })

  it('resolving a report PATCHes it and removes it from the list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => REPORTS }).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    )
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã xử lý' }))

    await waitFor(() => expect(screen.queryByText('Bài bị báo cáo')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/reports/1', { method: 'PATCH' })
  })

  it('hiding the post PATCHes its status to hidden', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => REPORTS }).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    )
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn bài' }))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/forum/posts/10',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'hidden' }) })
      )
    )
  })

  it('does not show "Ẩn bài" for a post that is not published', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [{ ...REPORTS[0], postStatus: 'pending' }] })
    )
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Ẩn bài' })).not.toBeInTheDocument()
  })

  it('deleting the post DELETEs it after confirmation and removes the report', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => REPORTS }).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xóa bài' }))

    await waitFor(() => expect(screen.queryByText('Bài bị báo cáo')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts/10', { method: 'DELETE' })
  })

  it('shows an empty state when there are no open reports', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Không có báo cáo nào đang mở.')).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/ForumReportQueue.test.tsx`
Expected: FAIL — `./ForumReportQueue` does not exist yet.

- [ ] **Step 3: Implement `ForumReportQueue.tsx`**

Create `frontend/components/admin/ForumReportQueue.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { ForumReport } from '@/lib/forum'

export default function ForumReportQueue() {
  const t = useTranslations('Forum.Moderation')
  const [reports, setReports] = useState<ForumReport[] | null>(null)

  useEffect(() => {
    fetch('/api/forum/moderation/reports')
      .then((response) => response.json())
      .then(setReports)
  }, [])

  async function handleResolve(id: number) {
    await fetch(`/api/forum/reports/${id}`, { method: 'PATCH' })
    setReports((current) => current?.filter((report) => report.id !== id) ?? null)
  }

  async function handleHide(report: ForumReport) {
    await fetch(`/api/forum/posts/${report.postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'hidden' }),
    })
    setReports(
      (current) =>
        current?.map((item) => (item.id === report.id ? { ...item, postStatus: 'hidden' as const } : item)) ?? null
    )
  }

  async function handleDelete(report: ForumReport) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/forum/posts/${report.postId}`, { method: 'DELETE' })
    setReports((current) => current?.filter((item) => item.postId !== report.postId) ?? null)
  }

  if (reports === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (reports.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('reportsEmptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {reports.map((report) => (
        <li key={report.id} className="rounded-2xl border border-outline-variant p-space-lg">
          <h3 className="text-headline-sm font-semibold text-on-surface">{report.postTitle}</h3>
          <p className="mt-space-xs text-body-sm text-on-surface-variant">
            {t('reasonLabel')}: {report.reason}
          </p>
          <div className="mt-space-sm flex flex-wrap gap-space-md">
            <button
              type="button"
              onClick={() => handleResolve(report.id)}
              className="font-semibold text-primary hover:underline"
            >
              {t('resolveButton')}
            </button>
            {report.postStatus === 'published' && (
              <button
                type="button"
                onClick={() => handleHide(report)}
                className="font-semibold text-on-surface-variant hover:underline"
              >
                {t('hideButton')}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(report)}
              className="font-semibold text-error hover:underline"
            >
              {t('deleteButton')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/admin/ForumReportQueue.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/admin/ForumReportQueue.tsx components/admin/ForumReportQueue.test.tsx
git commit -m "feat: add admin report queue with resolve/hide/delete actions"
```

---

## Task 11: `/admin/forum` page

**Files:**
- Create: `frontend/app/admin/forum/page.tsx`
- Create: `frontend/app/admin/forum/page.test.tsx`

**Interfaces:**
- Consumes: `AdminGate`; `ForumModerationQueue` (Task 9); `ForumReportQueue` (Task 10).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/admin/forum/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminForumPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('AdminForumPage', () => {
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

  it('renders both the pending-posts and reports sections for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminForumPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Kiểm duyệt Diễn đàn' })).toBeInTheDocument())
    expect(screen.getByText('Bài chờ duyệt')).toBeInTheDocument()
    expect(screen.getByText('Báo cáo')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/admin/forum/page.test.tsx`
Expected: FAIL — `./page` does not exist yet.

- [ ] **Step 3: Implement `app/admin/forum/page.tsx`**

```tsx
'use client'

import { useTranslations } from 'next-intl'
import AdminGate from '@/components/auth/AdminGate'
import ForumModerationQueue from '@/components/admin/ForumModerationQueue'
import ForumReportQueue from '@/components/admin/ForumReportQueue'

export default function AdminForumPage() {
  const t = useTranslations('Forum.Moderation')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>

          <h2 className="mt-space-xl text-headline-sm font-semibold text-on-surface">{t('pendingTitle')}</h2>
          <div className="mt-space-md">
            <ForumModerationQueue />
          </div>

          <h2 className="mt-space-xl text-headline-sm font-semibold text-on-surface">{t('reportsTitle')}</h2>
          <div className="mt-space-md">
            <ForumReportQueue />
          </div>
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/admin/forum/page.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/admin/forum
git commit -m "feat: add /admin/forum moderation page"
```

---

## Task 12: `AdminDashboard` links to Forum moderation

**Files:**
- Modify: `frontend/components/auth/AdminDashboard.tsx`
- Modify: `frontend/components/auth/AdminDashboard.test.tsx`
- Modify: `frontend/messages/vi.json` (`Admin` namespace)

- [ ] **Step 1: Update messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add as siblings of `teamCardTitle`/`teamCardDescription`:
```json
    "forumCardTitle": "Quản lý Diễn đàn",
    "forumCardDescription": "Duyệt bài đăng và xử lý báo cáo vi phạm từ người dùng."
```

- [ ] **Step 2: Write the failing test**

Extend the existing test in `frontend/components/auth/AdminDashboard.test.tsx` — add this line
inside the existing `it` block, after the Team assertion:
```tsx
    expect(screen.getByRole('link', { name: /Quản lý Diễn đàn/ })).toHaveAttribute('href', '/admin/forum')
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: FAIL — no Forum link exists yet.

- [ ] **Step 4: Update `AdminDashboard.tsx`**

Add a seventh `<Link>` card after the Team card:
```tsx
          <Link
            href="/admin/forum"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('forumCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('forumCardDescription')}</p>
          </Link>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/AdminDashboard.tsx components/auth/AdminDashboard.test.tsx messages/vi.json
git commit -m "feat: link the admin dashboard to forum moderation"
```

---

## Task 13: Full verification + full end-to-end manual browser check + roadmap update

- [ ] **Step 1: Run the full test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS — every test in the project, including everything from Plan 1 and Plan 2.

- [ ] **Step 2: Lint**

Run: `cd frontend && npx eslint .`
Expected: no errors (pre-existing warnings unrelated to this work, if any, are not this plan's
concern to fix).

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test in a real browser — the full end-to-end flow**

Start the dev server (`cd frontend && npm run dev`):

1. Log in as `user@twistfit.vn` / `user1234`. Go to `/forum/new`, create a post. Confirm it's
   "Chờ duyệt" on `/forum/my-posts` and absent from public `/forum`.
2. Log out, log in as `admin@twistfit.vn` / `admin1234`, go to `/admin` — confirm the new
   "Quản lý Diễn đàn" card is present and links to `/admin/forum`.
3. On `/admin/forum`, confirm the post from step 1 appears under "Bài chờ duyệt". Click
   "Duyệt".
4. Go to public `/forum` — confirm the post now appears. Click into it (`/forum/[id]`) —
   confirm the body renders and a "Báo cáo bài viết" button is visible (since you're logged
   in as admin, who is also a signed-in user).
5. Log out, log in as `user@twistfit.vn` / `user1234` again, open the same post's detail page,
   click "Báo cáo bài viết", type a reason, submit — confirm the success message appears.
6. Log out, log in as admin again, go to `/admin/forum` — confirm the report appears under
   "Báo cáo" with the post title and reason, and an "Ẩn bài" button (since the post is
   published).
7. Click "Ẩn bài" — go to public `/forum` and confirm the post is gone from the list (now
   `hidden`).
8. Back on `/admin/forum`, click "Đánh dấu đã xử lý" on the report — confirm it disappears
   from the report list.
9. Create one more post as a user, go to `/admin/forum`, click "Từ chối" on it — confirm it
   disappears from the pending queue and never appears on public `/forum`.
10. Check the browser console throughout for errors — in particular confirm there is **no**
    `Module not found: Can't resolve 'fs'` error.

- [ ] **Step 5: Update the roadmap doc**

In `docs/admin-dashboard-roadmap.md`, update the status table row:
```markdown
| Diễn đàn (đăng bài + kiểm duyệt) | Chưa bắt đầu |
```
to:
```markdown
| Diễn đàn (đăng bài + kiểm duyệt) | ✅ Hoàn thành |
```

- [ ] **Step 6: Commit**

```bash
git add docs/admin-dashboard-roadmap.md
git commit -m "docs: mark forum posting and moderation complete on the roadmap"
```
