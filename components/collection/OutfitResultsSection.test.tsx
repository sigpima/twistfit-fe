import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
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
})
