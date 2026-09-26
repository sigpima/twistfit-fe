import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostForm from './ForumPostForm'
import type { ForumPost } from '@/lib/forum'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

const EXISTING_POST: ForumPost = {
  id: 7,
  title: 'Bài hiện có',
  body: 'Nội dung hiện có',
  imageUrl: null,
  category: 'styling-help',
  status: 'published',
  authorId: 1,
  authorName: 'Author',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  bookmarkedByMe: false,
  canDelete: false,
  deletedAt: null,
  deletedByAdmin: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('ForumPostForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('POSTs to /forum/posts when creating and redirects to my-posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<ForumPostForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/forum/my-posts'))
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts', expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })

  it('renders the existing post body in the editor when editing', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<ForumPostForm initialPost={EXISTING_POST} />)
    expect(screen.getByText('Nội dung hiện có')).toBeInTheDocument()
  })

  it('pre-fills fields and PUTs to /forum/posts/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_POST }))
    renderWithIntl(<ForumPostForm initialPost={EXISTING_POST} />)
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài hiện có')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/forum/my-posts'))
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts/7', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
  })

  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<ForumPostForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
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

  it('uploads a picked image and submits its resolved URL', async () => {
    const putMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'PUT') return putMock(url, init)
        if (url === '/api/forum/upload-url?content_type=image%2Fjpeg') {
          return Promise.resolve(
            jsonResponse({
              uploadUrl: 'https://blob.example.com/upload?sig=abc',
              blobPath: 'u1/x.jpg',
              imageUrl: 'https://blob.example.com/u1/x.jpg',
            })
          )
        }
        if (url === '/api/forum/posts') return Promise.resolve(jsonResponse({ id: 1 }, { status: 201 }))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
    renderWithIntl(<ForumPostForm />)

    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài mới' } })
    const file = new File(['fake'], 'outfit.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Hình ảnh (không bắt buộc)'), { target: { files: [file] } })

    await waitFor(() =>
      expect(putMock).toHaveBeenCalledWith(
        'https://blob.example.com/upload?sig=abc',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
        })
      )
    )

    fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/forum/my-posts'))
    expect(fetch).toHaveBeenCalledWith(
      '/api/forum/posts',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Bài mới',
          body: '',
          category: 'general',
          imageUrl: 'https://blob.example.com/u1/x.jpg',
        }),
      })
    )
  })

  it('rejects an unsupported image file type without calling the upload API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderWithIntl(<ForumPostForm />)

    const file = new File(['fake'], 'notes.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Hình ảnh (không bắt buộc)'), { target: { files: [file] } })

    expect(
      await screen.findByText('Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, GIF hoặc WEBP.')
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
