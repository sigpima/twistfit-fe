import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqPage from './page'

describe('FaqPage', () => {
  it('renders the hero heading and the support banner', () => {
    renderWithIntl(<FaqPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Chúng Tôi Có Thể Giúp Gì Cho Bạn?' })
    ).toBeInTheDocument()
    expect(screen.getByText('Vẫn Còn Câu Hỏi Chưa Được Giải Đáp?')).toBeInTheDocument()
  })
})
