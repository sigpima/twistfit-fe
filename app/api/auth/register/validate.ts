export type RegisterInput = {
  name: string
  email: string
  password: string
}

type RawRegisterBody = {
  name?: unknown
  email?: unknown
  password?: unknown
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validateRegisterBody(
  body: unknown
): { errors: Record<string, string> } | { data: RegisterInput } {
  const raw = (body ?? {}) as RawRegisterBody
  const errors: Record<string, string> = {}

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) errors.name = 'Họ tên không được để trống'

  const email = typeof raw.email === 'string' ? raw.email.trim() : ''
  if (!email || !isValidEmail(email)) errors.email = 'Email không hợp lệ'

  const password = typeof raw.password === 'string' ? raw.password : ''
  if (password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { name, email, password } }
}
