import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqForm from './FaqForm'
import type { FaqItem } from '@/lib/faq'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_ITEM: FaqItem = {
  id: 5,
  categories: ['account'],
  question: 'Câu hỏi hiện có?',
  answerMarkdown: 'Trả lời hiện có.',
  highlightIcon: 'info',
  highlightText: 'Ghi chú hiện có.',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('FaqForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('POSTs to /api/faq when creating and redirects to the list on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<FaqForm />)
    fireEvent.change(screen.getByLabelText('Câu hỏi'), { target: { value: 'Câu hỏi mới?' } })
    fireEvent.change(screen.getByLabelText('Câu trả lời (Markdown)'), { target: { value: 'Trả lời mới.' } })
    fireEvent.click(screen.getByLabelText('Trắc nghiệm Personal Color'))
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/faq'))
    expect(fetch).toHaveBeenCalledWith('/api/faq', expect.objectContaining({ method: 'POST' }))
  })

  it('pre-fills fields and PUTs to /api/faq/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_ITEM }))
    renderWithIntl(<FaqForm initialItem={EXISTING_ITEM} />)
    expect(screen.getByLabelText('Câu hỏi')).toHaveValue('Câu hỏi hiện có?')
    expect(screen.getByLabelText('Tài khoản & Dữ liệu')).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/faq'))
    expect(fetch).toHaveBeenCalledWith('/api/faq/5', expect.objectContaining({ method: 'PUT' }))
  })

  it('shows field errors returned by the API instead of redirecting', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ errors: { question: 'Câu hỏi không được để trống' } }),
      })
    )
    renderWithIntl(<FaqForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => expect(screen.getByText('Câu hỏi không được để trống')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
