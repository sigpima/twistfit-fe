import { describe, expect, it } from 'vitest'
import { isMobileDevice } from './isMobileDevice'

describe('isMobileDevice', () => {
  it('detects an iPhone user agent as mobile', () => {
    expect(
      isMobileDevice(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
      )
    ).toBe(true)
  })

  it('detects an Android user agent as mobile', () => {
    expect(
      isMobileDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36')
    ).toBe(true)
  })

  it('detects an iPad user agent as mobile', () => {
    expect(
      isMobileDevice('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15')
    ).toBe(true)
  })

  it('does not detect a desktop Windows user agent as mobile', () => {
    expect(
      isMobileDevice(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
      )
    ).toBe(false)
  })

  it('does not detect a desktop macOS user agent as mobile', () => {
    expect(
      isMobileDevice(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'
      )
    ).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isMobileDevice('')).toBe(false)
  })
})
