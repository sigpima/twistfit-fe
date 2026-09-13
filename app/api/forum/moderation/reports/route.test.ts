import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET } from './route'
import { createUser } from '@/lib/auth/users'
import { createForumPost, createForumReport, resolveForumReport } from '@/lib/forum'
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

describe('GET /api/forum/moderation/reports', () => {
  it('rejects requests without an admin session', async () => {
    const response = await GET(new Request('http://localhost'))
    expect(response.status).toBe(401)
  })

  it('returns only open reports', async () => {
    const db = getDb()
    const author = createUser(db, { name: 'Tác giả', email: 'author@twistfit.vn', password: 'password123' })
    const reporter = createUser(db, { name: 'Reporter', email: 'reporter@twistfit.vn', password: 'password123' })
    const post = createForumPost(db, author.id, { title: 'Bài bị báo cáo', body: 'B', category: 'general' })
    const openReport = createForumReport(db, post.id, reporter.id, 'Lý do mở')
    const resolvedReport = createForumReport(db, post.id, reporter.id, 'Lý do đã xử lý')
    resolveForumReport(db, resolvedReport.id)

    const request = new Request('http://localhost', { headers: { cookie: cookieFor('admin@twistfit.vn', 'admin') } })
    const response = await GET(request)
    expect(response.status).toBe(200)
    const reports = await response.json()
    expect(reports).toHaveLength(1)
    expect(reports[0].id).toBe(openReport.id)
    expect(reports[0].postTitle).toBe('Bài bị báo cáo')
  })
})
