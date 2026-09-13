import { describe, expect, it } from 'vitest'
import { validateStatusChangeBody } from './validateStatus'

describe('validateStatusChangeBody', () => {
  it('allows pending -> published', () => {
    expect('data' in validateStatusChangeBody({ status: 'published' }, 'pending')).toBe(true)
  })

  it('allows pending -> rejected', () => {
    expect('data' in validateStatusChangeBody({ status: 'rejected' }, 'pending')).toBe(true)
  })

  it('allows published -> hidden', () => {
    expect('data' in validateStatusChangeBody({ status: 'hidden' }, 'published')).toBe(true)
  })

  it('rejects pending -> hidden', () => {
    expect('error' in validateStatusChangeBody({ status: 'hidden' }, 'pending')).toBe(true)
  })

  it('rejects a no-op transition (published -> published)', () => {
    expect('error' in validateStatusChangeBody({ status: 'published' }, 'published')).toBe(true)
  })

  it('rejects transitions out of a terminal state', () => {
    expect('error' in validateStatusChangeBody({ status: 'published' }, 'rejected')).toBe(true)
    expect('error' in validateStatusChangeBody({ status: 'published' }, 'hidden')).toBe(true)
  })

  it('rejects a missing or invalid status', () => {
    expect('error' in validateStatusChangeBody({}, 'pending')).toBe(true)
    expect('error' in validateStatusChangeBody({ status: 'not-a-status' }, 'pending')).toBe(true)
  })
})
