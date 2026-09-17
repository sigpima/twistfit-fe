import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { TeamMember } from '@/lib/team'
import AboutPage from './page'

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

describe('AboutPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the seeded team member', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MEMBERS }))
    const page = await AboutPage()
    renderWithIntl(page)
    expect(screen.getByText('Thành viên seed test')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ý nghĩa thương hiệu' })).toBeInTheDocument()
  })
})
