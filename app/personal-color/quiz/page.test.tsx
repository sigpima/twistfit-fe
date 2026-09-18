import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { QuizQuestion } from '@/lib/db'
import QuizPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const QUESTIONS: QuizQuestion[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  questionText: `Câu hỏi số ${index + 1}?`,
  axis: 'hue',
  imageUrl: null,
  sortOrder: index,
  options: [
    { id: index * 10 + 1, label: 'A', axisValue: 'warm', imageUrl: null, sortOrder: 0 },
    { id: index * 10 + 2, label: 'B', axisValue: 'cool', imageUrl: null, sortOrder: 1 },
  ],
}))

describe('QuizPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the quiz heading and first question', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => QUESTIONS }))
    const page = await QuizPage()
    renderWithIntl(page)
    expect(screen.getByRole('heading', { level: 1, name: 'Kiểm Tra Personal Color' })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi 1/5')).toBeInTheDocument()
  })
})
