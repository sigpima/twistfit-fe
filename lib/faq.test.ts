import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createFaqItem,
  getFaqItems,
  getFaqItemById,
  updateFaqItem,
  deleteFaqItem,
  seedIfEmpty,
  type FaqItemInput,
} from './faq'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleItem: FaqItemInput = {
  categories: ['personal-color'],
  question: 'Câu hỏi mẫu?',
  answerMarkdown: 'Đây là **câu trả lời** mẫu.',
  highlightIcon: 'palette',
  highlightText: 'Ghi chú nổi bật.',
}

describe('FAQ CRUD', () => {
  it('creates and reads back an item', () => {
    const created = createFaqItem(db, sampleItem)
    expect(created.id).toBeGreaterThan(0)
    expect(created.categories).toEqual(['personal-color'])
    expect(created.answerMarkdown).toBe('Đây là **câu trả lời** mẫu.')
    expect(created.highlightIcon).toBe('palette')
  })

  it('lists items in creation order', () => {
    createFaqItem(db, { ...sampleItem, question: 'Câu 1' })
    createFaqItem(db, { ...sampleItem, question: 'Câu 2' })
    const items = getFaqItems(db)
    expect(items.map((i) => i.question)).toEqual(['Câu 1', 'Câu 2'])
  })

  it('supports multiple categories per item', () => {
    const created = createFaqItem(db, { ...sampleItem, categories: ['personal-color', 'account'] })
    expect(getFaqItemById(db, created.id)?.categories).toEqual(['personal-color', 'account'])
  })

  it('allows a null highlight', () => {
    const created = createFaqItem(db, { ...sampleItem, highlightIcon: null, highlightText: null })
    expect(created.highlightIcon).toBeNull()
    expect(created.highlightText).toBeNull()
  })

  it('updates an item', () => {
    const created = createFaqItem(db, sampleItem)
    const updated = updateFaqItem(db, created.id, { ...sampleItem, question: 'Câu hỏi đã sửa' })
    expect(updated?.question).toBe('Câu hỏi đã sửa')
    expect(updateFaqItem(db, 999999, sampleItem)).toBeNull()
  })

  it('deletes an item', () => {
    const created = createFaqItem(db, sampleItem)
    expect(deleteFaqItem(db, created.id)).toBe(true)
    expect(getFaqItemById(db, created.id)).toBeNull()
    expect(deleteFaqItem(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 6 FAQ items into an empty database', () => {
    seedIfEmpty(db)
    expect(getFaqItems(db)).toHaveLength(6)
  })

  it('does nothing if faq_items already has rows', () => {
    createFaqItem(db, sampleItem)
    seedIfEmpty(db)
    expect(getFaqItems(db)).toHaveLength(1)
  })
})
