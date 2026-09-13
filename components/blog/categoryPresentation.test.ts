import { describe, expect, it } from 'vitest'
import { BLOG_CATEGORIES } from '@/lib/db'
import { CATEGORY_PRESENTATION } from './categoryPresentation'

describe('CATEGORY_PRESENTATION', () => {
  it('has an entry for every blog category', () => {
    for (const category of BLOG_CATEGORIES) {
      expect(CATEGORY_PRESENTATION[category]).toBeDefined()
      expect(CATEGORY_PRESENTATION[category].translationKey).toBeTruthy()
      expect(CATEGORY_PRESENTATION[category].colorClass).toMatch(/^text-/)
    }
  })

  it('maps personal-color to the personalColor translation key', () => {
    expect(CATEGORY_PRESENTATION['personal-color'].translationKey).toBe('personalColor')
  })
})
