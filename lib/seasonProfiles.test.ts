import { describe, expect, it } from 'vitest'
import { SEASON_PROFILES } from './seasonProfiles'
import { SUB_SEASONS } from './db'

describe('seasonProfiles', () => {
  it('has a profile for every sub-season', () => {
    for (const subSeason of SUB_SEASONS) {
      expect(SEASON_PROFILES[subSeason]).toBeDefined()
    }
  })

  it('gives every profile a non-empty display name, description, and palette', () => {
    for (const subSeason of SUB_SEASONS) {
      const profile = SEASON_PROFILES[subSeason]
      expect(profile.displayName.length).toBeGreaterThan(0)
      expect(profile.description.length).toBeGreaterThan(0)
      expect(profile.paletteHex.length).toBeGreaterThanOrEqual(6)
      for (const hex of profile.paletteHex) {
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    }
  })

  it('gives every profile all three recommendation categories', () => {
    for (const subSeason of SUB_SEASONS) {
      const { recommendations } = SEASON_PROFILES[subSeason]
      expect(recommendations.outfit.length).toBeGreaterThan(0)
      expect(recommendations.lipstick.length).toBeGreaterThan(0)
      expect(recommendations.accessory.length).toBeGreaterThan(0)
    }
  })
})
