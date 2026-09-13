import { describe, expect, it } from 'vitest'
import { estimateReadingMinutes } from './readingTime'

describe('estimateReadingMinutes', () => {
  it('rounds to the nearest minute at 200 words/minute', () => {
    const content = Array(400).fill('từ').join(' ')
    expect(estimateReadingMinutes(content)).toBe(2)
  })

  it('never returns less than 1 minute for non-empty content', () => {
    expect(estimateReadingMinutes('Vài từ ngắn')).toBe(1)
  })
})
