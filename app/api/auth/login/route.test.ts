import { describe, expect, it } from 'vitest'
import { POST } from './route'
import { verifySessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

describe('POST /api/auth/login', () => {
  it('sets a signed session cookie for valid admin credentials', async () => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@twistfit.vn', password: 'admin1234' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)

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
