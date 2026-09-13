# Dashboard thống kê (Subproject 2/2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track every Personal Color quiz completion (previously not persisted anywhere at
all), then surface five overview numbers — blog posts, forum posts, users, quiz attempts (each
with a 30-day "new" count), and contact messages (total + unread) — directly on the existing
`/admin` landing page. This is the **final** plan of the whole `docs/admin-dashboard-roadmap.md`
effort; its last task marks that roadmap fully done.

**Architecture:** A new module `frontend/lib/quizAttempts.ts` gives the quiz a real data store
for the first time — `QuizFlow.tsx` currently computes a season result via
`computeSeasonResult()` and **discards the return value**, so this plan captures it into a
variable and fires a non-blocking `POST` to a new endpoint, exactly like `AuthProvider.logout()`
already fires-and-forgets its own logout call. A second new module, `frontend/lib/stats.ts`,
has exactly one function, `getAdminStats(db)`, which runs a handful of static `COUNT(*)` queries
against the tables every other domain module already created (`blog_posts`, `forum_posts`,
`users`, `quiz_attempts`, `contact_messages`) — it queries them directly rather than importing
each module's own list-fetching functions, since those return full row sets when only a count
is needed. The result renders as a new `AdminStatsOverview` component inserted directly into
`AdminDashboard.tsx`, above its existing card grid — no new admin page.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, Vitest + Testing Library,
next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-stats-dashboard-design.md`

## Global Constraints

- `lib/quizAttempts.ts` and `lib/stats.ts` take `db: Database.Database` as an explicit
  parameter and import `better-sqlite3` **only as a type**.
- `POST /api/quiz-attempts` requires **no session** — quiz-taking stays anonymous-friendly; if
  a valid session cookie is present, the attempt is attributed to that user's `id`, otherwise
  `user_id` is `null`.
- The quiz's tracking call is **fire-and-forget**: `QuizFlow.tsx`'s navigation to the result
  page must never wait on, or be blocked by, the `/api/quiz-attempts` request succeeding.
- `getAdminStats` uses fully static SQL strings — no table name is ever interpolated into a
  query, even though none of these table names come from user input. One query per figure,
  reusing a tiny `{ count: number }`-unwrapping helper, not a query-builder.
- Forum post counts include **every** status (`pending`/`published`/`rejected`/`hidden`) — this
  reflects total posting activity, not just moderated content, per the spec's explicit
  Non-goal.
- No time-series charts, no dedicated stats page — five info cards inserted directly into the
  existing `/admin` landing page markup.
- Every new module/component gets a co-located `.test.ts`/`.test.tsx` file, written and run red
  before implementation (TDD). `QuizFlow.test.tsx` and `AdminDashboard.test.tsx` already exist
  and must be updated, since both components change behavior that their existing tests exercise
  (`QuizFlow` now calls `fetch`; `AdminDashboard` now renders a component that calls `fetch`).
- This is the last plan of the entire roadmap effort covered this session — its final task
  updates `docs/admin-dashboard-roadmap.md`'s "Dashboard thống kê / Hộp thư liên hệ" row to done.

---

## Task 1: Data layer — `quiz_attempts` schema, create + count

**Files:**
- Create: `frontend/lib/quizAttempts.ts`
- Test: `frontend/lib/quizAttempts.test.ts`

**Interfaces:**
- Consumes: `type Season` from `lib/db.ts`; `createUser` from `lib/auth/users.ts` (test only).
- Produces: `QuizAttempt`, `initSchema(db)`, `createQuizAttempt(db, season, userId)`,
  `getQuizAttemptsCount(db)`, `getNewQuizAttemptsCount(db, sinceIso)`, `seedIfEmpty(db)`.
  Consumed by Task 2 (`getDb.ts` wiring), Task 3 (API route), Task 5 (`lib/stats.ts`).

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/quizAttempts.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema as initUsersSchema, createUser } from './auth/users'
import {
  initSchema,
  createQuizAttempt,
  getQuizAttemptsCount,
  getNewQuizAttemptsCount,
  seedIfEmpty,
} from './quizAttempts'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initUsersSchema(db)
  initSchema(db)
})

afterEach(() => {
  db.close()
})

describe('createQuizAttempt', () => {
  it('creates an attempt with a null user id for an anonymous visitor', () => {
    const created = createQuizAttempt(db, 'summer', null)
    expect(created.id).toBeGreaterThan(0)
    expect(created.season).toBe('summer')
    expect(created.userId).toBeNull()
  })

  it('creates an attempt attributed to a real user', () => {
    const user = createUser(db, { name: 'Test', email: 'test@twistfit.vn', password: 'password123' })
    const created = createQuizAttempt(db, 'winter', user.id)
    expect(created.userId).toBe(user.id)
  })
})

describe('getQuizAttemptsCount', () => {
  it('counts all attempts', () => {
    createQuizAttempt(db, 'spring', null)
    createQuizAttempt(db, 'autumn', null)
    expect(getQuizAttemptsCount(db)).toBe(2)
  })
})

describe('getNewQuizAttemptsCount', () => {
  it('counts only attempts created at or after the given timestamp', () => {
    db.prepare('INSERT INTO quiz_attempts (season, user_id, created_at) VALUES (?, ?, ?)').run(
      'spring',
      null,
      '2020-01-01T00:00:00.000Z'
    )
    createQuizAttempt(db, 'summer', null)
    const since = new Date(Date.now() - 1000).toISOString()
    expect(getNewQuizAttemptsCount(db, since)).toBe(1)
  })
})

describe('seedIfEmpty', () => {
  it('does nothing — quiz attempts are never auto-seeded', () => {
    seedIfEmpty(db)
    expect(getQuizAttemptsCount(db)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/quizAttempts.test.ts`
