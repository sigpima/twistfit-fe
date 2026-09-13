import { describe, expect, it } from 'vitest'
import { validateForumPostBody } from './validate'

const validBody = {
  title: 'Bài viết test',
  body: 'Nội dung test',
  category: 'general',
}

describe('validateForumPostBody', () => {
  it('accepts a valid body', () => {
    const result = validateForumPostBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = validateForumPostBody({ ...validBody, title: '  ' })
    expect('errors' in result && result.errors.title).toBeDefined()
  })

  it('rejects an empty body', () => {
    const result = validateForumPostBody({ ...validBody, body: '  ' })
    expect('errors' in result && result.errors.body).toBeDefined()
  })

  it('rejects an invalid category', () => {
    const result = validateForumPostBody({ ...validBody, category: 'not-a-category' })
    expect('errors' in result && result.errors.category).toBeDefined()
  })

  it('rejects a missing body', () => {
    expect('errors' in validateForumPostBody(null)).toBe(true)
  })
})
