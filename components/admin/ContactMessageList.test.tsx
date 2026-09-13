import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ContactMessageList from './ContactMessageList'
import type { ContactMessage } from '@/lib/contact'

const MESSAGES: ContactMessage[] = [
  {
    id: 1,
    name: 'Nguyễn Văn A',
    email: 'a@twistfit.vn',
    phone: '0909123456',
    subject: 'stylist',
    message: 'Tôi muốn hợp tác',
    isRead: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('ContactMessageList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders messages with subject label and unread badge', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MESSAGES }))
    renderWithIntl(<ContactMessageList />)

    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/contact')
    expect(screen.getByText('Đăng ký hợp tác Stylist / Fashion KOL')).toBeInTheDocument()
    expect(screen.getByLabelText('Chưa đọc')).toBeInTheDocument()
  })

  it('expands a message to show details and lets the admin mark it read', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => MESSAGES })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ...MESSAGES[0], isRead: true }) })
    )
    renderWithIntl(<ContactMessageList />)
    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Nguyễn Văn A'))
    expect(screen.getByText(/Tôi muốn hợp tác/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Đánh dấu đã đọc' }))
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/contact/1',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ isRead: true }) })
      )
    )
  })

  it('deletes a message when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => MESSAGES }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<ContactMessageList />)
    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Nguyễn Văn A'))
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Nguyễn Văn A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/api/contact/1', { method: 'DELETE' })
  })

  it('shows an empty state when there are no messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<ContactMessageList />)
    await waitFor(() => expect(screen.getByText('Chưa có tin nhắn nào.')).toBeInTheDocument())
  })
})
