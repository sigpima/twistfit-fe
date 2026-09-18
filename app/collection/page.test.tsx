import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
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

  function stubSignedInFetch() {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', phone: null, role: 'user' })
    )
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/forum/posts/saved')) return Promise.resolve({ ok: true, json: async () => [] })
        return Promise.resolve({ ok: true, json: async () => [] })
      })
    )
  }

  it('renders the title and defaults to the saved-posts tab', async () => {
    stubSignedInFetch()

    renderWithIntl(
      <AuthProvider>
        <CollectionPage />
      </AuthProvider>
    )

    expect(screen.getByRole('heading', { name: 'Bộ sưu tập đã lưu', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bài viết' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phối đồ' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Bạn chưa lưu bài viết nào.')).toBeInTheDocument())
  })

  it('switches to the outfits tab on click', async () => {
    stubSignedInFetch()

    renderWithIntl(
      <AuthProvider>
        <CollectionPage />
      </AuthProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Phối đồ' }))
    await waitFor(() => expect(screen.getByText('Bạn chưa có kết quả phối đồ nào.')).toBeInTheDocument())
    expect(screen.queryByText('Bạn chưa lưu bài viết nào.')).not.toBeInTheDocument()
  })
})
