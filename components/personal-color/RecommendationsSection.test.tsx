import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import RecommendationsSection from './RecommendationsSection'

describe('RecommendationsSection', () => {
  it('renders the heading and the two collapsed top-level disclosures', () => {
    renderWithIntl(<RecommendationsSection subSeason="true-winter" />)
    expect(screen.getByText('Gợi ý ứng dụng')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trang sức' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Makeup' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('reveals the jewelry recommendation for the sub-season when clicked', () => {
    renderWithIntl(<RecommendationsSection subSeason="true-winter" />)
    fireEvent.click(screen.getByRole('button', { name: 'Trang sức' }))
    expect(screen.getByText('Bạc nguyên chất, Bạch kim (Platinum)')).toBeInTheDocument()
  })

  it('reveals the makeup sub-sections when clicked', () => {
    renderWithIntl(<RecommendationsSection subSeason="true-winter" />)
    fireEvent.click(screen.getByRole('button', { name: 'Makeup' }))
    expect(screen.getByRole('button', { name: 'Phấn má' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Son môi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tone' })).toBeInTheDocument()
  })
})
