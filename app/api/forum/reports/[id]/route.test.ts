import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { PATCH } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, createForumReport } from '@/lib/forum'
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

beforeEach(() => {
  getDb().exec('DELETE FROM forum_reports')
  getDb().exec('DELETE FROM forum_posts')
  getDb().exec('DELETE FROM users')
})

describe('PATCH /api/forum/reports/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const response = await PATCH(new Request('http://localhost', { method: 'PATCH' }), params(1))
    expect(response.status).toBe(401)
  })

  it('marks a report resolved', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const reporter = createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, { title: 'Bài test', body: 'B', category: 'general' })
    const report = createForumReport(db, post.id, reporter.id, 'Lý do')

    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') },
    })
    const response = await PATCH(request, params(report.id))
    expect(response.status).toBe(200)
    expect((await response.json()).status).toBe('resolved')
  })

  it('returns 404 for a report that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PATCH',
      headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') },
    })
    const response = await PATCH(request, params(999999))
    expect(response.status).toBe(404)
  })
})
