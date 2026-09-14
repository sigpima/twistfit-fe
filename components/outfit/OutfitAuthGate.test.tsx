import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import OutfitAuthGate from './OutfitAuthGate'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginRequiredModalProvider } from '@/components/auth/LoginRequiredModalProvider'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}))

function setStoredUser(user: { name: string; email: string; role: 'user' | 'admin' } | null) {
  if (user) {
    window.localStorage.setItem('twistfit.auth', JSON.stringify(user))
  } else {
    window.localStorage.removeItem('twistfit.auth')
  }
}

function renderGate() {
  return renderWithIntl(
    <AuthProvider>
      <LoginRequiredModalProvider>
        <OutfitAuthGate />
      </LoginRequiredModalProvider>
    </AuthProvider>
  )
}

describe('OutfitAuthGate', () => {
  beforeEach(() => {
    replaceMock.mockClear()
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('redirects home and opens the login modal when signed out', async () => {
    setStoredUser(null)
    const { findByText } = renderGate()
    expect(await findByText('Bạn cần đăng nhập')).toBeInTheDocument()
    expect(replaceMock).toHaveBeenCalledWith('/')
  })

  it('does nothing for a signed-in user', () => {
    setStoredUser({ name: 'Test', email: 'user@twistfit.vn', role: 'user' })
    const { queryByText } = renderGate()
    expect(queryByText('Bạn cần đăng nhập')).not.toBeInTheDocument()
    expect(replaceMock).not.toHaveBeenCalled()
  })
})
