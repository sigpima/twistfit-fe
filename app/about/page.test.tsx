import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage from './page'

describe('AboutPage', () => {
  it('renders the hero heading and the team section', () => {
    render(<AboutPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: /Định Hình Phong Cách Bằng/ })
    ).toBeInTheDocument()
    expect(screen.getByText('Trần Mai Anh')).toBeInTheDocument()
    expect(screen.getByText('"Tủ Đồ Đầy Ắp Nhưng Không Có Gì Để Mặc"')).toBeInTheDocument()
  })
})
