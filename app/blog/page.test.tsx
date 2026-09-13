import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { BlogPost } from '@/lib/db'
import BlogPage from './page'

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'mua-dong-2026',
    title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
    excerpt: 'Khám phá sức hút mãnh liệt của sự tương phản cao.',
    content: 'Nội dung bài nổi bật.',
    coverImageUrl: '/blog/featured-winter-outfit.jpg',
    category: 'personal-color',
    authorName: 'Stylist Mai Anh',
    isFeatured: true,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
  {
    id: 2,
    slug: 'top-5-thoi-son',
    title: 'Top 5 thỏi son kinh điển dành riêng cho cô nàng thuộc nhóm Cool Undertone',
    excerpt: 'Sự thanh khiết và dịu mát của tone Mùa Hạ.',
    content: 'Nội dung bài thường.',
    coverImageUrl: '/blog/lipstick-flatlay.jpg',
    category: 'beauty',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
]

describe('BlogPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the hero heading, featured article and article grid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    const page = await BlogPage()
    renderWithIntl(page)
    expect(screen.getByRole('heading', { level: 1, name: 'Tạp Chí Phong Cách TwistFit' })).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
    expect(screen.getByText(/Top 5 thỏi son kinh điển/)).toBeInTheDocument()
    expect(screen.getByText('Nhận Cẩm Nang Thời Trang Hàng Tuần')).toBeInTheDocument()
  })
})
