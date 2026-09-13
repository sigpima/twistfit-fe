import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import AdminCapsuleWardrobePage from './page'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('AdminCapsuleWardrobePage', () => {
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

  it('renders the heading and a link to create a new set, for a signed-in admin', async () => {
    renderWithIntl(
      <AuthProvider>
        <AdminCapsuleWardrobePage />
      </AuthProvider>
    )
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Quản lý Capsule Wardrobe' })).toBeInTheDocument()
    )
    expect(screen.getByRole('link', { name: 'Thêm set đồ' })).toHaveAttribute(
      'href',
      '/admin/capsule-wardrobe/new'
    )
  })
})
