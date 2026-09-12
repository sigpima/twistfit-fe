import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import HowItWorksHero from './HowItWorksHero'

describe('HowItWorksHero', () => {
  it('renders the headline and quick metrics', () => {
    renderWithIntl(<HowItWorksHero />)
    expect(
      screen.getByRole('heading', { level: 1, name: /Hành Trình Khám Phá Sắc Màu/ })
    ).toBeInTheDocument()
    expect(screen.getByText('1024')).toBeInTheDocument()
    expect(screen.getByText('98.4%')).toBeInTheDocument()
  })

  it('links the primary CTA to the personal color quiz', () => {
    renderWithIntl(<HowItWorksHero />)
    expect(screen.getByRole('link', { name: /Thử nghiệm ngay/ })).toHaveAttribute(
      'href',
      '/personal-color/quiz'
    )
  })
})
