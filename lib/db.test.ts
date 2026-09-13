import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createBlogPost,
  getBlogPosts,
  getBlogPostBySlug,
  getBlogPostById,
  updateBlogPost,
  deleteBlogPost,
  isBlogSlugTaken,
  type BlogPostInput,
} from './db'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const samplePost: BlogPostInput = {
  slug: 'mua-dong-2026',
  title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
  excerpt: 'Khám phá sức hút mãnh liệt của sự tương phản cao.',
  content: 'Nội dung đầy đủ của bài viết về Mùa Đông.',
  coverImageUrl: '/blog/featured-winter-outfit.jpg',
  category: 'personal-color',
  authorName: 'Stylist Mai Anh',
  isFeatured: true,
  publishedAt: '2026-06-18',
}

describe('Blog CRUD', () => {
  it('creates and reads back a post', () => {
    const created = createBlogPost(db, samplePost)
    expect(created.id).toBeGreaterThan(0)
    expect(created.slug).toBe('mua-dong-2026')
    expect(created.isFeatured).toBe(true)
    expect(created.authorName).toBe('Stylist Mai Anh')
  })

  it('lists posts ordered by publishedAt descending', () => {
    createBlogPost(db, { ...samplePost, slug: 'older', publishedAt: '2026-01-01' })
    createBlogPost(db, { ...samplePost, slug: 'newer', publishedAt: '2026-06-01' })
    const posts = getBlogPosts(db)
    expect(posts.map((p) => p.slug)).toEqual(['newer', 'older'])
  })

  it('finds a post by slug', () => {
    createBlogPost(db, samplePost)
    expect(getBlogPostBySlug(db, 'mua-dong-2026')?.title).toBe(samplePost.title)
    expect(getBlogPostBySlug(db, 'khong-ton-tai')).toBeNull()
  })

  it('updates a post', () => {
    const created = createBlogPost(db, samplePost)
    const updated = updateBlogPost(db, created.id, { ...samplePost, title: 'Tiêu đề mới' })
    expect(updated?.title).toBe('Tiêu đề mới')
    expect(updateBlogPost(db, 999999, samplePost)).toBeNull()
  })

  it('deletes a post', () => {
    const created = createBlogPost(db, samplePost)
    expect(deleteBlogPost(db, created.id)).toBe(true)
    expect(getBlogPostById(db, created.id)).toBeNull()
    expect(deleteBlogPost(db, created.id)).toBe(false)
  })

  it('detects a taken slug, excluding the post itself when editing', () => {
    const created = createBlogPost(db, samplePost)
    expect(isBlogSlugTaken(db, 'mua-dong-2026')).toBe(true)
    expect(isBlogSlugTaken(db, 'mua-dong-2026', created.id)).toBe(false)
    expect(isBlogSlugTaken(db, 'khong-ton-tai')).toBe(false)
  })
})
