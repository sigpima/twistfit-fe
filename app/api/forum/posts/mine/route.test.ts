import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost } from '@/lib/forum'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema: initUsersSchema } = await vi.importActual<typeof import('@/lib/auth/users')>(
    '@/lib/auth/users'
  )
  const { initSchema: initForumSchema } = await vi.importActual<typeof import('@/lib/forum')>('@/lib/forum')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initUsersSchema(testDb)
  initForumSchema(testDb)
  return { getDb: () => testDb }
})

function cookieFor(email: string, role: 'user' | 'admin') {
  const value = createSessionCookieValue(email, role)
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

beforeEach(() => {
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('GET /api/forum/posts/mine', () => {
  it('rejects requests without a session', async () => {
    const response = await GET(new Request('http://localhost/api/forum/posts/mine'))
    expect(response.status).toBe(401)
  })

  it("returns only the caller's own posts, regardless of status", async () => {
    const db = getDb()
    const me = createUser(db, { name: 'Tôi', email: 'me@twistfit.vn', password: 'password123' })
    const other = createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' })
    createForumPost(db, me.id, { title: 'Bài của tôi', body: 'B', category: 'general' })
    createForumPost(db, other.id, { title: 'Bài của người khác', body: 'B', category: 'general' })

    const request = new Request('http://localhost/api/forum/posts/mine', {
      headers: { cookie: cookieFor('me@twistfit.vn', 'user') },
    })
    const response = await GET(request)
    expect(response.status).toBe(200)
    const posts = await response.json()
    expect(posts).toHaveLength(1)
    expect(posts[0].title).toBe('Bài của tôi')
  })
})
