import type Database from 'better-sqlite3'

// Legacy SQLite shim, kept only for admin/stats (lib/stats.ts), which still
// counts rows in `contact_messages` directly against the shared SQLite
// database and has not been migrated to FastAPI yet (planned for Phase 6).
// Contact's real data now lives in Postgres via the FastAPI backend; this
// table is intentionally never written to in production, so admin/stats
// reports 0 contact messages until that migration happens, rather than
// silently showing stale data. `createContactMessage` is kept only because
// lib/stats.test.ts calls it to build fixture rows for its count assertions.

export type ContactSubject = 'color-test' | 'virtual-fitting' | 'stylist' | 'other'

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

function getContactMessageById(db: Database.Database, id: number): ContactMessage | null {
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
