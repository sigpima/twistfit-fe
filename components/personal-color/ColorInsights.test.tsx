import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorInsights from './ColorInsights'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
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
})
