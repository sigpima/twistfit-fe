import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('links footer nav items to the expected routes', () => {
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'Về chúng tôi (About us)' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Cách hoạt động (How it works)' })).toHaveAttribute(
      'href',
      '/how-it-works'
    )
    expect(screen.getByRole('link', { name: 'Câu hỏi thường gặp (FAQ)' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: 'Tạp chí phong cách (Blog)' })).toHaveAttribute('href', '/blog')
  })

  it('renders the copyright line', () => {
    render(<Footer />)
    expect(screen.getByText(/2026 TwistFit Vietnam/)).toBeInTheDocument()
  })
})
