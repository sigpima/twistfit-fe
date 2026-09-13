import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TeamGrid from './TeamGrid'
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
  {
    id: 2,
    image: '/about/team-b.jpg',
    name: 'Thành viên B',
    role: 'Vai trò B',
    bio: 'Tiểu sử B',
    badgeVariant: 'secondary',
    roleVariant: 'secondary',
    footerIcon: 'memory',
    footerLabel: 'Footer B',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('TeamGrid', () => {
  it('renders every member passed in', () => {
    renderWithIntl(<TeamGrid members={MEMBERS} />)
    expect(screen.getByText('Thành viên A')).toBeInTheDocument()
    expect(screen.getByText('Thành viên B')).toBeInTheDocument()
  })
})
