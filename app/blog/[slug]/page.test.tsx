import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { BlogPost } from '@/lib/db'

const POST: BlogPost = {
  id: 1,
  slug: 'mua-dong-2026',
  title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
  excerpt: 'Mô tả ngắn',
  content: '# Tiêu đề phụ\n\nNội dung **đầy đủ** của bài viết.',
  coverImageUrl: '/blog/featured-winter-outfit.jpg',
  category: 'personal-color',
  authorName: 'Stylist Mai Anh',
  isFeatured: true,
  publishedAt: '2026-06-18',
  createdAt: '2026-06-18',
  updatedAt: '2026-06-18',
}

const notFoundMock = vi.fn()

vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}))

vi.mock('@/lib/db', () => ({
  getBlogPostBySlug: (_db: unknown, slug: string) => (slug === POST.slug ? POST : null),
}))

vi.mock('@/lib/getDb', () => ({ getDb: () => ({}) }))

describe('BlogPostPage', async () => {
  const { default: BlogPostPage } = await import('./page')

  it('renders the post title and markdown content when the slug exists', async () => {
    const ui = await BlogPostPage({ params: Promise.resolve({ slug: 'mua-dong-2026' }) })
    renderWithIntl(ui!)
    expect(
      screen.getByRole('heading', { name: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiêu đề phụ' })).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
  })

  it('calls notFound() when the slug does not exist', async () => {
    await BlogPostPage({ params: Promise.resolve({ slug: 'khong-ton-tai' }) })
    expect(notFoundMock).toHaveBeenCalled()
  })
})
