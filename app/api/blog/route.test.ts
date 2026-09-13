import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/db'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/db', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  actual.initSchema(testDb)
  return { ...actual, getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody = {
  title: 'Bài viết test',
  excerpt: 'Mô tả ngắn',
  content: 'Nội dung đầy đủ',
  coverImageUrl: '/blog/test.jpg',
  category: 'styling',
  authorName: null,
  isFeatured: false,
  publishedAt: '2026-01-01',
}

beforeEach(() => {
  getDb().exec('DELETE FROM blog_posts')
})

describe('GET /api/blog', () => {
  it('returns an empty list when there are no posts', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/blog', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/blog', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a post and returns 201', async () => {
    const request = new Request('http://localhost/api/blog', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const created = await response.json()
    expect(created.slug).toBe('bai-viet-test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/blog', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, title: '', category: 'not-a-category' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.errors.title).toBeDefined()
    expect(body.errors.category).toBeDefined()
  })
})
