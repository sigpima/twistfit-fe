import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditTeamMemberPage from './page'
import type { TeamMember } from '@/lib/team'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MEMBER: TeamMember = {
  id: 2,
  image: '/about/team-x.jpg',
  name: 'Thành viên cần sửa',
  role: 'Vai trò X',
  bio: 'Tiểu sử X',
  badgeVariant: 'primary',
  roleVariant: 'primary',
  footerIcon: 'verified',
  footerLabel: 'Footer X',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditTeamMemberPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MEMBER }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the member by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditTeamMemberPage params={Promise.resolve({ id: '2' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Họ tên')).toHaveValue('Thành viên cần sửa'))
    expect(fetch).toHaveBeenCalledWith('/api/team/2')
  })
})
