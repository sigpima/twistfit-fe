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
    fireEvent.change(screen.getByLabelText('Nội dung (Markdown)'), { target: { value: 'Nội dung' } })
    fireEvent.change(screen.getByLabelText('Ngày đăng'), { target: { value: '2026-02-01' } })

    fireEvent.click(screen.getByRole('button', { name: 'Chọn ảnh bìa' }))
    expect(screen.queryByLabelText('Mô tả ảnh (alt text)')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Đường dẫn ảnh'), { target: { value: '/blog/x.jpg' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))

    fireEvent.click(screen.getByRole('button', { name: 'Tạo bài viết' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/blog'))
    expect(fetch).toHaveBeenCalledWith(
      '/blog',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"coverImageUrl":"/blog/x.jpg"'),
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

  it('formats the selected content text as bold using the markdown toolbar', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<BlogPostForm />)
    const textarea = screen.getByLabelText('Nội dung (Markdown)') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Xin chào' } })
    textarea.focus()
    textarea.setSelectionRange(0, 3)

    fireEvent.click(screen.getByRole('button', { name: 'In đậm' }))

    expect(textarea.value).toBe('**Xin** chào')
  })

  it('switches to the preview tab and renders the content as markdown', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<BlogPostForm />)
    fireEvent.change(screen.getByLabelText('Nội dung (Markdown)'), { target: { value: '**đậm**' } })

    fireEvent.click(screen.getByRole('button', { name: 'Xem trước' }))

    expect(screen.queryByLabelText('Nội dung (Markdown)')).not.toBeInTheDocument()
    expect(screen.getByText('đậm').tagName).toBe('STRONG')
  })

  it('inserts an image into the content via the toolbar image picker', () => {
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<BlogPostForm />)
    const textarea = screen.getByLabelText('Nội dung (Markdown)') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Trước.Sau.' } })
    textarea.focus()
    textarea.setSelectionRange(6, 6)

    fireEvent.click(screen.getByRole('button', { name: 'Ảnh' }))
    fireEvent.change(screen.getByLabelText('Đường dẫn ảnh'), { target: { value: 'https://example.com/a.jpg' } })
    fireEvent.change(screen.getByLabelText('Mô tả ảnh (alt text)'), { target: { value: 'Mô tả ảnh' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))

    expect(textarea.value).toBe('Trước.![Mô tả ảnh](https://example.com/a.jpg)Sau.')
  })
})
