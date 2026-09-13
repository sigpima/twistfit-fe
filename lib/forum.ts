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

// Deliberately a no-op: unlike the other CMS tables, forum content only makes sense
// once real users post it, so there is nothing to seed. Kept as a function (accepting
// but ignoring `db`) so lib/getDb.ts's init/seed call sequence stays uniform across
// every domain module.
export function seedIfEmpty(_db: Database.Database): void {}
