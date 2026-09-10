import { describe, expect, it } from 'vitest'
import { PALETTES } from './palettes'

describe('PALETTES', () => {
  it('has exactly 12 entries', () => {
    expect(PALETTES).toHaveLength(12)
  })

  it('has unique ids', () => {
    const ids = PALETTES.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every palette has a name and at least 6 colors', () => {
    for (const palette of PALETTES) {
      expect(palette.name.length).toBeGreaterThan(0)
      expect(palette.colors.length).toBeGreaterThanOrEqual(6)
      for (const color of palette.colors) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    }
  })

  it('covers all 4 seasons', () => {
    const seasons = ['Spring', 'Summer', 'Autumn', 'Winter']
    for (const season of seasons) {
      const matches = PALETTES.filter((p) => p.name.startsWith(season))
      expect(matches).toHaveLength(3)
    }
  })
})
