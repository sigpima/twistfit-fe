import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import SavedForumPostList from './SavedForumPostList'
import type { ForumPost } from '@/lib/forum'

const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài đã lưu',
    body: 'Nội dung',
    imageUrl: null,
    category: 'general',
    status: 'published',
    authorId: 2,
    authorName: 'Tác giả',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    bookmarkedByMe: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('SavedForumPostList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders saved posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<SavedForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài đã lưu')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/forum/posts/saved', { credentials: 'include' })
  })

  it('shows an empty state when nothing is saved', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<SavedForumPostList />)
    await waitFor(() => expect(screen.getByText('Bạn chưa lưu bài viết nào.')).toBeInTheDocument())
  })

  it('removes a post from the list when unbookmarked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<SavedForumPostList />)
    await waitFor(() => expect(screen.getByText('Bài đã lưu')).toBeInTheDocument())

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ bookmarked: false }) }))
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lưu bài viết' }))

    await waitFor(() => expect(screen.queryByText('Bài đã lưu')).not.toBeInTheDocument())
  })
})
