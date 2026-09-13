import { describe, expect, it } from 'vitest'
import { validateContactMessageBody } from './validate'

const validBody = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  phone: '0909123456',
  subject: 'other',
  message: 'Nội dung test',
}

describe('validateContactMessageBody', () => {
  it('accepts a valid body', () => {
    const result = validateContactMessageBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('accepts a missing phone as null', () => {
    const { phone, ...withoutPhone } = validBody
    void phone
    const result = validateContactMessageBody(withoutPhone)
    expect('data' in result && result.data.phone).toBeNull()
  })

  it('rejects an empty name', () => {
    const result = validateContactMessageBody({ ...validBody, name: '  ' })
    expect('errors' in result && result.errors.name).toBeDefined()
  })

  it('rejects an invalid email', () => {
    const result = validateContactMessageBody({ ...validBody, email: 'not-an-email' })
    expect('errors' in result && result.errors.email).toBeDefined()
  })

  it('rejects an invalid subject', () => {
    const result = validateContactMessageBody({ ...validBody, subject: 'not-a-subject' })
    expect('errors' in result && result.errors.subject).toBeDefined()
  })

  it('rejects an empty message', () => {
    const result = validateContactMessageBody({ ...validBody, message: '  ' })
    expect('errors' in result && result.errors.message).toBeDefined()
  })

  it('rejects a missing body', () => {
    expect('errors' in validateContactMessageBody(null)).toBe(true)
  })
})
