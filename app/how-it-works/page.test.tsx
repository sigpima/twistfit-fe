import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HowItWorksPage from './page'

describe('HowItWorksPage', () => {
  it('renders the hero heading and the process steps', () => {
    render(<HowItWorksPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: /Hành Trình Khám Phá Sắc Màu/ })
    ).toBeInTheDocument()
    expect(screen.getByText('Chụp hoặc Tải Ảnh Khuôn Mặt')).toBeInTheDocument()
    expect(screen.getByText('Chi phí mỗi lần test')).toBeInTheDocument()
    expect(screen.getByText('Ánh sáng tự nhiên')).toBeInTheDocument()
  })
})
