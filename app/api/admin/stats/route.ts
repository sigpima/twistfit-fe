import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getAdminStats } from '@/lib/stats'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'

export async function GET(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }
  return NextResponse.json(getAdminStats(getDb()))
}
