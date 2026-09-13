import type Database from 'better-sqlite3'
import type { Role } from '@/lib/auth/users'

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

// Deliberately a no-op: unlike the other CMS tables, forum content only makes sense
// once real users post it, so there is nothing to seed. Kept as a function (accepting
// but ignoring `db`) so lib/getDb.ts's init/seed call sequence stays uniform across
// every domain module.
export function seedIfEmpty(_db: Database.Database): void {}
