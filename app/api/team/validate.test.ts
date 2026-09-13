import { describe, expect, it } from 'vitest'
import { validateTeamMemberBody } from './validate'

const validBody = {
  image: '/about/team-test.jpg',
  name: 'Nguyễn Văn Test',
  role: 'Test Role',
  bio: 'Tiểu sử test.',
  badgeVariant: 'primary',
  roleVariant: 'primary',
  footerIcon: 'verified',
  footerLabel: 'Footer label test',
}

describe('validateTeamMemberBody', () => {
  it('accepts a valid body', () => {
    const result = validateTeamMemberBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = validateTeamMemberBody({ ...validBody, name: '' })
    expect('errors' in result && result.errors.name).toBeDefined()
  })

  it('rejects an empty bio', () => {
    const result = validateTeamMemberBody({ ...validBody, bio: '' })
    expect('errors' in result && result.errors.bio).toBeDefined()
  })

  it('rejects an invalid badge variant', () => {
    const result = validateTeamMemberBody({ ...validBody, badgeVariant: 'not-a-variant' })
    expect('errors' in result && result.errors.badgeVariant).toBeDefined()
  })

  it('rejects an invalid role variant', () => {
    const result = validateTeamMemberBody({ ...validBody, roleVariant: 'not-a-variant' })
    expect('errors' in result && result.errors.roleVariant).toBeDefined()
  })
})
