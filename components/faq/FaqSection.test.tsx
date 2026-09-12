import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqSection from './FaqSection'

describe('FaqSection', () => {
  it('renders all 6 questions by default', () => {
    render(<FaqSection />)
    expect(screen.getByText(/Personal Color Test trên TwistFit hoạt động/)).toBeInTheDocument()
    expect(screen.getByText(/Dữ liệu hình ảnh khuôn mặt của tôi có được bảo mật/)).toBeInTheDocument()
  })

  it('expands only one answer at a time', () => {
    render(<FaqSection />)
    const q1 = screen.getByText(/Personal Color Test trên TwistFit hoạt động/)
    const q3 = screen.getByText(/Tính năng Thử Đồ Ảo/)
    fireEvent.click(q1)
    expect(screen.getByText(/Quy trình 3 bước cốt lõi/)).toBeInTheDocument()
    fireEvent.click(q3)
    expect(screen.queryByText(/Quy trình 3 bước cốt lõi/)).not.toBeInTheDocument()
  })

  it('filters questions by category', () => {
    render(<FaqSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Phòng thử đồ ảo (Fitting Room)' }))
    expect(screen.getByText(/Tính năng Thử Đồ Ảo/)).toBeInTheDocument()
    expect(screen.queryByText(/Personal Color Test trên TwistFit hoạt động/)).not.toBeInTheDocument()
  })

  it('filters questions by search text and shows a no-results message', () => {
    render(<FaqSection />)
    fireEvent.change(screen.getByPlaceholderText(/Tìm kiếm thắc mắc/), {
      target: { value: 'không tồn tại xyz' },
    })
    expect(screen.getByText('Không tìm thấy câu hỏi phù hợp')).toBeInTheDocument()
  })

  it('sets the search value when a suggested tag is clicked', () => {
    render(<FaqSection />)
    fireEvent.click(screen.getByText('#XuấtPDF'))
    expect(screen.getByDisplayValue('xuất pdf')).toBeInTheDocument()
  })
})
