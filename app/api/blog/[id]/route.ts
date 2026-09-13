import { NextResponse } from 'next/server'
import { getDb, getBlogPostById, updateBlogPost, deleteBlogPost } from '@/lib/db'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateBlogPostBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const post = getBlogPostById(getDb(), Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }
  return NextResponse.json(post)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateBlogPostBody(body, db, Number(id))
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateBlogPost(db, Number(id), result.data)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteBlogPost(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
