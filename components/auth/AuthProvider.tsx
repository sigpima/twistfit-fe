'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { Role } from '@/lib/auth/users'

const STORAGE_KEY = 'twistfit.auth'

export type AuthUser = {
  name: string
  email: string | null
  phone: string | null
  role: Role
}

type AuthContextValue = {
  user: AuthUser | null
  // False only until the initial localStorage read completes. A protected
  // page must wait for this before redirecting on `user === null`, or it
  // will bounce an already-logged-in visitor during that first render.
  isHydrated: boolean
  login: (identifier: string, password: string) => Promise<AuthUser | null>
  logout: () => void
  updateUser: (account: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // One-time hydration from localStorage after mount, not a React->React
    // sync: reading window here during render would break SSR/hydration, so
    // this must stay in an effect despite the lint rule's general advice.
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(stored) as AuthUser)
    }
    setIsHydrated(true)
  }, [])

  async function login(identifier: string, password: string): Promise<AuthUser | null> {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })
    if (!response.ok) return null
    const account = (await response.json()) as AuthUser
    setUser(account)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
    return account
  }

  function logout() {
    setUser(null)
    window.localStorage.removeItem(STORAGE_KEY)
    void apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
  }

  function updateUser(account: AuthUser) {
    setUser(account)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
  }

  return (
    <AuthContext.Provider value={{ user, isHydrated, login, logout, updateUser }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
