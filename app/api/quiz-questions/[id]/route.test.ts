import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb, createQuizQuestion, type QuizQuestionInput } from '@/lib/db'
import { GET, PUT, DELETE } from './route'
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

const validBody: QuizQuestionInput = {
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

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/quiz-questions/[id]', () => {
  it('returns the question when it exists', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).questionText).toBe('Câu hỏi test?')
  })

  it('returns 404 when the question does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/quiz-questions/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the question and replaces its options', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, questionText: 'Câu hỏi đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).questionText).toBe('Câu hỏi đã sửa')
  })

  it('returns 404 when updating a question that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/quiz-questions/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the question', async () => {
    const created = createQuizQuestion(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM quiz_questions WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
