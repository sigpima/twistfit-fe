import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import ProfilePage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ProfilePage', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders both cards for a signed-in regular user, without the admin badge', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', phone: null, role: 'user' })
    )
    renderWithIntl(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    )

    expect(screen.getByRole('heading', { name: 'Thông tin cá nhân', level: 1 })).toBeInTheDocument()
    expect(screen.getByLabelText('Họ và tên')).toHaveValue('Người dùng Test')
    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('shows the Admin badge for a signed-in admin user', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', phone: null, role: 'admin' })
    )
    renderWithIntl(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    )

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})
