import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostForm from './ForumPostForm'
import type { ForumPost } from '@/lib/forum'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_POST: ForumPost = {
  id: 7,
  title: 'Bài hiện có',
  body: 'Nội dung hiện có',
  category: 'styling-help',
  status: 'published',
  authorId: 1,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('ForumPostForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('POSTs to /api/forum/posts when creating and redirects to my-posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<ForumPostForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài mới' } })
    fireEvent.change(screen.getByLabelText('Nội dung'), { target: { value: 'Nội dung mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/forum/my-posts'))
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/forum/posts/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_POST }))
    renderWithIntl(<ForumPostForm initialPost={EXISTING_POST} />)
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài hiện có')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/forum/my-posts'))
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts/7', expect.objectContaining({ method: 'PUT' }))
  })

  it('shows field errors returned by the API instead of redirecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: { title: 'Tiêu đề không được để trống' } }),
      })
    )
    renderWithIntl(<ForumPostForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))

    await waitFor(() => expect(screen.getByText('Tiêu đề không được để trống')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('shows the unauthorized error and does not redirect on a 403', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }))
    renderWithIntl(<ForumPostForm initialPost={EXISTING_POST} />)
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() =>
      expect(screen.getByText('Bạn không có quyền thực hiện thao tác này.')).toBeInTheDocument()
    )
    expect(pushMock).not.toHaveBeenCalled()
  })
})
