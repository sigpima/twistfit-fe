import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { createQuizAttempt } from '@/lib/quizAttempts'
import { SEASONS, type Season } from '@/lib/db'
import { getSessionFromCookieHeader } from '@/lib/auth/session'
import { getUserByEmail } from '@/lib/auth/users'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { season?: unknown } | null
  const season = body?.season as Season
  if (!SEASONS.includes(season)) {
    return NextResponse.json({ error: 'Kết quả mùa không hợp lệ' }, { status: 400 })
  }

  const db = getDb()
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  const user = session ? getUserByEmail(db, session.email) : null

  const created = createQuizAttempt(db, season, user?.id ?? null)
  return NextResponse.json(created, { status: 201 })
}
