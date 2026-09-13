import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './apiClient'

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.twistfit.vn')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('calls the API base URL with credentials included', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    await apiFetch('/faq')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.twistfit.vn/faq',
      expect.objectContaining({ credentials: 'include' })
    )
  })

  it('retries once via refresh when a request gets a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const response = await apiFetch('/auth/me')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.twistfit.vn/auth/refresh')
    expect(response.ok).toBe(true)
  })

  it('does not retry when the refresh itself fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 401 })
    vi.stubGlobal('fetch', fetchMock)

    const response = await apiFetch('/auth/me')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(response.status).toBe(401)
  })

  it('does not attempt a refresh retry for /auth/login itself', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await apiFetch('/auth/login', { method: 'POST' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not loop when the failing request is /auth/refresh itself', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await apiFetch('/auth/refresh', { method: 'POST' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
