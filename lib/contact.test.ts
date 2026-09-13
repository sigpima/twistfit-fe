import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  setContactMessageRead,
  deleteContactMessage,
  seedIfEmpty,
  type ContactMessageInput,
} from './contact'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleInput: ContactMessageInput = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  phone: null,
  subject: 'other',
  message: 'Nội dung test',
}

describe('createContactMessage', () => {
  it('creates a message with isRead false', () => {
    const created = createContactMessage(db, sampleInput)
    expect(created.id).toBeGreaterThan(0)
    expect(created.isRead).toBe(false)
    expect(created.name).toBe('Nguyễn Văn Test')
    expect(created.phone).toBeNull()
  })

  it('stores an optional phone when provided', () => {
    const created = createContactMessage(db, { ...sampleInput, phone: '0909123456' })
    expect(created.phone).toBe('0909123456')
  })
})

describe('getContactMessages', () => {
  it('lists messages newest first', () => {
    createContactMessage(db, { ...sampleInput, name: 'Tin 1' })
    createContactMessage(db, { ...sampleInput, name: 'Tin 2' })
    expect(getContactMessages(db).map((m) => m.name)).toEqual(['Tin 2', 'Tin 1'])
  })
})

describe('getContactMessageById', () => {
  it('reads back a message by id, or null if missing', () => {
    const created = createContactMessage(db, sampleInput)
    expect(getContactMessageById(db, created.id)?.email).toBe('test@twistfit.vn')
    expect(getContactMessageById(db, 999999)).toBeNull()
  })
})

describe('setContactMessageRead', () => {
  it('toggles the isRead flag', () => {
    const created = createContactMessage(db, sampleInput)
    const marked = setContactMessageRead(db, created.id, true)
    expect(marked?.isRead).toBe(true)
    const unmarked = setContactMessageRead(db, created.id, false)
    expect(unmarked?.isRead).toBe(false)
  })

  it('returns null for a message that does not exist', () => {
    expect(setContactMessageRead(db, 999999, true)).toBeNull()
  })
})

describe('deleteContactMessage', () => {
  it('deletes a message', () => {
    const created = createContactMessage(db, sampleInput)
    expect(deleteContactMessage(db, created.id)).toBe(true)
    expect(getContactMessageById(db, created.id)).toBeNull()
    expect(deleteContactMessage(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('does nothing — contact messages are never auto-seeded', () => {
    seedIfEmpty(db)
    expect(getContactMessages(db)).toHaveLength(0)
  })
})
