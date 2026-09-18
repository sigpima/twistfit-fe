import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import MakeupRecommendations from './MakeupRecommendations'

describe('MakeupRecommendations', () => {
  it('shows blush, lipstick, and tone-layout as separate disclosures', () => {
    renderWithIntl(<MakeupRecommendations subSeason="true-winter" />)
    expect(screen.getByRole('button', { name: 'Phấn má' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Son môi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tone' })).toBeInTheDocument()
  })

  it('reveals the blush image for the given sub-season when opened', () => {
    renderWithIntl(<MakeupRecommendations subSeason="true-winter" />)
    fireEvent.click(screen.getByRole('button', { name: 'Phấn má' }))
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      '/personal-color/recommendations/blush/true-winter.png'
    )
  })

  it('shows the cool tone group and its variants for a cool sub-season', () => {
    renderWithIntl(<MakeupRecommendations subSeason="true-winter" />)
    fireEvent.click(screen.getByRole('button', { name: 'Tone' }))
    expect(screen.getByText('Da tone Lạnh')).toBeInTheDocument()
    expect(screen.getByText('Tone hồng lạnh')).toBeInTheDocument()
    expect(screen.getByText(/Feyede Maya/)).toBeInTheDocument()
    expect(screen.queryByText('Tone cam đào')).not.toBeInTheDocument()
  })

  it('shows the neutral tone group for a neutral sub-season', () => {
    renderWithIntl(<MakeupRecommendations subSeason="light-spring" />)
    fireEvent.click(screen.getByRole('button', { name: 'Tone' }))
    expect(screen.getByText('Da tone Trung tính')).toBeInTheDocument()
    expect(screen.getByText('Tone hồng trung tính')).toBeInTheDocument()
  })
})
