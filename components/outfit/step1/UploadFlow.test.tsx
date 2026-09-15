import { describe, expect, it, vi, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import UploadFlow from './UploadFlow'

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('UploadFlow', () => {
  it('uploads a file, shows suggested tags, and saves on confirm', async () => {
    const onUploaded = vi.fn()
    const putMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'PUT') return putMock(url, init)
        if (url.includes('/wardrobe/upload-url')) {
          return Promise.resolve(jsonResponse({ uploadUrl: 'https://blob.example.com/upload?sig=abc', blobPath: 'u1/x.png' }))
        }
        if (url.includes('/wardrobe/items/suggest-tags')) {
          return Promise.resolve(
            jsonResponse({
              category: 'ao-thun',
              styleTags: ['casual'],
              occasionTags: ['hang-ngay'],
              dominantColors: ['#ff0000'],
              blobUrl: 'https://blob.example.com/u1/x.png',
            })
          )
        }
        if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse({ id: 1 }))
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )

    renderWithIntl(<UploadFlow onUploaded={onUploaded} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Chọn ảnh áo quần/) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('Lưu vào tủ đồ')).toBeInTheDocument())
    expect(putMock).toHaveBeenCalledWith(
      'https://blob.example.com/upload?sig=abc',
      expect.objectContaining({ method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob' } })
    )

    fireEvent.click(screen.getByText('Lưu vào tủ đồ'))

    await waitFor(() => expect(screen.getByText('Đã lưu vào tủ đồ!')).toBeInTheDocument())
    expect(onUploaded).toHaveBeenCalled()
  })

  it('shows an error message when the upload URL request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))

    renderWithIntl(<UploadFlow onUploaded={vi.fn()} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Chọn ảnh áo quần/) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
  })

  it('shows an error message when the blob upload PUT fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'PUT') return Promise.resolve(jsonResponse(null, { ok: false, status: 403 }))
        if (url.includes('/wardrobe/upload-url')) {
          return Promise.resolve(jsonResponse({ uploadUrl: 'https://blob.example.com/upload?sig=abc', blobPath: 'u1/x.png' }))
        }
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )

    renderWithIntl(<UploadFlow onUploaded={vi.fn()} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Chọn ảnh áo quần/) as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
  })
})
