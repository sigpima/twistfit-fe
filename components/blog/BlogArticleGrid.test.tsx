import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogArticleGrid from './BlogArticleGrid'

describe('BlogArticleGrid', () => {
  it('renders all 6 articles by default', () => {
    renderWithIntl(<BlogArticleGrid />)
    expect(screen.getByText(/Top 5 thỏi son kinh điển/)).toBeInTheDocument()
    expect(screen.getByText(/Sức hút ấm áp từ bảng màu Mùa Thu/)).toBeInTheDocument()
  })

  it('filters articles by category', () => {
    renderWithIntl(<BlogArticleGrid />)
    fireEvent.click(screen.getByRole('button', { name: 'Làm đẹp & Makeup' }))
    expect(screen.getByText(/Top 5 thỏi son kinh điển/)).toBeInTheDocument()
    expect(screen.queryByText(/Tủ đồ con nhộng/)).not.toBeInTheDocument()
  })

  it('filters articles by search text', () => {
    renderWithIntl(<BlogArticleGrid />)
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm bài viết...'), {
      target: { value: 'chính xác tại nhà' },
    })
    expect(screen.getByText(/Warm Undertone vs Cool Undertone/)).toBeInTheDocument()
    expect(screen.queryByText(/Top 5 thỏi son kinh điển/)).not.toBeInTheDocument()
  })

  it('toggles the bookmark state of an individual article card', () => {
    renderWithIntl(<BlogArticleGrid />)
    const bookmarkButtons = screen.getAllByLabelText('Lưu bài viết')
    fireEvent.click(bookmarkButtons[0])
    expect(bookmarkButtons[0]).toHaveAttribute('aria-pressed', 'true')
    expect(bookmarkButtons[1]).toHaveAttribute('aria-pressed', 'false')
  })
})
