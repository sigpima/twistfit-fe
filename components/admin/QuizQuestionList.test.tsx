import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuizQuestionList from './QuizQuestionList'
import type { QuizQuestion } from '@/lib/db'

const QUESTIONS: QuizQuestion[] = [
  { id: 1, questionText: 'Câu 1?', sortOrder: 0, options: [{ id: 1, label: 'A', season: 'spring', sortOrder: 0 }] },
  { id: 2, questionText: 'Câu 2?', sortOrder: 1, options: [{ id: 2, label: 'B', season: 'summer', sortOrder: 0 }] },
]

describe('QuizQuestionList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders questions in order with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => QUESTIONS }))
    renderWithIntl(<QuizQuestionList />)

    await waitFor(() => expect(screen.getByText('Câu 1?')).toBeInTheDocument())
    expect(screen.getAllByRole('link', { name: 'Sửa' })[0]).toHaveAttribute('href', '/admin/quiz/1/edit')
  })

  it('disables "Lên" for the first row and "Xuống" for the last row', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => QUESTIONS }))
    renderWithIntl(<QuizQuestionList />)

    await waitFor(() => expect(screen.getByText('Câu 1?')).toBeInTheDocument())
    const upButtons = screen.getAllByRole('button', { name: 'Lên' })
    const downButtons = screen.getAllByRole('button', { name: 'Xuống' })
    expect(upButtons[0]).toBeDisabled()
    expect(downButtons[1]).toBeDisabled()
  })

  it('swaps sortOrder via PUT when moving a question down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => QUESTIONS }).mockResolvedValue({ ok: true })
    )
    renderWithIntl(<QuizQuestionList />)

    await waitFor(() => expect(screen.getByText('Câu 1?')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('button', { name: 'Xuống' })[0])

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/quiz-questions/1', expect.objectContaining({ method: 'PUT' })))
    expect(fetch).toHaveBeenCalledWith('/api/quiz-questions/2', expect.objectContaining({ method: 'PUT' }))
  })

  it('deletes a question when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => QUESTIONS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<QuizQuestionList />)

    await waitFor(() => expect(screen.getByText('Câu 1?')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0])

    await waitFor(() => expect(screen.queryByText('Câu 1?')).not.toBeInTheDocument())
  })
})
