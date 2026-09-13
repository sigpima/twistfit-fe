import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { GET, POST } from './route'
import { createSessionCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth/session'

vi.mock('@/lib/getDb', async () => {
  const { initSchema } = await vi.importActual<typeof import('@/lib/team')>('@/lib/team')
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
  image: '/about/team-test.jpg',
  name: 'Nguyễn Văn Test',
  role: 'Test Role',
  bio: 'Tiểu sử test.',
  badgeVariant: 'primary',
  roleVariant: 'primary',
  footerIcon: 'verified',
  footerLabel: 'Footer label test',
}

beforeEach(() => {
  getDb().exec('DELETE FROM team_members')
})

describe('GET /api/team', () => {
  it('returns an empty list when there are no members', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })
})

describe('POST /api/team', () => {
  it('rejects requests without an admin session', async () => {
    const request = new Request('http://localhost/api/team', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('creates a member and returns 201', async () => {
    const request = new Request('http://localhost/api/team', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect((await response.json()).name).toBe('Nguyễn Văn Test')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const request = new Request('http://localhost/api/team', {
      method: 'POST',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, name: '' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect((await response.json()).errors.name).toBeDefined()
  })
})
