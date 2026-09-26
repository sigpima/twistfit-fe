import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TeamList from './TeamList'
import type { TeamMember } from '@/lib/team'

const MEMBERS: TeamMember[] = [
  {
    id: 1,
    image: '/about/team-a.jpg',
    name: 'Thành viên A',
    role: 'Vai trò A',
    bio: 'Tiểu sử A',
    badgeVariant: 'primary',
    roleVariant: 'primary',
    footerIcon: 'verified',
    footerLabel: 'Footer A',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('TeamList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders members with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MEMBERS }))
    renderWithIntl(<TeamList />)

    await waitFor(() => expect(screen.getByText('Thành viên A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/team/1/edit')
  })

  it('deletes a member when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => MEMBERS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<TeamList />)

    await waitFor(() => expect(screen.getByText('Thành viên A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Thành viên A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/team/1', { method: 'DELETE', credentials: 'include' })
  })

  it('shows an empty state when there are no members', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<TeamList />)
    await waitFor(() => expect(screen.getByText('Chưa có thành viên nào.')).toBeInTheDocument())
  })
})
