import { describe, expect, it } from 'vitest'
import { buildWedges } from './wedgeGeometry'

describe('buildWedges', () => {
  it('returns one wedge per color, in order', () => {
    const colors = ['#111111', '#222222', '#333333', '#444444']
    const wedges = buildWedges(colors, 100, 100, 50, 90)
    expect(wedges).toHaveLength(4)
    expect(wedges.map((w) => w.color)).toEqual(colors)
  })

  it('every wedge has a non-empty SVG path starting with M', () => {
    const wedges = buildWedges(['#111111', '#222222'], 100, 100, 50, 90)
    for (const wedge of wedges) {
      expect(wedge.path.startsWith('M')).toBe(true)
      expect(wedge.path.length).toBeGreaterThan(0)
    }
  })

  it('returns an empty array for no colors', () => {
    expect(buildWedges([], 100, 100, 50, 90)).toEqual([])
  })
})
