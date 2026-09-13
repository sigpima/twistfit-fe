import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'
import type { ReactNode } from 'react'

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('starts logged out', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.user).toBeNull()
  })

  it('logs in with valid credentials and persists to localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      const account = result.current.login('user@twistfit.vn', 'user1234')
      expect(account?.role).toBe('user')
    })

    expect(result.current.user).toEqual({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    expect(window.localStorage.getItem('twistfit.auth')).toContain('user@twistfit.vn')
  })

  it('rejects invalid credentials', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      const account = result.current.login('user@twistfit.vn', 'wrongpass')
      expect(account).toBeNull()
    })

    expect(result.current.user).toBeNull()
  })

  it('logs out and clears localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.login('admin@twistfit.vn', 'admin1234')
    })
    expect(result.current.user?.role).toBe('admin')

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(window.localStorage.getItem('twistfit.auth')).toBeNull()
  })
})
