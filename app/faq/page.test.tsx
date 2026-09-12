import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FaqPage from './page'

describe('FaqPage', () => {
  it('renders the hero heading and the support banner', () => {
    render(<FaqPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Chúng Tôi Có Thể Giúp Gì Cho Bạn?' })
    ).toBeInTheDocument()
    expect(screen.getByText('Vẫn Còn Câu Hỏi Chưa Được Giải Đáp?')).toBeInTheDocument()
  })
})
