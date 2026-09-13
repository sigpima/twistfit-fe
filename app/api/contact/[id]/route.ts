import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { setContactMessageRead, deleteContactMessage } from '@/lib/contact'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as { isRead?: unknown } | null
  const isRead = body?.isRead === true

  const updated = setContactMessageRead(getDb(), Number(id), isRead)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy tin nhắn' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteContactMessage(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy tin nhắn' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
