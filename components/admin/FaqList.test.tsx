import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqList from './FaqList'
import type { FaqItem } from '@/lib/faq'

const ITEMS: FaqItem[] = [
  {
    id: 1,
    categories: ['account'],
    question: 'Câu hỏi A',
    answerMarkdown: 'Trả lời A',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('FaqList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders items with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEMS }))
    renderWithIntl(<FaqList />)

    await waitFor(() => expect(screen.getByText('Câu hỏi A')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/faq/1/edit')
  })

  it('deletes an item when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ITEMS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<FaqList />)

    await waitFor(() => expect(screen.getByText('Câu hỏi A')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Câu hỏi A')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/faq/1', { method: 'DELETE', credentials: 'include' })
  })

  it('shows an empty state when there are no items', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<FaqList />)
    await waitFor(() => expect(screen.getByText('Chưa có câu hỏi nào.')).toBeInTheDocument())
  })
})
