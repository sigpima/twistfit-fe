import { NextResponse } from 'next/server'
import { verifyUserCredentials } from '@/lib/auth/users'
import { getDb } from '@/lib/getDb'
import { createSessionCookieValue, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null
  const email = body?.email
  const password = body?.password

  if (!email || !password) {
    return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 })
  }

  const user = verifyUserCredentials(getDb(), email, password)
  if (!user) {
    return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401 })
  }

  const response = NextResponse.json({ name: user.name, email: user.email, role: user.role })
  response.cookies.set(SESSION_COOKIE_NAME, createSessionCookieValue(user.email, user.role), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return response
}
