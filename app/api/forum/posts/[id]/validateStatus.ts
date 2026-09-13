import type { ForumPostStatus } from '@/lib/forum'

const ALLOWED_TRANSITIONS: Record<ForumPostStatus, ForumPostStatus[]> = {
  pending: ['published', 'rejected'],
  published: ['hidden'],
  rejected: [],
  hidden: [],
}

type RawStatusBody = { status?: unknown }

export function validateStatusChangeBody(
  body: unknown,
  currentStatus: ForumPostStatus
): { error: string } | { data: { status: ForumPostStatus } } {
  const raw = (body ?? {}) as RawStatusBody
  const status = raw.status as ForumPostStatus
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []
  if (!allowed.includes(status)) {
    return { error: 'Chuyển trạng thái không hợp lệ' }
  }
  return { data: { status } }
}
