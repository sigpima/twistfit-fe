import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { FaqItem } from '@/lib/faq'
import FaqPage from './page'

const ITEMS: FaqItem[] = [
  {
    id: 1,
    categories: ['personal-color'],
    question: 'Câu hỏi seed test?',
    answerMarkdown: 'Trả lời seed test.',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('FaqPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the FAQ heading and the seeded question', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEMS }))
    const page = await FaqPage()
    renderWithIntl(page)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi seed test?')).toBeInTheDocument()
  })
})
