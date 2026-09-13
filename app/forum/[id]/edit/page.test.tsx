import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditForumPostPage from './page'
import type { ForumPost } from '@/lib/forum'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const POST: ForumPost = {
  id: 3,
  title: 'Bài cần sửa',
  body: 'Nội dung cần sửa',
  category: 'general',
  status: 'pending',
  authorId: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditForumPostPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the post by id and pre-fills the form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderWithIntl(
      <AuthProvider>
        <EditForumPostPage params={Promise.resolve({ id: '3' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/forum/posts/3', { credentials: 'include' })
  })

  it('shows a not-found message when the post cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }))
    renderWithIntl(
      <AuthProvider>
        <EditForumPostPage params={Promise.resolve({ id: '999' })} />
      </AuthProvider>
    )
    await waitFor(() =>
      expect(screen.getByText('Bài viết này không tồn tại hoặc bạn không có quyền sửa.')).toBeInTheDocument()
    )
  })
})
