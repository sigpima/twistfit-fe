import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuizFlow from './QuizFlow'
import type { QuizQuestion } from '@/lib/db'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function makeQuestion(id: number, text: string): QuizQuestion {
  return {
    id,
    questionText: text,
    sortOrder: id,
    options: [
      { id: id * 10 + 1, label: `Lựa chọn ${id}.1`, season: 'spring', sortOrder: 0 },
      { id: id * 10 + 2, label: `Lựa chọn ${id}.2`, season: 'summer', sortOrder: 1 },
      { id: id * 10 + 3, label: `Lựa chọn ${id}.3`, season: 'autumn', sortOrder: 2 },
      { id: id * 10 + 4, label: `Lựa chọn ${id}.4`, season: 'winter', sortOrder: 3 },
    ],
  }
}

const QUESTIONS: QuizQuestion[] = [1, 2, 3, 4, 5].map((id) => makeQuestion(id, `Câu hỏi số ${id}?`))

describe('QuizFlow', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('shows the first question with the Tiếp theo button disabled until an option is picked', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    expect(screen.getByText('Câu hỏi 1/5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeDisabled()
  })

  it('enables Tiếp theo once an option is selected and advances to the next question', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    fireEvent.click(screen.getAllByRole('button', { name: /./ })[0])
    const nextButton = screen.getByRole('button', { name: 'Tiếp theo' })
    expect(nextButton).toBeEnabled()
    fireEvent.click(nextButton)
    expect(screen.getByText('Câu hỏi 2/5')).toBeInTheDocument()
  })

  it('shows "Xem kết quả" on the last question and navigates to the result page when finished', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)

    for (let step = 0; step < 5; step++) {
      const optionButtons = screen.getAllByRole('button').filter((btn) => btn.dataset.quizOption === 'true')
      fireEvent.click(optionButtons[0])
      const isLast = step === 4
      const advanceButton = screen.getByRole('button', { name: isLast ? 'Xem kết quả' : 'Tiếp theo' })
      fireEvent.click(advanceButton)
    }

    expect(pushMock).toHaveBeenCalledWith('/personal-color/result')
  })
})
