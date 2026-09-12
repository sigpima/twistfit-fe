import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ContactSection from './ContactSection'

describe('ContactSection', () => {
  it('shows a confirmation message after submitting the form', () => {
    renderWithIntl(<ContactSection />)
    fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Linh Đan' } })
    fireEvent.change(screen.getByLabelText('Địa chỉ Email *'), { target: { value: 'linhdan@gmail.com' } })
    fireEvent.change(screen.getByLabelText('Chủ đề góp ý *'), { target: { value: 'other' } })
    fireEvent.change(screen.getByLabelText('Nội dung tin nhắn *'), { target: { value: 'Xin chào' } })
    fireEvent.click(screen.getByRole('button', { name: /GỬI LỜI NHẮN/ }))
    expect(screen.getByText(/Cảm ơn bạn/)).toBeInTheDocument()
  })
})
