import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import WardrobeLibrary from './WardrobeLibrary'
import { OutfitFlowProvider } from '../OutfitFlowProvider'

function renderLibrary() {
  return renderWithIntl(
    <OutfitFlowProvider>
      <WardrobeLibrary />
    </OutfitFlowProvider>
  )
}

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

const WARDROBE_ITEM = {
  id: 1,
  blobUrl: 'https://example.com/a.png',
  category: 'ao-thun',
  styleTags: ['casual'],
  occasionTags: ['hang-ngay'],
  dominantColors: ['#ff0000'],
}

describe('WardrobeLibrary', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse([WARDROBE_ITEM]))
        if (url.includes('/quiz-attempts/me')) return Promise.resolve(jsonResponse(null))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a loading state, then the fetched items', async () => {
    renderLibrary()
    expect(screen.getByText('Đang tải tủ đồ...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('ao-thun')).toBeInTheDocument())
  })

  it('shows an error message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))
    renderLibrary()
    await waitFor(() => expect(screen.getByText('Không tải được tủ đồ, vui lòng thử lại.')).toBeInTheDocument())
  })

  it('does not render a clickable/selectable card — items are plain display only', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getByText('ao-thun')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /ao-thun/ })).not.toBeInTheDocument()
  })

  it('shows the personal-color CTA link when the user has no quiz result', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getByRole('link', { name: /Personal Color/ })).toBeInTheDocument())
  })

  it('shows the real personal-color checkbox when the user has a quiz result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse([WARDROBE_ITEM]))
        if (url.includes('/quiz-attempts/me')) return Promise.resolve(jsonResponse({ season: 'autumn' }))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
    renderLibrary()
    await waitFor(() =>
      expect(screen.getByText('Phối đồ theo kết quả đánh giá personal color')).toBeInTheDocument()
    )
    expect(screen.queryByRole('link', { name: /Personal Color/ })).not.toBeInTheDocument()
  })
})
