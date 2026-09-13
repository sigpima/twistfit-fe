import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AdminGate from './AdminGate'
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

function renderAdminGate() {
  return renderWithIntl(
    <AuthProvider>
      <AdminGate>
        <p>Admin-only content</p>
      </AdminGate>
    </AuthProvider>
  )
}

describe('AdminGate', () => {
  beforeEach(() => {
    pushMock.mockClear()
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('redirects to /login when signed out', () => {
    setStoredUser(null)
    renderAdminGate()
    expect(pushMock).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('Admin-only content')).not.toBeInTheDocument()
  })

  it('redirects a regular user to the homepage', () => {
    setStoredUser({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    renderAdminGate()
    expect(pushMock).toHaveBeenCalledWith('/')
    expect(screen.queryByText('Admin-only content')).not.toBeInTheDocument()
  })

  it('renders children for an admin', () => {
    setStoredUser({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    renderAdminGate()
    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.getByText('Admin-only content')).toBeInTheDocument()
  })
})
