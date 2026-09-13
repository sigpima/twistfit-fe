import { CONTACT_SUBJECTS, type ContactSubject, type ContactMessageInput } from '@/lib/contact'

type RawContactBody = {
  name?: unknown
  email?: unknown
  phone?: unknown
  subject?: unknown
  message?: unknown
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validateContactMessageBody(
  body: unknown
): { errors: Record<string, string> } | { data: ContactMessageInput } {
  const raw = (body ?? {}) as RawContactBody
  const errors: Record<string, string> = {}

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) errors.name = 'Họ tên không được để trống'

  const email = typeof raw.email === 'string' ? raw.email.trim() : ''
  if (!email || !isValidEmail(email)) errors.email = 'Email không hợp lệ'

  const phone = typeof raw.phone === 'string' && raw.phone.trim() ? raw.phone.trim() : null

  const subject = raw.subject as ContactSubject
  if (!CONTACT_SUBJECTS.includes(subject)) errors.subject = 'Chủ đề không hợp lệ'

  const message = typeof raw.message === 'string' ? raw.message.trim() : ''
  if (!message) errors.message = 'Nội dung không được để trống'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { name, email, phone, subject, message } }
}
