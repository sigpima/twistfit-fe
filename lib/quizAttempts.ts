import type Database from 'better-sqlite3'
import type { Season } from './db'

// Legacy SQLite shim, kept only for admin/stats (lib/stats.ts), which still
// counts rows in `quiz_attempts` directly against the shared SQLite
// database and has not been migrated to FastAPI yet (planned for Phase 6).
// Quiz-attempts' real data now lives in Postgres via the FastAPI backend;
// this table is intentionally never written to in production, so
// admin/stats reports 0 quiz attempts until that migration happens, rather
// than silently showing stale data. `createQuizAttempt` is kept only
// because lib/stats.test.ts calls it to build fixture rows for its count
// assertions.

type QuizAttemptRow = {
  id: number
  season: string
  user_id: number | null
  created_at: string
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

export function createQuizAttempt(
  db: Database.Database,
  season: Season,
  userId: number | null
): { id: number; season: Season; userId: number | null; createdAt: string } {
  const now = new Date().toISOString()
  const result = db
    .prepare('INSERT INTO quiz_attempts (season, user_id, created_at) VALUES (?, ?, ?)')
    .run(season, userId, now)
  const row = db
    .prepare('SELECT * FROM quiz_attempts WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as QuizAttemptRow
  return { id: row.id, season: row.season as Season, userId: row.user_id, createdAt: row.created_at }
}
