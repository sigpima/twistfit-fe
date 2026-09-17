import { describe, expect, it } from 'vitest'
import { SUB_SEASONS } from './db'
import { PALETTES } from './palettes'
import { subSeasonToPaletteId } from './subSeasonToPaletteId'

describe('subSeasonToPaletteId', () => {
  it('maps a known sub-season to its matching palette id', () => {
    expect(subSeasonToPaletteId('true-winter')).toBe('winter-cool')
    expect(subSeasonToPaletteId('light-spring')).toBe('spring-light')
  })

  it('maps every sub-season to a palette id that actually exists in PALETTES', () => {
    const paletteIds = new Set(PALETTES.map((palette) => palette.id))
    for (const subSeason of SUB_SEASONS) {
      expect(paletteIds.has(subSeasonToPaletteId(subSeason))).toBe(true)
    }
  })

  it('maps all 12 sub-seasons to 12 distinct palette ids', () => {
    const mapped = SUB_SEASONS.map((subSeason) => subSeasonToPaletteId(subSeason))
    expect(new Set(mapped).size).toBe(12)
  })
})
