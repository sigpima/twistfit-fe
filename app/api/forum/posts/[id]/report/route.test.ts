import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { POST } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, setForumPostStatus, type ForumPostInput } from '@/lib/forum'
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

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

const validInput: ForumPostInput = { title: 'Bài test', body: 'Nội dung test', category: 'general' }

beforeEach(() => {
  getDb().exec('DELETE FROM forum_reports')
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('POST /api/forum/posts/[id]/report', () => {
  it('rejects requests without a session', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ reason: 'Spam' }) })
    const response = await POST(request, params(post.id))
    expect(response.status).toBe(401)
  })

  it('creates a report for a visible post', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    setForumPostStatus(db, post.id, 'published')

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { cookie: cookieFor('reporter@twistfit.vn', 'user') },
      body: JSON.stringify({ reason: 'Nội dung không phù hợp' }),
    })
    const response = await POST(request, params(post.id))
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.reason).toBe('Nội dung không phù hợp')
    expect(body.postId).toBe(post.id)
  })

  it('returns 400 when the reason is missing', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    setForumPostStatus(db, post.id, 'published')

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { cookie: cookieFor('reporter@twistfit.vn', 'user') },
      body: JSON.stringify({ reason: '  ' }),
    })
    const response = await POST(request, params(post.id))
    expect(response.status).toBe(400)
  })

  it('returns 404 for a post the reporter cannot view', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { cookie: cookieFor('reporter@twistfit.vn', 'user') },
      body: JSON.stringify({ reason: 'Spam' }),
    })
    const response = await POST(request, params(post.id))
    expect(response.status).toBe(404)
  })
})
