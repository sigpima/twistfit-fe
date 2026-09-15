import { describe, expect, it } from 'vitest'
import { HERO_SLIDESHOW_MOBILE_IMAGES, HERO_SLIDESHOW_DESKTOP_IMAGES } from './heroSlideshowImages'

describe('heroSlideshowImages', () => {
  it('has 33 images in each set', () => {
    expect(HERO_SLIDESHOW_MOBILE_IMAGES).toHaveLength(33)
    expect(HERO_SLIDESHOW_DESKTOP_IMAGES).toHaveLength(33)
  })

  it('points the mobile set at the mobile directory and the desktop set at the desktop directory', () => {
    for (const image of HERO_SLIDESHOW_MOBILE_IMAGES) {
      expect(image.src).toMatch(/^\/home\/hero-slideshow\/mobile\/img-\d+\.jpg$/)
    }
    for (const image of HERO_SLIDESHOW_DESKTOP_IMAGES) {
      expect(image.src).toMatch(/^\/home\/hero-slideshow\/desktop\/img-\d+\.jpg$/)
    }
  })

  it('uses decorative empty alt text on every image', () => {
    for (const image of [...HERO_SLIDESHOW_MOBILE_IMAGES, ...HERO_SLIDESHOW_DESKTOP_IMAGES]) {
      expect(image.alt).toBe('')
    }
  })

  it('has unique src values within each set', () => {
    expect(new Set(HERO_SLIDESHOW_MOBILE_IMAGES.map((i) => i.src)).size).toBe(33)
    expect(new Set(HERO_SLIDESHOW_DESKTOP_IMAGES.map((i) => i.src)).size).toBe(33)
  })
})
