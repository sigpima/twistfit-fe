import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import CollectionPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('CollectionPage', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders the title and all three sections for a signed-in user', async () => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', phone: null, role: 'user' })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/quiz-attempts/me')) return Promise.resolve({ ok: true, json: async () => null })
        return Promise.resolve({ ok: true, json: async () => [] })
      })
    )

    renderWithIntl(
      <AuthProvider>
        <CollectionPage />
      </AuthProvider>
    )

    expect(screen.getByRole('heading', { name: 'Bộ sưu tập đã lưu', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Phối đồ đã tạo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tủ đồ của tôi' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Kết quả Personal Color' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Bạn chưa có kết quả phối đồ nào.')).toBeInTheDocument())
  })
})
