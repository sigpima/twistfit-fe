import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Footer from './Footer'

describe('Footer', () => {
  it('links footer nav items to the expected routes', () => {
    renderWithIntl(<Footer />)
    expect(screen.getByRole('link', { name: 'Về chúng tôi' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Cơ chế vận hành' })).toHaveAttribute('href', '/how-it-works')
    expect(screen.getByRole('link', { name: 'Câu hỏi thường gặp' })).toHaveAttribute('href', '/faq')
    expect(screen.getByRole('link', { name: 'Cảm hứng' })).toHaveAttribute('href', '/blog')
  })

  it('renders the copyright line', () => {
    renderWithIntl(<Footer />)
    expect(screen.getByText(/2026 TwistFit Vietnam/)).toBeInTheDocument()
  })
})
