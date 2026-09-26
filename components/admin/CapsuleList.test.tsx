import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import CapsuleList from './CapsuleList'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

const SETS: CapsuleSet[] = [
  {
    id: 1,
    image: '/outfit/capsule-set-a.jpg',
    alt: 'Ảnh A',
    tagVariant: 'primary',
    tagLabel: 'Set A',
    fitFor: 'Phù hợp: Test',
    title: 'Set A',
    tone: 'Test Tone',
    description: 'Mô tả',
    items: [{ label: 'Món đồ:', price: '100.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('CapsuleList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders sets with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => SETS }))
    renderWithIntl(<CapsuleList />)

    await waitFor(() => expect(screen.getByText('Set A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/capsule-wardrobe/1/edit')
  })

  it('deletes a set when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => SETS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<CapsuleList />)

    await waitFor(() => expect(screen.getByText('Set A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Set A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/capsule-wardrobe/1', { method: 'DELETE', credentials: 'include' })
  })

  it('shows an empty state when there are no sets', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<CapsuleList />)
    await waitFor(() => expect(screen.getByText('Chưa có set đồ nào.')).toBeInTheDocument())
  })
})
