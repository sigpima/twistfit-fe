import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogFeaturedArticle from './BlogFeaturedArticle'
import type { BlogPost } from '@/lib/db'

const POST: BlogPost = {
  id: 1,
  slug: 'mua-dong-2026',
  title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
  excerpt: 'Khám phá sức hút mãnh liệt của sự tương phản cao.',
  content: Array(1000).fill('từ').join(' '),
  coverImageUrl: '/blog/featured-winter-outfit.jpg',
  category: 'personal-color',
  authorName: 'Stylist Mai Anh',
  isFeatured: true,
  publishedAt: '2026-06-18',
  createdAt: '2026-06-18',
  updatedAt: '2026-06-18',
}

describe('BlogFeaturedArticle', () => {
  it('renders the post title, author, and a link to its detail page', () => {
    renderWithIntl(<BlogFeaturedArticle post={POST} />)
    expect(
      screen.getByRole('heading', { name: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông' })
    ).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Đọc tiếp/ })).toHaveAttribute('href', '/blog/mua-dong-2026')
    expect(screen.getByText('5 phút đọc')).toBeInTheDocument()
  })

  it('omits the author block when the post has no author', () => {
    renderWithIntl(<BlogFeaturedArticle post={{ ...POST, authorName: null }} />)
    expect(screen.queryByText(/Bởi /)).not.toBeInTheDocument()
  })
})
