import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogNewsletterSection from './BlogNewsletterSection'

describe('BlogNewsletterSection', () => {
  it('shows a confirmation message after subscribing', () => {
    renderWithIntl(<BlogNewsletterSection />)
    fireEvent.change(screen.getByPlaceholderText('Nhập địa chỉ email của bạn...'), {
      target: { value: 'linhdan@gmail.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Đăng ký/ }))
    expect(screen.getByText(/Cảm ơn bạn đã đăng ký/)).toBeInTheDocument()
  })
})
