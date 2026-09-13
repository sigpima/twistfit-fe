import { describe, expect, it } from 'vitest'
import { validateFaqItemBody } from './validate'

const validBody = {
  categories: ['personal-color'],
  question: 'Câu hỏi test?',
  answerMarkdown: 'Nội dung trả lời.',
  highlightIcon: 'palette',
  highlightText: 'Ghi chú.',
}

describe('validateFaqItemBody', () => {
  it('accepts a valid body', () => {
    const result = validateFaqItemBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('accepts a null highlight', () => {
    const result = validateFaqItemBody({ ...validBody, highlightIcon: null, highlightText: null })
    expect('data' in result).toBe(true)
  })

  it('rejects an empty question', () => {
    const result = validateFaqItemBody({ ...validBody, question: '' })
    expect('errors' in result && result.errors.question).toBeDefined()
  })

  it('rejects an empty answer', () => {
    const result = validateFaqItemBody({ ...validBody, answerMarkdown: '' })
    expect('errors' in result && result.errors.answerMarkdown).toBeDefined()
  })

  it('rejects zero categories', () => {
    const result = validateFaqItemBody({ ...validBody, categories: [] })
    expect('errors' in result && result.errors.categories).toBeDefined()
  })

  it('rejects an invalid category', () => {
    const result = validateFaqItemBody({ ...validBody, categories: ['not-a-category'] })
    expect('errors' in result && result.errors.categories).toBeDefined()
  })

  it('rejects an invalid highlight icon', () => {
    const result = validateFaqItemBody({ ...validBody, highlightIcon: 'not-an-icon' })
    expect('errors' in result && result.errors.highlightIcon).toBeDefined()
  })
})
