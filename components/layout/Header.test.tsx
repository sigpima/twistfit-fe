import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Header from './Header'
import { AuthProvider } from '@/components/auth/AuthProvider'

function renderHeader() {
  return renderWithIntl(
    <AuthProvider>
      <Header />
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
    expect(screen.getByRole('link', { name: 'About us' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/how-it-works')
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
  })

  it('shows login and register links to /login and /register when signed out', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute('href', '/register')
  })

  it('renders social media links', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Facebook' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'TikTok' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Threads' })).toBeInTheDocument()
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
