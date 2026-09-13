import type Database from 'better-sqlite3'

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

export type QuizOption = {
  id: number
  label: string
  season: Season
  sortOrder: number
}

export type QuizQuestion = {
  id: number
  questionText: string
  sortOrder: number
  options: QuizOption[]
}

// --- Legacy SQLite shim, kept only for admin/stats (lib/stats.ts), which still
// counts rows in `blog_posts` directly against the shared SQLite database and
// has not been migrated to FastAPI yet (planned for a future phase). Blog's
// real data now lives in Postgres via the FastAPI backend; this table is
// intentionally never seeded, so admin/stats reports 0 blog posts until that
// migration happens, rather than silently showing stale canned data.

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
  `)
}

function getBlogPostById(db: Database.Database, id: number): BlogPost | null {
  const row = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as BlogPostRow | undefined
  return row ? rowToBlogPost(row) : null
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
