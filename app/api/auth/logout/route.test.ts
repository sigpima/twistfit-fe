import { describe, expect, it } from 'vitest'
import { POST } from './route'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'

describe('POST /api/auth/logout', () => {
  it('clears the session cookie', async () => {
    const response = await POST()
    expect(response.status).toBe(200)
    expect(response.cookies.get(SESSION_COOKIE_NAME)?.value).toBe('')
  })
})
