import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/capsuleWardrobe')>('@/lib/capsuleWardrobe')
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
  image: '/outfit/capsule-set-test.jpg',
  alt: 'Ảnh test',
  tagVariant: 'primary',
  tagLabel: 'Set Test',
  fitFor: 'Phù hợp: Test',
  title: 'Tiêu đề test',
  tone: 'Test Tone',
  description: 'Mô tả test',
  items: [{ label: 'Món đồ A:', price: '100.000 ₫' }],
}

beforeEach(() => {
  getDb().exec('DELETE FROM capsule_sets')
})

describe('GET /api/capsule-wardrobe', () => {
  it('returns an empty list when there are no sets', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/capsule-wardrobe', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/capsule-wardrobe', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a set and returns 201', async () => {
    const request = new Request('http://localhost/api/capsule-wardrobe', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect((await response.json()).title).toBe('Tiêu đề test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/capsule-wardrobe', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, title: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.title).toBeDefined()
  })
})
