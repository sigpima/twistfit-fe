import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogPage from './page'

describe('BlogPage', () => {
  it('renders the hero heading, featured article and article grid', () => {
    renderWithIntl(<BlogPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Tạp Chí Phong Cách TwistFit' })).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
    expect(screen.getByText(/Top 5 thỏi son kinh điển/)).toBeInTheDocument()
    expect(screen.getByText('Nhận Cẩm Nang Thời Trang Hàng Tuần')).toBeInTheDocument()
  })
})
