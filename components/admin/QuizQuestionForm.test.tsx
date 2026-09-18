import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuizQuestionForm from './QuizQuestionForm'
import type { QuizQuestion } from '@/lib/db'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_QUESTION: QuizQuestion = {
  id: 9,
  questionText: 'Câu hỏi hiện có?',
  axis: 'hue',
  imageUrl: null,
  sortOrder: 0,
  options: [
    { id: 1, label: 'Lựa chọn 1', axisValue: 'warm', imageUrl: null, sortOrder: 0 },
    { id: 2, label: 'Lựa chọn 2', axisValue: 'cool', imageUrl: null, sortOrder: 1 },
  ],
}

describe('QuizQuestionForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('starts with 4 empty options when creating', () => {
    renderWithIntl(<QuizQuestionForm />)
    expect(screen.getAllByLabelText(/Lựa chọn \d/)).toHaveLength(4)
  })

  it('can add and remove options', () => {
    renderWithIntl(<QuizQuestionForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Thêm lựa chọn' }))
    expect(screen.getAllByLabelText(/Lựa chọn \d/)).toHaveLength(5)

    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa lựa chọn' })[0])
    expect(screen.getAllByLabelText(/Lựa chọn \d/)).toHaveLength(4)
  })

  it('POSTs to /api/quiz-questions when creating and redirects on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<QuizQuestionForm />)
    fireEvent.change(screen.getByLabelText('Nội dung câu hỏi'), { target: { value: 'Câu hỏi mới?' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/quiz'))
    expect(fetch).toHaveBeenCalledWith('/quiz-questions', expect.objectContaining({ method: 'POST', credentials: 'include' }))
  })

  it('pre-fills fields and PUTs to /api/quiz-questions/{id} when editing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_QUESTION }))
    renderWithIntl(<QuizQuestionForm initialQuestion={EXISTING_QUESTION} />)
    expect(screen.getByLabelText('Nội dung câu hỏi')).toHaveValue('Câu hỏi hiện có?')
    expect(screen.getAllByLabelText(/Lựa chọn \d/)).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/quiz'))
    expect(fetch).toHaveBeenCalledWith('/quiz-questions/9', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
  })

  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<QuizQuestionForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })

  it("changing the axis resets each option to that axis's first valid value", () => {
    renderWithIntl(<QuizQuestionForm />)
    fireEvent.change(screen.getByLabelText('Trục'), { target: { value: 'value' } })
    const axisValueSelects = screen.getAllByLabelText(/Giá trị trục/)
    expect(axisValueSelects[0]).toHaveValue('dark')
  })

  it('renders the image URL field and includes it in the submitted body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 1 }) }))
    renderWithIntl(<QuizQuestionForm />)
    fireEvent.change(screen.getByLabelText('Nội dung câu hỏi'), { target: { value: 'Câu hỏi test?' } })
    fireEvent.change(screen.getByLabelText('URL ảnh minh hoạ (không bắt buộc)'), {
      target: { value: '/personal-color/quiz/wrist-veins.jpg' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(init.body as string)
    expect(body.imageUrl).toBe('/personal-color/quiz/wrist-veins.jpg')
  })
})
