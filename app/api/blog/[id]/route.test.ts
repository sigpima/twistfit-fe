import { describe, expect, it, beforeEach, vi } from 'vitest'
import { createBlogPost, type BlogPostInput } from '@/lib/db'
import { getDb } from '@/lib/getDb'
import { GET, PUT, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/db')>('@/lib/db')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  return { getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody: BlogPostInput = {
  slug: 'bai-viet-test',
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

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/blog/[id]', () => {
  it('returns the post when it exists', async () => {
    const created = createBlogPost(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).title).toBe('Bài viết test')
  })

  it('returns 404 when the post does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/blog/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createBlogPost(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the post', async () => {
    const created = createBlogPost(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, title: 'Tiêu đề đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).title).toBe('Tiêu đề đã sửa')
  })

  it('returns 404 when updating a post that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/blog/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createBlogPost(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the post', async () => {
    const created = createBlogPost(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM blog_posts WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
