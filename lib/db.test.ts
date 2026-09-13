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
  createQuizQuestion,
  getQuizQuestions,
  getQuizQuestionById,
  updateQuizQuestion,
  deleteQuizQuestion,
  seedIfEmpty,
  type BlogPostInput,
  type QuizQuestionInput,
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

const sampleQuestion: QuizQuestionInput = {
  questionText: 'Tĩnh mạch ở cổ tay bạn có màu gì khi nhìn dưới ánh sáng tự nhiên?',
  sortOrder: 0,
  options: [
    { label: 'Xanh lá hoặc xanh ô liu', season: 'autumn' },
    { label: 'Xanh dương hoặc tím', season: 'winter' },
    { label: 'Xanh dương nhạt, khó phân biệt', season: 'summer' },
    { label: 'Xanh lá nhạt, ánh vàng', season: 'spring' },
  ],
}

describe('Quiz CRUD', () => {
  it('creates a question with its options in order', () => {
    const created = createQuizQuestion(db, sampleQuestion)
    expect(created.options).toHaveLength(4)
    expect(created.options[0]).toMatchObject({ label: 'Xanh lá hoặc xanh ô liu', season: 'autumn' })
  })

  it('lists questions ordered by sortOrder', () => {
    createQuizQuestion(db, { ...sampleQuestion, questionText: 'Câu 2', sortOrder: 1 })
    createQuizQuestion(db, { ...sampleQuestion, questionText: 'Câu 1', sortOrder: 0 })
    const questions = getQuizQuestions(db)
    expect(questions.map((q) => q.questionText)).toEqual(['Câu 1', 'Câu 2'])
  })

  it('replaces all options on update', () => {
    const created = createQuizQuestion(db, sampleQuestion)
    const updated = updateQuizQuestion(db, created.id, {
      ...sampleQuestion,
      options: [
        { label: 'Lựa chọn mới A', season: 'spring' },
        { label: 'Lựa chọn mới B', season: 'summer' },
      ],
    })
    expect(updated?.options).toHaveLength(2)
    expect(updated?.options.map((o) => o.label)).toEqual(['Lựa chọn mới A', 'Lựa chọn mới B'])
  })

  it('deletes a question and cascades its options', () => {
    const created = createQuizQuestion(db, sampleQuestion)
    expect(deleteQuizQuestion(db, created.id)).toBe(true)
    expect(getQuizQuestionById(db, created.id)).toBeNull()
    const remainingOptions = db.prepare('SELECT COUNT(*) AS count FROM quiz_options').get() as {
      count: number
    }
    expect(remainingOptions.count).toBe(0)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 7 blog posts and 5 quiz questions into an empty database', () => {
    seedIfEmpty(db)
    expect(getBlogPosts(db)).toHaveLength(7)
    expect(getQuizQuestions(db)).toHaveLength(5)
  })

  it('does nothing if blog_posts already has rows', () => {
    createBlogPost(db, samplePost)
    seedIfEmpty(db)
    expect(getBlogPosts(db)).toHaveLength(1)
  })
})
