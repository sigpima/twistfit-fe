import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AnonymousResultBanner from './AnonymousResultBanner'

describe('AnonymousResultBanner', () => {
  it('shows the save-your-result message with links to register and login', () => {
    renderWithIntl(<AnonymousResultBanner />)
    expect(screen.getByText('Lưu lại kết quả của bạn!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Đăng ký ngay/ })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: /Đăng nhập/ })).toHaveAttribute('href', '/login')
  })
})
