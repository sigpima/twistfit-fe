import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditFaqPage from './page'
import type { FaqItem } from '@/lib/faq'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const ITEM: FaqItem = {
  id: 7,
  categories: ['account'],
  question: 'Câu hỏi cần sửa?',
  answerMarkdown: 'Trả lời cần sửa.',
  highlightIcon: null,
  highlightText: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('EditFaqPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEM }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the item by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditFaqPage params={Promise.resolve({ id: '7' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Câu hỏi')).toHaveValue('Câu hỏi cần sửa?'))
    expect(fetch).toHaveBeenCalledWith('/faq/7', { credentials: 'include' })
  })
})
