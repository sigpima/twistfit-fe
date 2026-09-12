import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ColorInsights from './ColorInsights'

describe('ColorInsights', () => {
  it('renders the color metrics', () => {
    render(<ColorInsights />)
    expect(screen.getByText('Độ sáng da')).toBeInTheDocument()
    expect(screen.getByText('Sắc độ ấm – lạnh')).toBeInTheDocument()
    expect(screen.getByText('Độ tươi rực rỡ')).toBeInTheDocument()
  })

  it('renders the action buttons', () => {
    render(<ColorInsights />)
    expect(screen.getByRole('link', { name: /Thử Phối Đồ Ngay/ })).toHaveAttribute('href', '/outfit/step-1')
    expect(screen.getByRole('button', { name: /Tải Báo Cáo PDF/ })).toBeInTheDocument()
  })
})
