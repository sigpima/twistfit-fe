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
  questionText: 'Câu hỏi test?',
  sortOrder: 0,
  options: [
    { label: 'Lựa chọn A', season: 'spring' },
    { label: 'Lựa chọn B', season: 'summer' },
  ],
}

beforeEach(() => {
  getDb().exec('DELETE FROM quiz_questions')
})

describe('GET /api/quiz-questions', () => {
  it('returns an empty list when there are no questions', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/quiz-questions', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/quiz-questions', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a question and returns 201', async () => {
    const request = new Request('http://localhost/api/quiz-questions', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    const created = await response.json()
    expect(created.options).toHaveLength(2)
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/quiz-questions', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, questionText: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.questionText).toBeDefined()
  })
})
