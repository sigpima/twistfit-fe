import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorHarmonyCard from './ColorHarmonyCard'

describe('ColorHarmonyCard', () => {
  it('renders the match score and recommended palette', () => {
    renderWithIntl(<ColorHarmonyCard />)
    expect(screen.getByText('Match 98%')).toBeInTheDocument()
    expect(screen.getByText('Light Summer & Cool Winter')).toBeInTheDocument()
  })

  it('lets the user change the garment classification and fit', () => {
    renderWithIntl(<ColorHarmonyCard />)
    const typeSelect = screen.getByLabelText('Phân loại áo/quần') as HTMLSelectElement
    const fitSelect = screen.getByLabelText('Độ ôm phom (Fit)') as HTMLSelectElement
    expect(typeSelect.value).toBe('top')
    expect(fitSelect.value).toBe('regular')

    fireEvent.change(typeSelect, { target: { value: 'dress' } })
    expect(typeSelect.value).toBe('dress')
  })
})
