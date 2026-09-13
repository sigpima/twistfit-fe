import type Database from 'better-sqlite3'

export type ContactSubject = 'color-test' | 'virtual-fitting' | 'stylist' | 'other'

export const CONTACT_SUBJECTS: ContactSubject[] = ['color-test', 'virtual-fitting', 'stylist', 'other']

export type ContactMessage = {
  id: number
  name: string
  email: string
  phone: string | null
  subject: ContactSubject
  message: string
  isRead: boolean
  createdAt: string
}

export type ContactMessageInput = {
  name: string
  email: string
  phone: string | null
  subject: ContactSubject
  message: string
}

type ContactMessageRow = {
  id: number
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  is_read: number
  created_at: string
}

function rowToContactMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject as ContactSubject,
    message: row.message,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `)
}

export function getContactMessages(db: Database.Database): ContactMessage[] {
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY id DESC').all() as ContactMessageRow[]
  return rows.map(rowToContactMessage)
}

export function getContactMessageById(db: Database.Database, id: number): ContactMessage | null {
  const row = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id) as
    | ContactMessageRow
    | undefined
  return row ? rowToContactMessage(row) : null
}

export function createContactMessage(db: Database.Database, input: ContactMessageInput): ContactMessage {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO contact_messages (name, email, phone, subject, message, is_read, created_at)
       VALUES (@name, @email, @phone, @subject, @message, 0, @createdAt)`
    )
    .run({ ...input, createdAt: now })
  const created = getContactMessageById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created contact message')
  }
  return created
}

export function setContactMessageRead(
  db: Database.Database,
  id: number,
  isRead: boolean
): ContactMessage | null {
  const existing = getContactMessageById(db, id)
  if (!existing) return null
  db.prepare('UPDATE contact_messages SET is_read = ? WHERE id = ?').run(isRead ? 1 : 0, id)
  return getContactMessageById(db, id)
}

export function deleteContactMessage(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id)
  return result.changes > 0
}

export function seedIfEmpty(_db: Database.Database): void {
  // Deliberately a no-op: contact messages are real visitor submissions, never
  // seeded demo data. Kept as a function so lib/getDb.ts's init/seed call
  // sequence stays uniform across every domain module.
}
