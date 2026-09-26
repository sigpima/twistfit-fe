import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TaxonomyGroupDetail from './TaxonomyGroupDetail'
import type { TaxonomyGroup } from '@/lib/taxonomy'

const GROUP: TaxonomyGroup = {
  id: 1,
  key: 'clothing-type',
  label: 'Loại quần áo',
  sortOrder: 0,
  values: [{ id: 1, key: 'ao', label: 'Áo', sortOrder: 0 }],
}

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

describe('TaxonomyGroupDetail', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches all groups and renders the matching one by id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([GROUP])))
    renderWithIntl(<TaxonomyGroupDetail groupId={1} />)

    await waitFor(() => expect(screen.getByDisplayValue('Loại quần áo')).toBeInTheDocument())
    expect(screen.getByText('Áo')).toBeInTheDocument()
  })

  it('adds a new value, auto-slugging its key from the label', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === '/api/taxonomy/groups/1/values' && init?.method === 'POST') {
          return Promise.resolve(jsonResponse({ id: 2, key: 'quan', label: 'Quần', sortOrder: 1 }, { status: 201 }))
        }
        return Promise.resolve(jsonResponse([GROUP]))
      })
    )
    renderWithIntl(<TaxonomyGroupDetail groupId={1} />)
    await waitFor(() => expect(screen.getByText('Áo')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Tên giá trị mới'), { target: { value: 'Quần' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm giá trị' }))

    await waitFor(() => expect(screen.getByText('Quần')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/api/taxonomy/groups/1/values',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ key: 'quan', label: 'Quần' }) })
    )
  })

  it('deletes a value after confirmation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === '/api/taxonomy/values/1' && init?.method === 'DELETE') {
          return Promise.resolve(jsonResponse({}))
        }
        return Promise.resolve(jsonResponse([GROUP]))
      })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<TaxonomyGroupDetail groupId={1} />)
    await waitFor(() => expect(screen.getByText('Áo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Áo')).not.toBeInTheDocument())
  })

  it('shows a delete error inline when the value is still in use', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === '/api/taxonomy/values/1' && init?.method === 'DELETE') {
          return Promise.resolve(jsonResponse({ detail: 'Đang được 3 món đồ sử dụng' }, { ok: false, status: 400 }))
        }
        return Promise.resolve(jsonResponse([GROUP]))
      })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<TaxonomyGroupDetail groupId={1} />)
    await waitFor(() => expect(screen.getByText('Áo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.getByText('Đang được 3 món đồ sử dụng')).toBeInTheDocument())
    expect(screen.getByText('Áo')).toBeInTheDocument()
  })
})
