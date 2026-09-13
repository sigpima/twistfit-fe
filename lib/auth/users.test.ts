import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createUser,
  getUserByEmail,
  getUserById,
  isEmailTaken,
  verifyUserCredentials,
  seedIfEmpty,
  type CreateUserInput,
} from './users'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleInput: CreateUserInput = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  password: 'password123',
}

describe('createUser / getUserByEmail / getUserById', () => {
  it('creates a user with role "user" and a hashed password', () => {
    const created = createUser(db, sampleInput)
    expect(created.id).toBeGreaterThan(0)
    expect(created.name).toBe('Nguyễn Văn Test')
    expect(created.email).toBe('test@twistfit.vn')
    expect(created.role).toBe('user')
    expect((created as unknown as { passwordHash?: string }).passwordHash).toBeUndefined()

    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(created.id) as {
      password_hash: string
    }
    expect(row.password_hash).not.toBe('password123')
    expect(row.password_hash).toContain(':')
  })

  it('normalizes email to lowercase and trims it', () => {
    const created = createUser(db, { ...sampleInput, email: '  Test@TwistFit.vn  ' })
    expect(created.email).toBe('test@twistfit.vn')
    expect(getUserByEmail(db, 'TEST@twistfit.vn')?.id).toBe(created.id)
  })

  it('reads back a user by id', () => {
    const created = createUser(db, sampleInput)
    expect(getUserById(db, created.id)?.email).toBe('test@twistfit.vn')
    expect(getUserById(db, 999999)).toBeNull()
  })
})

describe('isEmailTaken', () => {
  it('reflects whether an email is already registered', () => {
    expect(isEmailTaken(db, 'test@twistfit.vn')).toBe(false)
    createUser(db, sampleInput)
    expect(isEmailTaken(db, 'test@twistfit.vn')).toBe(true)
    expect(isEmailTaken(db, 'Test@TwistFit.vn')).toBe(true)
  })
})

describe('verifyUserCredentials', () => {
  it('returns the user for correct credentials', () => {
    createUser(db, sampleInput)
    const user = verifyUserCredentials(db, 'test@twistfit.vn', 'password123')
    expect(user?.email).toBe('test@twistfit.vn')
  })

  it('is case-insensitive on email', () => {
    createUser(db, sampleInput)
    expect(verifyUserCredentials(db, 'TEST@twistfit.vn', 'password123')?.email).toBe('test@twistfit.vn')
  })

  it('returns null for a wrong password', () => {
    createUser(db, sampleInput)
    expect(verifyUserCredentials(db, 'test@twistfit.vn', 'wrongpass')).toBeNull()
  })

  it('returns null for an unknown email', () => {
    expect(verifyUserCredentials(db, 'nobody@twistfit.vn', 'password123')).toBeNull()
  })
})

describe('seedIfEmpty', () => {
  it('seeds the 2 demo accounts into an empty database', () => {
    seedIfEmpty(db)
    expect(verifyUserCredentials(db, 'user@twistfit.vn', 'user1234')?.role).toBe('user')
    expect(verifyUserCredentials(db, 'admin@twistfit.vn', 'admin1234')?.role).toBe('admin')
  })

  it('does nothing if users already has rows', () => {
    createUser(db, sampleInput)
    seedIfEmpty(db)
    expect(isEmailTaken(db, 'user@twistfit.vn')).toBe(false)
  })
})
