import { NextResponse } from 'next/server'
import {
  getForumPostById,
  updateForumPost,
  deleteForumPost,
  setForumPostStatus,
  canViewForumPost,
} from '@/lib/forum'
import { getDb } from '@/lib/getDb'
import { getUserByEmail } from '@/lib/auth/users'
import { getSessionFromCookieHeader, getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateForumPostBody } from '../validate'
import { validateStatusChangeBody } from './validateStatus'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params
  const db = getDb()
  const post = getForumPostById(db, Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  const viewer = session ? getUserByEmail(db, session.email) : null
  if (!canViewForumPost(post, viewer?.id ?? null, session?.role ?? null)) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }
  return NextResponse.json(post)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const { id } = await params
  const post = getForumPostById(db, Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const viewer = getUserByEmail(db, session.email)
  if (!viewer || viewer.id !== post.authorId) {
    return NextResponse.json({ error: 'Bạn không có quyền sửa bài này' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const result = validateForumPostBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateForumPost(db, post.id, result.data)
  return NextResponse.json(updated)
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const db = getDb()
  const { id } = await params
  const post = getForumPostById(db, Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const result = validateStatusChangeBody(body, post.status)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const updated = setForumPostStatus(db, post.id, result.data.status)
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const { id } = await params
  const post = getForumPostById(db, Number(id))
  if (!post) {
    return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 })
  }

  const viewer = getUserByEmail(db, session.email)
  const isOwner = viewer?.id === post.authorId
  if (!isOwner && session.role !== 'admin') {
    return NextResponse.json({ error: 'Bạn không có quyền xóa bài này' }, { status: 403 })
  }

  deleteForumPost(db, post.id)
  return new NextResponse(null, { status: 204 })
}
