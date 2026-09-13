import { NextResponse } from 'next/server'
import { getTeamMembers, createTeamMember } from '@/lib/team'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateTeamMemberBody } from './validate'

export async function GET() {
  const db = getDb()
  return NextResponse.json(getTeamMembers(db))
}

export async function POST(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateTeamMemberBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createTeamMember(db, result.data)
  return NextResponse.json(created, { status: 201 })
}
