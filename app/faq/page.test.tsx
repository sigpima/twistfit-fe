import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { FaqItem } from '@/lib/faq'

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

vi.mock('@/lib/getDb', () => ({ getDb: () => ({}) }))
vi.mock('@/lib/faq', async () => {
  const actual = await vi.importActual<typeof import('@/lib/faq')>('@/lib/faq')
  return { ...actual, getFaqItems: () => ITEMS }
})

describe('FaqPage', async () => {
  const { default: FaqPage } = await import('./page')

  it('renders the FAQ heading and the seeded question', () => {
    renderWithIntl(<FaqPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi seed test?')).toBeInTheDocument()
  })
})
