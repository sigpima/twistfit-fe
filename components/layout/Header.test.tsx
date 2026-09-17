import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Header from './Header'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginRequiredModalProvider } from '@/components/auth/LoginRequiredModalProvider'

function renderHeader() {
  return renderWithIntl(
    <AuthProvider>
      <LoginRequiredModalProvider>
        <Header />
      </LoginRequiredModalProvider>
    </AuthProvider>
  )
}

describe('Header', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders nav links to the expected routes', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Về chúng tôi' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Cộng đồng TwistFit' })).toHaveAttribute('href', '/forum')
    expect(screen.getByRole('link', { name: 'Cảm hứng' })).toHaveAttribute('href', '/blog')
  })

  it('renders the features dropdown with links to the expected routes', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: 'Tính năng' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Test Personal Color' })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
    expect(screen.getByRole('link', { name: 'Phối đồ' })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('shows login and register links to /login and /register when signed out', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute('href', '/register')
  })

  it('renders social media links', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Facebook' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Threads' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'TikTok' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Email' })).toBeInTheDocument()
  })

  it('shows the account icon instead of login/register when signed in', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    renderHeader()

    expect(screen.queryByRole('link', { name: 'Đăng nhập' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Đăng ký' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đăng xuất/ })).toBeInTheDocument()
  })

  it('shows the account dropdown links when signed in', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    renderHeader()

    expect(screen.getByRole('link', { name: 'Bộ sưu tập đã lưu' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kết quả đánh giá Personal Color' })).toHaveAttribute(
      'href',
      '/personal-color/result'
    )
    expect(screen.getByRole('link', { name: 'Thông tin cá nhân' })).toBeInTheDocument()
  })

  it('logs out when the account icon is clicked', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: /Đăng xuất/ }))

    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(window.localStorage.getItem('twistfit.auth')).toBeNull()
  })
})

describe('Header — outfit link auth guard', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('opens the login-required modal instead of navigating when signed out', () => {
    renderHeader()
    fireEvent.click(screen.getByText('Phối đồ'))
    expect(screen.getByText('Bạn cần đăng nhập')).toBeInTheDocument()
  })

  it('does not open the modal when signed in', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Test', email: 'user@twistfit.vn', role: 'user' })
    )
    renderHeader()
    fireEvent.click(screen.getByText('Phối đồ'))
    expect(screen.queryByText('Bạn cần đăng nhập')).not.toBeInTheDocument()
  })
})
