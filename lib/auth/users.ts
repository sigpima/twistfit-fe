import type Database from 'better-sqlite3'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export type Role = 'user' | 'admin'

export type User = {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
}

type InsertUserInput = {
  name: string
  email: string
  password: string
  role: Role
}

type UserRow = {
  id: number
  name: string
  email: string
  password_hash: string
  role: string
  created_at: string
  updated_at: string
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getUserByEmail(db: Database.Database, email: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email)) as
    | UserRow
    | undefined
  return row ? rowToUser(row) : null
}

export function getUserById(db: Database.Database, id: number): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
  return row ? rowToUser(row) : null
}

export function isEmailTaken(db: Database.Database, email: string): boolean {
  return getUserByEmail(db, email) !== null
}

function insertUser(db: Database.Database, input: InsertUserInput): User {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
       VALUES (@name, @email, @passwordHash, @role, @createdAt, @updatedAt)`
    )
    .run({
      name: input.name,
      email: normalizeEmail(input.email),
      passwordHash: hashPassword(input.password),
      role: input.role,
      createdAt: now,
      updatedAt: now,
    })
  const created = getUserById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created user')
  }
  return created
}

export function createUser(db: Database.Database, input: CreateUserInput): User {
  return insertUser(db, { ...input, role: 'user' })
}

export function verifyUserCredentials(db: Database.Database, email: string, password: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email)) as
    | UserRow
    | undefined
  if (!row) return null
  if (!verifyPassword(password, row.password_hash)) return null
  return rowToUser(row)
}

const SEED_USERS: InsertUserInput[] = [
  { name: 'Người dùng Test', email: 'user@twistfit.vn', password: 'user1234', role: 'user' },
  { name: 'Quản trị viên Test', email: 'admin@twistfit.vn', password: 'admin1234', role: 'admin' },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number }
  if (count > 0) return
  SEED_USERS.forEach((user) => insertUser(db, user))
}
