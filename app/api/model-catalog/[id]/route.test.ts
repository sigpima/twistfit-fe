import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { createModel } from '@/lib/modelCatalog'
import { GET, PUT, DELETE } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/modelCatalog')>('@/lib/modelCatalog')
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
  name: 'Model Test',
  image: '/outfit/models/test.jpg',
  dossierImage: '/outfit/models/test-dossier.jpg',
  poseCount: 15,
  tagline: 'Tagline test',
  undertone: 'warm',
  height: '1m70',
  bodyShape: 'Đồng hồ cát',
  waist: '66cm',
  personalColor: 'Warm Autumn',
}

beforeEach(() => {
  getDb().exec('DELETE FROM catalog_models')
})

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/model-catalog/[id]', () => {
  it('returns the model when it exists', async () => {
    const created = createModel(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Model Test')
  })

  it('returns 404 when the model does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/model-catalog/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createModel(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the model', async () => {
    const created = createModel(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, name: 'Tên đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Tên đã sửa')
  })

  it('returns 404 when updating a model that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/model-catalog/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createModel(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the model', async () => {
    const created = createModel(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM catalog_models WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
