import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { initSchema, seedIfEmpty } from './db'
import { initSchema as initFaqSchema, seedIfEmpty as seedFaqIfEmpty } from './faq'
import { initSchema as initModelCatalogSchema, seedIfEmpty as seedModelCatalogIfEmpty } from './modelCatalog'
import { initSchema as initCapsuleSchema, seedIfEmpty as seedCapsuleIfEmpty } from './capsuleWardrobe'
import { initSchema as initTeamSchema, seedIfEmpty as seedTeamIfEmpty } from './team'
import { initSchema as initUsersSchema, seedIfEmpty as seedUsersIfEmpty } from './auth/users'

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
  initModelCatalogSchema(db)
  seedModelCatalogIfEmpty(db)
  initCapsuleSchema(db)
  seedCapsuleIfEmpty(db)
  initTeamSchema(db)
  seedTeamIfEmpty(db)
  initUsersSchema(db)
  seedUsersIfEmpty(db)
  singleton = db
  return db
}
