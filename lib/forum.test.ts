import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import { initSchema as initUsersSchema, createUser } from './auth/users'
import {
  initSchema,
  createForumPost,
  getPublishedForumPosts,
  getForumPostsByAuthorId,
  getForumPostById,
  updateForumPost,
  deleteForumPost,
  seedIfEmpty,
  type ForumPostInput,
} from './forum'

let db: Database.Database
let authorId: number

beforeEach(() => {
  db = new Database(':memory:')
  initUsersSchema(db)
  initSchema(db)
  authorId = createUser(db, { name: 'Tác giả Test', email: 'author@twistfit.vn', password: 'password123' }).id
})

afterEach(() => {
  db.close()
})

const sampleInput: ForumPostInput = {
  title: 'Bài viết test',
  body: 'Nội dung test',
  category: 'general',
}

describe('createForumPost', () => {
  it('creates a post with status "pending" attributed to the given author', () => {
    const created = createForumPost(db, authorId, sampleInput)
    expect(created.id).toBeGreaterThan(0)
    expect(created.status).toBe('pending')
    expect(created.authorId).toBe(authorId)
    expect(created.title).toBe('Bài viết test')
  })
})

describe('getPublishedForumPosts', () => {
  it('excludes pending posts', () => {
    createForumPost(db, authorId, sampleInput)
    expect(getPublishedForumPosts(db)).toHaveLength(0)
  })

  it('returns only published posts, newest first, optionally filtered by category', () => {
    const post1 = createForumPost(db, authorId, { ...sampleInput, category: 'general' })
    const post2 = createForumPost(db, authorId, { ...sampleInput, category: 'styling-help' })
    db.prepare("UPDATE forum_posts SET status = 'published' WHERE id IN (?, ?)").run(post1.id, post2.id)

    expect(getPublishedForumPosts(db).map((p) => p.id)).toEqual([post2.id, post1.id])
    expect(getPublishedForumPosts(db, 'styling-help').map((p) => p.id)).toEqual([post2.id])
  })
})

describe('getForumPostsByAuthorId', () => {
  it("returns only that author's posts, newest first, regardless of status", () => {
    const otherAuthorId = createUser(db, { name: 'Khác', email: 'other@twistfit.vn', password: 'password123' }).id
    const mine1 = createForumPost(db, authorId, sampleInput)
    createForumPost(db, otherAuthorId, sampleInput)
    const mine2 = createForumPost(db, authorId, sampleInput)

    expect(getForumPostsByAuthorId(db, authorId).map((p) => p.id)).toEqual([mine2.id, mine1.id])
  })
})

describe('updateForumPost', () => {
  it('updates fields and resets status to "pending" even if it was published', () => {
    const created = createForumPost(db, authorId, sampleInput)
    db.prepare("UPDATE forum_posts SET status = 'published' WHERE id = ?").run(created.id)

    const updated = updateForumPost(db, created.id, { ...sampleInput, title: 'Đã sửa' })
    expect(updated?.title).toBe('Đã sửa')
    expect(updated?.status).toBe('pending')
  })

  it('returns null for a post that does not exist', () => {
    expect(updateForumPost(db, 999999, sampleInput)).toBeNull()
  })
})

describe('deleteForumPost', () => {
  it('deletes a post', () => {
    const created = createForumPost(db, authorId, sampleInput)
    expect(deleteForumPost(db, created.id)).toBe(true)
    expect(getForumPostById(db, created.id)).toBeNull()
    expect(deleteForumPost(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('does nothing — forum content is never auto-seeded', () => {
    seedIfEmpty(db)
    expect(getPublishedForumPosts(db)).toHaveLength(0)
    expect(getForumPostsByAuthorId(db, authorId)).toHaveLength(0)
  })
})
