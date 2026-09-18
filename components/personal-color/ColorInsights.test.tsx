import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorInsights from './ColorInsights'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('react-qr-code', () => ({
  default: ({ value }: { value: string }) => <div data-testid="qr-code" data-value={value} />,
}))

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

  it('renders the camera AR button', () => {
    renderWithIntl(<ColorInsights subSeason="true-winter" />)
    expect(screen.getByText('Mở Camera AR')).toBeInTheDocument()
  })

  it('passes the sub-season through to the camera AR button so its filter matches the quiz result', () => {
    renderWithIntl(<ColorInsights subSeason="light-spring" />)
    fireEvent.click(screen.getByText('Mở Camera AR'))
    expect(screen.getByTestId('qr-code').dataset.value).toContain('/camera-frame?palette=spring-light')
  })
})
