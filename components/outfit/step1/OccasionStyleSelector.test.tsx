import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import OccasionStyleSelector from './OccasionStyleSelector'
import type { TaxonomyValue } from '@/lib/taxonomy'

const OCCASION_VALUES: TaxonomyValue[] = [
  { id: 1, key: 'hang-ngay', label: 'Hằng ngày', sortOrder: 0 },
  { id: 2, key: 'di-lam', label: 'Đi làm', sortOrder: 1 },
]

const STYLE_VALUES: TaxonomyValue[] = [
  { id: 1, key: 'casual', label: 'Casual', sortOrder: 0 },
  { id: 2, key: 'formal', label: 'Formal', sortOrder: 1 },
]

function renderSelector(overrides: Partial<Parameters<typeof OccasionStyleSelector>[0]> = {}) {
  const props = {
    mode: 'occasion' as const,
    onModeChange: vi.fn(),
    occasionValues: OCCASION_VALUES,
    selectedOccasion: 'hang-ngay',
    onOccasionChange: vi.fn(),
    styleValues: STYLE_VALUES,
    selectedStyle: 'casual',
    onStyleChange: vi.fn(),
    ...overrides,
  }
  renderWithIntl(<OccasionStyleSelector {...props} />)
  return props
}

describe('OccasionStyleSelector', () => {
  it('shows occasion chips (from taxonomy values) when mode is occasion', () => {
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
    renderSelector({ selectedOccasion: 'di-lam' })
    expect(screen.getByRole('button', { name: 'Đi làm' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Hằng ngày' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onOccasionChange with the value key when a chip is clicked', () => {
    const props = renderSelector()
    fireEvent.click(screen.getByRole('button', { name: 'Đi làm' }))
    expect(props.onOccasionChange).toHaveBeenCalledWith('di-lam')
  })

  it('calls onStyleChange with the value key when a style chip is clicked', () => {
    const props = renderSelector({ mode: 'style' })
    fireEvent.click(screen.getByRole('button', { name: 'Formal' }))
    expect(props.onStyleChange).toHaveBeenCalledWith('formal')
  })

  it('renders no occasion chips when the taxonomy group is empty, without crashing', () => {
    renderSelector({ occasionValues: [] })
    // Only the two mode-toggle buttons should remain — no chip buttons.
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})
