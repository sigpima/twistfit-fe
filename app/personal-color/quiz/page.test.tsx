import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import QuizPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('QuizPage', () => {
  it('renders the quiz heading and first question', () => {
    render(<QuizPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kiểm Tra Personal Color' })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi 1/5')).toBeInTheDocument()
  })
})
