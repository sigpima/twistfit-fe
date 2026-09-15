import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumModerationQueue from './ForumModerationQueue'
import type { ForumPost } from '@/lib/forum'

const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài chờ duyệt',
    body: 'Nội dung',
    imageUrl: null,
    category: 'general',
    status: 'pending',
    authorId: 5,
    authorName: 'Tác giả',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('ForumModerationQueue', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders pending posts with approve/reject buttons', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<ForumModerationQueue />)

    await waitFor(() => expect(screen.getByText('Bài chờ duyệt')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/forum/moderation/pending', { credentials: 'include' })
    expect(screen.getByRole('button', { name: 'Duyệt' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeInTheDocument()
  })

  it('approving a post PATCHes its status and removes it from the list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => POSTS }).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    )
    renderWithIntl(<ForumModerationQueue />)
    await waitFor(() => expect(screen.getByText('Bài chờ duyệt')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Duyệt' }))

    await waitFor(() => expect(screen.queryByText('Bài chờ duyệt')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/forum/posts/1',
      expect.objectContaining({ method: 'PATCH', credentials: 'include', body: JSON.stringify({ status: 'published' }) })
    )
  })

  it('shows an empty state when there is nothing pending', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumModerationQueue />)
    await waitFor(() => expect(screen.getByText('Không có bài nào chờ duyệt.')).toBeInTheDocument())
  })
})
