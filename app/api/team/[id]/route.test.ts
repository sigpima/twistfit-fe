import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getDb } from '@/lib/getDb'
import { createTeamMember, type TeamMemberInput } from '@/lib/team'
import { GET, PUT, DELETE } from './route'
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

const validBody: TeamMemberInput = {
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

function params(id: number) {
  return { params: Promise.resolve({ id: String(id) }) }
}

describe('GET /api/team/[id]', () => {
  it('returns the member when it exists', async () => {
    const created = createTeamMember(getDb(), validBody)
    const response = await GET(new Request('http://localhost'), params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Nguyễn Văn Test')
  })

  it('returns 404 when the member does not exist', async () => {
    const response = await GET(new Request('http://localhost'), params(999999))
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/team/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createTeamMember(getDb(), validBody)
    const request = new Request('http://localhost', { method: 'PUT', body: JSON.stringify(validBody) })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(401)
  })

  it('updates the member', async () => {
    const created = createTeamMember(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify({ ...validBody, name: 'Tên đã sửa' }),
    })
    const response = await PUT(request, params(created.id))
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe('Tên đã sửa')
  })

  it('returns 404 when updating a member that does not exist', async () => {
    const request = new Request('http://localhost', {
      method: 'PUT',
      headers: { cookie: adminCookieHeader() },
      body: JSON.stringify(validBody),
    })
    const response = await PUT(request, params(999999))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/team/[id]', () => {
  it('rejects requests without an admin session', async () => {
    const created = createTeamMember(getDb(), validBody)
    const response = await DELETE(new Request('http://localhost', { method: 'DELETE' }), params(created.id))
    expect(response.status).toBe(401)
  })

  it('deletes the member', async () => {
    const created = createTeamMember(getDb(), validBody)
    const request = new Request('http://localhost', {
      method: 'DELETE',
      headers: { cookie: adminCookieHeader() },
    })
    const response = await DELETE(request, params(created.id))
    expect(response.status).toBe(204)
    expect(getDb().prepare('SELECT * FROM team_members WHERE id = ?').get(created.id)).toBeUndefined()
  })
})
