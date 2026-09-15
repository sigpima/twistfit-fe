import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ProcessSteps from './ProcessSteps'

describe('ProcessSteps', () => {
  it('renders the assessment methodology section in place of the old Step 1', () => {
    renderWithIntl(<ProcessSteps />)
    expect(screen.getByRole('heading', { name: 'Đánh Giá Màu Sắc Cá Nhân' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Chụp hoặc Tải Ảnh Khuôn Mặt')).not.toBeInTheDocument()
    expect(screen.queryByAltText(/AI Camera Calibrator/)).not.toBeInTheDocument()
  })

  it('renders the remaining step 2 and step 3 headings', () => {
    renderWithIntl(<ProcessSteps />)
    expect(screen.getByText('Phân Tích AI & Báo Cáo 12 Mùa Sắc Thái')).toBeInTheDocument()
    expect(screen.getByText('Thử Đồ Ảo 3D & Xây Dựng Capsule Wardrobe')).toBeInTheDocument()
  })

  it('still renders the step 3 garment image', () => {
    renderWithIntl(<ProcessSteps />)
    expect(screen.getByAltText(/Trang phục đã chọn/)).toHaveAttribute(
      'src',
      '/how-it-works/garment-isolated.jpg'
    )
  })
})
