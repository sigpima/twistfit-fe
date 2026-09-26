import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ChangePasswordCard from './ChangePasswordCard'

afterEach(() => {
  vi.unstubAllGlobals()
})

function fillAndSubmit(current: string, next: string, confirm: string) {
  fireEvent.change(screen.getByLabelText('Mật khẩu hiện tại'), { target: { value: current } })
  fireEvent.change(screen.getByLabelText('Mật khẩu mới'), { target: { value: next } })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu mới'), { target: { value: confirm } })
  fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }))
}

describe('ChangePasswordCard', () => {
  it('shows a mismatch error without calling the API when confirmation does not match', async () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<ChangePasswordCard />)

    fillAndSubmit('oldpassword', 'newpassword1', 'newpassword2')

    await waitFor(() => expect(screen.getByText('Mật khẩu xác nhận không khớp.')).toBeInTheDocument())
    expect(fetch).not.toHaveBeenCalled()
  })

  it('submits the password change and clears the form on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }))
    renderWithIntl(<ChangePasswordCard />)

    fillAndSubmit('oldpassword', 'newpassword1', 'newpassword1')

    await waitFor(() => expect(screen.getByText('Đã đổi mật khẩu thành công.')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/me/change-password',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ currentPassword: 'oldpassword', newPassword: 'newpassword1' }),
      })
    )
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveValue('')
    expect(screen.getByLabelText('Mật khẩu mới')).toHaveValue('')
  })

  it('shows an incorrect-current-password error on a 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }))
    renderWithIntl(<ChangePasswordCard />)

    fillAndSubmit('wrongpassword', 'newpassword1', 'newpassword1')

    await waitFor(() => expect(screen.getByText('Mật khẩu hiện tại không đúng.')).toBeInTheDocument())
  })

  it('toggles password visibility', () => {
    renderWithIntl(<ChangePasswordCard />)
    const input = screen.getByLabelText('Mật khẩu hiện tại') as HTMLInputElement
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getAllByRole('button', { name: 'Hiện mật khẩu' })[0])
    expect(input).toHaveAttribute('type', 'text')
  })
})
