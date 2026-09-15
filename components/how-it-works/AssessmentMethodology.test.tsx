import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AssessmentMethodology from './AssessmentMethodology'

describe('AssessmentMethodology', () => {
  it('renders the section title, intro, and the Hue phase by default', () => {
    renderWithIntl(<AssessmentMethodology />)
    expect(screen.getByRole('heading', { name: 'Đánh Giá Màu Sắc Cá Nhân' })).toBeInTheDocument()
    expect(screen.getByText(/Bộ câu hỏi được chia thành 3 giai đoạn/)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)' })
    ).toBeInTheDocument()
    expect(screen.getByText('Tán xạ tĩnh mạch dưới ánh sáng tự nhiên')).toBeInTheDocument()
    expect(screen.getByText('Độ tương thích trang sức kim loại')).toBeInTheDocument()
    expect(screen.getByText('Phản ứng sinh học da Fitzpatrick')).toBeInTheDocument()
    expect(screen.getByText('Thử nghiệm Drapery sắc trắng')).toBeInTheDocument()
  })

  it('marks only the Hue tab as current by default', () => {
    renderWithIntl(<AssessmentMethodology />)
    expect(screen.getByRole('button', { name: '1. Hue' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: '2. Value' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: '3. Chroma' })).not.toHaveAttribute('aria-current')
  })

  it('switches to the Value phase when its tab is clicked', () => {
    renderWithIntl(<AssessmentMethodology />)
    fireEvent.click(screen.getByRole('button', { name: '2. Value' }))

    expect(
      screen.getByRole('heading', { name: 'Đo Lường Độ Sáng - Tối (Value: Light vs Deep)' })
    ).toBeInTheDocument()
    expect(screen.getByText('Chiều sâu sắc tố Mắt & Tóc tự nhiên')).toBeInTheDocument()
    expect(screen.getByText('Định lượng tương phản diện mạo (Contrast Level)')).toBeInTheDocument()
    expect(screen.getByText('Định hướng công thức phối màu trang phục')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2. Value' })).toHaveAttribute('aria-current', 'true')
  })

  it('switches to the Chroma phase when its tab is clicked', () => {
    renderWithIntl(<AssessmentMethodology />)
    fireEvent.click(screen.getByRole('button', { name: '3. Chroma' }))

    expect(
      screen.getByRole('heading', { name: 'Độ Bão Hòa & Khóa Kết Quả (Chroma: Clear vs Muted)' })
    ).toBeInTheDocument()
    expect(screen.getByText('Bài kiểm tra hiệu ứng lấp lánh (Sparkle Test)')).toBeInTheDocument()
    expect(screen.getByText('Đối chiếu chéo trải nghiệm thực tế (Triangulation)')).toBeInTheDocument()
    expect(screen.getByText('Khóa kết quả & Định vị mùa phụ (Sub-season)')).toBeInTheDocument()
  })
})
