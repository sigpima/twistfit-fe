import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import RegisterForm from './RegisterForm'
import { AuthProvider } from '@/components/auth/AuthProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function renderRegisterForm() {
  return renderWithIntl(
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  )
}

function fillValidForm(overrides: { password?: string; confirmPassword?: string } = {}) {
  fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Linh Đan' } })
  fireEvent.change(screen.getByLabelText('Địa chỉ Email *'), { target: { value: 'linhdan@gmail.com' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu *'), {
    target: { value: overrides.password ?? 'password123' },
  })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu *'), {
    target: { value: overrides.confirmPassword ?? 'password123' },
  })
}

describe('RegisterForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders all fields, the submit button, and a link back to login', () => {
    renderRegisterForm()
    expect(screen.getByLabelText('Họ và tên *')).toBeInTheDocument()
    expect(screen.getByLabelText('Địa chỉ Email *')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu *')).toBeInTheDocument()
    expect(screen.getByLabelText('Xác nhận mật khẩu *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ĐĂNG KÝ' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng nhập ngay' })).toHaveAttribute('href', '/login')
  })

  it('toggles password visibility', () => {
    renderRegisterForm()
    const passwordInput = screen.getByLabelText('Mật khẩu *')
    expect(passwordInput).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getAllByLabelText('Hiện mật khẩu')[0])
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('shows a mismatch error and never calls the API when passwords differ', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderRegisterForm()
    fillValidForm({ confirmPassword: 'somethingElse123' })
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    expect(screen.getByText('Mật khẩu xác nhận không khớp')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('registers, logs in, and redirects to the homepage on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/auth/register') {
          return {
            ok: true,
            status: 201,
            json: async () => ({ id: 1, name: 'Linh Đan', email: 'linhdan@gmail.com', role: 'user' }),
          }
        }
        return { ok: true, json: async () => ({ name: 'Linh Đan', email: 'linhdan@gmail.com', role: 'user' }) }
      })
    )
    renderRegisterForm()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'))
  })

  it('shows an email-taken error and does not redirect when the API returns 409', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'EMAIL_TAKEN' }) })
    )
    renderRegisterForm()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    await waitFor(() => expect(screen.getByText('Email này đã được đăng ký')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
