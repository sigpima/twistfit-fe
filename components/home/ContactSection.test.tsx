import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ContactSection from './ContactSection'

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Họ và tên *'), { target: { value: 'Linh Đan' } })
  fireEvent.change(screen.getByLabelText('Địa chỉ Email *'), { target: { value: 'linhdan@gmail.com' } })
  fireEvent.change(screen.getByLabelText('Chủ đề góp ý *'), { target: { value: 'other' } })
  fireEvent.change(screen.getByLabelText('Nội dung tin nhắn *'), { target: { value: 'Xin chào' } })
}

describe('ContactSection', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs the form data to /api/contact and shows a confirmation on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<ContactSection />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /GỬI LỜI NHẮN/ }))

    await waitFor(() => expect(screen.getByText(/Cảm ơn bạn/)).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Linh Đan',
          email: 'linhdan@gmail.com',
          phone: '',
          subject: 'other',
          message: 'Xin chào',
        }),
      })
    )
  })

  it('shows an error message and no confirmation when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ errors: {} }) }))
    renderWithIntl(<ContactSection />)
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /GỬI LỜI NHẮN/ }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(screen.queryByText(/Cảm ơn bạn/)).not.toBeInTheDocument()
  })
})
