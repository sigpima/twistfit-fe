# Admin: Quản lý FAQ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move FAQ items from the hardcoded `FAQ_ITEMS` array in `FaqSection.tsx` into the
existing SQLite data layer, with an admin CRUD screen under `/admin/faq`, and the public
`/faq` page reading from the DB.

**Architecture:** New module `frontend/lib/faq.ts` owns its own schema fragment and typed
CRUD, following the exact pattern already established by `frontend/lib/db.ts` (Blog/Quiz) and
wired into the shared `frontend/lib/getDb.ts` singleton. The FAQ answer field, currently raw
JSX per item, becomes sanitized Markdown (reusing `lib/markdown.ts` from the Blog CMS) plus an
optional single "highlight" box (icon + short text). `FaqSection` becomes prop-driven like
`BlogArticleGrid`; the admin write API is protected by the existing signed session cookie.

**Tech Stack:** Next.js 16 App Router, React 19, `better-sqlite3`, existing `marked` +
`isomorphic-dompurify` markdown pipeline, Vitest + Testing Library, next-intl.

**Spec:** `docs/superpowers/specs/2026-09-13-admin-content-cms-expansion-design.md`

## Global Constraints

- All `lib/faq.ts` query functions take `db: Database.Database` as an explicit parameter
  (never a module-level singleton) — this is what makes them testable with `:memory:`.
- `lib/faq.ts` imports `better-sqlite3` **only as a type** (`import type Database from
  'better-sqlite3'`) — never as a value. Only `lib/getDb.ts` may `new Database(...)`. This is
  the fix applied after the Blog/Quiz CMS shipped: a Client Component importing a file that
  pulls in the real `better-sqlite3` module crashes the browser bundle (missing Node `fs`).
- Route `params` are `Promise`s — `await params` in Route Handlers; resolve with
  `params.then(...)` inside `useEffect` in Client Component pages (never React's `use()`).
- No file upload: image fields (if any) are plain URL strings. (FAQ has none.)
- The write API routes (`POST`/`PUT`/`DELETE` under `/api/faq`) must reject requests without
  a valid signed admin session cookie (401), using `getAdminSessionFromCookieHeader` from
  `lib/auth/session.ts` (already implemented — no changes needed there).
- Reuse existing input/label/button Tailwind classes from `BlogPostForm.tsx` (`rounded-xl
  bg-surface px-4 py-3 ... focus:bg-surface-container-high focus:outline-none` for inputs;
  `rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md
  transition-all hover:bg-primary-container` for primary buttons).
- All new UI text goes through `next-intl` (`messages/vi.json`), namespace `Admin.FaqForm` /
  `Admin.FaqList`, following the existing per-component convention. Category checkbox labels
  reuse the **existing** `Faq.CategoryTabs.categories.*` keys — do not duplicate them.
- Every new component/module gets a co-located `.test.ts`/`.test.tsx` file, written and run
  red before implementation (TDD).
- `lib/getDb.ts` itself has no unit test in this codebase (established precedent from the
  Blog/Quiz CMS — it is untestable singleton/filesystem wiring) — verify changes to it via
  `tsc --noEmit` and the full `vitest run` suite instead.

---

## Task 1: Data layer — FAQ schema, CRUD, seed

**Files:**
- Create: `frontend/lib/faq.ts`
- Test: `frontend/lib/faq.test.ts`

**Interfaces:**
- Produces: `FaqCategory`, `FAQ_CATEGORIES: FaqCategory[]`, `FaqHighlightIcon`,
  `FAQ_HIGHLIGHT_ICONS: FaqHighlightIcon[]`, `FaqItem`, `FaqItemInput`, `initSchema(db)`,
  `getFaqItems(db)`, `getFaqItemById(db, id)`, `createFaqItem(db, input)`,
  `updateFaqItem(db, id, input)`, `deleteFaqItem(db, id)`, `seedIfEmpty(db)`. All consumed by
  Task 2 (`getDb.ts` wiring) and later API-route/UI tasks.

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/faq.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createFaqItem,
  getFaqItems,
  getFaqItemById,
  updateFaqItem,
  deleteFaqItem,
  seedIfEmpty,
  type FaqItemInput,
} from './faq'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleItem: FaqItemInput = {
  categories: ['personal-color'],
  question: 'Câu hỏi mẫu?',
  answerMarkdown: 'Đây là **câu trả lời** mẫu.',
  highlightIcon: 'palette',
  highlightText: 'Ghi chú nổi bật.',
}

