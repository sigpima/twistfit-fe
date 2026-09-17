import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AboutHero from './AboutHero'

describe('AboutHero', () => {
  it('renders the headline', () => {
    renderWithIntl(<AboutHero />)
    expect(
      screen.getByRole('heading', { level: 1, name: /Định Hình Phong Cách Bằng/ })
    ).toBeInTheDocument()
  })
})
