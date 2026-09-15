import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

function stubLoginFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse((init?.body as string) ?? '{}') as { identifier: string; password: string }
      if (body.identifier === 'user@twistfit.vn' && body.password === 'user1234') {
        return {
          ok: true,
          json: async () => ({ name: 'Người dùng Test', email: 'user@twistfit.vn', phone: null, role: 'user' }),
        }
      }
      if (body.identifier === 'admin@twistfit.vn' && body.password === 'admin1234') {
        return {
          ok: true,
          json: async () => ({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', phone: null, role: 'admin' }),
        }
      }
      if (body.identifier === '0912345678' && body.password === 'user1234') {
        return {
          ok: true,
          json: async () => ({ name: 'Người dùng SĐT', email: null, phone: '+84912345678', role: 'user' }),
        }
      }
      return { ok: false, status: 401, json: async () => ({ error: 'Email hoặc mật khẩu không đúng' }) }
    })
  )
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    window.localStorage.clear()
    stubLoginFetch()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('starts logged out', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
  })

  it('logs in with valid credentials and persists to localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const account = await result.current.login('user@twistfit.vn', 'user1234')
      expect(account?.role).toBe('user')
    })

    expect(result.current.user).toEqual({
      name: 'Người dùng Test',
      email: 'user@twistfit.vn',
      phone: null,
      role: 'user',
    })
    expect(window.localStorage.getItem('twistfit.auth')).toContain('user@twistfit.vn')
  })

  it('logs in with a phone number identifier', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const account = await result.current.login('0912345678', 'user1234')
      expect(account?.phone).toBe('+84912345678')
    })

    expect(result.current.user).toEqual({
      name: 'Người dùng SĐT',
      email: null,
      phone: '+84912345678',
      role: 'user',
    })
  })

  it('rejects invalid credentials', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const account = await result.current.login('user@twistfit.vn', 'wrongpass')
      expect(account).toBeNull()
    })

    expect(result.current.user).toBeNull()
  })

  it('logs out and clears localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('admin@twistfit.vn', 'admin1234')
    })
    expect(result.current.user?.role).toBe('admin')

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(window.localStorage.getItem('twistfit.auth')).toBeNull()
  })
})
