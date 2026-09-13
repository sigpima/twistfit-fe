import type Database from 'better-sqlite3'
import { BLOG_CATEGORIES, isBlogSlugTaken, type BlogCategory, type BlogPostInput } from '@/lib/db'
import { slugify } from '@/lib/slugify'

type RawBlogPostBody = {
  slug?: unknown
  title?: unknown
  excerpt?: unknown
  content?: unknown
  coverImageUrl?: unknown
  category?: unknown
  authorName?: unknown
  isFeatured?: unknown
  publishedAt?: unknown
}

export function validateBlogPostBody(
  body: unknown,
  db: Database.Database,
  excludeId?: number
): { errors: Record<string, string> } | { data: BlogPostInput } {
  const raw = (body ?? {}) as RawBlogPostBody
  const errors: Record<string, string> = {}

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) errors.title = 'Tiêu đề không được để trống'

  const excerpt = typeof raw.excerpt === 'string' ? raw.excerpt.trim() : ''
  if (!excerpt) errors.excerpt = 'Mô tả ngắn không được để trống'

  const content = typeof raw.content === 'string' ? raw.content.trim() : ''
  if (!content) errors.content = 'Nội dung không được để trống'

  const coverImageUrl = typeof raw.coverImageUrl === 'string' ? raw.coverImageUrl.trim() : ''
  if (!coverImageUrl) errors.coverImageUrl = 'Ảnh bìa không được để trống'

  const category = raw.category as BlogCategory
  if (!BLOG_CATEGORIES.includes(category)) errors.category = 'Chuyên mục không hợp lệ'

  const publishedAt = typeof raw.publishedAt === 'string' ? raw.publishedAt.trim() : ''
  if (!publishedAt) errors.publishedAt = 'Ngày đăng không được để trống'

  const requestedSlug = typeof raw.slug === 'string' ? raw.slug.trim() : ''
  const slug = slugify(requestedSlug || title)
  if (!slug) {
    errors.slug = 'Không thể tạo đường dẫn (slug) từ tiêu đề'
  } else if (isBlogSlugTaken(db, slug, excludeId)) {
    errors.slug = 'Đường dẫn (slug) này đã được dùng cho bài viết khác'
  }

  const authorName =
    typeof raw.authorName === 'string' && raw.authorName.trim() ? raw.authorName.trim() : null
  const isFeatured = raw.isFeatured === true

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  return {
    data: { slug, title, excerpt, content, coverImageUrl, category, authorName, isFeatured, publishedAt },
  }
}
