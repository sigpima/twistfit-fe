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
    expect(screen.getByRole('link', { name: 'Liên hệ' })).toHaveAttribute('href', '/contact')
  })

  it('renders the features dropdown with links to the expected routes', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: 'Tính năng' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đánh giá màu sắc cá nhân' })).toHaveAttribute(
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

    expect(screen.getByRole('link', { name: 'Bộ sưu tập đã lưu' })).toHaveAttribute('href', '/collection')
    expect(screen.getByRole('link', { name: 'Kết quả đánh giá màu sắc cá nhân' })).toHaveAttribute(
      'href',
      '/personal-color/result'
    )
    expect(screen.getByRole('link', { name: 'Thông tin cá nhân' })).toHaveAttribute('href', '/profile')
  })

  it('does not show the admin badge or admin dashboard link for a regular user', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    renderHeader()

    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Trang quản lý' })).not.toBeInTheDocument()
  })

  it('shows the admin badge and an admin dashboard link when signed in as admin', () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    renderHeader()

    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Trang quản lý/ })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('button', { name: /Tài khoản.*Quản trị viên Test/ })).toBeInTheDocument()
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

describe('Header — mobile menu', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('does not render the mobile menu links until opened', () => {
    renderHeader()
    expect(screen.queryByRole('link', { name: 'Cảm hứng' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Cảm hứng' })).toHaveLength(1)
  })

  it('opens the mobile menu when the hamburger button is clicked', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    expect(screen.getAllByRole('link', { name: 'Cảm hứng' })).toHaveLength(2)
  })

  it('closes the mobile menu when the close button is clicked', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' }))
    expect(screen.getAllByRole('link', { name: 'Cảm hứng' })).toHaveLength(1)
  })

  it('closes the mobile menu when a link inside it is clicked', () => {
    renderHeader()
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    const links = screen.getAllByRole('link', { name: 'Cảm hứng' })
    fireEvent.click(links[links.length - 1])
    expect(screen.getAllByRole('link', { name: 'Cảm hứng' })).toHaveLength(1)
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
