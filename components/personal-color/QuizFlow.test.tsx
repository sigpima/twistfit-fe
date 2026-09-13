import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
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

function completeQuiz() {
  for (let step = 0; step < 5; step++) {
    const optionButtons = screen.getAllByRole('button').filter((btn) => btn.dataset.quizOption === 'true')
    fireEvent.click(optionButtons[0])
    const isLast = step === 4
    const advanceButton = screen.getByRole('button', { name: isLast ? 'Xem kết quả' : 'Tiếp theo' })
    fireEvent.click(advanceButton)
  }
}

describe('QuizFlow', () => {
  beforeEach(() => {
    pushMock.mockClear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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
    completeQuiz()
    expect(pushMock).toHaveBeenCalledWith('/personal-color/result')
  })

  it('records the computed season via a fire-and-forget POST to /api/quiz-attempts', async () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/quiz-attempts', expect.objectContaining({ method: 'POST' }))
    )
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const sentBody = JSON.parse(init.body as string) as { season: string }
    expect(['spring', 'summer', 'autumn', 'winter']).toContain(sentBody.season)
  })

  it('still navigates to the result page even if the tracking request fails', () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()
    expect(pushMock).toHaveBeenCalledWith('/personal-color/result')
  })
})
