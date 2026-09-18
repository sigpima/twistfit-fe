import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostDetail from './ForumPostDetail'
import { AuthProvider } from '@/components/auth/AuthProvider'
import type { ForumComment, ForumPost } from '@/lib/forum'

const POST: ForumPost = {
  id: 9,
  title: 'Bài chi tiết',
  body: 'Nội dung chi tiết',
  imageUrl: 'https://example.com/outfit.jpg',
  category: 'general',
  status: 'published',
  authorId: 1,
  authorName: 'Lan Anh',
  likeCount: 2,
  likedByMe: false,
  commentCount: 0,
  bookmarkedByMe: false,
  canDelete: false,
  deletedAt: null,
  deletedByAdmin: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

function renderDetail() {
  return renderWithIntl(
    <AuthProvider>
      <ForumPostDetail id="9" />
    </AuthProvider>
  )
}

const COMMENTS: ForumComment[] = [
  {
    id: 1,
    postId: 9,
    authorId: 2,
    authorName: 'Minh',
    body: 'Phối đồ đẹp quá!',
    createdAt: '2026-01-02',
    updatedAt: '2026-01-02',
    canDelete: false,
  },
]

function stubForumFetches(comments: ForumComment[] = COMMENTS) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (url === '/forum/posts/9') return Promise.resolve({ ok: true, json: async () => POST })
      if (url === '/forum/posts/9/comments' && (!init || init.method === undefined)) {
        return Promise.resolve({ ok: true, json: async () => comments })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  )
}

describe('ForumPostDetail', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches and renders the post', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/forum/posts/9', { credentials: 'include' })
  })

  it('shows a not-found message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Không tìm thấy bài viết')).toBeInTheDocument())
  })

  it('does not show a report button when signed out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Báo cáo bài viết' })).not.toBeInTheDocument()
  })

  it('renders the image and author name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.com/outfit.jpg')
    expect(screen.getByText('Lan Anh')).toBeInTheDocument()
  })

  it('does not show a like button when signed out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /Thích/ })).not.toBeInTheDocument()
  })

  it('lets a signed-in user toggle the like button', async () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Thích \(2\)/ })).toHaveAttribute('aria-pressed', 'false')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ liked: true, likeCount: 3 }) })
    )
    fireEvent.click(screen.getByRole('button', { name: /Thích \(2\)/ }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Đã thích \(3\)/ })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Đã thích \(3\)/ })).toHaveAttribute('aria-pressed', 'true')
    expect(fetch).toHaveBeenCalledWith(
      '/forum/posts/9/like',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
  })

  it('fetches and renders the comment list', async () => {
    stubForumFetches()
    renderDetail()
    await waitFor(() => expect(screen.getByText('Phối đồ đẹp quá!')).toBeInTheDocument())
    expect(screen.getByText('Minh')).toBeInTheDocument()
  })

  it('does not show a comment composer when signed out', async () => {
    stubForumFetches()
    renderDetail()
    await waitFor(() => expect(screen.getByText('Phối đồ đẹp quá!')).toBeInTheDocument())
    expect(screen.queryByPlaceholderText('Viết bình luận...')).not.toBeInTheDocument()
  })

  it('lets a signed-in user post a comment', async () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    stubForumFetches()
    renderDetail()
    await waitFor(() => expect(screen.getByText('Phối đồ đẹp quá!')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('Viết bình luận...'), { target: { value: 'Đẹp!' } })

    const newComment: ForumComment = {
      id: 2,
      postId: 9,
      authorId: 3,
      authorName: 'Người dùng Test',
      body: 'Đẹp!',
      createdAt: '2026-01-03',
      updatedAt: '2026-01-03',
      canDelete: true,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => newComment }))
    fireEvent.click(screen.getByRole('button', { name: 'Gửi bình luận' }))

    await waitFor(() => expect(screen.getByText('Đẹp!')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/forum/posts/9/comments',
      expect.objectContaining({ method: 'POST', credentials: 'include', body: JSON.stringify({ body: 'Đẹp!' }) })
    )
  })

  it('shows a delete button only for deletable comments and removes it on click', async () => {
    const deletableComment: ForumComment = { ...COMMENTS[0], canDelete: true }
    stubForumFetches([deletableComment])
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    renderDetail()
    await waitFor(() => expect(screen.getByText('Phối đồ đẹp quá!')).toBeInTheDocument())

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => ({}) }))
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bình luận' }))

    await waitFor(() => expect(screen.queryByText('Phối đồ đẹp quá!')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/forum/comments/1',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' })
    )
  })

  it('lets a signed-in user toggle the bookmark button', async () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Lưu' })).toHaveAttribute('aria-pressed', 'false')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ bookmarked: true }) }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Đã lưu' })).toHaveAttribute('aria-pressed', 'true'))
    expect(fetch).toHaveBeenCalledWith(
      '/forum/posts/9/bookmark',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
  })

  it('lets a signed-in user submit a report', async () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Báo cáo bài viết' }))
    fireEvent.change(screen.getByPlaceholderText('Mô tả lý do báo cáo...'), {
      target: { value: 'Spam' },
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gửi báo cáo' }))

    await waitFor(() => expect(screen.getByText('Đã gửi báo cáo, cảm ơn bạn.')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/forum/posts/9/report',
      expect.objectContaining({ method: 'POST', credentials: 'include', body: JSON.stringify({ reason: 'Spam' }) })
    )
  })

  it('does not show a delete button when the post cannot be deleted by the viewer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Xóa bài viết' })).not.toBeInTheDocument()
  })

  it('shows a delete button when the post can be deleted, and shows the removed banner after confirming', async () => {
    const deletablePost: ForumPost = { ...POST, canDelete: true }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => deletablePost }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())

    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    const deletedPost: ForumPost = { ...deletablePost, deletedAt: '2026-01-04', deletedByAdmin: false }
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => deletedPost })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bài viết' }))

    await waitFor(() => expect(screen.getByText('Bài viết đã bị xóa bởi tác giả.')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/forum/posts/9',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' })
    )
    expect(screen.queryByText('Nội dung chi tiết')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa bài viết' })).not.toBeInTheDocument()
  })

  it('does not delete the post when the confirmation is declined', async () => {
    const deletablePost: ForumPost = { ...POST, canDelete: true }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => deletablePost }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())

    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))
    const deleteFetch = vi.fn()
    vi.stubGlobal('fetch', deleteFetch)
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bài viết' }))

    expect(deleteFetch).not.toHaveBeenCalled()
  })

  it('shows the admin-deleted banner and hides comments for an already-deleted post', async () => {
    const deletedPost: ForumPost = { ...POST, deletedAt: '2026-01-04', deletedByAdmin: true }
    stubForumFetches()
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url === '/forum/posts/9') return Promise.resolve({ ok: true, json: async () => deletedPost })
        if (url === '/forum/posts/9/comments') return Promise.resolve({ ok: true, json: async () => COMMENTS })
        return Promise.resolve({ ok: true, json: async () => ({}) })
      })
    )
    renderDetail()

    await waitFor(() =>
      expect(screen.getByText('Bài viết đã bị xóa bởi quản trị viên.')).toBeInTheDocument()
    )
    expect(screen.queryByText('Bình luận')).not.toBeInTheDocument()
    expect(screen.queryByText('Phối đồ đẹp quá!')).not.toBeInTheDocument()
  })
})
