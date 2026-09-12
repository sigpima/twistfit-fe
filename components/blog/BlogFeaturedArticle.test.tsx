import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BlogFeaturedArticle from './BlogFeaturedArticle'

describe('BlogFeaturedArticle', () => {
  it('renders the featured article title and author', () => {
    render(<BlogFeaturedArticle />)
    expect(
      screen.getByText('Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông - Xu hướng mới nhất 2026')
    ).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
  })
})
