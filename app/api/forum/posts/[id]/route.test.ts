import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, PUT, DELETE } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, type ForumPostInput } from '@/lib/forum'
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
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('GET /api/forum/posts/[id]', () => {
  it('returns a published post to anyone', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    db.prepare("UPDATE forum_posts SET status = 'published' WHERE id = ?").run(post.id)

    const response = await GET(new Request('http://localhost'), params(post.id))
    expect(response.status).toBe(200)
  })

  it('returns 404 for a pending post viewed by someone else', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('other@twistfit.vn', 'user') } })
    const response = await GET(request, params(post.id))
    expect(response.status).toBe(404)
  })

  it('returns a pending post to its own author', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('author@twistfit.vn', 'user') } })
    const response = await GET(request, params(post.id))
    expect(response.status).toBe(200)
  })

  it('returns a pending post to an admin', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Admin', email: 'admin2@twistfit.vn', password: 'password123' })
    db.prepare("UPDATE users SET role = 'admin' WHERE email = 'admin2@twistfit.vn'").run()
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('admin2@twistfit.vn', 'admin') } })
    const response = await GET(request, params(post.id))
    expect(response.status).toBe(200)
  })

  it('returns 404 for a non-existent post', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/forum/posts/[id]', () => {
  it('rejects requests without a session', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validInput) })
    const response = await PUT(request, params(post.id))
    expect(response.status).toBe(401)
  })

  it('rejects a user who is not the owner', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: cookieFor('other@twistfit.vn', 'user') },
      body: JSON.stringify(validInput),
    })
    const response = await PUT(request, params(post.id))
    expect(response.status).toBe(403)
  })

  it('updates the post and resets its status to "pending"', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    db.prepare("UPDATE forum_posts SET status = 'published' WHERE id = ?").run(post.id)

    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
      body: JSON.stringify({ ...validInput, title: 'Đã sửa' }),
    })
    const response = await PUT(request, params(post.id))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.title).toBe('Đã sửa')
    expect(body.status).toBe('pending')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
      body: JSON.stringify({ ...validInput, title: '' }),
    })
    const response = await PUT(request, params(post.id))
    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/forum/posts/[id]', () => {
  it('rejects requests without a session', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(post.id))
    expect(response.status).toBe(401)
  })

  it('lets the owner delete their own post', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: cookieFor('author@twistfit.vn', 'user') },
    })
    const response = await DELETE(request, params(post.id))
    expect(response.status).toBe(204)
  })

  it('lets an admin delete a post they do not own', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Admin', email: 'admin2@twistfit.vn', password: 'password123' })
    db.prepare("UPDATE users SET role = 'admin' WHERE email = 'admin2@twistfit.vn'").run()
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: cookieFor('admin2@twistfit.vn', 'admin') },
    })
    const response = await DELETE(request, params(post.id))
    expect(response.status).toBe(204)
  })

  it('rejects a user who is neither the owner nor an admin', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, validInput)

    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: cookieFor('other@twistfit.vn', 'user') },
    })
    const response = await DELETE(request, params(post.id))
    expect(response.status).toBe(403)
  })
})
