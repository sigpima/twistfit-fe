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
    category: 'styling-help',
    status: 'published',
    authorId: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('ForumPostList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches published posts on mount and links to the detail page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<ForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/forum/posts', { credentials: 'include' })
    expect(screen.getByRole('link', { name: 'Bài công khai' })).toHaveAttribute('href', '/forum/1')
  })

  it('refetches with a category query param when a filter is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<ForumPostList />)
    await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xin tư vấn phối đồ' }))
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/forum/posts?category=styling-help', { credentials: 'include' })
    )
  })

  it('shows an empty state when there are no posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumPostList />)
    await waitFor(() => expect(screen.getByText('Chưa có bài viết nào trong chuyên mục này.')).toBeInTheDocument())
  })
})
