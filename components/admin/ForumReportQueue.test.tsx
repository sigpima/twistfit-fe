import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumReportQueue from './ForumReportQueue'
import type { ForumReport } from '@/lib/forum'

const REPORTS: ForumReport[] = [
  {
    id: 1,
    postId: 10,
    postTitle: 'Bài bị báo cáo',
    postStatus: 'published',
    reporterId: 5,
    reason: 'Nội dung không phù hợp',
    status: 'open',
    createdAt: '2026-01-01',
  },
]

describe('ForumReportQueue', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders open reports with the post title and reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => REPORTS }))
    renderWithIntl(<ForumReportQueue />)

    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/moderation/reports', { credentials: 'include' })
    expect(screen.getByText(/Nội dung không phù hợp/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ẩn bài' })).toBeInTheDocument()
  })

  it('resolving a report PATCHes it and removes it from the list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => REPORTS }).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    )
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã xử lý' }))

    await waitFor(() => expect(screen.queryByText('Bài bị báo cáo')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/reports/1', { method: 'PATCH', credentials: 'include' })
  })

  it('hiding the post PATCHes its status to hidden', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => REPORTS }).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    )
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Ẩn bài' }))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/forum/posts/10',
        expect.objectContaining({ method: 'PATCH', credentials: 'include', body: JSON.stringify({ status: 'hidden' }) })
      )
    )
  })

  it('does not show "Ẩn bài" for a post that is not published', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [{ ...REPORTS[0], postStatus: 'pending' }] })
    )
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Ẩn bài' })).not.toBeInTheDocument()
  })

  it('deleting the post DELETEs it after confirmation and removes the report', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => REPORTS }).mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Bài bị báo cáo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xóa bài' }))

    await waitFor(() => expect(screen.queryByText('Bài bị báo cáo')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/forum/posts/10', { method: 'DELETE', credentials: 'include' })
  })

  it('shows an empty state when there are no open reports', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ForumReportQueue />)
    await waitFor(() => expect(screen.getByText('Không có báo cáo nào đang mở.')).toBeInTheDocument())
  })
})
