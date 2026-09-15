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
  {
    id: 2,
    categories: ['fitting-room'],
    question: 'Câu hỏi phòng thử đồ?',
    answerMarkdown: 'Trả lời phòng thử đồ.',
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

  it('renders the FAQ heading and every seeded question by default', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEMS }))
    const page = await FaqPage({ searchParams: Promise.resolve({}) })
    renderWithIntl(page)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi seed test?')).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi phòng thử đồ?')).toBeInTheDocument()
  })

  it('pre-selects the category from the ?category= search param', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEMS }))
    const page = await FaqPage({ searchParams: Promise.resolve({ category: 'fitting-room' }) })
    renderWithIntl(page)
    expect(screen.getByRole('button', { name: /Phòng thử đồ ảo/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Câu hỏi phòng thử đồ?')).toBeInTheDocument()
    expect(screen.queryByText('Câu hỏi seed test?')).not.toBeInTheDocument()
  })

  it('ignores an invalid category search param and falls back to "all"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEMS }))
    const page = await FaqPage({ searchParams: Promise.resolve({ category: 'not-a-real-category' }) })
    renderWithIntl(page)
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Câu hỏi seed test?')).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi phòng thử đồ?')).toBeInTheDocument()
  })
})
