import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogArticleGrid from './BlogArticleGrid'
import type { BlogPost } from '@/lib/db'

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'bai-a',
    title: 'Bài viết A về Personal Color',
    excerpt: 'Mô tả A',
    content: 'Nội dung A',
    coverImageUrl: '/blog/a.jpg',
    coverImageAlt: null,
    category: 'personal-color',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
  {
    id: 2,
    slug: 'bai-b',
    title: 'Bài viết B về Phối đồ',
    excerpt: 'Mô tả B',
    content: 'Nội dung B',
    coverImageUrl: '/blog/b.jpg',
    coverImageAlt: null,
    category: 'styling',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-01-02',
    createdAt: '2026-01-02',
    updatedAt: '2026-01-02',
  },
]

describe('BlogArticleGrid', () => {
  it('renders every post with a link to its detail page', () => {
    renderWithIntl(<BlogArticleGrid posts={POSTS} />)
    expect(screen.getByText('Bài viết A về Personal Color')).toBeInTheDocument()
    expect(screen.getByText('Bài viết B về Phối đồ')).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /Đọc ngay/ })
    expect(links[0]).toHaveAttribute('href', '/blog/bai-a')
  })

  it('filters by category', () => {
    renderWithIntl(<BlogArticleGrid posts={POSTS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Phối đồ & Vóc dáng' }))
    expect(screen.queryByText('Bài viết A về Personal Color')).not.toBeInTheDocument()
    expect(screen.getByText('Bài viết B về Phối đồ')).toBeInTheDocument()
  })

  it('filters by search query', () => {
    renderWithIntl(<BlogArticleGrid posts={POSTS} />)
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm bài viết...'), { target: { value: 'Phối đồ' } })
    expect(screen.queryByText('Bài viết A về Personal Color')).not.toBeInTheDocument()
    expect(screen.getByText('Bài viết B về Phối đồ')).toBeInTheDocument()
  })

  it('shows an empty state message when nothing matches', () => {
    renderWithIntl(<BlogArticleGrid posts={POSTS} />)
    fireEvent.change(screen.getByPlaceholderText('Tìm kiếm bài viết...'), {
      target: { value: 'khong-ton-tai' },
    })
    expect(screen.getByText('Không tìm thấy bài viết phù hợp')).toBeInTheDocument()
  })
})
