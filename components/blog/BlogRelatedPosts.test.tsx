import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogRelatedPosts from './BlogRelatedPosts'
import type { BlogPost } from '@/lib/db'

function makePost(overrides: Partial<BlogPost>): BlogPost {
  return {
    id: 1,
    slug: 'bai-viet',
    title: 'Bài viết',
    excerpt: 'Mô tả',
    content: 'Nội dung',
    coverImageUrl: '/blog/cover.jpg',
    category: 'styling',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
    ...overrides,
  }
}

describe('BlogRelatedPosts', () => {
  it('renders nothing when there are no related posts', () => {
    const { container } = renderWithIntl(<BlogRelatedPosts posts={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a card per related post linking to its detail page', () => {
    const posts = [
      makePost({ id: 2, slug: 'phoi-do-cong-so', title: 'Phối đồ công sở', category: 'styling' }),
      makePost({ id: 3, slug: 'lam-dep-tu-nhien', title: 'Làm đẹp tự nhiên', category: 'beauty' }),
    ]
    renderWithIntl(<BlogRelatedPosts posts={posts} />)

    expect(screen.getByRole('link', { name: /Phối đồ công sở/ })).toHaveAttribute('href', '/blog/phoi-do-cong-so')
    expect(screen.getByRole('link', { name: /Làm đẹp tự nhiên/ })).toHaveAttribute('href', '/blog/lam-dep-tu-nhien')
    expect(screen.getByText('Phối đồ & Vóc dáng')).toBeInTheDocument()
    expect(screen.getByText('Làm đẹp & Makeup')).toBeInTheDocument()
  })
})
