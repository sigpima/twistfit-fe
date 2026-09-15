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

  it('renders the real palette swatches', () => {
    renderWithIntl(<ColorProfileCard result={RESULT} />)
    const swatch = document.querySelector('[style*="background-color: rgb(0, 51, 153)"]')
    expect(swatch).not.toBeNull()
  })

  it('renders the three axis results', () => {
    renderWithIntl(<ColorProfileCard result={RESULT} />)
    expect(screen.getByText('Lạnh')).toBeInTheDocument()
    expect(screen.getByText('Trung bình')).toBeInTheDocument()
    expect(screen.getByText('Trung tính')).toBeInTheDocument()
  })
})
