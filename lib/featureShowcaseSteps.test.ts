import { describe, expect, it } from 'vitest'
import { FEATURE_STEP_IMAGES } from './featureShowcaseSteps'

describe('featureShowcaseSteps', () => {
  it('has the right number of steps per feature', () => {
    expect(FEATURE_STEP_IMAGES.colorTest).toHaveLength(3)
    expect(FEATURE_STEP_IMAGES.outfit).toHaveLength(4)
    expect(FEATURE_STEP_IMAGES.community).toHaveLength(3)
  })

  it('uses unique keys within each feature', () => {
    for (const images of Object.values(FEATURE_STEP_IMAGES)) {
      const keys = images.map((image) => image.key)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('points every image at the feature-steps directory as a jpg', () => {
    for (const images of Object.values(FEATURE_STEP_IMAGES)) {
      for (const image of images) {
        expect(image.src).toMatch(/^\/home\/feature-steps\/[a-z0-9-]+\.jpg$/)
      }
    }
  })
})
