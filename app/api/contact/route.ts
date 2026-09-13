import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getContactMessages, createContactMessage } from '@/lib/contact'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateContactMessageBody } from './validate'

export async function GET(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }
  return NextResponse.json(getContactMessages(getDb()))
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const result = validateContactMessageBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createContactMessage(getDb(), result.data)
  return NextResponse.json(created, { status: 201 })
}
