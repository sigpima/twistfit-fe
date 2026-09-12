import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProcessSteps from './ProcessSteps'

describe('ProcessSteps', () => {
  it('renders all three step headings', () => {
    render(<ProcessSteps />)
    expect(screen.getByText('Chụp hoặc Tải Ảnh Khuôn Mặt')).toBeInTheDocument()
    expect(screen.getByText('Phân Tích AI & Báo Cáo 12 Mùa Sắc Thái')).toBeInTheDocument()
    expect(screen.getByText('Thử Đồ Ảo 3D & Xây Dựng Capsule Wardrobe')).toBeInTheDocument()
  })

  it('renders the step images', () => {
    render(<ProcessSteps />)
    expect(screen.getByAltText(/AI Camera Calibrator/)).toHaveAttribute(
      'src',
      '/how-it-works/camera-calibrator.jpg'
    )
    expect(screen.getByAltText(/Trang phục đã chọn/)).toHaveAttribute(
      'src',
      '/how-it-works/garment-isolated.jpg'
    )
  })
})