Expected: FAIL — `./quizAttempts` module does not exist yet.

- [ ] **Step 3: Implement `lib/quizAttempts.ts`**

Create `frontend/lib/quizAttempts.ts`:
```ts
import type Database from 'better-sqlite3'
import type { Season } from './db'

export type QuizAttempt = {
  id: number
  season: Season
  userId: number | null
  createdAt: string
}

type QuizAttemptRow = {
  id: number
  season: string
  user_id: number | null
  created_at: string
}

function rowToQuizAttempt(row: QuizAttemptRow): QuizAttempt {
  return {
    id: row.id,
    season: row.season as Season,
    userId: row.user_id,
    createdAt: row.created_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL
    );
  `)
}

export function createQuizAttempt(db: Database.Database, season: Season, userId: number | null): QuizAttempt {
  const now = new Date().toISOString()
  const result = db
    .prepare('INSERT INTO quiz_attempts (season, user_id, created_at) VALUES (?, ?, ?)')
    .run(season, userId, now)
  const row = db
    .prepare('SELECT * FROM quiz_attempts WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as QuizAttemptRow
  return rowToQuizAttempt(row)
}

export function getQuizAttemptsCount(db: Database.Database): number {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM quiz_attempts').get() as { count: number }
  return count
}

export function getNewQuizAttemptsCount(db: Database.Database, sinceIso: string): number {
  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM quiz_attempts WHERE created_at >= ?')
    .get(sinceIso) as { count: number }
  return count
}

export function seedIfEmpty(_db: Database.Database): void {
  // Deliberately a no-op: quiz attempts are real visitor activity, never
  // seeded demo data. Kept as a function so lib/getDb.ts's init/seed call
  // sequence stays uniform across every domain module.
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/quizAttempts.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/quizAttempts.ts lib/quizAttempts.test.ts
git commit -m "feat: add quiz attempts data layer"
```

---

## Task 2: Wire the `quiz_attempts` schema into the shared `getDb()` singleton

**Files:**
- Modify: `frontend/lib/getDb.ts`

**Interfaces:**
- Consumes: `initSchema`, `seedIfEmpty` from `lib/quizAttempts.ts` (Task 1).

- [ ] **Step 1: Modify `lib/getDb.ts`**

Add the import:
```ts
import { initSchema as initQuizAttemptsSchema, seedIfEmpty as seedQuizAttemptsIfEmpty } from './quizAttempts'
```
Inside `getDb()`, after the contact init/seed calls (the current end of the chain), add:
```ts
  initQuizAttemptsSchema(db)
  seedQuizAttemptsIfEmpty(db)
```

- [ ] **Step 2: Verify the whole project still compiles and tests still pass**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every existing test still passes.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/getDb.ts
git commit -m "feat: initialize the quiz_attempts table when opening the database"
```

---

## Task 3: `POST /api/quiz-attempts`

**Files:**
- Create: `frontend/app/api/quiz-attempts/route.ts`
- Create: `frontend/app/api/quiz-attempts/route.test.ts`

**Interfaces:**
- Consumes: `createQuizAttempt` from `lib/quizAttempts.ts` (Task 1); `SEASONS`, `type Season`
  from `lib/db.ts`; `getSessionFromCookieHeader` from `lib/auth/session.ts`; `getUserByEmail`
  from `lib/auth/users.ts`; `getDb`.
- Produces: `POST` handler, consumed by Task 4 (`QuizFlow.tsx`).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/quiz-attempts/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { POST } from './route'
import { createUser } from '@/lib/auth/users'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema: initUsersSchema } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const { initSchema: initQuizAttemptsSchema } = await vi.importActual<typeof import('@/lib/quizAttempts')>(
    '@/lib/quizAttempts'
  )
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initUsersSchema(testDb)
  initQuizAttemptsSchema(testDb)
  return { getDb: () => testDb }
})

