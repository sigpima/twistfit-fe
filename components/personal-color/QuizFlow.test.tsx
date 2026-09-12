import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuizFlow from './QuizFlow'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('QuizFlow', () => {
  beforeEach(() => {
    pushMock.mockClear()
  })

  it('shows the first question with the Tiếp theo button disabled until an option is picked', () => {
    render(<QuizFlow />)
    expect(screen.getByText('Câu hỏi 1/5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeDisabled()
  })

  it('enables Tiếp theo once an option is selected and advances to the next question', () => {
    render(<QuizFlow />)
    fireEvent.click(screen.getAllByRole('button', { name: /./ })[0])
    const nextButton = screen.getByRole('button', { name: 'Tiếp theo' })
    expect(nextButton).toBeEnabled()
    fireEvent.click(nextButton)
    expect(screen.getByText('Câu hỏi 2/5')).toBeInTheDocument()
  })

  it('shows "Xem kết quả" on the last question and navigates to the result page when finished', () => {
    render(<QuizFlow />)

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
