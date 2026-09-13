import { describe, expect, it } from 'vitest'
import { validateCapsuleSetBody } from './validate'

const validBody = {
  image: '/outfit/capsule-set-test.jpg',
  alt: 'Ảnh test',
  tagVariant: 'primary',
  tagLabel: 'Set Test',
  fitFor: 'Phù hợp: Test',
  title: 'Tiêu đề test',
  tone: 'Test Tone',
  description: 'Mô tả test',
  items: [
    { label: 'Món đồ A:', price: '100.000 ₫' },
    { label: 'Món đồ B:', price: '200.000 ₫' },
  ],
}

describe('validateCapsuleSetBody', () => {
  it('accepts a valid body', () => {
    const result = validateCapsuleSetBody(validBody)
    expect('data' in result).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = validateCapsuleSetBody({ ...validBody, title: '' })
    expect('errors' in result && result.errors.title).toBeDefined()
  })

  it('rejects an invalid tag variant', () => {
    const result = validateCapsuleSetBody({ ...validBody, tagVariant: 'not-a-variant' })
    expect('errors' in result && result.errors.tagVariant).toBeDefined()
  })

  it('rejects zero items', () => {
    const result = validateCapsuleSetBody({ ...validBody, items: [] })
    expect('errors' in result && result.errors.items).toBeDefined()
  })

  it('rejects an item with an empty label', () => {
    const result = validateCapsuleSetBody({
      ...validBody,
      items: [{ label: '', price: '100.000 ₫' }],
    })
    expect('errors' in result && result.errors['items.0.label']).toBeDefined()
  })

  it('rejects an item with an empty price', () => {
    const result = validateCapsuleSetBody({
      ...validBody,
      items: [{ label: 'Món đồ:', price: '' }],
    })
    expect('errors' in result && result.errors['items.0.price']).toBeDefined()
  })
})
