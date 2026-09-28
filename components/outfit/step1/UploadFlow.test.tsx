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
  {
    id: 3,
    key: 'occasion',
    label: 'Dịp',
    sortOrder: 2,
    values: [{ id: 4, key: 'hang-ngay', label: 'Hằng ngày', sortOrder: 0 }],
  },
]

function stubUploadFetches() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/taxonomy') return Promise.resolve(jsonResponse(TAXONOMY_GROUPS))
      if (url === '/api/wardrobe/upload-url') {
        return Promise.resolve(
          jsonResponse({
            uploadUrl: 'https://blob.example.com/upload',
            blobPath: 'u1/x.png',
            blobUrl: 'https://blob.example.com/u1/x.png',
          })
        )
      }
      if (init?.method === 'PUT') return Promise.resolve(jsonResponse({}))
      if (url === '/api/wardrobe/items/suggest-tags') {
        return Promise.resolve(
          jsonResponse({
            'clothing-type': ['ao'],
            style: ['casual'],
            occasion: ['hang-ngay'],
            dominantColors: ['#ffffff'],
            blobUrl: 'https://blob.example.com/u1/x.png',
          })
        )
      }
      if (url === '/api/wardrobe/items') return Promise.resolve(jsonResponse({ id: 1 }, { status: 201 }))
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
      '/api/wardrobe/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          blobUrl: 'https://blob.example.com/u1/x.png',
          attributes: { 'clothing-type': ['ao'], style: ['casual'], occasion: ['hang-ngay'] },
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
        '/api/wardrobe/items',
        expect.objectContaining({
          body: JSON.stringify({
            blobUrl: 'https://blob.example.com/u1/x.png',
            attributes: { 'clothing-type': ['ao', 'quan'], style: ['casual'], occasion: ['hang-ngay'] },
            dominantColors: ['#ffffff'],
          }),
        })
      )
    )
  })

  it('disables Save and shows which groups are missing when a required group has no value checked', async () => {
    stubUploadFetches()
    renderWithIntl(<UploadFlow onUploaded={vi.fn()} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Chọn ảnh áo quần để thêm vào tủ đồ'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Hằng ngày' })).toBeChecked())

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hằng ngày' })) // uncheck the only occasion value

    expect(screen.getByRole('alert')).toHaveTextContent('Chọn ít nhất 1 giá trị cho: Dịp')
    expect(screen.getByRole('button', { name: 'Lưu vào tủ đồ' })).toBeDisabled()
  })

  it('reaches the review step with nothing pre-checked when Gemini fails, and still lets the user tag and save by hand', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === '/api/taxonomy') return Promise.resolve(jsonResponse(TAXONOMY_GROUPS))
        if (url === '/api/wardrobe/upload-url') {
          return Promise.resolve(
            jsonResponse({
              uploadUrl: 'https://blob.example.com/upload',
              blobPath: 'u1/x.png',
              blobUrl: 'https://blob.example.com/u1/x.png',
            })
          )
        }
        if (init?.method === 'PUT') return Promise.resolve(jsonResponse({}))
        if (url === '/api/wardrobe/items/suggest-tags') {
          // Backend degrades a Gemini failure to a 200 with no suggested
          // attributes, not a non-ok response — see wardrobe/router.py.
          return Promise.resolve(
            jsonResponse({ dominantColors: ['#ffffff'], blobUrl: 'https://blob.example.com/u1/x.png' })
          )
        }
        if (url === '/api/wardrobe/items') return Promise.resolve(jsonResponse({ id: 1 }, { status: 201 }))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
    const onUploaded = vi.fn()
    renderWithIntl(<UploadFlow onUploaded={onUploaded} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Chọn ảnh áo quần để thêm vào tủ đồ'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText('Loại quần áo')).toBeInTheDocument())

    expect(screen.getByRole('checkbox', { name: 'Áo' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Lưu vào tủ đồ' })).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Áo' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Casual' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Hằng ngày' }))
    expect(screen.getByRole('button', { name: 'Lưu vào tủ đồ' })).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào tủ đồ' }))

    await waitFor(() => expect(onUploaded).toHaveBeenCalled())
  })

  it('still reaches manual tagging when the suggest-tags request itself fails (not just a Gemini-internal failure)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === '/api/taxonomy') return Promise.resolve(jsonResponse(TAXONOMY_GROUPS))
        if (url === '/api/wardrobe/upload-url') {
          return Promise.resolve(
            jsonResponse({
              uploadUrl: 'https://blob.example.com/upload',
              blobPath: 'u1/x.png',
              blobUrl: 'https://blob.example.com/u1/x.png',
            })
          )
        }
        if (init?.method === 'PUT') return Promise.resolve(jsonResponse({}))
        if (url === '/api/wardrobe/items/suggest-tags') {
          // A proxy/timeout killing the connection before the backend's
          // (already-degraded) response gets back — a non-2xx, unlike the
          // Gemini-internal-failure case above which is still a 200.
          return Promise.resolve(jsonResponse(null, { ok: false, status: 500 }))
        }
        if (url === '/api/wardrobe/items') return Promise.resolve(jsonResponse({ id: 1 }, { status: 201 }))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
    const onUploaded = vi.fn()
    renderWithIntl(<UploadFlow onUploaded={onUploaded} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Chọn ảnh áo quần để thêm vào tủ đồ'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText('Loại quần áo')).toBeInTheDocument())

    expect(screen.getByRole('checkbox', { name: 'Áo' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Lưu vào tủ đồ' })).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Áo' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Casual' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Hằng ngày' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào tủ đồ' }))

    await waitFor(() => expect(onUploaded).toHaveBeenCalled())
    expect(fetch).toHaveBeenCalledWith(
      '/api/wardrobe/items',
      expect.objectContaining({
        body: JSON.stringify({
          blobUrl: 'https://blob.example.com/u1/x.png',
          attributes: { 'clothing-type': ['ao'], style: ['casual'], occasion: ['hang-ngay'] },
          dominantColors: [],
        }),
      })
    )
  })
})
