import {
  FAQ_CATEGORIES,
  FAQ_HIGHLIGHT_ICONS,
  type FaqCategory,
  type FaqHighlightIcon,
  type FaqItemInput,
} from '@/lib/faq'

type RawFaqBody = {
  categories?: unknown
  question?: unknown
  answerMarkdown?: unknown
  highlightIcon?: unknown
  highlightText?: unknown
}

export function validateFaqItemBody(
  body: unknown
): { errors: Record<string, string> } | { data: FaqItemInput } {
  const raw = (body ?? {}) as RawFaqBody
  const errors: Record<string, string> = {}

  const question = typeof raw.question === 'string' ? raw.question.trim() : ''
  if (!question) errors.question = 'Câu hỏi không được để trống'

  const answerMarkdown = typeof raw.answerMarkdown === 'string' ? raw.answerMarkdown.trim() : ''
  if (!answerMarkdown) errors.answerMarkdown = 'Câu trả lời không được để trống'

  const rawCategories = Array.isArray(raw.categories) ? (raw.categories as unknown[]) : []
  const categories = rawCategories.filter((value): value is FaqCategory =>
    FAQ_CATEGORIES.includes(value as FaqCategory)
  )
  if (categories.length === 0) errors.categories = 'Chọn ít nhất 1 chuyên mục'

  let highlightIcon: FaqHighlightIcon | null = null
  if (raw.highlightIcon !== null && raw.highlightIcon !== undefined && raw.highlightIcon !== '') {
    if (!FAQ_HIGHLIGHT_ICONS.includes(raw.highlightIcon as FaqHighlightIcon)) {
      errors.highlightIcon = 'Icon không hợp lệ'
    } else {
      highlightIcon = raw.highlightIcon as FaqHighlightIcon
    }
  }

  const highlightText =
    typeof raw.highlightText === 'string' && raw.highlightText.trim() ? raw.highlightText.trim() : null

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { categories, question, answerMarkdown, highlightIcon, highlightText } }
}
