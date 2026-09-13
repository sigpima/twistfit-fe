import { NextResponse } from 'next/server'
import { findMockAccount } from '@/lib/auth/mockAccounts'
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null
  const email = body?.email
  const password = body?.password

  if (!email || !password) {
    return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 })
  }

  const account = findMockAccount(email, password)
  if (!account) {
    return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 })
  }

  const response = NextResponse.json({ email: account.email, role: account.role })
  response.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(account.email, account.role), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return response
}
