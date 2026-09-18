import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import PersonalInfoCard from './PersonalInfoCard'
import { AuthProvider } from '@/components/auth/AuthProvider'
import type { AuthUser } from '@/components/auth/AuthProvider'

const BASE_USER: AuthUser = {
  name: 'Linh Đan',
  username: null,
  email: 'linh@example.com',
  phone: null,
  role: 'user',
  birthDate: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  createdAt: '2026-01-01T00:00:00Z',
}

function renderCard(user: AuthUser = BASE_USER) {
  return renderWithIntl(
    <AuthProvider>
      <PersonalInfoCard user={user} />
    </AuthProvider>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

describe('PersonalInfoCard', () => {
  it('pre-fills the current name/phone and shows the locked email', () => {
    renderCard()
    expect(screen.getByLabelText('Họ và tên')).toHaveValue('Linh Đan')
    expect(screen.getByLabelText('Số điện thoại')).toHaveValue('')
    const emailField = screen.getByLabelText('Địa chỉ Email') as HTMLInputElement
    expect(emailField).toHaveValue('linh@example.com')
    expect(emailField).toBeDisabled()
  })

  it('pre-fills the new profile fields when already set', () => {
    renderCard({
      ...BASE_USER,
      username: 'linh_dan',
      birthDate: '2000-05-20',
      gender: 'female',
      heightCm: 162.5,
      weightKg: 50.5,
    })
    expect(screen.getByLabelText('Tên người dùng')).toHaveValue('linh_dan')
    expect(screen.getByLabelText('Ngày sinh')).toHaveValue('2000-05-20')
    expect(screen.getByLabelText('Giới tính')).toHaveValue('female')
    expect(screen.getByLabelText('Chiều cao (cm)')).toHaveValue(162.5)
    expect(screen.getByLabelText('Cân nặng (kg)')).toHaveValue(50.5)
  })

  it('shows the Admin badge only for an admin account', () => {
    renderCard({ ...BASE_USER, name: 'Admin Test', email: 'admin@example.com', role: 'admin' })
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('does not show the Admin badge for a regular user', () => {
    renderCard()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('submits the updated fields and shows a success message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...BASE_USER, name: 'Linh Đan Mới', phone: '+84912345678' }),
      })
    )
    renderCard()

    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Linh Đan Mới' } })
    fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0912345678' } })
    fireEvent.change(screen.getByLabelText('Chiều cao (cm)'), { target: { value: '162' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(screen.getByText('Đã cập nhật thông tin.')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/auth/me',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Linh Đan Mới',
          phone: '0912345678',
          username: null,
          birthDate: null,
          gender: null,
          heightCm: 162,
          weightKg: null,
        }),
      })
    )
  })

  it('shows a specific error when the phone is already taken', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({}) }))
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(screen.getByText('Số điện thoại này đã được dùng cho tài khoản khác.')).toBeInTheDocument()
    )
  })

  it('shows a specific error when the username is already taken', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ detail: 'USERNAME_TAKEN' }) })
    )
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(screen.getByText('Tên người dùng này đã được dùng cho tài khoản khác.')).toBeInTheDocument()
    )
  })
})
