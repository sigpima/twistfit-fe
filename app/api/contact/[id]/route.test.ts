import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { createContactMessage, type ContactMessageInput } from '@/lib/contact'
import { PATCH, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/contact')>('@/lib/contact')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  return { getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

const validInput: ContactMessageInput = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  phone: null,
  subject: 'other',
  message: 'Nội dung test',
}

beforeEach(() => {
  getDb().exec('DELETE FROM contact_messages')
})

describe('PATCH /api/contact/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createContactMessage(getDb(), validInput)
    const request = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ isRead: true }) })
    const response = await PATCH(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('marks a message read', async () => {
    const created = createContactMessage(getDb(), validInput)
    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ isRead: true }),
    })
    const response = await PATCH(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).isRead).toBe(true)
  })

  it('returns 404 for a message that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ isRead: true }),
    })
    const response = await PATCH(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/contact/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createContactMessage(getDb(), validInput)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes a message', async () => {
    const created = createContactMessage(getDb(), validInput)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
  })

  it('returns 404 for a message that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(999999))
    expect(response.status).toBe(404)
  })
})
