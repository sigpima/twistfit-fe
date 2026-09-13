import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { POST } from './route'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/auth/users')>('@/lib/auth/users')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  return { getDb: () => testDb }
})

const validBody = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  password: 'password123',
}

beforeEach(() => {
  getDb().exec('DELETE FROM users')
})

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 without a password hash', async () => {
    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.email).toBe('test@twistfit.vn')
    expect(body.role).toBe('user')
    expect(body.passwordHash).toBeUndefined()
    expect(body.password).toBeUndefined()
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, email: 'not-an-email' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.email).toBeDefined()
  })

  it('returns 409 when the email is already registered', async () => {
    await POST(new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify(validBody) }))
    const response = await POST(
      new Request('http://localhost/api/auth/register', { method: 'POST', body: JSON.stringify(validBody) })
    )
    expect(response.status).toBe(409)
    expect((await response.json()).error).toBe('EMAIL_TAKEN')
  })
})
