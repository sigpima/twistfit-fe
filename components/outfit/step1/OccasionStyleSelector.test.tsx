import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import OccasionStyleSelector from './OccasionStyleSelector'

function renderSelector(overrides: Partial<Parameters<typeof OccasionStyleSelector>[0]> = {}) {
  const props = {
    mode: 'occasion' as const,
    onModeChange: vi.fn(),
    selectedOccasion: 'hang-ngay' as const,
    onOccasionChange: vi.fn(),
    selectedStyle: 'casual' as const,
    onStyleChange: vi.fn(),
    ...overrides,
  }
  renderWithIntl(<OccasionStyleSelector {...props} />)
  return props
}

describe('OccasionStyleSelector', () => {
  it('shows occasion chips when mode is occasion', () => {
    renderSelector()
    expect(screen.getByRole('button', { name: 'Hằng ngày' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đi làm' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Casual' })).not.toBeInTheDocument()
  })

  it('shows style chips when mode is style', () => {
    renderSelector({ mode: 'style' })
    expect(screen.getByRole('button', { name: 'Casual' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Formal' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hằng ngày' })).not.toBeInTheDocument()
  })

  it('calls onModeChange when switching to the style tab', () => {
    const props = renderSelector()
    fireEvent.click(screen.getByRole('button', { name: 'Theo phong cách' }))
    expect(props.onModeChange).toHaveBeenCalledWith('style')
  })

  it('marks the selected occasion chip as pressed', () => {
    renderSelector({ selectedOccasion: 'du-tiec' })
    expect(screen.getByRole('button', { name: 'Dự tiệc' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Hằng ngày' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onOccasionChange when a chip is clicked', () => {
    const props = renderSelector()
    fireEvent.click(screen.getByRole('button', { name: 'Đi biển' }))
    expect(props.onOccasionChange).toHaveBeenCalledWith('di-bien')
  })

  it('calls onStyleChange when a style chip is clicked', () => {
    const props = renderSelector({ mode: 'style' })
    fireEvent.click(screen.getByRole('button', { name: 'Street' }))
    expect(props.onStyleChange).toHaveBeenCalledWith('street')
  })
})
