import { NextResponse } from 'next/server'
import { getDb, getBlogPosts, createBlogPost } from '@/lib/db'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateBlogPostBody } from './validate'

export async function GET() {
  const db = getDb()
  return NextResponse.json(getBlogPosts(db))
}

export async function POST(request: Request) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateBlogPostBody(body, db)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createBlogPost(db, result.data)
  return NextResponse.json(created, { status: 201 })
}
