import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { initSchema, seedIfEmpty } from './db'
import { initSchema as initFaqSchema, seedIfEmpty as seedFaqIfEmpty } from './faq'

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
  initFaqSchema(db)
  seedFaqIfEmpty(db)
  singleton = db
  return db
}
