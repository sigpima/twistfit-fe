import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import OutfitResultsSection from './OutfitResultsSection'
import type { TryOnJob } from '@/lib/tryon'

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeJob(overrides: Partial<TryOnJob>): TryOnJob {
  return {
    id: 1,
    userId: 1,
    wardrobeItemId: null,
    catalogModelId: 1,
    occasion: 'hang-ngay',
    style: 'casual',
    status: 'done',
    resultFrontBlobUrl: 'https://example.com/front.png',
    resultSideBlobUrl: 'https://example.com/side.png',
    errorMessage: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('OutfitResultsSection', () => {
  it('shows the empty state with a CTA when there are no done jobs', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<OutfitResultsSection />)

    await waitFor(() => expect(screen.getByText('Bạn chưa có kết quả phối đồ nào.')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Bắt đầu phối đồ' })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('filters out jobs that are not done and renders both images for completed ones', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [makeJob({ id: 1 }), makeJob({ id: 2, status: 'pending', resultFrontBlobUrl: null })],
      })
    )
    renderWithIntl(<OutfitResultsSection />)

    await waitFor(() => expect(screen.getAllByAltText('Ảnh trực diện')).toHaveLength(1))
    expect(screen.getByAltText('Ảnh trực diện')).toHaveAttribute('src', 'https://example.com/front.png')
    expect(screen.getByAltText('Ảnh nghiêng')).toHaveAttribute('src', 'https://example.com/side.png')
  })

  it('deletes an outfit after confirming, removing it from the grid', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') return Promise.resolve({ ok: true })
      return Promise.resolve({ ok: true, json: async () => [makeJob({ id: 1 })] })
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))

    renderWithIntl(<OutfitResultsSection />)
    await waitFor(() => expect(screen.getByAltText('Ảnh trực diện')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xóa outfit này' }))

    expect(window.confirm).toHaveBeenCalledWith('Xóa outfit này?')
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/tryon/1', { method: 'DELETE', credentials: 'include' })
    )
    await waitFor(() => expect(screen.getByText('Bạn chưa có kết quả phối đồ nào.')).toBeInTheDocument())
  })

  it('does not delete when the confirm dialog is dismissed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [makeJob({ id: 1 })] })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(false))

    renderWithIntl(<OutfitResultsSection />)
    await waitFor(() => expect(screen.getByAltText('Ảnh trực diện')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xóa outfit này' }))

    expect(fetchMock).not.toHaveBeenCalledWith('/tryon/1', { method: 'DELETE', credentials: 'include' })
    expect(screen.getByAltText('Ảnh trực diện')).toBeInTheDocument()
  })

  it('shows an error message and keeps the card when the delete request fails', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') return Promise.resolve({ ok: false, status: 500 })
      return Promise.resolve({ ok: true, json: async () => [makeJob({ id: 1 })] })
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))

    renderWithIntl(<OutfitResultsSection />)
    await waitFor(() => expect(screen.getByAltText('Ảnh trực diện')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xóa outfit này' }))

    await waitFor(() => expect(screen.getByText('Không xóa được, vui lòng thử lại.')).toBeInTheDocument())
    expect(screen.getByAltText('Ảnh trực diện')).toBeInTheDocument()
  })
})
