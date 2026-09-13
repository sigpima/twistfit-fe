# Admin: Quản lý Blog & Câu hỏi Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Blog posts and Personal Color quiz questions from hardcoded arrays into a
SQLite-backed data layer with admin CRUD screens under `/admin`, public pages reading from
the DB, and server-verified admin sessions protecting the write APIs.

**Architecture:** `frontend/lib/db.ts` owns a `better-sqlite3` connection (file at
`frontend/data/twistfit.db`) and exports typed CRUD functions taking the DB instance as a
parameter (so tests use isolated `:memory:` instances). Next.js Route Handlers under
`app/api/` call a singleton `getDb()` and enforce a signed httpOnly cookie
(`lib/auth/session.ts`) for writes. Public pages (`/blog`, `/blog/[slug]`,
`/personal-color/quiz`) become Server Components reading the DB directly. Admin pages
(`/admin/blog/*`, `/admin/quiz/*`) are Client Components calling the API routes.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, `marked` +
`isomorphic-dompurify` (markdown rendering), Vitest + Testing Library, next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-admin-blog-quiz-cms-design.md`

## Global Constraints

- DB file lives at `frontend/data/twistfit.db`, created on first run, gitignored.
- All `lib/db.ts` query functions take `db: Database.Database` as an explicit parameter
  (never read a module-level singleton internally) — this is what makes them testable with
  `:memory:` databases.
- Route `params` are `Promise`s in this Next.js version — `await params` in server
  pages/route handlers. In Client Component pages, resolve it with `params.then(...)` inside
  a `useEffect` rather than React's `use()` hook — `use()` suspends on any plain `Promise`
  (even an already-resolved one, since native `.then()` callbacks always defer to a
  microtask), which would require wrapping every caller, including tests, in `<Suspense>`.
  Do not access `params` synchronously.
- No file upload: cover images and any image fields are plain URL strings.
- Admin write API routes (`POST`/`PUT`/`DELETE` under `/api/blog`, `/api/quiz-questions`)
  must reject requests without a valid signed admin session cookie (401).
- Reuse existing input/label/button Tailwind classes from `RegisterForm.tsx`/`LoginForm.tsx`
  (`rounded-xl bg-surface px-4 py-3 ... focus:bg-surface-container-high focus:outline-none`
  for inputs; `rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md
  transition-all hover:bg-primary-container` for primary buttons).
- All UI text goes through `next-intl` (`messages/vi.json`), following the existing
  per-component namespace convention (e.g. `useTranslations('Admin.BlogForm')`).
- Every new component/module gets a co-located `.test.ts`/`.test.tsx` file, written and run
  red before implementation (TDD), matching the rest of the codebase.

---

## Task 1: Data layer — dependencies, schema, Blog CRUD

**Files:**
- Modify: `frontend/package.json` (add `better-sqlite3`; add `@types/better-sqlite3` to devDependencies)
- Modify: `frontend/.gitignore` (add `data/*.db`)
- Create: `frontend/data/.gitkeep`
- Create: `frontend/lib/db.ts`
- Test: `frontend/lib/db.test.ts`

**Interfaces:**
- Produces: `initSchema(db: Database.Database): void`, `BlogCategory`, `BLOG_CATEGORIES: BlogCategory[]`, `Season`, `SEASONS: Season[]`, `BlogPost`, `BlogPostInput`, `getBlogPosts(db)`, `getBlogPostBySlug(db, slug)`, `getBlogPostById(db, id)`, `isBlogSlugTaken(db, slug, excludeId?)`, `createBlogPost(db, input)`, `updateBlogPost(db, id, input)`, `deleteBlogPost(db, id)`. All consumed by Task 2 (same file) and later API-route tasks.

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd frontend && npm install better-sqlite3 && npm install -D @types/better-sqlite3
```

- [ ] **Step 2: Ignore the DB file**

Append to `frontend/.gitignore`:
```
data/*.db
```

Create `frontend/data/.gitkeep` (empty file) so the directory exists in git even though the
`.db` file itself is ignored.

- [ ] **Step 3: Write the failing test for schema + Blog CRUD**

Create `frontend/lib/db.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createBlogPost,
  getBlogPosts,
  getBlogPostBySlug,
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
  isBlogSlugTaken,
  type BlogPostInput,
} from './db'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const samplePost: BlogPostInput = {
  slug: 'mua-dong-2026',
  title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
  excerpt: 'Khám phá sức hút mãnh liệt của sự tương phản cao.',
  content: 'Nội dung đầy đủ của bài viết về Mùa Đông.',
  coverImageUrl: '/blog/featured-winter-outfit.jpg',
  category: 'personal-color',
  authorName: 'Stylist Mai Anh',
  isFeatured: true,
  publishedAt: '2026-06-18',
}

describe('Blog CRUD', () => {
  it('creates and reads back a post', () => {
    const created = createBlogPost(db, samplePost)
    expect(created.id).toBeGreaterThan(0)
    expect(created.slug).toBe('mua-dong-2026')
    expect(created.isFeatured).toBe(true)
    expect(created.authorName).toBe('Stylist Mai Anh')
  })

  it('lists posts ordered by publishedAt descending', () => {
    createBlogPost(db, { ...samplePost, slug: 'older', publishedAt: '2026-01-01' })
    createBlogPost(db, { ...samplePost, slug: 'newer', publishedAt: '2026-06-01' })
    const posts = getBlogPosts(db)
    expect(posts.map((p) => p.slug)).toEqual(['newer', 'older'])
  })

  it('finds a post by slug', () => {
    createBlogPost(db, samplePost)
    expect(getBlogPostBySlug(db, 'mua-dong-2026')?.title).toBe(samplePost.title)
    expect(getBlogPostBySlug(db, 'khong-ton-tai')).toBeNull()
  })

  it('updates a post', () => {
    const created = createBlogPost(db, samplePost)
    const updated = updateBlogPost(db, created.id, { ...samplePost, title: 'Tiêu đề mới' })
    expect(updated?.title).toBe('Tiêu đề mới')
    expect(updateBlogPost(db, 999999, samplePost)).toBeNull()
  })

  it('deletes a post', () => {
    const created = createBlogPost(db, samplePost)
    expect(deleteBlogPost(db, created.id)).toBe(true)
    expect(getBlogPostById(db, created.id)).toBeNull()
    expect(deleteBlogPost(db, created.id)).toBe(false)
  })

  it('detects a taken slug, excluding the post itself when editing', () => {
    const created = createBlogPost(db, samplePost)
    expect(isBlogSlugTaken(db, 'mua-dong-2026')).toBe(true)
    expect(isBlogSlugTaken(db, 'mua-dong-2026', created.id)).toBe(false)
    expect(isBlogSlugTaken(db, 'khong-ton-tai')).toBe(false)
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/db.test.ts`
Expected: FAIL — `./db` module does not exist yet.

- [ ] **Step 5: Implement `lib/db.ts` (schema + Blog CRUD)**

Create `frontend/lib/db.ts`:
```ts
import Database from 'better-sqlite3'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export type BlogCategory = 'personal-color' | 'styling' | 'sustainable' | 'beauty' | 'community'
export const BLOG_CATEGORIES: BlogCategory[] = [
  'personal-color',
  'styling',
  'sustainable',
  'beauty',
  'community',
]

export type BlogPost = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  coverImageUrl: string
  category: BlogCategory
  authorName: string | null
  isFeatured: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export type BlogPostInput = {
  slug: string
  title: string
  excerpt: string
  content: string
  coverImageUrl: string
  category: BlogCategory
  authorName: string | null
  isFeatured: boolean
  publishedAt: string
}

type BlogPostRow = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image_url: string
  category: string
  author_name: string | null
  is_featured: number
  published_at: string
  created_at: string
  updated_at: string
}

function rowToBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    category: row.category as BlogCategory,
    authorName: row.author_name,
    isFeatured: row.is_featured === 1,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image_url TEXT NOT NULL,
      category TEXT NOT NULL,
      author_name TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      season TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
  `)
}

export function getBlogPosts(db: Database.Database): BlogPost[] {
  const rows = db.prepare('SELECT * FROM blog_posts ORDER BY published_at DESC').all() as BlogPostRow[]
  return rows.map(rowToBlogPost)
}

export function getBlogPostBySlug(db: Database.Database, slug: string): BlogPost | null {
  const row = db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(slug) as BlogPostRow | undefined
  return row ? rowToBlogPost(row) : null
}

export function getBlogPostById(db: Database.Database, id: number): BlogPost | null {
  const row = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as BlogPostRow | undefined
  return row ? rowToBlogPost(row) : null
}

export function isBlogSlugTaken(db: Database.Database, slug: string, excludeId?: number): boolean {
  const row =
    excludeId !== undefined
      ? db.prepare('SELECT id FROM blog_posts WHERE slug = ? AND id != ?').get(slug, excludeId)
      : db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug)
  return row !== undefined
}

export function createBlogPost(db: Database.Database, input: BlogPostInput): BlogPost {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO blog_posts
        (slug, title, excerpt, content, cover_image_url, category, author_name, is_featured, published_at, created_at, updated_at)
       VALUES (@slug, @title, @excerpt, @content, @coverImageUrl, @category, @authorName, @isFeatured, @publishedAt, @createdAt, @updatedAt)`
    )
    .run({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      category: input.category,
      authorName: input.authorName,
      isFeatured: input.isFeatured ? 1 : 0,
      publishedAt: input.publishedAt,
      createdAt: now,
      updatedAt: now,
    })
  const created = getBlogPostById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created blog post')
  }
  return created
}

export function updateBlogPost(db: Database.Database, id: number, input: BlogPostInput): BlogPost | null {
  const existing = getBlogPostById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE blog_posts SET
      slug = @slug, title = @title, excerpt = @excerpt, content = @content,
      cover_image_url = @coverImageUrl, category = @category, author_name = @authorName,
      is_featured = @isFeatured, published_at = @publishedAt, updated_at = @updatedAt
     WHERE id = @id`
  ).run({
    id,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    coverImageUrl: input.coverImageUrl,
    category: input.category,
    authorName: input.authorName,
    isFeatured: input.isFeatured ? 1 : 0,
    publishedAt: input.publishedAt,
    updatedAt: now,
  })
  return getBlogPostById(db, id)
}

export function deleteBlogPost(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id)
  return result.changes > 0
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/db.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add package.json package-lock.json .gitignore data/.gitkeep lib/db.ts lib/db.test.ts
git commit -m "feat: add SQLite data layer with blog post CRUD"
```

---

## Task 2: Data layer — Quiz CRUD, seed data, singleton

**Files:**
- Modify: `frontend/lib/db.ts` (append quiz types/functions, `seedIfEmpty`, `getDb`)
- Modify: `frontend/lib/db.test.ts` (append quiz + seed tests)

**Interfaces:**
- Consumes: everything from Task 1 (`initSchema`, `createBlogPost`, `BlogPostInput`, `Season`, `SEASONS`).
- Produces: `QuizOption`, `QuizOptionInput`, `QuizQuestion`, `QuizQuestionInput`, `getQuizQuestions(db)`, `getQuizQuestionById(db, id)`, `createQuizQuestion(db, input)`, `updateQuizQuestion(db, id, input)`, `deleteQuizQuestion(db, id)`, `seedIfEmpty(db)`, `getDb(): Database.Database`. `getDb` is consumed by every API route task; `QuizQuestion`/`Season` are consumed by the QuizFlow task.

- [ ] **Step 1: Write the failing tests**

Append to `frontend/lib/db.test.ts` (add these imports to the existing import line, then add the new `describe` blocks below the existing `Blog CRUD` one):

```ts
// add to the existing import from './db':
//   createQuizQuestion, getQuizQuestions, getQuizQuestionById, updateQuizQuestion,
//   deleteQuizQuestion, seedIfEmpty, type QuizQuestionInput
```

```ts
const sampleQuestion: QuizQuestionInput = {
  questionText: 'Tĩnh mạch ở cổ tay bạn có màu gì khi nhìn dưới ánh sáng tự nhiên?',
  sortOrder: 0,
  options: [
    { label: 'Xanh lá hoặc xanh ô liu', season: 'autumn' },
    { label: 'Xanh dương hoặc tím', season: 'winter' },
    { label: 'Xanh dương nhạt, khó phân biệt', season: 'summer' },
    { label: 'Xanh lá nhạt, ánh vàng', season: 'spring' },
  ],
}

describe('Quiz CRUD', () => {
  it('creates a question with its options in order', () => {
    const created = createQuizQuestion(db, sampleQuestion)
    expect(created.options).toHaveLength(4)
    expect(created.options[0]).toMatchObject({ label: 'Xanh lá hoặc xanh ô liu', season: 'autumn' })
  })

  it('lists questions ordered by sortOrder', () => {
    createQuizQuestion(db, { ...sampleQuestion, questionText: 'Câu 2', sortOrder: 1 })
    createQuizQuestion(db, { ...sampleQuestion, questionText: 'Câu 1', sortOrder: 0 })
    const questions = getQuizQuestions(db)
    expect(questions.map((q) => q.questionText)).toEqual(['Câu 1', 'Câu 2'])
  })

  it('replaces all options on update', () => {
    const created = createQuizQuestion(db, sampleQuestion)
    const updated = updateQuizQuestion(db, created.id, {
      ...sampleQuestion,
      options: [
        { label: 'Lựa chọn mới A', season: 'spring' },
        { label: 'Lựa chọn mới B', season: 'summer' },
      ],
    })
    expect(updated?.options).toHaveLength(2)
    expect(updated?.options.map((o) => o.label)).toEqual(['Lựa chọn mới A', 'Lựa chọn mới B'])
  })

  it('deletes a question and cascades its options', () => {
    const created = createQuizQuestion(db, sampleQuestion)
    expect(deleteQuizQuestion(db, created.id)).toBe(true)
    expect(getQuizQuestionById(db, created.id)).toBeNull()
    const remainingOptions = db.prepare('SELECT COUNT(*) AS count FROM quiz_options').get() as {
      count: number
    }
    expect(remainingOptions.count).toBe(0)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 7 blog posts and 5 quiz questions into an empty database', () => {
    seedIfEmpty(db)
    expect(getBlogPosts(db)).toHaveLength(7)
    expect(getQuizQuestions(db)).toHaveLength(5)
  })

  it('does nothing if blog_posts already has rows', () => {
    createBlogPost(db, samplePost)
    seedIfEmpty(db)
    expect(getBlogPosts(db)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/db.test.ts`
Expected: FAIL — `createQuizQuestion`, `seedIfEmpty`, etc. are not exported yet.

- [ ] **Step 3: Implement quiz CRUD + seed + singleton**

Append to `frontend/lib/db.ts`:
```ts
export type QuizOption = {
  id: number
  label: string
  season: Season
  sortOrder: number
}

export type QuizOptionInput = {
  label: string
  season: Season
}

export type QuizQuestion = {
  id: number
  questionText: string
  sortOrder: number
  options: QuizOption[]
}

export type QuizQuestionInput = {
  questionText: string
  sortOrder: number
  options: QuizOptionInput[]
}

type QuizQuestionRow = { id: number; question_text: string; sort_order: number }
type QuizOptionRow = { id: number; question_id: number; label: string; season: string; sort_order: number }

function getOptionsForQuestion(db: Database.Database, questionId: number): QuizOption[] {
  const rows = db
    .prepare('SELECT * FROM quiz_options WHERE question_id = ? ORDER BY sort_order ASC')
    .all(questionId) as QuizOptionRow[]
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    season: row.season as Season,
    sortOrder: row.sort_order,
  }))
}

function rowToQuizQuestion(db: Database.Database, row: QuizQuestionRow): QuizQuestion {
  return {
    id: row.id,
    questionText: row.question_text,
    sortOrder: row.sort_order,
    options: getOptionsForQuestion(db, row.id),
  }
}

export function getQuizQuestions(db: Database.Database): QuizQuestion[] {
  const rows = db.prepare('SELECT * FROM quiz_questions ORDER BY sort_order ASC').all() as QuizQuestionRow[]
  return rows.map((row) => rowToQuizQuestion(db, row))
}

export function getQuizQuestionById(db: Database.Database, id: number): QuizQuestion | null {
  const row = db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(id) as QuizQuestionRow | undefined
  return row ? rowToQuizQuestion(db, row) : null
}

export function createQuizQuestion(db: Database.Database, input: QuizQuestionInput): QuizQuestion {
  const insertQuestion = db.prepare('INSERT INTO quiz_questions (question_text, sort_order) VALUES (?, ?)')
  const insertOption = db.prepare(
    'INSERT INTO quiz_options (question_id, label, season, sort_order) VALUES (?, ?, ?, ?)'
  )

  const questionId = db.transaction(() => {
    const result = insertQuestion.run(input.questionText, input.sortOrder)
    const id = Number(result.lastInsertRowid)
    input.options.forEach((option, index) => {
      insertOption.run(id, option.label, option.season, index)
    })
    return id
  })()

  const created = getQuizQuestionById(db, questionId)
  if (!created) {
    throw new Error('Failed to read back created quiz question')
  }
  return created
}

export function updateQuizQuestion(
  db: Database.Database,
  id: number,
  input: QuizQuestionInput
): QuizQuestion | null {
  const existing = getQuizQuestionById(db, id)
  if (!existing) return null

  db.transaction(() => {
    db.prepare('UPDATE quiz_questions SET question_text = ?, sort_order = ? WHERE id = ?').run(
      input.questionText,
      input.sortOrder,
      id
    )
    db.prepare('DELETE FROM quiz_options WHERE question_id = ?').run(id)
    const insertOption = db.prepare(
      'INSERT INTO quiz_options (question_id, label, season, sort_order) VALUES (?, ?, ?, ?)'
    )
    input.options.forEach((option, index) => {
      insertOption.run(id, option.label, option.season, index)
    })
  })()

  return getQuizQuestionById(db, id)
}

export function deleteQuizQuestion(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM quiz_questions WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_BLOG_POSTS: BlogPostInput[] = [
  {
    slug: 'bi-quyet-chon-trang-phuc-ton-da-mua-dong',
    title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông - Xu hướng mới nhất 2026',
    excerpt:
      'Khám phá sức hút mãnh liệt của sự tương phản cao và cách kết hợp trang phục lạnh sáng sắc nét giúp tôn vinh thần thái tự nhiên, đánh bật mọi khung hình.',
    content:
      'Khám phá sức hút mãnh liệt của sự tương phản cao và cách kết hợp trang phục lạnh sáng sắc nét giúp tôn vinh thần thái tự nhiên, đánh bật mọi khung hình.',
    coverImageUrl: '/blog/featured-winter-outfit.jpg',
    category: 'personal-color',
    authorName: 'Stylist Mai Anh',
    isFeatured: true,
    publishedAt: '2026-06-18',
  },
  {
    slug: 'top-5-thoi-son-cool-undertone',
    title: 'Top 5 thỏi son kinh điển dành riêng cho cô nàng thuộc nhóm Cool Undertone',
    excerpt:
      'Sự thanh khiết và dịu mát của tone Mùa Hạ đến sắc son có sắc hồng dịu, tím sữa hoặc berry nhẹ để đôi môi luôn ửng hồng tự nhiên mà không bị già.',
    content:
      'Sự thanh khiết và dịu mát của tone Mùa Hạ đến sắc son có sắc hồng dịu, tím sữa hoặc berry nhẹ để đôi môi luôn ửng hồng tự nhiên mà không bị già.',
    coverImageUrl: '/blog/lipstick-flatlay.jpg',
    category: 'beauty',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-06-18',
  },
  {
    slug: 'tu-do-con-nhong-30-mon',
    title: 'Tủ đồ con nhộng (Capsule Wardrobe): Tối ưu 30 món mặc đẹp quanh năm',
    excerpt:
      'Hướng dẫn chi tiết từng bước thanh lọc trang phục lỗi thời, tập trung vào những món đồ bền vững có tính ứng dụng cao và chuẩn sắc thái cá nhân.',
    content:
      'Hướng dẫn chi tiết từng bước thanh lọc trang phục lỗi thời, tập trung vào những món đồ bền vững có tính ứng dụng cao và chuẩn sắc thái cá nhân.',
    coverImageUrl: '/blog/capsule-wardrobe-rail.jpg',
    category: 'sustainable',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-05-09',
  },
  {
    slug: 'doi-quan-ao-cu-nhan-phan-tich-mau-mien-phi',
    title: "Chiến dịch 'Đổi Quần Áo Cũ - Nhận Bản Phân Tích Màu Sắc Miễn Phí'",
    excerpt:
      'Chung tay cùng TwistFit giảm thiểu rác thải thời trang dệt may, mang lại vòng đời mới cho trang phục và nâng cấp gu ăn mặc của chính bạn.',
    content:
      'Chung tay cùng TwistFit giảm thiểu rác thải thời trang dệt may, mang lại vòng đời mới cho trang phục và nâng cấp gu ăn mặc của chính bạn.',
    coverImageUrl: '/blog/community-swap.jpg',
    category: 'community',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-05-06',
  },
  {
    slug: 'nhan-biet-warm-cool-undertone-tai-nha',
    title: 'Cách nhận biết Warm Undertone vs Cool Undertone chính xác tại nhà chỉ trong 1 phút',
    excerpt:
      'Chỉ với ánh sáng tự nhiên và vài mẹo quan sát mạch máu hoặc trang sức vàng bạc, bạn hoàn toàn có thể tự kiểm tra sắc thái da cơ bản.',
    content:
      'Chỉ với ánh sáng tự nhiên và vài mẹo quan sát mạch máu hoặc trang sức vàng bạc, bạn hoàn toàn có thể tự kiểm tra sắc thái da cơ bản.',
    coverImageUrl: '/blog/undertone-draping.jpg',
    category: 'personal-color',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-04-28',
  },
  {
    slug: 'phoi-layer-ton-dang-lung-dai-chan-ngan',
    title: 'Bí kíp phối layer tôn dáng cho người có tỷ lệ lưng dài chân ngắn',
    excerpt:
      "Tận dụng độ cạp cao của quần âu, áo croptop lửng và sự tương phản màu sắc giúp 'hack' chiều cao hiệu quả trên tính năng thử đồ ảo TwistFit.",
    content:
      "Tận dụng độ cạp cao của quần âu, áo croptop lửng và sự tương phản màu sắc giúp 'hack' chiều cao hiệu quả trên tính năng thử đồ ảo TwistFit.",
    coverImageUrl: '/blog/proportion-styling-flatlay.jpg',
    category: 'styling',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-04-20',
  },
  {
    slug: 'bang-mau-mua-thu-am-ap',
    title: 'Sức hút ấm áp từ bảng màu Mùa Thu (Autumn Warm): Khi tone đất lên ngôi',
    excerpt:
      'Những gam màu nâu caramel, cam cháy và rêu olive mang đến sự quý phái, đằm thắm cho những buổi hẹn hò hoặc sự kiện trang trọng.',
    content:
      'Những gam màu nâu caramel, cam cháy và rêu olive mang đến sự quý phái, đằm thắm cho những buổi hẹn hò hoặc sự kiện trang trọng.',
    coverImageUrl: '/blog/autumn-palette-moodboard.jpg',
    category: 'personal-color',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-04-12',
  },
]

const SEED_QUIZ_QUESTIONS: QuizQuestionInput[] = [
  {
    sortOrder: 0,
    questionText: 'Tĩnh mạch ở cổ tay bạn có màu gì khi nhìn dưới ánh sáng tự nhiên?',
    options: [
      { label: 'Xanh lá hoặc xanh ô liu', season: 'autumn' },
      { label: 'Xanh dương hoặc tím', season: 'winter' },
      { label: 'Xanh dương nhạt, khó phân biệt', season: 'summer' },
      { label: 'Xanh lá nhạt, ánh vàng', season: 'spring' },
    ],
  },
  {
    sortOrder: 1,
    questionText: 'Làn da bạn phản ứng thế nào khi ra nắng?',
    options: [
      { label: 'Dễ cháy nắng, ít khi sạm', season: 'summer' },
      { label: 'Sạm màu nhanh, hiếm khi cháy', season: 'autumn' },
      { label: 'Rám nắng đều, khỏe khoắn', season: 'spring' },
      { label: 'Da trắng sáng, tương phản rõ khi cháy nắng', season: 'winter' },
    ],
  },
  {
    sortOrder: 2,
    questionText: 'Màu tóc tự nhiên (chưa nhuộm) của bạn gần nhất với?',
    options: [
      { label: 'Nâu vàng, nâu hạt dẻ ánh đỏ', season: 'autumn' },
      { label: 'Đen tuyền hoặc nâu rất đậm', season: 'winter' },
      { label: 'Nâu tro, nâu hạt dẻ ánh xám', season: 'summer' },
      { label: 'Vàng óng, nâu sáng ánh vàng', season: 'spring' },
    ],
  },
  {
    sortOrder: 3,
    questionText: 'Màu mắt tự nhiên của bạn là?',
    options: [
      { label: 'Nâu đen sắc nét', season: 'winter' },
      { label: 'Nâu hạt dẻ ấm', season: 'autumn' },
      { label: 'Nâu nhạt hoặc xám xanh dịu', season: 'summer' },
      { label: 'Nâu sáng hoặc xanh lục ánh vàng', season: 'spring' },
    ],
  },
  {
    sortOrder: 4,
    questionText: 'Khi thử trang sức, loại nào tôn da bạn hơn?',
    options: [
      { label: 'Vàng ánh đồng, vàng ấm', season: 'autumn' },
      { label: 'Vàng nhạt, vàng hồng dịu', season: 'spring' },
      { label: 'Bạc, bạch kim sáng rõ', season: 'winter' },
      { label: 'Bạc mờ, tông pastel nhẹ', season: 'summer' },
    ],
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM blog_posts').get() as { count: number }
  if (count > 0) return

  SEED_BLOG_POSTS.forEach((post) => createBlogPost(db, post))
  SEED_QUIZ_QUESTIONS.forEach((question) => createQuizQuestion(db, question))
}

import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

let singleton: Database.Database | null = null

export function getDb(): Database.Database {
  if (singleton) return singleton

  const dbPath = path.join(process.cwd(), 'data', 'twistfit.db')
  const dir = path.dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const db = new Database(dbPath)
  initSchema(db)
  seedIfEmpty(db)
  singleton = db
  return db
}
```

Move the two `import` lines (`existsSync`/`mkdirSync` from `node:fs`, `path` from `node:path`)
to the top of the file alongside the existing `better-sqlite3` import — Node/ESLint import
ordering rules require imports at the top, not inline mid-file as shown above for readability
here.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/db.test.ts`
Expected: PASS (all tests, Blog + Quiz + seed)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/db.ts lib/db.test.ts
git commit -m "feat: add quiz question CRUD, seed data, and db singleton"
```

---

## Task 3: Signed admin session cookie helper

**Files:**
- Create: `frontend/lib/auth/session.ts`
- Test: `frontend/lib/auth/session.test.ts`

**Interfaces:**
- Consumes: `Role` from `@/lib/auth/mockAccounts` (already exists: `'user' | 'admin'`).
- Produces: `SESSION_COOKIE_NAME: string`, `SESSION_MAX_AGE_SECONDS: number`, `SessionPayload`
  (`{ email: string; role: Role; exp: number }`), `signPayload(payload: SessionPayload): string`,
  `createSessionCookieValue(email: string, role: Role): string`,
  `verifySessionCookieValue(value: string | undefined | null): SessionPayload | null`,
  `getAdminSessionFromCookieHeader(cookieHeader: string | null): SessionPayload | null`. The
  first three are consumed by Task 4 (login route); `getAdminSessionFromCookieHeader` is
  consumed by Tasks 7-10 (the protected blog/quiz write routes).

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/auth/session.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  signPayload,
  createSessionCookieValue,
  verifySessionCookieValue,
  getAdminSessionFromCookieHeader,
  SESSION_COOKIE_NAME,
  type SessionPayload,
} from './session'

describe('createSessionCookieValue / verifySessionCookieValue', () => {
  it('round-trips a valid, unexpired session', () => {
    const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
    const session = verifySessionCookieValue(value)
    expect(session?.email).toBe('admin@twistfit.vn')
    expect(session?.role).toBe('admin')
  })

  it('rejects a tampered value', () => {
    const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
    const tampered = value.slice(0, -1) + (value.at(-1) === 'a' ? 'b' : 'a')
    expect(verifySessionCookieValue(tampered)).toBeNull()
  })

  it('rejects an expired session', () => {
    const expired: SessionPayload = { email: 'admin@twistfit.vn', role: 'admin', exp: Date.now() - 1000 }
    const value = signPayload(expired)
    expect(verifySessionCookieValue(value)).toBeNull()
  })

  it('rejects a missing or malformed value', () => {
    expect(verifySessionCookieValue(undefined)).toBeNull()
    expect(verifySessionCookieValue(null)).toBeNull()
    expect(verifySessionCookieValue('not-a-valid-token')).toBeNull()
  })
})

describe('getAdminSessionFromCookieHeader', () => {
  it('returns the session when the cookie belongs to an admin', () => {
    const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
    const header = `other=1; ${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; another=2`
    expect(getAdminSessionFromCookieHeader(header)?.role).toBe('admin')
  })

  it('returns null when the session belongs to a non-admin user', () => {
    const value = createSessionCookieValue('user@twistfit.vn', 'user')
    const header = `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
    expect(getAdminSessionFromCookieHeader(header)).toBeNull()
  })

  it('returns null when the header is missing the cookie or is null', () => {
    expect(getAdminSessionFromCookieHeader('other=1')).toBeNull()
    expect(getAdminSessionFromCookieHeader(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/auth/session.test.ts`
Expected: FAIL — `./session` module does not exist yet.

- [ ] **Step 3: Implement `lib/auth/session.ts`**

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Role } from '@/lib/auth/mockAccounts'

export const SESSION_COOKIE_NAME = 'twistfit_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000

const SECRET = process.env.AUTH_COOKIE_SECRET ?? 'dev-only-insecure-secret'

export type SessionPayload = {
  email: string
  role: Role
  exp: number
}

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('base64url')
}

export function signPayload(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

export function createSessionCookieValue(email: string, role: Role): string {
  return signPayload({ email, role, exp: Date.now() + SESSION_TTL_MS })
}

export function verifySessionCookieValue(value: string | undefined | null): SessionPayload | null {
  if (!value) return null
  const [encoded, signature] = value.split('.')
  if (!encoded || !signature) return null

  const expectedSignature = sign(encoded)
  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null
  }

  let payload: SessionPayload
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload
  } catch {
    return null
  }

  if (payload.exp < Date.now()) return null
  return payload
}

export function getAdminSessionFromCookieHeader(cookieHeader: string | null): SessionPayload | null {
  if (!cookieHeader) return null

  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
  if (!match) return null

  const rawValue = match.slice(SESSION_COOKIE_NAME.length + 1)
  const session = verifySessionCookieValue(decodeURIComponent(rawValue))
  if (!session || session.role !== 'admin') return null
  return session
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/auth/session.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/auth/session.ts lib/auth/session.test.ts
git commit -m "feat: add signed admin session cookie helper"
```

---

## Task 4: Auth API routes (login/logout) — issue and clear the session cookie

**Files:**
- Create: `frontend/app/api/auth/login/route.ts`
- Create: `frontend/app/api/auth/login/route.test.ts`
- Create: `frontend/app/api/auth/logout/route.ts`
- Create: `frontend/app/api/auth/logout/route.test.ts`

**Interfaces:**
- Consumes: `findMockAccount` from `@/lib/auth/mockAccounts` (existing); `createSessionCookieValue`, `SESSION_COOKIE_NAME`, `SESSION_MAX_AGE_SECONDS`, `verifySessionCookieValue` from Task 3.
- Produces: `POST` handlers at `/api/auth/login` and `/api/auth/logout`, consumed by Task 5 (`LoginForm`/`AuthProvider` wiring).

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/auth/login/route.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { POST } from './route'
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

describe('POST /api/auth/login', () => {
  it('sets a signed session cookie for valid admin credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@twistfit.vn', password: 'admin1234' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)

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

Create `frontend/app/api/auth/logout/route.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { POST } from './route'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'

describe('POST /api/auth/logout', () => {
  it('clears the session cookie', async () => {
    const response = await POST()
    expect(response.status).toBe(200)
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/api/auth`
Expected: FAIL — neither `route.ts` file exists yet.

- [ ] **Step 3: Implement the routes**

Create `frontend/app/api/auth/login/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { findMockAccount } from '@/lib/auth/mockAccounts'
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null
  const email = body?.email
  const password = body?.password

  if (!email || !password) {
    return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 })
  }

  const account = findMockAccount(email, password)
  if (!account) {
    return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 })
  }

  const response = NextResponse.json({ email: account.email, role: account.role })
  response.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(account.email, account.role), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return response
}
```

Create `frontend/app/api/auth/logout/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(SESSION_COOKIE_NAME)
  return response
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/auth`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/api/auth
git commit -m "feat: add login/logout API routes that issue a signed session cookie"
```

---

## Task 5: Wire the session cookie into `LoginForm` and `AuthProvider`

**Files:**
- Modify: `frontend/components/auth/LoginForm.tsx`
- Modify: `frontend/components/auth/LoginForm.test.tsx`
- Modify: `frontend/components/auth/AuthProvider.tsx`
- Modify: `frontend/components/auth/AuthProvider.test.tsx`

**Interfaces:**
- Consumes: `/api/auth/login`, `/api/auth/logout` from Task 4.
- Produces: no new exports — existing `useAuth()` shape (`user`, `isHydrated`, `login`, `logout`) is unchanged, so `Header.tsx`/`AdminGate.tsx` need no changes.

- [ ] **Step 1: Update the failing tests first**

In `frontend/components/auth/LoginForm.test.tsx`, mock `global.fetch` and assert it's called
with the credentials. Replace the whole file:
```ts
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

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    )
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

  it('shows an error and does not redirect for invalid credentials', () => {
    renderLoginForm()
    submit('user@twistfit.vn', 'wrongpass')
    expect(screen.getByText('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

In `frontend/components/auth/AuthProvider.test.tsx`, add a `fetch` stub in `beforeEach` (mirroring
`LoginForm.test.tsx` above) so `logout()`'s new fetch call doesn't throw in jsdom, and update the
`afterEach` to `vi.unstubAllGlobals()` too. Insert these lines into the existing `beforeEach`/`afterEach`:
```ts
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })
```
(replacing the existing bodies of those two hooks; add `vi` to the `from 'vitest'` import if not
already imported).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/auth/LoginForm.test.tsx components/auth/AuthProvider.test.tsx`
Expected: FAIL — `fetch` assertion fails because `LoginForm`/`AuthProvider` don't call it yet.

- [ ] **Step 3: Update `LoginForm.tsx`**

In `frontend/components/auth/LoginForm.tsx`, change `handleSubmit` to also call the login API
(fire the request, but keep navigation driven by the existing mock `login()` result so the UI
behavior — and its error copy — stays exactly as before):
```ts
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const account = login(email, password)
    if (!account) {
      setError(true)
      return
    }

    setError(false)
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    router.push(account.role === 'admin' ? '/admin' : '/')
  }
```
(Change the function signature from `function handleSubmit(...)` to `async function handleSubmit(...)`.)

- [ ] **Step 4: Update `AuthProvider.tsx`**

In `frontend/components/auth/AuthProvider.tsx`, change `logout` to also clear the server-side
cookie:
```ts
  function logout() {
    setUser(null)
    window.localStorage.removeItem(STORAGE_KEY)
    void fetch('/api/auth/logout', { method: 'POST' })
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/auth/LoginForm.test.tsx components/auth/AuthProvider.test.tsx components/layout/Header.test.tsx`
Expected: PASS — including `Header.test.tsx`, which also exercises `logout()` and must still
pass unmodified since `useAuth()`'s shape didn't change.

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/LoginForm.tsx components/auth/LoginForm.test.tsx components/auth/AuthProvider.tsx components/auth/AuthProvider.test.tsx
git commit -m "feat: issue and clear the signed session cookie on login/logout"
```

---

## Task 6: `slugify` helper

**Files:**
- Create: `frontend/lib/slugify.ts`
- Test: `frontend/lib/slugify.test.ts`

**Interfaces:**
- Produces: `slugify(input: string): string`. Consumed by Task 7 (blog validation) and later
  `BlogPostForm` (Task 15).

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/slugify.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Bí quyết chọn trang phục')).toBe('bi-quyet-chon-trang-phuc')
  })

  it('strips Vietnamese diacritics including đ/Đ', () => {
    expect(slugify('Đổi Quần Áo Cũ')).toBe('doi-quan-ao-cu')
  })

  it('collapses punctuation into single hyphens and trims edges', () => {
    expect(slugify("  'Chiến dịch' -- Nhận Quà!!  ")).toBe('chien-dich-nhan-qua')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/slugify.test.ts`
Expected: FAIL — `./slugify` module does not exist yet.

- [ ] **Step 3: Implement `lib/slugify.ts`**

```ts
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/slugify.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/slugify.ts lib/slugify.test.ts
git commit -m "feat: add slugify helper for blog post slugs"
```

---

## Task 7: Blog API — validation + collection route (`GET`/`POST /api/blog`)

**Files:**
- Create: `frontend/app/api/blog/validate.ts`
- Create: `frontend/app/api/blog/validate.test.ts`
- Create: `frontend/app/api/blog/route.ts`
- Create: `frontend/app/api/blog/route.test.ts`

**Interfaces:**
- Consumes: `BLOG_CATEGORIES`, `BlogCategory`, `BlogPostInput`, `isBlogSlugTaken`, `getDb`, `getBlogPosts`, `createBlogPost` from `lib/db.ts` (Tasks 1-2); `slugify` from Task 6; `getAdminSessionFromCookieHeader` from Task 3.
- Produces: `validateBlogPostBody(body: unknown, db: Database.Database, excludeId?: number): { errors: Record<string, string> } | { data: BlogPostInput }` — consumed by Task 8 (`[id]/route.ts`). `GET`/`POST` handlers consumed by Task 20 (`BlogPostForm`) and Task 21 (`BlogPostList`).

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/blog/validate.test.ts`:
```ts
import { describe, expect, it, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema, createBlogPost } from '@/lib/db'
import { validateBlogPostBody } from './validate'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

const validBody = {
  title: 'Bài viết test',
  excerpt: 'Mô tả ngắn',
  content: 'Nội dung đầy đủ',
  coverImageUrl: '/blog/test.jpg',
  category: 'styling',
  authorName: null,
  isFeatured: false,
  publishedAt: '2026-01-01',
}

describe('validateBlogPostBody', () => {
  it('accepts a valid body and auto-generates the slug from the title', () => {
    const result = validateBlogPostBody(validBody, db)
    expect('data' in result).toBe(true)
    if ('data' in result) {
      expect(result.data.slug).toBe('bai-viet-test')
    }
  })

  it('uses an explicit slug when provided', () => {
    const result = validateBlogPostBody({ ...validBody, slug: 'duong-dan-tuy-chinh' }, db)
    expect('data' in result && result.data.slug).toBe('duong-dan-tuy-chinh')
  })

  it('collects field errors for missing required fields and an invalid category', () => {
    const result = validateBlogPostBody({ ...validBody, title: '', category: 'not-a-category' }, db)
    expect('errors' in result).toBe(true)
    if ('errors' in result) {
      expect(result.errors.title).toBeDefined()
      expect(result.errors.category).toBeDefined()
    }
  })

  it('rejects a slug already used by another post', () => {
    createBlogPost(db, { ...validBody, slug: 'bai-viet-test', category: 'styling' })
    const result = validateBlogPostBody(validBody, db)
    expect('errors' in result && result.errors.slug).toBeDefined()
  })

  it('allows keeping the same slug when editing that same post', () => {
    const existing = createBlogPost(db, { ...validBody, slug: 'bai-viet-test', category: 'styling' })
    const result = validateBlogPostBody(validBody, db, existing.id)
    expect('data' in result).toBe(true)
  })
})
```

Create `frontend/app/api/blog/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/db'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  actual.initSchema(testDb)
  return { ...actual, getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody = {
  title: 'Bài viết test',
  excerpt: 'Mô tả ngắn',
  content: 'Nội dung đầy đủ',
  coverImageUrl: '/blog/test.jpg',
  category: 'styling',
  authorName: null,
  isFeatured: false,
  publishedAt: '2026-01-01',
}

beforeEach(() => {
  getDb().exec('DELETE FROM blog_posts')
})

describe('GET /api/blog', () => {
  it('returns an empty list when there are no posts', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/blog', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/blog', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a post and returns 201', async () => {
    const request = new Request('http://localhost/api/blog', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const created = await response.json()
    expect(created.slug).toBe('bai-viet-test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/blog', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, title: '', category: 'not-a-category' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.errors.title).toBeDefined()
    expect(body.errors.category).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/api/blog/validate.test.ts app/api/blog/route.test.ts`
Expected: FAIL — neither `validate.ts` nor `route.ts` exist yet.

- [ ] **Step 3: Implement `validate.ts`**

Create `frontend/app/api/blog/validate.ts`:
```ts
import type Database from 'better-sqlite3'
import { BLOG_CATEGORIES, isBlogSlugTaken, type BlogCategory, type BlogPostInput } from '@/lib/db'
import { slugify } from '@/lib/slugify'

type RawBlogPostBody = {
  slug?: unknown
  title?: unknown
  excerpt?: unknown
  content?: unknown
  coverImageUrl?: unknown
  category?: unknown
  authorName?: unknown
  isFeatured?: unknown
  publishedAt?: unknown
}

export function validateBlogPostBody(
  body: unknown,
  db: Database.Database,
  excludeId?: number
): { errors: Record<string, string> } | { data: BlogPostInput } {
  const raw = (body ?? {}) as RawBlogPostBody
  const errors: Record<string, string> = {}

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) errors.title = 'Tiêu đề không được để trống'

  const excerpt = typeof raw.excerpt === 'string' ? raw.excerpt.trim() : ''
  if (!excerpt) errors.excerpt = 'Mô tả ngắn không được để trống'

  const content = typeof raw.content === 'string' ? raw.content.trim() : ''
  if (!content) errors.content = 'Nội dung không được để trống'

  const coverImageUrl = typeof raw.coverImageUrl === 'string' ? raw.coverImageUrl.trim() : ''
  if (!coverImageUrl) errors.coverImageUrl = 'Ảnh bìa không được để trống'

  const category = raw.category as BlogCategory
  if (!BLOG_CATEGORIES.includes(category)) errors.category = 'Chuyên mục không hợp lệ'

  const publishedAt = typeof raw.publishedAt === 'string' ? raw.publishedAt.trim() : ''
  if (!publishedAt) errors.publishedAt = 'Ngày đăng không được để trống'

  const requestedSlug = typeof raw.slug === 'string' ? raw.slug.trim() : ''
  const slug = slugify(requestedSlug || title)
  if (!slug) {
    errors.slug = 'Không thể tạo đường dẫn (slug) từ tiêu đề'
  } else if (isBlogSlugTaken(db, slug, excludeId)) {
    errors.slug = 'Đường dẫn (slug) này đã được dùng cho bài viết khác'
  }

  const authorName =
    typeof raw.authorName === 'string' && raw.authorName.trim() ? raw.authorName.trim() : null
  const isFeatured = raw.isFeatured === true

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return {
    data: { slug, title, excerpt, content, coverImageUrl, category, authorName, isFeatured, publishedAt },
  }
}
```

- [ ] **Step 4: Implement `route.ts`**

Create `frontend/app/api/blog/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb, getBlogPosts, createBlogPost } from '@/lib/db'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateBlogPostBody } from './validate'

export async function GET() {
  const db = getDb()
  return NextResponse.json(getBlogPosts(db))
}

export async function POST(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateBlogPostBody(body, db)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createBlogPost(db, result.data)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/blog/validate.test.ts app/api/blog/route.test.ts`
Expected: PASS (5 + 3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add app/api/blog/validate.ts app/api/blog/validate.test.ts app/api/blog/route.ts app/api/blog/route.test.ts
git commit -m "feat: add blog collection API route with validation"
```

---

## Task 8: Blog API — single-post route (`GET`/`PUT`/`DELETE /api/blog/[id]`)

**Files:**
- Create: `frontend/app/api/blog/[id]/route.ts`
- Create: `frontend/app/api/blog/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getDb`, `getBlogPostById`, `updateBlogPost`, `deleteBlogPost` from `lib/db.ts`; `validateBlogPostBody` from Task 7 (`../validate`); `getAdminSessionFromCookieHeader` from Task 3.
- Produces: `GET`/`PUT`/`DELETE` handlers, consumed by Task 22 (edit page) and Task 20 (`BlogPostForm`'s PUT call).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/blog/[id]/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb, createBlogPost } from '@/lib/db'
import { GET, PUT, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  actual.initSchema(testDb)
  return { ...actual, getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody = {
  slug: 'bai-viet-test',
  title: 'Bài viết test',
  excerpt: 'Mô tả ngắn',
  content: 'Nội dung đầy đủ',
  coverImageUrl: '/blog/test.jpg',
  category: 'styling',
  authorName: null,
  isFeatured: false,
  publishedAt: '2026-01-01',
}

beforeEach(() => {
  getDb().exec('DELETE FROM blog_posts')
})

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/blog/[id]', () => {
  it('returns the post when it exists', async () => {
    const created = createBlogPost(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).title).toBe('Bài viết test')
  })

  it('returns 404 when the post does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/blog/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createBlogPost(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the post', async () => {
    const created = createBlogPost(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, title: 'Tiêu đề đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).title).toBe('Tiêu đề đã sửa')
  })

  it('returns 404 when updating a post that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/blog/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createBlogPost(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the post', async () => {
    const created = createBlogPost(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM blog_posts WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/api/blog/\[id\]/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `frontend/app/api/blog/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getDb, getBlogPostById, updateBlogPost, deleteBlogPost } from '@/lib/db'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateBlogPostBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const post = getBlogPostById(getDb(), Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }
  return NextResponse.json(post)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateBlogPostBody(body, db, Number(id))
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateBlogPost(db, Number(id), result.data)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteBlogPost(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/api/blog/\[id\]/route.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/blog/[id]/route.ts" "app/api/blog/[id]/route.test.ts"
git commit -m "feat: add single blog post API route"
```

---

## Task 9: Quiz question API — validation + collection route

**Files:**
- Create: `frontend/app/api/quiz-questions/validate.ts`
- Create: `frontend/app/api/quiz-questions/validate.test.ts`
- Create: `frontend/app/api/quiz-questions/route.ts`
- Create: `frontend/app/api/quiz-questions/route.test.ts`

**Interfaces:**
- Consumes: `SEASONS`, `Season`, `QuizQuestionInput`, `getDb`, `getQuizQuestions`, `createQuizQuestion` from `lib/db.ts`; `getAdminSessionFromCookieHeader` from Task 3.
- Produces: `validateQuizQuestionBody(body: unknown): { errors: Record<string, string> } | { data: QuizQuestionInput }` — consumed by Task 10. `GET`/`POST` handlers — consumed by Task 23 (`QuizQuestionForm`) and Task 24 (`QuizQuestionList`).

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/quiz-questions/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateQuizQuestionBody } from './validate'

const validBody = {
  questionText: 'Câu hỏi test?',
  sortOrder: 0,
  options: [
    { label: 'Lựa chọn A', season: 'spring' },
    { label: 'Lựa chọn B', season: 'summer' },
  ],
}

describe('validateQuizQuestionBody', () => {
  it('accepts a valid body', () => {
    const result = validateQuizQuestionBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty question text', () => {
    const result = validateQuizQuestionBody({ ...validBody, questionText: '' })
    expect('errors' in result && result.errors.questionText).toBeDefined()
  })

  it('rejects fewer than 2 options', () => {
    const result = validateQuizQuestionBody({ ...validBody, options: [validBody.options[0]] })
    expect('errors' in result && result.errors.options).toBeDefined()
  })

  it('rejects an option with an invalid season', () => {
    const result = validateQuizQuestionBody({
      ...validBody,
      options: [{ label: 'A', season: 'not-a-season' }, validBody.options[1]],
    })
    expect('errors' in result && result.errors['options.0.season']).toBeDefined()
  })

  it('rejects an option with an empty label', () => {
    const result = validateQuizQuestionBody({
      ...validBody,
      options: [{ label: '', season: 'spring' }, validBody.options[1]],
    })
    expect('errors' in result && result.errors['options.0.label']).toBeDefined()
  })
})
```

Create `frontend/app/api/quiz-questions/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/db'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  actual.initSchema(testDb)
  return { ...actual, getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody = {
  questionText: 'Câu hỏi test?',
  sortOrder: 0,
  options: [
    { label: 'Lựa chọn A', season: 'spring' },
    { label: 'Lựa chọn B', season: 'summer' },
  ],
}

beforeEach(() => {
  getDb().exec('DELETE FROM quiz_questions')
})

describe('GET /api/quiz-questions', () => {
  it('returns an empty list when there are no questions', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/quiz-questions', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/quiz-questions', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a question and returns 201', async () => {
    const request = new Request('http://localhost/api/quiz-questions', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const created = await response.json()
    expect(created.options).toHaveLength(2)
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/quiz-questions', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, questionText: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.questionText).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/api/quiz-questions/validate.test.ts app/api/quiz-questions/route.test.ts`
Expected: FAIL — neither `validate.ts` nor `route.ts` exist yet.

- [ ] **Step 3: Implement `validate.ts`**

Create `frontend/app/api/quiz-questions/validate.ts`:
```ts
import { SEASONS, type QuizQuestionInput, type Season } from '@/lib/db'

type RawOption = { label?: unknown; season?: unknown }
type RawBody = { questionText?: unknown; sortOrder?: unknown; options?: unknown }

export function validateQuizQuestionBody(
  body: unknown
): { errors: Record<string, string> } | { data: QuizQuestionInput } {
  const raw = (body ?? {}) as RawBody
  const errors: Record<string, string> = {}

  const questionText = typeof raw.questionText === 'string' ? raw.questionText.trim() : ''
  if (!questionText) errors.questionText = 'Nội dung câu hỏi không được để trống'

  const sortOrder = typeof raw.sortOrder === 'number' ? raw.sortOrder : 0

  const rawOptions = Array.isArray(raw.options) ? (raw.options as RawOption[]) : []
  if (rawOptions.length < 2) {
    errors.options = 'Cần ít nhất 2 lựa chọn'
  }

  const options = rawOptions.map((option, index) => {
    const label = typeof option.label === 'string' ? option.label.trim() : ''
    const season = option.season as Season
    if (!label) errors[`options.${index}.label`] = 'Lựa chọn không được để trống'
    if (!SEASONS.includes(season)) errors[`options.${index}.season`] = 'Mùa không hợp lệ'
    return { label, season }
  })

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { questionText, sortOrder, options } }
}
```

- [ ] **Step 4: Implement `route.ts`**

Create `frontend/app/api/quiz-questions/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getDb, getQuizQuestions, createQuizQuestion } from '@/lib/db'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateQuizQuestionBody } from './validate'

export async function GET() {
  const db = getDb()
  return NextResponse.json(getQuizQuestions(db))
}

export async function POST(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateQuizQuestionBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createQuizQuestion(db, result.data)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/quiz-questions/validate.test.ts app/api/quiz-questions/route.test.ts`
Expected: PASS (5 + 3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add app/api/quiz-questions/validate.ts app/api/quiz-questions/validate.test.ts app/api/quiz-questions/route.ts app/api/quiz-questions/route.test.ts
git commit -m "feat: add quiz question collection API route with validation"
```

---

## Task 10: Quiz question API — single-question route

**Files:**
- Create: `frontend/app/api/quiz-questions/[id]/route.ts`
- Create: `frontend/app/api/quiz-questions/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getDb`, `getQuizQuestionById`, `updateQuizQuestion`, `deleteQuizQuestion` from `lib/db.ts`; `validateQuizQuestionBody` from Task 9; `getAdminSessionFromCookieHeader` from Task 3.
- Produces: `GET`/`PUT`/`DELETE` handlers, consumed by Task 25 (edit page), Task 23
  (`QuizQuestionForm`'s PUT call), and Task 24 (`QuizQuestionList`'s reorder PUTs).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/quiz-questions/[id]/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb, createQuizQuestion } from '@/lib/db'
import { GET, PUT, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  actual.initSchema(testDb)
  return { ...actual, getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody = {
  questionText: 'Câu hỏi test?',
  sortOrder: 0,
  options: [
    { label: 'Lựa chọn A', season: 'spring' },
    { label: 'Lựa chọn B', season: 'summer' },
  ],
}

beforeEach(() => {
  getDb().exec('DELETE FROM quiz_questions')
})

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/quiz-questions/[id]', () => {
  it('returns the question when it exists', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).questionText).toBe('Câu hỏi test?')
  })

  it('returns 404 when the question does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/quiz-questions/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the question and replaces its options', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, questionText: 'Câu hỏi đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).questionText).toBe('Câu hỏi đã sửa')
  })

  it('returns 404 when updating a question that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/quiz-questions/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the question', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM quiz_questions WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/api/quiz-questions/\[id\]/route.test.ts`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `frontend/app/api/quiz-questions/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getDb, getQuizQuestionById, updateQuizQuestion, deleteQuizQuestion } from '@/lib/db'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateQuizQuestionBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const question = getQuizQuestionById(getDb(), Number(id))
  if (!question) {
    return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 })
  }
  return NextResponse.json(question)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = validateQuizQuestionBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateQuizQuestion(getDb(), Number(id), result.data)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteQuizQuestion(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/api/quiz-questions/\[id\]/route.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/quiz-questions/[id]/route.ts" "app/api/quiz-questions/[id]/route.test.ts"
git commit -m "feat: add single quiz question API route"
```

---

## Task 11: Blog category presentation lookup

**Files:**
- Create: `frontend/components/blog/categoryPresentation.ts`
- Test: `frontend/components/blog/categoryPresentation.test.ts`

**Interfaces:**
- Consumes: `BlogCategory`, `BLOG_CATEGORIES` from `lib/db.ts` (Task 1).
- Produces: `CATEGORY_PRESENTATION: Record<BlogCategory, { translationKey: string; colorClass: string }>`. Consumed by Task 12 (`BlogArticleGrid`) and Task 13 (`BlogFeaturedArticle`). `translationKey` values match the existing keys already in `messages/vi.json` under `Blog.ArticleGrid.categories` (`personalColor`, `styling`, `sustainable`, `beauty`, `community`) — no message file changes needed for this task.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/blog/categoryPresentation.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { BLOG_CATEGORIES } from '@/lib/db'
import { CATEGORY_PRESENTATION } from './categoryPresentation'

describe('CATEGORY_PRESENTATION', () => {
  it('has an entry for every blog category', () => {
    for (const category of BLOG_CATEGORIES) {
      expect(CATEGORY_PRESENTATION[category]).toBeDefined()
      expect(CATEGORY_PRESENTATION[category].translationKey).toBeTruthy()
      expect(CATEGORY_PRESENTATION[category].colorClass).toMatch(/^text-/)
    }
  })

  it('maps personal-color to the personalColor translation key', () => {
    expect(CATEGORY_PRESENTATION['personal-color'].translationKey).toBe('personalColor')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/blog/categoryPresentation.test.ts`
Expected: FAIL — module does not exist yet.

- [ ] **Step 3: Implement `categoryPresentation.ts`**

```ts
import type { BlogCategory } from '@/lib/db'

export const CATEGORY_PRESENTATION: Record<BlogCategory, { translationKey: string; colorClass: string }> = {
  'personal-color': { translationKey: 'personalColor', colorClass: 'text-secondary' },
  styling: { translationKey: 'styling', colorClass: 'text-primary' },
  sustainable: { translationKey: 'sustainable', colorClass: 'text-tertiary' },
  beauty: { translationKey: 'beauty', colorClass: 'text-secondary' },
  community: { translationKey: 'community', colorClass: 'text-primary' },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/blog/categoryPresentation.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/blog/categoryPresentation.ts components/blog/categoryPresentation.test.ts
git commit -m "feat: add blog category label/color presentation lookup"
```

---

## Task 12: Rewrite `BlogArticleGrid` to be data-driven

**Files:**
- Modify: `frontend/components/blog/BlogArticleGrid.tsx`
- Modify: `frontend/components/blog/BlogArticleGrid.test.tsx`

**Interfaces:**
- Consumes: `BlogPost`, `BLOG_CATEGORIES` from `lib/db.ts`; `CATEGORY_PRESENTATION` from Task 11.
- Produces: `BlogArticleGrid({ posts: BlogPost[] })` — a named-export-free default export whose
  prop shape is consumed by Task 14 (`app/blog/page.tsx`).

Note: the hardcoded `ARTICLES` array, the "views" counter, and the non-functional sort
dropdown and static pagination footer (neither was wired to anything in the original) are
removed as part of this rewrite — they depended on the fields dropped in the spec (`views`)
or never worked in the first place. The read-more link now points to the real
`/blog/[slug]` route (Task 16) instead of `href="#"`.

- [ ] **Step 1: Write the failing test**

Replace `frontend/components/blog/BlogArticleGrid.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogArticleGrid from './BlogArticleGrid'
import type { BlogPost } from '@/lib/db'

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'bai-a',
    title: 'Bài viết A về Personal Color',
    excerpt: 'Mô tả A',
    content: 'Nội dung A',
    coverImageUrl: '/blog/a.jpg',
    category: 'personal-color',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 2,
    slug: 'bai-b',
    title: 'Bài viết B về Phối đồ',
    excerpt: 'Mô tả B',
    content: 'Nội dung B',
    coverImageUrl: '/blog/b.jpg',
    category: 'styling',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-01-02',
    createdAt: '2026-01-02',
    updatedAt: '2026-01-02',
  },
]

describe('BlogArticleGrid', () => {
  it('renders every post with a link to its detail page', () => {
    renderWithIntl(<BlogArticleGrid posts={POSTS} />)
    expect(screen.getByText('Bài viết A về Personal Color')).toBeInTheDocument()
    expect(screen.getByText('Bài viết B về Phối đồ')).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /Đọc ngay/ })
    expect(links[0]).toHaveAttribute('href', '/blog/bai-a')
  })

  it('filters by category', () => {
    renderWithIntl(<BlogArticleGrid posts={POSTS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Phối đồ & Vóc dáng' }))
    expect(screen.queryByText('Bài viết A về Personal Color')).not.toBeInTheDocument()
    expect(screen.getByText('Bài viết B về Phối đồ')).toBeInTheDocument()
  })

  it('filters by search query', () => {
    renderWithIntl(<BlogArticleGrid posts={POSTS} />)
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm bài viết...'), { target: { value: 'Phối đồ' } })
    expect(screen.queryByText('Bài viết A về Personal Color')).not.toBeInTheDocument()
    expect(screen.getByText('Bài viết B về Phối đồ')).toBeInTheDocument()
  })

  it('shows an empty state message when nothing matches', () => {
    renderWithIntl(<BlogArticleGrid posts={POSTS} />)
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm bài viết...'), {
      target: { value: 'khong-ton-tai' },
    })
    expect(screen.getByText('Không tìm thấy bài viết phù hợp')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/blog/BlogArticleGrid.test.tsx`
Expected: FAIL — component still reads the old hardcoded `ARTICLES`/no `posts` prop.

- [ ] **Step 3: Rewrite `BlogArticleGrid.tsx`**

Replace `frontend/components/blog/BlogArticleGrid.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BLOG_CATEGORIES, type BlogPost } from '@/lib/db'
import { CATEGORY_PRESENTATION } from './categoryPresentation'

const CATEGORY_FILTERS = ['all', ...BLOG_CATEGORIES] as const

export default function BlogArticleGrid({ posts }: { posts: BlogPost[] }) {
  const t = useTranslations('Blog.ArticleGrid')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({})

  const visiblePosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesCategory = activeCategory === 'all' || post.category === activeCategory
      const matchesSearch = !query || post.title.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [posts, activeCategory, searchQuery])

  return (
    <section className="mb-space-xl">
      <div className="mb-space-xl flex flex-col justify-between gap-space-md rounded-2xl bg-surface-container-lowest/70 p-space-md shadow-sm backdrop-blur-xl lg:flex-row lg:items-center md:p-space-lg">
        <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs lg:pb-0">
          {CATEGORY_FILTERS.map((category) => {
            const translationKey = category === 'all' ? 'all' : CATEGORY_PRESENTATION[category].translationKey
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 whitespace-nowrap rounded-full px-space-md py-space-xs text-label-lg transition-all ${
                  activeCategory === category
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {t(`categories.${translationKey}`)}
              </button>
            )
          })}
        </div>
        <div className="flex w-full items-center gap-space-sm lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-full bg-surface-container-low/80 py-space-xs pl-9 pr-space-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/70 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      <div className="mb-space-lg flex items-center justify-between">
        <div>
          <span className="text-label-sm font-bold uppercase tracking-widest text-primary">
            {t('sectionKicker')}
          </span>
          <h3 className="text-headline-md font-bold text-on-surface">{t('sectionHeading')}</h3>
        </div>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest py-space-xl text-center shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
          <h4 className="mt-space-xs text-headline-sm font-semibold text-on-surface">
            {t('noResultsTitle')}
          </h4>
          <p className="mt-1 text-body-md text-on-surface-variant">{t('noResultsBody')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post) => {
            const isBookmarked = Boolean(bookmarked[post.id])
            const presentation = CATEGORY_PRESENTATION[post.category]
            return (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-space-sm left-space-sm">
                    <span
                      className={`rounded-full bg-surface-container-lowest/90 px-space-sm py-0.5 text-label-sm font-semibold shadow-xs backdrop-blur-md ${presentation.colorClass}`}
                    >
                      {t(`categories.${presentation.translationKey}`)}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={t('bookmarkAriaLabel')}
                    aria-pressed={isBookmarked}
                    onClick={() =>
                      setBookmarked((current) => ({ ...current, [post.id]: !current[post.id] }))
                    }
                    className={`absolute right-space-sm top-space-sm flex h-8 w-8 items-center justify-center rounded-full shadow-xs backdrop-blur-md transition-colors ${
                      isBookmarked
                        ? 'bg-secondary-container text-secondary'
                        : 'bg-surface-container-lowest/90 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isBookmarked ? 'bookmark_added' : 'bookmark'}
                    </span>
                  </button>
                </div>
                <div className="flex flex-1 flex-col justify-between p-space-md">
                  <div>
                    <div className="mb-space-xs flex items-center gap-space-xs text-label-sm text-on-surface-variant">
                      <span className="font-semibold text-primary">TwistFit</span>
                      <span>•</span>
                      <span className="rounded bg-surface-container px-space-xs py-0.5 font-medium text-on-surface-variant">
                        {post.publishedAt}
                      </span>
                    </div>
                    <h4 className="mb-space-xs line-clamp-2 text-title-md font-bold text-on-surface transition-colors group-hover:text-primary">
                      {post.title}
                    </h4>
                    <p className="line-clamp-3 text-body-sm text-on-surface-variant">{post.excerpt}</p>
                  </div>
                  <div className="mt-space-sm flex items-center justify-end pt-space-md">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-0.5 text-label-md font-semibold text-primary hover:underline"
                    >
                      {t('readNowLink')}{' '}
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/blog/BlogArticleGrid.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/blog/BlogArticleGrid.tsx components/blog/BlogArticleGrid.test.tsx
git commit -m "feat: make BlogArticleGrid render posts passed in as a prop"
```

---

## Task 13: Rewrite `BlogFeaturedArticle` to be data-driven; add reading-time estimate

**Files:**
- Create: `frontend/lib/readingTime.ts`
- Test: `frontend/lib/readingTime.test.ts`
- Modify: `frontend/components/blog/BlogFeaturedArticle.tsx`
- Modify: `frontend/components/blog/BlogFeaturedArticle.test.tsx`

**Interfaces:**
- Produces: `estimateReadingMinutes(content: string): number`.
- Consumes: `BlogPost` from `lib/db.ts`; `CATEGORY_PRESENTATION` from Task 11;
  `estimateReadingMinutes` from this task.
- Produces: `BlogFeaturedArticle({ post: BlogPost })` — consumed by Task 14
  (`app/blog/page.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `frontend/lib/readingTime.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { estimateReadingMinutes } from './readingTime'

describe('estimateReadingMinutes', () => {
  it('rounds to the nearest minute at 200 words/minute', () => {
    const content = Array(400).fill('từ').join(' ')
    expect(estimateReadingMinutes(content)).toBe(2)
  })

  it('never returns less than 1 minute for non-empty content', () => {
    expect(estimateReadingMinutes('Vài từ ngắn')).toBe(1)
  })
})
```

Replace `frontend/components/blog/BlogFeaturedArticle.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogFeaturedArticle from './BlogFeaturedArticle'
import type { BlogPost } from '@/lib/db'

const POST: BlogPost = {
  id: 1,
  slug: 'mua-dong-2026',
  title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
  excerpt: 'Khám phá sức hút mãnh liệt của sự tương phản cao.',
  content: Array(1000).fill('từ').join(' '),
  coverImageUrl: '/blog/featured-winter-outfit.jpg',
  category: 'personal-color',
  authorName: 'Stylist Mai Anh',
  isFeatured: true,
  publishedAt: '2026-06-18',
  createdAt: '2026-06-18',
  updatedAt: '2026-06-18',
}

describe('BlogFeaturedArticle', () => {
  it('renders the post title, author, and a link to its detail page', () => {
    renderWithIntl(<BlogFeaturedArticle post={POST} />)
    expect(
      screen.getByRole('heading', { name: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông' })
    ).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Đọc tiếp/ })).toHaveAttribute('href', '/blog/mua-dong-2026')
    expect(screen.getByText('5 phút đọc')).toBeInTheDocument()
  })

  it('omits the author block when the post has no author', () => {
    renderWithIntl(<BlogFeaturedArticle post={{ ...POST, authorName: null }} />)
    expect(screen.queryByText(/Bởi /)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run lib/readingTime.test.ts components/blog/BlogFeaturedArticle.test.tsx`
Expected: FAIL — `lib/readingTime.ts` doesn't exist; `BlogFeaturedArticle` doesn't accept a `post` prop yet.

- [ ] **Step 3: Implement `lib/readingTime.ts`**

```ts
export function estimateReadingMinutes(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / 200))
}
```

- [ ] **Step 4: Rewrite `BlogFeaturedArticle.tsx`**

Replace `frontend/components/blog/BlogFeaturedArticle.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { BlogPost } from '@/lib/db'
import { estimateReadingMinutes } from '@/lib/readingTime'
import { CATEGORY_PRESENTATION } from './categoryPresentation'

export default function BlogFeaturedArticle({ post }: { post: BlogPost }) {
  const t = useTranslations('Blog.FeaturedArticle')
  const tCategories = useTranslations('Blog.ArticleGrid.categories')
  const presentation = CATEGORY_PRESENTATION[post.category]
  const readingMinutes = estimateReadingMinutes(post.content)

  return (
    <section className="mb-space-xl">
      <div className="group grid grid-cols-1 overflow-hidden rounded-3xl bg-surface-container-lowest/90 shadow-md backdrop-blur-xl transition-all duration-300 hover:shadow-xl lg:grid-cols-12">
        <div className="relative min-h-[340px] overflow-hidden md:min-h-[440px] lg:col-span-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/50 via-transparent to-transparent lg:hidden" />
          <div className="absolute left-space-md top-space-md flex flex-wrap gap-space-xs">
            <span className="flex items-center gap-space-xs rounded-full bg-secondary px-space-md py-space-xs text-label-md text-on-secondary shadow-sm">
              <span className="material-symbols-outlined text-[16px]">stars</span>
              {t('featuredBadge')}
            </span>
            <span className="rounded-full bg-surface-container-lowest/80 px-space-md py-space-xs text-label-md text-primary shadow-sm backdrop-blur-md">
              {tCategories(presentation.translationKey)}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between bg-surface-container-lowest/95 p-space-lg md:p-space-xl lg:col-span-5">
          <div>
            <div className="mb-space-sm flex items-center gap-space-sm text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1 font-semibold text-primary">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                {post.publishedAt}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                {readingMinutes} phút đọc
              </span>
            </div>
            <h2 className="mb-space-md text-headline-md font-bold leading-snug tracking-tight text-on-surface transition-colors group-hover:text-primary md:text-headline-lg">
              {post.title}
            </h2>
            <p className="mb-space-lg text-body-md leading-relaxed text-on-surface-variant">{post.excerpt}</p>
          </div>
          <div className="pt-space-md">
            <div className="flex items-center justify-between gap-space-md">
              {post.authorName ? (
                <div className="flex items-center gap-space-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container font-bold text-secondary">
                    {post.authorName
                      .split(' ')
                      .slice(-2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <p className="text-label-md font-semibold text-on-surface">Bởi {post.authorName}</p>
                </div>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  title={t('bookmarkTitle')}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-secondary-container hover:text-secondary"
                >
                  <span className="material-symbols-outlined text-[20px]">bookmark</span>
                </button>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-space-xs rounded-full bg-primary px-space-md py-space-xs text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container"
                >
                  <span>{t('readMoreButton')}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run lib/readingTime.test.ts components/blog/BlogFeaturedArticle.test.tsx`
Expected: PASS (2 + 2 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add lib/readingTime.ts lib/readingTime.test.ts components/blog/BlogFeaturedArticle.tsx components/blog/BlogFeaturedArticle.test.tsx
git commit -m "feat: make BlogFeaturedArticle render a post passed in as a prop"
```

---

## Task 14: `app/blog/page.tsx` reads posts from the database

**Files:**
- Modify: `frontend/app/blog/page.tsx`
- Modify: `frontend/app/blog/page.test.tsx`

**Interfaces:**
- Consumes: `getDb`, `getBlogPosts` from `lib/db.ts`; `BlogFeaturedArticle` (Task 13),
  `BlogArticleGrid` (Task 12).

`getBlogPosts` is synchronous (`better-sqlite3` has no async API), so this page does **not**
need to become an `async` component — it stays a plain function component, calling the DB
directly at render time like any other synchronous data source.

- [ ] **Step 1: Write the failing test**

Replace `frontend/app/blog/page.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { BlogPost } from '@/lib/db'

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'mua-dong-2026',
    title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
    excerpt: 'Khám phá sức hút mãnh liệt của sự tương phản cao.',
    content: 'Nội dung bài nổi bật.',
    coverImageUrl: '/blog/featured-winter-outfit.jpg',
    category: 'personal-color',
    authorName: 'Stylist Mai Anh',
    isFeatured: true,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
  {
    id: 2,
    slug: 'top-5-thoi-son',
    title: 'Top 5 thỏi son kinh điển dành riêng cho cô nàng thuộc nhóm Cool Undertone',
    excerpt: 'Sự thanh khiết và dịu mát của tone Mùa Hạ.',
    content: 'Nội dung bài thường.',
    coverImageUrl: '/blog/lipstick-flatlay.jpg',
    category: 'beauty',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
]

vi.mock('@/lib/db', () => ({
  getDb: () => ({}),
  getBlogPosts: () => POSTS,
}))

describe('BlogPage', async () => {
  const { default: BlogPage } = await import('./page')

  it('renders the hero heading, featured article and article grid', () => {
    renderWithIntl(<BlogPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Tạp Chí Phong Cách TwistFit' })).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
    expect(screen.getByText(/Top 5 thỏi son kinh điển/)).toBeInTheDocument()
    expect(screen.getByText('Nhận Cẩm Nang Thời Trang Hàng Tuần')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/blog/page.test.tsx`
Expected: FAIL — `page.tsx` still renders `<BlogFeaturedArticle />`/`<BlogArticleGrid />` with
no props, which now fail their required-prop type (and, at runtime, `post`/`posts` are
`undefined`).

- [ ] **Step 3: Rewrite `app/blog/page.tsx`**

```tsx
import BlogHero from '@/components/blog/BlogHero'
import BlogFeaturedArticle from '@/components/blog/BlogFeaturedArticle'
import BlogArticleGrid from '@/components/blog/BlogArticleGrid'
import BlogQuizCallout from '@/components/blog/BlogQuizCallout'
import BlogNewsletterSection from '@/components/blog/BlogNewsletterSection'
import { getDb, getBlogPosts } from '@/lib/db'

export default function BlogPage() {
  const posts = getBlogPosts(getDb())
  const featured = posts.find((post) => post.isFeatured) ?? posts[0]
  const rest = featured ? posts.filter((post) => post.id !== featured.id) : posts

  return (
    <main className="w-full bg-surface">
      <div className="mx-auto max-w-7xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
        <BlogHero />
        {featured && <BlogFeaturedArticle post={featured} />}
        <BlogArticleGrid posts={rest} />
        <BlogQuizCallout />
        <BlogNewsletterSection />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/blog/page.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/blog/page.tsx app/blog/page.test.tsx
git commit -m "feat: read blog posts from the database on the blog page"
```

---

## Task 15: Markdown rendering (sanitized)

**Files:**
- Modify: `frontend/package.json` (add `marked`, `isomorphic-dompurify`)
- Create: `frontend/lib/markdown.ts`
- Test: `frontend/lib/markdown.test.ts`

**Interfaces:**
- Produces: `renderMarkdown(content: string): string` (returns sanitized HTML). Consumed by
  Task 16 (`/blog/[slug]` detail page).

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd frontend && npm install marked isomorphic-dompurify
```

- [ ] **Step 2: Write the failing test**

Create `frontend/lib/markdown.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders basic markdown to HTML', () => {
    const html = renderMarkdown('# Tiêu đề\n\nĐoạn **in đậm**.')
    expect(html).toContain('<h1>Tiêu đề</h1>')
    expect(html).toContain('<strong>in đậm</strong>')
  })

  it('strips script tags and inline event handlers', () => {
    const html = renderMarkdown('Nội dung <script>alert(1)</script> và <img src=x onerror=alert(2)>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('onerror')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/markdown.test.ts`
Expected: FAIL — `./markdown` module does not exist yet.

- [ ] **Step 4: Implement `lib/markdown.ts`**

```ts
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

export function renderMarkdown(content: string): string {
  const html = marked.parse(content, { async: false }) as string
  return DOMPurify.sanitize(html)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/markdown.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add package.json package-lock.json lib/markdown.ts lib/markdown.test.ts
git commit -m "feat: add sanitized markdown rendering helper"
```

---

## Task 16: Blog detail page `/blog/[slug]`

**Files:**
- Create: `frontend/app/blog/[slug]/page.tsx`
- Create: `frontend/app/blog/[slug]/page.test.tsx`

**Interfaces:**
- Consumes: `getDb`, `getBlogPostBySlug` from `lib/db.ts`; `renderMarkdown` from Task 15;
  `notFound` from `next/navigation`.

This page's chrome text ("Quay lại Blog", "Bởi {author}") is hardcoded Vietnamese rather
than routed through `next-intl`, unlike the rest of the app. Reason: the page must be `async`
(it awaits the Next.js `params` promise), and the codebase's only established i18n pattern is
`useTranslations` in Client Components — there is no working precedent here for translating
inside an `async` Server Component, and the page's actual content (title/body/date/author) is
untranslated database content anyway, so the chrome text follows the same language.

- [ ] **Step 1: Write the failing test**

Create `frontend/app/blog/[slug]/page.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { BlogPost } from '@/lib/db'

const POST: BlogPost = {
  id: 1,
  slug: 'mua-dong-2026',
  title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
  excerpt: 'Mô tả ngắn',
  content: '# Tiêu đề phụ\n\nNội dung **đầy đủ** của bài viết.',
  coverImageUrl: '/blog/featured-winter-outfit.jpg',
  category: 'personal-color',
  authorName: 'Stylist Mai Anh',
  isFeatured: true,
  publishedAt: '2026-06-18',
  createdAt: '2026-06-18',
  updatedAt: '2026-06-18',
}

const notFoundMock = vi.fn()

vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}))

vi.mock('@/lib/db', () => ({
  getDb: () => ({}),
  getBlogPostBySlug: (_db: unknown, slug: string) => (slug === POST.slug ? POST : null),
}))

describe('BlogPostPage', async () => {
  const { default: BlogPostPage } = await import('./page')

  it('renders the post title and markdown content when the slug exists', async () => {
    const ui = await BlogPostPage({ params: Promise.resolve({ slug: 'mua-dong-2026' }) })
    renderWithIntl(ui)
    expect(
      screen.getByRole('heading', { name: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiêu đề phụ' })).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
  })

  it('calls notFound() when the slug does not exist', async () => {
    await BlogPostPage({ params: Promise.resolve({ slug: 'khong-ton-tai' }) })
    expect(notFoundMock).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/blog/\[slug\]/page.test.tsx"`
Expected: FAIL — `./page` module does not exist yet.

- [ ] **Step 3: Implement `frontend/app/blog/[slug]/page.tsx`**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb, getBlogPostBySlug } from '@/lib/db'
import { renderMarkdown } from '@/lib/markdown'

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPostBySlug(getDb(), slug)

  if (!post) {
    notFound()
    return null
  }

  return (
    <main className="w-full bg-surface">
      <article className="mx-auto max-w-3xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
        <Link href="/blog" className="text-label-md font-semibold text-primary hover:underline">
          ← Quay lại Blog
        </Link>
        <h1 className="mt-space-md text-headline-lg font-bold text-on-surface">{post.title}</h1>
        <div className="mt-space-xs flex items-center gap-space-sm text-label-sm text-on-surface-variant">
          <span>{post.publishedAt}</span>
          {post.authorName && (
            <>
              <span>•</span>
              <span>Bởi {post.authorName}</span>
            </>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.coverImageUrl} alt={post.title} className="mt-space-lg w-full rounded-3xl object-cover" />
        <div
          className="prose mt-space-lg max-w-none text-body-md text-on-surface"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </article>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/blog/\[slug\]/page.test.tsx"`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/blog/[slug]/page.tsx" "app/blog/[slug]/page.test.tsx"
git commit -m "feat: add blog post detail page"
```

---

## Task 17: `QuizFlow` reads questions from a prop instead of the hardcoded file

**Files:**
- Modify: `frontend/components/personal-color/QuizFlow.tsx`
- Modify: `frontend/components/personal-color/QuizFlow.test.tsx`
- Modify: `frontend/lib/computeSeasonResult.ts` (change the `Season` import source)
- Delete: `frontend/lib/personalColorQuiz.ts`

**Interfaces:**
- Consumes: `QuizQuestion`, `Season` from `lib/db.ts` (Task 2).
- Produces: `QuizFlow({ questions: QuizQuestion[] })` — consumed by Task 18.

- [ ] **Step 1: Update `computeSeasonResult.ts`'s import first**

`lib/personalColorQuiz.ts` is about to be deleted, so its only other consumer must stop
importing from it before the delete. In `frontend/lib/computeSeasonResult.ts`, change:
```ts
import type { Season } from './personalColorQuiz'
```
to:
```ts
import type { Season } from './db'
```
`computeSeasonResult.test.ts` needs no changes (it only uses the string literals
`'winter'`/`'summer'`/etc., which structurally satisfy `Season` either way). Run
`cd frontend && npx vitest run lib/computeSeasonResult.test.ts` to confirm it still passes
(3 tests) before continuing.

- [ ] **Step 2: Write the failing test**

Replace `frontend/components/personal-color/QuizFlow.test.tsx`:
```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
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

describe('QuizFlow', () => {
  beforeEach(() => {
    pushMock.mockClear()
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

    for (let step = 0; step < 5; step++) {
      const optionButtons = screen.getAllByRole('button').filter((btn) => btn.dataset.quizOption === 'true')
      fireEvent.click(optionButtons[0])
      const isLast = step === 4
      const advanceButton = screen.getByRole('button', { name: isLast ? 'Xem kết quả' : 'Tiếp theo' })
      fireEvent.click(advanceButton)
    }

    expect(pushMock).toHaveBeenCalledWith('/personal-color/result')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/personal-color/QuizFlow.test.tsx`
Expected: FAIL — `QuizFlow` still imports `QUIZ_QUESTIONS` from the (about-to-be-deleted)
`lib/personalColorQuiz.ts` and doesn't accept a `questions` prop.

- [ ] **Step 4: Rewrite `QuizFlow.tsx`**

Replace `frontend/components/personal-color/QuizFlow.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { QuizQuestion, Season } from '@/lib/db'
import { computeSeasonResult } from '@/lib/computeSeasonResult'

export default function QuizFlow({ questions }: { questions: QuizQuestion[] }) {
  const t = useTranslations('PersonalColor.Quiz')
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<(Season | null)[]>(() => Array(questions.length).fill(null))

  const totalSteps = questions.length
  const question = questions[currentStep]
  const selectedSeason = answers[currentStep]
  const isLastStep = currentStep === totalSteps - 1

  function selectOption(season: Season) {
    setAnswers((prev) => prev.map((value, index) => (index === currentStep ? season : value)))
  }

  function handleAdvance() {
    if (isLastStep) {
      const finalAnswers = answers.filter((value): value is Season => value !== null)
      computeSeasonResult(finalAnswers)
      router.push('/personal-color/result')
      return
    }
    setCurrentStep((step) => step + 1)
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-label-sm text-on-surface-variant">
          <span>{t('badgeLabel')}</span>
          <span>{t('questionCounter', { current: currentStep + 1, total: totalSteps })}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      <h2 className="text-headline-sm font-bold text-on-surface">{question.questionText}</h2>
      <div className="mt-5 space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedSeason === option.season
          return (
            <button
              key={option.label}
              type="button"
              data-quiz-option="true"
              onClick={() => selectOption(option.season)}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-body-md transition-colors ${
                isSelected
                  ? 'border-primary bg-primary-fixed text-on-surface'
                  : 'border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>{option.label}</span>
              {isSelected && (
                <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
          disabled={currentStep === 0}
          className="text-label-md font-semibold text-on-surface-variant disabled:opacity-0"
        >
          {t('backButton')}
        </button>
        <button
          type="button"
          onClick={handleAdvance}
          disabled={selectedSeason === null}
          className="rounded-full bg-primary px-7 py-3 text-label-lg text-on-primary transition-all hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastStep ? t('viewResultButton') : t('nextButton')}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Delete `lib/personalColorQuiz.ts`**

```bash
cd frontend && rm lib/personalColorQuiz.ts
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/personal-color/QuizFlow.test.tsx lib/computeSeasonResult.test.ts`
Expected: PASS (3 + 3 tests). Task 18 fixes the now-broken `app/personal-color/quiz/page.tsx`
(it still imports the deleted file) — that's expected to be red until Task 18 completes; don't
run the full suite yet.

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/personal-color/QuizFlow.tsx components/personal-color/QuizFlow.test.tsx lib/computeSeasonResult.ts lib/personalColorQuiz.ts
git commit -m "feat: make QuizFlow render questions passed in as a prop"
```

---

## Task 18: `/personal-color/quiz` reads questions from the database

**Files:**
- Create: `frontend/components/personal-color/QuizPageContent.tsx`
- Create: `frontend/components/personal-color/QuizPageContent.test.tsx`
- Modify: `frontend/app/personal-color/quiz/page.tsx`
- Modify: `frontend/app/personal-color/quiz/page.test.tsx`

**Interfaces:**
- Consumes: `getDb`, `getQuizQuestions`, `QuizQuestion` from `lib/db.ts`; `QuizFlow` from
  Task 17.

Same reasoning as Task 14: `getQuizQuestions` is synchronous, so the page itself does not need
to be `async`. Translated chrome text (heading/subtitle) moves into a small Client Component
(`QuizPageContent`) so it can keep using `useTranslations` like the rest of the app, while
`page.tsx` stays a thin synchronous Server Component that only fetches data.

- [ ] **Step 1: Write the failing tests**

Create `frontend/components/personal-color/QuizPageContent.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuizPageContent from './QuizPageContent'
import type { QuizQuestion } from '@/lib/db'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const QUESTIONS: QuizQuestion[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  questionText: `Câu hỏi số ${index + 1}?`,
  sortOrder: index,
  options: [
    { id: index * 10 + 1, label: 'A', season: 'spring', sortOrder: 0 },
    { id: index * 10 + 2, label: 'B', season: 'summer', sortOrder: 1 },
  ],
}))

describe('QuizPageContent', () => {
  it('renders the quiz heading and first question', () => {
    renderWithIntl(<QuizPageContent questions={QUESTIONS} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kiểm Tra Personal Color' })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi 1/5')).toBeInTheDocument()
  })
})
```

Replace `frontend/app/personal-color/quiz/page.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { QuizQuestion } from '@/lib/db'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const QUESTIONS: QuizQuestion[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  questionText: `Câu hỏi số ${index + 1}?`,
  sortOrder: index,
  options: [
    { id: index * 10 + 1, label: 'A', season: 'spring', sortOrder: 0 },
    { id: index * 10 + 2, label: 'B', season: 'summer', sortOrder: 1 },
  ],
}))

vi.mock('@/lib/db', () => ({
  getDb: () => ({}),
  getQuizQuestions: () => QUESTIONS,
}))

describe('QuizPage', async () => {
  const { default: QuizPage } = await import('./page')

  it('renders the quiz heading and first question', () => {
    renderWithIntl(<QuizPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kiểm Tra Personal Color' })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi 1/5')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/personal-color/QuizPageContent.test.tsx app/personal-color/quiz/page.test.tsx`
Expected: FAIL — `QuizPageContent` doesn't exist; `page.tsx` still imports the deleted
`lib/personalColorQuiz.ts`.

- [ ] **Step 3: Create `QuizPageContent.tsx`**

```tsx
'use client'

import { useTranslations } from 'next-intl'
import QuizFlow from './QuizFlow'
import type { QuizQuestion } from '@/lib/db'

export default function QuizPageContent({ questions }: { questions: QuizQuestion[] }) {
  const t = useTranslations('PersonalColor.Quiz')

  return (
    <main className="w-full bg-surface px-margin py-space-xl sm:px-margin-desktop">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="text-headline-lg text-on-surface">{t('pageTitle')}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {t('pageSubtitle', { count: questions.length })}
        </p>
      </div>
      <QuizFlow questions={questions} />
    </main>
  )
}
```

- [ ] **Step 4: Rewrite `app/personal-color/quiz/page.tsx`**

```tsx
import QuizPageContent from '@/components/personal-color/QuizPageContent'
import { getDb, getQuizQuestions } from '@/lib/db'

export default function QuizPage() {
  const questions = getQuizQuestions(getDb())
  return <QuizPageContent questions={questions} />
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/personal-color/QuizPageContent.test.tsx app/personal-color/quiz/page.test.tsx`
Expected: PASS (1 + 1 tests)

- [ ] **Step 6: Run the full suite to confirm nothing else broke**

Run: `cd frontend && npx vitest run`
Expected: PASS — every test in the project, including the ones touched by Task 17's interim
red state.

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/personal-color/QuizPageContent.tsx components/personal-color/QuizPageContent.test.tsx app/personal-color/quiz/page.tsx app/personal-color/quiz/page.test.tsx
git commit -m "feat: read quiz questions from the database on the quiz page"
```

---

## Task 19: `AdminDashboard` links to the two new sections

**Files:**
- Modify: `frontend/components/auth/AdminDashboard.tsx`
- Create: `frontend/components/auth/AdminDashboard.test.tsx`
- Modify: `frontend/messages/vi.json` (`Admin` namespace)

**Interfaces:**
- Consumes: `useAuth` from `AuthProvider` (existing).
- Produces: no new exports; links to `/admin/blog` (Task 21) and `/admin/quiz` (Task 24).

- [ ] **Step 1: Update messages**

In `frontend/messages/vi.json`, inside the existing `"Admin"` object, replace the
`"placeholder"` key with:
```json
    "blogCardTitle": "Quản lý Blog",
    "blogCardDescription": "Tạo, sửa và xóa bài viết hiển thị trên trang Blog.",
    "quizCardTitle": "Quản lý câu hỏi Quiz",
    "quizCardDescription": "Tạo, sửa và sắp xếp thứ tự câu hỏi trong bài trắc nghiệm Personal Color."
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/auth/AdminDashboard.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AdminDashboard from './AdminDashboard'
import { AuthProvider } from './AuthProvider'

describe('AdminDashboard', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('links to the blog and quiz admin sections', () => {
    renderWithIntl(
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    )
    expect(screen.getByRole('link', { name: /Quản lý Blog/ })).toHaveAttribute('href', '/admin/blog')
    expect(screen.getByRole('link', { name: /Quản lý câu hỏi Quiz/ })).toHaveAttribute('href', '/admin/quiz')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: FAIL — no links exist yet.

- [ ] **Step 4: Update `AdminDashboard.tsx`**

Replace the final `<p className="mt-6 ...">{t('placeholder')}</p>` line with:
```tsx
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link
            href="/admin/blog"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('blogCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('blogCardDescription')}</p>
          </Link>
          <Link
            href="/admin/quiz"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('quizCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('quizCardDescription')}</p>
          </Link>
        </div>
```
and add `import Link from 'next/link'` to the top of the file.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/AdminDashboard.tsx components/auth/AdminDashboard.test.tsx messages/vi.json
git commit -m "feat: link the admin dashboard to blog and quiz management"
```

---

## Task 20: `BlogPostForm` — shared create/edit form

**Files:**
- Create: `frontend/components/admin/BlogPostForm.tsx`
- Create: `frontend/components/admin/BlogPostForm.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.BlogForm` namespace)

**Interfaces:**
- Consumes: `BLOG_CATEGORIES`, `BlogCategory`, `BlogPost` from `lib/db.ts`; `slugify` from
  Task 6; `/api/blog`, `/api/blog/[id]` from Tasks 7-8.
- Produces: `BlogPostForm({ initialPost?: BlogPost })` — consumed by Task 22 (new/edit pages).

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "BlogForm": {
      "fields": {
        "title": "Tiêu đề",
        "slug": "Đường dẫn (slug)",
        "excerpt": "Mô tả ngắn",
        "content": "Nội dung (Markdown)",
        "coverImageUrl": "Ảnh bìa (URL)",
        "category": "Chuyên mục",
        "authorName": "Tác giả (không bắt buộc)",
        "publishedAt": "Ngày đăng",
        "isFeatured": "Đặt làm bài nổi bật"
      },
      "categories": {
        "personal-color": "Personal Color",
        "styling": "Phối đồ & Vóc dáng",
        "sustainable": "Lối sống xanh & Bền vững",
        "beauty": "Làm đẹp & Makeup",
        "community": "Cộng đồng TwistFit"
      },
      "submitCreate": "Tạo bài viết",
      "submitEdit": "Lưu thay đổi",
      "unauthorizedError": "Bạn cần đăng nhập với quyền quản trị.",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại."
    }
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/admin/BlogPostForm.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogPostForm from './BlogPostForm'
import type { BlogPost } from '@/lib/db'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_POST: BlogPost = {
  id: 42,
  slug: 'bai-hien-co',
  title: 'Bài viết hiện có',
  excerpt: 'Mô tả hiện có',
  content: 'Nội dung hiện có',
  coverImageUrl: '/blog/existing.jpg',
  category: 'beauty',
  authorName: 'Tác giả X',
  isFeatured: false,
  publishedAt: '2026-01-01',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('BlogPostForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('auto-fills the slug from the title while creating a new post', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<BlogPostForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài Viết Mới Của Tôi' } })
    expect(screen.getByLabelText('Đường dẫn (slug)')).toHaveValue('bai-viet-moi-cua-toi')
  })

  it('stops auto-filling the slug once the user edits it directly', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<BlogPostForm />)
    fireEvent.change(screen.getByLabelText('Đường dẫn (slug)'), { target: { value: 'duong-dan-tuy-chinh' } })
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Tiêu đề khác' } })
    expect(screen.getByLabelText('Đường dẫn (slug)')).toHaveValue('duong-dan-tuy-chinh')
  })

  it('POSTs to /api/blog when creating and redirects to the list on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) })
    )
    renderWithIntl(<BlogPostForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài Mới' } })
    fireEvent.change(screen.getByLabelText('Mô tả ngắn'), { target: { value: 'Mô tả' } })
    fireEvent.change(screen.getByLabelText('Nội dung (Markdown)'), { target: { value: 'Nội dung' } })
    fireEvent.change(screen.getByLabelText('Ảnh bìa (URL)'), { target: { value: '/blog/x.jpg' } })
    fireEvent.change(screen.getByLabelText('Ngày đăng'), { target: { value: '2026-02-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo bài viết' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/blog'))
    expect(fetch).toHaveBeenCalledWith('/api/blog', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/blog/{id} when editing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_POST })
    )
    renderWithIntl(<BlogPostForm initialPost={EXISTING_POST} />)
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài viết hiện có')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/blog'))
    expect(fetch).toHaveBeenCalledWith('/api/blog/42', expect.objectContaining({ method: 'PUT' }))
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
    renderWithIntl(<BlogPostForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo bài viết' }))

    await waitFor(() => expect(screen.getByText('Tiêu đề không được để trống')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/BlogPostForm.test.tsx`
Expected: FAIL — `./BlogPostForm` module does not exist yet.

- [ ] **Step 4: Implement `BlogPostForm.tsx`**

Create `frontend/components/admin/BlogPostForm.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from '@/lib/db'
import { slugify } from '@/lib/slugify'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function BlogPostForm({ initialPost }: { initialPost?: BlogPost }) {
  const t = useTranslations('Admin.BlogForm')
  const router = useRouter()
  const isEditing = Boolean(initialPost)

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing)
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.coverImageUrl ?? '')
  const [category, setCategory] = useState<BlogCategory>(initialPost?.category ?? BLOG_CATEGORIES[0])
  const [authorName, setAuthorName] = useState(initialPost?.authorName ?? '')
  const [isFeatured, setIsFeatured] = useState(initialPost?.isFeatured ?? false)
  const [publishedAt, setPublishedAt] = useState(initialPost?.publishedAt ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugManuallyEdited) {
      setSlug(slugify(value))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = {
      title,
      slug,
      excerpt,
      content,
      coverImageUrl,
      category,
      authorName: authorName.trim() || null,
      isFeatured,
      publishedAt,
    }

    const response = await fetch(isEditing ? `/api/blog/${initialPost!.id}` : '/api/blog', {
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

    router.push('/admin/blog')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="post-title" className="text-label-md font-semibold text-on-surface">
          {t('fields.title')}
        </label>
        <input
          id="post-title"
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          className={inputClass}
        />
        {errors.title && <p className="text-label-sm text-error">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="post-slug" className="text-label-md font-semibold text-on-surface">
          {t('fields.slug')}
        </label>
        <input
          id="post-slug"
          value={slug}
          onChange={(event) => {
            setSlugManuallyEdited(true)
            setSlug(event.target.value)
          }}
          className={inputClass}
        />
        {errors.slug && <p className="text-label-sm text-error">{errors.slug}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="post-excerpt" className="text-label-md font-semibold text-on-surface">
          {t('fields.excerpt')}
        </label>
        <textarea
          id="post-excerpt"
          rows={2}
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          className={inputClass}
        />
        {errors.excerpt && <p className="text-label-sm text-error">{errors.excerpt}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="post-content" className="text-label-md font-semibold text-on-surface">
          {t('fields.content')}
        </label>
        <textarea
          id="post-content"
          rows={10}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className={inputClass}
        />
        {errors.content && <p className="text-label-sm text-error">{errors.content}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="post-cover-image" className="text-label-md font-semibold text-on-surface">
            {t('fields.coverImageUrl')}
          </label>
          <input
            id="post-cover-image"
            value={coverImageUrl}
            onChange={(event) => setCoverImageUrl(event.target.value)}
            className={inputClass}
          />
          {errors.coverImageUrl && <p className="text-label-sm text-error">{errors.coverImageUrl}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="post-category" className="text-label-md font-semibold text-on-surface">
            {t('fields.category')}
          </label>
          <select
            id="post-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as BlogCategory)}
            className={inputClass}
          >
            {BLOG_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(`categories.${value}`)}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-label-sm text-error">{errors.category}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="post-author" className="text-label-md font-semibold text-on-surface">
            {t('fields.authorName')}
          </label>
          <input
            id="post-author"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="post-published-at" className="text-label-md font-semibold text-on-surface">
            {t('fields.publishedAt')}
          </label>
          <input
            id="post-published-at"
            type="date"
            value={publishedAt}
            onChange={(event) => setPublishedAt(event.target.value)}
            className={inputClass}
          />
          {errors.publishedAt && <p className="text-label-sm text-error">{errors.publishedAt}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-label-md font-semibold text-on-surface">
        <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
        {t('fields.isFeatured')}
      </label>

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

Run: `cd frontend && npx vitest run components/admin/BlogPostForm.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/admin/BlogPostForm.tsx components/admin/BlogPostForm.test.tsx messages/vi.json
git commit -m "feat: add shared blog post create/edit form"
```

---

## Task 21: Blog admin list — `BlogPostList` + `/admin/blog` page

**Files:**
- Create: `frontend/components/admin/BlogPostList.tsx`
- Create: `frontend/components/admin/BlogPostList.test.tsx`
- Create: `frontend/app/admin/blog/page.tsx`
- Create: `frontend/app/admin/blog/page.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.BlogList` namespace)

**Interfaces:**
- Consumes: `BlogPost` from `lib/db.ts`; `GET`/`DELETE /api/blog(/[id])` from Tasks 7-8;
  `AdminGate` from the existing auth work; `BlogPostForm` link target (`/admin/blog/new`,
  `/admin/blog/[id]/edit` — built in Task 22).
- Produces: `BlogPostList()` (no props — fetches its own data), default-exported
  `AdminBlogPage`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "BlogList": {
      "title": "Quản lý Blog",
      "newButton": "Viết bài mới",
      "columnTitle": "Tiêu đề",
      "columnCategory": "Chuyên mục",
      "columnDate": "Ngày đăng",
      "editButton": "Sửa",
      "deleteButton": "Xóa",
      "deleteConfirm": "Xóa bài viết này?",
      "emptyState": "Chưa có bài viết nào.",
      "loading": "Đang tải..."
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/admin/BlogPostList.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogPostList from './BlogPostList'
import type { BlogPost } from '@/lib/db'

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'bai-a',
    title: 'Bài viết A',
    excerpt: 'Mô tả',
    content: 'Nội dung',
    coverImageUrl: '/blog/a.jpg',
    category: 'styling',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('BlogPostList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders posts with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<BlogPostList />)

    await waitFor(() => expect(screen.getByText('Bài viết A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/blog/1/edit')
  })

  it('deletes a post when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => POSTS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<BlogPostList />)

    await waitFor(() => expect(screen.getByText('Bài viết A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Bài viết A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/blog/1', { method: 'DELETE' })
  })

  it('shows an empty state when there are no posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<BlogPostList />)
    await waitFor(() => expect(screen.getByText('Chưa có bài viết nào.')).toBeInTheDocument())
  })
})
```

Create `frontend/app/admin/blog/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminBlogPage from './page'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('AdminBlogPage', () => {
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

  it('renders the heading and a link to create a new post, for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminBlogPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Quản lý Blog' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Viết bài mới' })).toHaveAttribute('href', '/admin/blog/new')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/admin/BlogPostList.test.tsx app/admin/blog/page.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `BlogPostList.tsx`**

Create `frontend/components/admin/BlogPostList.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { BlogPost } from '@/lib/db'

export default function BlogPostList() {
  const t = useTranslations('Admin.BlogList')
  const [posts, setPosts] = useState<BlogPost[] | null>(null)

  useEffect(() => {
    fetch('/api/blog')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/blog/${id}`, { method: 'DELETE' })
    setPosts((current) => current?.filter((post) => post.id !== id) ?? null)
  }

  if (posts === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (posts.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnTitle')}</th>
          <th className="py-2">{t('columnCategory')}</th>
          <th className="py-2">{t('columnDate')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{post.title}</td>
            <td className="py-3 text-on-surface-variant">{post.category}</td>
            <td className="py-3 text-on-surface-variant">{post.publishedAt}</td>
            <td className="py-3 text-right">
              <Link href={`/admin/blog/${post.id}/edit`} className="mr-4 font-semibold text-primary hover:underline">
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(post.id)}
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

- [ ] **Step 5: Implement `app/admin/blog/page.tsx`**

Create `frontend/app/admin/blog/page.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AdminGate from '@/components/auth/AdminGate'
import BlogPostList from '@/components/admin/BlogPostList'

export default function AdminBlogPage() {
  const t = useTranslations('Admin.BlogList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <Link
              href="/admin/blog/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('newButton')}
            </Link>
          </div>
          <BlogPostList />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/admin/BlogPostList.test.tsx app/admin/blog/page.test.tsx`
Expected: PASS (3 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/admin/BlogPostList.tsx components/admin/BlogPostList.test.tsx app/admin/blog/page.tsx app/admin/blog/page.test.tsx messages/vi.json
git commit -m "feat: add blog post admin list page"
```

---

## Task 22: `/admin/blog/new` and `/admin/blog/[id]/edit` pages

**Files:**
- Create: `frontend/app/admin/blog/new/page.tsx`
- Create: `frontend/app/admin/blog/new/page.test.tsx`
- Create: `frontend/app/admin/blog/[id]/edit/page.tsx`
- Create: `frontend/app/admin/blog/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `BlogPostForm` from Task 20; `AdminGate` (existing); `GET /api/blog/[id]` from
  Task 8.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/admin/blog/new/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewBlogPostPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewBlogPostPage', () => {
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
        <NewBlogPostPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Tạo bài viết' })).toBeInTheDocument()
  })
})
```

Create `frontend/app/admin/blog/[id]/edit/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditBlogPostPage from './page'
import type { BlogPost } from '@/lib/db'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const POST: BlogPost = {
  id: 7,
  slug: 'bai-can-sua',
  title: 'Bài cần sửa',
  excerpt: 'Mô tả',
  content: 'Nội dung',
  coverImageUrl: '/blog/x.jpg',
  category: 'styling',
  authorName: null,
  isFeatured: false,
  publishedAt: '2026-01-01',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditBlogPostPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the post by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditBlogPostPage params={Promise.resolve({ id: '7' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/api/blog/7')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/admin/blog/new/page.test.tsx "app/admin/blog/\[id\]/edit/page.test.tsx"`
Expected: FAIL — neither page exists yet.

- [ ] **Step 3: Implement `app/admin/blog/new/page.tsx`**

```tsx
'use client'

import AdminGate from '@/components/auth/AdminGate'
import BlogPostForm from '@/components/admin/BlogPostForm'

export default function NewBlogPostPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <BlogPostForm />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 4: Implement `app/admin/blog/[id]/edit/page.tsx`**

Note: this deliberately resolves `params` inside `useEffect` (`params.then(...)`) rather than
with React's `use()` hook. `use()` suspends on any plain `Promise` — including an
already-resolved one, since native Promise callbacks are always deferred to a microtask — so
it needs a `<Suspense>` boundary around every caller, including in tests. Resolving it in an
effect avoids that entirely and composes with the `waitFor`-based async assertions already
used throughout this plan.

```tsx
'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import BlogPostForm from '@/components/admin/BlogPostForm'
import type { BlogPost } from '@/lib/db'

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const [post, setPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/blog/${id}`)
        .then((response) => response.json())
        .then(setPost)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {post && <BlogPostForm initialPost={post} />}
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/admin/blog/new/page.test.tsx "app/admin/blog/\[id\]/edit/page.test.tsx"`
Expected: PASS (1 + 1 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add "app/admin/blog/new" "app/admin/blog/[id]"
git commit -m "feat: add blog post create/edit admin pages"
```

---

## Task 23: `QuizQuestionForm` — shared create/edit form

**Files:**
- Create: `frontend/components/admin/QuizQuestionForm.tsx`
- Create: `frontend/components/admin/QuizQuestionForm.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.QuizForm` namespace)

**Interfaces:**
- Consumes: `SEASONS`, `Season`, `QuizQuestion` from `lib/db.ts`; `/api/quiz-questions`,
  `/api/quiz-questions/[id]` from Tasks 9-10.
- Produces: `QuizQuestionForm({ initialQuestion?: QuizQuestion })` — consumed by Task 25.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "QuizForm": {
      "questionLabel": "Nội dung câu hỏi",
      "optionLabel": "Lựa chọn",
      "seasonLabel": "Mùa tương ứng",
      "addOption": "Thêm lựa chọn",
      "removeOption": "Xóa lựa chọn",
      "submitCreate": "Tạo câu hỏi",
      "submitEdit": "Lưu thay đổi",
      "unauthorizedError": "Bạn cần đăng nhập với quyền quản trị.",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại.",
      "seasons": {
        "spring": "Mùa Xuân",
        "summer": "Mùa Hạ",
        "autumn": "Mùa Thu",
        "winter": "Mùa Đông"
      }
    }
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/admin/QuizQuestionForm.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuizQuestionForm from './QuizQuestionForm'
import type { QuizQuestion } from '@/lib/db'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_QUESTION: QuizQuestion = {
  id: 9,
  questionText: 'Câu hỏi hiện có?',
  sortOrder: 0,
  options: [
    { id: 1, label: 'Lựa chọn 1', season: 'spring', sortOrder: 0 },
    { id: 2, label: 'Lựa chọn 2', season: 'summer', sortOrder: 1 },
  ],
}

describe('QuizQuestionForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('starts with 4 empty options when creating', () => {
    renderWithIntl(<QuizQuestionForm />)
    expect(screen.getAllByLabelText(/Lựa chọn \d/)).toHaveLength(4)
  })

  it('can add and remove options', () => {
    renderWithIntl(<QuizQuestionForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm lựa chọn' }))
    expect(screen.getAllByLabelText(/Lựa chọn \d/)).toHaveLength(5)

    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa lựa chọn' })[0])
    expect(screen.getAllByLabelText(/Lựa chọn \d/)).toHaveLength(4)
  })

  it('POSTs to /api/quiz-questions when creating and redirects on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<QuizQuestionForm />)
    fireEvent.change(screen.getByLabelText('Nội dung câu hỏi'), { target: { value: 'Câu hỏi mới?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/quiz'))
    expect(fetch).toHaveBeenCalledWith('/api/quiz-questions', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/quiz-questions/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_QUESTION }))
    renderWithIntl(<QuizQuestionForm initialQuestion={EXISTING_QUESTION} />)
    expect(screen.getByLabelText('Nội dung câu hỏi')).toHaveValue('Câu hỏi hiện có?')
    expect(screen.getAllByLabelText(/Lựa chọn \d/)).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/quiz'))
    expect(fetch).toHaveBeenCalledWith('/api/quiz-questions/9', expect.objectContaining({ method: 'PUT' }))
  })

  it('shows field errors returned by the API instead of redirecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: { questionText: 'Nội dung câu hỏi không được để trống' } }),
      })
    )
    renderWithIntl(<QuizQuestionForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() =>
      expect(screen.getByText('Nội dung câu hỏi không được để trống')).toBeInTheDocument()
    )
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/QuizQuestionForm.test.tsx`
Expected: FAIL — `./QuizQuestionForm` module does not exist yet.

- [ ] **Step 4: Implement `QuizQuestionForm.tsx`**

Create `frontend/components/admin/QuizQuestionForm.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { SEASONS, type QuizQuestion, type Season } from '@/lib/db'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

type OptionDraft = { label: string; season: Season }

function initialOptions(initialQuestion?: QuizQuestion): OptionDraft[] {
  if (initialQuestion) {
    return initialQuestion.options.map((option) => ({ label: option.label, season: option.season }))
  }
  return [
    { label: '', season: 'spring' },
    { label: '', season: 'summer' },
    { label: '', season: 'autumn' },
    { label: '', season: 'winter' },
  ]
}

export default function QuizQuestionForm({ initialQuestion }: { initialQuestion?: QuizQuestion }) {
  const t = useTranslations('Admin.QuizForm')
  const router = useRouter()
  const isEditing = Boolean(initialQuestion)

  const [questionText, setQuestionText] = useState(initialQuestion?.questionText ?? '')
  const [options, setOptions] = useState<OptionDraft[]>(() => initialOptions(initialQuestion))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((current) => current.map((option, i) => (i === index ? { ...option, ...patch } : option)))
  }

  function addOption() {
    setOptions((current) => [...current, { label: '', season: 'spring' }])
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = {
      questionText,
      sortOrder: initialQuestion?.sortOrder ?? 0,
      options,
    }

    const response = await fetch(
      isEditing ? `/api/quiz-questions/${initialQuestion!.id}` : '/api/quiz-questions',
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

    router.push('/admin/quiz')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="question-text" className="text-label-md font-semibold text-on-surface">
          {t('questionLabel')}
        </label>
        <textarea
          id="question-text"
          rows={2}
          value={questionText}
          onChange={(event) => setQuestionText(event.target.value)}
          className={inputClass}
        />
        {errors.questionText && <p className="text-label-sm text-error">{errors.questionText}</p>}
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-1 space-y-1.5">
              <label htmlFor={`option-label-${index}`} className="text-label-md font-semibold text-on-surface">
                {t('optionLabel')} {index + 1}
              </label>
              <input
                id={`option-label-${index}`}
                value={option.label}
                onChange={(event) => updateOption(index, { label: event.target.value })}
                className={inputClass}
              />
              {errors[`options.${index}.label`] && (
                <p className="text-label-sm text-error">{errors[`options.${index}.label`]}</p>
              )}
            </div>
            <div className="w-40 space-y-1.5">
              <label htmlFor={`option-season-${index}`} className="text-label-md font-semibold text-on-surface">
                {t('seasonLabel')}
              </label>
              <select
                id={`option-season-${index}`}
                value={option.season}
                onChange={(event) => updateOption(index, { season: event.target.value as Season })}
                className={inputClass}
              >
                {SEASONS.map((season) => (
                  <option key={season} value={season}>
                    {t(`seasons.${season}`)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="mt-8 text-label-md font-semibold text-error hover:underline"
            >
              {t('removeOption')}
            </button>
          </div>
        ))}
        {errors.options && <p className="text-label-sm text-error">{errors.options}</p>}
        <button
          type="button"
          onClick={addOption}
          className="text-label-md font-semibold text-primary hover:underline"
        >
          {t('addOption')}
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

Run: `cd frontend && npx vitest run components/admin/QuizQuestionForm.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/admin/QuizQuestionForm.tsx components/admin/QuizQuestionForm.test.tsx messages/vi.json
git commit -m "feat: add shared quiz question create/edit form"
```

---

## Task 24: Quiz admin list — `QuizQuestionList` (with reordering) + `/admin/quiz` page

**Files:**
- Create: `frontend/components/admin/QuizQuestionList.tsx`
- Create: `frontend/components/admin/QuizQuestionList.test.tsx`
- Create: `frontend/app/admin/quiz/page.tsx`
- Create: `frontend/app/admin/quiz/page.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.QuizList` namespace)

**Interfaces:**
- Consumes: `QuizQuestion` from `lib/db.ts`; `GET`/`PUT`/`DELETE /api/quiz-questions(/[id])`
  from Tasks 9-10; `AdminGate` (existing).

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "QuizList": {
      "title": "Quản lý câu hỏi Quiz",
      "newButton": "Thêm câu hỏi",
      "editButton": "Sửa",
      "deleteButton": "Xóa",
      "deleteConfirm": "Xóa câu hỏi này?",
      "moveUp": "Lên",
      "moveDown": "Xuống",
      "emptyState": "Chưa có câu hỏi nào.",
      "loading": "Đang tải..."
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/admin/QuizQuestionList.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuizQuestionList from './QuizQuestionList'
import type { QuizQuestion } from '@/lib/db'

const QUESTIONS: QuizQuestion[] = [
  { id: 1, questionText: 'Câu 1?', sortOrder: 0, options: [{ id: 1, label: 'A', season: 'spring', sortOrder: 0 }] },
  { id: 2, questionText: 'Câu 2?', sortOrder: 1, options: [{ id: 2, label: 'B', season: 'summer', sortOrder: 0 }] },
]

describe('QuizQuestionList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders questions in order with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => QUESTIONS }))
    renderWithIntl(<QuizQuestionList />)

    await waitFor(() => expect(screen.getByText('Câu 1?')).toBeInTheDocument())
    expect(screen.getAllByRole('link', { name: 'Sửa' })[0]).toHaveAttribute('href', '/admin/quiz/1/edit')
  })

  it('disables "Lên" for the first row and "Xuống" for the last row', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => QUESTIONS }))
    renderWithIntl(<QuizQuestionList />)

    await waitFor(() => expect(screen.getByText('Câu 1?')).toBeInTheDocument())
    const upButtons = screen.getAllByRole('button', { name: 'Lên' })
    const downButtons = screen.getAllByRole('button', { name: 'Xuống' })
    expect(upButtons[0]).toBeDisabled()
    expect(downButtons[1]).toBeDisabled()
  })

  it('swaps sortOrder via PUT when moving a question down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => QUESTIONS }).mockResolvedValue({ ok: true })
    )
    renderWithIntl(<QuizQuestionList />)

    await waitFor(() => expect(screen.getByText('Câu 1?')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('button', { name: 'Xuống' })[0])

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/quiz-questions/1', expect.objectContaining({ method: 'PUT' })))
    expect(fetch).toHaveBeenCalledWith('/api/quiz-questions/2', expect.objectContaining({ method: 'PUT' }))
  })

  it('deletes a question when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => QUESTIONS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<QuizQuestionList />)

    await waitFor(() => expect(screen.getByText('Câu 1?')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0])

    await waitFor(() => expect(screen.queryByText('Câu 1?')).not.toBeInTheDocument())
  })
})
```

Create `frontend/app/admin/quiz/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminQuizPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('AdminQuizPage', () => {
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

  it('renders the heading and a link to create a new question', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminQuizPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Quản lý câu hỏi Quiz' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Thêm câu hỏi' })).toHaveAttribute('href', '/admin/quiz/new')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/admin/QuizQuestionList.test.tsx app/admin/quiz/page.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `QuizQuestionList.tsx`**

Create `frontend/components/admin/QuizQuestionList.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { QuizQuestion } from '@/lib/db'

export default function QuizQuestionList() {
  const t = useTranslations('Admin.QuizList')
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)

  useEffect(() => {
    fetch('/api/quiz-questions')
      .then((response) => response.json())
      .then(setQuestions)
  }, [])

  async function persistOrder(a: QuizQuestion, b: QuizQuestion) {
    await Promise.all([
      fetch(`/api/quiz-questions/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: a.questionText, sortOrder: b.sortOrder, options: a.options }),
      }),
      fetch(`/api/quiz-questions/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: b.questionText, sortOrder: a.sortOrder, options: b.options }),
      }),
    ])
  }

  function move(index: number, direction: -1 | 1) {
    setQuestions((current) => {
      if (!current) return current
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= current.length) return current

      const a = current[index]
      const b = current[targetIndex]
      const next = [...current]
      next[index] = { ...b, sortOrder: a.sortOrder }
      next[targetIndex] = { ...a, sortOrder: b.sortOrder }
      next.sort((x, y) => x.sortOrder - y.sortOrder)

      void persistOrder(a, b)
      return next
    })
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/quiz-questions/${id}`, { method: 'DELETE' })
    setQuestions((current) => current?.filter((question) => question.id !== id) ?? null)
  }

  if (questions === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (questions.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <ul className="space-y-3">
      {questions.map((question, index) => (
        <li
          key={question.id}
          className="flex items-center justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm"
        >
          <span className="text-body-md text-on-surface">{question.questionText}</span>
          <div className="flex items-center gap-3 text-label-md font-semibold">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="text-primary hover:underline disabled:opacity-30"
            >
              {t('moveUp')}
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === questions.length - 1}
              className="text-primary hover:underline disabled:opacity-30"
            >
              {t('moveDown')}
            </button>
            <Link href={`/admin/quiz/${question.id}/edit`} className="text-primary hover:underline">
              {t('editButton')}
            </Link>
            <button type="button" onClick={() => handleDelete(question.id)} className="text-error hover:underline">
              {t('deleteButton')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 5: Implement `app/admin/quiz/page.tsx`**

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AdminGate from '@/components/auth/AdminGate'
import QuizQuestionList from '@/components/admin/QuizQuestionList'

export default function AdminQuizPage() {
  const t = useTranslations('Admin.QuizList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <Link
              href="/admin/quiz/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('newButton')}
            </Link>
          </div>
          <QuizQuestionList />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/admin/QuizQuestionList.test.tsx app/admin/quiz/page.test.tsx`
Expected: PASS (4 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/admin/QuizQuestionList.tsx components/admin/QuizQuestionList.test.tsx app/admin/quiz/page.tsx app/admin/quiz/page.test.tsx messages/vi.json
git commit -m "feat: add quiz question admin list page with reordering"
```

---

## Task 25: `/admin/quiz/new` and `/admin/quiz/[id]/edit` pages

**Files:**
- Create: `frontend/app/admin/quiz/new/page.tsx`
- Create: `frontend/app/admin/quiz/new/page.test.tsx`
- Create: `frontend/app/admin/quiz/[id]/edit/page.tsx`
- Create: `frontend/app/admin/quiz/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `QuizQuestionForm` from Task 23; `AdminGate` (existing); `GET /api/quiz-questions/[id]` from Task 10.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/admin/quiz/new/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewQuizQuestionPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewQuizQuestionPage', () => {
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
        <NewQuizQuestionPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Tạo câu hỏi' })).toBeInTheDocument()
  })
})
```

Create `frontend/app/admin/quiz/[id]/edit/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditQuizQuestionPage from './page'
import type { QuizQuestion } from '@/lib/db'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const QUESTION: QuizQuestion = {
  id: 3,
  questionText: 'Câu hỏi cần sửa?',
  sortOrder: 0,
  options: [{ id: 1, label: 'A', season: 'spring', sortOrder: 0 }],
}

describe('EditQuizQuestionPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => QUESTION }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the question by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditQuizQuestionPage params={Promise.resolve({ id: '3' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Nội dung câu hỏi')).toHaveValue('Câu hỏi cần sửa?'))
    expect(fetch).toHaveBeenCalledWith('/api/quiz-questions/3')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/admin/quiz/new/page.test.tsx "app/admin/quiz/\[id\]/edit/page.test.tsx"`
Expected: FAIL — neither page exists yet.

- [ ] **Step 3: Implement `app/admin/quiz/new/page.tsx`**

```tsx
'use client'

import AdminGate from '@/components/auth/AdminGate'
import QuizQuestionForm from '@/components/admin/QuizQuestionForm'

export default function NewQuizQuestionPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <QuizQuestionForm />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 4: Implement `app/admin/quiz/[id]/edit/page.tsx`**

Note: same reasoning as Task 22 — `params` is resolved inside `useEffect` rather than with
`use()`, to avoid needing a `<Suspense>` boundary around every caller (including tests).

```tsx
'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import QuizQuestionForm from '@/components/admin/QuizQuestionForm'
import type { QuizQuestion } from '@/lib/db'

export default function EditQuizQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const [question, setQuestion] = useState<QuizQuestion | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/quiz-questions/${id}`)
        .then((response) => response.json())
        .then(setQuestion)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {question && <QuizQuestionForm initialQuestion={question} />}
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/admin/quiz/new/page.test.tsx "app/admin/quiz/\[id\]/edit/page.test.tsx"`
Expected: PASS (1 + 1 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add "app/admin/quiz/new" "app/admin/quiz/[id]"
git commit -m "feat: add quiz question create/edit admin pages"
```

---

## Task 26: Full verification + roadmap doc update

**Files:**
- Modify: `docs/admin-dashboard-roadmap.md` (status table)

- [ ] **Step 1: Run the full test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS — every test in the project (all tasks above plus everything pre-existing).

- [ ] **Step 2: Lint**

Run: `cd frontend && npx eslint .`
Expected: no errors. Fix anything reported (matching this repo's existing style — see
`Header.tsx`'s `react-hooks/set-state-in-effect` precedent in `AuthProvider.tsx` if a similar
warning appears).

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Start the dev server (`cd frontend && npm run dev`) and, in a browser:
1. Visit `/blog` — confirm the featured post and grid render with real data, category
   filter and search work, "Đọc ngay"/"Đọc tiếp" links open a working `/blog/<slug>` page.
2. Visit `/personal-color/quiz` — confirm all 5 questions still work end-to-end to
   `/personal-color/result`.
3. Log in as `admin@twistfit.vn` / `admin1234`, go to `/admin` → `/admin/blog`: create a
   post, verify it appears in `/blog`'s grid and at its `/blog/<slug>` page; edit it; delete
   it.
4. From `/admin` → `/admin/quiz`: create a question, reorder it with "Lên"/"Xuống", edit it,
   delete it; confirm `/personal-color/quiz` reflects the change.
5. Log in as `user@twistfit.vn` / `user1234` and confirm `/admin` redirects away (not an
   admin).

- [ ] **Step 5: Update the roadmap doc**

In `docs/admin-dashboard-roadmap.md`, update the status table:
```markdown
| Quản lý Blog | ✅ Hoàn thành |
| Quản lý câu hỏi Quiz | ✅ Hoàn thành |
```
(replacing the two `🔜 Đang lên kế hoạch` rows for these items; leave the rest unchanged).

- [ ] **Step 6: Commit**

```bash
git add docs/admin-dashboard-roadmap.md
git commit -m "docs: mark blog and quiz admin management as complete"
```

