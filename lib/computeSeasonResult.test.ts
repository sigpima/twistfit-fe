import { describe, expect, it } from 'vitest'
import { computeSeasonResult } from './computeSeasonResult'

describe('computeSeasonResult', () => {
  it('returns the season with the most answers', () => {
    const result = computeSeasonResult(['winter', 'winter', 'summer', 'winter', 'autumn'])
    expect(result).toBe('winter')
  })

  it('returns the only season present when all answers agree', () => {
    const result = computeSeasonResult(['spring', 'spring', 'spring'])
    expect(result).toBe('spring')
  })

  it('breaks ties by picking the first season to reach the max count', () => {
    const result = computeSeasonResult(['summer', 'autumn'])
    expect(result).toBe('summer')
  })
})
