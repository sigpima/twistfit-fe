import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Role } from '@/lib/auth/mockAccounts'

export const SESSION_COOKIE_NAME = 'twistfit_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000

const SECRET = process.env.AUTH_COOKIE_SECRET ?? 'dev-only-insecure-secret'

export type SessionPayload = {
  email: string
  role: Role
  exp: number
}

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('base64url')
}

export function signPayload(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${sign(encoded)}`
}

export function createSessionCookieValue(email: string, role: Role): string {
  return signPayload({ email, role, exp: Date.now() + SESSION_TTL_MS })
}

export function verifySessionCookieValue(value: string | undefined | null): SessionPayload | null {
  if (!value) return null
  const [encoded, signature] = value.split('.')
  if (!encoded || !signature) return null

  const expectedSignature = sign(encoded)
  const actual = Buffer.from(signature)
  const expected = Buffer.from(expectedSignature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null
  }

  let payload: SessionPayload
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload
  } catch {
    return null
  }

  if (payload.exp < Date.now()) return null
  return payload
}

export function getAdminSessionFromCookieHeader(cookieHeader: string | null): SessionPayload | null {
  if (!cookieHeader) return null

  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
  if (!match) return null

  const rawValue = match.slice(SESSION_COOKIE_NAME.length + 1)
  const session = verifySessionCookieValue(decodeURIComponent(rawValue))
  if (!session || session.role !== 'admin') return null
  return session
}
