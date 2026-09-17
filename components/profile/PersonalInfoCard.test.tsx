import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import PersonalInfoCard from './PersonalInfoCard'
import { AuthProvider } from '@/components/auth/AuthProvider'

function renderCard() {
  return renderWithIntl(
    <AuthProvider>
      <PersonalInfoCard user={{ name: 'Linh Đan', email: 'linh@example.com', phone: null, role: 'user' }} />
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

  it('shows the Admin badge only for an admin account', () => {
    renderWithIntl(
      <AuthProvider>
        <PersonalInfoCard user={{ name: 'Admin Test', email: 'admin@example.com', phone: null, role: 'admin' }} />
      </AuthProvider>
    )
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('does not show the Admin badge for a regular user', () => {
    renderCard()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })

  it('submits the updated name/phone and shows a success message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: 'Linh Đan Mới', email: 'linh@example.com', phone: '+84912345678', role: 'user' }),
      })
    )
    renderCard()

    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Linh Đan Mới' } })
    fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0912345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(screen.getByText('Đã cập nhật thông tin.')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/auth/me',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Linh Đan Mới', phone: '0912345678' }),
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
})
