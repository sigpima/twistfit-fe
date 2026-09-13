import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostDetail from './ForumPostDetail'
import { AuthProvider } from '@/components/auth/AuthProvider'
import type { ForumPost } from '@/lib/forum'

const POST: ForumPost = {
  id: 9,
  title: 'Bài chi tiết',
  body: 'Nội dung chi tiết',
  category: 'general',
  status: 'published',
  authorId: 1,
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
})
