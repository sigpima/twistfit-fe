import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/faq')>('@/lib/faq')
  const Database = (await import('better-sqlite3')).default
  const testDb = new Database(':memory:')
  initSchema(testDb)
  return { getDb: () => testDb }
})

function adminCookieHeader() {
  const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
}

const validBody = {
  categories: ['personal-color'],
  question: 'Câu hỏi test?',
  answerMarkdown: 'Nội dung trả lời.',
  highlightIcon: null,
  highlightText: null,
}

beforeEach(() => {
  getDb().exec('DELETE FROM faq_items')
})

describe('GET /api/faq', () => {
  it('returns an empty list when there are no items', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/faq', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/faq', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates an item and returns 201', async () => {
    const request = new Request('http://localhost/api/faq', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const created = await response.json()
    expect(created.question).toBe('Câu hỏi test?')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/faq', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, question: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.errors.question).toBeDefined()
  })
})
