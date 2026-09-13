import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { createCapsuleSet, type CapsuleSetInput } from '@/lib/capsuleWardrobe'
import { GET, PUT, DELETE } from './route'
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

const validBody: CapsuleSetInput = {
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

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/capsule-wardrobe/[id]', () => {
  it('returns the set when it exists', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).title).toBe('Tiêu đề test')
  })

  it('returns 404 when the set does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/capsule-wardrobe/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the set', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, title: 'Tiêu đề đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).title).toBe('Tiêu đề đã sửa')
  })

  it('returns 404 when updating a set that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/capsule-wardrobe/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the set', async () => {
    const created = createCapsuleSet(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM capsule_sets WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
