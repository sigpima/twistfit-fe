import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AdminStatsOverview from './AdminStatsOverview'
import type { AdminStats } from './AdminStatsOverview'

const STATS: AdminStats = {
  blogPosts: { total: 7, new30d: 2 },
  forumPosts: { total: 3, new30d: 1 },
  users: { total: 5, new30d: 1 },
  quizAttempts: { total: 20, new30d: 4 },
  contactMessages: { total: 6, unread: 2 },
}

describe('AdminStatsOverview', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders all five stat cards', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => STATS }))
    renderWithIntl(<AdminStatsOverview />)

    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/admin/stats', { credentials: 'include' })
    expect(screen.getByText('Bài viết Blog')).toBeInTheDocument()
    expect(screen.getByText('+2 trong 30 ngày qua')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('2 chưa đọc')).toBeInTheDocument()
  })

  it('shows a loading state before the fetch resolves', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    renderWithIntl(<AdminStatsOverview />)
    expect(screen.getByText('Đang tải số liệu...')).toBeInTheDocument()
  })
})
