import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import HowItWorksPage from './page'

describe('HowItWorksPage', () => {
  it('renders the hero heading and the process steps', () => {
    renderWithIntl(<HowItWorksPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: /Hành Trình Khám Phá Sắc Màu/ })
    ).toBeInTheDocument()
    expect(screen.getByText('Đánh Giá Màu Sắc Cá Nhân')).toBeInTheDocument()
    expect(screen.getByText('Chi phí mỗi lần test')).toBeInTheDocument()
    expect(screen.getByText('Ánh sáng tự nhiên')).toBeInTheDocument()
  })
})
