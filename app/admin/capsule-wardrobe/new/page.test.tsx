import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewCapsuleSetPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewCapsuleSetPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders the create form', () => {
    renderWithIntl(
      <AuthProvider>
        <NewCapsuleSetPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Tạo set đồ' })).toBeInTheDocument()
  })
})
