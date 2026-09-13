import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminForumPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('AdminForumPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders both the pending-posts and reports sections for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminForumPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Kiểm duyệt Diễn đàn' })).toBeInTheDocument())
    expect(screen.getByText('Bài chờ duyệt')).toBeInTheDocument()
    expect(screen.getByText('Báo cáo')).toBeInTheDocument()
  })
})
