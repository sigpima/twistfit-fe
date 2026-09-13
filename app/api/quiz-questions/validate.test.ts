import { describe, expect, it } from 'vitest'
import { validateQuizQuestionBody } from './validate'

const validBody = {
  questionText: 'Câu hỏi test?',
  sortOrder: 0,
  options: [
    { label: 'Lựa chọn A', season: 'spring' },
    { label: 'Lựa chọn B', season: 'summer' },
  ],
}

describe('validateQuizQuestionBody', () => {
  it('accepts a valid body', () => {
    const result = validateQuizQuestionBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty question text', () => {
    const result = validateQuizQuestionBody({ ...validBody, questionText: '' })
    expect('errors' in result && result.errors.questionText).toBeDefined()
  })

  it('rejects fewer than 2 options', () => {
    const result = validateQuizQuestionBody({ ...validBody, options: [validBody.options[0]] })
    expect('errors' in result && result.errors.options).toBeDefined()
  })

  it('rejects an option with an invalid season', () => {
    const result = validateQuizQuestionBody({
      ...validBody,
      options: [{ label: 'A', season: 'not-a-season' }, validBody.options[1]],
    })
    expect('errors' in result && result.errors['options.0.season']).toBeDefined()
  })

  it('rejects an option with an empty label', () => {
    const result = validateQuizQuestionBody({
      ...validBody,
      options: [{ label: '', season: 'spring' }, validBody.options[1]],
    })
    expect('errors' in result && result.errors['options.0.label']).toBeDefined()
  })
})
