import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorInsights from './ColorInsights'

describe('ColorInsights', () => {
  it('renders 12 ideal-palette color dots matching the given sub-season', () => {
    renderWithIntl(<ColorInsights subSeason="true-winter" />)
    expect(screen.getByText('#404040')).toBeInTheDocument()
    expect(screen.getByText('#fde55f')).toBeInTheDocument()
    expect(screen.getAllByText(/^#[0-9a-f]{6}$/)).toHaveLength(12)
  })

  it('renders different palette colors for a different sub-season', () => {
    renderWithIntl(<ColorInsights subSeason="light-spring" />)
    expect(screen.getByText('#f5e077')).toBeInTheDocument()
  })
})
