import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getForumPostsByAuthorId } from '@/lib/forum'
import { getUserByEmail } from '@/lib/auth/users'
import { getSessionFromCookieHeader } from '@/lib/auth/session'

export async function GET(request: Request) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const viewer = getUserByEmail(db, session.email)
  if (!viewer) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  return NextResponse.json(getForumPostsByAuthorId(db, viewer.id))
}
