import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema as initUsersSchema, createUser } from './auth/users'
import {
  initSchema,
  createQuizAttempt,
  getQuizAttemptsCount,
  getNewQuizAttemptsCount,
  seedIfEmpty,
} from './quizAttempts'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initUsersSchema(db)
  initSchema(db)
})

afterEach(() => {
  db.close()
})

describe('createQuizAttempt', () => {
  it('creates an attempt with a null user id for an anonymous visitor', () => {
    const created = createQuizAttempt(db, 'summer', null)
    expect(created.id).toBeGreaterThan(0)
    expect(created.season).toBe('summer')
    expect(created.userId).toBeNull()
  })

  it('creates an attempt attributed to a real user', () => {
    const user = createUser(db, { name: 'Test', email: 'test@twistfit.vn', password: 'password123' })
    const created = createQuizAttempt(db, 'winter', user.id)
    expect(created.userId).toBe(user.id)
  })
})

describe('getQuizAttemptsCount', () => {
  it('counts all attempts', () => {
    createQuizAttempt(db, 'spring', null)
    createQuizAttempt(db, 'autumn', null)
    expect(getQuizAttemptsCount(db)).toBe(2)
  })
})

describe('getNewQuizAttemptsCount', () => {
  it('counts only attempts created at or after the given timestamp', () => {
    db.prepare('INSERT INTO quiz_attempts (season, user_id, created_at) VALUES (?, ?, ?)').run(
      'spring',
      null,
      '2020-01-01T00:00:00.000Z'
    )
    createQuizAttempt(db, 'summer', null)
    const since = new Date(Date.now() - 1000).toISOString()
    expect(getNewQuizAttemptsCount(db, since)).toBe(1)
  })
})

describe('seedIfEmpty', () => {
  it('does nothing — quiz attempts are never auto-seeded', () => {
    seedIfEmpty(db)
    expect(getQuizAttemptsCount(db)).toBe(0)
  })
})
