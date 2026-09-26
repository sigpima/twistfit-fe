import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import messages from '@/messages/vi.json'
import ImagePickerDialog from './ImagePickerDialog'

// `rerender` from RTL replaces the tree at the same root without re-adding
// whatever provider renderWithIntl's *first* render wrapped it in, so a
// rerender-driven test needs its own explicit provider wrapper.
function withIntl(ui: ReactElement) {
  return (
    <NextIntlClientProvider locale="vi" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
}

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
    expect(onConfirm).toHaveBeenCalledWith({ url: 'https://example.com/a.jpg', alt: 'Mô tả', caption: '' })
  })

  it('confirms with an optional caption', () => {
    const onConfirm = vi.fn()
    renderWithIntl(
      <ImagePickerDialog open uploadUrlEndpoint="/blog/upload-url" onCancel={vi.fn()} onConfirm={onConfirm} />
    )
    fireEvent.change(screen.getByLabelText('Đường dẫn ảnh'), { target: { value: 'https://example.com/a.jpg' } })
    fireEvent.change(screen.getByLabelText('Mô tả ảnh (alt text)'), { target: { value: 'Mô tả' } })
    fireEvent.change(screen.getByLabelText('Chú thích ảnh (hiện bên dưới ảnh, để trống nếu không cần)'), {
      target: { value: 'Ảnh minh họa cho bài viết' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))
    expect(onConfirm).toHaveBeenCalledWith({
      url: 'https://example.com/a.jpg',
      alt: 'Mô tả',
      caption: 'Ảnh minh họa cho bài viết',
    })
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
    expect(onConfirm).toHaveBeenCalledWith({ url: 'https://example.com/a.jpg', alt: '', caption: '' })
  })

  it('pre-fills fields from initialUrl/initialAlt/initialCaption, for editing an existing image', () => {
    renderWithIntl(
      <ImagePickerDialog
        open
        uploadUrlEndpoint="/blog/upload-url"
        initialUrl="https://example.com/existing.jpg"
        initialAlt="Mô tả hiện có"
        initialCaption="Chú thích hiện có"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Đường dẫn ảnh')).toHaveValue('https://example.com/existing.jpg')
    expect(screen.getByLabelText('Mô tả ảnh (alt text)')).toHaveValue('Mô tả hiện có')
    expect(screen.getByLabelText('Chú thích ảnh (hiện bên dưới ảnh, để trống nếu không cần)')).toHaveValue(
      'Chú thích hiện có'
    )
  })

  it('hides the caption field when showCaption is false', () => {
    renderWithIntl(
      <ImagePickerDialog
        open
        showCaption={false}
        uploadUrlEndpoint="/blog/upload-url"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(
      screen.queryByLabelText('Chú thích ảnh (hiện bên dưới ảnh, để trống nếu không cần)')
    ).not.toBeInTheDocument()
  })

  it('resets to the new initial values each time it reopens, for editing a different image next', () => {
    const { rerender } = renderWithIntl(
      <ImagePickerDialog
        open={false}
        uploadUrlEndpoint="/blog/upload-url"
        initialUrl="https://example.com/first.jpg"
        initialAlt="Ảnh thứ nhất"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    rerender(
      withIntl(
        <ImagePickerDialog
          open
          uploadUrlEndpoint="/blog/upload-url"
          initialUrl="https://example.com/first.jpg"
          initialAlt="Ảnh thứ nhất"
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      )
    )
    expect(screen.getByLabelText('Mô tả ảnh (alt text)')).toHaveValue('Ảnh thứ nhất')

    rerender(
      withIntl(
        <ImagePickerDialog open={false} uploadUrlEndpoint="/blog/upload-url" onCancel={vi.fn()} onConfirm={vi.fn()} />
      )
    )
    rerender(
      withIntl(
        <ImagePickerDialog
          open
          uploadUrlEndpoint="/blog/upload-url"
          initialUrl="https://example.com/second.jpg"
          initialAlt="Ảnh thứ hai"
          onCancel={vi.fn()}
          onConfirm={vi.fn()}
        />
      )
    )
    expect(screen.getByLabelText('Mô tả ảnh (alt text)')).toHaveValue('Ảnh thứ hai')
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
        if (url === '/api/blog/upload-url?content_type=image%2Fjpeg') {
          return Promise.resolve(
            jsonResponse({
              uploadUrl: 'https://blob.example.com/upload?sig=abc',
              blobPath: 'x.jpg',
              imageUrl: 'https://blob.example.com/x.jpg',
            })
          )
        }
        if (url === '/api/blog/upload-url?content_type=image%2Fwebp') {
          return Promise.resolve(
            jsonResponse({
              uploadUrl: 'https://blob.example.com/upload?sig=def',
              blobPath: 'x.webp',
              imageUrl: 'https://blob.example.com/x.webp',
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
      expect.objectContaining({ method: 'PUT', headers: { 'Content-Type': 'image/jpeg' } })
    )

    fireEvent.change(screen.getByLabelText('Mô tả ảnh (alt text)'), { target: { value: 'Ảnh sản phẩm' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))
    expect(onConfirm).toHaveBeenCalledWith({ url: 'https://blob.example.com/x.jpg', alt: 'Ảnh sản phẩm', caption: '' })
  })

  it('uploads a webp file successfully', async () => {
    const putMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'PUT') return putMock(url, init)
        if (url === '/api/blog/upload-url?content_type=image%2Fwebp') {
          return Promise.resolve(
            jsonResponse({
              uploadUrl: 'https://blob.example.com/upload?sig=def',
              blobPath: 'x.webp',
              imageUrl: 'https://blob.example.com/x.webp',
            })
          )
        }
        return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
      })
    )
    renderWithIntl(<ImagePickerDialog open uploadUrlEndpoint="/blog/upload-url" onCancel={vi.fn()} onConfirm={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }))
    const file = new File(['fake'], 'photo.webp', { type: 'image/webp' })
    fireEvent.change(screen.getByLabelText('Chọn tệp ảnh'), { target: { files: [file] } })

    await waitFor(() => expect(screen.getByLabelText('Đường dẫn ảnh')).toHaveValue('https://blob.example.com/x.webp'))
  })

  it('rejects an unsupported file type without calling the upload API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderWithIntl(<ImagePickerDialog open uploadUrlEndpoint="/blog/upload-url" onCancel={vi.fn()} onConfirm={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }))
    const file = new File(['fake'], 'notes.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Chọn tệp ảnh'), { target: { files: [file] } })

    expect(
      await screen.findByText('Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG, GIF hoặc WEBP.')
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
