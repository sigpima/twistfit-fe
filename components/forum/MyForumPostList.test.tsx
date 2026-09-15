import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import MyForumPostList from './MyForumPostList'
import type { ForumPost } from '@/lib/forum'

const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài của tôi',
    body: 'Nội dung',
    imageUrl: null,
    category: 'general',
    status: 'pending',
    authorId: 5,
    authorName: 'Tôi',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('MyForumPostList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders own posts with a status label and edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<MyForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài của tôi')).toBeInTheDocument())
    expect(screen.getByText('Chờ duyệt')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/forum/1/edit')
  })

  it('deletes a post when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => POSTS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<MyForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài của tôi')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Bài của tôi')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/forum/posts/1', { method: 'DELETE', credentials: 'include' })
  })

  it('shows an empty state when there are no posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<MyForumPostList />)
    await waitFor(() => expect(screen.getByText('Bạn chưa đăng bài nào.')).toBeInTheDocument())
  })
})
