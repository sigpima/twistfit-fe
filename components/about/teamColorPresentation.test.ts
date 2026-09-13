import { describe, expect, it } from 'vitest'
import { COLOR_VARIANTS } from '@/lib/team'
import { COLOR_VARIANT_CLASSES } from './teamColorPresentation'

describe('COLOR_VARIANT_CLASSES', () => {
  it('has a class string for every color variant', () => {
    for (const variant of COLOR_VARIANTS) {
      expect(COLOR_VARIANT_CLASSES[variant]).toMatch(/^text-/)
    }
  })
})
