import { NextResponse } from 'next/server'
import { getTeamMemberById, updateTeamMember, deleteTeamMember } from '@/lib/team'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateTeamMemberBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const member = getTeamMemberById(getDb(), Number(id))
  if (!member) {
    return NextResponse.json({ error: 'Không tìm thấy thành viên' }, { status: 404 })
  }
  return NextResponse.json(member)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = validateTeamMemberBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateTeamMember(getDb(), Number(id), result.data)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy thành viên' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteTeamMember(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy thành viên' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
