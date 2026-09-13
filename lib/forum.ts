import type Database from 'better-sqlite3'

// Legacy SQLite shim, kept only for admin/stats (lib/stats.ts), which still
// counts rows in `forum_posts` directly against the shared SQLite database
// and has not been migrated to FastAPI yet (planned for Phase 6). Forum's
// real data now lives in Postgres via the FastAPI backend; this table is
// intentionally never written to in production, so admin/stats reports 0
// forum posts until that migration happens, rather than silently showing
// stale data. `createForumPost` is kept only because lib/stats.test.ts
// calls it to build fixture rows for its count assertions.
//
// The types and constants below are NOT part of the legacy shim — they are
// the shared shapes still used by the (unchanged) forum Client Components
// after cutover, since apiFetch responses are typed against them directly.

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

function getForumPostById(db: Database.Database, id: number): ForumPost | null {
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
