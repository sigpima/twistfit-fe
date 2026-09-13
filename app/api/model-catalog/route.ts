import { NextResponse } from 'next/server'
import { getModels, createModel } from '@/lib/modelCatalog'
import { getDb } from '@/lib/getDb'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateModelBody } from './validate'

export async function GET() {
  const db = getDb()
  return NextResponse.json(getModels(db))
}

export async function POST(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateModelBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createModel(db, result.data)
  return NextResponse.json(created, { status: 201 })
}
