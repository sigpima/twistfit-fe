import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import BlogPostForm from './BlogPostForm'
import type { BlogPost } from '@/lib/db'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_POST: BlogPost = {
  id: 42,
  slug: 'bai-hien-co',
  title: 'Bài viết hiện có',
  excerpt: 'Mô tả hiện có',
  content: 'Nội dung hiện có',
  coverImageUrl: '/blog/existing.jpg',
  coverImageAlt: null,
  category: 'beauty',
  authorName: 'Tác giả X',
  isFeatured: false,
  publishedAt: '2026-01-01',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('BlogPostForm', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('auto-fills the slug from the title while creating a new post', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<BlogPostForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài Viết Mới Của Tôi' } })
    expect(screen.getByLabelText('Đường dẫn (slug)')).toHaveValue('bai-viet-moi-cua-toi')
  })

  it('stops auto-filling the slug once the user edits it directly', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<BlogPostForm />)
    fireEvent.change(screen.getByLabelText('Đường dẫn (slug)'), { target: { value: 'duong-dan-tuy-chinh' } })
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Tiêu đề khác' } })
    expect(screen.getByLabelText('Đường dẫn (slug)')).toHaveValue('duong-dan-tuy-chinh')
  })

  it('sets the cover image URL from the image picker and submits it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) })
    )
    renderWithIntl(<BlogPostForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài Mới' } })
    fireEvent.change(screen.getByLabelText('Mô tả ngắn'), { target: { value: 'Mô tả' } })
    fireEvent.change(screen.getByLabelText('Ngày đăng'), { target: { value: '2026-02-01' } })

    fireEvent.click(screen.getByRole('button', { name: 'Chọn ảnh bìa' }))
    expect(screen.queryByLabelText('Chú thích ảnh (hiện bên dưới ảnh, để trống nếu không cần)')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Đường dẫn ảnh'), { target: { value: '/blog/x.jpg' } })
    expect(screen.getByRole('button', { name: 'Chèn ảnh' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Mô tả ảnh (alt text)'), { target: { value: 'Ảnh bìa bài viết' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))

    fireEvent.click(screen.getByRole('button', { name: 'Tạo bài viết' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/blog'))
    expect(fetch).toHaveBeenCalledWith(
      '/blog',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"coverImageUrl":"/blog/x.jpg","coverImageAlt":"Ảnh bìa bài viết"'),
      })
    )
  })

  it('pre-fills fields and PUTs to /api/blog/{id} when editing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_POST })
    )
    renderWithIntl(<BlogPostForm initialPost={EXISTING_POST} />)
    expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài viết hiện có')
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/blog'))
    expect(fetch).toHaveBeenCalledWith('/blog/42', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
  })

  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<BlogPostForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo bài viết' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('renders the existing post content in the editor when editing', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<BlogPostForm initialPost={EXISTING_POST} />)
    expect(screen.getByText('Nội dung hiện có')).toBeInTheDocument()
  })
})
