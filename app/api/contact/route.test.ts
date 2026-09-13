import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
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

const validBody = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  phone: '0909123456',
  subject: 'other',
  message: 'Nội dung test',
}

beforeEach(() => {
  getDb().exec('DELETE FROM contact_messages')
})

describe('GET /api/contact', () => {
  it('rejects requests without an admin session', async () => {
    const response = await GET(new Request('http://localhost/api/contact'))
    expect(response.status).toBe(401)
  })

  it('returns messages for an admin session', async () => {
    const request = new Request('http://localhost/api/contact', { headers: { cookie: adminCookieHeader() } })
    const response = await GET(request)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/contact', () => {
  it('creates a message without requiring any session', async () => {
    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.isRead).toBe(false)
    expect(body.name).toBe('Nguyễn Văn Test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, email: 'not-an-email' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.email).toBeDefined()
  })
})
