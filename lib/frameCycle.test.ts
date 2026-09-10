import { describe, expect, it } from 'vitest'
import { nextIndex, prevIndex } from './frameCycle'

describe('nextIndex', () => {
  it('advances by one', () => {
    expect(nextIndex(0, 12)).toBe(1)
  })

  it('wraps from the last index to 0', () => {
    expect(nextIndex(11, 12)).toBe(0)
  })
})

describe('prevIndex', () => {
  it('goes back by one', () => {
    expect(prevIndex(5, 12)).toBe(4)
  })

  it('wraps from 0 to the last index', () => {
    expect(prevIndex(0, 12)).toBe(11)
  })
})
