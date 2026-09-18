import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import WardrobeLibrary from './WardrobeLibrary'
import { OutfitFlowProvider } from '../OutfitFlowProvider'
import type { TaxonomyGroup } from '@/lib/taxonomy'
import type { WardrobeItem } from '@/lib/wardrobe'

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

const CLOTHING_TYPE_GROUP: TaxonomyGroup = {
  id: 1,
  key: 'clothing-type',
  label: 'Loại quần áo',
  sortOrder: 0,
  values: [
    { id: 1, key: 'ao', label: 'Áo', sortOrder: 0 },
    { id: 2, key: 'quan', label: 'Quần', sortOrder: 1 },
  ],
}

const SHIRT_ITEM: WardrobeItem = {
  id: 1,
  blobUrl: 'https://example.com/a.png',
  attributes: { 'clothing-type': ['ao'], style: ['casual'], occasion: ['hang-ngay'] },
  dominantColors: ['#ff0000'],
}

const PANTS_ITEM: WardrobeItem = {
  id: 2,
  blobUrl: 'https://example.com/b.png',
  attributes: { 'clothing-type': ['quan'], style: ['casual'], occasion: ['hang-ngay'] },
  dominantColors: ['#0000ff'],
}

function stubFetches(items: WardrobeItem[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse(items))
      if (url.includes('/quiz-attempts/me')) return Promise.resolve(jsonResponse(null))
      if (url.includes('/taxonomy')) return Promise.resolve(jsonResponse([CLOTHING_TYPE_GROUP]))
      return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
    })
  )
}

describe('WardrobeLibrary', () => {
  beforeEach(() => {
    stubFetches([SHIRT_ITEM, PANTS_ITEM])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a loading state, then the fetched items', async () => {
    renderLibrary()
    expect(screen.getByText('Đang tải tủ đồ...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))
  })

  it('shows an error message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))
    renderLibrary()
    await waitFor(() => expect(screen.getByText('Không tải được tủ đồ, vui lòng thử lại.')).toBeInTheDocument())
  })

  it('shows the personal-color CTA link when the user has no quiz result', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getByRole('link', { name: /màu sắc cá nhân/ })).toBeInTheDocument())
  })

  it('opens the Lọc dropdown with a checkbox per clothing-type value', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }))

    expect(screen.getByRole('checkbox', { name: 'Áo' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Quần' })).toBeInTheDocument()
  })

  it('filters items to only the checked clothing types', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Áo' }))

    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1))
  })

  it('shows every item again when no clothing-type checkbox is checked', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Áo' }))
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Áo' }))

    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))
  })
})
