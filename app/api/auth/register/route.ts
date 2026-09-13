import { NextResponse } from 'next/server'
import { createUser, isEmailTaken } from '@/lib/auth/users'
import { getDb } from '@/lib/getDb'
import { validateRegisterBody } from './validate'

export async function POST(request: Request) {
  const db = getDb()
  const body = await request.json().catch(() => null)
  const result = validateRegisterBody(body)
  if ('errors' in result) {
    return NextResponse.json({ errors: result.errors }, { status: 400 })
  }

  if (isEmailTaken(db, result.data.email)) {
    return NextResponse.json({ error: 'EMAIL_TAKEN' }, { status: 409 })
  }

  const user = createUser(db, result.data)
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 })
}
