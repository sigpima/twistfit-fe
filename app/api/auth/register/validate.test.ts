import { describe, expect, it } from 'vitest'
import { validateRegisterBody } from './validate'

const validBody = {
  name: 'Nguyễn Văn Test',
  email: 'test@twistfit.vn',
  password: 'password123',
}

describe('validateRegisterBody', () => {
  it('accepts a valid body and trims/normalizes fields', () => {
    const result = validateRegisterBody({ ...validBody, name: '  Nguyễn Văn Test  ' })
    expect('data' in result && result.data.name).toBe('Nguyễn Văn Test')
  })

  it('rejects an empty name', () => {
    const result = validateRegisterBody({ ...validBody, name: '  ' })
    expect('errors' in result && result.errors.name).toBeDefined()
  })

  it('rejects an invalid email', () => {
    const result = validateRegisterBody({ ...validBody, email: 'not-an-email' })
    expect('errors' in result && result.errors.email).toBeDefined()
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = validateRegisterBody({ ...validBody, password: 'short' })
    expect('errors' in result && result.errors.password).toBeDefined()
  })

  it('rejects a missing body', () => {
    const result = validateRegisterBody(null)
    expect('errors' in result).toBe(true)
  })
})
