import { FORUM_CATEGORIES, type ForumCategory, type ForumPostInput } from '@/lib/forum'

type RawForumPostBody = {
  title?: unknown
  body?: unknown
  category?: unknown
}

export function validateForumPostBody(
  body: unknown
): { errors: Record<string, string> } | { data: ForumPostInput } {
  const raw = (body ?? {}) as RawForumPostBody
  const errors: Record<string, string> = {}

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) errors.title = 'Tiêu đề không được để trống'

  const bodyText = typeof raw.body === 'string' ? raw.body.trim() : ''
  if (!bodyText) errors.body = 'Nội dung không được để trống'

  const category = raw.category as ForumCategory
  if (!FORUM_CATEGORIES.includes(category)) errors.category = 'Chuyên mục không hợp lệ'

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return { data: { title, body: bodyText, category } }
}
