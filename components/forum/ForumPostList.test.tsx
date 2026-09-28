import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostList from './ForumPostList'
import type { ForumPost } from '@/lib/forum'

const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài công khai',
    body: 'Nội dung',
    imageUrl: 'https://example.com/outfit.jpg',
    category: 'styling-help',
    status: 'published',
    authorId: 1,
    authorName: 'Lan Anh',
    likeCount: 3,
    likedByMe: false,
    commentCount: 2,
    bookmarkedByMe: false,
    canDelete: false,
    deletedAt: null,
    deletedByAdmin: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('ForumPostList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches published posts on mount and shows the content and image inline, with a link to the detail page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<ForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts', { credentials: 'include' })
    expect(screen.getByText('Nội dung')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Lan Anh' })[0]).toHaveAttribute('href', '/forum/1')
  })

  it('refetches with a category query param when a filter is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<ForumPostList />)
    await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xin tư vấn phối đồ' }))
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/forum/posts?category=styling-help', { credentials: 'include' })
    )
  })

  it('shows an empty state when there are no posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumPostList />)
    await waitFor(() => expect(screen.getByText('Chưa có bài viết nào trong chuyên mục này.')).toBeInTheDocument())
  })

  it('toggles the bookmark button', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => ({ bookmarked: true }) })
        }
        return Promise.resolve({ ok: true, json: async () => POSTS })
      })
    )
    renderWithIntl(<ForumPostList />)
    await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())

    const saveButton = screen.getByRole('button', { name: 'Lưu bài viết' })
    expect(saveButton).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(saveButton)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Bỏ lưu bài viết' })).toHaveAttribute('aria-pressed', 'true')
    )
    expect(fetch).toHaveBeenCalledWith(
      '/api/forum/posts/1/bookmark',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
  })

  it('toggles the like button', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => ({ liked: true, likeCount: 4 }) })
        }
        return Promise.resolve({ ok: true, json: async () => POSTS })
      })
    )
    renderWithIntl(<ForumPostList />)
    await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Thích (3)' }))

    await waitFor(() => expect(screen.getByText('4 lượt thích')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/api/forum/posts/1/like',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
  })

  it('shows the image, author, like count, and a link to all comments', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<ForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())
    expect(screen.getAllByText(/Lan Anh/).length).toBeGreaterThan(0)
    expect(screen.getByAltText('Bài công khai')).toHaveAttribute('src', 'https://example.com/outfit.jpg')
    expect(screen.getByText('3 lượt thích')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xem tất cả 2 bình luận' })).toHaveAttribute('href', '/forum/1')
  })
})