function cookieFor(email: string, role: 'user' | 'admin') {
  const value = createSessionCookieValue(email, role)
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

beforeEach(() => {
  getDb().exec('DELETE FROM quiz_attempts')
  getDb().exec('DELETE FROM users')
})

describe('POST /api/quiz-attempts', () => {
  it('creates an anonymous attempt without any session', async () => {
    const request = new Request('http://localhost/api/quiz-attempts', {
      method: 'POST',
      body: JSON.stringify({ season: 'summer' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.season).toBe('summer')
    expect(body.userId).toBeNull()
  })

  it('attributes the attempt to the logged-in user', async () => {
    const user = createUser(getDb(), { name: 'Test', email: 'test@twistfit.vn', password: 'password123' })
    const request = new Request('http://localhost/api/quiz-attempts', {
      method: 'POST',
      headers: { cookie: cookieFor('test@twistfit.vn', 'user') },
      body: JSON.stringify({ season: 'winter' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect((await response.json()).userId).toBe(user.id)
  })

  it('returns 400 for an invalid season', async () => {
    const request = new Request('http://localhost/api/quiz-attempts', {
      method: 'POST',
      body: JSON.stringify({ season: 'not-a-season' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/api/quiz-attempts/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `route.ts`**

Create `frontend/app/api/quiz-attempts/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { createQuizAttempt } from '@/lib/quizAttempts'
import { SEASONS, type Season } from '@/lib/db'
import { getSessionFromCookieHeader } from '@/lib/auth/session'
import { getUserByEmail } from '@/lib/auth/users'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { season?: unknown } | null
  const season = body?.season as Season
  if (!SEASONS.includes(season)) {
    return NextResponse.json({ error: 'Kết quả mùa không hợp lệ' }, { status: 400 })
  }

  const db = getDb()
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  const user = session ? getUserByEmail(db, session.email) : null

  const created = createQuizAttempt(db, season, user?.id ?? null)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/api/quiz-attempts/route.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/api/quiz-attempts/route.ts app/api/quiz-attempts/route.test.ts
git commit -m "feat: add quiz attempt tracking API route"
```

---

## Task 4: `QuizFlow` records its result via a fire-and-forget tracking call

**Files:**
- Modify: `frontend/components/personal-color/QuizFlow.tsx`
- Modify: `frontend/components/personal-color/QuizFlow.test.tsx`

**Interfaces:**
- Consumes: `POST /api/quiz-attempts` (Task 3).

This is the fix for the "computed result thrown away" gap described in the spec's Context —
`computeSeasonResult(finalAnswers)`'s return value is captured for the first time here, solely
to report it for tracking (the spec's Non-goals explicitly excludes fixing the separate,
pre-existing display gap on the result page).

- [ ] **Step 1: Write the failing tests**

Replace `frontend/components/personal-color/QuizFlow.test.tsx`:
```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuizFlow from './QuizFlow'
import type { QuizQuestion } from '@/lib/db'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function makeQuestion(id: number, text: string): QuizQuestion {
  return {
    id,
    questionText: text,
    sortOrder: id,
    options: [
      { id: id * 10 + 1, label: `Lựa chọn ${id}.1`, season: 'spring', sortOrder: 0 },
      { id: id * 10 + 2, label: `Lựa chọn ${id}.2`, season: 'summer', sortOrder: 1 },
      { id: id * 10 + 3, label: `Lựa chọn ${id}.3`, season: 'autumn', sortOrder: 2 },
      { id: id * 10 + 4, label: `Lựa chọn ${id}.4`, season: 'winter', sortOrder: 3 },
    ],
  }
}

const QUESTIONS: QuizQuestion[] = [1, 2, 3, 4, 5].map((id) => makeQuestion(id, `Câu hỏi số ${id}?`))

function completeQuiz() {
  for (let step = 0; step < 5; step++) {
    const optionButtons = screen.getAllByRole('button').filter((btn) => btn.dataset.quizOption === 'true')
    fireEvent.click(optionButtons[0])
    const isLast = step === 4
    const advanceButton = screen.getByRole('button', { name: isLast ? 'Xem kết quả' : 'Tiếp theo' })
    fireEvent.click(advanceButton)
  }
}

describe('QuizFlow', () => {
  beforeEach(() => {
    pushMock.mockClear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the first question with the Tiếp theo button disabled until an option is picked', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    expect(screen.getByText('Câu hỏi 1/5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeDisabled()
  })

  it('enables Tiếp theo once an option is selected and advances to the next question', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    fireEvent.click(screen.getAllByRole('button', { name: /./ })[0])
    const nextButton = screen.getByRole('button', { name: 'Tiếp theo' })
    expect(nextButton).toBeEnabled()
    fireEvent.click(nextButton)
    expect(screen.getByText('Câu hỏi 2/5')).toBeInTheDocument()
  })

  it('shows "Xem kết quả" on the last question and navigates to the result page when finished', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()
    expect(pushMock).toHaveBeenCalledWith('/personal-color/result')
  })

  it('records the computed season via a fire-and-forget POST to /api/quiz-attempts', async () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/quiz-attempts', expect.objectContaining({ method: 'POST' }))
    )
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const sentBody = JSON.parse(init.body as string) as { season: string }
    expect(['spring', 'summer', 'autumn', 'winter']).toContain(sentBody.season)
  })

  it('still navigates to the result page even if the tracking request fails', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()
    expect(pushMock).toHaveBeenCalledWith('/personal-color/result')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/personal-color/QuizFlow.test.tsx`
Expected: FAIL — `handleAdvance` never calls `fetch`, so the "records the computed season" test
fails (the other tests pass unchanged since stubbing `fetch` beforehand is harmless to them).

- [ ] **Step 3: Update `QuizFlow.tsx`**

In `frontend/components/personal-color/QuizFlow.tsx`, replace `handleAdvance`:
```ts
  function handleAdvance() {
    if (isLastStep) {
      const finalAnswers = answers.filter((value): value is Season => value !== null)
      const season = computeSeasonResult(finalAnswers)
      void fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season }),
      }).catch(() => {})
      router.push('/personal-color/result')
      return
    }
    setCurrentStep((step) => step + 1)
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/personal-color/QuizFlow.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/personal-color/QuizFlow.tsx components/personal-color/QuizFlow.test.tsx
git commit -m "feat: record quiz completions via a fire-and-forget tracking call"
```

---

## Task 5: Data layer — `getAdminStats` aggregation

**Files:**
- Create: `frontend/lib/stats.ts`
- Test: `frontend/lib/stats.test.ts`

**Interfaces:**
- Consumes: `initSchema`/`createBlogPost` from `lib/db.ts`; `initSchema`/`createForumPost` from
  `lib/forum.ts`; `initSchema`/`createUser` from `lib/auth/users.ts`; `initSchema`/
  `createQuizAttempt` from `lib/quizAttempts.ts` (Task 1); `initSchema`/`createContactMessage`
  from `lib/contact.ts` (test only, to populate the tables being counted).
- Produces: `AdminStats`, `getAdminStats(db)`. Consumed by Task 6 (API route).

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/stats.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema as initBlogSchema, createBlogPost } from './db'
import { initSchema as initForumSchema, createForumPost } from './forum'
import { initSchema as initUsersSchema, createUser } from './auth/users'
import { initSchema as initQuizAttemptsSchema, createQuizAttempt } from './quizAttempts'
import { initSchema as initContactSchema, createContactMessage } from './contact'
import { getAdminStats } from './stats'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initBlogSchema(db)
  initUsersSchema(db)
  initForumSchema(db)
  initQuizAttemptsSchema(db)
  initContactSchema(db)
})

afterEach(() => {
  db.close()
})

describe('getAdminStats', () => {
  it('returns zeroed counts for an empty database', () => {
    expect(getAdminStats(db)).toEqual({
      blogPosts: { total: 0, new30d: 0 },
      forumPosts: { total: 0, new30d: 0 },
      users: { total: 0, new30d: 0 },
      quizAttempts: { total: 0, new30d: 0 },
      contactMessages: { total: 0, unread: 0 },
    })
  })

  it('counts totals across every table', () => {
    createBlogPost(db, {
      slug: 'test',
      title: 'Test',
      excerpt: 'Test',
      content: 'Test',
      coverImageUrl: '/x.jpg',
      category: 'community',
      authorName: null,
      isFeatured: false,
      publishedAt: '2026-01-01',
    })
    const author = createUser(db, { name: 'Author', email: 'author@twistfit.vn', password: 'password123' })
    createForumPost(db, author.id, { title: 'Bài test', body: 'B', category: 'general' })
    createQuizAttempt(db, 'summer', null)
    createContactMessage(db, {
      name: 'Khách',
      email: 'khach@twistfit.vn',
      phone: null,
      subject: 'other',
      message: 'Xin chào',
    })

    const stats = getAdminStats(db)
    expect(stats.blogPosts.total).toBe(1)
    expect(stats.forumPosts.total).toBe(1)
    expect(stats.users.total).toBe(1)
    expect(stats.quizAttempts.total).toBe(1)
    expect(stats.contactMessages.total).toBe(1)
  })

  it('excludes records older than 30 days from new30d counts', () => {
    const author = createUser(db, { name: 'Author', email: 'author@twistfit.vn', password: 'password123' })
    const oldPost = createForumPost(db, author.id, { title: 'Bài cũ', body: 'B', category: 'general' })
    db.prepare('UPDATE forum_posts SET created_at = ? WHERE id = ?').run('2020-01-01T00:00:00.000Z', oldPost.id)
    createForumPost(db, author.id, { title: 'Bài mới', body: 'B', category: 'general' })

    const stats = getAdminStats(db)
    expect(stats.forumPosts.total).toBe(2)
    expect(stats.forumPosts.new30d).toBe(1)
  })

  it('counts only unread contact messages for the unread figure, not the total', () => {
    const message = createContactMessage(db, {
      name: 'Khách',
      email: 'khach@twistfit.vn',
      phone: null,
      subject: 'other',
      message: 'Xin chào',
    })
    db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(message.id)
    createContactMessage(db, {
      name: 'Khách 2',
      email: 'khach2@twistfit.vn',
      phone: null,
      subject: 'other',
      message: 'Xin chào 2',
    })

    const stats = getAdminStats(db)
    expect(stats.contactMessages.total).toBe(2)
    expect(stats.contactMessages.unread).toBe(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/stats.test.ts`
Expected: FAIL — `./stats` module does not exist yet.

- [ ] **Step 3: Implement `lib/stats.ts`**

Create `frontend/lib/stats.ts`:
```ts
import type Database from 'better-sqlite3'

export type AdminStats = {
  blogPosts: { total: number; new30d: number }
  forumPosts: { total: number; new30d: number }
  users: { total: number; new30d: number }
  quizAttempts: { total: number; new30d: number }
  contactMessages: { total: number; unread: number }
}

function count(db: Database.Database, sql: string, param?: string): number {
  const row = (param !== undefined ? db.prepare(sql).get(param) : db.prepare(sql).get()) as {
    count: number
  }
  return row.count
}

export function getAdminStats(db: Database.Database): AdminStats {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  return {
    blogPosts: {
      total: count(db, 'SELECT COUNT(*) AS count FROM blog_posts'),
      new30d: count(db, 'SELECT COUNT(*) AS count FROM blog_posts WHERE created_at >= ?', since),
    },
    forumPosts: {
      total: count(db, 'SELECT COUNT(*) AS count FROM forum_posts'),
      new30d: count(db, 'SELECT COUNT(*) AS count FROM forum_posts WHERE created_at >= ?', since),
    },
    users: {
      total: count(db, 'SELECT COUNT(*) AS count FROM users'),
      new30d: count(db, 'SELECT COUNT(*) AS count FROM users WHERE created_at >= ?', since),
    },
    quizAttempts: {
      total: count(db, 'SELECT COUNT(*) AS count FROM quiz_attempts'),
      new30d: count(db, 'SELECT COUNT(*) AS count FROM quiz_attempts WHERE created_at >= ?', since),
    },
    contactMessages: {
      total: count(db, 'SELECT COUNT(*) AS count FROM contact_messages'),
      unread: count(db, 'SELECT COUNT(*) AS count FROM contact_messages WHERE is_read = 0'),
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/stats.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/stats.ts lib/stats.test.ts
git commit -m "feat: add admin stats aggregation across blog, forum, users, quiz, and contact"
```

---

## Task 6: `GET /api/admin/stats`

**Files:**
- Create: `frontend/app/api/admin/stats/route.ts`
- Create: `frontend/app/api/admin/stats/route.test.ts`

**Interfaces:**
- Consumes: `getAdminStats` from `lib/stats.ts` (Task 5); `getAdminSessionFromCookieHeader`;
  `getDb`.
- Produces: `GET` handler, consumed by Task 7 (`AdminStatsOverview`).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/admin/stats/route.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema: initBlogSchema } = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  const { initSchema: initUsersSchema } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const { initSchema: initForumSchema } = await vi.importActual<typeof import('@/lib/forum')>('@/lib/forum')
  const { initSchema: initQuizAttemptsSchema } = await vi.importActual<typeof import('@/lib/quizAttempts')>(
    '@/lib/quizAttempts'
  )
  const { initSchema: initContactSchema } = await vi.importActual<typeof import('@/lib/contact')>(
    '@/lib/contact'
  )
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initBlogSchema(testDb)
  initUsersSchema(testDb)
  initForumSchema(testDb)
  initQuizAttemptsSchema(testDb)
  initContactSchema(testDb)
  return { getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

describe('GET /api/admin/stats', () => {
  it('rejects requests without an admin session', async () => {
    const response = await GET(new Request('http://localhost/api/admin/stats'))
    expect(response.status).toBe(401)
  })

  it('returns the aggregated stats for an admin session', async () => {
    const request = new Request('http://localhost/api/admin/stats', { headers: { cookie: adminCookieHeader() } })
    const response = await GET(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.blogPosts).toEqual({ total: 0, new30d: 0 })
    expect(body.contactMessages).toEqual({ total: 0, unread: 0 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/api/admin/stats/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `route.ts`**

Create `frontend/app/api/admin/stats/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getAdminStats } from '@/lib/stats'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'

export async function GET(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }
  return NextResponse.json(getAdminStats(getDb()))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/api/admin/stats/route.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/api/admin/stats/route.ts app/api/admin/stats/route.test.ts
git commit -m "feat: add admin stats API route"
```

---

## Task 7: `AdminStatsOverview` + wire into `AdminDashboard`

**Files:**
- Create: `frontend/components/admin/AdminStatsOverview.tsx`
- Create: `frontend/components/admin/AdminStatsOverview.test.tsx`
- Modify: `frontend/components/auth/AdminDashboard.tsx`
- Modify: `frontend/components/auth/AdminDashboard.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.StatsOverview` namespace)

**Interfaces:**
- Consumes: `AdminStats` from `lib/stats.ts` (Task 5); `GET /api/admin/stats` (Task 6).
- Produces: `AdminStatsOverview()`, rendered inside `AdminDashboard`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add a new `StatsOverview` sub-namespace
(alongside `TeamForm`/`TeamList`/`ContactList`/etc.):
```json
    "StatsOverview": {
      "loading": "Đang tải số liệu...",
      "blogTitle": "Bài viết Blog",
      "forumTitle": "Bài viết Diễn đàn",
      "usersTitle": "Người dùng",
      "quizTitle": "Lượt làm quiz",
      "contactTitle": "Tin nhắn liên hệ",
      "new30d": "+{count} trong 30 ngày qua",
      "unread": "{count} chưa đọc"
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/admin/AdminStatsOverview.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AdminStatsOverview from './AdminStatsOverview'
import type { AdminStats } from '@/lib/stats'

const STATS: AdminStats = {
  blogPosts: { total: 7, new30d: 2 },
  forumPosts: { total: 3, new30d: 1 },
  users: { total: 5, new30d: 1 },
  quizAttempts: { total: 20, new30d: 4 },
  contactMessages: { total: 6, unread: 2 },
}

describe('AdminStatsOverview', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders all five stat cards', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => STATS }))
    renderWithIntl(<AdminStatsOverview />)

    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/admin/stats')
    expect(screen.getByText('Bài viết Blog')).toBeInTheDocument()
    expect(screen.getByText('+2 trong 30 ngày qua')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('2 chưa đọc')).toBeInTheDocument()
  })

  it('shows a loading state before the fetch resolves', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    renderWithIntl(<AdminStatsOverview />)
    expect(screen.getByText('Đang tải số liệu...')).toBeInTheDocument()
  })
})
```

Update `frontend/components/auth/AdminDashboard.test.tsx` to stub `fetch` (needed now that
`AdminDashboard` renders `AdminStatsOverview`, which calls `fetch` on mount) — add the `vi`
import and wrap the existing test body:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AdminDashboard from './AdminDashboard'
import { AuthProvider } from './AuthProvider'

describe('AdminDashboard', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          blogPosts: { total: 0, new30d: 0 },
          forumPosts: { total: 0, new30d: 0 },
          users: { total: 0, new30d: 0 },
          quizAttempts: { total: 0, new30d: 0 },
          contactMessages: { total: 0, unread: 0 },
        }),
      })
    )
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('links to the blog and quiz admin sections', () => {
    renderWithIntl(
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    )
    expect(screen.getByRole('link', { name: /Quản lý Blog/ })).toHaveAttribute('href', '/admin/blog')
    expect(screen.getByRole('link', { name: /Quản lý câu hỏi Quiz/ })).toHaveAttribute('href', '/admin/quiz')
    expect(screen.getByRole('link', { name: /Quản lý FAQ/ })).toHaveAttribute('href', '/admin/faq')
    expect(screen.getByRole('link', { name: /Quản lý Model Catalog/ })).toHaveAttribute('href', '/admin/model-catalog')
    expect(screen.getByRole('link', { name: /Quản lý Capsule Wardrobe/ })).toHaveAttribute(
      'href',
      '/admin/capsule-wardrobe'
    )
    expect(screen.getByRole('link', { name: /Quản lý Team/ })).toHaveAttribute('href', '/admin/team')
    expect(screen.getByRole('link', { name: /Quản lý Diễn đàn/ })).toHaveAttribute('href', '/admin/forum')
    expect(screen.getByRole('link', { name: /Quản lý Hộp thư/ })).toHaveAttribute('href', '/admin/contact')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/admin/AdminStatsOverview.test.tsx components/auth/AdminDashboard.test.tsx`
Expected: FAIL — `./AdminStatsOverview` does not exist yet (`AdminDashboard.test.tsx` still
passes at this point since `AdminDashboard.tsx` hasn't changed, but leave the `fetch` stub in
place — it's needed the moment Step 5 wires the new component in).

- [ ] **Step 4: Implement `AdminStatsOverview.tsx`**

Create `frontend/components/admin/AdminStatsOverview.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { AdminStats } from '@/lib/stats'

export default function AdminStatsOverview() {
  const t = useTranslations('Admin.StatsOverview')
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((response) => response.json())
      .then(setStats)
  }, [])

  if (stats === null) {
    return <p className="mt-6 text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  const cards = [
    { title: t('blogTitle'), total: stats.blogPosts.total, sub: t('new30d', { count: stats.blogPosts.new30d }) },
    { title: t('forumTitle'), total: stats.forumPosts.total, sub: t('new30d', { count: stats.forumPosts.new30d }) },
    { title: t('usersTitle'), total: stats.users.total, sub: t('new30d', { count: stats.users.new30d }) },
    {
      title: t('quizTitle'),
      total: stats.quizAttempts.total,
      sub: t('new30d', { count: stats.quizAttempts.new30d }),
    },
    {
      title: t('contactTitle'),
      total: stats.contactMessages.total,
      sub: t('unread', { count: stats.contactMessages.unread }),
    },
  ]

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.title} className="rounded-2xl bg-surface-container p-4">
          <p className="text-label-sm text-on-surface-variant">{card.title}</p>
          <p className="mt-1 text-headline-sm font-bold text-on-surface">{card.total}</p>
          <p className="mt-1 text-label-sm text-on-surface-variant">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Wire it into `AdminDashboard.tsx`**

In `frontend/components/auth/AdminDashboard.tsx`, add the import:
```tsx
import AdminStatsOverview from '@/components/admin/AdminStatsOverview'
```
Insert `<AdminStatsOverview />` right after the welcome paragraph and before the `<div
className="mt-8 grid ...">` card grid:
```tsx
        {user && <p className="mt-1 text-body-sm text-on-surface-variant">{t('welcome', { name: user.name })}</p>}
        <AdminStatsOverview />
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/admin/AdminStatsOverview.test.tsx components/auth/AdminDashboard.test.tsx`
Expected: PASS (2 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/admin/AdminStatsOverview.tsx components/admin/AdminStatsOverview.test.tsx components/auth/AdminDashboard.tsx components/auth/AdminDashboard.test.tsx messages/vi.json
git commit -m "feat: show admin stats overview on the admin dashboard"
```

---

## Task 8: Full verification + manual browser check + mark the roadmap complete

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

1. Go to `/personal-color/quiz` (not logged in), complete all 5 questions. Confirm it still
   navigates to `/personal-color/result` as before (no visible change to the quiz UX).
2. Log in as `admin@twistfit.vn` / `admin1234`, go to `/admin` — confirm a row of 5 stat cards
   appears above the management card grid, and "Lượt làm quiz" shows at least 1.
3. Note the current numbers, then: submit the contact form on `/` once, create one blog post
   via `/admin/blog`, create and approve one forum post via `/forum/new` + `/admin/forum`.
   Reload `/admin` and confirm each corresponding stat's total increased by exactly 1 (contact
   messages' total and unread count, blog posts' total, forum posts' total).
4. Log out, complete the quiz again while logged out, then log in as `user@twistfit.vn` /
   `user1234` and complete it once more — confirm `/admin`'s "Lượt làm quiz" total increased by
   2 across both attempts (the UI can't show which attempts were attributed to a user, but the
   count itself must reflect both).
5. Check the browser console for errors on `/admin` and `/personal-color/quiz` — in particular
   confirm there is **no** `Module not found: Can't resolve 'fs'` error, and confirm the
   `/api/quiz-attempts` request never blocks or delays the redirect to the result page (the
   page navigation should feel instant, not wait on a network round-trip).

- [ ] **Step 5: Update the roadmap doc**

In `docs/admin-dashboard-roadmap.md`, update the status table row:
```markdown
| Dashboard thống kê / Hộp thư liên hệ | Chưa bắt đầu |
```
to:
```markdown
| Dashboard thống kê / Hộp thư liên hệ | ✅ Hoàn thành |
```

This is the last unfinished row in that table — after this edit, every item in
`docs/admin-dashboard-roadmap.md`'s status table reads "✅ Hoàn thành" except the already-known,
deliberately-deferred admin user-management sub-item noted inside the "Đăng ký/Đăng nhập tài
khoản thật" row's own text.

- [ ] **Step 6: Commit**

```bash
git add docs/admin-dashboard-roadmap.md
git commit -m "docs: mark stats dashboard and contact inbox complete on the roadmap"
```
