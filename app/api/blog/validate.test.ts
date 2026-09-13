import { describe, expect, it, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema, createBlogPost } from '@/lib/db'
import { validateBlogPostBody } from './validate'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

const validBody = {
  title: 'Bài viết test',
  excerpt: 'Mô tả ngắn',
  content: 'Nội dung đầy đủ',
  coverImageUrl: '/blog/test.jpg',
  category: 'styling',
  authorName: null,
  isFeatured: false,
  publishedAt: '2026-01-01',
}

describe('validateBlogPostBody', () => {
  it('accepts a valid body and auto-generates the slug from the title', () => {
    const result = validateBlogPostBody(validBody, db)
    expect('data' in result).toBe(true)
    if ('data' in result) {
      expect(result.data.slug).toBe('bai-viet-test')
    }
  })

  it('uses an explicit slug when provided', () => {
    const result = validateBlogPostBody({ ...validBody, slug: 'duong-dan-tuy-chinh' }, db)
    expect('data' in result && result.data.slug).toBe('duong-dan-tuy-chinh')
  })

  it('collects field errors for missing required fields and an invalid category', () => {
    const result = validateBlogPostBody({ ...validBody, title: '', category: 'not-a-category' }, db)
    expect('errors' in result).toBe(true)
    if ('errors' in result) {
      expect(result.errors.title).toBeDefined()
      expect(result.errors.category).toBeDefined()
    }
  })

  it('rejects a slug already used by another post', () => {
    createBlogPost(db, { ...validBody, slug: 'bai-viet-test', category: 'styling' })
    const result = validateBlogPostBody(validBody, db)
    expect('errors' in result && result.errors.slug).toBeDefined()
  })

  it('allows keeping the same slug when editing that same post', () => {
    const existing = createBlogPost(db, { ...validBody, slug: 'bai-viet-test', category: 'styling' })
    const result = validateBlogPostBody(validBody, db, existing.id)
    expect('data' in result).toBe(true)
  })
})
