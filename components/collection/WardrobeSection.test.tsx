import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import WardrobeSection from './WardrobeSection'
import type { WardrobeItem } from '@/lib/wardrobe'

afterEach(() => {
  vi.unstubAllGlobals()
})

const ITEMS: WardrobeItem[] = [
  { id: 1, blobUrl: 'https://example.com/item1.jpg', attributes: {}, dominantColors: [] },
  { id: 2, blobUrl: 'https://example.com/item2.jpg', attributes: {}, dominantColors: [] },
]

describe('WardrobeSection', () => {
  it('shows the empty state with a CTA when the wardrobe is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<WardrobeSection />)

    await waitFor(() => expect(screen.getByText('Tủ đồ của bạn đang trống.')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Tải đồ lên' })).toHaveAttribute('href', '/outfit/step-1')
  })

  it('renders every wardrobe item image', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEMS }))
    renderWithIntl(<WardrobeSection />)

    await waitFor(() => expect(screen.getAllByAltText('Món đồ trong tủ đồ')).toHaveLength(2))
  })
})
