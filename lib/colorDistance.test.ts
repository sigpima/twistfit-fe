import { describe, expect, it } from 'vitest'
import { closestColorDistance, getSeasonReferenceColors } from './colorDistance'

describe('closestColorDistance', () => {
  it('is zero when a color exactly matches a reference color', () => {
    expect(closestColorDistance(['#F2A93B'], ['#000000', '#F2A93B'])).toBe(0)
  })

  it('returns the smallest distance across every color/reference pair', () => {
    const distance = closestColorDistance(['#FFFFFF', '#000000'], ['#010101'])
    // #000000 vs #010101 differs by 1 in each channel: sqrt(1+1+1)
    expect(distance).toBeCloseTo(Math.sqrt(3))
  })

  it('is a large distance between colors on opposite ends of the spectrum', () => {
    expect(closestColorDistance(['#FFFFFF'], ['#000000'])).toBeCloseTo(Math.sqrt(3 * 255 ** 2))
  })
})

describe('getSeasonReferenceColors', () => {
  it('unions every sub-season palette for a given parent season', () => {
    const colors = getSeasonReferenceColors('spring')
    expect(colors.length).toBeGreaterThan(0)
    expect(colors).toContain('#F2A93B') // spring-warm's first color
    expect(colors).toContain('#F6D65A') // spring-light's first color
  })

  it('returns an empty list for an unknown season', () => {
    expect(getSeasonReferenceColors('not-a-season')).toEqual([])
  })

  it('does not cross-contaminate between seasons', () => {
    const springColors = getSeasonReferenceColors('spring')
    const winterOnlyColor = '#0F1F4F' // winter-deep's first color
    expect(springColors).not.toContain(winterOnlyColor)
  })
})
