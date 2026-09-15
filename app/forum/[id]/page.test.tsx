import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import ForumPostPage from './page'
import type { ForumPost } from '@/lib/forum'

const POST: ForumPost = {
  id: 4,
  title: 'Bài test route',
  body: 'Nội dung',
  imageUrl: null,
  category: 'general',
  status: 'published',
  authorId: 1,
  authorName: 'Tác giả',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  bookmarkedByMe: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('ForumPostPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves params and renders the post detail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    renderWithIntl(
      <AuthProvider>
        <ForumPostPage params={Promise.resolve({ id: '4' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByText('Bài test route')).toBeInTheDocument())
  })
})
