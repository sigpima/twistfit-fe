import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import NewTeamMemberPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('NewTeamMemberPage', () => {
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
        <NewTeamMemberPage />
      </AuthProvider>
    )
    expect(screen.getByRole('button', { name: 'Tạo thành viên' })).toBeInTheDocument()
  })
})
