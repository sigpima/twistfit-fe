import { describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema: initBlogSchema } = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  const { initSchema: initUsersSchema } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const { initSchema: initForumSchema } = await vi.importActual<typeof import('@/lib/forum')>('@/lib/forum')
  const { initSchema: initQuizAttemptsSchema } = await vi.importActual<typeof import('@/lib/quizAttempts')>(
    '@/lib/quizAttempts'
  )
  const { initSchema: initContactSchema } = await vi.importActual<typeof import('@/lib/contact')>(
    '@/lib/contact'
  )
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initBlogSchema(testDb)
  initUsersSchema(testDb)
  initForumSchema(testDb)
  initQuizAttemptsSchema(testDb)
  initContactSchema(testDb)
  return { getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

describe('GET /api/admin/stats', () => {
  it('rejects requests without an admin session', async () => {
    const response = await GET(new Request('http://localhost/api/admin/stats'))
    expect(response.status).toBe(401)
  })

  it('returns the aggregated stats for an admin session', async () => {
    const request = new Request('http://localhost/api/admin/stats', { headers: { cookie: adminCookieHeader() } })
    const response = await GET(request)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.blogPosts).toEqual({ total: 0, new30d: 0 })
    expect(body.contactMessages).toEqual({ total: 0, unread: 0 })
  })
})
