import { PALETTES } from './palettes'

export function resolvePaletteIndex(paletteId: string | null): number {
  if (paletteId === null) return 0
  const index = PALETTES.findIndex((palette) => palette.id === paletteId)
  return index === -1 ? 0 : index
}
