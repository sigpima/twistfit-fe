import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
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

describe('GET /api/model-catalog', () => {
  it('returns an empty list when there are no models', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/model-catalog', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/model-catalog', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a model and returns 201', async () => {
    const request = new Request('http://localhost/api/model-catalog', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect((await response.json()).name).toBe('Model Test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/model-catalog', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, name: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.name).toBeDefined()
  })
})
