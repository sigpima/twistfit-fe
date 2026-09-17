import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TaxonomyGroupList from './TaxonomyGroupList'
import type { TaxonomyGroup } from '@/lib/taxonomy'

const GROUPS: TaxonomyGroup[] = [
  {
    id: 1,
    key: 'clothing-type',
    label: 'Loại quần áo',
    sortOrder: 0,
    values: [
      { id: 1, key: 'ao', label: 'Áo', sortOrder: 0 },
      { id: 2, key: 'quan', label: 'Quần', sortOrder: 1 },
    ],
  },
]

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

describe('TaxonomyGroupList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders groups with a value count and a link to the detail page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(GROUPS)))
    renderWithIntl(<TaxonomyGroupList />)

    await waitFor(() => expect(screen.getByText('Loại quần áo')).toBeInTheDocument())
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quản lý' })).toHaveAttribute('href', '/admin/taxonomy/1')
  })

  it('shows an empty state when there are no groups', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])))
    renderWithIntl(<TaxonomyGroupList />)
    await waitFor(() => expect(screen.getByText('Chưa có nhóm nào.')).toBeInTheDocument())
  })

  it('creates a new group from the inline form, auto-slugging the key from the label', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return Promise.resolve(
            jsonResponse(
              { id: 2, key: 'chat-lieu', label: 'Chất liệu', sortOrder: 1, values: [] },
              { status: 201 }
            )
          )
        }
        return Promise.resolve(jsonResponse(GROUPS))
      })
    )
    renderWithIntl(<TaxonomyGroupList />)
    await waitFor(() => expect(screen.getByText('Loại quần áo')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Tên nhóm mới'), { target: { value: 'Chất liệu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm nhóm' }))

    await waitFor(() => expect(screen.getByText('Chất liệu')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/taxonomy/groups',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ key: 'chat-lieu', label: 'Chất liệu' }),
      })
    )
  })
})
