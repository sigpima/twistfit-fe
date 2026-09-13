import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { POST } from './route'
import { createUser } from '@/lib/auth/users'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema: initUsersSchema } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const { initSchema: initQuizAttemptsSchema } = await vi.importActual<typeof import('@/lib/quizAttempts')>(
    '@/lib/quizAttempts'
  )
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initUsersSchema(testDb)
  initQuizAttemptsSchema(testDb)
  return { getDb: () => testDb }
})

function cookieFor(email: string, role: 'user' | 'admin') {
  const value = createSessionCookieValue(email, role)
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

beforeEach(() => {
  getDb().exec('DELETE FROM quiz_attempts')
  getDb().exec('DELETE FROM users')
})

describe('POST /api/quiz-attempts', () => {
  it('creates an anonymous attempt without any session', async () => {
    const request = new Request('http://localhost/api/quiz-attempts', {
      method: 'POST',
      body: JSON.stringify({ season: 'summer' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.season).toBe('summer')
    expect(body.userId).toBeNull()
  })

  it('attributes the attempt to the logged-in user', async () => {
    const user = createUser(getDb(), { name: 'Test', email: 'test@twistfit.vn', password: 'password123' })
    const request = new Request('http://localhost/api/quiz-attempts', {
      method: 'POST',
      headers: { cookie: cookieFor('test@twistfit.vn', 'user') },
      body: JSON.stringify({ season: 'winter' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect((await response.json()).userId).toBe(user.id)
  })

  it('returns 400 for an invalid season', async () => {
    const request = new Request('http://localhost/api/quiz-attempts', {
      method: 'POST',
      body: JSON.stringify({ season: 'not-a-season' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
