import { describe, expect, it } from 'vitest'
import { PALETTES } from './palettes'
import { resolvePaletteIndex } from './resolvePaletteIndex'

describe('resolvePaletteIndex', () => {
  it('resolves a known palette id to its index in PALETTES', () => {
    const index = PALETTES.findIndex((palette) => palette.id === 'winter-cool')
    expect(resolvePaletteIndex('winter-cool')).toBe(index)
  })

  it('falls back to 0 when the id is null', () => {
    expect(resolvePaletteIndex(null)).toBe(0)
  })

  it('falls back to 0 when the id does not match any palette', () => {
    expect(resolvePaletteIndex('not-a-real-palette')).toBe(0)
  })
})
