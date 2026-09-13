import { describe, expect, it } from 'vitest'
import {
  signPayload,
  createSessionCookieValue,
  verifySessionCookieValue,
  getAdminSessionFromCookieHeader,
  getSessionFromCookieHeader,
  SESSION_COOKIE_NAME,
  type SessionPayload,
} from './session'

describe('createSessionCookieValue / verifySessionCookieValue', () => {
  it('round-trips a valid, unexpired session', () => {
    const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
    const session = verifySessionCookieValue(value)
    expect(session?.email).toBe('admin@twistfit.vn')
    expect(session?.role).toBe('admin')
  })

  it('rejects a tampered value', () => {
    const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
    const tampered = value.slice(0, -1) + (value.at(-1) === 'a' ? 'b' : 'a')
    expect(verifySessionCookieValue(tampered)).toBeNull()
  })

  it('rejects an expired session', () => {
    const expired: SessionPayload = { email: 'admin@twistfit.vn', role: 'admin', exp: Date.now() - 1000 }
    const value = signPayload(expired)
    expect(verifySessionCookieValue(value)).toBeNull()
  })

  it('rejects a missing or malformed value', () => {
    expect(verifySessionCookieValue(undefined)).toBeNull()
    expect(verifySessionCookieValue(null)).toBeNull()
    expect(verifySessionCookieValue('not-a-valid-token')).toBeNull()
  })
})

describe('getAdminSessionFromCookieHeader', () => {
  it('returns the session when the cookie belongs to an admin', () => {
    const value = createSessionCookieValue('admin@twistfit.vn', 'admin')
    const header = `other=1; ${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; another=2`
    expect(getAdminSessionFromCookieHeader(header)?.role).toBe('admin')
  })

  it('returns null when the session belongs to a non-admin user', () => {
    const value = createSessionCookieValue('user@twistfit.vn', 'user')
    const header = `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
    expect(getAdminSessionFromCookieHeader(header)).toBeNull()
  })

  it('returns null when the header is missing the cookie or is null', () => {
    expect(getAdminSessionFromCookieHeader('other=1')).toBeNull()
    expect(getAdminSessionFromCookieHeader(null)).toBeNull()
  })
})

describe('getSessionFromCookieHeader', () => {
  it('returns the session for a valid cookie regardless of role', () => {
    const value = createSessionCookieValue('user@twistfit.vn', 'user')
    const header = `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}`
    expect(getSessionFromCookieHeader(header)?.email).toBe('user@twistfit.vn')
    expect(getSessionFromCookieHeader(header)?.role).toBe('user')
  })

  it('returns null when the header is missing the cookie or is null', () => {
    expect(getSessionFromCookieHeader('other=1')).toBeNull()
    expect(getSessionFromCookieHeader(null)).toBeNull()
  })

  it('returns null for a tampered cookie', () => {
    const value = createSessionCookieValue('user@twistfit.vn', 'user')
    const tampered = value.slice(0, -1) + (value.at(-1) === 'a' ? 'b' : 'a')
    expect(getSessionFromCookieHeader(`${SESSION_COOKIE_NAME}=${encodeURIComponent(tampered)}`)).toBeNull()
  })
})
