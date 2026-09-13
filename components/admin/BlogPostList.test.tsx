import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogPostList from './BlogPostList'
import type { BlogPost } from '@/lib/db'

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'bai-a',
    title: 'Bài viết A',
    excerpt: 'Mô tả',
    content: 'Nội dung',
    coverImageUrl: '/blog/a.jpg',
    category: 'styling',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('BlogPostList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders posts with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<BlogPostList />)

    await waitFor(() => expect(screen.getByText('Bài viết A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/blog/1/edit')
  })

  it('deletes a post when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => POSTS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<BlogPostList />)

    await waitFor(() => expect(screen.getByText('Bài viết A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Bài viết A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/blog/1', { method: 'DELETE' })
  })

  it('shows an empty state when there are no posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<BlogPostList />)
    await waitFor(() => expect(screen.getByText('Chưa có bài viết nào.')).toBeInTheDocument())
  })
})
