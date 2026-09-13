import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminFaqPage from './page'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('AdminFaqPage', () => {
  beforeEach(() => {
    pushMock.mockClear()
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

  it('renders the heading and a link to create a new item, for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminFaqPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Quản lý FAQ' })).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Thêm câu hỏi' })).toHaveAttribute('href', '/admin/faq/new')
  })
})
