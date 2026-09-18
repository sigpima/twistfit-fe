import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import JewelryRecommendation from './JewelryRecommendation'

describe('JewelryRecommendation', () => {
  it('renders the jewelry colors and image for the given sub-season', () => {
    renderWithIntl(<JewelryRecommendation subSeason="true-winter" />)
    expect(screen.getByText('Bạc nguyên chất, Bạch kim (Platinum)')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      '/personal-color/recommendations/jewelry/true-winter.png'
    )
  })

  it('renders different content for a different sub-season', () => {
    renderWithIntl(<JewelryRecommendation subSeason="light-spring" />)
    expect(screen.getByText('Vàng sáng nhạt (Light/Champagne Gold), Vàng hồng sáng')).toBeInTheDocument()
  })
})
