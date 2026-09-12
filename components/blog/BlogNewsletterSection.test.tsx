import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlogNewsletterSection from './BlogNewsletterSection'

describe('BlogNewsletterSection', () => {
  it('shows a confirmation message after subscribing', () => {
    render(<BlogNewsletterSection />)
    fireEvent.change(screen.getByPlaceholderText('Nhập địa chỉ email của bạn...'), {
      target: { value: 'linhdan@gmail.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Đăng ký/ }))
    expect(screen.getByText(/Cảm ơn bạn đã đăng ký/)).toBeInTheDocument()
  })
})
