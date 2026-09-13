import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { resolveForumReport } from '@/lib/forum'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const resolved = resolveForumReport(getDb(), Number(id))
  if (!resolved) {
    return NextResponse.json({ error: 'Không tìm thấy báo cáo' }, { status: 404 })
  }
  return NextResponse.json(resolved)
}
