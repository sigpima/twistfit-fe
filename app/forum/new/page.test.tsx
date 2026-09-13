import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewForumPostPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewForumPostPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders the create form for a signed-in user', () => {
    renderWithIntl(
      <AuthProvider>
        <NewForumPostPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Đăng bài' })).toBeInTheDocument()
  })
})
