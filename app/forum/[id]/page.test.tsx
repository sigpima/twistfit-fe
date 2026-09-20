import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import ForumPostPage, { generateMetadata } from './page'
import type { ForumPost } from '@/lib/forum'

const POST: ForumPost = {
  id: 4,
  title: 'Bài test route',
  body: 'Nội dung dài dùng để kiểm tra mô tả trang được cắt gọn đúng cách khi vượt quá giới hạn ký tự cho phép hiển thị trên kết quả tìm kiếm của Google, ví dụ cụ thể là như thế này đây.',
  imageUrl: null,
  category: 'general',
  status: 'published',
  authorId: 1,
  authorName: 'Tác giả',
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

describe('ForumPostPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves params and renders the post detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    const ui = await ForumPostPage({ params: Promise.resolve({ id: '4' }) })
    renderWithIntl(<AuthProvider>{ui}</AuthProvider>)
    await waitFor(() => expect(screen.getByText('Bài test route')).toBeInTheDocument())
  })

  it('sets a self-referencing canonical URL and a title/description from the post', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    const metadata = await generateMetadata({ params: Promise.resolve({ id: '4' }) })
    expect(metadata.title).toBe('Bài test route | TwistFit')
    expect(metadata.alternates?.canonical).toBe('/forum/4')
    expect(metadata.description).toHaveLength(161)
    expect(metadata.description).toBe(`${POST.body.slice(0, 160)}…`)
  })

  it('returns empty metadata when the post does not exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const metadata = await generateMetadata({ params: Promise.resolve({ id: '999' }) })
    expect(metadata).toEqual({})
  })
})
