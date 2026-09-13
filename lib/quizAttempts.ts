import type Database from 'better-sqlite3'
import type { Season } from './db'

export type QuizAttempt = {
  id: number
  season: Season
  userId: number | null
  createdAt: string
}

type QuizAttemptRow = {
  id: number
  season: string
  user_id: number | null
  created_at: string
}

function rowToQuizAttempt(row: QuizAttemptRow): QuizAttempt {
  return {
    id: row.id,
    season: row.season as Season,
    userId: row.user_id,
    createdAt: row.created_at,
  }
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

export function createQuizAttempt(db: Database.Database, season: Season, userId: number | null): QuizAttempt {
  const now = new Date().toISOString()
  const result = db
    .prepare('INSERT INTO quiz_attempts (season, user_id, created_at) VALUES (?, ?, ?)')
    .run(season, userId, now)
  const row = db
    .prepare('SELECT * FROM quiz_attempts WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as QuizAttemptRow
  return rowToQuizAttempt(row)
}

export function getQuizAttemptsCount(db: Database.Database): number {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM quiz_attempts').get() as { count: number }
  return count
}

export function getNewQuizAttemptsCount(db: Database.Database, sinceIso: string): number {
  const { count } = db
    .prepare('SELECT COUNT(*) AS count FROM quiz_attempts WHERE created_at >= ?')
    .get(sinceIso) as { count: number }
  return count
}

export function seedIfEmpty(_db: Database.Database): void {
  // Deliberately a no-op: quiz attempts are real visitor activity, never
  // seeded demo data. Kept as a function so lib/getDb.ts's init/seed call
  // sequence stays uniform across every domain module.
}
