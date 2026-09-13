import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { TeamMember } from '@/lib/team'

const MEMBERS: TeamMember[] = [
  {
    id: 1,
    image: '/about/team-seed.jpg',
    name: 'Thành viên seed test',
    role: 'Vai trò seed test',
    bio: 'Tiểu sử seed test',
    badgeVariant: 'primary',
    roleVariant: 'primary',
    footerIcon: 'verified',
    footerLabel: 'Footer seed test',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

vi.mock('@/lib/getDb', () => ({ getDb: () => ({}) }))
vi.mock('@/lib/team', async () => {
  const actual = await vi.importActual<typeof import('@/lib/team')>('@/lib/team')
  return { ...actual, getTeamMembers: () => MEMBERS }
})

describe('AboutPage', async () => {
  const { default: AboutPage } = await import('./page')

  it('renders the seeded team member', () => {
    renderWithIntl(<AboutPage />)
    expect(screen.getByText('Thành viên seed test')).toBeInTheDocument()
  })
})
