import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditBlogPostPage from './page'
import type { BlogPost } from '@/lib/db'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const POST: BlogPost = {
  id: 7,
  slug: 'bai-can-sua',
  title: 'Bài cần sửa',
  excerpt: 'Mô tả',
  content: 'Nội dung',
  coverImageUrl: '/blog/x.jpg',
  coverImageAlt: null,
  category: 'styling',
  authorName: null,
  isFeatured: false,
  publishedAt: '2026-01-01',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditBlogPostPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the post by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditBlogPostPage params={Promise.resolve({ id: '7' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Bài cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/api/blog/7', { credentials: 'include' })
  })
})
