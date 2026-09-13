import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { QuizQuestion } from '@/lib/db'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const QUESTIONS: QuizQuestion[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  questionText: `Câu hỏi số ${index + 1}?`,
  sortOrder: index,
  options: [
    { id: index * 10 + 1, label: 'A', season: 'spring', sortOrder: 0 },
    { id: index * 10 + 2, label: 'B', season: 'summer', sortOrder: 1 },
  ],
}))

vi.mock('@/lib/db', () => ({
  getQuizQuestions: () => QUESTIONS,
}))

vi.mock('@/lib/getDb', () => ({ getDb: () => ({}) }))

describe('QuizPage', async () => {
  const { default: QuizPage } = await import('./page')

  it('renders the quiz heading and first question', () => {
    renderWithIntl(<QuizPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kiểm Tra Personal Color' })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi 1/5')).toBeInTheDocument()
  })
})
