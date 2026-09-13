import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema as initBlogSchema, createBlogPost } from './db'
import { initSchema as initForumSchema, createForumPost } from './forum'
import { initSchema as initUsersSchema, createUser } from './auth/users'
import { initSchema as initQuizAttemptsSchema, createQuizAttempt } from './quizAttempts'
import { initSchema as initContactSchema, createContactMessage } from './contact'
import { getAdminStats } from './stats'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initBlogSchema(db)
  initUsersSchema(db)
  initForumSchema(db)
  initQuizAttemptsSchema(db)
  initContactSchema(db)
})

afterEach(() => {
  db.close()
})

describe('getAdminStats', () => {
  it('returns zeroed counts for an empty database', () => {
    expect(getAdminStats(db)).toEqual({
      blogPosts: { total: 0, new30d: 0 },
      forumPosts: { total: 0, new30d: 0 },
      users: { total: 0, new30d: 0 },
      quizAttempts: { total: 0, new30d: 0 },
      contactMessages: { total: 0, unread: 0 },
    })
  })

  it('counts totals across every table', () => {
    createBlogPost(db, {
      slug: 'test',
      title: 'Test',
      excerpt: 'Test',
      content: 'Test',
      coverImageUrl: '/x.jpg',
      category: 'community',
      authorName: null,
      isFeatured: false,
      publishedAt: '2026-01-01',
    })
    const author = createUser(db, { name: 'Author', email: 'author@twistfit.vn', password: 'password123' })
    createForumPost(db, author.id, { title: 'Bài test', body: 'B', category: 'general' })
    createQuizAttempt(db, 'summer', null)
    createContactMessage(db, {
      name: 'Khách',
      email: 'khach@twistfit.vn',
      phone: null,
      subject: 'other',
      message: 'Xin chào',
    })

    const stats = getAdminStats(db)
    expect(stats.blogPosts.total).toBe(1)
    expect(stats.forumPosts.total).toBe(1)
    expect(stats.users.total).toBe(1)
    expect(stats.quizAttempts.total).toBe(1)
    expect(stats.contactMessages.total).toBe(1)
  })

  it('excludes records older than 30 days from new30d counts', () => {
    const author = createUser(db, { name: 'Author', email: 'author@twistfit.vn', password: 'password123' })
    const oldPost = createForumPost(db, author.id, { title: 'Bài cũ', body: 'B', category: 'general' })
    db.prepare('UPDATE forum_posts SET created_at = ? WHERE id = ?').run('2020-01-01T00:00:00.000Z', oldPost.id)
    createForumPost(db, author.id, { title: 'Bài mới', body: 'B', category: 'general' })

    const stats = getAdminStats(db)
    expect(stats.forumPosts.total).toBe(2)
    expect(stats.forumPosts.new30d).toBe(1)
  })

  it('counts only unread contact messages for the unread figure, not the total', () => {
    const message = createContactMessage(db, {
      name: 'Khách',
      email: 'khach@twistfit.vn',
      phone: null,
      subject: 'other',
      message: 'Xin chào',
    })
    db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(message.id)
    createContactMessage(db, {
      name: 'Khách 2',
      email: 'khach2@twistfit.vn',
      phone: null,
      subject: 'other',
      message: 'Xin chào 2',
    })

    const stats = getAdminStats(db)
    expect(stats.contactMessages.total).toBe(2)
    expect(stats.contactMessages.unread).toBe(1)
  })
})
