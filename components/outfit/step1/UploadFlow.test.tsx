import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import UploadFlow from './UploadFlow'

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

const TAXONOMY_GROUPS = [
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
  {
    id: 2,
    key: 'style',
    label: 'Loại phong cách',
    sortOrder: 1,
    values: [{ id: 3, key: 'casual', label: 'Casual', sortOrder: 0 }],
  },
]

function stubUploadFetches() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (url === '/taxonomy') return Promise.resolve(jsonResponse(TAXONOMY_GROUPS))
      if (url === '/wardrobe/upload-url') {
        return Promise.resolve(jsonResponse({ uploadUrl: 'https://blob.example.com/upload', blobPath: 'u1/x.png' }))
      }
      if (init?.method === 'PUT') return Promise.resolve(jsonResponse({}))
      if (url === '/wardrobe/items/suggest-tags') {
        return Promise.resolve(
          jsonResponse({
            'clothing-type': ['ao'],
            style: ['casual'],
            dominantColors: ['#ffffff'],
            blobUrl: 'https://blob.example.com/u1/x.png',
          })
        )
      }
      if (url === '/wardrobe/items') return Promise.resolve(jsonResponse({ id: 1 }, { status: 201 }))
      return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
    })
  )
}

describe('UploadFlow', () => {
  it('walks the whole flow: pick -> review with a checkbox section per taxonomy group -> save', async () => {
    stubUploadFetches()
    const onUploaded = vi.fn()
    renderWithIntl(<UploadFlow onUploaded={onUploaded} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Chọn ảnh áo quần để thêm vào tủ đồ'), { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('Loại quần áo')).toBeInTheDocument())
    expect(screen.getByText('Loại phong cách')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Áo' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Casual' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Quần' })).not.toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào tủ đồ' }))

    await waitFor(() => expect(onUploaded).toHaveBeenCalled())
    expect(fetch).toHaveBeenCalledWith(
      '/wardrobe/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          blobUrl: 'https://blob.example.com/u1/x.png',
          attributes: { 'clothing-type': ['ao'], style: ['casual'] },
          dominantColors: ['#ffffff'],
        }),
      })
    )
  })

  it('toggling a checkbox adds the value to that group before saving', async () => {
    stubUploadFetches()
    renderWithIntl(<UploadFlow onUploaded={vi.fn()} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Chọn ảnh áo quần để thêm vào tủ đồ'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Quần' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('checkbox', { name: 'Quần' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào tủ đồ' }))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/wardrobe/items',
        expect.objectContaining({
          body: JSON.stringify({
            blobUrl: 'https://blob.example.com/u1/x.png',
            attributes: { 'clothing-type': ['ao', 'quan'], style: ['casual'] },
            dominantColors: ['#ffffff'],
          }),
        })
      )
    )
  })
})
