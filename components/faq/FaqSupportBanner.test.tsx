import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqSupportBanner from './FaqSupportBanner'

describe('FaqSupportBanner', () => {
  it('renders the support call-to-action with a single contact button', () => {
    renderWithIntl(<FaqSupportBanner />)
    expect(screen.getByText('Vẫn Còn Câu Hỏi Chưa Được Giải Đáp?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Liên hệ hỗ trợ ngay/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Gửi phản hồi/ })).not.toBeInTheDocument()
  })

  it('opens the contact form and submits it', () => {
    renderWithIntl(<FaqSupportBanner />)
    fireEvent.click(screen.getByRole('button', { name: /Liên hệ hỗ trợ ngay/ }))

    fireEvent.change(screen.getByPlaceholderText('Nhập tên của bạn*'), { target: { value: 'Minh Ánh' } })
    fireEvent.change(screen.getByPlaceholderText('Nhập số điện thoại*'), { target: { value: '0900000000' } })
    fireEvent.change(screen.getByPlaceholderText('Nhập địa chỉ email*'), {
      target: { value: 'minh@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Nhập câu hỏi của bạn ở đây:*'), {
      target: { value: 'Làm sao để test màu?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))

    expect(screen.getByText(/Cảm ơn bạn/)).toBeInTheDocument()
  })
})
