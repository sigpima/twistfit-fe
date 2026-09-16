import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ImagePickerDialog from './ImagePickerDialog'

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

describe('ImagePickerDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders nothing when closed', () => {
    renderWithIntl(
      <ImagePickerDialog open={false} uploadUrlEndpoint="/blog/upload-url" onCancel={vi.fn()} onConfirm={vi.fn()} />
    )
    expect(screen.queryByText('Dán link')).not.toBeInTheDocument()
  })

  it('disables confirm until both a URL and alt text are filled in link mode', () => {
    renderWithIntl(
      <ImagePickerDialog open uploadUrlEndpoint="/blog/upload-url" onCancel={vi.fn()} onConfirm={vi.fn()} />
    )
    expect(screen.getByRole('button', { name: 'Chèn ảnh' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Đường dẫn ảnh'), { target: { value: 'https://example.com/a.jpg' } })
    expect(screen.getByRole('button', { name: 'Chèn ảnh' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Mô tả ảnh (alt text)'), { target: { value: 'Mô tả' } })
    expect(screen.getByRole('button', { name: 'Chèn ảnh' })).not.toBeDisabled()
  })

  it('confirms with the pasted link and alt text', () => {
    const onConfirm = vi.fn()
    renderWithIntl(
      <ImagePickerDialog open uploadUrlEndpoint="/blog/upload-url" onCancel={vi.fn()} onConfirm={onConfirm} />
    )
    fireEvent.change(screen.getByLabelText('Đường dẫn ảnh'), { target: { value: 'https://example.com/a.jpg' } })
    fireEvent.change(screen.getByLabelText('Mô tả ảnh (alt text)'), { target: { value: 'Mô tả' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))
    expect(onConfirm).toHaveBeenCalledWith({ url: 'https://example.com/a.jpg', alt: 'Mô tả' })
  })

  it('does not render or require the alt text field when requireAlt is false', () => {
    const onConfirm = vi.fn()
    renderWithIntl(
      <ImagePickerDialog
        open
        requireAlt={false}
        uploadUrlEndpoint="/blog/upload-url"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />
    )
    expect(screen.queryByLabelText('Mô tả ảnh (alt text)')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Đường dẫn ảnh'), { target: { value: 'https://example.com/a.jpg' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))
    expect(onConfirm).toHaveBeenCalledWith({ url: 'https://example.com/a.jpg', alt: '' })
  })

  it('calls onCancel and does not confirm when cancelled', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    renderWithIntl(
      <ImagePickerDialog open uploadUrlEndpoint="/blog/upload-url" onCancel={onCancel} onConfirm={onConfirm} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('uploads a picked file in upload mode and fills the URL field with the resolved image URL', async () => {
    const putMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'PUT') return putMock(url, init)
        if (url === '/blog/upload-url') {
          return Promise.resolve(
            jsonResponse({
              uploadUrl: 'https://blob.example.com/upload?sig=abc',
              blobPath: 'x.jpg',
              imageUrl: 'https://blob.example.com/x.jpg',
            })
          )
        }
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
    const onConfirm = vi.fn()
    renderWithIntl(
      <ImagePickerDialog open uploadUrlEndpoint="/blog/upload-url" onCancel={vi.fn()} onConfirm={onConfirm} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }))
    const file = new File(['fake'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Chọn tệp ảnh'), { target: { files: [file] } })

    await waitFor(() => expect(screen.getByLabelText('Đường dẫn ảnh')).toHaveValue('https://blob.example.com/x.jpg'))
    expect(putMock).toHaveBeenCalledWith(
      'https://blob.example.com/upload?sig=abc',
      expect.objectContaining({ method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': 'image/jpeg' } })
    )

    fireEvent.change(screen.getByLabelText('Mô tả ảnh (alt text)'), { target: { value: 'Ảnh sản phẩm' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))
    expect(onConfirm).toHaveBeenCalledWith({ url: 'https://blob.example.com/x.jpg', alt: 'Ảnh sản phẩm' })
  })
})
