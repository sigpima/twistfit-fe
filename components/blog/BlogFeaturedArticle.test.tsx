import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogFeaturedArticle from './BlogFeaturedArticle'

describe('BlogFeaturedArticle', () => {
  it('renders the featured article title and author', () => {
    renderWithIntl(<BlogFeaturedArticle />)
    expect(
      screen.getByText('Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông - Xu hướng mới nhất 2026')
    ).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
  })
})
