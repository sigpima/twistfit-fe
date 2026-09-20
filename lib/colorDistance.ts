import { PALETTES } from './palettes'

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
}

function colorDistance(hexA: string, hexB: string): number {
  const [ra, ga, ba] = hexToRgb(hexA)
  const [rb, gb, bb] = hexToRgb(hexB)
  return Math.sqrt((ra - rb) ** 2 + (ga - gb) ** 2 + (ba - bb) ** 2)
}

/** Closest distance from any of `colors` to any of `referenceColors`. */
export function closestColorDistance(colors: string[], referenceColors: string[]): number {
  let closest = Infinity
  for (const color of colors) {
    for (const reference of referenceColors) {
      const distance = colorDistance(color, reference)
      if (distance < closest) closest = distance
    }
  }
  return closest
}

/** Union of every sub-season palette's colors for a parent season (e.g. "spring"). */
export function getSeasonReferenceColors(parentSeason: string): string[] {
  return PALETTES.filter((palette) => palette.id.startsWith(`${parentSeason}-`)).flatMap((palette) => palette.colors)
}
