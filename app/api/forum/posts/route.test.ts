import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createUser } from '@/lib/auth/users'
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

const validBody = { title: 'Bài test', body: 'Nội dung test', category: 'general' }

beforeEach(() => {
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('GET /api/forum/posts', () => {
  it('returns an empty list when there are no published posts', async () => {
    const response = await GET(new Request('http://localhost/api/forum/posts'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('filters by category', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    db.prepare(
      `INSERT INTO forum_posts (title, body, category, status, author_id, created_at, updated_at)
       VALUES ('T', 'B', 'styling-help', 'published', ?, '2026-01-01', '2026-01-01')`
    ).run(author.id)

    const matching = await GET(new Request('http://localhost/api/forum/posts?category=styling-help'))
    expect(await matching.json()).toHaveLength(1)
    const nonMatching = await GET(new Request('http://localhost/api/forum/posts?category=general'))
    expect(await nonMatching.json()).toHaveLength(0)
  })
})

describe('POST /api/forum/posts', () => {
  it('rejects requests without a session', async () => {
    const request = new Request('http://localhost/api/forum/posts', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a post with status "pending" for a logged-in user', async () => {
    createUser(getDb(), { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const request = new Request('http://localhost/api/forum/posts', {
      method: 'POST',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.status).toBe('pending')
    expect(body.title).toBe('Bài test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    createUser(getDb(), { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const request = new Request('http://localhost/api/forum/posts', {
      method: 'POST',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
      body: JSON.stringify({ ...validBody, title: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.title).toBeDefined()
  })
})
