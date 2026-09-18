import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorProfileCard from './ColorProfileCard'

const RESULT = { subSeason: 'true-winter' as const, hueResult: 'cool' as const, valueResult: 'medium' as const, chromaResult: 'neutral' as const }

describe('ColorProfileCard', () => {
  it('renders the real sub-season name and description', () => {
    renderWithIntl(<ColorProfileCard result={RESULT} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Đông Thuần (True Winter)' })).toBeInTheDocument()
    expect(screen.getByText(/Lạnh rõ rệt, sắc nét/)).toBeInTheDocument()
  })

  it('renders the portrait photo matching the given sub-season', () => {
    renderWithIntl(<ColorProfileCard result={RESULT} />)
    const portrait = screen.getByRole('img', { name: /.+/ })
    expect(portrait).toHaveAttribute('src', '/personal-color/portraits/true-winter.jpg')
  })

  it('renders a different portrait photo for a different sub-season', () => {
    renderWithIntl(<ColorProfileCard result={{ ...RESULT, subSeason: 'bright-spring' }} />)
    const portrait = screen.getByRole('img', { name: /.+/ })
    expect(portrait).toHaveAttribute('src', '/personal-color/portraits/bright-spring.png')
  })
})
