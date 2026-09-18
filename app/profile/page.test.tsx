import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import ProfilePage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const BASE_USER = {
  username: null,
  phone: null,
  birthDate: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('ProfilePage', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders the header, both cards and quick links for a signed-in regular user, without the admin badge', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ ...BASE_USER, name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    renderWithIntl(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    )

    expect(screen.getByRole('heading', { name: 'Thông tin cá nhân', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Người dùng Test')).toBeInTheDocument()
    expect(screen.getByText('user@twistfit.vn')).toBeInTheDocument()
    expect(screen.getByLabelText('Họ và tên')).toHaveValue('Người dùng Test')
    expect(screen.getByRole('heading', { name: 'Đổi mật khẩu' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Truy cập nhanh' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Tủ đồ/ })).toHaveAttribute('href', '/outfit/step-1')
    expect(screen.getByRole('link', { name: /Đã lưu/ })).toHaveAttribute('href', '/collection')
    expect(screen.getByRole('link', { name: /Kết quả/ })).toHaveAttribute('href', '/personal-color/result')
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('shows the Admin badge for a signed-in admin user', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ ...BASE_USER, name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    renderWithIntl(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    )

    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})
