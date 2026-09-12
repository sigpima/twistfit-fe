import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BlogHero from './BlogHero'

describe('BlogHero', () => {
  it('renders the heading and article count badge', () => {
    render(<BlogHero />)
    expect(screen.getByRole('heading', { level: 1, name: 'Tạp Chí Phong Cách TwistFit' })).toBeInTheDocument()
    expect(screen.getByText('120+ Bài Viết')).toBeInTheDocument()
  })

  it('links the breadcrumb back to the home page', () => {
    render(<BlogHero />)
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/')
  })
})
