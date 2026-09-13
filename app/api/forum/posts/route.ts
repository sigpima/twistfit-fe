import { NextResponse } from 'next/server'
import { getDb } from '@/lib/getDb'
import { getPublishedForumPosts, createForumPost, FORUM_CATEGORIES, type ForumCategory } from '@/lib/forum'
import { getUserByEmail } from '@/lib/auth/users'
import { getSessionFromCookieHeader } from '@/lib/auth/session'
import { validateForumPostBody } from './validate'

export async function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const categoryParam = searchParams.get('category')
  const category = (FORUM_CATEGORIES as string[]).includes(categoryParam ?? '')
    ? (categoryParam as ForumCategory)
    : undefined
  return NextResponse.json(getPublishedForumPosts(db, category))
}

export async function POST(request: Request) {
  const session = getSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const db = getDb()
  const author = getUserByEmail(db, session.email)
  if (!author) {
    return NextResponse.json({ error: 'Yêu cầu đăng nhập' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const result = validateForumPostBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const created = createForumPost(db, author.id, result.data)
  return NextResponse.json(created, { status: 201 })
}
