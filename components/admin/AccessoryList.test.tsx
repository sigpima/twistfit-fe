import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AccessoryList from './AccessoryList'
import type { AccessoryProduct } from '@/lib/accessories'

const PRODUCTS: AccessoryProduct[] = [
  {
    id: 1,
    name: 'Túi tote nâu',
    imageUrl: '/tote.png',
    affiliateLink: 'https://shop.example.com/tote',
    category: 'tui-xach',
    styleTags: ['casual'],
    occasionTags: ['hang-ngay'],
    toneTags: ['autumn'],
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('AccessoryList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders accessories with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => PRODUCTS }))
    renderWithIntl(<AccessoryList />)

    await waitFor(() => expect(screen.getByText('Túi tote nâu')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/accessories/1/edit')
  })

  it('deletes an accessory when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => PRODUCTS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<AccessoryList />)

    await waitFor(() => expect(screen.getByText('Túi tote nâu')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Túi tote nâu')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/accessories/1', { method: 'DELETE', credentials: 'include' })
  })

  it('shows an empty state when there are no accessories', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<AccessoryList />)
    await waitFor(() => expect(screen.getByText('Chưa có phụ kiện nào.')).toBeInTheDocument())
  })
})
