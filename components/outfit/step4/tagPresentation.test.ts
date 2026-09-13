import { describe, expect, it } from 'vitest'
import { TAG_VARIANTS } from '@/lib/capsuleWardrobe'
import { TAG_VARIANT_CLASSES } from './tagPresentation'

describe('TAG_VARIANT_CLASSES', () => {
  it('has a class string for every tag variant', () => {
    for (const variant of TAG_VARIANTS) {
      expect(TAG_VARIANT_CLASSES[variant]).toBeTruthy()
    }
  })
})
