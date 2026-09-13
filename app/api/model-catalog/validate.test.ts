import { describe, expect, it } from 'vitest'
import { validateModelBody } from './validate'

const validBody = {
  name: 'Model Test',
  image: '/outfit/models/test.jpg',
  dossierImage: '/outfit/models/test-dossier.jpg',
  poseCount: 15,
  tagline: 'Tagline test',
  undertone: 'warm',
  height: '1m70',
  bodyShape: 'Đồng hồ cát',
  waist: '66cm',
  personalColor: 'Warm Autumn',
}

describe('validateModelBody', () => {
  it('accepts a valid body', () => {
    const result = validateModelBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = validateModelBody({ ...validBody, name: '' })
    expect('errors' in result && result.errors.name).toBeDefined()
  })

  it('rejects a non-positive pose count', () => {
    const result = validateModelBody({ ...validBody, poseCount: 0 })
    expect('errors' in result && result.errors.poseCount).toBeDefined()
  })

  it('rejects an invalid undertone', () => {
    const result = validateModelBody({ ...validBody, undertone: 'not-a-tone' })
    expect('errors' in result && result.errors.undertone).toBeDefined()
  })

  it('rejects an empty image URL', () => {
    const result = validateModelBody({ ...validBody, image: '' })
    expect('errors' in result && result.errors.image).toBeDefined()
  })
})
