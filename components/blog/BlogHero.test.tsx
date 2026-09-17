import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogHero from './BlogHero'

describe('BlogHero', () => {
  it('renders the heading and article count badge', () => {
    renderWithIntl(<BlogHero />)
    expect(screen.getByRole('heading', { level: 1, name: 'Tạp Chí Phong Cách TwistFit' })).toBeInTheDocument()
    expect(screen.getByText('120+ Bài Viết')).toBeInTheDocument()
  })

  it('does not render a breadcrumb trail', () => {
    renderWithIntl(<BlogHero />)
    expect(screen.queryByRole('link', { name: 'Trang chủ' })).not.toBeInTheDocument()
  })
})
