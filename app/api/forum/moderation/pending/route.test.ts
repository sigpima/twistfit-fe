import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, setForumPostStatus } from '@/lib/forum'
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
  getDb().exec('DELETE FROM forum_reports')
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('GET /api/forum/moderation/pending', () => {
  it('rejects requests without an admin session', async () => {
    const response = await GET(new Request('http://localhost'))
    expect(response.status).toBe(401)
  })

  it('returns only pending posts', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createForumPost(db, author.id, { title: 'Chờ duyệt', body: 'B', category: 'general' })
    const published = createForumPost(db, author.id, { title: 'Đã duyệt', body: 'B', category: 'general' })
    setForumPostStatus(db, published.id, 'published')

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') } })
    const response = await GET(request)
    expect(response.status).toBe(200)
    const posts = await response.json()
    expect(posts).toHaveLength(1)
    expect(posts[0].title).toBe('Chờ duyệt')
  })
})
