import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuizFlow from './QuizFlow'
import type { QuizQuestion } from '@/lib/db'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function makeQuestion(
  id: number,
  axis: QuizQuestion['axis'],
  text: string,
  imageUrl: string | null = null,
  optionImageUrls: (string | null)[] = []
): QuizQuestion {
  const axisValues =
    axis === 'hue' ? ['warm', 'cool', 'neutral'] : axis === 'value' ? ['dark', 'light', 'medium'] : ['bright', 'muted', 'neutral']
  return {
    id,
    questionText: text,
    axis,
    imageUrl,
    sortOrder: id,
    options: axisValues.map((axisValue, index) => ({
      id: id * 10 + index,
      label: `Lựa chọn ${id}.${index + 1}`,
      axisValue: axisValue as QuizQuestion['options'][number]['axisValue'],
      imageUrl: optionImageUrls[index] ?? null,
      sortOrder: index,
    })),
  }
}

const QUESTIONS: QuizQuestion[] = [
  makeQuestion(1, 'hue', 'Câu hỏi 1?', '/personal-color/quiz/wrist-veins.jpg'),
  makeQuestion(2, 'hue', 'Câu hỏi 2?'),
  makeQuestion(3, 'value', 'Câu hỏi 3?'),
  makeQuestion(4, 'chroma', 'Câu hỏi 4?'),
]

function completeQuiz() {
  for (let step = 0; step < QUESTIONS.length; step++) {
    const optionButtons = screen.getAllByRole('button').filter((btn) => btn.dataset.quizOption === 'true')
    fireEvent.click(optionButtons[0])
    const isLast = step === QUESTIONS.length - 1
    const advanceButton = screen.getByRole('button', { name: isLast ? 'Xem kết quả' : 'Tiếp theo' })
    fireEvent.click(advanceButton)
  }
}

describe('QuizFlow', () => {
  beforeEach(() => {
    pushMock.mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          subSeason: 'true-spring',
          parentSeason: 'spring',
          hueResult: 'warm',
          valueResult: 'medium',
          chromaResult: 'neutral',
        }),
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.sessionStorage.clear()
  })

  it('shows the illustrative image only for the question that has one', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    expect(screen.getByAltText('Câu hỏi 1?')).toHaveAttribute('src', '/personal-color/quiz/wrist-veins.jpg')
  })

  it('shows the first question with the Tiếp theo button disabled until an option is picked', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    expect(screen.getByText('Câu hỏi 1/4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeDisabled()
  })

  it('enables Tiếp theo once an option is selected and advances to the next question', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    const optionButtons = screen.getAllByRole('button').filter((btn) => btn.dataset.quizOption === 'true')
    fireEvent.click(optionButtons[0])
    const nextButton = screen.getByRole('button', { name: 'Tiếp theo' })
    expect(nextButton).toBeEnabled()
    fireEvent.click(nextButton)
    expect(screen.getByText('Câu hỏi 2/4')).toBeInTheDocument()
  })

  it('shows "Xem kết quả" on the last question and navigates to the result page once scored', async () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/personal-color/result'))
  })

  it('POSTs all answers as {questionId, optionId} pairs', async () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/quiz-attempts',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
    )
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const sentBody = JSON.parse(init.body as string) as { answers: { questionId: number; optionId: number }[] }
    expect(sentBody.answers).toHaveLength(4)
    expect(sentBody.answers[0]).toEqual({ questionId: 1, optionId: 10 })
  })

  it('saves the full computed result to sessionStorage before navigating', async () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()
    await waitFor(() => expect(pushMock).toHaveBeenCalled())
    const stored = JSON.parse(window.sessionStorage.getItem('twistfit.quizResult') ?? 'null')
    expect(stored?.subSeason).toBe('true-spring')
  })

  it('shows an error and does not navigate if scoring fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({}) }))
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()
    await waitFor(() => expect(screen.getByText(/không thể/i)).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('renders an image for each option that has one, and still lets a text-only option be selected', () => {
    const imagedQuestion = makeQuestion(1, 'hue', 'Câu hỏi ảnh?', null, [
      '/personal-color/quiz/q2-gold.jpg',
      '/personal-color/quiz/q2-silver.jpg',
    ])
    renderWithIntl(<QuizFlow questions={[imagedQuestion]} />)

    expect(screen.getByAltText('Lựa chọn 1.1')).toHaveAttribute('src', '/personal-color/quiz/q2-gold.jpg')
    expect(screen.getByAltText('Lựa chọn 1.2')).toHaveAttribute('src', '/personal-color/quiz/q2-silver.jpg')
    expect(screen.queryByAltText('Lựa chọn 1.3')).not.toBeInTheDocument()

    const optionButtons = screen.getAllByRole('button').filter((btn) => btn.dataset.quizOption === 'true')
    expect(optionButtons).toHaveLength(3)
    fireEvent.click(screen.getByText('Lựa chọn 1.3'))
    expect(screen.getByRole('button', { name: 'Xem kết quả' })).toBeEnabled()
  })

  it('falls back to the plain text option list when no option has an image', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    expect(screen.queryByRole('img', { name: /Lựa chọn/ })).not.toBeInTheDocument()
  })
})
