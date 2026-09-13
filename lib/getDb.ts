import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { initSchema as initBlogSchema } from './db'
import { initSchema as initUsersSchema, seedIfEmpty as seedUsersIfEmpty } from './auth/users'
import { initSchema as initForumSchema, seedIfEmpty as seedForumIfEmpty } from './forum'
import { initSchema as initContactSchema, seedIfEmpty as seedContactIfEmpty } from './contact'
import { initSchema as initQuizAttemptsSchema, seedIfEmpty as seedQuizAttemptsIfEmpty } from './quizAttempts'

let singleton: Database.Database | null = null

export function getDb(): Database.Database {
  if (singleton) return singleton

  const dbPath = path.join(process.cwd(), 'data', 'twistfit.db')
  const dir = path.dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const db = new Database(dbPath)
  // blog_posts is created (but not seeded) only because lib/stats.ts still
  // counts it directly against SQLite — see the comment in lib/db.ts.
  initBlogSchema(db)
  initUsersSchema(db)
  seedUsersIfEmpty(db)
  initForumSchema(db)
  seedForumIfEmpty(db)
  initContactSchema(db)
  seedContactIfEmpty(db)
  initQuizAttemptsSchema(db)
  seedQuizAttemptsIfEmpty(db)
  singleton = db
  return db
}
