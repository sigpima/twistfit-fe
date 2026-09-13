import { SEASONS, type QuizQuestionInput, type Season } from '@/lib/db'

type RawOption = { label?: unknown; season?: unknown }
type RawBody = { questionText?: unknown; sortOrder?: unknown; options?: unknown }

export function validateQuizQuestionBody(
  body: unknown
): { errors: Record<string, string> } | { data: QuizQuestionInput } {
  const raw = (body ?? {}) as RawBody
  const errors: Record<string, string> = {}

  const questionText = typeof raw.questionText === 'string' ? raw.questionText.trim() : ''
  if (!questionText) errors.questionText = 'Nội dung câu hỏi không được để trống'

  const sortOrder = typeof raw.sortOrder === 'number' ? raw.sortOrder : 0

  const rawOptions = Array.isArray(raw.options) ? (raw.options as RawOption[]) : []
  if (rawOptions.length < 2) {
    errors.options = 'Cần ít nhất 2 lựa chọn'
  }

  const options = rawOptions.map((option, index) => {
    const label = typeof option.label === 'string' ? option.label.trim() : ''
    const season = option.season as Season
    if (!label) errors[`options.${index}.label`] = 'Lựa chọn không được để trống'
    if (!SEASONS.includes(season)) errors[`options.${index}.season`] = 'Mùa không hợp lệ'
    return { label, season }
  })

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { questionText, sortOrder, options } }
}
