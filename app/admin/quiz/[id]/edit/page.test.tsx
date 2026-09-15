import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import EditQuizQuestionPage from './page'
import type { QuizQuestion } from '@/lib/db'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const QUESTION: QuizQuestion = {
  id: 3,
  questionText: 'Câu hỏi cần sửa?',
  axis: 'hue',
  imageUrl: null,
  sortOrder: 0,
  options: [{ id: 1, label: 'A', axisValue: 'warm', sortOrder: 0 }],
}

describe('EditQuizQuestionPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', role: 'admin' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => QUESTION }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('fetches the question by id and pre-fills the form', async () => {
    renderWithIntl(
      <AuthProvider>
        <EditQuizQuestionPage params={Promise.resolve({ id: '3' })} />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByLabelText('Nội dung câu hỏi')).toHaveValue('Câu hỏi cần sửa?'))
    expect(fetch).toHaveBeenCalledWith('/quiz-questions/3', { credentials: 'include' })
  })
})
