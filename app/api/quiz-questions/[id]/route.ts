import { NextResponse } from 'next/server'
import { getDb, getQuizQuestionById, updateQuizQuestion, deleteQuizQuestion } from '@/lib/db'
import { getAdminSessionFromCookieHeader } from '@/lib/auth/session'
import { validateQuizQuestionBody } from '../validate'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const question = getQuizQuestionById(getDb(), Number(id))
  if (!question) {
    return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 })
  }
  return NextResponse.json(question)
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const result = validateQuizQuestionBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  const updated = updateQuizQuestion(getDb(), Number(id), result.data)
  if (!updated) {
    return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = getAdminSessionFromCookieHeader(request.headers.get('cookie'))
  if (!session) {
    return NextResponse.json({ error: 'Yêu cầu quyền quản trị' }, { status: 401 })
  }

  const { id } = await params
  const deleted = deleteQuizQuestion(getDb(), Number(id))
  if (!deleted) {
    return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 })
  }
  return new NextResponse(null, { status: 204 })
}
