'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { findMockAccount, type Role } from '@/lib/auth/mockAccounts'

const STORAGE_KEY = 'twistfit.auth'

export type AuthUser = {
  name: string
  email: string
  role: Role
}

type AuthContextValue = {
  user: AuthUser | null
  // False only until the initial localStorage read completes. A protected
  // page must wait for this before redirecting on `user === null`, or it
  // will bounce an already-logged-in visitor during that first render.
  isHydrated: boolean
  login: (email: string, password: string) => AuthUser | null
  logout: () => void
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

  function login(email: string, password: string) {
    const account = findMockAccount(email, password)
    if (!account) {
      return null
    }
    const nextUser: AuthUser = { name: account.name, email: account.email, role: account.role }
    setUser(nextUser)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    return nextUser
  }

  function logout() {
    setUser(null)
    window.localStorage.removeItem(STORAGE_KEY)
    void fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  }

  return <AuthContext.Provider value={{ user, isHydrated, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
