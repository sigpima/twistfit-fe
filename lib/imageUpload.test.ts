import { describe, expect, it } from 'vitest'
import { isAllowedImageType } from './imageUpload'

describe('isAllowedImageType', () => {
  it.each(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'])(
    'accepts %s',
    (type) => {
      expect(isAllowedImageType(type)).toBe(true)
    }
  )

  it('rejects an unsupported type', () => {
    expect(isAllowedImageType('application/pdf')).toBe(false)
  })
})
