import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ModelList from './ModelList'
import type { CatalogModel } from '@/lib/modelCatalog'

const MODELS: CatalogModel[] = [
  {
    id: 1,
    name: 'Model A',
    image: '/outfit/models/a.jpg',
    dossierImage: '/outfit/models/a.jpg',
    sideImage: null,
    poseCount: 15,
    tagline: 'Tagline A',
    undertone: 'warm',
    height: '1m70',
    bodyShape: 'Chữ nhật',
    waist: '70cm',
    personalColor: 'Warm Spring',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('ModelList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders models with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MODELS }))
    renderWithIntl(<ModelList />)

    await waitFor(() => expect(screen.getByText('Model A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/model-catalog/1/edit')
  })

  it('deletes a model when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => MODELS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<ModelList />)

    await waitFor(() => expect(screen.getByText('Model A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Model A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/model-catalog/1', { method: 'DELETE', credentials: 'include' })
  })

  it('shows an empty state when there are no models', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ModelList />)
    await waitFor(() => expect(screen.getByText('Chưa có người mẫu nào.')).toBeInTheDocument())
  })
})
