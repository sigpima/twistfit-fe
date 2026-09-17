import type { SubSeason } from './db'

const SUB_SEASON_TO_PALETTE_ID: Record<SubSeason, string> = {
  'light-spring': 'spring-light',
  'true-spring': 'spring-warm',
  'bright-spring': 'spring-bright',
  'light-summer': 'summer-light',
  'true-summer': 'summer-cool',
  'soft-summer': 'summer-soft',
  'soft-autumn': 'autumn-soft',
  'true-autumn': 'autumn-warm',
  'deep-autumn': 'autumn-deep',
  'deep-winter': 'winter-deep',
  'true-winter': 'winter-cool',
  'bright-winter': 'winter-bright',
}

export function subSeasonToPaletteId(subSeason: SubSeason): string {
  return SUB_SEASON_TO_PALETTE_ID[subSeason]
}
