import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import MyForumPostsPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('MyForumPostsPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders the heading and a link to create a new post, for a signed-in user', async () => {
    renderWithIntl(
      <AuthProvider>
        <MyForumPostsPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Bài viết của tôi' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Đăng bài mới' })).toHaveAttribute('href', '/forum/new')
  })
})
