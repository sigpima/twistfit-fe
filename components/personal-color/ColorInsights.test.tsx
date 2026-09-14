import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorInsights from './ColorInsights'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ColorInsights', () => {
  it('renders the color metrics', () => {
    renderWithIntl(<ColorInsights />)
    expect(screen.getByText('Độ sáng da')).toBeInTheDocument()
    expect(screen.getByText('Sắc độ ấm – lạnh')).toBeInTheDocument()
    expect(screen.getByText('Độ tươi rực rỡ')).toBeInTheDocument()
  })

  it('renders the action buttons', () => {
    renderWithIntl(<ColorInsights />)
    expect(screen.getByRole('link', { name: /Thử Phối Đồ Ngay/ })).toHaveAttribute('href', '/outfit/step-1')
    expect(screen.getByRole('button', { name: /Tải Báo Cáo PDF/ })).toBeInTheDocument()
  })

  it('renders the camera AR button', () => {
    renderWithIntl(<ColorInsights />)
    expect(screen.getByText('Mở Camera AR')).toBeInTheDocument()
  })
})
