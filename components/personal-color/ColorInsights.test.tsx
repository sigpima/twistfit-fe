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
  it('renders the real recommendation text for the given sub-season', () => {
    renderWithIntl(<ColorInsights subSeason="true-winter" />)
    expect(screen.getByText('Đỏ tươi, hồng fuchsia')).toBeInTheDocument()
    expect(screen.getByText('Áo trắng phối đen, đầm xanh hoàng gia')).toBeInTheDocument()
  })

  it('renders the action buttons', () => {
    renderWithIntl(<ColorInsights subSeason="true-winter" />)
    expect(screen.getByRole('link', { name: /Thử Phối Đồ Ngay/ })).toHaveAttribute('href', '/outfit/step-1')
    expect(screen.getByRole('button', { name: /Tải Báo Cáo PDF/ })).toBeInTheDocument()
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
