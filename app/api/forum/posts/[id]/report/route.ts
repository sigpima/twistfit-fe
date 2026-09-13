import { NextResponse } from 'next/server'
import { getForumPostById, createForumReport, canViewForumPost } from '@/lib/forum'
import { getDb } from '@/lib/getDb'
import { getUserByEmail } from '@/lib/auth/users'
import { getSessionFromCookieHeader } from '@/lib/auth/session'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const reporter = getUserByEmail(db, session.email)
  if (!reporter) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const { id } = await params
  const post = getForumPostById(db, Number(id))
  if (!post || !canViewForumPost(post, reporter.id, session.role)) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const body = (await request.json().catch(() => null)) as { reason?: unknown } | null
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  if (!reason) {
    return NextResponse.json({ error: 'Vui lòng nhập lý do báo cáo' }, { status: 400 })
  }

  const report = createForumReport(db, post.id, reporter.id, reason)
  return NextResponse.json(report, { status: 201 })
}
