import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { POST } from './route'
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema, seedIfEmpty } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  seedIfEmpty(testDb)
  return { getDb: () => testDb }
})

describe('POST /api/auth/login', () => {
  it('sets a signed session cookie for valid admin credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@twistfit.vn', password: 'admin1234' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Quản trị viên Test')

    const cookie = response.cookies.get(SESSION_COOKIE_NAME)
    expect(cookie).toBeDefined()
    const session = verifySessionCookieValue(cookie!.value)
    expect(session?.role).toBe('admin')
    expect(session?.email).toBe('admin@twistfit.vn')
  })

  it('returns 401 and sets no cookie for invalid credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@twistfit.vn', password: 'wrongpass' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
    expect(response.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined()
  })

  it('returns 400 when email or password is missing', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
