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

function fillValidForm(overrides: { password?: string; confirmPassword?: string; identifier?: string } = {}) {
  fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Linh Đan' } })
  fireEvent.change(screen.getByLabelText('Email hoặc Số điện thoại *'), {
    target: { value: overrides.identifier ?? 'linhdan@gmail.com' },
  })
  fireEvent.change(screen.getByLabelText('Mật khẩu *'), {
    target: { value: overrides.password ?? 'password123' },
  })
  fireEvent.change(screen.getByLabelText('Xác nhận mật khẩu *'), {
    target: { value: overrides.confirmPassword ?? 'password123' },
  })
  fireEvent.click(screen.getByRole('checkbox', { name: /Tôi xác nhận đã đủ điều kiện pháp lý/ }))
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
    expect(screen.getByLabelText('Email hoặc Số điện thoại *')).toBeInTheDocument()
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

  it('requires the Camera AR policy checkbox to be checked', () => {
    renderRegisterForm()
    const checkbox = screen.getByRole('checkbox', { name: /Tôi xác nhận đã đủ điều kiện pháp lý/ }) as HTMLInputElement
    expect(checkbox).toBeRequired()
    expect(checkbox.checked).toBe(false)
  })

  it('expands the policy content when the policy row is clicked, without checking the box', () => {
    renderRegisterForm()
    const checkbox = screen.getByRole('checkbox', { name: /Tôi xác nhận đã đủ điều kiện pháp lý/ }) as HTMLInputElement
    const toggle = screen.getByRole('button', { name: 'Chính sách bảo mật và Điều khoản sử dụng' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('1. Dữ liệu cá nhân thu thập')).not.toBeInTheDocument()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(checkbox.checked).toBe(false)
  })

  it('renders the full structured policy content once expanded', () => {
    renderRegisterForm()
    fireEvent.click(screen.getByRole('button', { name: 'Chính sách bảo mật và Điều khoản sử dụng' }))

    expect(screen.getByText('1. Dữ liệu cá nhân thu thập')).toBeInTheDocument()
    expect(screen.getByText('5. Chia sẻ và bảo mật thông tin')).toBeInTheDocument()
    expect(screen.getByText(/Dữ liệu định danh cá nhân cơ bản/)).toBeInTheDocument()
  })

  it('collapses the policy content when the policy row is clicked again', () => {
    renderRegisterForm()
    const toggle = screen.getByRole('button', { name: 'Chính sách bảo mật và Điều khoản sử dụng' })
    fireEvent.click(toggle)
    expect(screen.getByText('1. Dữ liệu cá nhân thu thập')).toBeInTheDocument()

    fireEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('1. Dữ liệu cá nhân thu thập')).not.toBeInTheDocument()
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
      vi
        .fn()
        .mockResolvedValue({ ok: true, json: async () => ({ name: 'Linh Đan', email: 'linhdan@gmail.com', phone: null, role: 'user' }) })
    )
    renderRegisterForm()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'))
  })

  it('registers with a phone number identifier', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ name: 'Linh Đan', email: null, phone: '+84912345678', role: 'user' }) })
    vi.stubGlobal('fetch', fetchMock)
    renderRegisterForm()
    fillValidForm({ identifier: '0912345678' })
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'))
    expect(fetchMock).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({
        body: JSON.stringify({ name: 'Linh Đan', identifier: '0912345678', password: 'password123' }),
      })
    )
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

  it('shows a phone-taken error when the API returns 409 for a phone identifier', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'PHONE_TAKEN' }) })
    )
    renderRegisterForm()
    fillValidForm({ identifier: '0912345678' })
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    await waitFor(() => expect(screen.getByText('Số điện thoại này đã được đăng ký')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