describe('FAQ CRUD', () => {
  it('creates and reads back an item', () => {
    const created = createFaqItem(db, sampleItem)
    expect(created.id).toBeGreaterThan(0)
    expect(created.categories).toEqual(['personal-color'])
    expect(created.answerMarkdown).toBe('Đây là **câu trả lời** mẫu.')
    expect(created.highlightIcon).toBe('palette')
  })

  it('lists items in creation order', () => {
    createFaqItem(db, { ...sampleItem, question: 'Câu 1' })
    createFaqItem(db, { ...sampleItem, question: 'Câu 2' })
    const items = getFaqItems(db)
    expect(items.map((i) => i.question)).toEqual(['Câu 1', 'Câu 2'])
  })

  it('supports multiple categories per item', () => {
    const created = createFaqItem(db, { ...sampleItem, categories: ['personal-color', 'account'] })
    expect(getFaqItemById(db, created.id)?.categories).toEqual(['personal-color', 'account'])
  })

  it('allows a null highlight', () => {
    const created = createFaqItem(db, { ...sampleItem, highlightIcon: null, highlightText: null })
    expect(created.highlightIcon).toBeNull()
    expect(created.highlightText).toBeNull()
  })

  it('updates an item', () => {
    const created = createFaqItem(db, sampleItem)
    const updated = updateFaqItem(db, created.id, { ...sampleItem, question: 'Câu hỏi đã sửa' })
    expect(updated?.question).toBe('Câu hỏi đã sửa')
    expect(updateFaqItem(db, 999999, sampleItem)).toBeNull()
  })

  it('deletes an item', () => {
    const created = createFaqItem(db, sampleItem)
    expect(deleteFaqItem(db, created.id)).toBe(true)
    expect(getFaqItemById(db, created.id)).toBeNull()
    expect(deleteFaqItem(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 6 FAQ items into an empty database', () => {
    seedIfEmpty(db)
    expect(getFaqItems(db)).toHaveLength(6)
  })

  it('does nothing if faq_items already has rows', () => {
    createFaqItem(db, sampleItem)
    seedIfEmpty(db)
    expect(getFaqItems(db)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run lib/faq.test.ts`
Expected: FAIL — `./faq` module does not exist yet.

- [ ] **Step 3: Implement `lib/faq.ts`**

Create `frontend/lib/faq.ts`:
```ts
import type Database from 'better-sqlite3'

export type FaqCategory = 'personal-color' | 'fitting-room' | 'account' | 'stylist'
export const FAQ_CATEGORIES: FaqCategory[] = ['personal-color', 'fitting-room', 'account', 'stylist']

export type FaqHighlightIcon =
  | 'palette'
  | 'wb_sunny'
  | 'face_retouching_off'
  | 'center_focus_strong'
  | 'qr_code_scanner'
  | 'verified_user'
  | 'info'
  | 'lightbulb'

export const FAQ_HIGHLIGHT_ICONS: FaqHighlightIcon[] = [
  'palette',
  'wb_sunny',
  'face_retouching_off',
  'center_focus_strong',
  'qr_code_scanner',
  'verified_user',
  'info',
  'lightbulb',
]

export type FaqItem = {
  id: number
  categories: FaqCategory[]
  question: string
  answerMarkdown: string
  highlightIcon: FaqHighlightIcon | null
  highlightText: string | null
  createdAt: string
  updatedAt: string
}

export type FaqItemInput = {
  categories: FaqCategory[]
  question: string
  answerMarkdown: string
  highlightIcon: FaqHighlightIcon | null
  highlightText: string | null
}

type FaqItemRow = {
  id: number
  categories: string
  question: string
  answer_markdown: string
  highlight_icon: string | null
  highlight_text: string | null
  created_at: string
  updated_at: string
}

function rowToFaqItem(row: FaqItemRow): FaqItem {
  return {
    id: row.id,
    categories: JSON.parse(row.categories) as FaqCategory[],
    question: row.question,
    answerMarkdown: row.answer_markdown,
    highlightIcon: row.highlight_icon as FaqHighlightIcon | null,
    highlightText: row.highlight_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS faq_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categories TEXT NOT NULL,
      question TEXT NOT NULL,
      answer_markdown TEXT NOT NULL,
      highlight_icon TEXT,
      highlight_text TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getFaqItems(db: Database.Database): FaqItem[] {
  const rows = db.prepare('SELECT * FROM faq_items ORDER BY id ASC').all() as FaqItemRow[]
  return rows.map(rowToFaqItem)
}

export function getFaqItemById(db: Database.Database, id: number): FaqItem | null {
  const row = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(id) as FaqItemRow | undefined
  return row ? rowToFaqItem(row) : null
}

export function createFaqItem(db: Database.Database, input: FaqItemInput): FaqItem {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO faq_items (categories, question, answer_markdown, highlight_icon, highlight_text, created_at, updated_at)
       VALUES (@categories, @question, @answerMarkdown, @highlightIcon, @highlightText, @createdAt, @updatedAt)`
    )
    .run({
      categories: JSON.stringify(input.categories),
      question: input.question,
      answerMarkdown: input.answerMarkdown,
      highlightIcon: input.highlightIcon,
      highlightText: input.highlightText,
      createdAt: now,
      updatedAt: now,
    })
  const created = getFaqItemById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created FAQ item')
  }
  return created
}

export function updateFaqItem(db: Database.Database, id: number, input: FaqItemInput): FaqItem | null {
  const existing = getFaqItemById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE faq_items SET
      categories = @categories, question = @question, answer_markdown = @answerMarkdown,
      highlight_icon = @highlightIcon, highlight_text = @highlightText, updated_at = @updatedAt
     WHERE id = @id`
  ).run({
    id,
    categories: JSON.stringify(input.categories),
    question: input.question,
    answerMarkdown: input.answerMarkdown,
    highlightIcon: input.highlightIcon,
    highlightText: input.highlightText,
    updatedAt: now,
  })
  return getFaqItemById(db, id)
}

export function deleteFaqItem(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM faq_items WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_FAQ_ITEMS: FaqItemInput[] = [
  {
    categories: ['personal-color'],
    question: 'Personal Color Test trên TwistFit hoạt động như thế nào qua camera?',
    answerMarkdown:
      'Thuật toán độc quyền của TwistFit tích hợp mô hình thị giác máy tính chuyên sâu để phân tích phổ màu tự nhiên của khuôn mặt bạn theo thời gian thực.\n\n- **Định vị sắc tố:** Tách nền và nhận diện độ sáng, độ bão hòa trên da, mắt và viền môi.\n- **Đối soát Undertone:** Kiểm tra mức độ phản ứng quang phổ giữa Warm (ấm) và Cool (lạnh).\n- **Phân nhóm 16 sắc độ:** Phân loại chi tiết theo hệ 4 mùa kinh điển.',
    highlightIcon: 'palette',
    highlightText: 'Quy trình 3 bước cốt lõi.',
  },
  {
    categories: ['personal-color'],
    question: 'Tôi cần chuẩn bị điều kiện ánh sáng và góc chụp thế nào để kết quả chính xác nhất?',
    answerMarkdown:
      'Độ chính xác của bài kiểm tra màu phụ thuộc đáng kể vào nguồn sáng xung quanh. Chúng tôi khuyến nghị:\n\n- **Ánh sáng tự nhiên:** Chụp cạnh cửa sổ ban ngày, tránh đèn huỳnh quang vàng/trắng gắt.\n- **Mặt mộc hoàn toàn:** Tẩy trang sạch sẽ, không dùng kem chống nắng nâng tông hay kính áp tròng màu.\n- **Góc mặt chính diện:** Giữ camera ngang tầm mắt, vén tóc mái để lộ rõ trán và tai.',
    highlightIcon: 'wb_sunny',
    highlightText: 'Ánh sáng tự nhiên, mặt mộc, góc chính diện.',
  },
  {
    categories: ['fitting-room'],
    question: 'Tính năng Thử Đồ Ảo (AI Virtual Fitting) có giữ đúng tỷ lệ vóc dáng của tôi không?',
    answerMarkdown:
      'Hoàn toàn chính xác! Hệ thống Virtual Fitting của TwistFit sử dụng mạng nơ-ron **DensePose kết hợp 3D Neural Mesh** để tái cấu trúc hình thể người dùng từ ảnh toàn thân mà không làm biến dạng tỷ lệ chân thực.\n\nVải của từng bộ trang phục được gán thông số vật lý riêng biệt (độ rũ của lụa, độ cứng của denim, độ bóng của da nhân tạo), giúp phản chiếu độ ôm sát và chuyển động theo đúng số đo eo, ngực và chiều dài tay chân của bạn.',
    highlightIcon: null,
    highlightText: null,
  },
  {
    categories: ['personal-color', 'account'],
    question: 'Nếu dùng máy tính (Laptop/PC) thì tôi làm bài test Personal Color như thế nào?',
    answerMarkdown:
      'Để đảm bảo chất lượng cảm biến camera tốt nhất (do webcam laptop thường có độ phân giải và cân bằng trắng thấp), TwistFit áp dụng công nghệ **Đồng Bộ Liên Màn Hình (Cross-device Sync)**: khi bắt đầu làm bài test trên màn hình lớn, một mã QR duy nhất sẽ xuất hiện. Bạn chỉ cần bật camera điện thoại quét mã để đo sắc tố, kết quả sẽ đồng bộ hiển thị ngay lập tức lên màn hình máy tính.',
    highlightIcon: 'qr_code_scanner',
    highlightText: 'Quét mã QR liền mạch.',
  },
  {
    categories: ['account'],
    question: 'Báo cáo Personal Color sau khi test có được lưu lại không và tải về ở đâu?',
    answerMarkdown:
      'Tất cả các lượt phân tích màu sắc và cấu trúc hình thể đều được lưu vĩnh viễn trong hồ sơ của bạn:\n\n- Truy cập menu góc phải: chọn **"Kết quả đánh giá"** để xem lại mọi bảng màu (Best Colors & Worst Colors).\n- Bạn có thể bấm nút **"Xuất Báo Cáo PDF"** để nhận cuốn cẩm nang phối đồ cá nhân hóa chuẩn tạp chí thời trang.',
    highlightIcon: null,
    highlightText: null,
  },
  {
    categories: ['account', 'stylist'],
    question: 'Dữ liệu hình ảnh khuôn mặt của tôi có được bảo mật không?',
    answerMarkdown:
      'TwistFit đặt quyền riêng tư và an toàn dữ liệu của bạn lên ưu tiên hàng đầu. Ảnh chân dung chụp qua camera chỉ được trích xuất ma trận giá trị màu (RGB/Lab) ngay trên phiên làm việc và tự động hủy sau khi tạo báo cáo. Chúng tôi không bao giờ bán, chia sẻ hoặc dùng dữ liệu khuôn mặt cho bên thứ ba.',
    highlightIcon: 'verified_user',
    highlightText: 'Chính sách không lưu trữ hình ảnh gốc thô (Raw Images).',
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM faq_items').get() as { count: number }
  if (count > 0) return
  SEED_FAQ_ITEMS.forEach((item) => createFaqItem(db, item))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run lib/faq.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add lib/faq.ts lib/faq.test.ts
git commit -m "feat: add FAQ data layer with CRUD and seed"
```

---

## Task 2: Wire FAQ schema into the shared `getDb()` singleton

**Files:**
- Modify: `frontend/lib/getDb.ts`

**Interfaces:**
- Consumes: `initSchema`, `seedIfEmpty` from `lib/faq.ts` (Task 1).
- Produces: no new exports — `getDb()` now also creates/seeds the `faq_items` table on first
  connection.

- [ ] **Step 1: Modify `lib/getDb.ts`**

Add the import and two calls (keep everything else in the file unchanged):
```ts
import { initSchema as initFaqSchema, seedIfEmpty as seedFaqIfEmpty } from './faq'
```
Inside `getDb()`, right after the existing `initSchema(db)` / `seedIfEmpty(db)` calls (the
ones from `lib/db.ts`), add:
```ts
  initFaqSchema(db)
  seedFaqIfEmpty(db)
```
So the function body reads (only the two new lines are additions):
```ts
  const db = new Database(dbPath)
  initSchema(db)
  seedIfEmpty(db)
  initFaqSchema(db)
  seedFaqIfEmpty(db)
  singleton = db
  return db
```

- [ ] **Step 2: Verify the whole project still compiles and tests still pass**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; every existing test still passes (no test exercises `getDb()`
directly, so this step is a compile/regression check, not a red→green cycle).

- [ ] **Step 3: Commit**

```bash
cd frontend && git add lib/getDb.ts
git commit -m "feat: initialize and seed the FAQ table when opening the database"
```

---

## Task 3: FAQ API — validation + collection route (`GET`/`POST /api/faq`)

**Files:**
- Create: `frontend/app/api/faq/validate.ts`
- Create: `frontend/app/api/faq/validate.test.ts`
- Create: `frontend/app/api/faq/route.ts`
- Create: `frontend/app/api/faq/route.test.ts`

**Interfaces:**
- Consumes: `FAQ_CATEGORIES`, `FAQ_HIGHLIGHT_ICONS`, `FaqCategory`, `FaqHighlightIcon`,
  `FaqItemInput`, `getFaqItems`, `createFaqItem` from `lib/faq.ts` (Task 1); `getDb` from
  `lib/getDb.ts`; `getAdminSessionFromCookieHeader` from `lib/auth/session.ts` (existing).
- Produces: `validateFaqItemBody(body: unknown): { errors: Record<string, string> } | { data:
  FaqItemInput }` — consumed by Task 4 (`[id]/route.ts`). `GET`/`POST` handlers — consumed by
  Task 8 (`FaqForm`) and Task 9 (`FaqList`).

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/api/faq/validate.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { validateFaqItemBody } from './validate'

const validBody = {
  categories: ['personal-color'],
  question: 'Câu hỏi test?',
  answerMarkdown: 'Nội dung trả lời.',
  highlightIcon: 'palette',
  highlightText: 'Ghi chú.',
}

describe('validateFaqItemBody', () => {
  it('accepts a valid body', () => {
    const result = validateFaqItemBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('accepts a null highlight', () => {
    const result = validateFaqItemBody({ ...validBody, highlightIcon: null, highlightText: null })
    expect('data' in result).toBe(true)
  })

  it('rejects an empty question', () => {
    const result = validateFaqItemBody({ ...validBody, question: '' })
    expect('errors' in result && result.errors.question).toBeDefined()
  })

  it('rejects an empty answer', () => {
    const result = validateFaqItemBody({ ...validBody, answerMarkdown: '' })
    expect('errors' in result && result.errors.answerMarkdown).toBeDefined()
  })

  it('rejects zero categories', () => {
    const result = validateFaqItemBody({ ...validBody, categories: [] })
    expect('errors' in result && result.errors.categories).toBeDefined()
  })

  it('rejects an invalid category', () => {
    const result = validateFaqItemBody({ ...validBody, categories: ['not-a-category'] })
    expect('errors' in result && result.errors.categories).toBeDefined()
  })

  it('rejects an invalid highlight icon', () => {
    const result = validateFaqItemBody({ ...validBody, highlightIcon: 'not-an-icon' })
    expect('errors' in result && result.errors.highlightIcon).toBeDefined()
  })
})
```

Create `frontend/app/api/faq/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/faq')>('@/lib/faq')
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
  categories: ['personal-color'],
  question: 'Câu hỏi test?',
  answerMarkdown: 'Nội dung trả lời.',
  highlightIcon: null,
  highlightText: null,
}

beforeEach(() => {
  getDb().exec('DELETE FROM faq_items')
})

describe('GET /api/faq', () => {
  it('returns an empty list when there are no items', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/faq', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/faq', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates an item and returns 201', async () => {
    const request = new Request('http://localhost/api/faq', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const created = await response.json()
    expect(created.question).toBe('Câu hỏi test?')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/faq', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, question: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.errors.question).toBeDefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/api/faq/validate.test.ts app/api/faq/route.test.ts`
Expected: FAIL — neither `validate.ts` nor `route.ts` exist yet.

- [ ] **Step 3: Implement `validate.ts`**

Create `frontend/app/api/faq/validate.ts`:
```ts
import {
  FAQ_CATEGORIES,
  FAQ_HIGHLIGHT_ICONS,
  type FaqCategory,
  type FaqHighlightIcon,
  type FaqItemInput,
} from '@/lib/faq'

type RawFaqBody = {
  categories?: unknown
  question?: unknown
  answerMarkdown?: unknown
  highlightIcon?: unknown
  highlightText?: unknown
}

export function validateFaqItemBody(
  body: unknown
): { errors: Record<string, string> } | { data: FaqItemInput } {
  const raw = (body ?? {}) as RawFaqBody
  const errors: Record<string, string> = {}

  const question = typeof raw.question === 'string' ? raw.question.trim() : ''
  if (!question) errors.question = 'Câu hỏi không được để trống'

  const answerMarkdown = typeof raw.answerMarkdown === 'string' ? raw.answerMarkdown.trim() : ''
  if (!answerMarkdown) errors.answerMarkdown = 'Câu trả lời không được để trống'

  const rawCategories = Array.isArray(raw.categories) ? (raw.categories as unknown[]) : []
  const categories = rawCategories.filter((value): value is FaqCategory =>
    FAQ_CATEGORIES.includes(value as FaqCategory)
  )
  if (categories.length === 0) errors.categories = 'Chọn ít nhất 1 chuyên mục'

  let highlightIcon: FaqHighlightIcon | null = null
  if (raw.highlightIcon !== null && raw.highlightIcon !== undefined && raw.highlightIcon !== '') {
    if (!FAQ_HIGHLIGHT_ICONS.includes(raw.highlightIcon as FaqHighlightIcon)) {
      errors.highlightIcon = 'Icon không hợp lệ'
    } else {
      highlightIcon = raw.highlightIcon as FaqHighlightIcon
    }
  }

  const highlightText =
    typeof raw.highlightText === 'string' && raw.highlightText.trim() ? raw.highlightText.trim() : null

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { categories, question, answerMarkdown, highlightIcon, highlightText } }
}
```

- [ ] **Step 4: Implement `route.ts`**

Create `frontend/app/api/faq/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { getFaqItems, createFaqItem } from '@/lib/faq'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateFaqItemBody } from './validate'

export async function GET() {
  const db = getDb()
  return NextResponse.json(getFaqItems(db))
}

export async function POST(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateFaqItemBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createFaqItem(db, result.data)
  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/api/faq/validate.test.ts app/api/faq/route.test.ts`
Expected: PASS (7 + 3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add app/api/faq/validate.ts app/api/faq/validate.test.ts app/api/faq/route.ts app/api/faq/route.test.ts
git commit -m "feat: add FAQ collection API route with validation"
```

---

## Task 4: FAQ API — single-item route (`GET`/`PUT`/`DELETE /api/faq/[id]`)

**Files:**
- Create: `frontend/app/api/faq/[id]/route.ts`
- Create: `frontend/app/api/faq/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getFaqItemById`, `updateFaqItem`, `deleteFaqItem` from `lib/faq.ts`; `getDb` from
  `lib/getDb.ts`; `validateFaqItemBody` from Task 3 (`../validate`); `getAdminSessionFromCookieHeader`.
- Produces: `GET`/`PUT`/`DELETE` handlers, consumed by Task 10 (edit page) and Task 8
  (`FaqForm`'s PUT call).

- [ ] **Step 1: Write the failing test**

Create `frontend/app/api/faq/[id]/route.test.ts`:
```ts
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { createFaqItem } from '@/lib/faq'
import { GET, PUT, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/faq')>('@/lib/faq')
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
  categories: ['personal-color'],
  question: 'Câu hỏi test?',
  answerMarkdown: 'Nội dung trả lời.',
  highlightIcon: null,
  highlightText: null,
}

beforeEach(() => {
  getDb().exec('DELETE FROM faq_items')
})

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/faq/[id]', () => {
  it('returns the item when it exists', async () => {
    const created = createFaqItem(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).question).toBe('Câu hỏi test?')
  })

  it('returns 404 when the item does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/faq/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createFaqItem(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the item', async () => {
    const created = createFaqItem(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, question: 'Câu hỏi đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).question).toBe('Câu hỏi đã sửa')
  })

  it('returns 404 when updating an item that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/faq/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createFaqItem(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the item', async () => {
    const created = createFaqItem(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM faq_items WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run "app/api/faq/\[id\]/route.test.ts"`
Expected: FAIL — `./route` does not exist yet.

- [ ] **Step 3: Implement `frontend/app/api/faq/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getFaqItemById, updateFaqItem, deleteFaqItem } from '@/lib/faq'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateFaqItemBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const item = getFaqItemById(getDb(), Number(id))
  if (!item) {
    return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 })
  }
  return NextResponse.json(item)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = validateFaqItemBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateFaqItem(getDb(), Number(id), result.data)
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
  const deleted = deleteFaqItem(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run "app/api/faq/\[id\]/route.test.ts"`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add "app/api/faq/[id]/route.ts" "app/api/faq/[id]/route.test.ts"
git commit -m "feat: add single FAQ item API route"
```

---

## Task 5: Rewrite `FaqAccordionItem` to render Markdown + optional highlight

**Files:**
- Modify: `frontend/components/faq/FaqAccordionItem.tsx`
- Modify: `frontend/components/faq/FaqAccordionItem.test.tsx`

**Interfaces:**
- Consumes: `FaqItem` from `lib/faq.ts` (replaces the locally-defined `FaqItem` type that had
  `answer: ReactNode`); `renderMarkdown` from `lib/markdown.ts` (existing, from Blog CMS).
- Produces: `FaqAccordionItem({ item: FaqItem, isOpen, onToggle })` — same prop names as
  before, `item.answer` (ReactNode) is gone, replaced by `item.answerMarkdown` +
  `item.highlightIcon`/`item.highlightText` (all from `lib/faq.ts`'s `FaqItem`). Consumed by
  Task 6 (`FaqSection`).

- [ ] **Step 1: Write the failing test**

Replace `frontend/components/faq/FaqAccordionItem.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqAccordionItem from './FaqAccordionItem'
import type { FaqItem } from '@/lib/faq'

const ITEM: FaqItem = {
  id: 1,
  number: '01',
  question: 'Câu hỏi mẫu số 1?',
  categories: ['personal-color'],
  answerMarkdown: 'Câu trả lời **mẫu**.',
  highlightIcon: null,
  highlightText: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
} as FaqItem & { number: string }

describe('FaqAccordionItem', () => {
  it('hides the answer when collapsed', () => {
    render(<FaqAccordionItem item={ITEM} isOpen={false} onToggle={vi.fn()} />)
    expect(screen.getByText('Câu hỏi mẫu số 1?')).toBeInTheDocument()
    expect(screen.queryByText('mẫu', { exact: false })).not.toBeInTheDocument()
  })

  it('shows the markdown-rendered answer when open', () => {
    render(<FaqAccordionItem item={ITEM} isOpen={true} onToggle={vi.fn()} />)
    expect(screen.getByText('mẫu', { exact: false })).toBeInTheDocument()
  })

  it('shows a highlight box with icon and text when present', () => {
    render(
      <FaqAccordionItem
        item={{ ...ITEM, highlightIcon: 'palette', highlightText: 'Ghi chú nổi bật.' }}
        isOpen={true}
        onToggle={vi.fn()}
      />
    )
    expect(screen.getByText('Ghi chú nổi bật.')).toBeInTheDocument()
    expect(screen.getByText('palette')).toBeInTheDocument()
  })

  it('calls onToggle with the item id when clicked', () => {
    const onToggle = vi.fn()
    render(<FaqAccordionItem item={ITEM} isOpen={false} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith(1)
  })
})
```

Note: the accordion has always shown a display-only `number` (`"01"`, `"02"`...) that was
part of the hardcoded array but is **not** part of the new `FaqItem` DB shape (the spec's
non-goal list has no ordering/numbering field). Task 6 computes this number from the item's
position in the list it receives, and passes it down as a separate `number` prop rather than
a field on `FaqItem` itself — this test file passes it inline on the fixture object for
convenience since `FaqAccordionItem`'s prop type gains a top-level `number: string` field in
Step 3 below (not nested inside `FaqItem`).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/faq/FaqAccordionItem.test.tsx`
Expected: FAIL — component still expects the old `FaqItem` shape with JSX `answer`.

- [ ] **Step 3: Rewrite `FaqAccordionItem.tsx`**

Replace `frontend/components/faq/FaqAccordionItem.tsx`:
```tsx
import type { FaqItem } from '@/lib/faq'
import { renderMarkdown } from '@/lib/markdown'

type FaqAccordionItemProps = {
  item: FaqItem
  number: string
  isOpen: boolean
  onToggle: (id: number) => void
}

export default function FaqAccordionItem({ item, number, isOpen, onToggle }: FaqAccordionItemProps) {
  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => onToggle(item.id)}
        className="group flex w-full items-center justify-between p-space-lg text-left"
      >
        <div className="flex items-start gap-space-md pr-space-md">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-container text-label-md font-bold text-primary">
            {number}
          </span>
          <span className="text-headline-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
            {item.question}
          </span>
        </div>
        <span
          className={`material-symbols-outlined shrink-0 text-[24px] text-outline transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          keyboard_arrow_down
        </span>
      </button>
      {isOpen && (
        <div className="px-space-lg pb-space-lg pt-0">
          <div className="flex flex-col gap-space-sm pl-12 text-body-md leading-relaxed text-on-surface-variant">
            <div
              className="prose max-w-none text-body-md text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(item.answerMarkdown) }}
            />
            {item.highlightIcon && item.highlightText && (
              <div className="mt-space-xs flex items-center gap-space-xs rounded-lg bg-surface-container-low p-space-md text-label-md font-semibold text-primary">
                <span className="material-symbols-outlined text-[18px]">{item.highlightIcon}</span>
                <span>{item.highlightText}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/faq/FaqAccordionItem.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/faq/FaqAccordionItem.tsx components/faq/FaqAccordionItem.test.tsx
git commit -m "feat: render FAQ answers as sanitized markdown with an optional highlight"
```

---

## Task 6: Rewrite `FaqSection` to be data-driven

**Files:**
- Modify: `frontend/components/faq/FaqSection.tsx`
- Modify: `frontend/components/faq/FaqSection.test.tsx`

**Interfaces:**
- Consumes: `FaqItem` from `lib/faq.ts`; `FaqAccordionItem` (Task 5, now needs a `number`
  prop).
- Produces: `FaqSection({ items: FaqItem[] })` — consumed by Task 7 (`app/faq/page.tsx`).

- [ ] **Step 1: Write the failing test**

Replace `frontend/components/faq/FaqSection.test.tsx`:
```tsx
import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqSection from './FaqSection'
import type { FaqItem } from '@/lib/faq'

const ITEMS: FaqItem[] = [
  {
    id: 1,
    categories: ['personal-color'],
    question: 'Personal Color Test trên TwistFit hoạt động như thế nào qua camera?',
    answerMarkdown: 'Quy trình 3 bước cốt lõi.',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 2,
    categories: ['fitting-room'],
    question: 'Tính năng Thử Đồ Ảo có giữ đúng tỷ lệ vóc dáng của tôi không?',
    answerMarkdown: 'Có, hoàn toàn chính xác.',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('FaqSection', () => {
  it('renders every question passed in', () => {
    renderWithIntl(<FaqSection items={ITEMS} />)
    expect(screen.getByText(/Personal Color Test trên TwistFit hoạt động/)).toBeInTheDocument()
    expect(screen.getByText(/Tính năng Thử Đồ Ảo/)).toBeInTheDocument()
  })

  it('expands only one answer at a time', () => {
    renderWithIntl(<FaqSection items={ITEMS} />)
    const q1 = screen.getByText(/Personal Color Test trên TwistFit hoạt động/)
    const q2 = screen.getByText(/Tính năng Thử Đồ Ảo/)
    fireEvent.click(q1)
    expect(screen.getByText('Quy trình 3 bước cốt lõi.')).toBeInTheDocument()
    fireEvent.click(q2)
    expect(screen.queryByText('Quy trình 3 bước cốt lõi.')).not.toBeInTheDocument()
  })

  it('filters questions by category', () => {
    renderWithIntl(<FaqSection items={ITEMS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Phòng thử đồ ảo (Fitting Room)' }))
    expect(screen.getByText(/Tính năng Thử Đồ Ảo/)).toBeInTheDocument()
    expect(screen.queryByText(/Personal Color Test trên TwistFit hoạt động/)).not.toBeInTheDocument()
  })

  it('filters questions by search text and shows a no-results message', () => {
    renderWithIntl(<FaqSection items={ITEMS} />)
    fireEvent.change(screen.getByPlaceholderText(/Tìm kiếm thắc mắc/), {
      target: { value: 'không tồn tại xyz' },
    })
    expect(screen.getByText('Không tìm thấy câu hỏi phù hợp')).toBeInTheDocument()
  })
})
```

Note: the existing "click a suggested tag" test (`#XuấtPDF`) is dropped — that tag is
hardcoded copy in `FaqSearchBar` unrelated to the data change, and is already covered by
`FaqSearchBar.test.tsx` in isolation; keeping it here would just duplicate that coverage
against the new `items` prop for no added signal.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/faq/FaqSection.test.tsx`
Expected: FAIL — `FaqSection` doesn't accept an `items` prop yet.

- [ ] **Step 3: Rewrite `FaqSection.tsx`**

Replace `frontend/components/faq/FaqSection.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import FaqSearchBar from './FaqSearchBar'
import FaqCategoryTabs from './FaqCategoryTabs'
import FaqAccordionItem from './FaqAccordionItem'
import type { FaqItem } from '@/lib/faq'

export default function FaqSection({ items }: { items: FaqItem[] }) {
  const t = useTranslations('Faq.Section')
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openItemId, setOpenItemId] = useState<number | null>(null)

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.categories.includes(activeCategory as never)
      const matchesSearch = !query || item.question.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [items, activeCategory, searchQuery])

  return (
    <>
      <section className="relative w-full overflow-hidden bg-surface px-margin-desktop py-space-xl">
        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-space-xs shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">live_help</span>
            <span className="text-label-sm font-semibold uppercase tracking-wider text-primary">
              {t('badgeText')}
            </span>
          </div>
          <h1 className="mt-space-md text-display-lg font-bold tracking-tight text-on-surface">
            {t('heading')}
          </h1>
          <p className="mt-space-sm max-w-2xl text-body-lg leading-relaxed text-on-surface-variant">
            {t('subheading')}
          </p>
          <FaqSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onTagClick={(tagValue) => setSearchQuery(tagValue)}
          />
        </div>
      </section>
      <section className="w-full px-margin-desktop pb-space-xl">
        <div className="mx-auto max-w-4xl">
          <FaqCategoryTabs active={activeCategory} onChange={setActiveCategory} />
          <div className="mt-space-lg flex flex-col gap-space-md">
            {visibleItems.map((item, index) => (
              <FaqAccordionItem
                key={item.id}
                item={item}
                number={String(index + 1).padStart(2, '0')}
                isOpen={openItemId === item.id}
                onToggle={(id) => setOpenItemId((current) => (current === id ? null : id))}
              />
            ))}
          </div>
          {visibleItems.length === 0 && (
            <div className="mt-space-md rounded-xl bg-surface-container-lowest py-space-xl text-center shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
              <h4 className="mt-space-xs text-headline-sm font-semibold text-on-surface">
                {t('noResultsTitle')}
              </h4>
              <p className="mt-1 text-body-md text-on-surface-variant">{t('noResultsBody')}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/faq/FaqSection.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add components/faq/FaqSection.tsx components/faq/FaqSection.test.tsx
git commit -m "feat: make FaqSection render items passed in as a prop"
```

---

## Task 7: `app/faq/page.tsx` reads FAQ items from the database

**Files:**
- Modify: `frontend/app/faq/page.tsx`
- Create: `frontend/app/faq/page.test.tsx`

**Interfaces:**
- Consumes: `getDb` from `lib/getDb.ts`; `getFaqItems` from `lib/faq.ts`; `FaqSection` (Task 6).

`getFaqItems` is synchronous, so this page stays a plain (non-`async`) function component,
same as `app/blog/page.tsx`.

- [ ] **Step 1: Write the failing test**

Create `frontend/app/faq/page.test.tsx`:
```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { FaqItem } from '@/lib/faq'

const ITEMS: FaqItem[] = [
  {
    id: 1,
    categories: ['personal-color'],
    question: 'Câu hỏi seed test?',
    answerMarkdown: 'Trả lời seed test.',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

vi.mock('@/lib/getDb', () => ({ getDb: () => ({}) }))
vi.mock('@/lib/faq', async () => {
  const actual = await vi.importActual<typeof import('@/lib/faq')>('@/lib/faq')
  return { ...actual, getFaqItems: () => ITEMS }
})

describe('FaqPage', async () => {
  const { default: FaqPage } = await import('./page')

  it('renders the FAQ heading and the seeded question', () => {
    renderWithIntl(<FaqPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi seed test?')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run app/faq/page.test.tsx`
Expected: FAIL — `FaqPage` still renders `<FaqSection />` with no `items` prop.

- [ ] **Step 3: Rewrite `app/faq/page.tsx`**

```tsx
import FaqSection from '@/components/faq/FaqSection'
import FaqSupportBanner from '@/components/faq/FaqSupportBanner'
import { getFaqItems } from '@/lib/faq'
import { getDb } from '@/lib/getDb'

export default function FaqPage() {
  const items = getFaqItems(getDb())

  return (
    <main className="w-full bg-surface">
      <FaqSection items={items} />
      <FaqSupportBanner />
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run app/faq/page.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
cd frontend && git add app/faq/page.tsx app/faq/page.test.tsx
git commit -m "feat: read FAQ items from the database on the FAQ page"
```

---

## Task 8: `FaqForm` — shared create/edit admin form

**Files:**
- Create: `frontend/components/admin/FaqForm.tsx`
- Create: `frontend/components/admin/FaqForm.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.FaqForm` namespace)

**Interfaces:**
- Consumes: `FAQ_CATEGORIES`, `FAQ_HIGHLIGHT_ICONS`, `FaqCategory`, `FaqHighlightIcon`,
  `FaqItem` from `lib/faq.ts`; `/api/faq`, `/api/faq/[id]` from Tasks 3-4.
- Produces: `FaqForm({ initialItem?: FaqItem })` — consumed by Task 10 (new/edit pages).

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "FaqForm": {
      "fields": {
        "question": "Câu hỏi",
        "answerMarkdown": "Câu trả lời (Markdown)",
        "categories": "Chuyên mục (chọn ít nhất 1)",
        "highlightIcon": "Icon khung nổi bật (không bắt buộc)",
        "highlightIconNone": "(Không có)",
        "highlightText": "Nội dung khung nổi bật"
      },
      "submitCreate": "Tạo câu hỏi",
      "submitEdit": "Lưu thay đổi",
      "unauthorizedError": "Bạn cần đăng nhập với quyền quản trị.",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại."
    }
```

- [ ] **Step 2: Write the failing test**

Create `frontend/components/admin/FaqForm.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqForm from './FaqForm'
import type { FaqItem } from '@/lib/faq'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_ITEM: FaqItem = {
  id: 5,
  categories: ['account'],
  question: 'Câu hỏi hiện có?',
  answerMarkdown: 'Trả lời hiện có.',
  highlightIcon: 'info',
  highlightText: 'Ghi chú hiện có.',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('FaqForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('POSTs to /api/faq when creating and redirects to the list on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<FaqForm />)
    fireEvent.change(screen.getByLabelText('Câu hỏi'), { target: { value: 'Câu hỏi mới?' } })
    fireEvent.change(screen.getByLabelText('Câu trả lời (Markdown)'), { target: { value: 'Trả lời mới.' } })
    fireEvent.click(screen.getByLabelText('Personal Color'))
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/faq'))
    expect(fetch).toHaveBeenCalledWith('/api/faq', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/faq/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_ITEM }))
    renderWithIntl(<FaqForm initialItem={EXISTING_ITEM} />)
    expect(screen.getByLabelText('Câu hỏi')).toHaveValue('Câu hỏi hiện có?')
    expect(screen.getByLabelText('Tài khoản')).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/faq'))
    expect(fetch).toHaveBeenCalledWith('/api/faq/5', expect.objectContaining({ method: 'PUT' }))
  })

  it('shows field errors returned by the API instead of redirecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: { question: 'Câu hỏi không được để trống' } }),
      })
    )
    renderWithIntl(<FaqForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => expect(screen.getByText('Câu hỏi không được để trống')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

Note: `'Personal Color'` and `'Tài khoản'` are the existing category tab labels from
`Faq.CategoryTabs.categories.personalColor` / `.account` (already in `messages/vi.json`) —
Step 4 below reuses that translation namespace for the checkbox labels rather than
duplicating the strings.

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/FaqForm.test.tsx`
Expected: FAIL — `./FaqForm` module does not exist yet.

- [ ] **Step 4: Implement `FaqForm.tsx`**

Create `frontend/components/admin/FaqForm.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { FAQ_CATEGORIES, FAQ_HIGHLIGHT_ICONS, type FaqCategory, type FaqHighlightIcon, type FaqItem } from '@/lib/faq'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

const CATEGORY_LABEL_KEYS: Record<FaqCategory, string> = {
  'personal-color': 'personalColor',
  'fitting-room': 'fittingRoom',
  account: 'account',
  stylist: 'stylist',
}

export default function FaqForm({ initialItem }: { initialItem?: FaqItem }) {
  const t = useTranslations('Admin.FaqForm')
  const tCategories = useTranslations('Faq.CategoryTabs.categories')
  const router = useRouter()
  const isEditing = Boolean(initialItem)

  const [question, setQuestion] = useState(initialItem?.question ?? '')
  const [answerMarkdown, setAnswerMarkdown] = useState(initialItem?.answerMarkdown ?? '')
  const [categories, setCategories] = useState<FaqCategory[]>(initialItem?.categories ?? [])
  const [highlightIcon, setHighlightIcon] = useState<FaqHighlightIcon | ''>(initialItem?.highlightIcon ?? '')
  const [highlightText, setHighlightText] = useState(initialItem?.highlightText ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function toggleCategory(category: FaqCategory) {
    setCategories((current) =>
      current.includes(category) ? current.filter((value) => value !== category) : [...current, category]
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = {
      question,
      answerMarkdown,
      categories,
      highlightIcon: highlightIcon || null,
      highlightText: highlightText.trim() || null,
    }

    const response = await fetch(isEditing ? `/api/faq/${initialItem!.id}` : '/api/faq', {
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

    router.push('/admin/faq')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="faq-question" className="text-label-md font-semibold text-on-surface">
          {t('fields.question')}
        </label>
        <input
          id="faq-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className={inputClass}
        />
        {errors.question && <p className="text-label-sm text-error">{errors.question}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="faq-answer" className="text-label-md font-semibold text-on-surface">
          {t('fields.answerMarkdown')}
        </label>
        <textarea
          id="faq-answer"
          rows={6}
          value={answerMarkdown}
          onChange={(event) => setAnswerMarkdown(event.target.value)}
          className={inputClass}
        />
        {errors.answerMarkdown && <p className="text-label-sm text-error">{errors.answerMarkdown}</p>}
      </div>

      <div className="space-y-1.5">
        <span className="text-label-md font-semibold text-on-surface">{t('fields.categories')}</span>
        <div className="flex flex-wrap gap-4">
          {FAQ_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-2 text-body-md text-on-surface">
              <input
                type="checkbox"
                checked={categories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              {tCategories(CATEGORY_LABEL_KEYS[category])}
            </label>
          ))}
        </div>
        {errors.categories && <p className="text-label-sm text-error">{errors.categories}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="faq-highlight-icon" className="text-label-md font-semibold text-on-surface">
            {t('fields.highlightIcon')}
          </label>
          <select
            id="faq-highlight-icon"
            value={highlightIcon}
            onChange={(event) => setHighlightIcon(event.target.value as FaqHighlightIcon | '')}
            className={inputClass}
          >
            <option value="">{t('fields.highlightIconNone')}</option>
            {FAQ_HIGHLIGHT_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
          {errors.highlightIcon && <p className="text-label-sm text-error">{errors.highlightIcon}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="faq-highlight-text" className="text-label-md font-semibold text-on-surface">
            {t('fields.highlightText')}
          </label>
          <input
            id="faq-highlight-text"
            value={highlightText}
            onChange={(event) => setHighlightText(event.target.value)}
            className={inputClass}
          />
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

Run: `cd frontend && npx vitest run components/admin/FaqForm.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/admin/FaqForm.tsx components/admin/FaqForm.test.tsx messages/vi.json
git commit -m "feat: add shared FAQ create/edit admin form"
```

---

## Task 9: FAQ admin list — `FaqList` + `/admin/faq` page

**Files:**
- Create: `frontend/components/admin/FaqList.tsx`
- Create: `frontend/components/admin/FaqList.test.tsx`
- Create: `frontend/app/admin/faq/page.tsx`
- Create: `frontend/app/admin/faq/page.test.tsx`
- Modify: `frontend/messages/vi.json` (new `Admin.FaqList` namespace)

**Interfaces:**
- Consumes: `FaqItem` from `lib/faq.ts`; `GET`/`DELETE /api/faq(/[id])` from Tasks 3-4;
  `AdminGate` (existing); `FaqForm` link targets (`/admin/faq/new`, `/admin/faq/[id]/edit` —
  built in Task 10).
- Produces: `FaqList()` (no props — fetches its own data), default-exported `AdminFaqPage`.

- [ ] **Step 1: Add messages**

In `frontend/messages/vi.json`, inside `"Admin"`, add:
```json
    "FaqList": {
      "title": "Quản lý FAQ",
      "newButton": "Thêm câu hỏi",
      "columnQuestion": "Câu hỏi",
      "editButton": "Sửa",
      "deleteButton": "Xóa",
      "deleteConfirm": "Xóa câu hỏi này?",
      "emptyState": "Chưa có câu hỏi nào.",
      "loading": "Đang tải..."
    }
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/components/admin/FaqList.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqList from './FaqList'
import type { FaqItem } from '@/lib/faq'

const ITEMS: FaqItem[] = [
  {
    id: 1,
    categories: ['account'],
    question: 'Câu hỏi A',
    answerMarkdown: 'Trả lời A',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('FaqList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders items with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEMS }))
    renderWithIntl(<FaqList />)

    await waitFor(() => expect(screen.getByText('Câu hỏi A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/faq/1/edit')
  })

  it('deletes an item when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ITEMS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<FaqList />)

    await waitFor(() => expect(screen.getByText('Câu hỏi A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Câu hỏi A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/faq/1', { method: 'DELETE' })
  })

  it('shows an empty state when there are no items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<FaqList />)
    await waitFor(() => expect(screen.getByText('Chưa có câu hỏi nào.')).toBeInTheDocument())
  })
})
```

Create `frontend/app/admin/faq/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminFaqPage from './page'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('AdminFaqPage', () => {
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

  it('renders the heading and a link to create a new item, for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminFaqPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Quản lý FAQ' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Thêm câu hỏi' })).toHaveAttribute('href', '/admin/faq/new')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx vitest run components/admin/FaqList.test.tsx app/admin/faq/page.test.tsx`
Expected: FAIL — neither file exists yet.

- [ ] **Step 4: Implement `FaqList.tsx`**

Create `frontend/components/admin/FaqList.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { FaqItem } from '@/lib/faq'

export default function FaqList() {
  const t = useTranslations('Admin.FaqList')
  const [items, setItems] = useState<FaqItem[] | null>(null)

  useEffect(() => {
    fetch('/api/faq')
      .then((response) => response.json())
      .then(setItems)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/faq/${id}`, { method: 'DELETE' })
    setItems((current) => current?.filter((item) => item.id !== id) ?? null)
  }

  if (items === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (items.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnQuestion')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{item.question}</td>
            <td className="py-3 text-right">
              <Link href={`/admin/faq/${item.id}/edit`} className="mr-4 font-semibold text-primary hover:underline">
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
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

- [ ] **Step 5: Implement `app/admin/faq/page.tsx`**

Create `frontend/app/admin/faq/page.tsx`:
```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AdminGate from '@/components/auth/AdminGate'
import FaqList from '@/components/admin/FaqList'

export default function AdminFaqPage() {
  const t = useTranslations('Admin.FaqList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <Link
              href="/admin/faq/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('newButton')}
            </Link>
          </div>
          <FaqList />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/admin/FaqList.test.tsx app/admin/faq/page.test.tsx`
Expected: PASS (3 + 1 tests)

- [ ] **Step 7: Commit**

```bash
cd frontend && git add components/admin/FaqList.tsx components/admin/FaqList.test.tsx app/admin/faq/page.tsx app/admin/faq/page.test.tsx messages/vi.json
git commit -m "feat: add FAQ admin list page"
```

---

## Task 10: `/admin/faq/new` and `/admin/faq/[id]/edit` pages

**Files:**
- Create: `frontend/app/admin/faq/new/page.tsx`
- Create: `frontend/app/admin/faq/new/page.test.tsx`
- Create: `frontend/app/admin/faq/[id]/edit/page.tsx`
- Create: `frontend/app/admin/faq/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `FaqForm` from Task 8; `AdminGate` (existing); `GET /api/faq/[id]` from Task 4.

- [ ] **Step 1: Write the failing tests**

Create `frontend/app/admin/faq/new/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewFaqPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewFaqPage', () => {
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
        <NewFaqPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Tạo câu hỏi' })).toBeInTheDocument()
  })
})
```

Create `frontend/app/admin/faq/[id]/edit/page.test.tsx`:
```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditFaqPage from './page'
import type { FaqItem } from '@/lib/faq'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const ITEM: FaqItem = {
  id: 7,
  categories: ['account'],
  question: 'Câu hỏi cần sửa?',
  answerMarkdown: 'Trả lời cần sửa.',
  highlightIcon: null,
  highlightText: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditFaqPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEM }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the item by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditFaqPage params={Promise.resolve({ id: '7' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Câu hỏi')).toHaveValue('Câu hỏi cần sửa?'))
    expect(fetch).toHaveBeenCalledWith('/api/faq/7')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run app/admin/faq/new/page.test.tsx "app/admin/faq/\[id\]/edit/page.test.tsx"`
Expected: FAIL — neither page exists yet.

- [ ] **Step 3: Implement `app/admin/faq/new/page.tsx`**

```tsx
'use client'

import AdminGate from '@/components/auth/AdminGate'
import FaqForm from '@/components/admin/FaqForm'

export default function NewFaqPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <FaqForm />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 4: Implement `app/admin/faq/[id]/edit/page.tsx`**

Same `params.then(...)`-in-`useEffect` pattern as the Blog/Quiz edit pages (avoids needing a
`<Suspense>` boundary around every caller — see Global Constraints).

```tsx
'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import FaqForm from '@/components/admin/FaqForm'
import type { FaqItem } from '@/lib/faq'

export default function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<FaqItem | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/faq/${id}`)
        .then((response) => response.json())
        .then(setItem)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {item && <FaqForm initialItem={item} />}
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx vitest run app/admin/faq/new/page.test.tsx "app/admin/faq/\[id\]/edit/page.test.tsx"`
Expected: PASS (1 + 1 tests)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add "app/admin/faq/new" "app/admin/faq/[id]"
git commit -m "feat: add FAQ create/edit admin pages"
```

---

## Task 11: `AdminDashboard` links to FAQ management

**Files:**
- Modify: `frontend/components/auth/AdminDashboard.tsx`
- Modify: `frontend/components/auth/AdminDashboard.test.tsx`
- Modify: `frontend/messages/vi.json` (`Admin` namespace)

**Interfaces:**
- Produces: no new exports; links to `/admin/faq` (Task 9).

- [ ] **Step 1: Update messages**

In `frontend/messages/vi.json`, inside the existing `"Admin"` object, add (alongside the
existing `blogCardTitle`/`quizCardTitle` pair):
```json
    "faqCardTitle": "Quản lý FAQ",
    "faqCardDescription": "Tạo, sửa và xóa câu hỏi thường gặp hiển thị trên trang FAQ."
```

- [ ] **Step 2: Write the failing test**

In `frontend/components/auth/AdminDashboard.test.tsx`, add a third assertion to the existing
test (the file currently has one `it('links to the blog and quiz admin sections', ...)` test
— extend it rather than adding a new one, since it's testing the same dashboard render):
```tsx
    expect(screen.getByRole('link', { name: /Quản lý FAQ/ })).toHaveAttribute('href', '/admin/faq')
```
Add that line right after the existing `expect(screen.getByRole('link', { name: /Quản lý câu
hỏi Quiz/ }))...` line, inside the same test body.

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: FAIL — no FAQ link exists yet.

- [ ] **Step 4: Update `AdminDashboard.tsx`**

Add a third `<Link>` card, right after the existing `/admin/quiz` card and before the closing
`</div>` of the `grid grid-cols-1 gap-6 sm:grid-cols-2` container:
```tsx
          <Link
            href="/admin/faq"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('faqCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('faqCardDescription')}</p>
          </Link>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/auth/AdminDashboard.test.tsx`
Expected: PASS (1 test, now with 3 assertions)

- [ ] **Step 6: Commit**

```bash
cd frontend && git add components/auth/AdminDashboard.tsx components/auth/AdminDashboard.test.tsx messages/vi.json
git commit -m "feat: link the admin dashboard to FAQ management"
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

This is not optional — the Blog/Quiz CMS shipped with a bug (Client Component bundling
`better-sqlite3`) that the test suite and typecheck both missed. Start the dev server
(`cd frontend && npm run dev`) and, in a browser (or a headless-Chromium driver script):

1. Visit `/faq` — confirm all 6 seeded questions render, category filter and search work,
   opening a question shows the markdown-rendered answer (and the highlight box for the
   questions that have one).
2. Log in as `admin@twistfit.vn` / `admin1234`, go to `/admin` → `/admin/faq`: create a
   question (with 2 categories checked and a highlight icon selected), verify it appears on
   `/faq`; edit it; delete it.
3. Check the browser console for errors on both `/faq` and `/admin/faq` — in particular
   confirm there is **no** `Module not found: Can't resolve 'fs'` error (the signature of a
   server-only module leaking into the client bundle).

- [ ] **Step 5: Commit** (only if Step 4 required fixes; otherwise skip)

```bash
cd frontend && git add -A
git commit -m "fix: address issues found in FAQ CMS manual verification"
```
