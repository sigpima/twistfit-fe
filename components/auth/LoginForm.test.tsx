import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import LoginForm from './LoginForm'
import { AuthProvider } from '@/components/auth/AuthProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function renderLoginForm() {
  return renderWithIntl(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  )
}

function submit(identifier: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email hoặc Số điện thoại *'), { target: { value: identifier } })
  fireEvent.change(screen.getByLabelText('Mật khẩu *'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG NHẬP' }))
}

function stubLoginFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse((init?.body as string) ?? '{}') as { identifier: string; password: string }
      if (body.identifier === 'user@twistfit.vn' && body.password === 'user1234') {
        return {
          ok: true,
          json: async () => ({ name: 'Người dùng Test', email: 'user@twistfit.vn', phone: null, role: 'user' }),
        }
      }
      if (body.identifier === 'admin@twistfit.vn' && body.password === 'admin1234') {
        return {
          ok: true,
          json: async () => ({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', phone: null, role: 'admin' }),
        }
      }
      return { ok: false, status: 401, json: async () => ({ error: 'Email hoặc mật khẩu không đúng' }) }
    })
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
    window.localStorage.clear()
    stubLoginFetch()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders the form and a link back to register', () => {
    renderLoginForm()
    expect(screen.getByLabelText('Email hoặc Số điện thoại *')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu *')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng ký ngay' })).toHaveAttribute('href', '/register')
  })

  it('calls the session login API and redirects a regular user to the homepage', async () => {
    renderLoginForm()
    submit('user@twistfit.vn', 'user1234')
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'))
    expect(fetch).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ identifier: 'user@twistfit.vn', password: 'user1234' }),
        credentials: 'include',
      })
    )
  })

  it('redirects an admin to /admin', async () => {
    renderLoginForm()
    submit('admin@twistfit.vn', 'admin1234')
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin'))
  })

  it('shows an error and does not redirect for invalid credentials', async () => {
    renderLoginForm()
    submit('user@twistfit.vn', 'wrongpass')
    await waitFor(() =>
      expect(screen.getByText('Email/Số điện thoại hoặc mật khẩu không đúng. Vui lòng thử lại.')).toBeInTheDocument()
    )
    expect(pushMock).not.toHaveBeenCalled()
  })
})
