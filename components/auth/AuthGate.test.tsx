import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AuthGate from './AuthGate'
import { AuthProvider } from '@/components/auth/AuthProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function setStoredUser(user: { name: string; email: string; role: 'user' | 'admin' } | null) {
  if (user) {
    window.localStorage.setItem('twistfit.auth', JSON.stringify(user))
  } else {
    window.localStorage.removeItem('twistfit.auth')
  }
}

function renderAuthGate() {
  return renderWithIntl(
    <AuthProvider>
      <AuthGate>
        <p>Nội dung cần đăng nhập</p>
      </AuthGate>
    </AuthProvider>
  )
}

describe('AuthGate', () => {
  beforeEach(() => {
    pushMock.mockClear()
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('redirects to /login when signed out', () => {
    setStoredUser(null)
    renderAuthGate()
    expect(pushMock).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('Nội dung cần đăng nhập')).not.toBeInTheDocument()
  })

  it('renders children for a regular signed-in user', () => {
    setStoredUser({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    renderAuthGate()
    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByText('Nội dung cần đăng nhập')).toBeInTheDocument()
  })

  it('renders children for an admin too', () => {
    setStoredUser({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    renderAuthGate()
    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByText('Nội dung cần đăng nhập')).toBeInTheDocument()
  })
})
