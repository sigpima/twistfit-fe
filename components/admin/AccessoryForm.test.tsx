import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AccessoryForm from './AccessoryForm'
import type { AccessoryProduct } from '@/lib/accessories'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_ACCESSORY: AccessoryProduct = {
  id: 9,
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
}

describe('AccessoryForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('pre-fills fields from initialAccessory and PUTs on submit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_ACCESSORY }))
    renderWithIntl(<AccessoryForm initialAccessory={EXISTING_ACCESSORY} />)

    expect(screen.getByLabelText('Tên phụ kiện')).toHaveValue('Túi tote nâu')
    expect(screen.getByLabelText('Link affiliate')).toHaveValue('https://shop.example.com/tote')

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/accessories'))
    expect(fetch).toHaveBeenCalledWith(
      '/api/accessories/9',
      expect.objectContaining({ method: 'PUT', credentials: 'include' })
    )
  })

  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<AccessoryForm initialAccessory={EXISTING_ACCESSORY} />)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })

  function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
    return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
  }

  it('walks through upload, Gemini suggestion, and creates on submit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          uploadUrl: 'https://blob.example.com/upload?sig=abc',
          blobPath: 'x.png',
          blobUrl: 'https://blob.example.com/x.png',
        })
      )
      .mockResolvedValueOnce({ ok: true }) // the raw PUT to blob storage
      .mockResolvedValueOnce(
        jsonResponse({
          category: 'tui-xach',
          styleTags: ['casual'],
          occasionTags: ['hang-ngay'],
          toneTags: ['autumn'],
          blobUrl: 'https://blob.example.com/x.png',
        })
      )
      .mockResolvedValueOnce(jsonResponse({ id: 1 }, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(<AccessoryForm />)

    const file = new File(['fake-image'], 'tote.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Tải ảnh phụ kiện lên'), { target: { files: [file] } })

    await waitFor(() => expect(screen.getByLabelText('Tên phụ kiện')).toBeInTheDocument())
    expect(screen.getByRole('checkbox', { name: 'casual' })).toBeChecked()

    fireEvent.change(screen.getByLabelText('Tên phụ kiện'), { target: { value: 'Túi tote nâu' } })
    fireEvent.change(screen.getByLabelText('Link affiliate'), { target: { value: 'https://shop.example.com/tote' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo phụ kiện' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/accessories'))
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/accessories',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    )
  })

  it('disables submit and lists which tag fields are missing when style/occasion tags are empty', async () => {
    const noTags: AccessoryProduct = { ...EXISTING_ACCESSORY, styleTags: [], occasionTags: [] }
    vi.stubGlobal('fetch', vi.fn())
    renderWithIntl(<AccessoryForm initialAccessory={noTags} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Chọn ít nhất 1 giá trị cho: Phong cách phù hợp, Dịp phù hợp')
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled()
  })

  it('shows the specific backend validation message when submission is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ detail: 'Chọn ít nhất 1 tag dịp' }) })
    )
    renderWithIntl(<AccessoryForm initialAccessory={EXISTING_ACCESSORY} />)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(screen.getByText('Chọn ít nhất 1 tag dịp')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('still reaches manual tagging when the suggest-tags request itself fails (not just a Gemini-internal failure)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          uploadUrl: 'https://blob.example.com/upload?sig=abc',
          blobPath: 'x.png',
          blobUrl: 'https://blob.example.com/x.png',
        })
      )
      .mockResolvedValueOnce({ ok: true }) // the raw PUT to blob storage
      // A proxy/timeout killing the connection before the backend's
      // (already-degraded) response gets back — a non-2xx, unlike a
      // Gemini-internal failure which the backend still answers as 200.
      .mockResolvedValueOnce(jsonResponse(null, { ok: false, status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(<AccessoryForm />)

    const file = new File(['fake-image'], 'tote.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Tải ảnh phụ kiện lên'), { target: { files: [file] } })

    await waitFor(() => expect(screen.getByLabelText('Tên phụ kiện')).toBeInTheDocument())
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://blob.example.com/x.png')
    expect(screen.getByRole('checkbox', { name: 'casual' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Tạo phụ kiện' })).toBeDisabled()
  })
})
